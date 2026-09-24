// Instalaciones: fichas y su histórico de evaluaciones.
import { S, guardar, guardarLuego, borrar, instsOrdenadas } from '../state.js';
import { esc, uid, fmtFecha, hoyISO, confirmar, toast } from '../ui.js';
import { calcEval, fmtNum } from '../scoring.js';
import { nuevaEvaluacion } from './evaluaciones.js';
import { editarEvento } from './agenda.js';
import { badgeNivel, vacio } from './comun.js';

const CAMPOS = [
  ['nombre', 'Nombre de la instalación / destacamento'],
  ['unidad', 'Unidad / organismo responsable'],
  ['ambito', 'Ámbito'],
  ['localidad', 'Localidad / Plaza'],
  ['jefeInstalacion', 'Jefe instalación / destacamento'],
  ['jefeSeguridad', 'Jefe de Seguridad'],
  ['contacto', 'Teléfono / contacto'],
  ['notas', 'Notas', 'area'],
];

export function lista(main) {
  const insts = instsOrdenadas();
  main.innerHTML = `
    <div id="lst">${insts.length ? insts.map(i => {
      const evs = [...S.eval.values()].filter(e => e.instId === i.id && e.cabecera.fecha).sort((a, b) => b.cabecera.fecha.localeCompare(a.cabecera.fecha));
      const ult = evs[0];
      const g = ult ? calcEval(ult).global : null;
      return `<a class="card link" href="#/inst/${i.id}">
        <strong>${esc(i.nombre)}</strong>
        <div class="muted small">${esc([i.unidad, i.localidad].filter(Boolean).join(' · '))}</div>
        <div class="small">${ult ? `Última: ${fmtFecha(ult.cabecera.fecha)} · ${fmtNum(g.puntos)} pts ${badgeNivel(g.nivelPuntos)}` : '<span class="muted">Sin evaluaciones</span>'}</div>
      </a>`;
    }).join('') : vacio('Aún no has creado instalaciones.')}</div>
    <button class="fab" id="nueva" aria-label="Nueva instalación">＋</button>`;
  main.querySelector('#nueva').onclick = async () => {
    const i = { id: 'i' + uid(), ...Object.fromEntries(CAMPOS.map(([k]) => [k, ''])) };
    i.nombre = 'Nueva instalación';
    await guardar('inst', i);
    location.hash = `#/inst/${i.id}`;
  };
  return { titulo: 'Instalaciones' };
}

export function detalle(main, id) {
  const i = S.inst.get(id);
  if (!i) { main.innerHTML = vacio('Instalación no encontrada.'); return { titulo: 'Instalación', atras: true }; }
  const evs = [...S.eval.values()].filter(e => e.instId === id)
    .sort((a, b) => (b.cabecera.fecha || '').localeCompare(a.cabecera.fecha || ''));
  main.innerHTML = `
    <form class="form" id="f" onsubmit="return false">
      ${CAMPOS.map(([k, lbl, t]) => t === 'area'
        ? `<label class="lbl">${lbl}</label><textarea class="input" name="${k}" rows="3">${esc(i[k])}</textarea>`
        : `<label class="lbl">${lbl}</label><input class="input" name="${k}" value="${esc(i[k])}">`).join('')}
    </form>
    <div class="row gap">
      <button class="btn primary grow" id="evaluar">＋ Nueva evaluación</button>
      <button class="btn grow" id="visita">📅 Programar visita</button>
    </div>
    <h3 class="sec">Histórico de evaluaciones</h3>
    ${evs.length ? `<div class="card scroll-x"><table class="tbl"><thead><tr><th>Fecha</th><th>Puntos</th><th>Nivel</th><th>% Conf.</th><th>Nivel</th><th>P1 en I</th></tr></thead><tbody>
      ${evs.map(e => {
        const g = calcEval(e).global;
        return `<tr><td><a href="#/eval/${e.id}/resultados">${e.cabecera.fecha ? fmtFecha(e.cabecera.fecha) : 'sin fecha'}</a></td>
          <td>${fmtNum(g.puntos)}</td><td>${badgeNivel(g.nivelPuntos)}</td><td>${fmtNum(g.pct)}</td><td>${badgeNivel(g.nivelPct)}</td>
          <td class="${g.p1EnI ? 'txt-alert' : ''}">${g.p1EnI}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<div class="card"><p class="muted">Sin evaluaciones vinculadas.</p></div>'}
    <div class="danger-zone"><button class="btn danger" id="borrar">Eliminar instalación</button></div>`;

  main.querySelector('#f').addEventListener('input', e => {
    i[e.target.name] = e.target.value;
    guardarLuego('inst', i);
  });
  main.querySelector('#evaluar').onclick = () => nuevaEvaluacion(id);
  main.querySelector('#visita').onclick = async () => {
    if (await editarEvento(null, hoyISO(), { instId: id, titulo: `Visita ${i.nombre}` })) toast('Visita añadida a la agenda');
  };
  main.querySelector('#borrar').onclick = async () => {
    if (!(await confirmar(`Se eliminará la ficha de "${i.nombre}". Las evaluaciones se conservan, pero quedarán sin vincular.`, 'Eliminar', 'danger'))) return;
    for (const e of S.eval.values()) if (e.instId === id) { e.instId = ''; await guardar('eval', e); }
    await borrar('inst', id);
    toast('Instalación eliminada');
    location.replace('#/instalaciones');
  };
  return { titulo: 'Instalación', atras: true, seccion: 'instalaciones' };
}
