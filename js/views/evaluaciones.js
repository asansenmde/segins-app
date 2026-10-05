// Evaluaciones: lista, datos, cuestionario por áreas, resultados e informe.
import { S, guardar, guardarLuego, borrar, evalsOrdenadas, instsOrdenadas } from '../state.js';
import { esc, uid, fmtFecha, hoyISO, modal, confirmar, toast, leerForm, compartirODescargar } from '../ui.js';
import { calcEval, calcArea, fmtNum } from '../scoring.js';
import { procesarImagen, guardarFoto, urlFoto, verFoto, borrarFoto, elegirImagenes } from '../fotos.js';
import { CAMPOS_CABECERA, badgeNivel, badgeEstado, barra, vacio } from './comun.js';
import { CRITERIOS, CLAVES, GRUPOS, AMENAZAS_BASE, clases, umbralAccion, umbralAlto, nuevaAmenaza, nuevoElemento, calcFila, vPropuesta, maxAmenaza, asegurarMosler, resumenMosler, leerTablaPegada, aplicarTabla } from '../mosler.js';
import { ESTADOS, propuestaItem, plazoPorDefecto, planAcciones, riesgosSugeridos, accionDeRiesgo, accionManual, accionesGenerales, fechaProxima } from '../acciones.js';

const TXT_R = { C: 'Conforme', I: 'No conforme', NA: 'No aplica' };

// ---------------- Lista ----------------

export function lista(main) {
  const evs = evalsOrdenadas();
  main.innerHTML = `
    <div class="toolbar"><input class="input" id="filtro" type="search" placeholder="Buscar por instalación…"></div>
    <div id="lst">${evs.length ? evs.map(tarjetaEval).join('') : vacio('Aún no hay evaluaciones.')}</div>
    <button class="fab" id="nueva" aria-label="Nueva evaluación">＋</button>`;
  main.querySelector('#nueva').onclick = () => nuevaEvaluacion();
  main.querySelector('#filtro').oninput = e => {
    const q = e.target.value.toLowerCase();
    main.querySelectorAll('[data-eval]').forEach(c => { c.hidden = !c.textContent.toLowerCase().includes(q); });
  };
  return { titulo: 'Evaluaciones' };
}

export function tarjetaEval(ev) {
  const { global: g } = calcEval(ev);
  return `<a class="card link" data-eval href="#/eval/${ev.id}">
    <div class="row between"><strong>${esc(ev.cabecera.instalacion || 'Sin nombre')}</strong>
      ${ev.cerrada ? '<span class="badge none">Cerrada</span>' : '<span class="badge info">En curso</span>'}</div>
    <div class="muted small">${ev.cabecera.fecha ? fmtFecha(ev.cabecera.fecha) : 'Sin fecha'} · ${esc(ev.cabecera.tipoActividad || '')}</div>
    ${barra(g.respondidos, g.total)}
    <div class="row wrap gap small">
      <span class="nowrap">Puntos <strong>${fmtNum(g.puntos)}</strong> ${badgeNivel(g.nivelPuntos)}</span>
      <span class="nowrap">Conf. <strong>${fmtNum(g.pct)} %</strong> ${badgeNivel(g.nivelPct)}</span>
      ${g.p1EnI ? `<span class="badge alert">${g.p1EnI} P1 en I</span>` : ''}
    </div>
  </a>`;
}

export async function nuevaEvaluacion(instId = '') {
  const insts = instsOrdenadas();
  const v = await modal({
    title: 'Nueva evaluación',
    body: `<label class="lbl">Instalación</label>
      <select class="input" name="inst">
        <option value="">— Rellenar a mano —</option>
        ${insts.map(i => `<option value="${i.id}" ${i.id === instId ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}
      </select>
      <p class="muted small">Si eliges una instalación se copian sus datos (nombre, ámbito, localidad y jefes). Todo lo demás empieza vacío.</p>`,
    buttons: [{ label: 'Cancelar', value: null }, { label: 'Crear', cls: 'primary', value: w => ({ inst: w.querySelector('[name=inst]').value }) }],
  });
  if (!v) return;
  const inst = S.inst.get(v.inst);
  const cab = Object.fromEntries(CAMPOS_CABECERA.map(([k]) => [k, '']));
  if (inst) Object.assign(cab, {
    instalacion: inst.nombre, ambito: inst.ambito || '', localidad: inst.localidad || '',
    jefeInstalacion: inst.jefeInstalacion || '', jefeSeguridad: inst.jefeSeguridad || '',
  });
  const ev = {
    id: 'e' + uid(), instId: inst?.id || '', creado: new Date().toISOString(), cerrada: false,
    umbrales: { umbralSat: S.config.umbralSat, umbralMej: S.config.umbralMej },
    cabecera: cab, areas: structuredClone(S.config.areas), respuestas: {},
    conclusiones: '', lugarFirma: '',
  };
  asegurarMosler(ev, S.eval.values(), S.config);
  await guardar('eval', ev);
  location.hash = `#/eval/${ev.id}/datos`;
}

// ---------------- Detalle (pestañas) ----------------

export function detalle(main, id, tab = 'datos') {
  const ev = S.eval.get(id);
  if (!ev) { main.innerHTML = vacio('Evaluación no encontrada.'); return { titulo: 'Evaluación', atras: true }; }
  const { global: g } = calcEval(ev);
  const tabs = [['datos', 'Datos'], ['areas', 'Cuestionario'], ['resultados', 'Resultados'], ['riesgos', 'Riesgos'], ['acciones', 'Acciones'], ['informe', 'Informe']];
  main.innerHTML = `
    <div class="evhead">
      <div><strong>${esc(ev.cabecera.instalacion || 'Sin nombre')}</strong>
        <span class="muted small">${ev.cabecera.fecha ? fmtFecha(ev.cabecera.fecha) : 'sin fecha'}</span></div>
      ${barra(g.respondidos, g.total)}
      <div class="muted small">${g.respondidos}/${g.total} respondidos · ${g.i} no conformes${g.p1EnI ? ` · <span class="txt-alert">${g.p1EnI} P1 en I</span>` : ''}</div>
    </div>
    <div class="tabs">${tabs.map(([t, n]) => `<a href="#/eval/${id}/${t}" class="${t === tab ? 'on' : ''}">${n}</a>`).join('')}</div>
    <div id="tab"></div>`;
  main.querySelector('.tabs a.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  main.querySelectorAll('.tabs a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); location.replace(a.getAttribute('href'));
  }));
  const cont = main.querySelector('#tab');
  ({ datos: tabDatos, areas: tabAreas, resultados: tabResultados, riesgos: tabRiesgos, acciones: tabAcciones, informe: tabInforme })[tab](cont, ev);
  return { titulo: 'Evaluación', atras: true, seccion: 'evaluaciones' };
}

function sugerencias(campo) {
  const vals = new Set();
  for (const e of S.eval.values()) if (e.cabecera[campo]) vals.add(e.cabecera[campo]);
  return [...vals];
}

function tabDatos(cont, ev) {
  cont.innerHTML = `
    <form class="form" id="cab" onsubmit="return false">
      ${CAMPOS_CABECERA.map(([k, lbl, tipo]) => {
        const v = esc(ev.cabecera[k]);
        if (tipo === 'area') return `<label class="lbl">${lbl}</label><textarea class="input" name="${k}" rows="2">${v}</textarea>`;
        if (tipo === 'date') return `<label class="lbl">${lbl}</label><input class="input" type="date" name="${k}" value="${v}">`;
        if (tipo === 'lista') return `<label class="lbl">${lbl}</label><input class="input" name="${k}" value="${v}" list="dl-${k}">
          <datalist id="dl-${k}">${sugerencias(k).map(s => `<option value="${esc(s)}">`).join('')}</datalist>`;
        return `<label class="lbl">${lbl}</label><input class="input" name="${k}" value="${v}">`;
      }).join('')}
      <label class="lbl">Instalación vinculada</label>
      <select class="input" name="__inst">
        <option value="">— Ninguna —</option>
        ${instsOrdenadas().map(i => `<option value="${i.id}" ${i.id === ev.instId ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}
      </select>
      <p class="muted small">Vincularla permite ver el histórico y comparar con evaluaciones anteriores.</p>
    </form>
    <div class="danger-zone"><button class="btn danger" id="borrar">Eliminar evaluación</button></div>`;
  cont.querySelector('#cab').addEventListener('input', e => {
    const el = e.target;
    if (el.name === '__inst') ev.instId = el.value;
    else ev.cabecera[el.name] = el.value;
    guardarLuego('eval', ev);
  });
  cont.querySelector('#borrar').onclick = async () => {
    if (!(await confirmar('Se eliminará la evaluación con todas sus respuestas y fotos. No se puede deshacer.', 'Eliminar', 'danger'))) return;
    for (const r of Object.values(ev.respuestas)) for (const f of r.fotos || []) await borrarFoto(f);
    await borrar('eval', ev.id);
    toast('Evaluación eliminada');
    location.replace('#/evaluaciones');
  };
}

function tabAreas(cont, ev) {
  const { areas } = calcEval(ev);
  cont.innerHTML = areas.map(a => `
    <a class="card link" href="#/eval/${ev.id}/area/${a.id}">
      <div class="row between"><strong>${esc(a.id)}. ${esc(a.nombre)}</strong>
        ${a.p1EnI ? `<span class="badge alert">${a.p1EnI} P1</span>` : a.pend === 0 ? '<span class="badge ok">✓</span>' : ''}</div>
      ${barra(a.total - a.pend, a.total)}
      <div class="row gap small muted"><span>C ${a.c}</span><span>I ${a.i}</span><span>NA ${a.na}</span><span>Pendientes ${a.pend}</span></div>
    </a>`).join('');
}

// ---------------- Cuestionario de un área ----------------

export function area(main, id, aid) {
  const ev = S.eval.get(id);
  const ar = ev?.areas.find(a => a.id === aid);
  if (!ar) { main.innerHTML = vacio('Área no encontrada.'); return { titulo: 'Área', atras: true }; }
  const idx = ev.areas.indexOf(ar);
  const prev = ev.areas[idx - 1], next = ev.areas[idx + 1];

  const pintarCabecera = () => {
    const r = calcArea(ar, ev.respuestas, ev.umbrales);
    main.querySelector('#ahead').innerHTML = `
      <div class="row between"><strong>${esc(ar.id)}. ${esc(ar.nombre)}</strong><span class="muted small">Peso ${ar.peso}</span></div>
      ${barra(r.total - r.pend, r.total)}
      <div class="row wrap gap small"><span>C ${r.c} · I ${r.i} · NA ${r.na} · Pend. ${r.pend}</span>
        <span>Puntos <strong>${fmtNum(r.puntos)}</strong></span><span>Conf. <strong>${fmtNum(r.pct)} %</strong></span>
        ${badgeEstado(r.estado)}</div>`;
  };

  main.innerHTML = `
    <div class="evhead sticky" id="ahead"></div>
    <div id="items">${ar.items.map(it => tarjetaItem(ev, it)).join('')}</div>
    <button class="btn block" id="additem">＋ Añadir ítem a esta área</button>
    ${ar.items.some(i => !ev.respuestas[i.id]?.r)
      ? '<button class="btn block ghost" id="restoC">Marcar los pendientes de esta área como Conforme</button>' : ''}
    <div class="row between pager">
      ${prev ? `<a class="btn" href="#/eval/${id}/area/${prev.id}" data-rep>‹ ${esc(prev.id)}</a>` : '<span></span>'}
      <a class="btn" href="#/eval/${id}/areas" data-rep>Todas las áreas</a>
      ${next ? `<a class="btn primary" href="#/eval/${id}/area/${next.id}" data-rep>${esc(next.id)} ›</a>` : `<a class="btn primary" href="#/eval/${id}/resultados" data-rep>Resultados ›</a>`}
    </div>`;
  pintarCabecera();
  main.querySelectorAll('[data-rep]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); location.replace(a.getAttribute('href'));
  }));

  const repintar = (itemId) => {
    const it = ar.items.find(i => i.id === itemId);
    main.querySelector(`[data-item="${CSS.escape(itemId)}"]`).outerHTML = tarjetaItem(ev, it);
    cargarMiniaturas(main);
    pintarCabecera();
  };
  const resp = (itemId) => (ev.respuestas[itemId] ||= { r: null, obs: '', ref: '', responsable: '', plazo: '', fotos: [] });

  main.addEventListener('click', async e => {
    const card = e.target.closest('[data-item]');
    const itemId = card?.dataset.item;
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.r && card) {
      const r = resp(itemId);
      r.r = r.r === b.dataset.r ? null : b.dataset.r;
      if (r.r === 'I') {
        // Al marcar No conforme se propone la acción correctora y un plazo según la prioridad.
        const it = ar.items.find(i => i.id === itemId);
        if (r.accion == null) r.accion = propuestaItem(it);
        if (!r.plazo) r.plazo = plazoPorDefecto(ev, it.prioridad);
      }
      await guardar('eval', ev);
      repintar(itemId);
    } else if (b.dataset.foto && card) {
      const files = await elegirImagenes(b.dataset.foto === 'cam');
      if (!files.length) return;
      toast('Guardando foto…');
      const r = resp(itemId);
      const it = ar.items.find(i => i.id === itemId);
      for (const f of files) {
        const sello = S.config.sellarFotos ? `${it.codigo} · ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}` : '';
        const id = await guardarFoto(await procesarImagen(f, sello));
        r.fotos.push({ id, pie: '' });
      }
      await guardar('eval', ev);
      repintar(itemId);
    } else if (b.dataset.ver != null && card) {
      const r = resp(itemId);
      const f = r.fotos[+b.dataset.ver];
      const res = await verFoto(f);
      if (res === 'borrar') {
        if (!(await confirmar('¿Eliminar esta foto?', 'Eliminar', 'danger'))) return;
        await borrarFoto(f);
        r.fotos.splice(+b.dataset.ver, 1);
      }
      if (res) { await guardar('eval', ev); repintar(itemId); }
    } else if (b.dataset.quitar && card) {
      if (!(await confirmar('¿Quitar este ítem de la evaluación?', 'Quitar', 'danger'))) return;
      for (const f of ev.respuestas[itemId]?.fotos || []) await borrarFoto(f);
      delete ev.respuestas[itemId];
      ar.items = ar.items.filter(i => i.id !== itemId);
      await guardar('eval', ev);
      card.remove();
      pintarCabecera();
    } else if (b.id === 'additem') {
      const it = await dialogoItem(ar);
      if (!it) return;
      ar.items.push(it.item);
      if (it.alBase) {
        const baseArea = S.config.areas.find(a => a.id === ar.id);
        if (baseArea && !baseArea.items.some(i => i.codigo === it.item.codigo)) {
          baseArea.items.push({ ...it.item, añadido: undefined });
          await guardar('config', S.config);
        }
      }
      await guardar('eval', ev);
      main.querySelector('#items').insertAdjacentHTML('beforeend', tarjetaItem(ev, it.item));
      pintarCabecera();
    } else if (b.id === 'restoC') {
      if (!(await confirmar('Todos los ítems sin responder de esta área quedarán como Conforme.', 'Marcar'))) return;
      for (const it of ar.items) if (!ev.respuestas[it.id]?.r) resp(it.id).r = 'C';
      await guardar('eval', ev);
      main.querySelector('#items').innerHTML = ar.items.map(it => tarjetaItem(ev, it)).join('');
      b.remove();
      cargarMiniaturas(main);
      pintarCabecera();
    }
  });

  main.addEventListener('input', e => {
    const el = e.target;
    const card = el.closest('[data-item]');
    if (!card || !el.dataset.f) return;
    const r = resp(card.dataset.item);
    r[el.dataset.f] = el.value;
    if (el.dataset.f === 'obs') el.classList.toggle('required', r.r === 'I' && !el.value.trim());
    guardarLuego('eval', ev);
  });

  cargarMiniaturas(main);
  return { titulo: `Área ${ar.id}`, atras: true, seccion: 'evaluaciones' };
}

function tarjetaItem(ev, it) {
  const r = ev.respuestas[it.id] || {};
  const esI = r.r === 'I';
  return `<div class="card item ${r.r ? 'r-' + r.r : ''}" data-item="${esc(it.id)}">
    <div class="row between"><span><strong>${esc(it.codigo)}</strong>
      <span class="badge ${it.prioridad === 'P1' ? 'p1' : 'p2'}">${esc(it.prioridad)}</span>
      <span class="muted small">peso ${esc(it.peso)}</span>${it.base ? '' : ' <span class="badge info">añadido</span>'}</span>
      ${it.base ? '' : '<button class="icon-btn" data-quitar="1" aria-label="Quitar ítem">✕</button>'}</div>
    <p class="item-txt">${esc(it.texto)}</p>
    <div class="seg">${['C', 'I', 'NA'].map(x => `<button type="button" data-r="${x}" class="${r.r === x ? 'on' : ''}" aria-pressed="${r.r === x}" title="${TXT_R[x]}">${x}</button>`).join('')}</div>
    <textarea class="input ${esI && !r.obs?.trim() ? 'required' : ''}" data-f="obs" rows="2"
      placeholder="${esI ? 'Observaciones (obligatorias si I)' : 'Observaciones'}">${esc(r.obs)}</textarea>
    ${esI ? `<label class="lbl small">Acción correctora</label>
    <textarea class="input" data-f="accion" rows="2" placeholder="Acción para subsanar la no conformidad">${esc(r.accion ?? propuestaItem(it))}</textarea>
    <div class="grid2">
      <input class="input" data-f="ref" value="${esc(r.ref)}" placeholder="Ref. oficio / FDNO / SIMENDEF">
      <input class="input" data-f="responsable" value="${esc(r.responsable)}" placeholder="Responsable de subsanar">
      <label class="lbl small">Plazo de subsanación<input class="input" type="date" data-f="plazo" value="${esc(r.plazo)}"></label>
    </div>` : ''}
    <div class="fotos">
      ${(r.fotos || []).map((f, i) => `<button type="button" class="thumb" data-ver="${i}" data-fid="${f.id}" aria-label="Ver foto ${i + 1}">${f.origId ? '<i class="mk">✎</i>' : ''}</button>`).join('')}
      <button type="button" class="thumb add" data-foto="cam" aria-label="Hacer foto">📷</button>
      <button type="button" class="thumb add" data-foto="gal" aria-label="Añadir desde galería">🖼</button>
    </div>
  </div>`;
}

async function cargarMiniaturas(root) {
  for (const b of root.querySelectorAll('[data-fid]:not([data-ok])')) {
    b.dataset.ok = '1';
    b.style.backgroundImage = `url("${await urlFoto(b.dataset.fid)}")`;
  }
}

async function dialogoItem(ar) {
  const n = ar.items.length + 1;
  let codigo = `${ar.id}${String(n).padStart(2, '0')}`;
  while (ar.items.some(i => i.codigo === codigo)) codigo += "'";
  return modal({
    title: `Nuevo ítem en ${ar.id}`,
    body: `<label class="lbl">Código</label><input class="input" name="codigo" value="${esc(codigo)}">
      <label class="lbl">Cuestión / acción a verificar</label><textarea class="input" name="texto" rows="3"></textarea>
      <div class="grid2"><label class="lbl">Prioridad<select class="input" name="prioridad"><option>P1</option><option selected>P2</option></select></label>
      <label class="lbl">Peso<input class="input" name="peso" type="number" min="1" max="10" value="3"></label></div>
      <label class="check"><input type="checkbox" name="alBase"> Añadir también al cuestionario para futuras evaluaciones</label>`,
    buttons: [{ label: 'Cancelar', value: null }, {
      label: 'Añadir', cls: 'primary', value: w => {
        const o = leerForm(w);
        if (!o.texto || !o.codigo) { toast('Escribe el código y la cuestión'); return false; }
        return { alBase: o.alBase, item: { id: 'x' + uid(), codigo: o.codigo, texto: o.texto, prioridad: o.prioridad, peso: Number(o.peso) || 1, base: false } };
      },
    }],
  });
}

// ---------------- Resultados ----------------

function evalAnterior(ev) {
  if (!ev.instId || !ev.cabecera.fecha) return null;
  return [...S.eval.values()]
    .filter(e => e.id !== ev.id && e.instId === ev.instId && e.cabecera.fecha && e.cabecera.fecha < ev.cabecera.fecha)
    .sort((a, b) => b.cabecera.fecha.localeCompare(a.cabecera.fecha))[0] || null;
}

export function graficoSVG(areas, u, { ancho = 640, alto = 260, oscuro = false } = {}) {
  const m = { l: 34, r: 8, t: 12, b: 28 };
  const w = ancho - m.l - m.r, h = alto - m.t - m.b;
  const bw = w / areas.length;
  const y = v => m.t + h - (v / 100) * h;
  const col = { pct: '#5b7a3a', pts: '#c08a1e', eje: oscuro ? '#9aa39a' : '#5b645b', txt: oscuro ? '#dfe5df' : '#1f261f' };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" font-family="system-ui,Arial,sans-serif" font-size="12">`;
  for (const v of [0, 25, 50, 75, 100]) {
    s += `<line x1="${m.l}" x2="${ancho - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${col.eje}" stroke-opacity=".2"/>`;
    s += `<text x="${m.l - 4}" y="${y(v) + 4}" text-anchor="end" fill="${col.eje}">${v}</text>`;
  }
  for (const [v, c] of [[u.umbralSat, '#2e7d32'], [u.umbralMej, '#c62828']]) {
    s += `<line x1="${m.l}" x2="${ancho - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  }
  areas.forEach((a, i) => {
    const x = m.l + i * bw + bw * 0.14, bwi = bw * 0.34;
    const hp = a.pct ?? 0, hq = a.puntos ?? 0;
    s += `<rect x="${x}" y="${y(hp)}" width="${bwi}" height="${m.t + h - y(hp)}" fill="${col.pct}" rx="2"/>`;
    s += `<rect x="${x + bwi + 2}" y="${y(hq)}" width="${bwi}" height="${m.t + h - y(hq)}" fill="${col.pts}" rx="2"/>`;
    s += `<text x="${m.l + i * bw + bw / 2}" y="${alto - 10}" text-anchor="middle" fill="${col.txt}" font-weight="600">${esc(a.id)}</text>`;
  });
  s += '</svg>';
  return s;
}

function tabResultados(cont, ev) {
  const { areas, global: g } = calcEval(ev);
  const u = ev.umbrales;
  const ant = evalAnterior(ev);
  const gAnt = ant ? calcEval(ant).global : null;
  const delta = (v, a) => (a == null || v == null ? '' : `<span class="delta ${v >= a ? 'up' : 'down'}">${v >= a ? '▲' : '▼'} ${fmtNum(Math.abs(v - a))}</span>`);
  const alertas = [];
  for (const a of ev.areas) for (const it of a.items) {
    if (it.prioridad === 'P1' && ev.respuestas[it.id]?.r === 'I') alertas.push({ a, it });
  }
  const sinObs = ev.areas.flatMap(a => a.items.filter(it => ev.respuestas[it.id]?.r === 'I' && !ev.respuestas[it.id].obs?.trim()).map(it => ({ a, it })));
  const oscuro = matchMedia('(prefers-color-scheme: dark)').matches;

  cont.innerHTML = `
    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Puntos ponderados</div><div class="kpi-v">${fmtNum(g.puntos)}</div>${badgeNivel(g.nivelPuntos)} ${delta(g.puntos, gAnt?.puntos)}</div>
      <div class="kpi"><div class="kpi-l">% Conformidad</div><div class="kpi-v">${fmtNum(g.pct)} %</div>${badgeNivel(g.nivelPct)} ${delta(g.pct, gAnt?.pct)}</div>
      <div class="kpi"><div class="kpi-l">P1 en I</div><div class="kpi-v ${g.p1EnI ? 'txt-alert' : ''}">${g.p1EnI}</div>${badgeEstado(g.estado)}</div>
    </div>
    ${ant ? `<p class="muted small">Comparado con la evaluación anterior de esta instalación (${fmtFecha(ant.cabecera.fecha)}).</p>` : ''}
    ${g.respondidos < g.total ? `<p class="aviso">Quedan ${g.total - g.respondidos} ítems sin responder. No cuentan en el cálculo.</p>` : ''}
    ${sinObs.length ? `<p class="aviso">${sinObs.length} no conformidades sin observaciones: ${sinObs.map(x => `<a href="#/eval/${ev.id}/area/${x.a.id}">${esc(x.it.codigo)}</a>`).join(', ')}</p>` : ''}
    <div class="card"><h3>Resultado por área</h3>
      <div class="chart">${graficoSVG(areas, u, { oscuro })}</div>
      <div class="legend small"><span><i style="background:#5b7a3a"></i>% conformidad</span><span><i style="background:#c08a1e"></i>Puntos ponderados</span>
        <span><i class="dash" style="border-color:#2e7d32"></i>${u.umbralSat}</span><span><i class="dash" style="border-color:#c62828"></i>${u.umbralMej}</span></div>
    </div>
    <div class="card scroll-x"><table class="tbl">
      <thead><tr><th>Área</th><th>Peso</th><th>C</th><th>I</th><th>NA</th><th>% Conf.</th><th>Nivel</th><th>Puntos</th><th>Nivel</th><th>P1 en I</th><th>Estado</th></tr></thead>
      <tbody>${areas.map(a => `<tr><td><a href="#/eval/${ev.id}/area/${a.id}">${esc(a.id)}. ${esc(a.nombre)}</a></td><td>${a.peso}</td><td>${a.c}</td><td>${a.i}</td><td>${a.na}</td>
        <td>${fmtNum(a.pct)}</td><td>${badgeNivel(a.nivelPct)}</td><td>${fmtNum(a.puntos)}</td><td>${badgeNivel(a.nivelPuntos)}</td>
        <td class="${a.p1EnI ? 'txt-alert' : ''}">${a.p1EnI}</td><td>${badgeEstado(a.estado)}</td></tr>`).join('')}</tbody>
    </table></div>
    ${alertas.length ? `<div class="card alert-card"><h3>⚠ Alertas P1</h3><ul class="plain">${alertas.map(({ a, it }) => `
      <li><a href="#/eval/${ev.id}/area/${a.id}"><strong>${esc(it.codigo)}</strong> ${esc(it.texto)}</a>
      ${ev.respuestas[it.id].obs ? `<div class="muted small">${esc(ev.respuestas[it.id].obs)}</div>` : ''}</li>`).join('')}</ul></div>` : ''}
    ${tarjetaResumenMosler(ev)}`;
}

function tarjetaResumenMosler(ev) {
  const { completas, altos, conAccion } = resumenMosler(ev);
  if (!completas.length) return '';
  const top = completas.slice(0, 3);
  return `<a class="card link" href="#/eval/${ev.id}/riesgos">
    <div class="row between"><h3>Riesgos (Mosler)</h3>${altos ? `<span class="badge alert">${altos} · ${etiquetaRango(umbralAlto(), 1250)}</span>` : ''}</div>
    <p class="muted small">${completas.length} valoraciones · ${conAccion.length} con ER mayor de ${umbralAccion()}.</p>
    <ul class="plain">${top.map(({ a, e, r }) => `<li class="row between"><span>${esc(a.nombre)} · ${esc(e.nombre)}</span>${badgeClase(r)}</li>`).join('')}</ul>
  </a>`;
}

// ---------------- Informe ----------------

function tabInforme(cont, ev) {
  const { global: g } = calcEval(ev);
  const mos = resumenMosler(ev);
  const nMos = mos.completas.length;
  const avisos = [];
  if (!ev.cabecera.fecha) avisos.push('Falta la fecha de la evaluación.');
  if (!ev.cabecera.instalacion) avisos.push('Falta el nombre de la instalación.');
  if (g.respondidos < g.total) avisos.push(`${g.total - g.respondidos} ítems sin responder.`);
  const sinObs = ev.areas.flatMap(a => a.items).filter(it => ev.respuestas[it.id]?.r === 'I' && !ev.respuestas[it.id].obs?.trim()).length;
  if (sinObs) avisos.push(`${sinObs} no conformidades sin observaciones (son obligatorias).`);

  cont.innerHTML = `
    ${avisos.length ? `<div class="aviso"><strong>Revisa antes de generar:</strong><ul>${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : '<p class="ok-msg">✓ Evaluación completa.</p>'}
    <form class="form" id="inf" onsubmit="return false">
      <label class="lbl">Conclusiones y propuestas</label>
      <textarea class="input" name="conclusiones" rows="6" placeholder="Valoración general, medidas propuestas, prioridades…">${esc(ev.conclusiones)}</textarea>
      <label class="lbl">Lugar de firma</label>
      <input class="input" name="lugarFirma" value="${esc(ev.lugarFirma)}" placeholder="Ej.: Madrid">
      <label class="check"><input type="checkbox" id="optMosler" ${nMos ? 'checked' : 'disabled'}> <span>Incluir el análisis de riesgos (Mosler)<br><span class="muted small">${nMos
        ? `${nMos} valoraciones (amenaza × elemento). Solo se incluyen las completas.`
        : 'No has valorado ninguna amenaza: el informe será solo de la evaluación.'}</span></span></label>
      <label class="check"><input type="checkbox" id="optAcciones" checked> Incluir el plan de acciones derivadas</label>
      <label class="check"><input type="checkbox" id="optDetalle" checked> Incluir la tabla completa de los ${g.total} ítems</label>
      <label class="check"><input type="checkbox" id="optFotos" checked> Incluir las fotos</label>
      <label class="check"><input type="checkbox" id="optFotosC"> Incluir también fotos de ítems conformes</label>
    </form>
    <button class="btn primary big block" id="gen">Generar informe Word</button>
    <label class="check"><input type="checkbox" id="cerrada" ${ev.cerrada ? 'checked' : ''}> Evaluación cerrada</label>
    <p class="muted small">El informe se genera en el propio móvil. Después puedes enviarlo por el medio autorizado o guardarlo.</p>`;
  cont.querySelector('#inf').addEventListener('input', e => {
    if (e.target.name) { ev[e.target.name] = e.target.value; guardarLuego('eval', ev); }
  });
  cont.querySelector('#cerrada').onchange = e => { ev.cerrada = e.target.checked; guardar('eval', ev); };
  cont.querySelector('#gen').onclick = async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    b.textContent = 'Generando…';
    try {
      const { generarInforme } = await import('../informe.js');
      const blob = await generarInforme(ev, {
        detalle: cont.querySelector('#optDetalle').checked,
        mosler: cont.querySelector('#optMosler').checked,
        acciones: cont.querySelector('#optAcciones').checked,
        fotos: cont.querySelector('#optFotos').checked,
        fotosC: cont.querySelector('#optFotosC').checked,
      });
      const nombre = `Informe_SEGINS_${(ev.cabecera.instalacion || 'instalacion').replace(/[^\wÀ-ÿ]+/g, '_')}_${ev.cabecera.fecha || hoyISO()}.docx`;
      await compartirODescargar(blob, nombre);
    } catch (err) {
      console.error(err);
      toast('No se pudo generar el informe: ' + err.message, 5000);
    } finally {
      b.disabled = false;
      b.textContent = 'Generar informe Word';
    }
  };
}

// ---------------- Riesgos (método Mosler: amenaza × elemento) ----------------

const colorClase = (nombre) => clases().find(c => c.nombre === nombre)?.color || '#888';

const badgeClase = (r) => r?.completo
  ? `<span class="badge ${r.clase.cls}">${r.ER} · ${esc(r.clase.nombre)}</span>`
  : '<span class="badge none">Sin valorar</span>';

// Nombre de las clases comprendidas entre dos umbrales: «Normal», «Elevado o más»…
function etiquetaRango(desde, hasta) {
  const cs = clases().filter(c => c.max > desde && c.max <= hasta);
  return cs.length > 1 ? `${cs[0].nombre} o más` : cs[0]?.nombre || '';
}

const textoEscala = () => clases().map((c, i) => `${c.nombre} ${i ? `${clases()[i - 1].max + 1}–${c.max}` : `≤ ${c.max}`}`).join(' · ');

// Ranking horizontal de los riesgos más altos (amenaza · elemento), con las bandas de clase de fondo.
export function graficoRiesgos(completas, { ancho = 640, oscuro = false, max = 12 } = {}) {
  const lista = completas.slice(0, max);
  const estrecho = ancho < 500;
  const fila = 26, m = { l: estrecho ? 150 : 250, r: 44, t: 22, b: 8 };
  const maxC = estrecho ? 20 : 40;
  const alto = m.t + m.b + lista.length * fila;
  const w = ancho - m.l - m.r;
  const x = v => m.l + (v / 1250) * w;
  const txt = oscuro ? '#dfe5df' : '#1f261f';
  const eje = oscuro ? '#9aa39a' : '#5b645b';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" font-family="system-ui,Arial,sans-serif" font-size="12">`;
  let desde = 0;
  for (const c of clases()) {
    s += `<rect x="${x(desde)}" y="${m.t - 4}" width="${x(c.max) - x(desde)}" height="${alto - m.t - m.b + 4}" fill="${c.color}" fill-opacity=".08"/>`;
    s += `<text x="${x(c.max)}" y="${m.t - 8}" text-anchor="end" fill="${eje}" font-size="10">${c.max}</text>`;
    desde = c.max;
  }
  lista.forEach(({ a, e, r }, i) => {
    const y = m.t + i * fila;
    const t = `${a.nombre} · ${e.nombre}`;
    const nombre = t.length > maxC ? t.slice(0, maxC - 1) + '…' : t;
    s += `<text x="${m.l - 8}" y="${y + fila / 2 + 4}" text-anchor="end" fill="${txt}">${esc(nombre)}</text>`;
    s += `<rect x="${m.l}" y="${y + 4}" width="${Math.max(2, x(r.ER) - m.l)}" height="${fila - 8}" rx="3" fill="${r.clase.color}"/>`;
    s += `<text x="${x(r.ER) + 6}" y="${y + fila / 2 + 4}" fill="${txt}" font-weight="700">${r.ER}</text>`;
  });
  return s + '</svg>';
}

// Matriz amenazas × elementos con el ER de cada cruce coloreado por su clase.
function matrizRiesgos(ev) {
  const elems = ev.moslerElementos;
  const conDatos = ev.mosler.filter(a => elems.some(e => calcFila(a.valores?.[e.id]).completo));
  if (!conDatos.length) return '';
  return `<div class="card"><h3>Matriz de riesgos</h3>
    <div class="scroll-x"><table class="matriz">
      <thead><tr><th></th>${elems.map(e => `<th><span>${esc(e.nombre)}</span></th>`).join('')}</tr></thead>
      <tbody>${conDatos.map(a => `<tr><th><button type="button" class="linkbtn" data-ir="${esc(a.id)}">${esc(a.nombre)}</button></th>${elems.map(e => {
        const r = calcFila(a.valores?.[e.id]);
        return r.completo ? `<td style="background:${r.clase.color}${r.clase.cls === 'ok' ? '26' : '40'}" title="${esc(e.nombre)}: ${r.clase.nombre}">${r.ER}</td>` : '<td class="vacia"></td>';
      }).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <div class="legend small">${clases().map(c => `<span><i style="background:${c.color}"></i>${c.nombre}</span>`).join('')}</div>
  </div>`;
}

function tablaAmenaza(ev, a) {
  const prop = vPropuesta(ev, a);
  return `<div class="scroll-x"><table class="mosler">
    <thead><tr><th class="el">Elemento</th>${CLAVES.map(k => `<th><button type="button" class="col" data-col="${k}" title="Poner el mismo valor de ${k} a todos los elementos">${k}</button></th>`).join('')}<th>C</th><th>PR</th><th>ER</th><th>Riesgo</th></tr></thead>
    <tbody>${ev.moslerElementos.map(e => {
      const v = a.valores?.[e.id] || {};
      const r = calcFila(v);
      return `<tr data-el="${esc(e.id)}"><th class="el">${esc(e.nombre)}${r.completo ? `<br><span class="badge ${r.clase.cls} er-mini">${r.ER} · ${esc(r.clase.nombre)}</span>` : ''}</th>${CLAVES.map(k => `<td><select data-k="${k}" aria-label="${k} ${esc(e.nombre)}">
          <option value=""></option>${[1, 2, 3, 4, 5].map(n => `<option ${v[k] === n ? 'selected' : ''}>${n}</option>`).join('')}</select></td>`).join('')}
        <td>${r.C ?? ''}</td><td>${r.PR ?? ''}</td><td><b>${r.ER ?? ''}</b></td>
        <td>${r.completo ? `<span class="badge ${r.clase.cls}">${esc(r.clase.nombre)}</span>` : ''}</td></tr>`;
    }).join('')}</tbody>
  </table></div>
  <p class="small muted">${prop
    ? `V orientativa según el cuestionario (áreas ${prop.areas.join(', ')}: ${fmtNum(prop.puntos)} pts${prop.p1 ? `, ${prop.p1} P1 no conforme` : ''}): <strong>${prop.v}</strong>. <button type="button" class="linkbtn" data-vprop="${prop.v}">Ponerla en los elementos sin V</button>`
    : 'Pulsa la letra de una columna para dar el mismo valor a todos los elementos.'}</p>`;
}

function tarjetaAmenaza(ev, a, abierta) {
  const max = maxAmenaza(ev, a);
  const valorados = ev.moslerElementos.filter(e => calcFila(a.valores?.[e.id]).completo).length;
  return `<details class="card amen" data-am="${esc(a.id)}" ${abierta ? 'open' : ''}>
    <summary class="row between"><span><strong>${esc(a.nombre)}</strong><br><span class="muted small">${valorados}/${ev.moslerElementos.length} elementos${max ? ` · máx. en ${esc(max.e.nombre)}` : ''}</span></span>${max ? badgeClase(max) : '<span class="badge none">Sin valorar</span>'}</summary>
    ${abierta ? tablaAmenaza(ev, a) : ''}
    <textarea class="input" data-notas="1" rows="2" placeholder="Justificación / medidas propuestas">${esc(a.notas)}</textarea>
    <div class="row gap"><button type="button" class="btn grow" data-editar="1">Editar</button><button type="button" class="btn danger" data-quitaram="1">Quitar</button></div>
  </details>`;
}

async function dialogoAmenaza(ev, a = null) {
  return modal({
    title: a ? 'Editar amenaza' : 'Nueva amenaza',
    body: `<label class="lbl">Amenaza</label><input class="input" name="nombre" value="${esc(a?.nombre || '')}" placeholder="Ej.: Dron hostil">
      <label class="lbl">Grupo</label><select class="input" name="grupo">${GRUPOS.map(g => `<option ${(a?.grupo || GRUPOS[1]) === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
      <label class="lbl">Áreas del cuestionario que orientan su vulnerabilidad</label>
      <div class="chips">${ev.areas.map(ar => `<label class="chip"><input type="checkbox" name="area" value="${esc(ar.id)}" ${a?.areas.includes(ar.id) ? 'checked' : ''}> ${esc(ar.id)}. ${esc(ar.nombre)}</label>`).join('')}</div>
      ${a ? '' : '<label class="check"><input type="checkbox" name="alBase"> Añadir también a la lista para futuras evaluaciones</label>'}`,
    buttons: [{ label: 'Cancelar', value: null }, {
      label: a ? 'Guardar' : 'Añadir', cls: 'primary', value: w => {
        const nombre = w.querySelector('[name=nombre]').value.trim();
        if (!nombre) { toast('Escribe el nombre de la amenaza'); return false; }
        return {
          nombre, grupo: w.querySelector('[name=grupo]').value,
          areas: [...w.querySelectorAll('[name=area]:checked')].map(x => x.value),
          alBase: !!w.querySelector('[name=alBase]')?.checked,
        };
      },
    }],
  });
}

async function dialogoElementos(ev) {
  const filas = (lista) => lista.map(e => `<div class="row gap el-ed" data-elid="${esc(e.id)}"><input class="input" value="${esc(e.nombre)}" aria-label="Elemento"><button type="button" class="icon-btn" data-quitar-el="1" aria-label="Quitar">✕</button></div>`).join('');
  return modal({
    title: 'Elementos de la instalación',
    body: `<p class="muted small">Cada amenaza se valora sobre estos elementos. Al quitar uno se borran sus valoraciones.</p>
      <div id="els">${filas(ev.moslerElementos)}</div>
      <button type="button" class="btn block" id="addel">＋ Añadir elemento</button>
      <label class="check"><input type="checkbox" name="defecto"> Usar esta lista en las evaluaciones nuevas</label>`,
    onOpen: w => w.addEventListener('click', e => {
      if (e.target.id === 'addel') {
        w.querySelector('#els').insertAdjacentHTML('beforeend', filas([nuevoElemento('')]));
        w.querySelector('#els .el-ed:last-child input').focus();
      } else if (e.target.closest('[data-quitar-el]')) e.target.closest('.el-ed').remove();
    }),
    buttons: [{ label: 'Cancelar', value: null }, {
      label: 'Guardar', cls: 'primary', value: w => ({
        lista: [...w.querySelectorAll('.el-ed')].map(d => ({ id: d.dataset.elid, nombre: d.querySelector('input').value.trim() })).filter(e => e.nombre),
        defecto: w.querySelector('[name=defecto]').checked,
      }),
    }],
  });
}

async function dialogoImportar() {
  return modal({
    title: 'Importar desde Excel',
    body: `<p class="small">Selecciona en Excel la tabla Mosler completa (con las filas de título de cada amenaza: <em>AMENAZA · F · S · I=FxS · P · E · D=PxE · C=I+D · A · V · PR=AxV · ER=CxPR · RIESGO</em>), cópiala y pégala aquí. Se rellenan las amenazas y los elementos que coincidan y se crean los que falten.</p>
      <textarea class="input" name="tabla" rows="8" placeholder="Pega aquí la tabla"></textarea>`,
    onOpen: w => setTimeout(() => w.querySelector('textarea').focus(), 50),
    buttons: [{ label: 'Cancelar', value: null }, { label: 'Importar', cls: 'primary', value: w => w.querySelector('textarea').value }],
  });
}

function tabRiesgos(cont, ev) {
  if (asegurarMosler(ev, S.eval.values(), S.config)) guardar('eval', ev);
  const abiertas = new Set();
  const oscuro = matchMedia('(prefers-color-scheme: dark)').matches;

  const resumen = () => {
    const { completas, altos, conAccion } = resumenMosler(ev);
    const k = (n, l, cls = '') => `<div class="kpi"><div class="kpi-l">${l}</div><div class="kpi-v ${cls}">${n}</div></div>`;
    return completas.length ? `
      <div class="kpis">${k(completas.length, 'Valoraciones')}${k(conAccion.length - altos, etiquetaRango(umbralAccion(), umbralAlto()))}${k(altos, etiquetaRango(umbralAlto(), 1250), altos ? 'txt-alert' : '')}</div>
      ${matrizRiesgos(ev)}
      <div class="card"><h3>Riesgos más altos</h3><div class="chart">${graficoRiesgos(completas, { oscuro, max: 10, ancho: Math.max(340, Math.min(640, (cont.clientWidth || 380) - 30)) })}</div></div>`
      : '<p class="aviso">Aún no hay valoraciones. Abre una amenaza y puntúa sus elementos, o importa tu tabla de Excel.</p>';
  };

  const pintar = () => {
    cont.innerHTML = `
      <p class="muted small">Método Mosler: ER = (F×S + P×E) × (A×V), de 2 a 1250. Cada amenaza se valora sobre cada elemento de la instalación. Clasificación: ${esc(textoEscala())} (se cambia en Ajustes).</p>
      <div class="row gap wrap"><button type="button" class="btn grow" id="elementos">Elementos (${ev.moslerElementos.length})</button><button type="button" class="btn grow" id="importar">Importar desde Excel</button></div>
      <div id="resumen">${resumen()}</div>
      ${GRUPOS.concat([...new Set(ev.mosler.map(a => a.grupo))].filter(g => !GRUPOS.includes(g))).map(g => {
        const del = ev.mosler.filter(a => (a.grupo || GRUPOS[1]) === g);
        return del.length ? `<h3 class="sec">${esc(g)}</h3>${del.map(a => tarjetaAmenaza(ev, a, abiertas.has(a.id))).join('')}` : '';
      }).join('')}
      <button type="button" class="btn block" id="addam">＋ Añadir amenaza</button>
      <details class="card"><summary><strong>Escala de valoración</strong></summary>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>Criterio</th>${[1, 2, 3, 4, 5].map(n => `<th>${n}</th>`).join('')}</tr></thead>
        <tbody>${CRITERIOS.map(c => `<tr><td><strong>${c.k}</strong> ${c.nombre}</td>${c.escala.map(e => `<td>${e}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="small">Riesgo (ER): ${esc(textoEscala())}.</p>
      </details>`;
  };
  pintar();

  const tarjeta = (a) => {
    cont.querySelector(`[data-am="${CSS.escape(a.id)}"]`).outerHTML = tarjetaAmenaza(ev, a, true);
    cont.querySelector('#resumen').innerHTML = resumen();
  };

  cont.addEventListener('toggle', e => {
    const d = e.target.closest?.('[data-am]');
    if (!d || e.target !== d) return;
    const a = ev.mosler.find(x => x.id === d.dataset.am);
    if (d.open && !abiertas.has(a.id)) { abiertas.add(a.id); d.outerHTML = tarjetaAmenaza(ev, a, true); }
    else if (!d.open) abiertas.delete(a.id);
  }, true);

  cont.addEventListener('change', async e => {
    const sel = e.target.closest('select[data-k]');
    if (!sel) return;
    const card = sel.closest('[data-am]');
    const a = ev.mosler.find(x => x.id === card.dataset.am);
    const el = sel.closest('[data-el]').dataset.el;
    const v = (a.valores ||= {})[el] ||= {};
    if (sel.value) v[sel.dataset.k] = +sel.value; else delete v[sel.dataset.k];
    tarjeta(a);
    await guardar('eval', ev);
  });

  cont.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const card = b.closest('[data-am]');
    const a = card && ev.mosler.find(x => x.id === card.dataset.am);
    if (b.dataset.ir) {
      abiertas.add(b.dataset.ir);
      pintar();
      cont.querySelector(`[data-am="${CSS.escape(b.dataset.ir)}"]`)?.scrollIntoView({ block: 'start' });
    } else if (b.dataset.col && a) {
      const k = b.dataset.col;
      const c = CRITERIOS.find(x => x.k === k);
      const n = await modal({
        title: `${k} · ${c.nombre} en todos los elementos`,
        body: `<p class="small muted">${c.ayuda}. Se aplica a los ${ev.moslerElementos.length} elementos de «${esc(a.nombre)}».</p>
          <div class="seg5">${[1, 2, 3, 4, 5].map(x => `<button type="button" data-n="${x}" title="${c.escala[x - 1]}">${x}</button>`).join('')}</div>`,
        onOpen: w => w.querySelectorAll('[data-n]').forEach(x => x.addEventListener('click', () => { w.dataset.n = x.dataset.n; w.querySelector('.modal-actions .primary').click(); })),
        buttons: [{ label: 'Cancelar', value: null }, { label: 'Vaciar columna', value: 'vaciar' }, { label: 'Aplicar', cls: 'primary', value: w => (w.dataset.n ? +w.dataset.n : false) }],
      });
      if (!n) return;
      for (const el of ev.moslerElementos) {
        const v = (a.valores ||= {})[el.id] ||= {};
        if (n === 'vaciar') delete v[k]; else v[k] = n;
      }
      tarjeta(a);
      await guardar('eval', ev);
    } else if (b.dataset.vprop && a) {
      for (const el of ev.moslerElementos) {
        const v = (a.valores ||= {})[el.id] ||= {};
        if (v.V == null) v.V = +b.dataset.vprop;
      }
      tarjeta(a);
      await guardar('eval', ev);
    } else if (b.dataset.editar && a) {
      const v = await dialogoAmenaza(ev, a);
      if (!v) return;
      Object.assign(a, { nombre: v.nombre, grupo: v.grupo, areas: v.areas });
      await guardar('eval', ev);
      pintar();
    } else if (b.dataset.quitaram && a) {
      if (!(await confirmar(`¿Quitar «${a.nombre}» y sus valoraciones de esta evaluación?`, 'Quitar', 'danger'))) return;
      ev.mosler = ev.mosler.filter(x => x !== a);
      ev.acciones = (ev.acciones || []).filter(x => !(x.origen === 'mosler' && x.ref === a.id));
      await guardar('eval', ev);
      pintar();
    } else if (b.id === 'addam') {
      const v = await dialogoAmenaza(ev);
      if (!v) return;
      const nueva = nuevaAmenaza(v.nombre, v.grupo, v.areas);
      ev.mosler.push(nueva);
      if (v.alBase) {
        S.config.amenazas = [...(S.config.amenazas || AMENAZAS_BASE), { id: nueva.id, nombre: v.nombre, grupo: v.grupo, areas: v.areas }];
        await guardar('config', S.config);
      }
      await guardar('eval', ev);
      abiertas.add(nueva.id);
      pintar();
      cont.querySelector(`[data-am="${CSS.escape(nueva.id)}"]`)?.scrollIntoView({ block: 'start' });
    } else if (b.id === 'elementos') {
      const v = await dialogoElementos(ev);
      if (!v) return;
      const quedan = new Set(v.lista.map(x => x.id));
      for (const a2 of ev.mosler) for (const id of Object.keys(a2.valores || {})) if (!quedan.has(id)) delete a2.valores[id];
      ev.moslerElementos = v.lista;
      if (v.defecto) { S.config.elementosMosler = v.lista.map(x => x.nombre); await guardar('config', S.config); }
      await guardar('eval', ev);
      pintar();
    } else if (b.id === 'importar') {
      const texto = await dialogoImportar();
      if (!texto?.trim()) return;
      const tabla = leerTablaPegada(texto);
      if (!tabla.amenazas.length) { toast('No he encontrado ninguna tabla Mosler en el texto pegado.', 4000); return; }
      const n = aplicarTabla(ev, tabla);
      await guardar('eval', ev);
      pintar();
      toast(`Importadas ${tabla.amenazas.length} amenazas (${n} valoraciones).`, 4000);
    }
  });

  cont.addEventListener('input', e => {
    const card = e.target.closest('[data-am]');
    if (!card || !e.target.dataset.notas) return;
    ev.mosler.find(x => x.id === card.dataset.am).notas = e.target.value;
    guardarLuego('eval', ev);
  });
}

// ---------------- Acciones derivadas ----------------

const CLS_ESTADO_ACC = { Pendiente: 'warn', 'En curso': 'info', Cumplida: 'ok' };

function tarjetaAccion(ev, a) {
  const vencida = a.estado !== 'Cumplida' && a.plazo && a.plazo < hoyISO();
  const editablePrio = a.tipo !== 'item';
  return `<div class="card accion ${a.estado === 'Cumplida' ? 'hecha' : ''}" data-tipo="${a.tipo}" data-clave="${esc(a.clave)}">
    <div class="row between wrap">
      <span class="row gap">${a.tipo === 'item'
        ? `<a href="#/eval/${ev.id}/area/${a.areaId}" class="badge info">${esc(a.origen)}</a>`
        : `<span class="badge none">${esc(a.origen)}</span>`}
        ${editablePrio
          ? `<select class="input mini" data-k="prioridad" aria-label="Prioridad"><option ${a.prioridad === 'P1' ? 'selected' : ''}>P1</option><option ${a.prioridad === 'P2' ? 'selected' : ''}>P2</option></select>`
          : `<span class="badge ${a.prioridad === 'P1' ? 'p1' : 'p2'}">${a.prioridad}</span>`}</span>
      ${vencida ? '<span class="badge alert">Plazo vencido</span>' : ''}
    </div>
    <textarea class="input" data-k="texto" rows="2" placeholder="Describe la acción">${esc(a.texto)}</textarea>
    <div class="grid2">
      <input class="input" data-k="responsable" value="${esc(a.responsable)}" placeholder="Responsable">
      <input class="input" type="date" data-k="plazo" value="${esc(a.plazo)}" aria-label="Plazo">
    </div>
    <div class="row between gap">
      <div class="seg3">${ESTADOS.map(e => `<button type="button" data-estado="${e}" class="${a.estado === e ? 'on ' + CLS_ESTADO_ACC[e] : ''}">${e}</button>`).join('')}</div>
      ${a.tipo !== 'item' ? '<button type="button" class="icon-btn" data-borrar-acc="1" aria-label="Quitar acción">✕</button>' : ''}
    </div>
  </div>`;
}

function tabAcciones(cont, ev) {
  ev.acciones ||= [];
  const pintar = () => {
    const plan = planAcciones(ev);
    const cuenta = Object.fromEntries(ESTADOS.map(e => [e, plan.filter(a => a.estado === e).length]));
    const p1 = plan.filter(a => a.prioridad === 'P1' && a.estado !== 'Cumplida').length;
    const sugeridas = riesgosSugeridos(ev);
    const generales = accionesGenerales(ev);
    const prox = fechaProxima(ev);
    const yaProgramada = prox && [...S.agenda.values()].some(e => e.evalOrigen === ev.id);
    cont.innerHTML = `
      <p class="muted small">Acciones que se desprenden de la evaluación. Las de los ítems no conformes se crean solas al marcar I; puedes editar el texto, el responsable, el plazo y el estado.</p>
      <div class="kpis">
        <div class="kpi"><div class="kpi-l">Pendientes</div><div class="kpi-v">${cuenta.Pendiente}</div></div>
        <div class="kpi"><div class="kpi-l">En curso</div><div class="kpi-v">${cuenta['En curso']}</div></div>
        <div class="kpi"><div class="kpi-l">Cumplidas</div><div class="kpi-v">${cuenta.Cumplida}</div></div>
      </div>
      ${p1 ? `<p class="aviso">${p1 === 1 ? '1 acción' : `${p1} acciones`} de prioridad P1 sin cumplir.</p>` : ''}
      ${generales.length ? `<div class="card"><h3>Acciones generales</h3><ul class="viñetas">${generales.map(g => `<li>${esc(g)}</li>`).join('')}</ul>
        ${prox && ev.instId ? (yaProgramada
          ? '<p class="small muted">Próxima evaluación ya programada en la agenda.</p>'
          : `<button type="button" class="btn block" id="programar">📅 Programar la próxima evaluación (${fmtFecha(prox.fecha)})</button>`) : ''}
      </div>` : ''}
      ${sugeridas.length ? `<div class="card"><h3>Sugeridas por el análisis de riesgos</h3>
        ${sugeridas.map(({ a, filas }) => `<div class="row between gap sug"><span><strong>${esc(a.nombre)}</strong> ${badgeClase(filas[0].r)}<br><span class="muted small">${filas.map(f => esc(f.e.nombre)).join(', ')}</span></span><button type="button" class="btn" data-sug="${esc(a.id)}">Añadir</button></div>`).join('')}
      </div>` : ''}
      <h3 class="sec">Plan de acciones (${plan.length})</h3>
      ${plan.length ? plan.map(a => tarjetaAccion(ev, a)).join('') : '<div class="card"><p class="muted">Aún no hay acciones: aparecerán al marcar ítems como No conforme.</p></div>'}
      <button type="button" class="btn block" id="addacc">＋ Añadir acción propia</button>`;
  };
  pintar();

  const localizar = (card) => {
    const { tipo, clave } = card.dataset;
    if (tipo === 'item') {
      const r = ev.respuestas[clave];
      return {
        get: k => ({ texto: r.accion, estado: r.estadoAccion || 'Pendiente' }[k] ?? r[k]),
        set: (k, v) => { r[{ texto: 'accion', estado: 'estadoAccion' }[k] || k] = v; },
      };
    }
    const a = ev.acciones.find(x => x.id === clave);
    return { get: k => a[k], set: (k, v) => { a[k] = v; }, a };
  };

  cont.addEventListener('input', e => {
    const card = e.target.closest('[data-clave]');
    const k = e.target.dataset.k;
    if (!card || !k) return;
    localizar(card).set(k, e.target.value);
    guardarLuego('eval', ev);
  });
  cont.addEventListener('change', e => {
    if (e.target.dataset.k === 'plazo' || e.target.dataset.k === 'prioridad') { guardar('eval', ev); pintar(); }
  });

  cont.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const card = b.closest('[data-clave]');
    if (b.dataset.estado && card) {
      localizar(card).set('estado', b.dataset.estado);
      await guardar('eval', ev);
      pintar();
    } else if (b.dataset.borrarAcc && card) {
      if (!(await confirmar('¿Quitar esta acción del plan?', 'Quitar', 'danger'))) return;
      ev.acciones = ev.acciones.filter(x => x.id !== card.dataset.clave);
      await guardar('eval', ev);
      pintar();
    } else if (b.dataset.sug) {
      const f = riesgosSugeridos(ev).find(x => x.a.id === b.dataset.sug);
      if (f) ev.acciones.push(accionDeRiesgo(ev, f.a, f.filas));
      await guardar('eval', ev);
      pintar();
    } else if (b.id === 'addacc') {
      const a = accionManual(ev);
      ev.acciones.push(a);
      await guardar('eval', ev);
      pintar();
      const nueva = cont.querySelector(`[data-clave="${a.id}"] textarea`);
      nueva?.scrollIntoView({ block: 'center' });
      nueva?.focus();
    } else if (b.id === 'programar') {
      const prox = fechaProxima(ev);
      await guardar('agenda', {
        id: 'a' + uid(), fecha: prox.fecha, hora: '', tipo: 'Evaluación / visita', instId: ev.instId,
        titulo: `Próxima evaluación SEGINS · ${ev.cabecera.instalacion || ''}`, notas: 'Verificar el cumplimiento del plan de acciones de la evaluación anterior.',
        hecho: false, evalOrigen: ev.id,
      });
      toast('Añadida a la agenda');
      pintar();
    }
  });
}
