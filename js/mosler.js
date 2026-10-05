// Análisis de riesgos por el método Mosler: cada amenaza se valora sobre cada elemento de la instalación.
// I = F×S · D = P×E · C = I+D · PR = A×V · ER = C×PR (2–1250)
import { calcArea } from './scoring.js';
import { uid } from './ui.js';

export const CRITERIOS = [
  {
    k: 'F', nombre: 'Función', ayuda: 'Consecuencias negativas del daño sobre la actividad',
    escala: ['Muy levemente', 'Levemente', 'Medianamente', 'Gravemente', 'Muy gravemente'],
  },
  {
    k: 'S', nombre: 'Sustitución', ayuda: 'Dificultad para reponer los bienes o capacidades',
    escala: ['Muy fácilmente', 'Fácilmente', 'Sin muchas dificultades', 'Difícilmente', 'Muy difícilmente'],
  },
  {
    k: 'P', nombre: 'Profundidad', ayuda: 'Perturbación y efectos sobre la imagen y la moral',
    escala: ['Muy leves', 'Leves', 'Limitados', 'Graves', 'Muy graves'],
  },
  {
    k: 'E', nombre: 'Extensión', ayuda: 'Alcance de los daños',
    escala: ['Individual', 'Local', 'Regional', 'Nacional', 'Internacional'],
  },
  {
    k: 'A', nombre: 'Agresión', ayuda: 'Probabilidad de que la amenaza se materialice',
    escala: ['Muy baja', 'Baja', 'Normal', 'Alta', 'Muy alta'],
  },
  {
    k: 'V', nombre: 'Vulnerabilidad', ayuda: 'Probabilidad de que, si ocurre, produzca daños',
    escala: ['Muy baja', 'Baja', 'Normal', 'Alta', 'Muy alta'],
  },
];
export const CLAVES = CRITERIOS.map(c => c.k);

// Escalas de clasificación del ER. La de 3 niveles es la que se usa en los análisis de la unidad.
export const ESCALAS = {
  et3: {
    nombre: 'Bajo / Normal / Alto',
    clases: [
      { max: 200, nombre: 'Bajo', cls: 'ok', color: '#2e7d32' },
      { max: 600, nombre: 'Normal', cls: 'warn', color: '#c08a1e' },
      { max: 1250, nombre: 'Alto', cls: 'alert', color: '#c62828' },
    ],
  },
  mosler5: {
    nombre: 'Mosler clásica (5 niveles)',
    clases: [
      { max: 250, nombre: 'Muy reducido', cls: 'ok', color: '#2e7d32' },
      { max: 500, nombre: 'Reducido', cls: 'ok', color: '#689f38' },
      { max: 750, nombre: 'Normal', cls: 'warn', color: '#c08a1e' },
      { max: 1000, nombre: 'Elevado', cls: 'bad', color: '#c62828' },
      { max: 1250, nombre: 'Muy elevado', cls: 'alert', color: '#7f1d1d' },
    ],
  },
};

let escalaActiva = 'et3';
export const fijarEscala = (k) => { escalaActiva = ESCALAS[k] ? k : 'et3'; };
export const escala = () => ESCALAS[escalaActiva];
export const clases = () => escala().clases;
// Umbral a partir del cual un riesgo pide acción (clase intermedia) y a partir del cual es prioritario (clase alta).
export const umbralAccion = () => (escalaActiva === 'et3' ? 200 : 500);
export const umbralAlto = () => (escalaActiva === 'et3' ? 600 : 750);

export function clase(er) {
  if (er == null) return null;
  return clases().find(c => er <= c.max) || clases()[clases().length - 1];
}

export const ELEMENTOS_BASE = [
  'Almacén munición', 'C. Guardia / CECONSEG', 'Pabellones', 'Aparc. vehículos', 'Armería', 'Accesos',
  'Alojamiento', 'Edificio Mando', 'Edificio UAPO', 'Depósito gasoil', 'Centros transformación',
  'Grupo electrógeno', 'Cocina', 'CECOM',
];

const G1 = 'Amenazas con intervención del enemigo';
const G2 = 'Amenazas sin intervención del enemigo';

// Amenazas de base y áreas del cuestionario que orientan su vulnerabilidad.
export const AMENAZAS_BASE = [
  ['Actividad antisocial', G1, ['B', 'C', 'F']],
  ['Ciberataque', G1, ['D', 'E']],
  ['Sabotaje', G1, ['B', 'C', 'D', 'G']],
  ['Subversión', G1, ['A', 'F']],
  ['Terrorismo', G1, ['C', 'F', 'B', 'E']],
  ['Espionaje', G1, ['A', 'D']],
  ['Crimen organizado', G1, ['C', 'G', 'F']],
  ['Intrusión', G2, ['B', 'C', 'D', 'F']],
  ['Robo o hurto', G2, ['G', 'C', 'D']],
  ['Atraco', G2, ['C', 'F', 'G']],
  ['Aviso de bomba', G2, ['F', 'C']],
  ['Ataque postal', G2, ['C', 'A']],
  ['Secuestro', G2, ['C', 'F']],
  ['Extorsión', G2, ['A']],
  ['Chantaje', G2, ['A']],
  ['Disturbios, agresiones y vandalismo', G2, ['B', 'C', 'F']],
  ['Abuso de confianza', G2, ['A', 'C', 'D']],
  ['Incendio', G2, ['G', 'D']],
  ['Biológicas', G2, []],
  ['Propias de la naturaleza', G2, []],
  ['Tecnológicas', G2, ['D', 'E']],
  ['Derivadas de la actividad de las unidades', G2, ['A', 'F']],
].map(([nombre, grupo, areas], i) => ({ id: 'M' + String(i + 1).padStart(2, '0'), nombre, grupo, areas }));

export const GRUPOS = [G1, G2];

export const nuevoElemento = (nombre) => ({ id: 'el' + uid(), nombre });
export const nuevaAmenaza = (nombre, grupo = G2, areas = []) => ({ id: 'm' + uid(), nombre, grupo, areas, notas: '', valores: {} });
const deBase = (a) => ({ ...nuevaAmenaza(a.nombre, a.grupo, [...a.areas]), id: a.id });

export function calcFila(v = {}) {
  const ok = k => v[k] != null && v[k] !== '';
  const I = ok('F') && ok('S') ? v.F * v.S : null;
  const D = ok('P') && ok('E') ? v.P * v.E : null;
  const C = I != null && D != null ? I + D : null;
  const PR = ok('A') && ok('V') ? v.A * v.V : null;
  const ER = C != null && PR != null ? C * PR : null;
  return { I, D, C, PR, ER, completo: ER != null, clase: clase(ER) };
}

// Vulnerabilidad orientativa a partir de las áreas del cuestionario relacionadas con la amenaza.
// Un P1 no conforme en esas áreas la eleva como mínimo a 4 (Alta).
export function vPropuesta(ev, amenaza) {
  const res = ev.areas.filter(a => amenaza.areas.includes(a.id)).map(a => calcArea(a, ev.respuestas, ev.umbrales));
  const conDatos = res.filter(r => r.puntos != null);
  if (!conDatos.length) return null;
  const sumW = conDatos.reduce((s, r) => s + (r.peso || 1), 0);
  const puntos = conDatos.reduce((s, r) => s + (r.peso || 1) * r.puntos, 0) / sumW;
  let v = puntos >= 90 ? 1 : puntos >= 80 ? 2 : puntos >= 70 ? 3 : puntos >= 50 ? 4 : 5;
  const p1 = res.reduce((s, r) => s + r.p1EnI, 0);
  if (p1 > 0 && v < 4) v = 4;
  return { v, puntos, p1, areas: conDatos.map(r => r.id) };
}

// Convierte el formato antiguo (un valor por amenaza) al de amenaza × elemento.
function migrar(ev) {
  if (!ev.mosler || ev.moslerElementos) return false;
  const gen = nuevoElemento('General');
  ev.moslerElementos = [gen];
  ev.mosler = ev.mosler.map(a => {
    const v = Object.fromEntries(CLAVES.filter(k => a[k] != null).map(k => [k, a[k]]));
    return { id: a.id, nombre: a.nombre, grupo: a.grupo || G2, areas: a.areas || [], notas: a.notas || '', valores: Object.keys(v).length ? { [gen.id]: v } : {} };
  });
  return true;
}

// Crea el análisis de una evaluación copiando la última de la misma instalación, o desde la lista de base.
export function asegurarMosler(ev, evaluaciones, config) {
  if (migrar(ev)) return true;
  if (ev.mosler && ev.moslerElementos) return false;
  const previa = ev.instId && [...evaluaciones]
    .filter(e => e.id !== ev.id && e.instId === ev.instId && e.mosler?.length)
    .sort((a, b) => (b.cabecera.fecha || b.creado).localeCompare(a.cabecera.fecha || a.creado))[0];
  if (previa) {
    migrar(previa);
    ev.moslerElementos = structuredClone(previa.moslerElementos);
    ev.mosler = structuredClone(previa.mosler);
  } else {
    ev.moslerElementos = (config.elementosMosler || ELEMENTOS_BASE).map(n => nuevoElemento(n));
    ev.mosler = (config.amenazas || AMENAZAS_BASE).map(deBase);
  }
  return true;
}

export function resumenMosler(ev) {
  migrar(ev);
  const elems = ev.moslerElementos || [];
  const filas = [];
  for (const a of ev.mosler || []) {
    for (const e of elems) filas.push({ a, e, r: calcFila(a.valores?.[e.id]) });
  }
  const completas = filas.filter(f => f.r.completo).sort((x, y) => y.r.ER - x.r.ER);
  const altos = completas.filter(f => f.r.ER > umbralAlto()).length;
  const conAccion = completas.filter(f => f.r.ER > umbralAccion());
  return { filas, completas, altos, conAccion, elems };
}

// Máximo ER de una amenaza sobre todos sus elementos.
export function maxAmenaza(ev, a) {
  let max = null;
  for (const e of ev.moslerElementos || []) {
    const r = calcFila(a.valores?.[e.id]);
    if (r.ER != null && (max == null || r.ER > max.ER)) max = { ...r, e };
  }
  return max;
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

// Lee una tabla Mosler copiada de Excel: bloques "AMENAZA | F | S | I=FxS | P | E | D=PxE | C=I+D | A | V | PR | ER | RIESGO"
// seguidos de una fila por elemento. Una línea con un solo texto en mayúsculas antes de un bloque se toma como grupo.
export function leerTablaPegada(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n').map(l => l.split('\t').map(c => c.trim()));
  const amenazas = [];
  const elementos = [];
  let actual = null, grupo = G1, cols = null;
  for (const c of lineas) {
    const llenas = c.filter(Boolean);
    if (!llenas.length) continue;
    const cab = c.map(x => norm(x));
    const iF = cab.indexOf('F');
    if (iF > 0 && cab.includes('S') && cab.includes('A') && cab.includes('V')) {
      const at = (k) => cab.findIndex(x => x === k || x.startsWith(k + ' '));
      cols = { F: at('F'), S: at('S'), P: at('P'), E: at('E'), A: at('A'), V: at('V') };
      actual = { nombre: c[0], grupo, filas: [] };
      amenazas.push(actual);
      continue;
    }
    if (llenas.length === 1 && !/\d/.test(llenas[0])) {
      const n = norm(llenas[0]);
      if (n.includes('SIN INTERVENCION')) grupo = G2;
      else if (n.includes('CON INTERVENCION')) grupo = G1;
      else grupo = llenas[0];
      actual = null;
      continue;
    }
    if (!actual || !cols || !c[0]) continue;
    const v = {};
    for (const k of CLAVES) {
      const n = parseInt(c[cols[k]], 10);
      if (n >= 1 && n <= 5) v[k] = n;
    }
    if (!Object.keys(v).length) continue;
    if (!elementos.some(e => norm(e) === norm(c[0]))) elementos.push(c[0]);
    actual.filas.push({ elemento: c[0], v });
  }
  return { amenazas: amenazas.filter(a => a.filas.length), elementos };
}

// Aplica una tabla leída a la evaluación: crea elementos y amenazas que falten y sobrescribe sus valores.
export function aplicarTabla(ev, tabla) {
  const elems = ev.moslerElementos;
  const idElem = (nombre) => {
    let e = elems.find(x => norm(x.nombre) === norm(nombre));
    if (!e) { e = nuevoElemento(nombre); elems.push(e); }
    return e.id;
  };
  let celdas = 0;
  for (const t of tabla.amenazas) {
    let a = ev.mosler.find(x => norm(x.nombre) === norm(t.nombre));
    if (!a) {
      const base = AMENAZAS_BASE.find(x => norm(x.nombre) === norm(t.nombre));
      a = nuevaAmenaza(t.nombre, base?.grupo || (GRUPOS.includes(t.grupo) ? t.grupo : G2), base ? [...base.areas] : []);
      ev.mosler.push(a);
    }
    a.valores ||= {};
    for (const f of t.filas) { a.valores[idElem(f.elemento)] = { ...f.v }; celdas++; }
  }
  return celdas;
}
