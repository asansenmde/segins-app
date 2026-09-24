// Piezas compartidas entre vistas.
import { esc } from '../ui.js';

export const CAMPOS_CABECERA = [
  ['instalacion', 'Nombre de la instalación / destacamento'],
  ['ambito', 'Ámbito'],
  ['localidad', 'Localidad / Plaza'],
  ['fecha', 'Fecha', 'date'],
  ['tipoActividad', 'Tipo de actividad', 'lista'],
  ['equipo', 'Equipo evaluador', 'area'],
  ['jefeInstalacion', 'Jefe instalación / destacamento'],
  ['jefeSeguridad', 'Jefe de Seguridad'],
  ['nivelAlerta', 'Nivel de alerta vigente', 'lista'],
  ['estadoPlan', 'Estado Plan de Seguridad (IT 07/23)', 'lista'],
  ['ultimoEjercicio', 'Último ejercicio / ensayo de seguridad'],
  ['referencias', 'Referencias FDNO / SIMENDEF / oficios abiertos', 'area'],
  ['observaciones', 'Observaciones / alcance', 'area'],
];

const CLS_NIVEL = { Satisfactorio: 'ok', Mejorable: 'warn', Deficiente: 'bad', 'Sin datos': 'none' };
const CLS_ESTADO = { OK: 'ok', VIGILAR: 'warn', 'CRÍTICO': 'bad', 'ALERTA P1': 'alert', 'Sin datos': 'none' };

export const badgeNivel = (n) => `<span class="badge ${CLS_NIVEL[n] || 'none'}">${esc(n)}</span>`;
export const badgeEstado = (n) => `<span class="badge ${CLS_ESTADO[n] || 'none'}">${esc(n)}</span>`;

export function barra(valor, total) {
  const p = total ? Math.round((valor / total) * 100) : 0;
  return `<div class="progress" title="${valor}/${total}"><i style="width:${p}%"></i></div>`;
}

export const vacio = (texto, extra = '') => `<div class="empty"><p>${esc(texto)}</p>${extra}</div>`;
