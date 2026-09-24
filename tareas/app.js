// Tareas NLT: gestor de tareas con fecha límite para finalizar (NLT).
// Todo se guarda en este navegador (localStorage). Sin servidor.

const CLAVE = 'tareas-nlt-v1';
const ESTADOS = [['pendiente', 'Pendiente'], ['curso', 'En curso'], ['espera', 'En espera'], ['hecha', 'Hecha']];
const NOMBRE_ESTADO = Object.fromEntries(ESTADOS);
const PRIOS = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const ORDEN_PRIO = { alta: 0, media: 1, baja: 2 };
const REPETIR = { '': 'No se repite', diaria: 'Cada día', semanal: 'Cada semana', mensual: 'Cada mes', anual: 'Cada año' };
const CATS_BASE = ['Evaluaciones SEGINS', 'Visitas', 'Informes', 'Reuniones', 'Administración', 'Formación', 'Personal'];
const VISTAS = { nlt: 'Mis NLT', tablero: 'Tablero', calendario: 'Calendario', actividad: 'Lo que hago', ajustes: 'Ajustes' };

const $ = (s, el = document) => el.querySelector(s);
const main = $('#main');
const dlg = $('#dlg');

// ---------- Datos ----------
let datos = cargar();

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && Array.isArray(d.tareas)) return normalizar(d);
  } catch { /* datos corruptos o almacenamiento bloqueado: se empieza de cero */ }
  return normalizar({});
}

function normalizar(d) {
  return {
    tareas: (d.tareas || []).map(t => ({
      notas: '', categoria: '', prioridad: 'media', nlt: '', hora: '', estado: 'pendiente', repetir: '',
      hecha: null, ...t,
      subtareas: t.subtareas || [], tiempo: t.tiempo || [], registro: t.registro || [],
    })),
    categorias: d.categorias?.length ? d.categorias : [...CATS_BASE],
    ajustes: { avisoDias: 3, tema: 'auto', ultimoAviso: '', ...(d.ajustes || {}) },
    activo: d.activo || null,
  };
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch { toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado'); }
}

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const buscar = id => datos.tareas.find(t => t.id === id);

// ---------- Utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoy = () => iso(new Date());
const aFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const diasHasta = s => Math.round((utc(s) - utc(hoy())) / 864e5);
const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); };

function fmtFecha(s, conDia = true) {
  if (!s) return '';
  const d = aFecha(s);
  const o = { day: 'numeric', month: 'short' };
  if (conDia) o.weekday = 'short';
  if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return d.toLocaleDateString('es-ES', o);
}

function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`;
}

const tiempoTotal = t => t.tiempo.reduce((a, s) => a + (s.fin - s.inicio), 0)
  + (datos.activo?.id === t.id ? Date.now() - datos.activo.inicio : 0);

function toast(txt) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.append(el); }
  el.textContent = txt;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 3200);
}

function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Reglas de NLT ----------
function urgencia(t) {
  if (t.estado === 'hecha') {
    const aTiempo = !t.nlt || !t.hecha || iso(new Date(t.hecha)) <= t.nlt;
    return { cls: 'none', grupo: 'hechas', txt: aTiempo ? 'Hecha' : 'Hecha fuera de NLT' };
  }
  if (!t.nlt) return { cls: 'none', grupo: 'sin', txt: 'Sin NLT' };
  const d = diasHasta(t.nlt);
  if (d < 0) return { cls: 'bad', grupo: 'vencidas', txt: `Vencida hace ${-d} d` };
  if (d === 0) return { cls: 'bad', grupo: 'hoy', txt: 'Vence hoy' };
  const txt = d === 1 ? 'Vence mañana' : `Quedan ${d} d`;
  if (d <= datos.ajustes.avisoDias) return { cls: 'warn', grupo: d <= 7 ? 'semana' : 'despues', txt };
  return { cls: 'ok', grupo: d <= 7 ? 'semana' : 'despues', txt };
}

const ordenar = (a, b) =>
  (a.nlt || '9999').localeCompare(b.nlt || '9999') || (a.hora || '99').localeCompare(b.hora || '99')
  || ORDEN_PRIO[a.prioridad] - ORDEN_PRIO[b.prioridad] || a.titulo.localeCompare(b.titulo);

function siguienteNlt(nlt, rep) {
  const avanzar = s => {
    if (rep === 'diaria') return sumarDias(s, 1);
    if (rep === 'semanal') return sumarDias(s, 7);
    const d = aFecha(s), dia = d.getDate();
    const meses = rep === 'anual' ? 12 : 1;
    const n = new Date(d.getFullYear(), d.getMonth() + meses, 1);
    n.setDate(Math.min(dia, new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate()));
    return iso(n);
  };
  let s = avanzar(nlt);
  while (s < hoy()) s = avanzar(s);
  return s;
}

function marcarHecha(id, hecha) {
  const t = buscar(id);
  if (!t) return;
  if (hecha) {
    if (datos.activo?.id === id) pararTiempo();
    t.estado = 'hecha';
    t.hecha = new Date().toISOString();
    if (t.repetir && t.nlt) {
      const sig = {
        ...structuredClone(t), id: nuevoId(), estado: 'pendiente', hecha: null, creada: new Date().toISOString(),
        nlt: siguienteNlt(t.nlt, t.repetir), tiempo: [], registro: [],
      };
      sig.subtareas.forEach(s => { s.ok = false; });
      datos.tareas.push(sig);
      toast(`Hecha. Siguiente NLT: ${fmtFecha(sig.nlt)}`);
    } else {
      toast('Tarea hecha');
    }
  } else {
    t.estado = 'pendiente';
    t.hecha = null;
  }
  guardar();
}

function cambiarEstado(id, estado) {
  const t = buscar(id);
  if (!t || t.estado === estado) return;
  if (estado === 'hecha') return marcarHecha(id, true);
  if (t.estado === 'hecha') t.hecha = null;
  t.estado = estado;
  guardar();
}

// ---------- Cronómetro ----------
function iniciarTiempo(id) {
  if (datos.activo) pararTiempo();
  const t = buscar(id);
  datos.activo = { id, inicio: Date.now() };
  if (t.estado === 'pendiente' || t.estado === 'espera') t.estado = 'curso';
  guardar();
  pintarCrono();
}

function pararTiempo() {
  const a = datos.activo;
  if (!a) return;
  const t = buscar(a.id);
  if (t && Date.now() - a.inicio > 30000) t.tiempo.push({ inicio: a.inicio, fin: Date.now() });
  datos.activo = null;
  guardar();
  pintarCrono();
}

function pintarCrono() {
  const b = $('#btnTimer');
  const a = datos.activo;
  const t = a && buscar(a.id);
  if (!t) { b.hidden = true; return; }
  const s = Math.floor((Date.now() - a.inicio) / 1000);
  b.hidden = false;
  b.textContent = `⏹ ${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  b.title = `Parar el tiempo de «${t.titulo}»`;
}

$('#btnTimer').addEventListener('click', () => { pararTiempo(); toast('Tiempo registrado'); render(); });
setInterval(pintarCrono, 1000);

// ---------- Componentes ----------
let filtro = { q: '', cat: '', kpi: '' };

function filtrar(lista) {
  const q = filtro.q.trim().toLowerCase();
  return lista.filter(t => (!filtro.cat || t.categoria === filtro.cat)
    && (!q || `${t.titulo} ${t.notas} ${t.categoria}`.toLowerCase().includes(q)));
}

function barraFiltros() {
  return `<div class="filtros">
    <input class="input" type="search" id="fq" placeholder="Buscar…" value="${esc(filtro.q)}">
    <select class="input" id="fcat"><option value="">Todas las categorías</option>
      ${categoriasUsadas().map(c => `<option ${c === filtro.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  </div>`;
}

function categoriasUsadas() {
  const s = new Set(datos.categorias);
  datos.tareas.forEach(t => t.categoria && s.add(t.categoria));
  return [...s];
}

function tarjeta(t, extra = '') {
  const u = urgencia(t);
  const hecha = t.estado === 'hecha';
  const subOk = t.subtareas.filter(s => s.ok).length;
  const tt = tiempoTotal(t);
  return `<div class="card tarea u-${u.cls} ${hecha ? 'hecha' : ''}" data-id="${t.id}" draggable="true">
    <input type="checkbox" class="tick" data-tick="${t.id}" ${hecha ? 'checked' : ''} aria-label="Marcar como hecha">
    <div class="grow">
      <div class="tit ${hecha ? 'tachado' : ''}"><span class="prio-${t.prioridad}" title="Prioridad ${PRIOS[t.prioridad]}">●</span> ${esc(t.titulo)}</div>
      <div class="meta row wrap small">
        <span class="badge ${u.cls}">${u.txt}</span>
        ${t.nlt ? `<span class="muted">NLT ${fmtFecha(t.nlt)}${t.hora ? ' · ' + t.hora : ''}</span>` : ''}
        ${t.categoria ? `<span class="chip">${esc(t.categoria)}</span>` : ''}
        ${t.estado === 'curso' || t.estado === 'espera' ? `<span class="badge info">${NOMBRE_ESTADO[t.estado]}</span>` : ''}
        ${t.repetir ? `<span class="muted" title="${REPETIR[t.repetir]}">↻</span>` : ''}
        ${t.subtareas.length ? `<span class="muted">☑ ${subOk}/${t.subtareas.length}</span>` : ''}
        ${tt ? `<span class="muted">⏱ ${fmtDur(tt)}</span>` : ''}
        ${datos.activo?.id === t.id ? '<span class="badge warn">En marcha</span>' : ''}
      </div>
      ${t.subtareas.length ? `<div class="progress"><i style="width:${Math.round(subOk / t.subtareas.length * 100)}%"></i></div>` : ''}
      ${extra}
    </div>
  </div>`;
}

// ---------- Vista: NLT ----------
function vistaNlt() {
  const abiertas = datos.tareas.filter(t => t.estado !== 'hecha');
  const cuenta = g => abiertas.filter(t => urgencia(t).grupo === g).length;
  const n = { vencidas: cuenta('vencidas'), hoy: cuenta('hoy'), semana: cuenta('semana'), abiertas: abiertas.length };
  const kpi = (k, l, cls) => `<button class="kpi ${cls} ${filtro.kpi === k ? 'on' : ''}" data-kpi="${k}">
    <div class="kpi-l">${l}</div><div class="kpi-v">${n[k]}</div></button>`;

  let lista = filtrar(datos.tareas);
  const grupos = [
    ['vencidas', 'NLT vencidas'], ['hoy', 'Vencen hoy'], ['semana', 'Próximos 7 días'],
    ['despues', 'Más adelante'], ['sin', 'Sin NLT'],
  ].filter(([g]) => !filtro.kpi || filtro.kpi === 'abiertas' || filtro.kpi === g);

  const bloques = grupos.map(([g, titulo]) => {
    const ts = lista.filter(t => urgencia(t).grupo === g).sort(ordenar);
    if (!ts.length) return '';
    return `<h2 class="sec"><span>${titulo}</span><span>${ts.length}</span></h2>${ts.map(t => tarjeta(t)).join('')}`;
  }).join('');

  const hechas = lista.filter(t => t.estado === 'hecha').sort((a, b) => (b.hecha || '').localeCompare(a.hecha || ''));

  return `
    <form class="card" id="rapida">
      <div class="row gap wrap">
        <input class="input grow" name="titulo" placeholder="Nueva tarea… (Intro para añadir)" required style="min-width:180px">
        <input class="input" type="date" name="nlt" title="NLT: fecha límite para finalizar" style="width:auto">
        <button class="btn primary">Añadir</button>
      </div>
    </form>
    <div class="kpis">
      ${kpi('vencidas', 'Vencidas', n.vencidas ? 'bad' : '')}${kpi('hoy', 'Hoy', n.hoy ? 'warn' : '')}
      ${kpi('semana', '7 días', '')}${kpi('abiertas', 'Abiertas', '')}
    </div>
    ${barraFiltros()}
    ${bloques || (datos.tareas.length
      ? '<div class="empty">No hay tareas pendientes con este filtro. 🎉</div>'
      : `<div class="empty"><p>Aún no tienes tareas.</p><p class="small">Pulsa <b>+</b> para crear una, o carga unos ejemplos para ver cómo funciona.</p>
         <button class="btn" data-accion="ejemplos">Cargar ejemplos</button></div>`)}
    ${hechas.length && !filtro.kpi ? `<details class="card"><summary><b>Hechas</b> <span class="muted">(${hechas.length})</span></summary>
      <div style="margin-top:10px">${hechas.slice(0, 50).map(t => tarjeta(t)).join('')}</div></details>` : ''}`;
}

// ---------- Vista: Tablero ----------
function vistaTablero() {
  const lista = filtrar(datos.tareas);
  const cols = ESTADOS.map(([e, nombre], i) => {
    let ts = lista.filter(t => t.estado === e);
    ts = e === 'hecha' ? ts.sort((a, b) => (b.hecha || '').localeCompare(a.hecha || '')).slice(0, 20) : ts.sort(ordenar);
    const mover = t => `<div class="mover">
      ${i > 0 ? `<button class="btn sm" data-mover="${t.id}" data-a="${ESTADOS[i - 1][0]}" title="Pasar a ${ESTADOS[i - 1][1]}">◀</button>` : ''}
      ${i < ESTADOS.length - 1 ? `<button class="btn sm" data-mover="${t.id}" data-a="${ESTADOS[i + 1][0]}" title="Pasar a ${ESTADOS[i + 1][1]}">▶</button>` : ''}</div>`;
    return `<section class="col" data-col="${e}"><h3><span>${nombre}</span><span class="muted">${lista.filter(t => t.estado === e).length}</span></h3>
      ${ts.map(t => tarjeta(t, mover(t))).join('') || '<p class="small muted">Arrastra aquí o usa ◀ ▶</p>'}</section>`;
  }).join('');
  return `${barraFiltros()}<div class="kanban">${cols}</div>`;
}

// ---------- Vista: Calendario ----------
let mesVista = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
let diaSel = hoy();

function vistaCalendario() {
  const y = mesVista.getFullYear(), m = mesVista.getMonth();
  const inicio = new Date(y, m, 1 - ((new Date(y, m, 1).getDay() + 6) % 7));
  const porDia = {};
  filtrar(datos.tareas).forEach(t => { if (t.nlt) (porDia[t.nlt] ||= []).push(t); });
  let celdas = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio); d.setDate(inicio.getDate() + i);
    const s = iso(d);
    const ts = (porDia[s] || []).sort(ordenar);
    celdas += `<button class="dia ${d.getMonth() !== m ? 'fuera' : ''} ${s === hoy() ? 'hoy' : ''} ${s === diaSel ? 'sel' : ''}" data-dia="${s}">
      <span class="n">${d.getDate()}</span>
      ${ts.slice(0, 3).map(t => `<span class="pt ${t.estado === 'hecha' ? 'done' : urgencia(t).cls === 'bad' ? 'bad' : ''}">${esc(t.titulo)}</span>`).join('')}
      ${ts.length > 3 ? `<span class="small muted">+${ts.length - 3}</span>` : ''}</button>`;
    const sig = new Date(d); sig.setDate(d.getDate() + 1);
    if (i % 7 === 6 && sig.getMonth() !== m && i >= 27) break;
  }
  const delDia = (porDia[diaSel] || []).sort(ordenar);
  const mesTxt = mesVista.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const titulo = mesTxt[0].toUpperCase() + mesTxt.slice(1);
  return `${barraFiltros()}
    <div class="calhead">
      <button class="btn sm" data-mes="-1" aria-label="Mes anterior">◀</button>
      <b>${titulo}</b>
      <button class="btn sm" data-mes="1" aria-label="Mes siguiente">▶</button>
    </div>
    <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dow">${d}</div>`).join('')}${celdas}</div>
    <h2 class="sec"><span>NLT del ${fmtFecha(diaSel)}</span><span>${delDia.length}</span></h2>
    ${delDia.map(t => tarjeta(t)).join('') || '<p class="muted small">Ninguna tarea con NLT este día.</p>'}
    <button class="btn block" data-accion="nueva-dia">+ Nueva tarea con NLT el ${fmtFecha(diaSel, false)}</button>`;
}

// ---------- Vista: Actividad (todo lo que hago) ----------
let periodo = 'semana';
const PERIODOS = { hoy: 'Hoy', semana: 'Esta semana', semanaPasada: 'Semana pasada', mes: 'Este mes', mesPasado: 'Mes pasado', d30: 'Últimos 30 días', anio: 'Este año' };

function rango(p) {
  const h = aFecha(hoy());
  const lunes = new Date(h); lunes.setDate(h.getDate() - ((h.getDay() + 6) % 7));
  const r = (a, b) => [a.getTime(), b.getTime()];
  const mas = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  switch (p) {
    case 'hoy': return r(h, mas(h, 1));
    case 'semana': return r(lunes, mas(lunes, 7));
    case 'semanaPasada': return r(mas(lunes, -7), lunes);
    case 'mes': return r(new Date(h.getFullYear(), h.getMonth(), 1), new Date(h.getFullYear(), h.getMonth() + 1, 1));
    case 'mesPasado': return r(new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 1));
    case 'd30': return r(mas(h, -29), mas(h, 1));
    default: return r(new Date(h.getFullYear(), 0, 1), new Date(h.getFullYear() + 1, 0, 1));
  }
}

function actividad(p) {
  const [a, b] = rango(p);
  const dentro = ms => ms >= a && ms < b;
  const eventos = [];
  const tiempoCat = {}, hechasCat = {};
  let tiempo = 0, hechas = 0, aTiempo = 0, creadas = 0;
  for (const t of datos.tareas) {
    const cat = t.categoria || 'Sin categoría';
    if (t.creada && dentro(Date.parse(t.creada))) { creadas++; eventos.push({ ms: Date.parse(t.creada), t, txt: 'Creada' }); }
    if (t.hecha && dentro(Date.parse(t.hecha))) {
      hechas++;
      hechasCat[cat] = (hechasCat[cat] || 0) + 1;
      const ok = !t.nlt || iso(new Date(t.hecha)) <= t.nlt;
      if (ok) aTiempo++;
      eventos.push({ ms: Date.parse(t.hecha), t, txt: ok ? '✔ Completada' : '✔ Completada fuera de NLT' });
    }
    for (const s of t.tiempo) {
      const ini = Math.max(s.inicio, a), fin = Math.min(s.fin, b);
      if (fin > ini) {
        tiempo += fin - ini;
        tiempoCat[cat] = (tiempoCat[cat] || 0) + fin - ini;
        eventos.push({ ms: s.inicio, t, txt: `⏱ ${fmtDur(s.fin - s.inicio)} de trabajo` });
      }
    }
    for (const r of t.registro) if (dentro(Date.parse(r.fecha))) eventos.push({ ms: Date.parse(r.fecha), t, txt: '✎ ' + r.texto });
  }
  eventos.sort((x, y) => y.ms - x.ms);
  return { tiempo, hechas, aTiempo, creadas, tiempoCat, hechasCat, eventos };
}

function vistaActividad() {
  const r = actividad(periodo);
  const maxT = Math.max(1, ...Object.values(r.tiempoCat));
  const maxH = Math.max(1, ...Object.values(r.hechasCat));
  let diaAnt = '';
  const cronologia = r.eventos.slice(0, 300).map(e => {
    const d = new Date(e.ms);
    const cab = iso(d) !== diaAnt ? `<li class="muted small" style="border:0;padding-top:14px"><b>${fmtFecha(iso(d))}</b></li>` : '';
    diaAnt = iso(d);
    return `${cab}<li><span class="muted small">${pad(d.getHours())}:${pad(d.getMinutes())}</span> ${esc(e.txt)} · <a href="#" data-abrir="${e.t.id}">${esc(e.t.titulo)}</a>
      ${e.t.categoria ? `<span class="chip">${esc(e.t.categoria)}</span>` : ''}</li>`;
  }).join('');
  const barras = (obj, max, fmt) => Object.entries(obj).sort((x, y) => y[1] - x[1])
    .map(([c, v]) => `<div class="barra"><span title="${esc(c)}">${esc(c)}</span><span class="b"><i style="width:${v / max * 100}%"></i></span><span>${fmt(v)}</span></div>`).join('')
    || '<p class="small muted">Sin datos en este periodo.</p>';

  return `
    <div class="row gap wrap" style="margin-bottom:12px">
      <select class="input grow" id="periodo" style="width:auto;min-width:160px">${Object.entries(PERIODOS).map(([k, v]) => `<option value="${k}" ${k === periodo ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <button class="btn" data-accion="copiar-resumen">Copiar resumen</button>
      <button class="btn" data-accion="csv-periodo">CSV</button>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Hechas</div><div class="kpi-v">${r.hechas}</div></div>
      <div class="kpi"><div class="kpi-l">En plazo</div><div class="kpi-v">${r.hechas ? Math.round(r.aTiempo / r.hechas * 100) + '%' : '–'}</div></div>
      <div class="kpi"><div class="kpi-l">Tiempo</div><div class="kpi-v" style="font-size:1.2rem;padding:5px 0">${fmtDur(r.tiempo)}</div></div>
      <div class="kpi"><div class="kpi-l">Nuevas</div><div class="kpi-v">${r.creadas}</div></div>
    </div>
    <form class="card" id="registrar">
      <h3>Anotar algo que he hecho</h3>
      <p class="small muted">Para lo que no estaba planificado: llamadas, gestiones, imprevistos… Queda como tarea hecha con su tiempo.</p>
      <input class="input" name="titulo" placeholder="¿Qué has hecho?" required>
      <div class="grid2" style="margin-top:8px">
        <input class="input" name="categoria" list="dlcats" placeholder="Categoría">
        <input class="input" name="min" type="number" min="0" step="5" placeholder="Minutos dedicados">
      </div>
      <button class="btn primary block">Anotar</button>
    </form>
    <datalist id="dlcats">${categoriasUsadas().map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <div class="card"><h3>Tiempo por categoría</h3>${barras(r.tiempoCat, maxT, fmtDur)}</div>
    <div class="card"><h3>Tareas hechas por categoría</h3>${barras(r.hechasCat, maxH, v => v)}</div>
    <div class="card"><h3>Cronología</h3><ul class="log">${cronologia || '<li class="muted">Sin actividad en este periodo.</li>'}</ul></div>`;
}

function resumenTexto() {
  const r = actividad(periodo);
  const lineas = [`Resumen de actividad · ${PERIODOS[periodo]}`, '',
    `Tareas hechas: ${r.hechas} (${r.hechas ? Math.round(r.aTiempo / r.hechas * 100) : 0}% dentro de NLT)`,
    `Tiempo registrado: ${fmtDur(r.tiempo)}`, `Tareas nuevas: ${r.creadas}`, ''];
  Object.entries(r.tiempoCat).sort((x, y) => y[1] - x[1]).forEach(([c, v]) => lineas.push(`· ${c}: ${fmtDur(v)}`));
  lineas.push('', 'Hechas:');
  r.eventos.filter(e => e.txt.startsWith('✔')).forEach(e => lineas.push(`- ${e.t.titulo}${e.t.categoria ? ' [' + e.t.categoria + ']' : ''}`));
  const pend = datos.tareas.filter(t => t.estado !== 'hecha' && t.nlt).sort(ordenar).slice(0, 15);
  if (pend.length) {
    lineas.push('', 'Próximas NLT:');
    pend.forEach(t => lineas.push(`- ${fmtFecha(t.nlt)}: ${t.titulo} (${urgencia(t).txt})`));
  }
  return lineas.join('\n');
}

// ---------- Vista: Ajustes ----------
function vistaAjustes() {
  const a = datos.ajustes;
  const notif = 'Notification' in window ? Notification.permission : 'no';
  return `
    <div class="card">
      <h3>Avisos de NLT</h3>
      <label class="lbl">Marcar en naranja cuando queden
        <select class="input" id="avisoDias">${[1, 2, 3, 5, 7, 10, 15].map(n => `<option ${n === a.avisoDias ? 'selected' : ''} value="${n}">${n} día${n > 1 ? 's' : ''} o menos</option>`).join('')}</select></label>
      ${notif === 'granted' ? '<p class="small muted">Notificaciones activadas: al abrir la app se avisa una vez al día de las NLT vencidas y de hoy.</p>'
        : notif === 'no' ? '<p class="small muted">Este navegador no admite notificaciones.</p>'
        : '<button class="btn block" data-accion="notif">Activar notificaciones</button>'}
      <button class="btn block" data-accion="ics">Exportar NLT a mi calendario (.ics)</button>
      <p class="small muted">El archivo .ics se importa en Google Calendar, Outlook o el calendario del móvil, con aviso el día anterior.</p>
    </div>
    <div class="card">
      <h3>Tema</h3>
      <select class="input" id="tema">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, v]) => `<option value="${k}" ${k === a.tema ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <div class="card">
      <h3>Categorías</h3>
      <p class="small muted">Organiza todo lo que haces. Pulsa una para renombrarla.</p>
      <div class="row wrap">${datos.categorias.map((c, i) => `<span class="chip" style="font-size:.85rem;padding:6px 10px">
        <a href="#" data-rencat="${i}" style="color:inherit">${esc(c)}</a> <a href="#" data-delcat="${i}" style="color:var(--bad);text-decoration:none" aria-label="Quitar">✕</a></span>`).join('')}</div>
      <form id="nuevaCat" class="row gap" style="margin-top:10px"><input class="input grow" name="c" placeholder="Nueva categoría" required><button class="btn">Añadir</button></form>
    </div>
    <div class="card">
      <h3>Datos</h3>
      <p class="small muted">Todo se guarda solo en este navegador (${datos.tareas.length} tareas). Haz copias de seguridad de vez en cuando.</p>
      <button class="btn block" data-accion="exportar">Descargar copia de seguridad (.json)</button>
      <button class="btn block" data-accion="importar">Restaurar copia…</button>
      <button class="btn block" data-accion="csv-todo">Exportar todas las tareas (.csv, Excel)</button>
      <input type="file" id="fimport" accept="application/json,.json" hidden>
      <button class="btn danger block" data-accion="borrar">Borrar todos los datos</button>
    </div>`;
}

// ---------- Editor de tarea ----------
let borrador = null;

function abrirEditor(id, base = {}) {
  const t = id && buscar(id);
  borrador = t ? structuredClone(t) : {
    id: null, titulo: '', notas: '', categoria: datos.ajustes.ultimaCat || datos.categorias[0] || '',
    prioridad: 'media', nlt: '', hora: '', estado: 'pendiente', repetir: '', subtareas: [], tiempo: [], registro: [], ...base,
  };
  const b = borrador;
  const opts = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');
  dlg.innerHTML = `<form method="dialog" id="fed">
    <div class="dlg-h"><h2>${t ? 'Editar tarea' : 'Nueva tarea'}</h2><button type="button" class="icon-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-b">
      <label class="lbl">Qué hay que hacer<input class="input" name="titulo" required value="${esc(b.titulo)}" autocomplete="off"></label>
      <div class="grid2">
        <label class="lbl">NLT · fecha límite<input class="input" type="date" name="nlt" value="${b.nlt}"></label>
        <label class="lbl">Hora límite (opcional)<input class="input" type="time" name="hora" value="${b.hora}"></label>
      </div>
      <div class="row wrap small" style="margin-top:6px">
        ${[['Hoy', 0], ['Mañana', 1], ['+3 d', 3], ['+1 sem', 7], ['+2 sem', 14], ['+1 mes', 30]].map(([l, n]) => `<button type="button" class="btn sm" data-rapido="${n}">${l}</button>`).join('')}
        <button type="button" class="btn sm" data-rapido="">Sin NLT</button>
      </div>
      <div class="grid2">
        <label class="lbl">Categoría<input class="input" name="categoria" list="dlcats2" value="${esc(b.categoria)}"></label>
        <label class="lbl">Prioridad<select class="input" name="prioridad">${opts(PRIOS, b.prioridad)}</select></label>
        <label class="lbl">Estado<select class="input" name="estado">${opts(NOMBRE_ESTADO, b.estado)}</select></label>
        <label class="lbl">Repetir<select class="input" name="repetir">${opts(REPETIR, b.repetir)}</select></label>
      </div>
      <datalist id="dlcats2">${categoriasUsadas().map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      <label class="lbl">Notas<textarea class="input" name="notas" rows="3">${esc(b.notas)}</textarea></label>
      <div class="lbl">Pasos / subtareas</div>
      <div id="subs"></div>
      <div class="row gap"><input class="input grow" id="nsub" placeholder="Añadir paso (Intro)"><button type="button" class="btn" data-addsub>+</button></div>
      <div class="lbl">Tiempo dedicado</div>
      <div id="tiempo"></div>
      <div class="lbl">Bitácora</div>
      <div class="row gap"><input class="input grow" id="nreg" placeholder="Anotar avance, llamada, incidencia… (Intro)"><button type="button" class="btn" data-addreg>+</button></div>
      <ul class="log" id="regs"></ul>
      ${t ? `<p class="small muted" style="margin-top:12px">Creada el ${new Date(t.creada).toLocaleString('es-ES')}${t.hecha ? ` · Hecha el ${new Date(t.hecha).toLocaleString('es-ES')}` : ''}</p>` : ''}
    </div>
    <div class="dlg-f">
      ${t ? '<button type="button" class="btn danger" data-borrar>Eliminar</button><button type="button" class="btn" data-duplicar>Duplicar</button>' : ''}
      <button class="btn primary" value="ok">Guardar</button>
    </div></form>`;
  pintarSubs(); pintarTiempo(); pintarRegs();
  dlg.showModal();
  if (!t) $('[name=titulo]', dlg).focus();
}

function pintarSubs() {
  $('#subs', dlg).innerHTML = borrador.subtareas.map((s, i) => `<div class="sub">
    <input type="checkbox" data-subok="${i}" ${s.ok ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brand)">
    <input class="input grow ${s.ok ? 'tachado' : ''}" data-subtxt="${i}" value="${esc(s.t)}">
    <button type="button" class="icon-btn" data-subdel="${i}" aria-label="Quitar paso">✕</button></div>`).join('');
}

function pintarTiempo() {
  const el = $('#tiempo', dlg);
  const t = borrador.id && buscar(borrador.id);
  if (!t) { el.innerHTML = '<p class="small muted">Guarda la tarea para poder cronometrarla.</p>'; return; }
  const enMarcha = datos.activo?.id === t.id;
  el.innerHTML = `<div class="row gap wrap">
    <b>${fmtDur(tiempoTotal(t))}</b><span class="small muted">en ${t.tiempo.length} sesión${t.tiempo.length === 1 ? '' : 'es'}</span>
    <span class="grow"></span>
    <button type="button" class="btn sm ${enMarcha ? 'danger' : 'primary'}" data-crono>${enMarcha ? '⏹ Parar' : '▶ Empezar'}</button>
    <input class="input" id="manmin" type="number" min="1" step="5" placeholder="min" style="width:80px;min-height:34px;padding:4px 8px">
    <button type="button" class="btn sm" data-manual>+ Añadir</button></div>`;
}

function pintarRegs() {
  $('#regs', dlg).innerHTML = [...borrador.registro].reverse().map(r =>
    `<li><span class="muted small">${new Date(r.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span> ${esc(r.texto)}</li>`).join('');
}

function leerFormulario() {
  const f = $('#fed', dlg);
  const v = n => f.elements[n].value;
  Object.assign(borrador, {
    titulo: v('titulo').trim(), nlt: v('nlt'), hora: v('hora'), categoria: v('categoria').trim(),
    prioridad: v('prioridad'), estado: v('estado'), repetir: v('repetir'), notas: v('notas'),
  });
}

function guardarBorrador() {
  leerFormulario();
  const b = borrador;
  if (!b.titulo) return false;
  if (b.categoria && !datos.categorias.includes(b.categoria)) datos.categorias.push(b.categoria);
  datos.ajustes.ultimaCat = b.categoria;
  const actual = b.id && buscar(b.id);
  if (actual) {
    const pasaAHecha = b.estado === 'hecha' && actual.estado !== 'hecha';
    const estado = b.estado;
    Object.assign(actual, { ...b, tiempo: actual.tiempo, estado: pasaAHecha ? actual.estado : estado, hecha: estado === 'hecha' ? actual.hecha : null });
    if (pasaAHecha) marcarHecha(actual.id, true);
  } else {
    const nueva = { ...b, id: nuevoId(), creada: new Date().toISOString(), hecha: null };
    const hecha = nueva.estado === 'hecha';
    if (hecha) nueva.estado = 'pendiente';
    datos.tareas.push(nueva);
    if (hecha) marcarHecha(nueva.id, true);
  }
  guardar();
  return true;
}

dlg.addEventListener('click', e => {
  const d = e.target.closest('button, input[type=checkbox]');
  if (!d) return;
  if (d.hasAttribute('data-cerrar')) { dlg.close(); return; }
  if (d.dataset.rapido !== undefined) {
    $('[name=nlt]', dlg).value = d.dataset.rapido === '' ? '' : sumarDias(hoy(), +d.dataset.rapido);
    if (d.dataset.rapido === '') $('[name=hora]', dlg).value = '';
  } else if (d.hasAttribute('data-addsub')) addSub();
  else if (d.dataset.subok !== undefined) { borrador.subtareas[d.dataset.subok].ok = d.checked; pintarSubs(); }
  else if (d.dataset.subdel !== undefined) { borrador.subtareas.splice(d.dataset.subdel, 1); pintarSubs(); }
  else if (d.hasAttribute('data-addreg')) addReg();
  else if (d.hasAttribute('data-crono')) {
    if (datos.activo?.id === borrador.id) pararTiempo(); else iniciarTiempo(borrador.id);
    borrador.estado = buscar(borrador.id).estado;
    $('[name=estado]', dlg).value = borrador.estado;
    pintarTiempo(); render();
  } else if (d.hasAttribute('data-manual')) {
    const min = +$('#manmin', dlg).value;
    if (min > 0) {
      const fin = Date.now();
      buscar(borrador.id).tiempo.push({ inicio: fin - min * 60000, fin });
      guardar(); pintarTiempo(); render();
    }
  } else if (d.hasAttribute('data-borrar')) {
    if (confirm('¿Eliminar esta tarea?')) {
      if (datos.activo?.id === borrador.id) datos.activo = null;
      datos.tareas = datos.tareas.filter(t => t.id !== borrador.id);
      guardar(); dlg.close(); render(); pintarCrono();
    }
  } else if (d.hasAttribute('data-duplicar')) {
    leerFormulario();
    const copia = { ...structuredClone(borrador), titulo: borrador.titulo + ' (copia)', estado: 'pendiente', hecha: null, tiempo: [], registro: [] };
    copia.subtareas.forEach(s => { s.ok = false; });
    delete copia.id;
    dlg.close();
    abrirEditor(null, copia);
  }
});

dlg.addEventListener('input', e => {
  if (e.target.dataset.subtxt !== undefined) borrador.subtareas[e.target.dataset.subtxt].t = e.target.value;
});

dlg.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'nsub') { e.preventDefault(); addSub(); }
  if (e.target.id === 'nreg') { e.preventDefault(); addReg(); }
});

function addSub() {
  const i = $('#nsub', dlg);
  if (!i.value.trim()) return;
  borrador.subtareas.push({ t: i.value.trim(), ok: false });
  i.value = ''; pintarSubs(); i.focus();
}

function addReg() {
  const i = $('#nreg', dlg);
  if (!i.value.trim()) return;
  borrador.registro.push({ fecha: new Date().toISOString(), texto: i.value.trim() });
  i.value = ''; pintarRegs(); i.focus();
}

dlg.addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  if (!guardarBorrador()) { e.preventDefault(); return; }
  render();
});

// ---------- Exportaciones ----------
function csv(tareas) {
  const c = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Tarea', 'Categoría', 'Prioridad', 'Estado', 'NLT', 'Hora', 'Situación', 'Creada', 'Hecha', 'Minutos', 'Pasos', 'Notas']];
  tareas.forEach(t => filas.push([t.titulo, t.categoria, PRIOS[t.prioridad], NOMBRE_ESTADO[t.estado], t.nlt, t.hora, urgencia(t).txt,
    t.creada ? new Date(t.creada).toLocaleString('es-ES') : '', t.hecha ? new Date(t.hecha).toLocaleString('es-ES') : '',
    Math.round(tiempoTotal(t) / 60000), t.subtareas.map(s => (s.ok ? '[x] ' : '[ ] ') + s.t).join(' | '), t.notas]));
  return '﻿' + filas.map(f => f.map(c).join(';')).join('\r\n');
}

function ics() {
  const e = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  const f = s => s.replace(/-/g, '');
  const sello = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = datos.tareas.filter(t => t.nlt && t.estado !== 'hecha').map(t => {
    const cuando = t.hora
      ? [`DTSTART:${f(t.nlt)}T${t.hora.replace(':', '')}00`, 'DURATION:PT30M']
      : [`DTSTART;VALUE=DATE:${f(t.nlt)}`, `DTEND;VALUE=DATE:${f(sumarDias(t.nlt, 1))}`];
    return ['BEGIN:VEVENT', `UID:${t.id}@tareas-nlt`, `DTSTAMP:${sello}`, ...cuando,
      `SUMMARY:${e('NLT: ' + t.titulo)}`, `DESCRIPTION:${e([t.categoria, t.notas].filter(Boolean).join('\n'))}`,
      `CATEGORIES:${e(t.categoria || 'Tareas')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e('Vence: ' + t.titulo)}`, 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT'];
  });
  // Las líneas de más de 75 caracteres se pliegan, como pide el formato iCalendar
  const plegar = l => l.length <= 73 ? l : l.match(/.{1,73}/gu).join('\r\n ');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tareas NLT//ES', 'CALSCALE:GREGORIAN', ...ev.flat(), 'END:VCALENDAR']
    .map(plegar).join('\r\n');
}

function ejemplos() {
  const d = n => sumarDias(hoy(), n);
  const ahora = new Date().toISOString();
  const base = (titulo, categoria, nlt, extra = {}) => ({
    id: nuevoId(), titulo, categoria, nlt, hora: '', notas: '', prioridad: 'media', estado: 'pendiente', repetir: '',
    creada: ahora, hecha: null, subtareas: [], tiempo: [], registro: [], ...extra,
  });
  datos.tareas.push(
    base('Entregar informe SEGINS de la instalación norte', 'Informes', d(-1), { prioridad: 'alta',
      subtareas: [{ t: 'Revisar fotos y no conformidades', ok: true }, { t: 'Redactar conclusiones', ok: false }, { t: 'Firmar y enviar', ok: false }] }),
    base('Visita de evaluación a almacén central', 'Visitas', d(0), { hora: '10:00', prioridad: 'alta', estado: 'curso' }),
    base('Revisar plazos de subsanación pendientes', 'Evaluaciones SEGINS', d(2), { repetir: 'semanal' }),
    base('Parte mensual de actividad', 'Administración', d(6), { repetir: 'mensual', prioridad: 'baja' }),
    base('Curso de actualización en normativa', 'Formación', d(20)),
    base('Preparar reunión de coordinación', 'Reuniones', d(1), { estado: 'espera', notas: 'Esperando el orden del día' }),
    base('Ordenar documentación de instalaciones', 'Administración', ''),
    base('Llamar a mantenimiento por extintores', 'Visitas', d(-3), { estado: 'hecha', hecha: new Date(Date.now() - 864e5).toISOString(),
      tiempo: [{ inicio: Date.now() - 864e5 - 20 * 60000, fin: Date.now() - 864e5 }] }),
  );
  guardar();
}

// ---------- Eventos de las vistas ----------
main.addEventListener('click', e => {
  const el = e.target;
  const tick = el.closest('[data-tick]');
  if (tick) { marcarHecha(tick.dataset.tick, tick.checked); render(); return; }
  const kpi = el.closest('[data-kpi]');
  if (kpi) { filtro.kpi = filtro.kpi === kpi.dataset.kpi ? '' : kpi.dataset.kpi; render(); return; }
  const mover = el.closest('[data-mover]');
  if (mover) { cambiarEstado(mover.dataset.mover, mover.dataset.a); render(); return; }
  const dia = el.closest('[data-dia]');
  if (dia) { diaSel = dia.dataset.dia; render(); return; }
  const mes = el.closest('[data-mes]');
  if (mes) { mesVista = new Date(mesVista.getFullYear(), mesVista.getMonth() + +mes.dataset.mes, 1); render(); return; }
  const abrir = el.closest('[data-abrir]');
  if (abrir) { e.preventDefault(); abrirEditor(abrir.dataset.abrir); return; }
  const ren = el.closest('[data-rencat]');
  if (ren) { e.preventDefault(); renombrarCat(+ren.dataset.rencat); return; }
  const del = el.closest('[data-delcat]');
  if (del) { e.preventDefault(); datos.categorias.splice(+del.dataset.delcat, 1); guardar(); render(); return; }
  const acc = el.closest('[data-accion]');
  if (acc) { accion(acc.dataset.accion); return; }
  const t = el.closest('.tarea');
  if (t && !el.closest('button, a, input, summary')) abrirEditor(t.dataset.id);
});

function renombrarCat(i) {
  const vieja = datos.categorias[i];
  const nueva = prompt('Nuevo nombre de la categoría', vieja)?.trim();
  if (!nueva || nueva === vieja) return;
  datos.categorias[i] = nueva;
  datos.tareas.forEach(t => { if (t.categoria === vieja) t.categoria = nueva; });
  guardar(); render();
}

async function accion(a) {
  switch (a) {
    case 'ejemplos': ejemplos(); render(); break;
    case 'nueva-dia': abrirEditor(null, { nlt: diaSel }); break;
    case 'copiar-resumen':
      try { await navigator.clipboard.writeText(resumenTexto()); toast('Resumen copiado'); }
      catch { descargar(`resumen-${hoy()}.txt`, resumenTexto(), 'text/plain'); }
      break;
    case 'csv-periodo': {
      const [ini, fin] = rango(periodo);
      const en = s => s && Date.parse(s) >= ini && Date.parse(s) < fin;
      const ts = datos.tareas.filter(t => en(t.creada) || en(t.hecha) || t.tiempo.some(s => s.fin >= ini && s.inicio < fin));
      descargar(`actividad-${periodo}-${hoy()}.csv`, csv(ts), 'text/csv;charset=utf-8');
      break;
    }
    case 'csv-todo': descargar(`tareas-${hoy()}.csv`, csv(datos.tareas), 'text/csv;charset=utf-8'); break;
    case 'ics': descargar(`nlt-${hoy()}.ics`, ics(), 'text/calendar;charset=utf-8'); break;
    case 'exportar': descargar(`tareas-nlt-copia-${hoy()}.json`, JSON.stringify(datos, null, 1), 'application/json'); break;
    case 'importar': $('#fimport').click(); break;
    case 'notif':
      if (await Notification.requestPermission() === 'granted') { datos.ajustes.ultimoAviso = ''; guardar(); avisar(); }
      render(); break;
    case 'borrar':
      if (confirm('¿Borrar TODAS las tareas y ajustes de este navegador? No se puede deshacer.')) {
        datos = normalizar({}); guardar(); render(); pintarCrono();
      }
      break;
  }
}

main.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'fcat') { filtro.cat = el.value; render(); }
  else if (el.id === 'periodo') { periodo = el.value; render(); }
  else if (el.id === 'avisoDias') { datos.ajustes.avisoDias = +el.value; guardar(); }
  else if (el.id === 'tema') { datos.ajustes.tema = el.value; guardar(); aplicarTema(); }
  else if (el.id === 'fimport' && el.files[0]) {
    try {
      const d = JSON.parse(await el.files[0].text());
      if (!Array.isArray(d.tareas)) throw new Error();
      if (confirm(`La copia tiene ${d.tareas.length} tareas. ¿Sustituir los datos actuales?`)) {
        datos = normalizar(d); guardar(); aplicarTema(); render(); pintarCrono(); toast('Copia restaurada');
      }
    } catch { alert('El archivo no es una copia válida de Tareas NLT.'); }
    el.value = '';
  }
});

main.addEventListener('input', e => {
  if (e.target.id !== 'fq') return;
  filtro.q = e.target.value;
  const pos = e.target.selectionStart;
  render();
  const i = $('#fq'); i.focus(); i.setSelectionRange(pos, pos);
});

main.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'rapida') {
    const titulo = f.elements.titulo.value.trim();
    if (!titulo) return;
    datos.tareas.push({ ...normalizar({ tareas: [{}] }).tareas[0], id: nuevoId(), titulo, nlt: f.elements.nlt.value,
      categoria: filtro.cat || datos.ajustes.ultimaCat || '', creada: new Date().toISOString() });
    guardar(); render();
    $('#rapida [name=titulo]').focus();
  } else if (f.id === 'registrar') {
    const min = +f.elements.min.value || 0;
    const cat = f.elements.categoria.value.trim();
    const fin = Date.now();
    if (cat && !datos.categorias.includes(cat)) datos.categorias.push(cat);
    datos.tareas.push({ ...normalizar({ tareas: [{}] }).tareas[0], id: nuevoId(), titulo: f.elements.titulo.value.trim(),
      categoria: cat, estado: 'hecha', creada: new Date(fin - min * 60000).toISOString(), hecha: new Date(fin).toISOString(),
      tiempo: min ? [{ inicio: fin - min * 60000, fin }] : [] });
    guardar(); render(); toast('Anotado');
  } else if (f.id === 'nuevaCat') {
    const c = f.elements.c.value.trim();
    if (c && !datos.categorias.includes(c)) { datos.categorias.push(c); guardar(); }
    render();
  }
});

// Arrastrar tarjetas entre columnas del tablero (escritorio)
main.addEventListener('dragstart', e => {
  const t = e.target.closest?.('.tarea');
  if (t) e.dataTransfer.setData('text/plain', t.dataset.id);
});
main.addEventListener('dragover', e => {
  const c = e.target.closest('.col');
  if (!c) return;
  e.preventDefault();
  document.querySelectorAll('.col.drop').forEach(x => x !== c && x.classList.remove('drop'));
  c.classList.add('drop');
});
main.addEventListener('drop', e => {
  const c = e.target.closest('.col');
  if (!c) return;
  e.preventDefault();
  cambiarEstado(e.dataTransfer.getData('text/plain'), c.dataset.col);
  render();
});

$('#fab').addEventListener('click', () => abrirEditor(null, location.hash === '#calendario' ? { nlt: diaSel } : {}));

// ---------- Avisos ----------
async function avisar() {
  if (!('Notification' in window) || Notification.permission !== 'granted' || datos.ajustes.ultimoAviso === hoy()) return;
  const abiertas = datos.tareas.filter(t => t.estado !== 'hecha');
  const venc = abiertas.filter(t => urgencia(t).grupo === 'vencidas').length;
  const deHoy = abiertas.filter(t => urgencia(t).grupo === 'hoy');
  datos.ajustes.ultimoAviso = hoy();
  guardar();
  if (!venc && !deHoy.length) return;
  const cuerpo = [venc ? `${venc} NLT vencida${venc > 1 ? 's' : ''}` : '', deHoy.length ? `Hoy: ${deHoy.map(t => t.titulo).join(', ')}` : '']
    .filter(Boolean).join(' · ');
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) reg.showNotification('Tareas NLT', { body: cuerpo, icon: 'icon.svg', tag: 'nlt' });
  else new Notification('Tareas NLT', { body: cuerpo, icon: 'icon.svg' });
}

// ---------- Navegación ----------
function aplicarTema() {
  const t = datos.ajustes.tema;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

function render() {
  const v = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'nlt';
  $('#titulo').textContent = VISTAS[v];
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v));
  $('#fab').hidden = v === 'ajustes' || v === 'actividad';
  main.innerHTML = { nlt: vistaNlt, tablero: vistaTablero, calendario: vistaCalendario, actividad: vistaActividad, ajustes: vistaAjustes }[v]();
  const venc = datos.tareas.filter(t => t.estado !== 'hecha' && ['vencidas', 'hoy'].includes(urgencia(t).grupo)).length;
  document.title = venc ? `(${venc}) Tareas NLT` : 'Tareas NLT';
}

window.addEventListener('hashchange', () => { filtro.kpi = ''; render(); });
// Si la app sigue abierta al cambiar de día, se recalculan los plazos
let diaPintado = hoy();
setInterval(() => { if (hoy() !== diaPintado && !dlg.open) { diaPintado = hoy(); render(); avisar(); } }, 60000);

aplicarTema();
render();
pintarCrono();
avisar();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
