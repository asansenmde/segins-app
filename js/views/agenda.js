// Agenda: visitas y eventos propios + plazos de subsanación de las no conformidades.
import { S, guardar, borrar, instsOrdenadas } from '../state.js';
import { esc, uid, fmtFecha, hoyISO, MESES, modal, confirmar, toast, leerForm } from '../ui.js';
import { nuevaEvaluacion } from './evaluaciones.js';

export const TIPOS = ['Evaluación / visita', 'Seguimiento', 'Reunión', 'Otro'];

// Todos los elementos de agenda: eventos guardados + plazos derivados de las evaluaciones.
export function elementosAgenda() {
  const out = [...S.agenda.values()].map(e => ({ ...e, clase: 'evento' }));
  for (const ev of S.eval.values()) {
    if (ev.cerrada) continue;
    for (const a of ev.areas) for (const it of a.items) {
      const r = ev.respuestas[it.id];
      if (r?.r === 'I' && r.plazo) {
        out.push({
          id: `p-${ev.id}-${it.id}`, clase: 'plazo', fecha: r.plazo, tipo: 'Plazo',
          titulo: `Plazo ${it.codigo} · ${ev.cabecera.instalacion || ''}`,
          notas: r.obs, enlace: `#/eval/${ev.id}/area/${a.id}`, p1: it.prioridad === 'P1',
        });
      }
    }
  }
  return out.sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')));
}

export function filaAgenda(e) {
  const inst = e.instId ? S.inst.get(e.instId) : null;
  const icon = e.clase === 'plazo' ? (e.p1 ? '⚠' : '⏱') : e.hecho ? '✓' : '•';
  const inner = `<span class="ag-ic ${e.clase}${e.p1 ? ' p1' : ''}">${icon}</span>
    <div class="ag-txt"><div class="${e.hecho ? 'tachado' : ''}"><strong>${esc(e.titulo || e.tipo)}</strong></div>
      <div class="muted small">${fmtFecha(e.fecha)}${e.hora ? ' · ' + esc(e.hora) : ''}${e.clase === 'evento' ? ' · ' + esc(e.tipo) : ''}${inst ? ' · ' + esc(inst.nombre) : ''}</div></div>`;
  return e.clase === 'plazo'
    ? `<a class="ag-row" href="${e.enlace}">${inner}</a>`
    : `<button type="button" class="ag-row" data-evento="${e.id}">${inner}</button>`;
}

export async function editarEvento(e = null, fecha = hoyISO(), base = {}) {
  const ev = e || { id: 'a' + uid(), fecha, hora: '', tipo: TIPOS[0], instId: '', titulo: '', notas: '', hecho: false, ...base };
  const v = await modal({
    title: e ? 'Evento' : 'Nuevo evento',
    body: `<label class="lbl">Título</label><input class="input" name="titulo" value="${esc(ev.titulo)}">
      <div class="grid2"><label class="lbl">Fecha<input class="input" type="date" name="fecha" value="${esc(ev.fecha)}"></label>
      <label class="lbl">Hora<input class="input" type="time" name="hora" value="${esc(ev.hora)}"></label></div>
      <label class="lbl">Tipo</label><select class="input" name="tipo">${TIPOS.map(t => `<option ${t === ev.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <label class="lbl">Instalación</label><select class="input" name="instId"><option value="">—</option>
        ${instsOrdenadas().map(i => `<option value="${i.id}" ${i.id === ev.instId ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}</select>
      <label class="lbl">Notas</label><textarea class="input" name="notas" rows="3">${esc(ev.notas)}</textarea>
      ${e ? `<label class="check"><input type="checkbox" name="hecho" ${ev.hecho ? 'checked' : ''}> Hecho</label>` : ''}`,
    buttons: [
      ...(e ? [{ label: 'Eliminar', cls: 'danger', value: 'borrar' }] : []),
      ...(e && ev.tipo === TIPOS[0] ? [{ label: 'Iniciar evaluación', value: 'evaluar' }] : []),
      { label: 'Cancelar', value: null },
      {
        label: 'Guardar', cls: 'primary', value: w => {
          const o = leerForm(w);
          if (!o.fecha) { toast('Indica la fecha'); return false; }
          return o;
        },
      },
    ],
  });
  if (!v) return false;
  if (v === 'borrar') {
    if (!(await confirmar('¿Eliminar este evento?', 'Eliminar', 'danger'))) return false;
    await borrar('agenda', ev.id);
    return true;
  }
  if (v === 'evaluar') {
    ev.hecho = true;
    await guardar('agenda', ev);
    await nuevaEvaluacion(ev.instId);
    return false;
  }
  Object.assign(ev, v, { hecho: !!v.hecho });
  await guardar('agenda', ev);
  return true;
}

export function agenda(main) {
  const hoy = hoyISO();
  let [y, m] = hoy.split('-').map(Number);
  let sel = hoy;

  const pintar = () => {
    const items = elementosAgenda();
    const porDia = new Map();
    for (const e of items) {
      if (!porDia.has(e.fecha)) porDia.set(e.fecha, []);
      porDia.get(e.fecha).push(e);
    }
    const primero = new Date(y, m - 1, 1);
    const offset = (primero.getDay() + 6) % 7; // lunes = 0
    const dias = new Date(y, m, 0).getDate();
    let celdas = '';
    for (let i = 0; i < offset; i++) celdas += '<span></span>';
    for (let d = 1; d <= dias; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = porDia.get(iso) || [];
      const clases = ['dia', iso === hoy && 'hoy', iso === sel && 'sel'].filter(Boolean).join(' ');
      const puntos = evs.slice(0, 3).map(e => `<i class="${e.clase}${e.p1 ? ' p1' : ''}${e.hecho ? ' hecho' : ''}"></i>`).join('');
      celdas += `<button type="button" class="${clases}" data-dia="${iso}">${d}<span class="dots">${puntos}</span></button>`;
    }
    const delDia = porDia.get(sel) || [];
    const proximos = items.filter(e => e.fecha > sel && !e.hecho).slice(0, 8);
    main.innerHTML = `
      <div class="cal-head">
        <button class="btn" data-mes="-1" aria-label="Mes anterior">‹</button>
        <strong>${MESES[m - 1]} ${y}</strong>
        <button class="btn" data-mes="1" aria-label="Mes siguiente">›</button>
      </div>
      <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span class="dow">${d}</span>`).join('')}${celdas}</div>
      <h3 class="sec">${fmtFecha(sel)}</h3>
      <div class="card list">${delDia.length ? delDia.map(filaAgenda).join('') : '<p class="muted">Sin eventos este día.</p>'}</div>
      ${proximos.length ? `<h3 class="sec">Siguientes</h3><div class="card list">${proximos.map(filaAgenda).join('')}</div>` : ''}
      <button class="fab" id="nuevo" aria-label="Nuevo evento">＋</button>`;
  };
  pintar();

  main.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mes) {
      m += +b.dataset.mes;
      if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
      pintar();
    } else if (b.dataset.dia) { sel = b.dataset.dia; pintar(); }
    else if (b.id === 'nuevo') { if (await editarEvento(null, sel)) pintar(); }
    else if (b.dataset.evento) { if (await editarEvento(S.agenda.get(b.dataset.evento))) pintar(); }
  });
  return { titulo: 'Agenda' };
}

