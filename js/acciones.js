// Plan de acciones derivadas de la evaluación: no conformidades, riesgos Mosler,
// acciones generales y acciones añadidas a mano.
import { calcEval } from './scoring.js';
import { resumenMosler, umbralAlto, clases } from './mosler.js';
import { uid } from './ui.js';

// Acción correctora propuesta para cada ítem base cuando se marca como No conforme.
export const ACCION_PROPUESTA = {
  A01: 'Elaborar o actualizar el Plan de Seguridad conforme a la IT 07/23 y elevarlo para su aprobación con plazo definido.',
  A02: 'Revisar la clasificación de zonas del Plan de Seguridad y adecuar la señalización real al Anexo IV.',
  A03: 'Actualizar la NOP de armas particulares (NG 02/23) y resolver la ubicación de locales y cajas fuertes.',
  A04: 'Instalar cartelería de videovigilancia conforme a la LO 3/2018 en accesos, zonas sensibles y perímetros con población.',
  A05: 'Señalizar Guardia, CECONSEG, perímetros, zonas sensibles y SLPMC según el Anexo IV.',
  A06: 'Establecer la custodia adecuada de la documentación clasificada en Guardia y CECONSEG conforme a SEGINFO.',
  A07: 'Implantar un registro de seguimiento de acciones, FDNO y SIMENDEF con estado, responsable y plazo.',
  B01: 'Reparar los tramos de cerramiento en mal estado y, hasta su reparación, establecer medidas compensatorias (vigilancia, patrullas, CCTV).',
  B02: 'Documentar el seguimiento de las mejoras de vallado: peticiones, obras en curso y plazos.',
  B03: 'Completar la cartelería de zona militar o reservada y valorar su traducción a otros idiomas.',
  B04: 'Restablecer la iluminación perimetral e instalar focos sorpresivos en las zonas vulnerables según el plan.',
  B05: 'Ejecutar el desbroce y la poda perimetral y asegurar su continuidad mediante contrato.',
  B06: 'Elaborar el croquis e inventario del perímetro con sus sectores vulnerables y distribuirlo a Guardia y CECONSEG.',
  B07: 'Dotar a gasolineras y depósitos exteriores de cerramiento o MESEINS, o tramitar la solicitud correspondiente.',
  C01: 'Dotar a los controles de acceso de protección para el centinela o vigilante (alarma, visibilidad y protección física).',
  C02: 'Solicitar o instalar los medios de control necesarios: pulsadores, barreras, tornos y CCTV de matrículas.',
  C03: 'Actualizar y difundir los procedimientos de identificación y registro de personal y vehículos, y verificar su aplicación.',
  C04: 'Implantar el control de acceso al CECONSEG (electrónico o libro registro).',
  C05: 'Colocar o planificar medios pasivos anti-intrusión (erizos, barreras New Jersey) en los accesos a polvorín y depósitos.',
  D01: 'Restablecer las cámaras inoperativas o documentar las medidas compensatorias mientras dure la avería.',
  D02: 'Actualizar el software de gestión de alarmas del CECONSEG o tramitar su sustitución.',
  D03: 'Señalizar el CECONSEG como zona prohibida y adecuar puertas, rack y rejas a la NT/IT.',
  D04: 'Instalar cajetines de custodia de móviles en Guardia y CECONSEG.',
  D05: 'Registrar las incidencias de MESEINS con plazo de restitución y hacer su seguimiento.',
  D06: 'Tramitar las peticiones MESEINS/FDNO con referencia de oficio y hacer su seguimiento.',
  D07: 'Dotar a los CECONSEG desatendidos de control de acceso, cámara interior y puerta normativa.',
  D08: 'Dotar al CECONSEG de alimentación alternativa o grupo electrógeno cuando sea exigible.',
  E01: 'Reparar o reponer los equipos de comunicaciones de seguridad y verificar el enlace periódicamente.',
  E02: 'Establecer una reserva de equipos y baterías con su procedimiento de sustitución.',
  E03: 'Habilitar y probar periódicamente un canal alternativo de comunicaciones.',
  E04: 'Identificar los sistemas críticos, su tiempo máximo de indisponibilidad y las alternativas de continuidad.',
  E05: 'Establecer un plan de mantenimiento de MESEINS y gestionar las demoras con el órgano responsable.',
  F01: 'Ajustar la composición de la Guardia a lo establecido en el Plan de Seguridad.',
  F02: 'Definir la fuerza de reacción o retén y darla a conocer al personal.',
  F03: 'Elaborar y difundir el procedimiento de refuerzo y escalada.',
  F04: 'Instruir al personal de la Guardia sobre los puntos vulnerables y las normas del puesto.',
  F05: 'Programar y ejecutar ensayos y ejercicios de seguridad, no solo de incendios.',
  F06: 'Redimensionar los puestos fijos y las patrullas según el Plan de Seguridad.',
  G01: 'Señalizar los depósitos de agua, combustible y grupos electrógenos e incluirlos en el Plan de Seguridad con su clasificación.',
  G02: 'Instalar MESEINS en depósitos sensibles y gasolineras o tramitar la solicitud con seguimiento.',
  G03: 'Corregir la iluminación, sorpresivos, accesos y medios pasivos del polvorín o abrir las acciones necesarias.',
  G04: 'Adecuar rejas, techos y accesos de armerías y depósitos de armamento a la norma o tramitar el FDNO.',
  G05: 'Completar la acreditación y los medios de cuartos cripto, ZAR y SLPMC y hacer seguimiento de las peticiones.',
  G06: 'Dotar a las gasolineras de cerramiento y/o MESEINS o registrar la solicitud.',
};

export const ESTADOS = ['Pendiente', 'En curso', 'Cumplida'];
export const PLAZO_DIAS = { P1: 30, P2: 90 };

export const propuestaItem = (it) => it.accion || ACCION_PROPUESTA[it.codigo] || '';

// Plazo por defecto desde la fecha de la evaluación (o hoy): 30 días para P1 y 90 para P2.
export function plazoPorDefecto(ev, prioridad) {
  const base = ev.cabecera.fecha ? new Date(ev.cabecera.fecha + 'T12:00:00') : new Date();
  base.setDate(base.getDate() + (PLAZO_DIAS[prioridad] || 90));
  return base.toISOString().slice(0, 10);
}

// Meses hasta la próxima evaluación según el peor de los dos niveles globales.
function mesesProxima(g) {
  const niveles = [g.nivelPct, g.nivelPuntos];
  if (g.p1EnI > 0 || niveles.includes('Deficiente')) return 3;
  if (niveles.includes('Mejorable')) return 6;
  return 12;
}

export function fechaProxima(ev) {
  const g = calcEval(ev).global;
  if (g.pct == null) return null;
  const meses = mesesProxima(g);
  const d = ev.cabecera.fecha ? new Date(ev.cabecera.fecha + 'T12:00:00') : new Date();
  d.setMonth(d.getMonth() + meses);
  return { fecha: d.toISOString().slice(0, 10), meses };
}

// Amenazas con algún elemento por encima de la clase más baja, aún no añadidas al plan.
export function riesgosSugeridos(ev) {
  const ya = new Set((ev.acciones || []).filter(a => a.origen === 'mosler').map(a => a.ref));
  const porAmenaza = new Map();
  for (const f of resumenMosler(ev).conAccion) {
    if (ya.has(f.a.id)) continue;
    if (!porAmenaza.has(f.a.id)) porAmenaza.set(f.a.id, { a: f.a, filas: [] });
    porAmenaza.get(f.a.id).filas.push(f);
  }
  return [...porAmenaza.values()];
}

export function accionDeRiesgo(ev, a, filas) {
  const areas = ev.areas.filter(x => a.areas.includes(x.id)).map(x => `${x.id}. ${x.nombre}`);
  const noConf = ev.areas.filter(x => a.areas.includes(x.id))
    .flatMap(x => x.items.filter(it => ev.respuestas[it.id]?.r === 'I').map(it => it.codigo));
  const donde = filas.map(f => `${f.e.nombre} (ER ${f.r.ER}, ${f.r.clase.nombre})`).join('; ');
  let texto = `Reducir el riesgo de «${a.nombre}» en ${donde}: reforzar las medidas de seguridad`;
  texto += areas.length ? ` en ${areas.join(', ')}` : '';
  texto += noConf.length ? ` y subsanar con prioridad ${noConf.join(', ')}.` : '.';
  const p1 = filas.some(f => f.r.ER > umbralAlto());
  return {
    id: 'a' + uid(), origen: 'mosler', ref: a.id, texto,
    prioridad: p1 ? 'P1' : 'P2', responsable: '', plazo: plazoPorDefecto(ev, p1 ? 'P1' : 'P2'), estado: 'Pendiente',
  };
}

export const accionManual = (ev) => ({
  id: 'a' + uid(), origen: 'manual', ref: '', texto: '', prioridad: 'P2', responsable: '', plazo: plazoPorDefecto(ev, 'P2'), estado: 'Pendiente',
});

// Todas las acciones del plan, en un formato común para la pantalla, el informe y la agenda.
export function planAcciones(ev) {
  const lista = [];
  for (const area of ev.areas) for (const it of area.items) {
    const r = ev.respuestas[it.id];
    if (r?.r !== 'I') continue;
    lista.push({
      tipo: 'item', clave: it.id, areaId: area.id, origen: `Ítem ${it.codigo}`,
      texto: r.accion ?? propuestaItem(it), prioridad: it.prioridad,
      responsable: r.responsable || '', plazo: r.plazo || '', estado: r.estadoAccion || 'Pendiente', ref: r.ref || '',
    });
  }
  const amenazas = new Map((ev.mosler || []).map(a => [a.id, a]));
  for (const a of ev.acciones || []) {
    lista.push({
      tipo: a.origen, clave: a.id, origen: a.origen === 'mosler' ? `Riesgo: ${amenazas.get(a.ref)?.nombre || 'amenaza'}` : 'Propia',
      texto: a.texto, prioridad: a.prioridad, responsable: a.responsable, plazo: a.plazo, estado: a.estado, ref: '',
    });
  }
  const orden = { P1: 0, P2: 1 };
  return lista.sort((x, y) => (orden[x.prioridad] ?? 2) - (orden[y.prioridad] ?? 2) || (x.plazo || '9999').localeCompare(y.plazo || '9999'));
}

// Acciones generales que se desprenden del resultado (solo texto, para el informe).
export function accionesGenerales(ev) {
  const { global: g } = calcEval(ev);
  const out = [];
  if (g.p1EnI) out.push(`Comunicar al mando ${g.p1EnI === 1 ? 'la alerta P1 detectada' : `las ${g.p1EnI} alertas P1 detectadas`} y adoptar medidas compensatorias inmediatas hasta su subsanación.`);
  const altos = resumenMosler(ev).altos;
  const alto = clases()[clases().length - 1].nombre.toLowerCase();
  if (altos) out.push(`Revisar el Plan de Seguridad frente ${altos === 1 ? `al riesgo de nivel ${alto} identificado` : `a los ${altos} riesgos de nivel ${alto} identificados`} en el análisis Mosler.`);
  const prox = fechaProxima(ev);
  if (prox) out.push(`Realizar la próxima evaluación SEGINS en un plazo de ${prox.meses} meses (antes del ${prox.fecha.split('-').reverse().join('/')}), verificando el cumplimiento de las acciones de este plan.`);
  return out;
}
