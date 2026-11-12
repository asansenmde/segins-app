// Tareas NLT: lectura de correos de Outlook arrastrados a la app (.msg de Outlook de escritorio y .eml de Outlook en la web,
// Thunderbird…). Todo se lee en el propio navegador: el correo no se envía a ningún sitio.
// Copiado (y pasado a módulo) del lector de Tareas Colabora / META (colabora/tareas-nlt-colabora.html, 10/11/2026).

const recortar = (s, n) => { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
// Texto sin formato de un HTML (DOMParser no ejecuta nada)
const texto = html => {
  if (!html) return '';
  const d = new DOMParser().parseFromString(String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d)>/gi, '\n'), 'text/html');
  return (d.body.textContent || '').replace(/​/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
};

const bytesTexto = (bytes, cs) => {
  try { return new TextDecoder(String(cs || 'utf-8').trim().replace(/^["']|["']$/g, '')).decode(bytes); } catch { return new TextDecoder('windows-1252').decode(bytes); }
};
const binario = s => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; };
const dePrintable = s => binario(s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))));
const deBase64 = s => { try { return binario(atob(s.replace(/[^A-Za-z0-9+/=]/g, ''))); } catch { return new Uint8Array(0); } };
// «=?utf-8?B?…?=» y «=?iso-8859-1?Q?…?=» en las cabeceras
const cabeceraMime = v => String(v || '').replace(/\?=\s+=\?/g, '?==?').replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi,
  (m, cs, enc, txt) => bytesTexto(enc.toUpperCase() === 'B' ? deBase64(txt) : dePrintable(txt.replace(/_/g, ' ')), cs)).trim();

function parteMime(bruto) {
  const corte = bruto.search(/\r?\n\r?\n/);
  const cab = corte < 0 ? bruto : bruto.slice(0, corte), cuerpo = corte < 0 ? '' : bruto.slice(corte).replace(/^\r?\n\r?\n/, '');
  const h = {};
  cab.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(l => { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim().toLowerCase(); if (!(k in h)) h[k] = l.slice(i + 1).trim(); } });
  const param = (v, n) => { const m = new RegExp(';\\s*' + n + '\\*?=\\s*(?:"([^"]*)"|([^;\\s]*))', 'i').exec(v || ''); return m ? (m[1] != null ? m[1] : m[2]) : ''; };
  return { h, cuerpo, tipo: (h['content-type'] || 'text/plain').split(';')[0].trim().toLowerCase(), param };
}

function leerEml(buf) {
  const bruto = new TextDecoder('latin1').decode(new Uint8Array(buf));
  const raiz = parteMime(bruto), adjuntos = [];
  let plano = '', html = '';
  const recorrer = (p, nivel) => {
    if (nivel > 8) return;
    if (/^multipart\//.test(p.tipo)) {
      const lim = p.param(p.h['content-type'], 'boundary');
      if (!lim) return;
      p.cuerpo.split('--' + lim).slice(1).forEach(trozo => { if (!/^--/.test(trozo)) recorrer(parteMime(trozo.replace(/^\r?\n/, '')), nivel + 1); });
      return;
    }
    const disp = p.h['content-disposition'] || '', nombre = cabeceraMime(p.param(disp, 'filename') || p.param(p.h['content-type'], 'name'));
    if (/^attachment/i.test(disp) || (nombre && !/^text\//.test(p.tipo))) { if (nombre) adjuntos.push(nombre); return; }
    if (p.tipo === 'message/rfc822') return;
    const enc = (p.h['content-transfer-encoding'] || '').toLowerCase();
    const bytes = enc === 'base64' ? deBase64(p.cuerpo) : enc === 'quoted-printable' ? dePrintable(p.cuerpo) : binario(p.cuerpo);
    const txt = bytesTexto(bytes, p.param(p.h['content-type'], 'charset') || 'utf-8');
    if (p.tipo === 'text/plain' && !plano) plano = txt;
    else if (p.tipo === 'text/html' && !html) html = txt;
  };
  recorrer(raiz, 0);
  const h = raiz.h;
  if (!h.subject && !h.from && !h.date) throw new Error('El archivo no parece un correo (.eml)');
  return { asunto: cabeceraMime(h.subject) || '(sin asunto)', de: cabeceraMime(h.from), para: recortar(cabeceraMime(h.to), 300),
    fecha: h.date && !isNaN(new Date(h.date)) ? new Date(h.date).toISOString() : '', id: (h['message-id'] || '').replace(/[<>\s]/g, ''),
    texto: (plano || texto(html.replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ''))).replace(/\r\n/g, '\n').trim(), adjuntos };
}

// Correo .msg de Outlook de escritorio: archivo compuesto de Microsoft (CFB) con una propiedad MAPI por flujo
function leerMsg(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  if (buf.byteLength < 512 || dv.getUint32(0, true) !== 0xE011CFD0 || dv.getUint32(4, true) !== 0xE11AB1A1) throw new Error('El archivo no parece un correo de Outlook (.msg)');
  const ss = 1 << dv.getUint16(30, true), ms = 1 << dv.getUint16(32, true), corteMini = dv.getUint32(56, true);
  const sector = n => (n + 1) * ss;
  const fatSect = [];
  for (let i = 0; i < 109; i++) { const x = dv.getUint32(76 + i * 4, true); if (x < 0xFFFFFFFA) fatSect.push(x); }
  for (let dif = dv.getUint32(68, true), vueltas = 0; dif < 0xFFFFFFFA && vueltas < 1000; vueltas++) {
    for (let j = 0; j < ss / 4 - 1; j++) { const y = dv.getUint32(sector(dif) + j * 4, true); if (y < 0xFFFFFFFA) fatSect.push(y); }
    dif = dv.getUint32(sector(dif) + ss - 4, true);
  }
  const fat = [];
  fatSect.forEach(s => { for (let k = 0; k < ss / 4; k++) fat.push(dv.getUint32(sector(s) + k * 4, true)); });
  const cadena = (ini, tabla) => { const r = []; let n = ini; while (n < 0xFFFFFFFA && r.length <= tabla.length) { r.push(n); n = tabla[n]; } return r; };
  const leerCadena = ini => { const cs = cadena(ini, fat), out = new Uint8Array(cs.length * ss); cs.forEach((s, k) => out.set(u8.subarray(sector(s), sector(s) + ss), k * ss)); return out; };
  const dir = leerCadena(dv.getUint32(48, true)), ddv = new DataView(dir.buffer), ents = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nl = ddv.getUint16(o + 64, true);
    ents.push({ nombre: nl > 2 ? new TextDecoder('utf-16le').decode(dir.subarray(o, o + nl - 2)) : '', tipo: dir[o + 66],
      izq: ddv.getUint32(o + 68, true), der: ddv.getUint32(o + 72, true), hijo: ddv.getUint32(o + 76, true), ini: ddv.getUint32(o + 116, true), tam: ddv.getUint32(o + 120, true) });
  }
  const raiz = ents[0], miniFat = [], mini = raiz && raiz.tam ? leerCadena(raiz.ini) : new Uint8Array(0);
  const mf = leerCadena(dv.getUint32(60, true)), mdv = new DataView(mf.buffer);
  if (dv.getUint32(64, true)) for (let q = 0; q + 4 <= mf.length; q += 4) miniFat.push(mdv.getUint32(q, true));
  const flujo = e => {
    if (e.tam >= corteMini) return leerCadena(e.ini).subarray(0, e.tam);
    const cs = cadena(e.ini, miniFat), out = new Uint8Array(cs.length * ms);
    cs.forEach((s, k) => out.set(mini.subarray(s * ms, s * ms + ms), k * ms));
    return out.subarray(0, e.tam);
  };
  const hijos = e => {
    const r = [], pila = [e.hijo], vistos = {};
    while (pila.length) { const n = pila.pop(); if (n >= ents.length || vistos[n]) continue; vistos[n] = 1; r.push(ents[n]); pila.push(ents[n].izq, ents[n].der); }
    return r;
  };
  const props = e => { const p = {}; hijos(e).forEach(h => { const m = /^__substg1\.0_([0-9A-F]{4})([0-9A-F]{4})$/i.exec(h.nombre); if (m && h.tipo === 2) p[m[1].toUpperCase()] = { tipo: m[2].toUpperCase(), e: h }; }); return p; };
  const p = props(raiz);
  const valor = (id, cp) => {
    const x = cp ? cp[id] : p[id];
    if (!x) return '';
    const b = flujo(x.e);
    return (x.tipo === '001F' ? new TextDecoder('utf-16le').decode(b) : x.tipo === '001E' ? new TextDecoder('windows-1252').decode(b) : bytesTexto(b, 'utf-8')).replace(/\0+$/, '');
  };
  let fecha = '';
  const pv = hijos(raiz).find(h => h.nombre === '__properties_version1.0');
  if (pv) {
    const pb = flujo(pv), pdv = new DataView(pb.buffer, pb.byteOffset, pb.byteLength);
    for (let z = 32; z + 16 <= pb.length; z += 16) {
      const tag = pdv.getUint32(z, true);
      if (tag === 0x0E060040 || (tag === 0x00390040 && !fecha)) {
        const ms100 = pdv.getUint32(z + 12, true) * 4294967296 + pdv.getUint32(z + 8, true);
        fecha = new Date(ms100 / 1e4 - 11644473600000).toISOString();
      }
    }
  }
  const adjuntos = hijos(raiz).filter(h => h.tipo === 1 && /^__attach_version1\.0_/.test(h.nombre))
    .map(a => { const ap = props(a); return valor('3707', ap) || valor('3704', ap) || valor('3001', ap); }).filter(Boolean);
  const de = valor('0C1A') || valor('0042'), dirDe = valor('5D01') || (/@/.test(valor('0C1F')) ? valor('0C1F') : '');
  const cuerpo = valor('1000') || texto(valor('1013').replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ''));
  if (!p['0037'] && !p['1000'] && !p['0C1A']) throw new Error('El archivo .msg no contiene un correo');
  return { asunto: valor('0037') || '(sin asunto)', de: de + (dirDe && dirDe !== de ? ' <' + dirDe + '>' : ''), para: recortar(valor('0E04'), 300),
    fecha, id: valor('1035').replace(/[<>\s]/g, ''), texto: cuerpo.replace(/\r\n/g, '\n').trim() || '(El texto del correo no se ha podido leer: está solo en formato enriquecido; ábrelo en Outlook.)', adjuntos };
}

// Devuelve { asunto, de, para, fecha (ISO), id, texto, adjuntos[] }
export async function leerCorreo(f) {
  if (f.size > 40 * 1024 * 1024) throw new Error('El archivo es demasiado grande (más de 40 MB)');
  const buf = await f.arrayBuffer();
  const u = new Uint8Array(buf, 0, Math.min(8, buf.byteLength));
  return u[0] === 0xD0 && u[1] === 0xCF ? leerMsg(buf) : leerEml(buf);
}

// Nombre de quien lo envía sin la dirección: «Pérez Gómez, Juan <jpg@et.mde.es>» → «Pérez Gómez, Juan»
export const nombreRemitente = de => String(de || '').replace(/<[^>]*>/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim() || String(de || '').trim();
// Asunto sin «RE:», «RV:», «FW:», «Fwd:»… del principio
export const asuntoLimpio = a => String(a || '').replace(/^(\s*(re|rv|fw|fwd|reenviar|responder)\s*:\s*)+/i, '').trim() || String(a || '').trim();
