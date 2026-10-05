// Estado en memoria (descifrado tras el desbloqueo) y persistencia.
import * as db from './db.js';
import { CONFIG_INICIAL } from './plantilla.js';
import { fijarEscala } from './mosler.js';

export const S = { config: null, inst: new Map(), eval: new Map(), agenda: new Map() };

export async function cargar() {
  S.config = await db.get('config', 'config');
  if (!S.config) {
    S.config = structuredClone(CONFIG_INICIAL);
    await db.put('config', S.config);
  }
  // La escala de 3 niveles con límites 200/600 no tenía base oficial: si no la eligió el usuario, vuelve la clásica.
  if (!S.config.escalaElegida && S.config.escalaRiesgo !== 'mosler5') {
    S.config.escalaRiesgo = 'mosler5';
    await db.put('config', S.config);
  }
  fijarEscala(S.config.escalaRiesgo, S.config.limitesRiesgo);
  for (const k of ['inst', 'eval', 'agenda']) {
    S[k] = new Map((await db.all(k)).map(o => [o.id, o]));
  }
}

export function vaciar() {
  S.config = null;
  S.inst = new Map();
  S.eval = new Map();
  S.agenda = new Map();
}

export async function guardar(store, obj) {
  obj.modificado = new Date().toISOString();
  if (store === 'config') { S.config = obj; fijarEscala(obj.escalaRiesgo, obj.limitesRiesgo); }
  else S[store].set(obj.id, obj);
  await db.put(store, obj);
}

export async function borrar(store, id) {
  S[store].delete(id);
  await db.del(store, id);
}

// Guardado diferido para campos que se editan tecleando.
const pendientes = new Map();
export function guardarLuego(store, obj, ms = 400) {
  clearTimeout(pendientes.get(obj.id)?.h);
  const h = setTimeout(() => { pendientes.delete(obj.id); guardar(store, obj); }, ms);
  pendientes.set(obj.id, { h, store, obj });
}

export async function volcarPendientes() {
  const lista = [...pendientes.values()];
  pendientes.clear();
  for (const p of lista) {
    clearTimeout(p.h);
    await guardar(p.store, p.obj);
  }
}

export const evalsOrdenadas = () =>
  [...S.eval.values()].sort((a, b) => (b.cabecera.fecha || b.creado).localeCompare(a.cabecera.fecha || a.creado));

export const instsOrdenadas = () =>
  [...S.inst.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
