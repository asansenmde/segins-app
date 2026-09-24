// Pantalla de inicio: lo urgente de un vistazo.
import { S, evalsOrdenadas } from '../state.js';
import { hoyISO, diasHasta } from '../ui.js';
import { elementosAgenda, filaAgenda, editarEvento } from './agenda.js';
import { tarjetaEval, nuevaEvaluacion } from './evaluaciones.js';

export function inicio(main) {
  const pintar = () => {
    const hoy = hoyISO();
    const items = elementosAgenda();
    const vencidos = items.filter(e => e.clase === 'plazo' && e.fecha < hoy);
    const proximos = items.filter(e => e.fecha >= hoy && diasHasta(e.fecha) <= 14 && !e.hecho);
    const enCurso = evalsOrdenadas().filter(e => !e.cerrada).slice(0, 5);
    main.innerHTML = `
      <div class="row gap">
        <button class="btn primary big grow" id="nueva">＋ Nueva evaluación</button>
        <button class="btn big" id="evento" aria-label="Nuevo evento de agenda">📅</button>
      </div>
      ${vencidos.length ? `<h3 class="sec txt-alert">Plazos vencidos (${vencidos.length})</h3><div class="card list">${vencidos.map(filaAgenda).join('')}</div>` : ''}
      <h3 class="sec">Próximos 14 días</h3>
      <div class="card list">${proximos.length ? proximos.map(filaAgenda).join('') : '<p class="muted">Nada programado.</p>'}</div>
      <h3 class="sec">Evaluaciones en curso</h3>
      ${enCurso.length ? enCurso.map(tarjetaEval).join('') : '<div class="card"><p class="muted">No hay evaluaciones abiertas.</p></div>'}
      <p class="muted small center">${S.eval.size} evaluaciones · ${S.inst.size} instalaciones</p>`;
  };
  pintar();
  main.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'nueva') nuevaEvaluacion();
    else if (b.id === 'evento') { if (await editarEvento()) pintar(); }
    else if (b.dataset.evento) { if (await editarEvento(S.agenda.get(b.dataset.evento))) pintar(); }
  });
  return { titulo: 'SEGINS', seccion: '' };
}
