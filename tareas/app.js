// Tareas NLT: gestor de tareas con fecha límite para finalizar (NLT).
// Se guarda en este navegador (localStorage) y, abierta en claude.ai, se sincroniza con la cuenta
// del usuario entre todos sus dispositivos (capacidad "db" del visor).

const CLAVE = 'tareas-nlt-v1';
const VERSION_APP = '10 · 25 sep 2026'; // súbela en cada publicación (y el ?v= de index.html)
const ESTADOS = [['pendiente', 'Pendiente'], ['curso', 'En curso'], ['espera', 'En espera'], ['hecha', 'Hecha']];
const NOMBRE_ESTADO = Object.fromEntries(ESTADOS);
const PRIOS = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
const ORDEN_PRIO = { critica: 0, alta: 1, media: 2, baja: 3 };
const REPETIR = { '': 'No se repite', diaria: 'Cada día', semanal: 'Cada semana', mensual: 'Cada mes', anual: 'Cada año' };
const CATS_BASE = ['Evaluaciones SEGINS', 'Visitas', 'Informes', 'Reuniones', 'Administración', 'Formación', 'Personal'];
const VISTAS = { nlt: 'Mis NLT', tablero: 'Tablero', calendario: 'Calendario', actividad: 'Lo que hago', ajustes: 'Ajustes' };

// Todos los campos de una tarea, con su valor por defecto
const TAREA_BASE = {
  titulo: '', referencia: '', descripcion: '', notas: '', categoria: '', lugar: '', prioridad: 'media',
  ordenadaPor: '', fechaOrden: '', responsable: '', colaboradores: [],
  nlt: '', hora: '', nltOriginal: '', prorrogas: [], avisos: [], avisoVisto: 0,
  estado: 'pendiente', repetir: '', progreso: 0, estimacionH: 0, dependeDe: [], enlaces: [], resultado: '',
  creada: '', hecha: null, subtareas: [], tiempo: [], registro: [], gcal: null,
  espacio: 'personal', responsableId: '', creadorId: '', asignadaEn: 0, acuses: {},
};
const LISTAS = Object.keys(TAREA_BASE).filter(k => Array.isArray(TAREA_BASE[k]));

// Versión publicada en claude.ai, que sincroniza entre dispositivos
const URL_NUBE = 'https://claude.ai/artifact/9Qqg68wrV3upUSdjZWwZWU';

const $ = (s, el = document) => el.querySelector(s);
const main = $('#main');
const dlg = $('#dlg');
const dlg2 = $('#dlg2');

// ---------- Datos ----------
let datos = cargar();
const nube = { lista: false, equipo: false, equipoSoloLectura: false, uid: null, user: null, miNombre: '', miembros: [], nombres: new Map(),
  estado: 'local', base: cargarBase(), pendientes: new Map(), cola: Promise.resolve(), temporizador: 0, error: false };

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && Array.isArray(d.tareas)) return normalizar(d);
  } catch { /* datos corruptos o almacenamiento bloqueado: se empieza de cero */ }
  return normalizar({});
}

function normalizarTarea(t) {
  const n = { ...structuredClone(TAREA_BASE), ...t };
  LISTAS.forEach(k => { if (!Array.isArray(n[k])) n[k] = []; });
  if (!PRIOS[n.prioridad]) n.prioridad = 'media';
  if (!n.acuses || typeof n.acuses !== 'object' || Array.isArray(n.acuses)) n.acuses = {};
  if (n.espacio !== 'equipo') n.espacio = 'personal';
  return n;
}

function normalizar(d) {
  return {
    tareas: (d.tareas || []).map(normalizarTarea),
    categorias: Array.isArray(d.categorias) ? d.categorias : [...CATS_BASE],
    personas: Array.isArray(d.personas) ? d.personas : [],
    gcalBorrar: Array.isArray(d.gcalBorrar) ? d.gcalBorrar : [],
    gcalMapa: d.gcalMapa && typeof d.gcalMapa === 'object' ? d.gcalMapa : {},
    vistos: d.vistos && typeof d.vistos === 'object' ? d.vistos : {},
    avisosPropios: d.avisosPropios && typeof d.avisosPropios === 'object' ? d.avisosPropios : {},
    ajustes: { avisoDias: 3, tema: 'auto', ultimoAviso: '', miNombre: '', avisoAntes: 1, avisoHora: '09:00', gcal: false, gcalCal: '', ...(d.ajustes || {}) },
    activo: d.activo || null,
  };
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch { toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado'); }
  if (nube.lista) { clearTimeout(nube.temporizador); nube.temporizador = setTimeout(subir, 400); }
  programarGcal();
}

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const buscar = id => datos.tareas.find(t => t.id === id);

// Referencia correlativa por año: T-2026-001, T-2026-002…
function nuevaReferencia() {
  const y = new Date().getFullYear();
  const re = new RegExp(`^T-${y}-(\\d+)$`);
  const max = Math.max(0, ...datos.tareas.map(t => +(re.exec(t.referencia) || [])[1] || 0));
  return `T-${y}-${String(max + 1).padStart(3, '0')}`;
}

function nuevaTarea(extra = {}) {
  if (extra.espacio === 'equipo' && !extra.creadorId) extra = { ...extra, creadorId: nube.uid || '' };
  const a = datos.ajustes;
  const t = normalizarTarea({
    id: nuevoId(), referencia: nuevaReferencia(), creada: new Date().toISOString(),
    avisos: a.avisoAntes >= 0 ? [{ tipo: 'antes', dias: a.avisoAntes, hora: a.avisoHora || '09:00' }] : [],
    ...extra,
  });
  t.nltOriginal ||= t.nlt;
  return t;
}

const anotar = (t, texto, auto = true) => t.registro.push({ fecha: new Date().toISOString(), texto, auto, ...(nube.uid ? { uid: nube.uid } : {}) });

// ---------- Utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoy = () => iso(new Date());
const aFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const diasHasta = s => Math.round((utc(s) - utc(hoy())) / 864e5);
const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); };
const fmtMomento = ms => new Date(ms).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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

// Ventana propia de confirmación o texto (el visor de claude.ai bloquea confirm y prompt).
function preguntar(msg, { ok = 'Aceptar', peligro = false, valor = null } = {}) {
  return new Promise(res => {
    dlg2.innerHTML = `<div class="dlg-b"><p>${esc(msg)}</p>
      ${valor !== null ? `<input class="input" name="v" value="${esc(valor)}" style="margin-top:10px">` : ''}</div>
      <div class="dlg-f" style="flex-direction:row-reverse"><button type="button" class="btn ${peligro ? 'danger' : 'primary'}" data-r="si">${esc(ok)}</button>
      <button type="button" class="btn" data-r="no">Cancelar</button></div>`;
    const cerrar = si => {
      const v = $('[name=v]', dlg2)?.value ?? null;
      dlg2.onclick = dlg2.onkeydown = dlg2.oncancel = null;
      dlg2.close();
      res(valor === null ? si : si ? v : null);
    };
    dlg2.onclose = null;
    dlg2.onclick = e => { const b = e.target.closest('[data-r]'); if (b) cerrar(b.dataset.r === 'si'); };
    dlg2.onkeydown = e => { if (e.key === 'Enter' && e.target.name === 'v') { e.preventDefault(); cerrar(true); } };
    dlg2.oncancel = e => { e.preventDefault(); cerrar(false); };
    dlg2.showModal();
    ($('[name=v]', dlg2) || $('[data-r=si]', dlg2)).focus();
  });
}

function toast(txt) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.append(el); }
  el.textContent = txt;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 3200);
}

// ---------- Diagnóstico ----------
// Guarda los últimos errores y el estado de la sincronización; se ven en Ajustes y se copian a la nube
// (data/users/<id>/diag) para poder revisarlos a distancia.
const diag = { errores: [], ultimaOk: 0, temporizador: 0 };
function registrarError(txt) {
  diag.errores.unshift(`${new Date().toLocaleTimeString('es-ES')} · ${String(txt).slice(0, 300)}`);
  diag.errores.length = Math.min(diag.errores.length, 20);
  const el = $('#diagErrores');
  if (el) el.innerHTML = diag.errores.map(e => `<li>${esc(e)}</li>`).join('');
  clearTimeout(diag.temporizador);
  diag.temporizador = setTimeout(enviarDiagnostico, 3000);
}
window.addEventListener('error', e => { registrarError(`Error: ${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})`); toast('Ha ocurrido un error: mira Ajustes → Diagnóstico'); });
window.addEventListener('unhandledrejection', e => registrarError(`Promesa rechazada: ${e.reason?.code || ''} ${e.reason?.message || e.reason}`));

function textoDiagnostico() {
  let ls = 'sí';
  try { localStorage.setItem(CLAVE + '-prueba', '1'); localStorage.removeItem(CLAVE + '-prueba'); } catch { ls = 'no'; }
  return [`Versión: ${VERSION_APP}`, `Nube conectada: ${nube.lista ? 'sí' : 'no'} (estado: ${nube.estado})`,
    `Usuario identificado: ${nube.uid ? 'sí' : 'no'}`, `Escrituras pendientes: ${nube.pendientes.size}`,
    `Última escritura correcta: ${diag.ultimaOk ? new Date(diag.ultimaOk).toLocaleString('es-ES') : '—'}`,
    `Memoria del navegador: ${ls}`, `Categorías: ${datos.categorias.length}`, `Navegador: ${navigator.userAgent}`,
    '', 'Errores recientes:', ...(diag.errores.length ? diag.errores : ['ninguno'])].join('\n');
}

// Directa, fuera de la cola de envíos, para que llegue aunque la cola esté atascada
async function enviarDiagnostico() {
  if (!nube.diagRef) return;
  try {
    await nube.diagRef.set({ texto: textoDiagnostico(), momento: new Date().toISOString(), errores: diag.errores });
  } catch (e) { /* sin nube, el diagnóstico se ve en Ajustes */ }
}

// Dentro de claude.ai la página no puede descargar por sí misma: se pide al visor con la capacidad "downloads".
let capDescargas = null;
async function descargar(nombre, contenido, tipo) {
  capDescargas ||= window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  const dl = await capDescargas;
  if (dl) {
    try { await dl.save({ filename: nombre, data: new Blob([contenido], { type: tipo }) }); }
    catch (e) { if (e?.code !== 'declined') toast('No se pudo guardar el archivo'); }
    return;
  }
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Reglas de NLT, avisos y dependencias ----------
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

// Momentos de aviso de una tarea: «n días antes del NLT» o una fecha concreta, siempre con hora
function momentosAviso(t, conPropios = true) {
  const avisos = conPropios && enEquipo(t) ? [...t.avisos, ...(datos.avisosPropios[t.id] || [])] : t.avisos;
  return avisos.map(a => {
    const f = a.tipo === 'fecha' ? a.fecha : t.nlt ? sumarDias(t.nlt, -(+a.dias || 0)) : '';
    if (!f) return null;
    const [h, m] = (a.hora || '09:00').split(':').map(Number);
    const d = aFecha(f); d.setHours(h, m, 0, 0);
    const txt = a.tipo === 'fecha' ? fmtMomento(d.getTime())
      : `${+a.dias ? `${a.dias} d antes del NLT` : 'El día del NLT'} · ${fmtMomento(d.getTime())}`;
    return { ms: d.getTime(), a, txt };
  }).filter(Boolean).sort((x, y) => x.ms - y.ms);
}
const avisoActivo = t => t.estado !== 'hecha' && meToca(t) && momentosAviso(t).some(m => m.ms <= Date.now() && m.ms > vistoDe(t));
const proximoAviso = t => t.estado !== 'hecha' ? momentosAviso(t).find(m => m.ms > Date.now()) : null;

const bloqueantes = t => t.dependeDe.map(buscar).filter(d => d && d.estado !== 'hecha');
const progreso = t => t.estado === 'hecha' ? 100
  : t.subtareas.length ? Math.round(t.subtareas.filter(s => s.ok).length / t.subtareas.length * 100) : +t.progreso || 0;
const prorrogas = t => t.prorrogas.filter(p => p.de && p.a > p.de).length;
// Equipo: las tareas compartidas llevan responsable por id de usuario; lo personal de cada uno va en su config
const enEquipo = t => t.espacio === 'equipo';
const nombreDe = uid => uid === nube.uid ? (datos.ajustes.miNombre || nube.miNombre || 'Yo') : (nube.nombres.get(uid) || 'Miembro del equipo');
const nombreResp = t => t.responsableId ? nombreDe(t.responsableId) : t.responsable;
const esMia = t => t.responsableId ? t.responsableId === nube.uid
  : enEquipo(t) ? false : (!t.responsable || t.responsable === datos.ajustes.miNombre);
// A quién le suenan los avisos y va a su Google Calendar: personales, o de equipo asignadas a mí (o creadas por mí sin asignar)
const meToca = t => !enEquipo(t) || t.responsableId === nube.uid || (!t.responsableId && t.creadorId === nube.uid);
const vistoDe = t => enEquipo(t) ? (datos.vistos[t.id] || 0) : (t.avisoVisto || 0);
const puedeEquipo = () => nube.equipo && !nube.equipoSoloLectura;
const soloLectura = t => enEquipo(t) && !puedeEquipo();
const pendienteEnterado = t => enEquipo(t) && t.estado !== 'hecha' && t.responsableId && !((t.acuses[t.responsableId] || 0) >= t.asignadaEn);
const gcalDe = t => enEquipo(t) ? datos.gcalMapa[t.id] || null : t.gcal;
function ponerGcal(t, g) {
  if (!enEquipo(t)) { t.gcal = g; return; }
  if (g) datos.gcalMapa[t.id] = g; else delete datos.gcalMapa[t.id];
}
const persona = nombre => datos.personas.find(p => p.nombre === nombre);

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
  if (soloLectura(t)) { toast('Solo puedes consultar las tareas del equipo'); return; }
  if (hecha) {
    if (datos.activo?.id === id) pararTiempo();
    t.estado = 'hecha';
    t.hecha = new Date().toISOString();
    anotar(t, 'Completada');
    if (t.repetir && t.nlt) {
      const nlt = siguienteNlt(t.nlt, t.repetir);
      const sig = nuevaTarea({
        ...structuredClone(t), id: nuevoId(), referencia: nuevaReferencia(), creada: new Date().toISOString(),
        estado: 'pendiente', hecha: null, nlt, nltOriginal: nlt, prorrogas: [], avisoVisto: 0, progreso: 0,
        resultado: '', tiempo: [], registro: [], gcal: null,
      });
      sig.subtareas.forEach(s => { s.ok = false; });
      datos.tareas.push(sig);
      toast(`Hecha. Siguiente NLT: ${fmtFecha(sig.nlt)}`);
    } else {
      toast('Tarea hecha');
    }
  } else {
    t.estado = 'pendiente';
    t.hecha = null;
    anotar(t, 'Reabierta');
  }
  guardar();
}

function cambiarEstado(id, estado) {
  const t = buscar(id);
  if (!t || t.estado === estado) return;
  if (soloLectura(t)) { toast('Solo puedes consultar las tareas del equipo'); return; }
  if (estado === 'hecha') return marcarHecha(id, true);
  anotar(t, `Estado: ${NOMBRE_ESTADO[t.estado]} → ${NOMBRE_ESTADO[estado]}`);
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
  if (t && Date.now() - a.inicio > 30000) t.tiempo.push({ inicio: a.inicio, fin: Date.now(), ...(nube.uid ? { uid: nube.uid } : {}) });
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
let filtro = { q: '', cat: '', resp: '', esp: '', kpi: '' };

function filtrar(lista) {
  const q = filtro.q.trim().toLowerCase();
  return lista.filter(t => (!filtro.cat || t.categoria === filtro.cat)
    && (!filtro.esp || t.espacio === filtro.esp)
    && (!filtro.resp || (filtro.resp === '__mias' ? esMia(t) : filtro.resp === '__otros' ? !esMia(t) && !!nombreResp(t)
      : filtro.resp === '__sin' ? enEquipo(t) && !nombreResp(t) : nombreResp(t) === filtro.resp))
    && (!q || [t.titulo, t.referencia, t.descripcion, t.notas, t.categoria, t.lugar, nombreResp(t), t.ordenadaPor, ...t.colaboradores]
      .join(' ').toLowerCase().includes(q)));
}

function responsablesUsados() {
  const s = new Set(datos.personas.map(p => p.nombre));
  nube.miembros.filter(id => id !== nube.uid).forEach(id => s.add(nombreDe(id)));
  datos.tareas.forEach(t => nombreResp(t) && !esMia(t) && s.add(nombreResp(t)));
  s.delete(datos.ajustes.miNombre);
  return [...s].sort();
}

function barraFiltros() {
  const r = filtro.resp;
  return `<div class="filtros">
    <input class="input" type="search" id="fq" placeholder="Buscar por asunto, referencia, persona…" value="${esc(filtro.q)}">
    <select class="input" id="fcat"><option value="">Todas las categorías</option>
      ${categoriasUsadas().map(c => `<option ${c === filtro.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <select class="input" id="fresp"><option value="">Todos los responsables</option>
      <option value="__mias" ${r === '__mias' ? 'selected' : ''}>Asignadas a mí</option>
      <option value="__otros" ${r === '__otros' ? 'selected' : ''}>Delegadas en otros</option>
      ${nube.equipo ? `<option value="__sin" ${r === '__sin' ? 'selected' : ''}>Equipo sin asignar</option>` : ''}
      ${responsablesUsados().map(p => `<option ${p === r ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
    ${nube.equipo ? `<select class="input" id="fesp"><option value="">Personales y de equipo</option>
      <option value="personal" ${filtro.esp === 'personal' ? 'selected' : ''}>Solo personales</option>
      <option value="equipo" ${filtro.esp === 'equipo' ? 'selected' : ''}>Solo de equipo</option></select>` : ''}
  </div>`;
}

function categoriasUsadas() {
  const s = new Set(datos.categorias);
  datos.tareas.forEach(t => t.categoria && s.add(t.categoria));
  return [...s];
}

// Desplegable con todas las categorías (en el móvil una lista de sugerencias solo enseña las que coinciden con lo escrito)
function selectorCategoria(actual, nombre = 'categoria') {
  const cats = categoriasUsadas();
  return `<select class="input" name="${nombre}" data-selcat>
      <option value="">— Sin categoría —</option>
      ${cats.map(c => `<option value="${esc(c)}" ${c === actual ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      <option value="__nueva">+ Nueva categoría…</option></select>
    <input class="input" name="${nombre}Nueva" placeholder="Nombre de la nueva categoría" hidden style="margin-top:6px">`;
}
document.addEventListener('change', e => {
  if (!e.target.matches?.('[data-selcat]')) return;
  const nueva = e.target.parentElement.querySelector(`[name="${e.target.name}Nueva"]`);
  nueva.hidden = e.target.value !== '__nueva';
  nueva.required = !nueva.hidden;
  if (!nueva.hidden) nueva.focus();
});
const leerCategoria = (form, nombre = 'categoria') => form.elements[nombre].value === '__nueva'
  ? form.elements[nombre + 'Nueva'].value.trim() : form.elements[nombre].value;

const iniciales = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

function tarjeta(t, extra = '') {
  const u = urgencia(t);
  const hecha = t.estado === 'hecha';
  const subOk = t.subtareas.filter(s => s.ok).length;
  const tt = tiempoTotal(t);
  const pr = progreso(t);
  const bloq = !hecha && bloqueantes(t).length;
  const nPr = prorrogas(t);
  return `<div class="card tarea u-${u.cls} ${hecha ? 'hecha' : ''}" data-id="${t.id}" draggable="true">
    <input type="checkbox" class="tick" data-tick="${t.id}" ${hecha ? 'checked' : ''} aria-label="Marcar como hecha">
    <div class="grow">
      ${t.referencia ? `<div class="ref">${esc(t.referencia)}${t.ordenadaPor ? ` · de ${esc(t.ordenadaPor)}` : ''}</div>` : ''}
      <div class="tit ${hecha ? 'tachado' : ''}"><span class="prio-${t.prioridad}" title="Prioridad ${PRIOS[t.prioridad]}">●</span> ${esc(t.titulo)}</div>
      <div class="meta row wrap small">
        ${t.prioridad === 'critica' && !hecha ? '<span class="badge crit">CRÍTICA</span>' : ''}
        <span class="badge ${u.cls}">${u.txt}</span>
        ${t.nlt ? `<span class="muted">NLT ${fmtFecha(t.nlt)}${t.hora ? ' · ' + t.hora : ''}</span>` : ''}
        ${nPr ? `<span class="badge warn" title="NLT original: ${fmtFecha(t.nltOriginal)}">Prorrogada ×${nPr}</span>` : ''}
        ${avisoActivo(t) ? '<span class="badge bad">🔔 Aviso</span>' : ''}
        ${bloq ? `<span class="badge bad" title="Depende de tareas sin terminar">⛔ Bloqueada</span>` : ''}
        ${enEquipo(t) ? '<span class="badge equipo" title="Tarea del equipo">👥 Equipo</span>' : ''}
        ${nombreResp(t) && !esMia(t) ? `<span class="persona" title="Responsable: ${esc(nombreResp(t))}"><i>${esc(iniciales(nombreResp(t)))}</i>${esc(nombreResp(t))}</span>` : ''}
        ${enEquipo(t) && !nombreResp(t) && !hecha ? '<span class="badge none">Sin asignar</span>' : ''}
        ${enEquipo(t) && t.responsableId && t.responsableId !== nube.uid && !hecha
          ? (pendienteEnterado(t) ? '<span class="badge warn" title="El responsable aún no ha confirmado">Sin «enterado»</span>' : '<span class="badge ok">✓ Enterado</span>') : ''}
        ${t.categoria ? `<span class="chip">${esc(t.categoria)}</span>` : ''}
        ${t.lugar ? `<span class="muted">📍 ${esc(t.lugar)}</span>` : ''}
        ${t.estado === 'curso' || t.estado === 'espera' ? `<span class="badge info">${NOMBRE_ESTADO[t.estado]}</span>` : ''}
        ${t.repetir ? `<span class="muted" title="${REPETIR[t.repetir]}">↻</span>` : ''}
        ${gcalDe(t)?.id && !hecha ? '<span class="muted" title="En Google Calendar">📅</span>' : ''}
        ${t.subtareas.length ? `<span class="muted">☑ ${subOk}/${t.subtareas.length}</span>` : ''}
        ${tt ? `<span class="muted">⏱ ${fmtDur(tt)}</span>` : ''}
        ${datos.activo?.id === t.id ? '<span class="badge warn">En marcha</span>' : ''}
      </div>
      ${pr && !hecha ? `<div class="progress" title="${pr}%"><i style="width:${pr}%"></i></div>` : ''}
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

  const lista = filtrar(datos.tareas);
  const grupos = [
    ['vencidas', 'NLT vencidas'], ['hoy', 'Vencen hoy'], ['semana', 'Próximos 7 días'],
    ['despues', 'Más adelante'], ['sin', 'Sin NLT'],
  ].filter(([g]) => !filtro.kpi || filtro.kpi === 'abiertas' || filtro.kpi === g);

  const bloques = grupos.map(([g, titulo]) => {
    const ts = lista.filter(t => urgencia(t).grupo === g).sort(ordenar);
    if (!ts.length) return '';
    return `<h2 class="sec"><span>${titulo}</span><span>${ts.length}</span></h2>${ts.map(t => tarjeta(t)).join('')}`;
  }).join('');

  const avisos = filtrar(datos.tareas).filter(avisoActivo).sort(ordenar);
  const asignadas = datos.tareas.filter(t => t.responsableId === nube.uid && pendienteEnterado(t)).sort(ordenar);
  const hechas = lista.filter(t => t.estado === 'hecha').sort((a, b) => (b.hecha || '').localeCompare(a.hecha || ''));

  return `
    ${asignadas.length ? `<section class="card asignadas"><h3>📥 Te han asignado (${asignadas.length})</h3>
      <p class="small muted">Confirma con «Enterado» para que quien la encargó sepa que la has recibido.</p>
      ${asignadas.map(t => tarjeta(t, `<div class="row gap" style="margin-top:8px">
        <button class="btn sm primary" data-enterado="${t.id}">✓ Enterado</button></div>`)).join('')}</section>` : ''}
    ${avisos.length ? `<section class="card avisos"><h3>🔔 Avisos (${avisos.length})</h3>
      ${avisos.map(t => tarjeta(t, `<div class="row gap" style="margin-top:8px">
        <button class="btn sm" data-visto="${t.id}">Visto</button>
        <button class="btn sm" data-posponer="${t.id}">Recordar mañana</button></div>`)).join('')}</section>` : ''}
    <form class="card" id="rapida">
      <div class="row gap wrap">
        <input class="input grow" name="titulo" placeholder="Tarea rápida… (para más datos, pulsa +)" required style="min-width:180px">
        <input class="input" type="date" name="nlt" title="NLT: fecha límite para finalizar" style="width:auto">
        <button type="button" class="btn primary" data-enviar>Añadir</button>
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
    for (const r of t.registro) {
      if (r.auto && (r.texto === 'Completada')) continue; // ya figura como «Completada»
      if (dentro(Date.parse(r.fecha))) eventos.push({ ms: Date.parse(r.fecha), t, txt: (r.auto ? '⚙ ' : '✎ ') + r.texto });
    }
  }
  eventos.sort((x, y) => y.ms - x.ms);
  return { tiempo, hechas, aTiempo, creadas, tiempoCat, hechasCat, eventos };
}

function cargaPorResponsable() {
  const filas = {};
  for (const t of datos.tareas) {
    if (t.estado === 'hecha') continue;
    const r = esMia(t) ? (datos.ajustes.miNombre || nube.miNombre || 'Yo') : nombreResp(t) || 'Sin asignar';
    const f = filas[r] ||= { abiertas: 0, vencidas: 0, criticas: 0 };
    f.abiertas++;
    if (urgencia(t).grupo === 'vencidas') f.vencidas++;
    if (t.prioridad === 'critica') f.criticas++;
  }
  return Object.entries(filas).sort((x, y) => y[1].abiertas - x[1].abiertas);
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
  const carga = cargaPorResponsable();

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
        <div>${selectorCategoria(datos.ajustes.ultimaCat || '')}</div>
        <input class="input" name="min" type="number" min="0" step="5" placeholder="Minutos dedicados">
      </div>
      <button type="button" class="btn primary block" data-enviar>Anotar</button>
    </form>
    <datalist id="dlcats">${categoriasUsadas().map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <div class="card"><h3>Carga de trabajo por responsable</h3>
      ${carga.length ? `<table class="tabla"><thead><tr><th>Responsable</th><th>Abiertas</th><th>Vencidas</th><th>Críticas</th></tr></thead><tbody>
        ${carga.map(([p, f]) => `<tr><td>${esc(p)}</td><td>${f.abiertas}</td><td class="${f.vencidas ? 'txt-bad' : ''}">${f.vencidas}</td><td>${f.criticas}</td></tr>`).join('')}
      </tbody></table>` : '<p class="small muted">No hay tareas abiertas.</p>'}</div>
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
  r.eventos.filter(e => e.txt.startsWith('✔')).forEach(e => lineas.push(`- ${e.t.referencia ? e.t.referencia + ' ' : ''}${e.t.titulo}${e.t.categoria ? ' [' + e.t.categoria + ']' : ''}`));
  const pend = datos.tareas.filter(t => t.estado !== 'hecha' && t.nlt).sort(ordenar).slice(0, 15);
  if (pend.length) {
    lineas.push('', 'Próximas NLT:');
    pend.forEach(t => lineas.push(`- ${fmtFecha(t.nlt)}: ${t.titulo}${nombreResp(t) && !esMia(t) ? ' (' + nombreResp(t) + ')' : ''} — ${urgencia(t).txt}`));
  }
  return lineas.join('\n');
}

// ---------- Vista: Ajustes ----------
let personaEdit = -1;

function vistaAjustes() {
  const a = datos.ajustes;
  const notif = 'Notification' in window ? Notification.permission : 'no';
  const pe = datos.personas[personaEdit] || {};
  return `
    <div class="card">
      <h3>Categorías</h3>
      <p class="small muted">Organiza todo lo que haces. Para renombrar una, cambia el nombre y pulsa Intro o sal del campo: sus tareas se actualizan.</p>
      <ul class="cats">${datos.categorias.map((c, i) => {
        const n = datos.tareas.filter(t => t.categoria === c).length;
        return `<li><input class="input" data-catnom="${i}" value="${esc(c)}" aria-label="Nombre de la categoría ${esc(c)}">
          <span class="small muted">${n} tarea${n === 1 ? '' : 's'}</span>
          <button class="btn sm danger" data-delcat="${i}" aria-label="Eliminar la categoría ${esc(c)}">Eliminar</button></li>`;
      }).join('') || '<li class="small muted">No hay categorías.</li>'}</ul>
      <form id="nuevaCat" class="row gap" style="margin-top:10px"><input class="input grow" name="c" placeholder="Nueva categoría" required><button type="button" class="btn" data-enviar>Añadir</button></form>
    </div>
    ${tarjetaEquipo()}
    <div class="card">
      <h3>Personas externas y directorio</h3>
      <p class="small muted">Personas a las que encargas tareas aunque no usen la app. Con correo o teléfono podrás enviarles la ficha.</p>
      <label class="lbl">Mi nombre (las tareas sin responsable o a mi nombre son «mías»)
        <input class="input" id="miNombre" value="${esc(a.miNombre)}" placeholder="Nombre y apellidos"></label>
      <ul class="log">${datos.personas.map((p, i) => `<li class="row between"><a href="#" data-editper="${i}" class="grow" style="color:inherit">
        <b>${esc(p.nombre)}</b>${p.cargo ? ` · <span class="muted">${esc(p.cargo)}</span>` : ''}
        <span class="small muted">${[p.email, p.telefono].filter(Boolean).map(esc).join(' · ')}</span></a>
        <button class="icon-btn" data-delper="${i}" aria-label="Quitar">✕</button></li>`).join('') || '<li class="muted small">Aún no hay nadie.</li>'}</ul>
      <form id="fpersona" class="grid2" style="margin-top:10px">
        <input class="input" name="nombre" placeholder="Nombre *" required value="${esc(pe.nombre || '')}">
        <input class="input" name="cargo" placeholder="Empleo / cargo / unidad" value="${esc(pe.cargo || '')}">
        <input class="input" name="email" type="email" placeholder="Correo" value="${esc(pe.email || '')}">
        <input class="input" name="telefono" type="tel" placeholder="Teléfono (con prefijo, p. ej. 34…)" value="${esc(pe.telefono || '')}">
        <button type="button" class="btn primary" data-enviar>${personaEdit >= 0 ? 'Guardar cambios' : 'Añadir persona'}</button>
        ${personaEdit >= 0 ? '<button type="button" class="btn" data-accion="cancelar-persona">Cancelar</button>' : ''}
      </form>
    </div>
    ${tarjetaGcal()}
    <div class="card">
      <h3>Avisos</h3>
      <label class="lbl">Aviso automático en las tareas nuevas
        <div class="row gap"><select class="input grow" id="avisoAntes">
          ${[[-1, 'Sin aviso'], [0, 'El mismo día del NLT'], [1, '1 día antes'], [2, '2 días antes'], [3, '3 días antes'], [5, '5 días antes'], [7, '1 semana antes'], [14, '2 semanas antes']]
            .map(([v, l]) => `<option value="${v}" ${v === +a.avisoAntes ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input class="input" type="time" id="avisoHora" value="${esc(a.avisoHora)}" style="width:auto"></div></label>
      <label class="lbl">Marcar en naranja cuando queden
        <select class="input" id="avisoDias">${[1, 2, 3, 5, 7, 10, 15].map(n => `<option ${n === a.avisoDias ? 'selected' : ''} value="${n}">${n} día${n > 1 ? 's' : ''} o menos</option>`).join('')}</select></label>
      ${notif === 'granted' ? '<p class="small muted">Notificaciones activadas mientras la app está abierta.</p>'
        : notif === 'no' ? ''
        : '<button class="btn block" data-accion="notif">Activar notificaciones</button>'}
      <button class="btn block" data-accion="ics">Exportar NLT y avisos a un archivo de calendario (.ics)</button>
      <p class="small muted">Para Outlook o el calendario del iPhone. Con Google Calendar, mejor la sincronización automática de arriba.</p>
    </div>
    <div class="card">
      <h3>Tema</h3>
      <select class="input" id="tema">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, v]) => `<option value="${k}" ${k === a.tema ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <div class="card">
      <h3>Sincronización</h3>
      ${nube.lista
        ? `<p class="ok-msg">☁ Sincronizado con tu cuenta de claude.ai</p>
           <p class="small muted">Abre este mismo enlace en el móvil, la tablet o cualquier ordenador donde inicies sesión en claude.ai y verás
           tus tareas al momento. Solo tú ves tus tareas, aunque compartas el enlace.</p>`
        : `<p class="small muted">Esta copia guarda los datos solo en este dispositivo${nube.estado === 'conectando' ? ' (conectando…)' : ''}.
           Para tenerlos en todos tus dispositivos, abre la versión sincronizada:</p>
           <a class="btn block" href="${URL_NUBE}" target="_blank" rel="noopener">Abrir Tareas NLT sincronizada</a>
           <p class="small muted">Si ya tenías tareas aquí, descarga una copia de seguridad y restáurala en la versión sincronizada.</p>`}
    </div>
    <div class="card">
      <h3>Datos</h3>
      <p class="small muted">${datos.tareas.length} tareas. Haz copias de seguridad de vez en cuando.</p>
      <p class="small muted">Versión de la app: <b>${VERSION_APP}</b></p>
      <button class="btn block" data-accion="exportar">Descargar copia de seguridad (.json)</button>
      <button class="btn block" data-accion="importar">Restaurar copia…</button>
      <button class="btn block" data-accion="csv-todo">Exportar todas las tareas (.csv, Excel)</button>
      <input type="file" id="fimport" accept="application/json,.json" hidden>
      <button class="btn danger block" data-accion="borrar">Borrar todos los datos</button>
    </div>
    <div class="card">
      <h3>Diagnóstico</h3>
      <pre class="diag">${esc(textoDiagnostico())}</pre>
      <ul class="log small" id="diagErrores" hidden></ul>
      <button type="button" class="btn block" data-accion="diag-sync">Reintentar sincronización</button>
      <button type="button" class="btn block" data-accion="diag-copiar">Copiar diagnóstico</button>
    </div>`;
}

// ---------- Ficha de la tarea (editor) ----------
let borrador = null;
let sucio = false;

const opciones = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');

function abrirEditor(id, base = {}) {
  const t = id && buscar(id);
  borrador = t ? structuredClone(t)
    : { ...nuevaTarea({ categoria: datos.ajustes.ultimaCat || datos.categorias[0] || '', ...base }), id: null };
  sucio = false;
  const b = borrador;
  b._nReg = b.registro.length; // lo que añada este editor a la bitácora se suma a lo que escriban otros
  const bloqueada = soloLectura(b);
  const miembros = [...new Set([nube.uid, ...nube.miembros, b.responsableId].filter(Boolean))];
  const nombres = [...new Set([datos.ajustes.miNombre, ...responsablesUsados()].filter(Boolean))];
  dlg.innerHTML = `<form method="dialog" id="fed" autocomplete="off">
    <div class="dlg-h"><h2>${t ? esc(t.referencia || 'Tarea') : 'Nueva tarea'}</h2><button type="button" class="icon-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-b">
      <h3 class="dsec">1 · La tarea</h3>
      ${bloqueada ? '<p class="aviso-msg">Tarea del equipo en modo consulta: no tienes permiso para modificarla.</p>' : ''}
      <label class="lbl">Asunto: qué hay que hacer *<input class="input" name="titulo" required value="${esc(b.titulo)}"></label>
      ${nube.equipo ? `<label class="lbl">Espacio<select class="input" name="espacio" ${puedeEquipo() ? '' : 'disabled'}>
        <option value="personal" ${!enEquipo(b) ? 'selected' : ''}>🔒 Personal: solo la veo yo</option>
        <option value="equipo" ${enEquipo(b) ? 'selected' : ''}>👥 Equipo: la ve y actualiza todo el equipo</option></select></label>` : ''}
      <div class="grid2">
        <label class="lbl">Referencia / nº de orden<input class="input" name="referencia" value="${esc(b.referencia)}"></label>
        <label class="lbl">Prioridad<select class="input" name="prioridad">${opciones(PRIOS, b.prioridad)}</select></label>
      </div>
      <label class="lbl">Descripción e instrucciones<textarea class="input" name="descripcion" rows="3" placeholder="Qué se pide exactamente, alcance, criterios…">${esc(b.descripcion)}</textarea></label>
      <div class="grid2">
        <label class="lbl">Categoría${selectorCategoria(b.categoria)}</label>
        <label class="lbl">Lugar / instalación<input class="input" name="lugar" value="${esc(b.lugar)}"></label>
      </div>

      <h3 class="dsec">2 · Quién</h3>
      <div class="grid2">
        <label class="lbl">Ordenada por<input class="input" name="ordenadaPor" list="dlper" value="${esc(b.ordenadaPor)}" placeholder="Quién la encarga"></label>
        <label class="lbl">Fecha de la orden<input class="input" type="date" name="fechaOrden" value="${b.fechaOrden}"></label>
      </div>
      <label class="lbl" id="respEquipo" ${enEquipo(b) ? '' : 'hidden'}>Responsable (miembro del equipo)<select class="input" name="responsableId">
        <option value="">— Sin asignar —</option>
        ${miembros.map(id => `<option value="${esc(id)}" ${id === b.responsableId ? 'selected' : ''}>${esc(nombreDe(id))}${id === nube.uid ? ' (yo)' : ''}</option>`).join('')}</select></label>
      <label class="lbl"><span id="respTxt">${enEquipo(b) ? 'O persona externa' : 'Responsable'}</span><input class="input" name="responsable" list="dlper" value="${esc(b.responsable)}" placeholder="${enEquipo(b) ? 'Nombre, si no usa la app' : esc(datos.ajustes.miNombre || 'Yo') + ' (vacío = yo)'}"></label>
      <div class="lbl">Colaboradores</div>
      <div class="row wrap" id="colabs"></div>
      <div class="row gap" style="margin-top:6px"><input class="input grow" id="ncolab" list="dlper" placeholder="Añadir colaborador (Intro)"><button type="button" class="btn" data-addcolab>+</button></div>

      <h3 class="dsec">3 · Plazo y avisos</h3>
      <div class="grid2">
        <label class="lbl">NLT · fecha límite<input class="input" type="date" name="nlt" value="${b.nlt}"></label>
        <label class="lbl">Hora límite<input class="input" type="time" name="hora" value="${b.hora}"></label>
      </div>
      <div class="row wrap small" style="margin-top:6px">
        ${[['Hoy', 0], ['Mañana', 1], ['+3 d', 3], ['+1 sem', 7], ['+2 sem', 14], ['+1 mes', 30]].map(([l, n]) => `<button type="button" class="btn sm" data-rapido="${n}">${l}</button>`).join('')}
        <button type="button" class="btn sm" data-rapido="">Sin NLT</button>
      </div>
      <label class="lbl" id="prorroga" hidden>Motivo del cambio de NLT *<input class="input" name="motivo" placeholder="Por qué se modifica el plazo"></label>
      ${b.prorrogas.length ? `<div class="small muted" style="margin-top:8px">NLT original: <b>${fmtFecha(b.nltOriginal) || '—'}</b>
        <ul class="log">${b.prorrogas.map(p => `<li>${new Date(p.fecha).toLocaleDateString('es-ES')} · ${fmtFecha(p.de) || 'sin NLT'} → ${fmtFecha(p.a) || 'sin NLT'}${p.motivo ? ' · ' + esc(p.motivo) : ''}</li>`).join('')}</ul></div>` : ''}
      <div class="lbl">Avisos / alarmas</div>
      <ul class="log" id="avisos"></ul>
      <div class="row gap wrap">
        <select class="input" id="avTipo" style="width:auto"><option value="antes">Días antes del NLT</option><option value="fecha">En una fecha</option></select>
        <input class="input" id="avDias" type="number" min="0" max="365" value="1" style="width:80px" aria-label="Días antes">
        <input class="input" id="avFecha" type="date" hidden style="width:auto" aria-label="Fecha del aviso">
        <input class="input" id="avHora" type="time" value="${esc(datos.ajustes.avisoHora || '09:00')}" style="width:auto" aria-label="Hora del aviso">
        <button type="button" class="btn" data-addaviso>+ Aviso</button>
      </div>
      ${gcalDe(b)?.link ? `<p class="small" style="margin-top:8px"><a href="${esc(gcalDe(b).link)}" target="_blank" rel="noopener">📅 Ver en Google Calendar</a></p>`
        : datos.ajustes.gcal ? '<p class="small muted" style="margin-top:8px">📅 Con NLT, se enviará a Google Calendar al guardar.</p>' : ''}
      <div class="grid2">
        <label class="lbl">Repetir<select class="input" name="repetir">${opciones(REPETIR, b.repetir)}</select></label>
        <label class="lbl">Tiempo estimado (horas)<input class="input" type="number" name="estimacionH" min="0" step="0.5" value="${+b.estimacionH || ''}"></label>
      </div>

      <h3 class="dsec">4 · Seguimiento</h3>
      <div class="grid2">
        <label class="lbl">Estado<select class="input" name="estado">${opciones(NOMBRE_ESTADO, b.estado)}</select></label>
        <label class="lbl">Avance: <output id="prog-v"></output><input type="range" name="progreso" min="0" max="100" step="5" value="${+b.progreso || 0}" style="width:100%;accent-color:var(--brand)"></label>
      </div>
      <div class="lbl">Pasos / subtareas</div>
      <div id="subs"></div>
      <div class="row gap"><input class="input grow" id="nsub" placeholder="Añadir paso (Intro)"><button type="button" class="btn" data-addsub>+</button></div>
      <div class="lbl">Depende de (no puede terminarse antes)</div>
      <ul class="log" id="deps"></ul>
      <div class="row gap"><select class="input grow" id="depSel"><option value="">Elegir tarea…</option></select><button type="button" class="btn" data-adddep>+</button></div>
      <div class="lbl">Tiempo dedicado</div>
      <div id="tiempo"></div>
      <div class="lbl">Bitácora e historial</div>
      <div class="row gap"><input class="input grow" id="nreg" placeholder="Anotar avance, llamada, incidencia… (Intro)"><button type="button" class="btn" data-addreg>+</button></div>
      <ul class="log" id="regs"></ul>

      <h3 class="dsec">5 · Observaciones y documentos</h3>
      <label class="lbl">Observaciones<textarea class="input" name="notas" rows="3">${esc(b.notas)}</textarea></label>
      <div class="lbl">Documentos y enlaces</div>
      <ul class="log" id="enls"></ul>
      <div class="row gap wrap"><input class="input" id="enlNom" placeholder="Nombre" style="flex:1;min-width:120px">
        <input class="input" id="enlUrl" type="url" placeholder="https://… (Drive, SharePoint, web)" style="flex:2;min-width:160px"><button type="button" class="btn" data-addenl>+</button></div>

      <h3 class="dsec">6 · Cierre</h3>
      <label class="lbl">Resultado / informe de cumplimiento<textarea class="input" name="resultado" rows="3" placeholder="Qué se hizo, cómo quedó, pendientes…">${esc(b.resultado)}</textarea></label>
      ${t ? `<p class="small muted" style="margin-top:12px">Creada el ${new Date(t.creada).toLocaleString('es-ES')}${t.hecha ? ` · Hecha el ${new Date(t.hecha).toLocaleString('es-ES')}` : ''}</p>` : ''}
      <div class="acciones">
        <button type="button" class="btn" data-compartir>✉ Enviar ficha</button>
        <button type="button" class="btn" data-ical>📅 Al calendario</button>
        ${t ? '<button type="button" class="btn" data-duplicar>Duplicar</button><button type="button" class="btn danger" data-borrar>Eliminar</button>' : ''}
      </div>
      <datalist id="dlcats2">${categoriasUsadas().map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      <datalist id="dlper">${nombres.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    </div>
    <div class="dlg-f">${bloqueada ? '<button type="button" class="btn" data-cerrar>Cerrar</button>' : '<button type="button" class="btn primary" data-guardar>Guardar</button>'}</div></form>`;
  pintarColabs(); pintarAvisos(); pintarSubs(); pintarDeps(); pintarTiempo(); pintarRegs(); pintarEnlaces(); pintarProgreso();
  dlg.showModal();
  if (!t) $('[name=titulo]', dlg).focus();
}

function pintarColabs() {
  $('#colabs', dlg).innerHTML = borrador.colaboradores.map((c, i) =>
    `<span class="persona"><i>${esc(iniciales(c))}</i>${esc(c)} <a href="#" data-delcolab="${i}" aria-label="Quitar">✕</a></span>`).join('')
    || '<span class="small muted">Nadie más.</span>';
}

function pintarAvisos() {
  borrador.nlt = $('[name=nlt]', dlg).value;
  $('#avisos', dlg).innerHTML = borrador.avisos.map((a, i) => {
    const m = momentosAviso({ ...borrador, avisos: [a] })[0];
    const txt = m ? m.txt : `${a.dias} d antes del NLT (pon un NLT)`;
    const pasado = m && m.ms <= Date.now();
    return `<li class="row between"><span class="${pasado ? 'muted' : ''}">🔔 ${esc(txt)}${pasado ? ' · ya pasó' : ''}</span>
      <button type="button" class="icon-btn" data-delaviso="${i}" aria-label="Quitar aviso">✕</button></li>`;
  }).join('') || '<li class="small muted">Sin avisos.</li>';
}

function pintarSubs() {
  $('#subs', dlg).innerHTML = borrador.subtareas.map((s, i) => `<div class="sub">
    <input type="checkbox" data-subok="${i}" ${s.ok ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brand)">
    <input class="input grow ${s.ok ? 'tachado' : ''}" data-subtxt="${i}" value="${esc(s.t)}">
    <button type="button" class="icon-btn" data-subdel="${i}" aria-label="Quitar paso">✕</button></div>`).join('');
  pintarProgreso();
}

function pintarProgreso() {
  const r = $('[name=progreso]', dlg);
  const auto = borrador.subtareas.length > 0;
  r.disabled = auto;
  if (auto) r.value = progreso({ ...borrador, estado: 'pendiente' });
  $('#prog-v', dlg).textContent = `${r.value}%${auto ? ' (según pasos)' : ''}`;
}

function pintarDeps() {
  $('#deps', dlg).innerHTML = borrador.dependeDe.map((id, i) => {
    const d = buscar(id);
    if (!d) return '';
    return `<li class="row between"><span>${d.estado === 'hecha' ? '✔' : '⛔'} ${esc(d.referencia ? d.referencia + ' · ' : '')}${esc(d.titulo)}
      <span class="small muted">${urgencia(d).txt}</span></span><button type="button" class="icon-btn" data-deldep="${i}" aria-label="Quitar">✕</button></li>`;
  }).join('');
  const candidatas = datos.tareas.filter(t => t.id !== borrador.id && t.estado !== 'hecha' && !borrador.dependeDe.includes(t.id)).sort(ordenar);
  $('#depSel', dlg).innerHTML = '<option value="">Elegir tarea…</option>'
    + candidatas.map(t => `<option value="${t.id}">${esc((t.referencia ? t.referencia + ' · ' : '') + t.titulo)}</option>`).join('');
}

function pintarTiempo() {
  const el = $('#tiempo', dlg);
  const t = borrador.id && buscar(borrador.id);
  const est = +$('[name=estimacionH]', dlg).value || 0;
  if (!t) { el.innerHTML = '<p class="small muted">Guarda la tarea para poder cronometrarla.</p>'; return; }
  const enMarcha = datos.activo?.id === t.id;
  el.innerHTML = `<div class="row gap wrap">
    <b>${fmtDur(tiempoTotal(t))}</b><span class="small muted">${est ? `de ${est} h estimadas · ` : ''}${t.tiempo.length} sesión${t.tiempo.length === 1 ? '' : 'es'}</span>
    <span class="grow"></span>
    <button type="button" class="btn sm ${enMarcha ? 'danger' : 'primary'}" data-crono>${enMarcha ? '⏹ Parar' : '▶ Empezar'}</button>
    <input class="input" id="manmin" type="number" min="1" step="5" placeholder="min" style="width:80px;min-height:34px;padding:4px 8px">
    <button type="button" class="btn sm" data-manual>+ Añadir</button></div>`;
}

function pintarRegs() {
  $('#regs', dlg).innerHTML = [...borrador.registro].reverse().map(r =>
    `<li class="${r.auto ? 'muted' : ''}"><span class="muted small">${new Date(r.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
      ${r.auto ? '⚙' : '✎'} ${esc(r.texto)}${r.uid && r.uid !== nube.uid ? ` <span class="small muted">· ${esc(nombreDe(r.uid))}</span>` : ''}</li>`).join('');
}

function pintarEnlaces() {
  $('#enls', dlg).innerHTML = borrador.enlaces.map((e, i) => `<li class="row between">
    <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(e.nombre || e.url)}</a>
    <button type="button" class="icon-btn" data-delenl="${i}" aria-label="Quitar">✕</button></li>`).join('');
}

// Cambiar un NLT ya fijado exige dejar constancia del motivo
function revisarProrroga() {
  const orig = borrador.id && buscar(borrador.id);
  const nuevo = $('[name=nlt]', dlg).value;
  const pide = !!(orig && orig.nlt && nuevo !== orig.nlt);
  $('#prorroga', dlg).hidden = !pide;
  $('[name=motivo]', dlg).required = pide;
  pintarAvisos();
}

function leerFormulario() {
  const f = $('#fed', dlg);
  const v = n => f.elements[n].value;
  Object.assign(borrador, {
    titulo: v('titulo').trim(), referencia: v('referencia').trim(), prioridad: v('prioridad'), descripcion: v('descripcion'),
    categoria: leerCategoria(f), lugar: v('lugar').trim(), ordenadaPor: v('ordenadaPor').trim(), fechaOrden: v('fechaOrden'),
    responsable: v('responsable').trim(), espacio: f.elements.espacio?.value || borrador.espacio,
    responsableId: (f.elements.espacio?.value || borrador.espacio) === 'equipo' ? f.elements.responsableId.value : '', nlt: v('nlt'), hora: v('hora'), repetir: v('repetir'), estimacionH: +v('estimacionH') || 0,
    estado: v('estado'), progreso: +v('progreso') || 0, notas: v('notas'), resultado: v('resultado'),
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
    if (nombreResp(actual) !== nombreResp(b)) anotar(b, `Responsable: ${nombreResp(actual) || 'sin asignar'} → ${nombreResp(b) || 'sin asignar'}`);
    if (b.responsableId !== actual.responsableId) b.asignadaEn = b.responsableId ? Date.now() : 0;
    if (b.espacio !== actual.espacio) {
      anotar(b, b.espacio === 'equipo' ? 'Pasada al espacio del equipo' : 'Pasada a personal');
      // Lo personal de la tarea (evento de Google Calendar) cambia de sitio con ella
      const g = gcalDe(actual);
      if (b.espacio === 'equipo') { b.gcal = null; b.creadorId ||= nube.uid || ''; if (g) datos.gcalMapa[b.id] = g; }
      else { b.gcal = g; delete datos.gcalMapa[b.id]; b.responsableId = ''; }
    }
    if (actual.prioridad !== b.prioridad) anotar(b, `Prioridad: ${PRIOS[actual.prioridad]} → ${PRIOS[b.prioridad]}`);
    if (actual.estado !== b.estado && b.estado !== 'hecha') anotar(b, `Estado: ${NOMBRE_ESTADO[actual.estado]} → ${NOMBRE_ESTADO[b.estado]}`);
    if (actual.nlt !== b.nlt) {
      const motivo = $('[name=motivo]', dlg).value.trim();
      if (actual.nlt) b.prorrogas.push({ fecha: new Date().toISOString(), de: actual.nlt, a: b.nlt, motivo });
      anotar(b, `NLT: ${fmtFecha(actual.nlt) || 'sin NLT'} → ${fmtFecha(b.nlt) || 'sin NLT'}${motivo ? '. Motivo: ' + motivo : ''}`);
      b.nltOriginal ||= b.nlt;
    }
    const pasaAHecha = b.estado === 'hecha' && actual.estado !== 'hecha';
    const estado = b.estado;
    const { _nReg, ...cambio } = b;
    Object.assign(actual, { ...cambio, tiempo: actual.tiempo, acuses: actual.acuses,
      registro: [...actual.registro, ...b.registro.slice(_nReg)],
      estado: pasaAHecha ? actual.estado : estado, hecha: estado === 'hecha' ? actual.hecha : null });
    if (pasaAHecha) marcarHecha(actual.id, true);
  } else {
    const { _nReg, ...cambio } = b;
    const nueva = { ...cambio, id: nuevoId(), creada: new Date().toISOString(), hecha: null, nltOriginal: b.nlt };
    if (enEquipo(nueva)) { nueva.creadorId = nube.uid || ''; nueva.gcal = null; if (nueva.responsableId) nueva.asignadaEn = Date.now(); }
    const hecha = nueva.estado === 'hecha';
    if (hecha) nueva.estado = 'pendiente';
    datos.tareas.push(nueva);
    if (hecha) marcarHecha(nueva.id, true);
  }
  guardar();
  return true;
}

async function cerrarEditor() {
  if (sucio && !(await preguntar('¿Cerrar sin guardar los cambios?', { ok: 'Descartar', peligro: true }))) return;
  dlg.close();
}

dlg.addEventListener('cancel', e => { e.preventDefault(); cerrarEditor(); });

dlg.addEventListener('click', e => {
  const d = e.target.closest('button, input[type=checkbox], a[data-delcolab]');
  if (!d) return;
  const ds = d.dataset;
  if (d.hasAttribute('data-guardar')) { guardarEditor(); return; }
  if (d.hasAttribute('data-cerrar')) { cerrarEditor(); return; }
  if (ds.rapido !== undefined) {
    $('[name=nlt]', dlg).value = ds.rapido === '' ? '' : sumarDias(hoy(), +ds.rapido);
    if (ds.rapido === '') $('[name=hora]', dlg).value = '';
    sucio = true; revisarProrroga();
  } else if (d.hasAttribute('data-addcolab')) addColab();
  else if (ds.delcolab !== undefined) { e.preventDefault(); borrador.colaboradores.splice(+ds.delcolab, 1); sucio = true; pintarColabs(); }
  else if (d.hasAttribute('data-addaviso')) {
    const tipo = $('#avTipo', dlg).value, hora = $('#avHora', dlg).value || '09:00';
    if (tipo === 'fecha') {
      const fecha = $('#avFecha', dlg).value;
      if (!fecha) { toast('Elige la fecha del aviso'); return; }
      borrador.avisos.push({ tipo, fecha, hora });
    } else {
      borrador.avisos.push({ tipo, dias: Math.max(0, +$('#avDias', dlg).value || 0), hora });
      if (!$('[name=nlt]', dlg).value) toast('Este aviso se activará cuando pongas un NLT');
    }
    sucio = true; pintarAvisos();
  } else if (ds.delaviso !== undefined) { borrador.avisos.splice(+ds.delaviso, 1); sucio = true; pintarAvisos(); }
  else if (d.hasAttribute('data-addsub')) addSub();
  else if (ds.subok !== undefined) { borrador.subtareas[ds.subok].ok = d.checked; sucio = true; pintarSubs(); }
  else if (ds.subdel !== undefined) { borrador.subtareas.splice(ds.subdel, 1); sucio = true; pintarSubs(); }
  else if (d.hasAttribute('data-adddep')) {
    const id = $('#depSel', dlg).value;
    if (id) { borrador.dependeDe.push(id); sucio = true; pintarDeps(); }
  } else if (ds.deldep !== undefined) { borrador.dependeDe.splice(+ds.deldep, 1); sucio = true; pintarDeps(); }
  else if (d.hasAttribute('data-addenl')) addEnlace();
  else if (ds.delenl !== undefined) { borrador.enlaces.splice(+ds.delenl, 1); sucio = true; pintarEnlaces(); }
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
      buscar(borrador.id).tiempo.push({ inicio: fin - min * 60000, fin, ...(nube.uid ? { uid: nube.uid } : {}) });
      guardar(); pintarTiempo(); render();
    }
  } else if (d.hasAttribute('data-compartir')) {
    leerFormulario(); compartir(borrador);
  } else if (d.hasAttribute('data-ical')) {
    leerFormulario();
    if (!borrador.nlt) { toast('Pon un NLT para pasarla al calendario'); return; }
    descargar(`${borrador.referencia || 'tarea'}.ics`, ics([borrador]), 'text/calendar;charset=utf-8');
  } else if (d.hasAttribute('data-borrar')) {
    const id = borrador.id;
    preguntar(enEquipo(borrador) ? '¿Eliminar esta tarea para TODO el equipo?' : '¿Eliminar esta tarea?', { ok: 'Eliminar', peligro: true }).then(si => {
      if (!si) return;
      if (datos.activo?.id === id) datos.activo = null;
      borrarEventosDe(datos.tareas.filter(t => t.id === id));
      datos.tareas = datos.tareas.filter(t => t.id !== id);
      datos.tareas.forEach(t => { t.dependeDe = t.dependeDe.filter(x => x !== id); });
      guardar(); dlg.close(); render(); pintarCrono();
    });
  } else if (d.hasAttribute('data-duplicar')) {
    leerFormulario();
    const copia = {
      ...structuredClone(borrador), titulo: borrador.titulo + ' (copia)', referencia: nuevaReferencia(), estado: 'pendiente',
      hecha: null, prorrogas: [], avisoVisto: 0, progreso: 0, resultado: '', tiempo: [], registro: [], gcal: null,
    };
    copia.subtareas.forEach(s => { s.ok = false; });
    delete copia.id;
    dlg.close();
    abrirEditor(null, copia);
    sucio = true;
  }
});

dlg.addEventListener('input', e => {
  const el = e.target;
  if (!el.closest('#fed')) return;
  sucio = true;
  if (el.dataset.subtxt !== undefined) borrador.subtareas[el.dataset.subtxt].t = el.value;
  else if (el.name === 'nlt') revisarProrroga();
  else if (el.name === 'espacio') {
    const eq = el.value === 'equipo';
    $('#respEquipo', dlg).hidden = !eq;
    $('#respTxt', dlg).textContent = eq ? 'O persona externa' : 'Responsable';
  }
  else if (el.name === 'progreso') pintarProgreso();
  else if (el.name === 'estimacionH') pintarTiempo();
  else if (el.id === 'avTipo') { $('#avDias', dlg).hidden = el.value === 'fecha'; $('#avFecha', dlg).hidden = el.value !== 'fecha'; }
});
dlg.addEventListener('change', e => { if (e.target.id === 'avTipo') e.target.dispatchEvent(new Event('input', { bubbles: true })); });

dlg.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const acciones = { nsub: addSub, nreg: addReg, ncolab: addColab, enlUrl: addEnlace };
  if (acciones[e.target.id]) { e.preventDefault(); acciones[e.target.id](); }
});

function addSub() {
  const i = $('#nsub', dlg);
  if (!i.value.trim()) return;
  borrador.subtareas.push({ t: i.value.trim(), ok: false });
  i.value = ''; sucio = true; pintarSubs(); i.focus();
}

function addReg() {
  const i = $('#nreg', dlg);
  if (!i.value.trim()) return;
  anotar(borrador, i.value.trim(), false);
  i.value = ''; sucio = true; pintarRegs(); i.focus();
}

function addColab() {
  const i = $('#ncolab', dlg);
  const n = i.value.trim();
  if (!n || borrador.colaboradores.includes(n)) return;
  borrador.colaboradores.push(n);
  i.value = ''; sucio = true; pintarColabs(); i.focus();
}

function addEnlace() {
  let url = $('#enlUrl', dlg).value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  borrador.enlaces.push({ nombre: $('#enlNom', dlg).value.trim(), url });
  $('#enlUrl', dlg).value = ''; $('#enlNom', dlg).value = '';
  sucio = true; pintarEnlaces();
}

// El visor de claude.ai bloquea el envío de formularios: todo se hace con botones, nunca con «submit»
dlg.addEventListener('submit', e => e.preventDefault());

function guardarEditor() {
  if (!$('#fed', dlg).reportValidity()) return;
  if (!guardarBorrador()) return;
  dlg.close();
  render();
}

// ---------- Enviar la ficha al responsable ----------
function fichaTexto(t) {
  const l = [];
  l.push(`TAREA ${t.referencia || ''}`.trim(), `Asunto: ${t.titulo}`);
  l.push(`Prioridad: ${PRIOS[t.prioridad]}${t.categoria ? ' · ' + t.categoria : ''}${t.lugar ? ' · Lugar: ' + t.lugar : ''}`);
  if (t.ordenadaPor) l.push(`Ordenada por: ${t.ordenadaPor}${t.fechaOrden ? ' (' + fmtFecha(t.fechaOrden, false) + ')' : ''}`);
  l.push(`Responsable: ${nombreResp(t) || (enEquipo(t) ? 'sin asignar' : datos.ajustes.miNombre || '—')}`);
  if (t.colaboradores.length) l.push(`Colaboradores: ${t.colaboradores.join(', ')}`);
  l.push(`NLT: ${t.nlt ? fmtFecha(t.nlt) + (t.hora ? ' a las ' + t.hora : '') : 'sin fecha límite'}`);
  if (prorrogas(t)) l.push(`(NLT original: ${fmtFecha(t.nltOriginal)})`);
  if (t.descripcion.trim()) l.push('', 'Instrucciones:', t.descripcion.trim());
  if (t.subtareas.length) l.push('', 'Pasos:', ...t.subtareas.map(s => `${s.ok ? '[x]' : '[ ]'} ${s.t}`));
  if (t.notas.trim()) l.push('', 'Observaciones:', t.notas.trim());
  if (t.enlaces.length) l.push('', 'Documentos:', ...t.enlaces.map(e => `- ${e.nombre ? e.nombre + ': ' : ''}${e.url}`));
  l.push('', `Estado: ${NOMBRE_ESTADO[t.estado]} · Avance ${progreso(t)}%`);
  if (t.resultado.trim()) l.push('', 'Resultado:', t.resultado.trim());
  return l.join('\n');
}

function compartir(t) {
  const txt = fichaTexto(t);
  const p = persona(t.responsable);
  const asunto = `${t.referencia ? t.referencia + ' · ' : ''}${t.titulo}${t.nlt ? ' · NLT ' + fmtFecha(t.nlt, false) : ''}`;
  const mail = `mailto:${p?.email ? encodeURIComponent(p.email) : ''}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(txt)}`;
  const wa = `https://wa.me/${(p?.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`;
  dlg2.onclose = dlg2.onkeydown = dlg2.oncancel = null;
  dlg2.onclick = e => { if (e.target.closest('[data-x]')) dlg2.close(); };
  dlg2.innerHTML = `<div>
    <div class="dlg-h"><h2>Enviar ficha</h2><button type="button" class="icon-btn" data-x aria-label="Cerrar">✕</button></div>
    <div class="dlg-b"><textarea class="input" id="ficha" rows="14" readonly>${esc(txt)}</textarea></div>
    <div class="dlg-f"><button type="button" class="btn" id="copiarFicha">Copiar</button>
      <a class="btn" href="${esc(mail)}" target="_blank" rel="noopener">Correo${p?.email ? ' a ' + esc(p.nombre.split(' ')[0]) : ''}</a>
      <a class="btn" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></div></div>`;
  $('#copiarFicha', dlg2).onclick = async () => {
    try { await navigator.clipboard.writeText(txt); toast('Ficha copiada'); }
    catch { $('#ficha', dlg2).select(); toast('Texto seleccionado: cópialo con el menú del sistema'); }
  };
  dlg2.showModal();
}

// ---------- Exportaciones ----------
function csv(tareas) {
  const c = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Referencia', 'Asunto', 'Descripción', 'Categoría', 'Lugar', 'Prioridad', 'Estado', 'Avance %', 'Ordenada por', 'Fecha orden',
    'Responsable', 'Colaboradores', 'NLT', 'Hora', 'NLT original', 'Prórrogas', 'Situación', 'Próximo aviso', 'Creada', 'Hecha',
    'Minutos', 'Estimación h', 'Pasos', 'Observaciones', 'Resultado']];
  tareas.forEach(t => filas.push([t.referencia, t.titulo, t.descripcion, t.categoria, t.lugar, PRIOS[t.prioridad], NOMBRE_ESTADO[t.estado],
    progreso(t), t.ordenadaPor, t.fechaOrden, t.responsable || datos.ajustes.miNombre, t.colaboradores.join(', '), t.nlt, t.hora,
    t.nltOriginal, prorrogas(t), urgencia(t).txt, proximoAviso(t)?.txt || '',
    t.creada ? new Date(t.creada).toLocaleString('es-ES') : '', t.hecha ? new Date(t.hecha).toLocaleString('es-ES') : '',
    Math.round(tiempoTotal(t) / 60000), t.estimacionH || '', t.subtareas.map(s => (s.ok ? '[x] ' : '[ ] ') + s.t).join(' | '), t.notas, t.resultado]));
  return '﻿' + filas.map(f => f.map(c).join(';')).join('\r\n');
}

function ics(tareas) {
  const e = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  const f = s => s.replace(/-/g, '');
  const sello = ms => new Date(ms).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = tareas.filter(t => t.nlt && t.estado !== 'hecha').map(t => {
    const cuando = t.hora
      ? [`DTSTART:${f(t.nlt)}T${t.hora.replace(':', '')}00`, 'DURATION:PT30M']
      : [`DTSTART;VALUE=DATE:${f(t.nlt)}`, `DTEND;VALUE=DATE:${f(sumarDias(t.nlt, 1))}`];
    const futuros = momentosAviso(t).filter(m => m.ms > Date.now());
    const alarmas = futuros.length
      ? futuros.flatMap(m => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e('Aviso: ' + t.titulo)}`, `TRIGGER;VALUE=DATE-TIME:${sello(m.ms)}`, 'END:VALARM'])
      : ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e('Vence: ' + t.titulo)}`, 'TRIGGER:-P1D', 'END:VALARM'];
    const desc = [t.referencia, t.responsable && 'Responsable: ' + t.responsable, t.descripcion, t.notas].filter(Boolean).join('\n');
    return ['BEGIN:VEVENT', `UID:${t.id || nuevoId()}@tareas-nlt`, `DTSTAMP:${sello(Date.now())}`, ...cuando,
      `SUMMARY:${e('NLT: ' + t.titulo)}`, `DESCRIPTION:${e(desc)}`, ...(t.lugar ? [`LOCATION:${e(t.lugar)}`] : []),
      `CATEGORIES:${e(t.categoria || 'Tareas')}`, ...alarmas, 'END:VEVENT'];
  });
  // Las líneas de más de 75 caracteres se pliegan, como pide el formato iCalendar
  const plegar = l => l.length <= 73 ? l : l.match(/.{1,73}/gu).join('\r\n ');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tareas NLT//ES', 'CALSCALE:GREGORIAN', ...ev.flat(), 'END:VCALENDAR']
    .map(plegar).join('\r\n');
}

function ejemplos() {
  const d = n => sumarDias(hoy(), n);
  const t = extra => datos.tareas.push(nuevaTarea(extra));
  if (!datos.personas.length) datos.personas.push(
    { nombre: 'Ana López', cargo: 'Técnica de mantenimiento', email: '', telefono: '' },
    { nombre: 'Luis Martín', cargo: 'Jefe de almacén', email: '', telefono: '' },
  );
  t({ titulo: 'Entregar informe SEGINS de la instalación norte', categoria: 'Informes', nlt: d(-1), prioridad: 'alta',
    ordenadaPor: 'Jefatura', fechaOrden: d(-10), lugar: 'Instalación norte', descripcion: 'Informe completo con no conformidades y fotos.',
    subtareas: [{ t: 'Revisar fotos y no conformidades', ok: true }, { t: 'Redactar conclusiones', ok: false }, { t: 'Firmar y enviar', ok: false }] });
  t({ titulo: 'Visita de evaluación a almacén central', categoria: 'Visitas', nlt: d(0), hora: '10:00', prioridad: 'critica', estado: 'curso',
    lugar: 'Almacén central', colaboradores: ['Luis Martín'] });
  t({ titulo: 'Revisar plazos de subsanación pendientes', categoria: 'Evaluaciones SEGINS', nlt: d(2), repetir: 'semanal' });
  t({ titulo: 'Sustituir extintores caducados', categoria: 'Visitas', nlt: d(9), prioridad: 'alta', responsable: 'Ana López',
    ordenadaPor: 'Yo', lugar: 'Almacén central', avisos: [{ tipo: 'antes', dias: 3, hora: '09:00' }, { tipo: 'fecha', fecha: d(0), hora: '00:00' }] });
  t({ titulo: 'Parte mensual de actividad', categoria: 'Administración', nlt: d(6), repetir: 'mensual', prioridad: 'baja' });
  t({ titulo: 'Curso de actualización en normativa', categoria: 'Formación', nlt: d(20) });
  t({ titulo: 'Preparar reunión de coordinación', categoria: 'Reuniones', nlt: d(1), estado: 'espera', notas: 'Esperando el orden del día' });
  t({ titulo: 'Ordenar documentación de instalaciones', categoria: 'Administración' });
  t({ titulo: 'Llamar a mantenimiento por extintores', categoria: 'Visitas', nlt: d(-3), estado: 'hecha', hecha: new Date(Date.now() - 864e5).toISOString(),
    avisos: [], tiempo: [{ inicio: Date.now() - 864e5 - 20 * 60000, fin: Date.now() - 864e5 }] });
  guardar();
}

// ---------- Eventos de las vistas ----------
main.addEventListener('click', e => {
  const el = e.target;
  const tick = el.closest('[data-tick]');
  if (tick) {
    const t = buscar(tick.dataset.tick);
    if (tick.checked && bloqueantes(t).length) toast(`Aviso: depende de «${bloqueantes(t)[0].titulo}», que aún no está hecha`);
    marcarHecha(tick.dataset.tick, tick.checked); render(); return;
  }
  const kpi = el.closest('[data-kpi]');
  if (kpi) { filtro.kpi = filtro.kpi === kpi.dataset.kpi ? '' : kpi.dataset.kpi; render(); return; }
  const visto = el.closest('[data-visto]');
  if (visto) {
    const t = buscar(visto.dataset.visto);
    if (enEquipo(t)) datos.vistos[t.id] = Date.now(); else t.avisoVisto = Date.now();
    guardar(); render(); return;
  }
  const ent = el.closest('[data-enterado]');
  if (ent) {
    const t = buscar(ent.dataset.enterado);
    t.acuses = { ...t.acuses, [nube.uid]: Date.now() };
    anotar(t, 'Enterado'); guardar(); render(); toast('Confirmado: «Enterado»'); return;
  }
  const pos = el.closest('[data-posponer]');
  if (pos) {
    const t = buscar(pos.dataset.posponer);
    const aviso = { tipo: 'fecha', fecha: sumarDias(hoy(), 1), hora: datos.ajustes.avisoHora || '09:00' };
    // En tareas de equipo el recordatorio es solo mío: no cambia la tarea de los demás
    if (enEquipo(t)) { (datos.avisosPropios[t.id] ||= []).push(aviso); datos.vistos[t.id] = Date.now(); }
    else { t.avisos.push(aviso); t.avisoVisto = Date.now(); }
    guardar(); render(); toast('Te lo recordaré mañana'); return;
  }
  const mover = el.closest('[data-mover]');
  if (mover) { cambiarEstado(mover.dataset.mover, mover.dataset.a); render(); return; }
  const dia = el.closest('[data-dia]');
  if (dia) { diaSel = dia.dataset.dia; render(); return; }
  const mes = el.closest('[data-mes]');
  if (mes) { mesVista = new Date(mesVista.getFullYear(), mesVista.getMonth() + +mes.dataset.mes, 1); render(); return; }
  const abrir = el.closest('[data-abrir]');
  if (abrir) { e.preventDefault(); abrirEditor(abrir.dataset.abrir); return; }
  const del = el.closest('[data-delcat]');
  if (del) { borrarCat(+del.dataset.delcat); return; }
  const edp = el.closest('[data-editper]');
  if (edp) { e.preventDefault(); personaEdit = +edp.dataset.editper; render(); $('#fpersona [name=nombre]').focus(); return; }
  const dlp = el.closest('[data-delper]');
  if (dlp) { datos.personas.splice(+dlp.dataset.delper, 1); personaEdit = -1; guardar(); render(); return; }
  const env = el.closest('[data-enviar]');
  if (env) { enviarFormulario(env.closest('form')); return; }
  const acc = el.closest('[data-accion]');
  if (acc) { accion(acc.dataset.accion); return; }
  const t = el.closest('.tarea');
  if (t && !el.closest('button, a, input, summary')) abrirEditor(t.dataset.id);
});

// Renombrar pasa sus tareas al nombre nuevo; si ese nombre ya existe, las dos categorías se unen
function renombrarCat(i, nueva) {
  const vieja = datos.categorias[i];
  nueva = nueva.trim();
  if (vieja === undefined || !nueva || nueva === vieja) { render(); return; }
  if (datos.categorias.includes(nueva)) datos.categorias.splice(i, 1);
  else datos.categorias[i] = nueva;
  datos.tareas.forEach(t => { if (t.categoria === vieja && !soloLectura(t)) t.categoria = nueva; });
  if (datos.ajustes.ultimaCat === vieja) datos.ajustes.ultimaCat = nueva;
  if (filtro.cat === vieja) filtro.cat = nueva;
  guardar(); render(); toast(`Categoría renombrada: ${nueva}`); registrarError(`(info) categoría renombrada: ${vieja} → ${nueva}`);
}

async function borrarCat(i) {
  const c = datos.categorias[i];
  if (c === undefined) return;
  const usadas = datos.tareas.filter(t => t.categoria === c && !soloLectura(t));
  if (usadas.length && !(await preguntar(`${usadas.length} tarea${usadas.length > 1 ? 's usan' : ' usa'} «${c}» y quedará${usadas.length > 1 ? 'n' : ''} sin categoría. ¿Eliminarla?`,
    { ok: 'Eliminar', peligro: true }))) return;
  datos.categorias.splice(datos.categorias.indexOf(c), 1);
  usadas.forEach(t => { t.categoria = ''; });
  if (datos.ajustes.ultimaCat === c) datos.ajustes.ultimaCat = '';
  if (filtro.cat === c) filtro.cat = '';
  guardar(); render(); toast(`Categoría eliminada: ${c}`);
}

async function accion(a) {
  switch (a) {
    case 'ejemplos': ejemplos(); render(); break;
    case 'nueva-dia': abrirEditor(null, { nlt: diaSel }); break;
    case 'cancelar-persona': personaEdit = -1; render(); break;
    case 'diag-sync':
      if (!nube.lista) await conectarNube(); else subir();
      await enviarDiagnostico(); render(); toast('Sincronización reintentada');
      break;
    case 'diag-copiar':
      try { await navigator.clipboard.writeText(textoDiagnostico()); toast('Diagnóstico copiado'); }
      catch { toast('No se pudo copiar: haz una captura de pantalla'); }
      break;
    case 'gcal-sync': gcal.msg = ''; await pasarGcal(); break;
    case 'gcal-cals': await cargarCalendarios(); break;
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
    case 'ics': descargar(`nlt-${hoy()}.ics`, ics(datos.tareas), 'text/calendar;charset=utf-8'); break;
    case 'exportar': descargar(`tareas-nlt-copia-${hoy()}.json`, JSON.stringify(datos, null, 1), 'application/json'); break;
    case 'importar': $('#fimport').click(); break;
    case 'notif':
      if (await Notification.requestPermission() === 'granted') { datos.ajustes.ultimoAviso = ''; guardar(); avisar(); }
      render(); break;
    case 'borrar':
      if (await preguntar(nube.lista ? '¿Borrar TODAS tus tareas personales y ajustes, también en tus otros dispositivos? Las del equipo no se tocan. No se puede deshacer.'
        : '¿Borrar TODAS las tareas y ajustes de este navegador? No se puede deshacer.', { ok: 'Borrar todo', peligro: true })) {
        // Solo lo personal: las tareas del equipo son de todos y se quedan
        const equipo = datos.tareas.filter(enEquipo);
        borrarEventosDe(datos.tareas);
        const pendientes = datos.gcalBorrar;
        datos = normalizar({ tareas: equipo, gcalBorrar: pendientes, ajustes: { gcal: datos.ajustes.gcal, gcalCal: datos.ajustes.gcalCal } });
        guardar(); render(); pintarCrono();
      }
      break;
  }
}

main.addEventListener('change', async e => {
  const el = e.target;
  const a = datos.ajustes;
  if (el.id === 'fcat') { filtro.cat = el.value; render(); }
  else if (el.id === 'fresp') { filtro.resp = el.value; render(); }
  else if (el.id === 'fesp') { filtro.esp = el.value; render(); }
  else if (el.dataset.catnom !== undefined) renombrarCat(+el.dataset.catnom, el.value);
  else if (el.id === 'periodo') { periodo = el.value; render(); }
  else if (el.id === 'avisoDias') { a.avisoDias = +el.value; guardar(); }
  else if (el.id === 'avisoAntes') { a.avisoAntes = +el.value; guardar(); }
  else if (el.id === 'avisoHora') { a.avisoHora = el.value || '09:00'; guardar(); }
  else if (el.id === 'miNombre') { a.miNombre = el.value.trim(); guardar(); }
  else if (el.id === 'tema') { a.tema = el.value; guardar(); aplicarTema(); }
  else if (el.id === 'gcalOn') {
    a.gcal = el.checked;
    if (!a.gcal) {
      // Al desactivar se quitan del calendario los eventos creados
      if (await preguntar('¿Quitar también de Google Calendar los eventos ya creados?', { ok: 'Quitarlos' })) {
        borrarEventosDe(datos.tareas); datos.tareas.forEach(t => ponerGcal(t, null));
        guardar(); await pasarGcal({ soloBorrar: true });
      }
    }
    guardar(); render();
    if (a.gcal) { gcal.msg = ''; pasarGcal(); }
  }
  else if (el.id === 'gcalCal') { a.gcalCal = el.value; guardar(); gcal.msg = ''; pasarGcal(); }
  else if (el.id === 'fimport' && el.files[0]) {
    try {
      const d = JSON.parse(await el.files[0].text());
      if (!Array.isArray(d.tareas)) throw new Error();
      if (await preguntar(`La copia tiene ${d.tareas.filter(t => t.espacio !== 'equipo').length} tareas personales. ¿Sustituir tus tareas personales y ajustes? Las del equipo no se tocan.`, { ok: 'Sustituir', peligro: true })) {
        // Se restauran las tareas personales y los ajustes; las del equipo actuales no se tocan
        const nuevos = new Set(d.tareas.map(t => t.gcal?.id).filter(Boolean));
        borrarEventosDe(datos.tareas.filter(t => !enEquipo(t) && t.gcal?.id && !nuevos.has(t.gcal.id)));
        const cola = datos.gcalBorrar, equipo = datos.tareas.filter(enEquipo), mapa = datos.gcalMapa;
        datos = normalizar({ ...d, tareas: d.tareas.filter(t => t.espacio !== 'equipo') });
        datos.tareas.push(...equipo); datos.gcalBorrar.push(...cola); datos.gcalMapa = { ...datos.gcalMapa, ...mapa };
        guardar(); aplicarTema(); render(); pintarCrono(); toast('Copia restaurada');
      }
    } catch { toast('El archivo no es una copia válida de Tareas NLT'); }
    el.value = '';
  }
});

main.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset?.catnom !== undefined) { e.preventDefault(); e.target.blur(); }
});

main.addEventListener('input', e => {
  if (e.target.id !== 'fq') return;
  filtro.q = e.target.value;
  const pos = e.target.selectionStart;
  render();
  const i = $('#fq'); i.focus(); i.setSelectionRange(pos, pos);
});

main.addEventListener('submit', e => e.preventDefault());

// Los formularios de las vistas se envían con su botón o con Intro, sin depender del envío del navegador
const FORMULARIOS = ['rapida', 'registrar', 'nuevaCat', 'fpersona'];
main.addEventListener('keydown', e => {
  const f = e.target.form;
  if (e.key !== 'Enter' || !f || !FORMULARIOS.includes(f.id) || !e.target.matches('input:not([type=checkbox])')) return;
  e.preventDefault();
  enviarFormulario(f);
});

function enviarFormulario(f) {
  if (!f.reportValidity()) return;
  if (f.id === 'rapida') {
    const titulo = f.elements.titulo.value.trim();
    if (!titulo) return;
    datos.tareas.push(nuevaTarea({ titulo, nlt: f.elements.nlt.value, categoria: filtro.cat || datos.ajustes.ultimaCat || '' }));
    guardar(); render();
    toast('Añadida. Púlsala para completar la ficha');
    $('#rapida [name=titulo]').focus();
  } else if (f.id === 'registrar') {
    const min = +f.elements.min.value || 0;
    const cat = leerCategoria(f);
    const fin = Date.now();
    if (cat && !datos.categorias.includes(cat)) datos.categorias.push(cat);
    datos.tareas.push(nuevaTarea({ titulo: f.elements.titulo.value.trim(), categoria: cat, estado: 'hecha', avisos: [],
      creada: new Date(fin - min * 60000).toISOString(), hecha: new Date(fin).toISOString(),
      tiempo: min ? [{ inicio: fin - min * 60000, fin }] : [] }));
    guardar(); render(); toast('Anotado');
  } else if (f.id === 'nuevaCat') {
    const c = f.elements.c.value.trim();
    registrarError(`(info) añadir categoría: ${c}`);
    if (c && !datos.categorias.includes(c)) { datos.categorias.push(c); guardar(); }
    render();
  } else if (f.id === 'fpersona') {
    const p = Object.fromEntries(['nombre', 'cargo', 'email', 'telefono'].map(k => [k, f.elements[k].value.trim()]));
    if (!p.nombre) return;
    const ant = datos.personas[personaEdit];
    if (ant) {
      if (ant.nombre !== p.nombre) datos.tareas.forEach(t => {
        if (t.responsable === ant.nombre) t.responsable = p.nombre;
        if (t.ordenadaPor === ant.nombre) t.ordenadaPor = p.nombre;
        t.colaboradores = t.colaboradores.map(c => c === ant.nombre ? p.nombre : c);
      });
      datos.personas[personaEdit] = p;
    } else if (datos.personas.some(x => x.nombre === p.nombre)) {
      toast('Ya hay una persona con ese nombre'); return;
    } else datos.personas.push(p);
    personaEdit = -1;
    guardar(); render();
  }
}

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
async function notificar(titulo, cuerpo, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(titulo, { body: cuerpo, icon: 'icon-192.png', tag });
    else new Notification(titulo, { body: cuerpo, icon: 'icon-192.png', tag });
  } catch { /* el navegador no permite notificaciones aquí */ }
}

// Resumen diario de NLT vencidas y de hoy
async function avisar() {
  if (datos.ajustes.ultimoAviso === hoy()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const abiertas = datos.tareas.filter(t => t.estado !== 'hecha');
  const venc = abiertas.filter(t => urgencia(t).grupo === 'vencidas').length;
  const deHoy = abiertas.filter(t => urgencia(t).grupo === 'hoy');
  datos.ajustes.ultimoAviso = hoy();
  guardar();
  if (!venc && !deHoy.length) return;
  notificar('Tareas NLT', [venc ? `${venc} NLT vencida${venc > 1 ? 's' : ''}` : '', deHoy.length ? `Hoy: ${deHoy.map(t => t.titulo).join(', ')}` : '']
    .filter(Boolean).join(' · '), 'nlt');
}

// Cada minuto: avisos de tarea que acaban de llegar a su hora (una vez por dispositivo)
function revisarAvisos() {
  const clave = CLAVE + '-avisado';
  let desde = 0;
  try { desde = +localStorage.getItem(clave) || 0; } catch { /* sin memoria local */ }
  const ahora = Date.now();
  try { localStorage.setItem(clave, String(ahora)); } catch { /* sin memoria local */ }
  if (!desde) return;
  const nuevos = datos.tareas.filter(t => t.estado !== 'hecha'
    && meToca(t) && momentosAviso(t).some(m => m.ms > desde && m.ms <= ahora && m.ms > vistoDe(t)));
  if (!nuevos.length) return;
  render(true);
  nuevos.forEach(t => notificar(`🔔 ${t.titulo}`, `${t.nlt ? 'NLT ' + fmtFecha(t.nlt) + ' · ' + urgencia(t).txt : 'Aviso'}`, 'aviso-' + t.id));
  toast(`🔔 ${nuevos.map(t => t.titulo).join(' · ')}`);
}
setInterval(revisarAvisos, 60000);

revisarAvisos();
// ---------- Sincronización entre dispositivos y equipo (claude.ai) ----------
// Tareas personales: espacio privado del usuario, data/users/<id>/nlt/tareas/<tarea>.
// Tareas de equipo: espacio compartido por quienes tienen el enlace, equipo/principal/tareas/<tarea>.
// Ajustes, categorías, cronómetro y lo que es personal de las tareas de equipo (avisos vistos, avisos
// propios, eventos de Google Calendar) van en data/users/<id>/config.
// «base» guarda el último estado conocido de la nube, por clave (id, o «e:id» en equipo), para fusionar a
// tres bandas: gana el lado que haya cambiado desde entonces.

// Orden de claves fijo, para comparar documentos que vuelven de la nube con otro orden.
const estable = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(c => [c, x[c]])) : x);
const configDe = d => ({ categorias: d.categorias, personas: d.personas, gcalBorrar: d.gcalBorrar, gcalMapa: d.gcalMapa,
  vistos: d.vistos, avisosPropios: d.avisosPropios, ajustes: d.ajustes, activo: d.activo });
const CFG = '__config';
const claveDe = t => (enEquipo(t) ? 'e:' : '') + t.id;
const aTarea = (doc, espacio) => normalizarTarea({ ...doc.data(), id: doc.id, espacio });

function cargarBase() {
  try { return new Map(Object.entries(JSON.parse(localStorage.getItem(CLAVE + '-nube')) || {})); } catch { return new Map(); }
}
function guardarBase() {
  try { localStorage.setItem(CLAVE + '-nube', JSON.stringify(Object.fromEntries(nube.base))); } catch { /* sin caché local */ }
}

async function conectarNube() {
  if (!window.claude?.use) return;
  nube.estado = 'conectando'; pintarNube();
  const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]).catch(() => [null, null]);
  const uid = db && user ? await user.id().catch(() => null) : null;
  if (!uid) { nube.estado = 'local'; pintarNube(); registrarError(`Sin conexión a la nube: db ${db ? 'sí' : 'no'}, usuario ${user ? 'sí' : 'no'}, id ${uid ? 'sí' : 'no'}`); return; }
  nube.user = user; nube.uid = uid;
  // Tolerante con visores antiguos que no ofrezcan me() o can()
  Promise.resolve().then(() => user.me()).then(m => { nube.miNombre = m?.name || ''; }).catch(() => {});
  nube.equipoSoloLectura = (await Promise.resolve().then(() => user.can('data.write')).catch(() => null)) === false;
  nube.cfgRef = db.doc(`data/users/${uid}/config`);
  nube.lockRef = db.doc(`data/users/${uid}/gcal-lock`);
  nube.diagRef = db.doc(`data/users/${uid}/diag`);
  nube.tareasRef = db.doc(`data/users/${uid}/nlt`).collection('tareas');
  nube.equipoRef = db.doc('equipo/principal').collection('tareas');
  nube.miembrosRef = db.doc('equipo/principal').collection('miembros');
  try {
    const [st, se, sc] = await Promise.all([nube.tareasRef.get(), nube.equipoRef.get(), nube.cfgRef.get()]);
    fusionarInicio(new Map([...st.docs.map(d => [d.id, aTarea(d, 'personal')]), ...se.docs.map(d => ['e:' + d.id, aTarea(d, 'equipo')])]), sc);
  } catch (e) {
    nube.estado = 'error'; pintarNube();
    registrarError(`Al conectar: ${e?.code || ''} ${e?.message || e}`);
    if (e?.code === 'unavailable') setTimeout(conectarNube, 5000 + Math.random() * 5000);
    return;
  }
  nube.lista = true; nube.equipo = true; nube.estado = 'ok';
  enviarDiagnostico();
  guardar();
  render(true); pintarCrono(); aplicarTema(); pintarNube();
  const caida = e => { if (e?.code === 'revoked') { nube.lista = false; nube.equipo = false; nube.estado = 'local'; pintarNube(); render(true); } };
  nube.tareasRef.onSnapshot(s => cambiosRemotos(s.docChanges(), 'personal'), caida);
  nube.equipoRef.onSnapshot(s => cambiosRemotos(s.docChanges(), 'equipo'), caida);
  nube.cfgRef.onSnapshot(s => { if (s.exists) configRemota(s.data()); }, caida);
  nube.miembrosRef.onSnapshot(s => { nube.miembros = s.docs.map(d => d.id); pedirNombres(nube.miembros); render(true); }, () => {});
  registrarMiembro();
  pedirNombres(idsDePersonas());
}

// Cada persona que abre la app queda en la lista de miembros del equipo (una escritura al día como mucho)
async function registrarMiembro() {
  if (nube.equipoSoloLectura) return;
  const ref = nube.miembrosRef.doc(nube.uid);
  try {
    const s = await ref.get();
    if (s.exists && s.data().ultimo === hoy()) return;
    await ref.set({ alta: s.exists ? s.data().alta : new Date().toISOString(), ultimo: hoy() });
  } catch (e) {
    if (e?.code === 'invalid_argument') nube.equipoSoloLectura = true;
  }
}

const idsDePersonas = () => datos.tareas.filter(enEquipo).flatMap(t => [t.responsableId, t.creadorId, ...t.registro.map(r => r.uid)]);

async function pedirNombres(ids) {
  const faltan = [...new Set(ids)].filter(id => id && id !== nube.uid && !nube.nombres.get(id));
  if (!faltan.length || !nube.user) return;
  const ps = await Promise.resolve().then(() => nube.user.profiles(faltan)).catch(() => ({}));
  let hay = false;
  faltan.forEach(id => { const n = ps?.[id]?.name || ''; if (n) { nube.nombres.set(id, n); hay = true; } });
  if (hay) render(true);
}

function fusionarInicio(remotas, sc) {
  const locales = new Map(datos.tareas.map(t => [claveDe(t), t]));
  const resultado = [];
  for (const k of new Set([...remotas.keys(), ...locales.keys()])) {
    const R = remotas.get(k), L = locales.get(k), B = nube.base.get(k);
    if (R) {
      nube.base.set(k, estable(R));
      // Cambiada en este dispositivo sin conexión y no en la nube: se queda la local (y se sube)
      if (L && B && estable(L) !== B && estable(R) === B) resultado.push(L);
      // Borrada aquí sin conexión y sin cambios en la nube: no se recupera (se borrará arriba)
      else if (!L && B && estable(R) === B) continue;
      else resultado.push(R);
    } else if (L && !B) {
      resultado.push(L); // creada aquí y aún no subida
    } else {
      nube.base.delete(k); // borrada en otro dispositivo o por otro miembro
    }
  }
  datos.tareas = resultado;
  if (sc.exists) {
    const R = sc.data(), B = nube.base.get(CFG);
    nube.base.set(CFG, estable(R));
    if (!(B && estable(configDe(datos)) !== B && estable(R) === B)) Object.assign(datos, normalizar({ ...R, tareas: [] }), { tareas: datos.tareas });
  }
  guardarBase();
}

function cambiosRemotos(cambios, espacio) {
  const pre = espacio === 'equipo' ? 'e:' : '';
  let hay = false;
  const quien = new Set();
  for (const ch of cambios) {
    const k = pre + ch.doc.id;
    if (nube.pendientes.has(k)) continue;
    const B = nube.base.get(k);
    const i = datos.tareas.findIndex(t => claveDe(t) === k);
    const L = datos.tareas[i];
    const localSinSubir = L ? estable(L) !== B : B !== undefined;
    if (ch.type === 'removed') {
      nube.base.delete(k);
      if (L && !localSinSubir) { datos.tareas.splice(i, 1); hay = true; }
      continue;
    }
    const R = aTarea(ch.doc, espacio);
    const r = estable(R);
    if (r === B) continue;          // eco de un envío propio
    nube.base.set(k, r);
    if (localSinSubir && B !== undefined) continue; // hay un cambio local pendiente: gana y se sube
    if (L) datos.tareas[i] = R; else datos.tareas.push(R);
    if (espacio === 'equipo') [R.responsableId, R.creadorId].forEach(x => x && quien.add(x));
    hay = true;
  }
  guardarBase();
  if (hay) aplicarRemoto();
  if (quien.size) pedirNombres([...quien]);
}

function configRemota(data) {
  if (nube.pendientes.has(CFG)) return;
  const B = nube.base.get(CFG), r = estable(data);
  if (r === B) return;
  nube.base.set(CFG, r); guardarBase();
  if (B !== undefined && estable(configDe(datos)) !== B) return;
  Object.assign(datos, normalizar({ ...data, tareas: [] }), { tareas: datos.tareas });
  aplicarTema(); aplicarRemoto();
}

function aplicarRemoto() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* sin caché local */ }
  programarGcal(); // p. ej., otro miembro me asigna una tarea o le cambia el NLT
  render(true); pintarCrono();
  if (dlg.open && borrador?.id && !buscar(borrador.id)) { dlg.close(); toast('Esta tarea se ha eliminado en otro dispositivo o por otro miembro'); }
}

// Sube lo que ha cambiado respecto a la última versión conocida de la nube, un envío cada vez.
function subir() {
  if (!nube.lista) return;
  const vivas = new Set();
  for (const t of datos.tareas) {
    const k = claveDe(t);
    vivas.add(k);
    if (k.startsWith('e:') && nube.equipoSoloLectura) continue;
    const j = estable(t);
    if (nube.base.get(k) !== j) encolar(k, j);
  }
  for (const k of [...nube.base.keys()]) {
    if (k === CFG || vivas.has(k) || (k.startsWith('e:') && nube.equipoSoloLectura)) continue;
    encolar(k, null);
  }
  const c = estable(configDe(datos));
  if (nube.base.get(CFG) !== c) encolar(CFG, c);
}

function encolar(k, json) {
  const anterior = nube.base.get(k);
  if (json === null) nube.base.delete(k); else nube.base.set(k, json);
  guardarBase();
  nube.pendientes.set(k, (nube.pendientes.get(k) || 0) + 1);
  nube.estado = 'subiendo'; pintarNube();
  nube.cola = nube.cola.then(async () => {
    const ref = k === CFG ? nube.cfgRef : k.startsWith('e:') ? nube.equipoRef.doc(k.slice(2)) : nube.tareasRef.doc(k);
    // Con plazo: una escritura que no contesta no debe bloquear todas las siguientes
    const enviar = () => Promise.race([json === null ? ref.delete() : ref.set(JSON.parse(json)),
      new Promise((_, no) => setTimeout(() => no({ code: 'timeout', message: 'la nube no contestó en 20 s' }), 20000))]);
    try {
      try { await enviar(); }
      catch (e) {
        if (e?.code !== 'unavailable') throw e;
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
        await enviar();
      }
      diag.ultimaOk = Date.now();
    } catch (e) {
      registrarError(`Guardar ${k === CFG ? 'ajustes' : 'tarea ' + k}: ${e?.code || ''} ${e?.message || e}`);
      // No se subió: se restaura la base para reintentarlo en el próximo guardado
      if (nube.base.get(k) === json) { if (anterior === undefined) nube.base.delete(k); else nube.base.set(k, anterior); guardarBase(); }
      if (k.startsWith('e:') && e?.code === 'invalid_argument') {
        nube.equipoSoloLectura = true;
        toast('Solo puedes consultar el equipo: pide permiso de edición a quien te compartió la app');
        render(true);
      } else {
        nube.error = true;
        toast(e?.code === 'quota_exceeded' ? 'La nube está llena: borra tareas antiguas' : `No se pudo guardar en la nube (${e?.code || 'error'}); mira Ajustes → Diagnóstico`);
      }
    } finally {
      const n = nube.pendientes.get(k) - 1;
      if (n) nube.pendientes.set(k, n); else nube.pendientes.delete(k);
      if (!nube.pendientes.size) { nube.estado = nube.error ? 'error' : 'ok'; nube.error = false; pintarNube(); }
    }
  });
}

function pintarNube() {
  const el = $('#nube');
  const txt = { conectando: ['☁ …', 'Conectando con tu cuenta'], ok: ['☁ ✓', 'Sincronizado en todos tus dispositivos y con el equipo'],
    subiendo: ['☁ ↑', 'Sincronizando…'], error: ['☁ !', 'Sin sincronizar: se reintentará al hacer cambios'] }[nube.estado];
  el.hidden = !txt;
  if (txt) { el.textContent = txt[0]; el.title = txt[1]; el.setAttribute('aria-label', txt[1]); }
}

function tarjetaEquipo() {
  if (!nube.lista) return `<div class="card"><h3>Equipo compartido</h3>
    <p class="small muted">El espacio de equipo funciona en la versión de claude.ai.</p>
    <a class="btn block" href="${URL_NUBE}" target="_blank" rel="noopener">Abrir Tareas NLT sincronizada</a></div>`;
  const miembros = [...new Set([nube.uid, ...nube.miembros])];
  return `<div class="card"><h3>👥 Equipo compartido</h3>
    ${nube.equipoSoloLectura ? '<p class="aviso-msg">Solo puedes <b>consultar</b> las tareas del equipo. Para crear o modificar, pide a quien te compartió la app que te dé permiso <b>«Puede editar»</b>.</p>' : ''}
    <p class="small muted">Las tareas en el espacio <b>Equipo</b> las ven y actualizan todas las personas con acceso a esta app.
      Tus tareas <b>personales</b> siguen siendo privadas.</p>
    <div class="lbl">Miembros (${miembros.length})</div>
    <ul class="log">${miembros.map(id => `<li><span class="persona"><i>${esc(iniciales(nombreDe(id)))}</i>${esc(nombreDe(id))}</span>
      ${id === nube.uid ? '<span class="small muted"> (tú)</span>' : ''}</li>`).join('')}</ul>
    <details style="margin-top:8px"><summary><b>Cómo añadir a alguien</b></summary>
      <ol class="small" style="padding-left:18px;margin:8px 0 0">
        <li>Abre esta app en claude.ai y pulsa <b>Compartir</b> (arriba a la derecha).</li>
        <li>Invítale por su correo con permiso <b>«Puede editar»</b>. Si no, solo podrá consultar.</li>
        <li>Necesita cuenta de claude.ai. En cuanto abra el enlace, aparecerá aquí y podrás asignarle tareas.</li>
      </ol></details>
  </div>`;
}

// ---------- Google Calendar (conector de claude.ai) ----------
// Cada tarea abierta con NLT es un evento con sus avisos como alarmas. Al terminarla, quitarle el NLT o
// borrarla, el evento se elimina. La descripción lleva la marca TNLT<id> para reencontrar el evento si
// una creación no confirmó su resultado, así nunca se duplica.

const GCAL = 'Google Calendar';
const gcal = { disponible: null, corriendo: false, otraVez: false, temporizador: 0, escribiendo: false, calendarios: null, msg: '' };
let capMcp = null;
const mcpVisor = () => (capMcp ||= window.claude?.use ? window.claude.use('mcp').catch(() => null) : Promise.resolve(null));
const DISPOSITIVO = (() => {
  try { let d = localStorage.getItem(CLAVE + '-dispositivo'); if (!d) localStorage.setItem(CLAVE + '-dispositivo', d = nuevoId()); return d; }
  catch { return nuevoId(); }
})();
const ZONA = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
const esErrorTool = e => e?.code === 'tool_error';

async function llamarGcal(tool, input) {
  const mcp = await mcpVisor();
  if (!mcp) throw { code: 'not_granted' };
  return (await mcp.callTool(GCAL, tool, input, { cache: false })).payload;
}

function mensajeGcal(e) {
  return {
    server_not_connected: 'Google Calendar no está conectado: añádelo en claude.ai → Ajustes → Conectores.',
    needs_reauth: 'La conexión con Google Calendar ha caducado: vuelve a conectarlo en claude.ai → Ajustes → Conectores.',
    selection_required: 'Tienes más de un Google Calendar conectado: elige cuál usar en el aviso de claude.ai.',
    not_in_manifest: 'No has permitido Google Calendar para esta app. Pulsa «Sincronizar ahora» para volver a preguntarte.',
    blocked_by_policy: 'Tu organización no permite usar Google Calendar desde aquí.',
    approval_required: 'Tu organización exige aprobar cada uso de Google Calendar; desde aquí no es posible.',
    server_unavailable: 'Google Calendar no responde ahora; se reintentará con el próximo cambio.',
    not_granted: 'Google Calendar solo funciona en la versión de claude.ai.',
    capability_disabled: 'Google Calendar no está disponible en esta vista.',
  }[e?.code] || `No se pudo sincronizar con Google Calendar${e?.message ? ': ' + e.message : ''}.`;
}

function horaLocal(ms) {
  const d = new Date(ms);
  return `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function entradaEvento(t, cal) {
  const allDay = !t.hora;
  const d = aFecha(t.nlt);
  if (!allDay) { const [h, m] = t.hora.split(':').map(Number); d.setHours(h, m, 0, 0); }
  const base = d.getTime();
  // Google admite hasta 5 alarmas y como mucho 4 semanas antes del evento
  const minutos = [...new Set(momentosAviso(t).map(m => Math.round((base - m.ms) / 60000)).filter(x => x >= 0 && x <= 40320))].slice(0, 5);
  const desc = [t.referencia && `Referencia: ${t.referencia}`, `Responsable: ${nombreResp(t) || datos.ajustes.miNombre || 'yo'}`, enEquipo(t) && 'Tarea del equipo',
    t.descripcion.trim(), t.notas.trim() && `Observaciones: ${t.notas.trim()}`, '', `Abrir en Tareas NLT: ${URL_NUBE}`, `TNLT${t.id}`]
    .filter(x => x !== undefined && x !== false && x !== null).join('\n');
  const e = {
    summary: `${t.prioridad === 'critica' ? '‼ ' : ''}NLT · ${t.titulo}`,
    startTime: allDay ? `${t.nlt}T00:00:00` : horaLocal(base),
    endTime: allDay ? `${sumarDias(t.nlt, 1)}T00:00:00` : horaLocal(base + 30 * 60000),
    timeZone: ZONA, description: desc, availability: 'AVAILABILITY_FREE',
    ...(minutos.length ? { overrideReminders: minutos.map(minutes => ({ method: 'popup', minutes })), useDefaultReminders: false } : { useDefaultReminders: true }),
  };
  if (allDay) e.allDay = true;
  if (t.lugar) e.location = t.lugar;
  if (t.prioridad === 'critica') e.colorId = '11';
  else if (t.prioridad === 'alta') e.colorId = '6';
  if (cal) e.calendarId = cal;
  return e;
}

async function buscarEvento(t, cal) {
  const r = await llamarGcal('list_events', { fullText: `TNLT${t.id}`, pageSize: 5, ...(cal ? { calendarId: cal } : {}) });
  return (r?.events || []).find(ev => String(ev.description || '').includes(`TNLT${t.id}`)) || null;
}

async function borrarEvento(id, cal) {
  try { await llamarGcal('delete_event', { eventId: id, notificationLevel: 'NONE', ...(cal ? { calendarId: cal } : {}) }); }
  catch (e) { if (!esErrorTool(e)) throw e; /* ya no existe */ }
}

function programarGcal() {
  if (!datos.ajustes.gcal || gcal.escribiendo) return;
  clearTimeout(gcal.temporizador);
  gcal.temporizador = setTimeout(pasarGcal, 4000);
}

async function pasarGcal({ soloBorrar = false } = {}) {
  if (!datos.ajustes.gcal && !soloBorrar) return;
  if (gcal.corriendo) { gcal.otraVez = true; return; }
  if (!(await mcpVisor())) { gcal.msg = mensajeGcal({ code: 'not_granted' }); return; }
  gcal.corriendo = true;
  let cambios = false, errores = 0;
  try {
    // Un solo dispositivo sincroniza a la vez
    if (nube.lockRef) {
      const r = await nube.lockRef.acquire({ holder: DISPOSITIVO, ttlMs: 120000 }).catch(() => ({ acquired: true }));
      if (!r.acquired) { setTimeout(programarGcal, 60000); return; }
    }
    gcal.msg = 'Sincronizando con Google Calendar…'; pintarGcal();
    const cal = datos.ajustes.gcalCal || '';
    for (const ev of [...datos.gcalBorrar]) {
      await borrarEvento(ev.id, ev.cal);
      datos.gcalBorrar = datos.gcalBorrar.filter(x => x.id !== ev.id);
      cambios = true;
    }
    if (soloBorrar) { gcal.msg = 'Eventos quitados de Google Calendar.'; return; }
    for (const t of [...datos.tareas]) {
      const g = gcalDe(t);
      if (t.estado === 'hecha' || !t.nlt || !meToca(t)) {
        if (g?.id) { await borrarEvento(g.id, g.cal); ponerGcal(t, null); cambios = true; }
        continue;
      }
      const ent = entradaEvento(t, cal);
      const firma = estable(ent);
      if (g?.id && g.firma === firma) continue;
      try {
        // Cambió el calendario de destino o el tipo (día completo / con hora): se rehace el evento
        if (g?.id && (g.cal !== cal || !!g.allDay !== !!ent.allDay)) { await borrarEvento(g.id, g.cal); ponerGcal(t, null); }
        let id = gcalDe(t)?.id, link = gcalDe(t)?.link || '';
        if (!id) { const ya = await buscarEvento(t, cal); if (ya) { id = ya.id; link = ya.htmlLink || ''; } }
        if (id) {
          const { allDay, calendarId, ...cambio } = ent;
          try { await llamarGcal('update_event', { eventId: id, notificationLevel: 'NONE', ...(allDay ? { allDay } : {}), ...(cal ? { calendarId: cal } : {}), ...cambio }); }
          catch (e) { if (!esErrorTool(e)) throw e; id = null; } // el evento ya no existe: se crea de nuevo
        }
        if (!id) {
          const r = await llamarGcal('create_event', ent);
          id = r?.id || r?.event?.id;
          link = r?.htmlLink || r?.event?.htmlLink || '';
          if (!id) { const ya = await buscarEvento(t, cal); id = ya?.id; link = ya?.htmlLink || ''; }
        }
        const actual = buscar(t.id) || t; // la tarea pudo llegar renovada desde otro dispositivo
        ponerGcal(actual, id ? { id, cal, firma, allDay: !!ent.allDay, link } : null);
        cambios = true;
      } catch (e) {
        if (!esErrorTool(e)) throw e;
        errores++;
        gcal.ultimoError = `«${t.titulo}»: ${e.message || 'error de Google Calendar'}`;
      }
    }
    // Tareas de equipo borradas por otros: fuera también su evento de mi calendario
    const vivas = new Set(datos.tareas.filter(enEquipo).map(t => t.id));
    for (const [id, g] of Object.entries(datos.gcalMapa)) {
      if (!vivas.has(id) && g?.id) { await borrarEvento(g.id, g.cal); delete datos.gcalMapa[id]; cambios = true; }
    }
    gcal.msg = errores ? `Sincronizado con ${errores} error${errores > 1 ? 'es' : ''}. ${gcal.ultimoError}`
      : `☑ Sincronizado con Google Calendar a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    gcal.msg = mensajeGcal(e);
  } finally {
    if (cambios) { gcal.escribiendo = true; guardar(); gcal.escribiendo = false; render(true); }
    gcal.corriendo = false;
    pintarGcal();
    if (gcal.otraVez) { gcal.otraVez = false; programarGcal(); }
  }
}

// Al borrar tareas, sus eventos quedan en cola para eliminarlos
function borrarEventosDe(tareas) {
  tareas.forEach(t => { const g = gcalDe(t); if (g?.id) datos.gcalBorrar.push({ id: g.id, cal: g.cal || '' }); ponerGcal(t, null); });
}

async function cargarCalendarios() {
  try {
    const r = await llamarGcal('list_calendars', { pageSize: 100 });
    gcal.calendarios = (r?.calendars || []).filter(c => !/#holiday@|#contacts@|#weeknum@/.test(c.id));
  } catch (e) { gcal.msg = mensajeGcal(e); }
  render();
}

function pintarGcal() {
  const el = $('#gcalMsg');
  if (el) el.textContent = gcal.msg;
}

function tarjetaGcal() {
  if (gcal.disponible === false) return `<div class="card"><h3>Google Calendar</h3>
    <p class="small muted">Disponible en la versión sincronizada de claude.ai.</p>
    <a class="btn block" href="${URL_NUBE}" target="_blank" rel="noopener">Abrir Tareas NLT sincronizada</a></div>`;
  const a = datos.ajustes;
  const cals = gcal.calendarios;
  return `<div class="card"><h3>Google Calendar</h3>
    <label class="check"><input type="checkbox" id="gcalOn" ${a.gcal ? 'checked' : ''}> Enviar mis NLT y avisos a Google Calendar</label>
    <p class="small muted">Cada tarea abierta con NLT aparece en tu calendario y cada aviso suena como alarma en el móvil, aunque esta app esté cerrada.
      Al terminar la tarea, quitarle el NLT o borrarla, el evento se elimina. Las tareas ya hechas no se envían.</p>
    ${a.gcal ? `
      <label class="lbl">Calendario
        <div class="row gap"><select class="input grow" id="gcalCal">
          <option value="">Calendario principal</option>
          ${(cals || []).map(c => `<option value="${esc(c.id)}" ${c.id === a.gcalCal ? 'selected' : ''}>${esc(c.summary || c.id)}</option>`).join('')}
          ${a.gcalCal && !(cals || []).some(c => c.id === a.gcalCal) ? `<option value="${esc(a.gcalCal)}" selected>${esc(a.gcalCal)}</option>` : ''}
        </select><button class="btn" data-accion="gcal-cals">${cals ? 'Actualizar' : 'Ver calendarios'}</button></div></label>
      <p class="small muted" id="gcalMsg">${esc(gcal.msg)}</p>
      <button class="btn block" data-accion="gcal-sync">Sincronizar ahora</button>` : ''}
  </div>`;
}

mcpVisor().then(m => { gcal.disponible = !!m; if (location.hash === '#ajustes') render(true); });

// ---------- Navegación ----------
function aplicarTema() {
  const t = datos.ajustes.tema;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

function render(remoto = false) {
  // Si llega un cambio de otro dispositivo mientras se escribe, se repinta al salir del campo
  const foco = document.activeElement;
  if (remoto && foco && main.contains(foco) && foco.matches('input:not([type=checkbox]), textarea, select')) {
    render.pendiente = true; return;
  }
  render.pendiente = false;
  const v = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'nlt';
  $('#titulo').textContent = VISTAS[v];
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v));
  $('#fab').hidden = v === 'ajustes' || v === 'actividad';
  main.innerHTML = { nlt: vistaNlt, tablero: vistaTablero, calendario: vistaCalendario, actividad: vistaActividad, ajustes: vistaAjustes }[v]();
  const venc = datos.tareas.filter(t => t.estado !== 'hecha' && ['vencidas', 'hoy'].includes(urgencia(t).grupo)).length;
  document.title = venc ? `(${venc}) Tareas NLT` : 'Tareas NLT';
}

main.addEventListener('focusout', () => setTimeout(() => { if (render.pendiente && !main.contains(document.activeElement)) render(); }));
window.addEventListener('hashchange', () => { filtro.kpi = ''; render(); });
// Si la app sigue abierta al cambiar de día, se recalculan los plazos
let diaPintado = hoy();
setInterval(() => { if (hoy() !== diaPintado && !dlg.open) { diaPintado = hoy(); render(); avisar(); } }, 60000);

aplicarTema();
render();
pintarCrono();
avisar();
conectarNube();
if ('serviceWorker' in navigator && location.protocol !== 'file:' && window.top === window) navigator.serviceWorker.register('sw.js').catch(() => {});
