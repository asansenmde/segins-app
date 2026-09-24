// Evaluaciones: lista, datos, cuestionario por áreas, resultados e informe.
import { S, guardar, guardarLuego, borrar, evalsOrdenadas, instsOrdenadas } from '../state.js';
import { esc, uid, fmtFecha, hoyISO, modal, confirmar, toast, leerForm, compartirODescargar } from '../ui.js';
import { calcEval, calcArea, fmtNum } from '../scoring.js';
import { procesarImagen, guardarFoto, urlFoto, verFoto, borrarFoto, elegirImagenes } from '../fotos.js';
import { CAMPOS_CABECERA, badgeNivel, badgeEstado, barra, vacio } from './comun.js';

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
  await guardar('eval', ev);
  location.hash = `#/eval/${ev.id}/datos`;
}

// ---------------- Detalle (pestañas) ----------------

export function detalle(main, id, tab = 'datos') {
  const ev = S.eval.get(id);
  if (!ev) { main.innerHTML = vacio('Evaluación no encontrada.'); return { titulo: 'Evaluación', atras: true }; }
  const { global: g } = calcEval(ev);
  const tabs = [['datos', 'Datos'], ['areas', 'Cuestionario'], ['resultados', 'Resultados'], ['informe', 'Informe']];
  main.innerHTML = `
    <div class="evhead">
      <div><strong>${esc(ev.cabecera.instalacion || 'Sin nombre')}</strong>
        <span class="muted small">${ev.cabecera.fecha ? fmtFecha(ev.cabecera.fecha) : 'sin fecha'}</span></div>
      ${barra(g.respondidos, g.total)}
      <div class="muted small">${g.respondidos}/${g.total} respondidos · ${g.i} no conformes${g.p1EnI ? ` · <span class="txt-alert">${g.p1EnI} P1 en I</span>` : ''}</div>
    </div>
    <div class="tabs">${tabs.map(([t, n]) => `<a href="#/eval/${id}/${t}" class="${t === tab ? 'on' : ''}">${n}</a>`).join('')}</div>
    <div id="tab"></div>`;
  main.querySelectorAll('.tabs a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); location.replace(a.getAttribute('href'));
  }));
  const cont = main.querySelector('#tab');
  ({ datos: tabDatos, areas: tabAreas, resultados: tabResultados, informe: tabInforme })[tab](cont, ev);
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
    ${esI ? `<div class="grid2">
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
      ${ev.respuestas[it.id].obs ? `<div class="muted small">${esc(ev.respuestas[it.id].obs)}</div>` : ''}</li>`).join('')}</ul></div>` : ''}`;
}

// ---------------- Informe ----------------

function tabInforme(cont, ev) {
  const { global: g } = calcEval(ev);
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
