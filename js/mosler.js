// Análisis de riesgos por el método Mosler.
// I = F×S · D = P×E · C = I+D · Pb = A×V · ER = C×Pb (2–1250)
import { calcArea } from './scoring.js';
import { uid } from './ui.js';

export const CRITERIOS = [
  {
    k: 'F', nombre: 'Función', ayuda: 'Consecuencias negativas del daño sobre la actividad de la instalación',
    escala: ['Muy levemente', 'Levemente', 'Medianamente', 'Gravemente', 'Muy gravemente'],
  },
  {
    k: 'S', nombre: 'Sustitución', ayuda: 'Dificultad para reponer los bienes o capacidades dañados',
    escala: ['Muy fácilmente', 'Fácilmente', 'Sin muchas dificultades', 'Difícilmente', 'Muy difícilmente'],
  },
  {
    k: 'P', nombre: 'Profundidad', ayuda: 'Perturbación y efectos psicológicos sobre la imagen y la moral',
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
    k: 'V', nombre: 'Vulnerabilidad', ayuda: 'Probabilidad de que, si ocurre, produzca daños (según las medidas de seguridad)',
    escala: ['Muy baja', 'Baja', 'Normal', 'Alta', 'Muy alta'],
  },
];

export const CLASES = [
  { max: 250, nombre: 'Muy reducido', cls: 'ok' },
  { max: 500, nombre: 'Reducido', cls: 'ok' },
  { max: 750, nombre: 'Normal', cls: 'warn' },
  { max: 1000, nombre: 'Elevado', cls: 'bad' },
  { max: 1250, nombre: 'Muy elevado', cls: 'alert' },
];

// Amenazas de base con las áreas del cuestionario que determinan su vulnerabilidad.
export const AMENAZAS_BASE = [
  { id: 'M01', nombre: 'Intrusión', areas: ['B', 'C', 'D', 'F'] },
  { id: 'M02', nombre: 'Robo o sustracción de armamento y munición', areas: ['G', 'C', 'D', 'F'] },
  { id: 'M03', nombre: 'Sabotaje', areas: ['B', 'C', 'D', 'G'] },
  { id: 'M04', nombre: 'Acto terrorista / ataque armado', areas: ['C', 'F', 'E', 'B'] },
  { id: 'M05', nombre: 'Vehículo con explosivos', areas: ['C', 'B'] },
  { id: 'M06', nombre: 'Dron hostil', areas: ['D', 'F', 'E'] },
  { id: 'M07', nombre: 'Fuga de información', areas: ['A', 'D', 'E'] },
  { id: 'M08', nombre: 'Incendio provocado', areas: ['B', 'G', 'D'] },
  { id: 'M09', nombre: 'Amenaza interna', areas: ['C', 'A', 'D'] },
  { id: 'M10', nombre: 'Protesta / alteración del orden', areas: ['B', 'C', 'F'] },
];

export const nuevaAmenaza = (nombre, areas = []) =>
  ({ id: 'm' + uid(), nombre, areas, F: null, S: null, P: null, E: null, A: null, V: null, vManual: false, notas: '' });

export const deBase = (a) => ({ ...nuevaAmenaza(a.nombre, [...a.areas]), id: a.id });

export function clase(er) {
  if (er == null) return null;
  return CLASES.find(c => er <= c.max) || CLASES[CLASES.length - 1];
}

// Vulnerabilidad propuesta a partir de los puntos ponderados de las áreas relacionadas.
// Un P1 no conforme en esas áreas eleva la V como mínimo a 4 (Alta).
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

export function calcAmenaza(ev, a) {
  const prop = vPropuesta(ev, a);
  const V = a.vManual ? a.V : prop?.v ?? null;
  const val = { F: a.F, S: a.S, P: a.P, E: a.E, A: a.A, V };
  const completo = Object.values(val).every(x => x != null);
  const I = a.F && a.S ? a.F * a.S : null;
  const D = a.P && a.E ? a.P * a.E : null;
  const C = I != null && D != null ? I + D : null;
  const Pb = a.A && V ? a.A * V : null;
  const ER = C != null && Pb != null ? C * Pb : null;
  return { ...val, I, D, C, Pb, ER, completo, clase: clase(ER), prop };
}

// Lista de amenazas de una evaluación. Si no existe, se crea copiando la última evaluación
// de la misma instalación (sin la V, que se recalcula con el cuestionario nuevo) o la lista de base.
export function asegurarMosler(ev, evaluaciones, config) {
  if (ev.mosler) return false;
  const previa = ev.instId && [...evaluaciones]
    .filter(e => e.id !== ev.id && e.instId === ev.instId && e.mosler?.length)
    .sort((a, b) => (b.cabecera.fecha || b.creado).localeCompare(a.cabecera.fecha || a.creado))[0];
  ev.mosler = previa
    ? previa.mosler.map(a => ({ ...structuredClone(a), V: null, vManual: false }))
    : (config.amenazas || AMENAZAS_BASE).map(deBase);
  return true;
}

export function resumenMosler(ev) {
  const filas = (ev.mosler || []).map(a => ({ a, r: calcAmenaza(ev, a) }));
  const completas = filas.filter(f => f.r.completo).sort((x, y) => y.r.ER - x.r.ER);
  const altos = completas.filter(f => f.r.ER > 750).length;
  return { filas, completas, altos };
}
