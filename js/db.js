// Almacenamiento local cifrado: IndexedDB + AES-GCM 256 con clave derivada del PIN (PBKDF2).
// Nada sale del dispositivo. Sin el PIN los datos no se pueden leer.

const DB_NAME = 'segins';
const DB_VER = 1;
export const STORES = ['meta', 'inst', 'eval', 'agenda', 'config', 'fotos'];
const DATA_STORES = STORES.filter(s => s !== 'meta');
const CHECK = 'SEGINS-OK';
const ITER = 310000;

const te = new TextEncoder();
const td = new TextDecoder();
let dbp = null;
let key = null;

function openDB() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = () => {
        for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}

async function req(store, mode, fn) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => res(r ? r.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

const rawGet = (s, id) => req(s, 'readonly', st => st.get(id));
const rawAll = (s) => req(s, 'readonly', st => st.getAll());
const rawPut = (s, o) => req(s, 'readwrite', st => st.put(o));
const rawDel = (s, id) => req(s, 'readwrite', st => st.delete(id));
const rawClear = (s) => req(s, 'readwrite', st => st.clear());

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptWith(k, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, bytes));
  return { iv, ct };
}

async function decryptWith(k, iv, ct) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, ct));
}

async function verify(k, auth) {
  try {
    return td.decode(await decryptWith(k, auth.iv, auth.ct)) === CHECK;
  } catch {
    return false;
  }
}

export const isUnlocked = () => key !== null;
export const lock = () => { key = null; };

export async function isSetup() {
  return !!(await rawGet('meta', 'auth'));
}

export async function setup(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  key = await deriveKey(pin, salt);
  const { iv, ct } = await encryptWith(key, te.encode(CHECK));
  await rawPut('meta', { id: 'auth', salt, iv, ct });
}

export async function unlock(pin) {
  const auth = await rawGet('meta', 'auth');
  const k = await deriveKey(pin, auth.salt);
  if (!(await verify(k, auth))) return false;
  key = k;
  return true;
}

// ---- Registros JSON cifrados ----

export async function put(store, obj) {
  const { iv, ct } = await encryptWith(key, te.encode(JSON.stringify(obj)));
  await rawPut(store, { id: obj.id, iv, ct });
}

export async function get(store, id) {
  const r = await rawGet(store, id);
  if (!r) return null;
  return JSON.parse(td.decode(await decryptWith(key, r.iv, r.ct)));
}

export async function all(store) {
  const rows = await rawAll(store);
  return Promise.all(rows.map(async r => JSON.parse(td.decode(await decryptWith(key, r.iv, r.ct)))));
}

export const del = (store, id) => rawDel(store, id);

// ---- Fotos cifradas (JPEG) ----

export async function putFoto(id, blob) {
  const { iv, ct } = await encryptWith(key, new Uint8Array(await blob.arrayBuffer()));
  await rawPut('fotos', { id, iv, ct });
}

export async function getFoto(id) {
  const r = await rawGet('fotos', id);
  if (!r) return null;
  return new Blob([await decryptWith(key, r.iv, r.ct)], { type: 'image/jpeg' });
}

export const delFoto = (id) => rawDel('fotos', id);

// ---- Cambio de PIN: se recifra todo con la clave nueva ----

export async function changePin(oldPin, newPin) {
  const auth = await rawGet('meta', 'auth');
  const oldKey = await deriveKey(oldPin, auth.salt);
  if (!(await verify(oldKey, auth))) return false;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const newKey = await deriveKey(newPin, salt);
  for (const s of DATA_STORES) {
    for (const r of await rawAll(s)) {
      const plain = await decryptWith(oldKey, r.iv, r.ct);
      const { iv, ct } = await encryptWith(newKey, plain);
      await rawPut(s, { id: r.id, iv, ct });
    }
  }
  const chk = await encryptWith(newKey, te.encode(CHECK));
  await rawPut('meta', { id: 'auth', salt, iv: chk.iv, ct: chk.ct });
  key = newKey;
  return true;
}

// ---- Copia de seguridad: los registros viajan tal cual, cifrados ----

const b64 = (u8) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function exportBackup() {
  const auth = await rawGet('meta', 'auth');
  const out = {
    formato: 'segins-backup', version: 1, fecha: new Date().toISOString(),
    auth: { salt: b64(auth.salt), iv: b64(auth.iv), ct: b64(auth.ct) },
    registros: [],
  };
  for (const s of DATA_STORES) {
    for (const r of await rawAll(s)) out.registros.push({ s, id: r.id, iv: b64(r.iv), ct: b64(r.ct) });
  }
  return new Blob([JSON.stringify(out)], { type: 'application/octet-stream' });
}

// Sustituye todos los datos por los de la copia. Requiere el PIN con el que se hizo la copia.
export async function importBackup(file, pin) {
  const data = JSON.parse(await file.text());
  if (data.formato !== 'segins-backup') throw new Error('El archivo no es una copia de seguridad de SEGINS.');
  const auth = { id: 'auth', salt: unb64(data.auth.salt), iv: unb64(data.auth.iv), ct: unb64(data.auth.ct) };
  const k = await deriveKey(pin, auth.salt);
  if (!(await verify(k, auth))) throw new Error('El PIN no corresponde a esta copia de seguridad.');
  for (const s of DATA_STORES) await rawClear(s);
  for (const r of data.registros) await rawPut(r.s, { id: r.id, iv: unb64(r.iv), ct: unb64(r.ct) });
  await rawPut('meta', auth);
  key = k;
}

export async function wipe() {
  for (const s of STORES) await rawClear(s);
  key = null;
}
