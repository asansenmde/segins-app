// Oposición Guardia Civil: plan semanal de estudio, avance por tema, tests, artículos fallados e informe.
// Se guarda en este navegador (localStorage) y, abierta en claude.ai, se sincroniza en la cuenta
// (capacidad "db"): quien tenga la app compartida con permiso de edición ve y actualiza los mismos datos.

const CLAVE = 'oposicion-gc-v1';
const COLS = ['temas', 'sesiones', 'tests', 'plan', 'marcas', 'config'];
const MATERIAS = [['temario', 'Temario'], ['ingles', 'Inglés'], ['psico', 'Psicotécnicos'], ['orto', 'Gramática y ortografía']];
const NOMBRE_MAT = Object.fromEntries(MATERIAS);
const TIPOS = { estudio: 'Estudio', repaso: 'Repaso', test: 'Test' };
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const VISTAS = { semana: 'Semana', temario: 'Temario', tests: 'Tests', informe: 'Informe', ajustes: 'Ajustes' };
const CONFIG_BASE = { id: 'general', nombre: '', fechaExamen: '', penal: 3, objetivoH: 15, mod: 0 };

// Temario inicial: ids fijos para que dos dispositivos no creen temas duplicados
function temasBase() {
  const t = [];
  for (let i = 1; i <= 23; i++) t.push({ id: 't' + pad(i), materia: 'temario', num: i, titulo: `Tema ${i}` });
  const extra = {
    ingles: ['Gramática', 'Vocabulario', 'Comprensión lectora'],
    psico: ['Aptitud verbal', 'Aptitud numérica', 'Razonamiento abstracto', 'Aptitud espacial', 'Memoria', 'Atención y percepción'],
    orto: ['Ortografía', 'Gramática', 'Vocabulario (sinónimos y antónimos)'],
  };
  Object.entries(extra).forEach(([m, l]) => l.forEach((titulo, i) => t.push({ id: `${m}${i + 1}`, materia: m, num: i + 1, titulo })));
  return t.map(x => ({ progreso: 0, vueltas: 0, notas: '', importancia: 'media', preguntasExamen: 0, autoeval: '', mod: 0, ...x }));
}

const $ = (s, el = document) => el.querySelector(s);
const main = $('#main');
const dlg = $('#dlg');
const dlg2 = $('#dlg2');

// ---------- Utilidades ----------
function pad(n) { return String(n).padStart(2, '0'); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoy = () => iso(new Date());
const aFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); };
const lunes = s => sumarDias(s, -((aFecha(s).getDay() + 6) % 7));
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
const horas = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`; };
const fmt1 = n => n.toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function fmtFecha(s, o = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!s) return '';
  const d = aFecha(s);
  if (d.getFullYear() !== new Date().getFullYear()) o = { ...o, year: 'numeric' };
  return d.toLocaleDateString('es-ES', o);
}

let tToast = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(tToast); tToast = setTimeout(() => t.classList.remove('on'), 2600);
}

// ---------- Datos ----------
// S.d[col][id] = documento; S.base[col][id] = versión (mod) vista por última vez en la nube
let S = cargar();

function cargar() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { /* almacenamiento bloqueado o corrupto */ }
  const d = {}, base = {};
  COLS.forEach(c => { d[c] = s.d?.[c] && typeof s.d[c] === 'object' ? s.d[c] : {}; base[c] = s.base?.[c] || {}; });
  if (!Object.keys(d.temas).length) temasBase().forEach(t => { d.temas[t.id] = t; });
  return { d, base, vista: s.vista || {} };
}

function guardarLocal() {
  try { localStorage.setItem(CLAVE, JSON.stringify(S)); }
  catch { toast('No se pudo guardar en este navegador: almacenamiento lleno o bloqueado'); }
}

function put(col, obj) {
  obj.mod = Date.now();
  S.d[col][obj.id] = obj;
  guardarLocal();
  subir(col, obj);
}

function quitar(col, id) {
  delete S.d[col][id];
  guardarLocal();
  borrarRemoto(col, id);
}

const cfg = () => ({ ...CONFIG_BASE, ...(S.d.config.general || {}) });
const lista = col => Object.values(S.d[col]);
const tema = id => S.d.temas[id];
const temasDe = m => lista('temas').filter(t => t.materia === m).sort((a, b) => a.num - b.num || a.titulo.localeCompare(b.titulo));
const nombreTema = t => t ? (t.materia === 'temario' ? `Tema ${t.num}${t.titulo && t.titulo !== `Tema ${t.num}` ? ' · ' + t.titulo : ''}` : t.titulo) : 'Tema borrado';
const matChip = m => `<span class="mat mat-${esc(m)}">${esc(NOMBRE_MAT[m] || m)}</span>`;

// Nota sobre 10 con penalización: aciertos − fallos / divisor (0 = sin penalización)
function notaTest(t) {
  const p = num(t.preguntas);
  if (!p) return null;
  const div = t.sinPenal ? 0 : num(cfg().penal, 3);
  const bruto = num(t.aciertos) - (div ? num(t.fallos) / div : 0);
  return Math.max(0, bruto / p * 10);
}
const claseNota = n => n == null ? '' : n >= 7 ? 'ok' : n >= 5 ? 'warn' : 'bad';

// ---------- Estadísticas por tema ----------
function statsTemas() {
  const st = {};
  lista('temas').forEach(t => { st[t.id] = { ultimo: '', minutos: 0, sesiones: 0, notas: [], fallos: 0 }; });
  lista('sesiones').forEach(s => {
    const x = st[s.temaId]; if (!x) return;
    x.minutos += num(s.minutos); x.sesiones++;
    if (s.fecha > x.ultimo) x.ultimo = s.fecha;
  });
  lista('tests').forEach(t => {
    const n = notaTest(t);
    (t.temaIds || []).forEach(id => {
      const x = st[id]; if (!x) return;
      if (t.fecha > x.ultimo) x.ultimo = t.fecha;
      if (n != null) x.notas.push({ fecha: t.fecha, n });
    });
    (t.fallosArt || []).forEach(f => { if (st[f.temaId]) st[f.temaId].fallos++; });
  });
  return st;
}

function diasSin(x) { return x.ultimo ? diasEntre(x.ultimo, hoy()) : null; }
function pillDias(x) {
  const d = diasSin(x);
  if (d == null) return '<span class="badge none">Sin estudiar</span>';
  const c = d <= 7 ? 'ok' : d <= 14 ? 'warn' : 'bad';
  return `<span class="badge ${c}">${d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`}</span>`;
}
const media = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;

// Artículos fallados agrupados por tema + norma + artículo
const claveArt = f => [f.temaId, (f.norma || '').trim().toLowerCase(), (f.articulo || '').trim().toLowerCase()].join('|');
function articulosFallados() {
  const m = new Map();
  lista('tests').forEach(t => (t.fallosArt || []).forEach(f => {
    if (!f.articulo && !f.norma && !f.nota) return;
    const k = claveArt(f);
    const a = m.get(k) || { clave: k, temaId: f.temaId, norma: f.norma || '', articulo: f.articulo || '', veces: 0, ultimo: '', notas: [] };
    a.veces++;
    if (t.fecha > a.ultimo) a.ultimo = t.fecha;
    if (f.nota) a.notas.push(f.nota);
    m.set(k, a);
  }));
  const marcas = S.d.marcas;
  return [...m.values()].map(a => {
    const mk = marcas[idMarca(a.clave)];
    a.repasado = !!mk && mk.fecha >= a.ultimo;
    return a;
  }).sort((a, b) => a.repasado - b.repasado || b.veces - a.veces || b.ultimo.localeCompare(a.ultimo));
}
// Id de documento estable a partir de la clave (los ids no admiten "/" ni longitud ilimitada)
function idMarca(k) {
  let h = 2166136261;
  for (const c of k) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return 'm' + (h >>> 0).toString(36) + k.length.toString(36);
}
const nombreArt = a => [a.articulo && (/^\d/.test(a.articulo) ? `Art. ${a.articulo}` : a.articulo), a.norma].filter(Boolean).join(' · ') || 'Sin artículo';

// ---------- Importancia y diagnóstico ----------
// Importancia: cuántas preguntas suelen caer del tema. La marca quien estudia (o su academia).
const IMPORTANCIA = {
  critica: { n: 'Crítico', peso: 4, desc: 'Caen muchas preguntas' },
  alta: { n: 'Alto', peso: 3, desc: 'Caen bastantes' },
  media: { n: 'Medio', peso: 2, desc: 'Caen algunas' },
  baja: { n: 'Bajo', peso: 1, desc: 'Caen 2 o 3' },
};
const ORDEN_IMP = ['critica', 'alta', 'media', 'baja'];
// Cómo se lleva el tema. Lo dice quien estudia (autoevaluación) y lo calcula la app (diagnóstico).
const ESTADOS = {
  reforzar: { n: 'No lo controlo', corto: 'Reforzar', ic: '!', rango: 0 },
  repasar: { n: 'Necesito repaso', corto: 'Repasar', ic: '↻', rango: 1 },
  dominado: { n: 'Lo llevo muy bien', corto: 'Dominado', ic: '✓', rango: 2 },
  nuevo: { n: 'Sin empezar', corto: 'Sin empezar', ic: '○', rango: -1 },
};
const ORDEN_EST = ['reforzar', 'repasar', 'dominado', 'nuevo'];
const imp = t => IMPORTANCIA[t?.importancia] ? t.importancia : 'media';
const badgeImp = t => `<span class="imp imp-${imp(t)}">${IMPORTANCIA[imp(t)].n}</span>`;
const pillEst = e => `<span class="est est-${e}"><i aria-hidden="true">${ESTADOS[e].ic}</i>${ESTADOS[e].corto}</span>`;
const tipoSugerido = e => (e === 'repasar' || e === 'dominado') ? 'repaso' : 'estudio';

// Días que aguanta un tema sin repasar antes de empezar a olvidarse: crece con cada vuelta
const estabilidad = t => Math.min(60, 10 * (1 + num(t.vueltas)));

function diagnostico(t, x, pendientes = 0) {
  const d = diasSin(x), p = num(t.progreso), mot = [];
  const ult = [...x.notas].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-3);
  const nm = media(ult.map(n => n.n));
  const estab = estabilidad(t);
  let auto, punt = null;
  if (d == null && !p) { auto = 'nuevo'; mot.push('todavía no se ha estudiado'); }
  else {
    // Control sobre 10: el % de dominio y, si hay tests, sobre todo la nota de los últimos 3
    punt = nm == null ? p / 10 : 0.4 * p / 10 + 0.6 * nm;
    auto = punt >= 7.5 ? 'dominado' : punt >= 5 ? 'repasar' : 'reforzar';
    mot.push(`dominio ${p} %`);
    mot.push(nm == null ? 'sin tests todavía' : `media de los últimos ${ult.length === 1 ? 'test' : ult.length + ' tests'}: ${fmt1(nm)}`);
    if (d != null && d > estab) {
      mot.push(`hace ${d} días que no se toca`);
      if (auto === 'dominado') auto = 'repasar';
    }
    if (pendientes >= 3) {
      mot.push(`${pendientes} artículos fallados sin repasar`);
      if (auto === 'dominado') auto = 'repasar';
    }
  }
  const propio = ESTADOS[t.autoeval] ? t.autoeval : '';
  const estado = propio || auto;
  const aviso = propio && punt != null && propio !== auto
    ? `Tú dices «${ESTADOS[propio].n.toLowerCase()}», pero los datos dicen «${ESTADOS[auto].n.toLowerCase()}» (${mot.join(', ')}).` : '';
  // Prioridad: importancia × lo que falta × lo olvidado
  const necesidad = { nuevo: 3, reforzar: 3, repasar: 2, dominado: 0.5 }[estado];
  const olvido = d == null ? 1 : Math.min(2, d / estab);
  return { estado, auto, propio, punt, nm, d, mot, aviso, estab, prioridad: IMPORTANCIA[imp(t)].peso * necesidad * (1 + olvido) };
}

function diagnosticos() {
  const st = statsTemas();
  const pend = {};
  articulosFallados().forEach(a => { if (!a.repasado) pend[a.temaId] = (pend[a.temaId] || 0) + 1; });
  const dg = {};
  lista('temas').forEach(t => { dg[t.id] = { ...diagnostico(t, st[t.id], pend[t.id] || 0), x: st[t.id], pend: pend[t.id] || 0 }; });
  return dg;
}

const porPrioridad = (ts, dg) => [...ts].sort((a, b) => dg[b.id].prioridad - dg[a.id].prioridad || a.num - b.num);
const motivoPrio = (t, g) => [`${num(t.progreso)} %`, g.d == null ? 'sin estudiar' : g.d === 0 ? 'hoy' : `hace ${g.d} d`, g.nm != null ? `tests ${fmt1(g.nm)}` : ''].filter(Boolean).join(' · ');
// Peso de un tema en el examen: las preguntas que suelen caer o, si no se saben, su importancia
const pesoExamen = t => num(t.preguntasExamen) || IMPORTANCIA[imp(t)].peso;
const etiquetaCorta = t => t.materia === 'temario' ? String(t.num) : t.titulo.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();

// Mapa de color del temario: relleno = cómo se lleva; borde = importancia
function mapaTemas(ts, dg, conLeyenda = true) {
  return `<div class="mapa">${ts.map(t => `<button type="button" class="celda est-${dg[t.id].estado} bi-${imp(t)}" data-tema="${t.id}"
      title="${esc(nombreTema(t))}: ${IMPORTANCIA[imp(t)].n.toLowerCase()} · ${ESTADOS[dg[t.id].estado].n.toLowerCase()}">
      <b>${esc(etiquetaCorta(t))}</b>${dg[t.id].aviso ? '<i class="av" aria-label="Revisar">?</i>' : ''}</button>`).join('')}</div>
    ${conLeyenda ? leyendaMapa() : ''}`;
}
const leyendaMapa = () => `<div class="leyenda"><span><i class="sw est-dominado"></i>Dominado</span><span><i class="sw est-repasar"></i>Repasar</span><span><i class="sw est-reforzar"></i>Reforzar</span><span><i class="sw est-nuevo"></i>Sin empezar</span>
  <span><i class="sw bo bi-critica"></i>Borde rojo: crítico</span><span><i class="sw bo bi-alta"></i>Naranja: alto</span></div>`;

// Barra apilada con cuántos temas hay en cada estado
function barraEstados(ts, dg) {
  const n = ts.length || 1;
  const c = Object.fromEntries(ORDEN_EST.map(e => [e, ts.filter(t => dg[t.id].estado === e).length]));
  return `<div class="apilada" role="img" aria-label="${ORDEN_EST.map(e => `${c[e]} ${ESTADOS[e].corto.toLowerCase()}`).join(', ')}">
      ${['dominado', 'repasar', 'reforzar', 'nuevo'].map(e => c[e] ? `<i class="est-${e}" style="width:${c[e] / n * 100}%"></i>` : '').join('')}</div>
    <div class="leyenda">${['dominado', 'repasar', 'reforzar', 'nuevo'].map(e => `<span><i class="sw est-${e}"></i>${ESTADOS[e].corto} <b class="num">${c[e]}</b></span>`).join('')}</div>`;
}

// ---------- Sincronización (claude.ai, capacidad db) ----------
const nube = { lista: false, estado: 'local', refs: null, cola: Promise.resolve() };

function pintarNube() {
  const el = $('#nube');
  const txt = { conectando: '☁ …', ok: '☁ ✓', error: '☁ ✕' }[nube.estado];
  el.hidden = !txt; el.textContent = txt || '';
  el.title = { conectando: 'Conectando…', ok: 'Sincronizado en tu cuenta', error: 'Sin conexión: se guarda en este dispositivo y se sube al volver' }[nube.estado] || '';
}

function encolar(fn) {
  nube.cola = nube.cola.then(fn).then(() => {
    if (nube.estado === 'error') { nube.estado = 'ok'; pintarNube(); }
  }, e => {
    nube.estado = 'error'; pintarNube();
    if (e?.code === 'invalid_argument' || e?.code === 'permission_denied') toast('No tienes permiso para modificar estos datos');
  });
}

function subir(col, obj) {
  if (!nube.lista) return;
  const copia = JSON.parse(JSON.stringify(obj));
  encolar(async () => { await nube.refs[col].doc(copia.id).set(copia); S.base[col][copia.id] = copia.mod; guardarLocal(); });
}

function borrarRemoto(col, id) {
  if (!nube.lista) return;
  encolar(async () => { await nube.refs[col].doc(id).delete(); delete S.base[col][id]; guardarLocal(); });
}

// Fusión a tres bandas con lo último visto en la nube (base): gana la versión más reciente y
// se respetan los borrados hechos en otro dispositivo o aquí sin conexión.
function fusionar(col, snap) {
  const R = new Map(snap.docs.map(x => [x.id, { ...x.data(), id: x.id }]));
  const L = S.d[col], B = S.base[col], nb = {};
  const subidas = [], borrados = [];
  for (const id of new Set([...R.keys(), ...Object.keys(L)])) {
    const r = R.get(id), l = L[id], b = B[id];
    if (r && l) {
      if (num(l.mod) > num(r.mod)) subidas.push(l); else { L[id] = r; nb[id] = num(r.mod); }
    } else if (r) {
      if (b !== undefined && num(r.mod) <= b) borrados.push(id);
      else { L[id] = r; nb[id] = num(r.mod); }
    } else if (b !== undefined && num(l.mod) <= b) delete L[id];
    else if (!l.mod && R.size) delete L[id]; // plantilla inicial y la nube ya tiene su temario
    else subidas.push(l);
  }
  S.base[col] = nb;
  return { subidas, borrados };
}

function cambiosRemotos(col, cambios) {
  let hay = false;
  for (const ch of cambios) {
    const id = ch.doc.id;
    if (ch.type === 'removed') {
      if (S.d[col][id]) { delete S.d[col][id]; hay = true; }
      delete S.base[col][id];
      continue;
    }
    const r = { ...ch.doc.data(), id }, l = S.d[col][id];
    S.base[col][id] = num(r.mod);
    if (!l || num(r.mod) > num(l.mod)) { S.d[col][id] = r; hay = true; }
  }
  if (hay) { guardarLocal(); render(true); }
}

async function conectarNube() {
  if (!window.claude?.use) return;
  nube.estado = 'conectando'; pintarNube();
  const db = await window.claude.use('db').catch(() => null);
  if (!db) { nube.estado = 'local'; pintarNube(); return; }
  const raiz = db.doc('oposicion/principal');
  nube.refs = Object.fromEntries(COLS.map(c => [c, raiz.collection(c)]));
  let pendientes;
  try {
    const snaps = await Promise.all(COLS.map(c => nube.refs[c].get()));
    pendientes = COLS.map((c, i) => [c, fusionar(c, snaps[i])]);
  } catch (e) {
    nube.estado = 'error'; pintarNube();
    if (e?.code === 'unavailable') setTimeout(conectarNube, 5000 + Math.random() * 5000);
    return;
  }
  nube.lista = true; nube.estado = 'ok';
  guardarLocal();
  pendientes.forEach(([c, p]) => { p.subidas.forEach(o => subir(c, o)); p.borrados.forEach(id => borrarRemoto(c, id)); });
  render(true); aplicarTema(); pintarNube();
  const caida = e => { if (e?.code === 'revoked') { nube.lista = false; nube.estado = 'local'; pintarNube(); } };
  COLS.forEach(c => nube.refs[c].onSnapshot(s => cambiosRemotos(c, s.docChanges()), caida));
}

// ---------- Navegación ----------
let vista = 'semana';
let semana = lunes(hoy());
let subTests = 'lista', filtroArt = 'pendientes', matTemario = 'temario';

function ir() {
  if (dlg.open) dlg.close();
  const h = location.hash.slice(1);
  vista = VISTAS[h] ? h : 'semana';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === vista));
  $('#titulo').textContent = VISTAS[vista];
  const fab = $('#fab');
  fab.hidden = !['semana', 'temario', 'tests'].includes(vista);
  fab.textContent = { semana: '+ Planificar', temario: '+ Registrar estudio', tests: '+ Añadir test' }[vista] || '';
  render();
  window.scrollTo(0, 0);
}

function render(remoto = false) {
  // Un cambio llegado de otro dispositivo no debe quitarle el foco a quien está escribiendo
  if (remoto && main.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  pintarCuenta();
  ({ semana: vSemana, temario: vTemario, tests: vTests, informe: vInforme, ajustes: vAjustes })[vista]();
}

function pintarCuenta() {
  const c = cfg(), el = $('#cuenta');
  const d = c.fechaExamen ? diasEntre(hoy(), c.fechaExamen) : null;
  el.hidden = d == null || d < 0;
  el.textContent = d === 0 ? 'Examen hoy' : `Examen en ${d} d`;
}

function aplicarTema() {
  const t = S.vista.tema || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = t;
}

function guardarVista(k, v) { S.vista[k] = v; guardarLocal(); }

// Confirmación dentro de la página (confirm() no funciona en el visor de claude.ai)
function preguntar(texto, si = 'Borrar') {
  return new Promise(res => {
    dlg2.innerHTML = `<div class="dlg-b"><p>${esc(texto)}</p></div>
      <div class="dlg-f"><button class="btn" type="button" data-r="0">Cancelar</button><button class="btn danger" type="button" data-r="1">${esc(si)}</button></div>`;
    dlg2.onclick = e => { const b = e.target.closest('[data-r]'); if (b) { dlg2.close(); res(b.dataset.r === '1'); } };
    dlg2.oncancel = () => res(false);
    dlg2.showModal();
  });
}

function abrir(html, alMontar) {
  dlg.innerHTML = html;
  dlg.onclick = e => { if (e.target.closest('[data-cerrar]')) dlg.close(); };
  dlg.showModal();
  alMontar?.(dlg);
}
const cabecera = t => `<div class="dlg-h"><h2>${esc(t)}</h2><button class="icon-btn" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;

// ---------- Semana ----------
function vSemana() {
  const dias = [...Array(7)].map((_, i) => sumarDias(semana, i));
  const fin = dias[6], h = hoy();
  const items = lista('plan').filter(p => p.fecha >= semana && p.fecha <= fin);
  const ses = lista('sesiones').filter(s => s.fecha >= semana && s.fecha <= fin);
  const min = ses.reduce((a, s) => a + num(s.minutos), 0);
  const hechos = items.filter(p => p.hecho).length;
  const obj = num(cfg().objetivoH);
  const dg = diagnosticos();
  const rango = `${fmtFecha(semana, { day: 'numeric', month: 'short' })} – ${fmtFecha(fin, { day: 'numeric', month: 'short' })}`;

  let html = `<div class="semhead">
      <button class="btn sm" type="button" data-sem="-7" aria-label="Semana anterior">◀</button>
      <strong>${esc(rango)}</strong>
      ${semana !== lunes(h) ? '<button class="btn sm" type="button" data-sem="0">Hoy</button>' : ''}
      <button class="btn sm" type="button" data-sem="7" aria-label="Semana siguiente">▶</button>
    </div>
    <div class="resumen">
      <div class="kpi"><div class="kpi-l">Planificado</div><div class="kpi-v">${items.length}</div></div>
      <div class="kpi"><div class="kpi-l">Hecho</div><div class="kpi-v">${hechos}<small>/${items.length}</small></div></div>
      <div class="kpi"><div class="kpi-l">Estudiado</div><div class="kpi-v">${fmt1(min / 60)}<small> h${obj ? ' / ' + obj : ''}</small></div></div>
    </div>`;

  if (!items.length && !ses.length) {
    const top = porPrioridad(lista('temas'), dg).slice(0, 6);
    html += `<div class="card"><h3>Nada planificado esta semana</h3>
      <p class="muted small">Pulsa «+ Planificar» y usa «Sugerir» para que la app proponga los temas que más urgen: primero los críticos que no controlas o llevas tiempo sin tocar.</p>
      <div class="sec" style="margin-top:12px">Lo que más urge ahora</div>
      <ul class="lista">${top.map(t => `<li><span>${badgeImp(t)} ${esc(nombreTema(t))} <span class="muted small">· ${esc(motivoPrio(t, dg[t.id]))}</span></span>${pillEst(dg[t.id].estado)}</li>`).join('')}</ul>
      <button class="btn primary block" type="button" data-sugerir>Planificar la semana con estas prioridades</button></div>`;
  }

  html += dias.map((d, i) => {
    const its = items.filter(p => p.fecha === d).sort((a, b) => num(a.orden) - num(b.orden) || num(a.mod) - num(b.mod));
    const libres = ses.filter(s => s.fecha === d && !s.planId);
    const cls = d === h ? 'hoy' : d < h ? 'pasado' : '';
    const mins = ses.filter(s => s.fecha === d).reduce((a, s) => a + num(s.minutos), 0);
    return `<div class="card dia ${cls}">
      <div class="dia-h"><b>${DIAS[i]} ${aFecha(d).getDate()}${d === h ? ' · hoy' : ''}</b>
        <span class="row">${mins ? `<span class="muted small num">${horas(mins)}</span>` : ''}<button class="btn sm" type="button" data-plan-dia="${d}">+ Tema</button></span></div>
      ${its.map(p => {
        const t = tema(p.temaId), s = p.hecho ? lista('sesiones').find(x => x.planId === p.id) : null;
        return `<div class="item ${p.hecho ? 'hecho' : ''}">
          <button class="tick ${p.hecho ? 'on' : ''}" type="button" data-tick="${p.id}" aria-label="${p.hecho ? 'Desmarcar' : 'Marcar como hecho'}">${p.hecho ? '✓' : ''}</button>
          <div class="grow" data-item="${p.id}"><div class="it">${esc(nombreTema(t))}</div>
          <div class="it-meta">${t ? `${badgeImp(t)} ${pillEst(dg[t.id].estado)}` : ''} ${TIPOS[p.tipo] || ''}${s ? ` · ${horas(num(s.minutos))}` : ''}${t ? ` · ${num(t.progreso)} %` : ''}</div></div></div>`;
      }).join('')}
      ${libres.map(s => `<div class="item hecho"><span class="tick on" aria-hidden="true">✓</span>
          <div class="grow" data-ses="${s.id}"><div class="it">${esc(nombreTema(tema(s.temaId)))}</div>
          <div class="it-meta">${TIPOS[s.tipo] || 'Estudio'} sin planificar · ${horas(num(s.minutos))}</div></div></div>`).join('')}
    </div>`;
  }).join('');
  main.innerHTML = html;

  main.onclick = e => {
    const b = e.target.closest('[data-sem],[data-plan-dia],[data-tick],[data-item],[data-ses],[data-sugerir]');
    if (!b) return;
    if (b.dataset.sugerir != null) planificar(null, true);
    else if (b.dataset.sem != null) { semana = +b.dataset.sem ? sumarDias(semana, +b.dataset.sem) : lunes(hoy()); render(); }
    else if (b.dataset.planDia) planificar(b.dataset.planDia);
    else if (b.dataset.tick) marcar(S.d.plan[b.dataset.tick]);
    else if (b.dataset.item) opcionesPlan(S.d.plan[b.dataset.item]);
    else if (b.dataset.ses) verSesion(S.d.sesiones[b.dataset.ses]);
  };
}

function marcar(p) {
  if (!p) return;
  if (!p.hecho) return registrarEstudio({ temaId: p.temaId, plan: p, fecha: p.fecha <= hoy() ? p.fecha : hoy(), tipo: p.tipo });
  lista('sesiones').filter(s => s.planId === p.id).forEach(s => quitar('sesiones', s.id));
  put('plan', { ...p, hecho: false });
  render();
}

function pickTemas(sel, dg, modo) {
  const fila = t => `<label class="check fila">
      <input type="checkbox" name="tema" value="${t.id}" ${sel.has(t.id) ? 'checked' : ''}>
      <span class="grow"><span class="nm">${esc(nombreTema(t))}</span>
      <span class="it-meta">${badgeImp(t)} ${pillEst(dg[t.id].estado)} ${esc(motivoPrio(t, dg[t.id]))}</span></span></label>`;
  if (modo === 'prio') return porPrioridad(lista('temas'), dg).map(fila).join('');
  return MATERIAS.map(([m, nom]) => {
    const ts = temasDe(m);
    return ts.length ? `<div class="gr">${esc(nom)}</div>${ts.map(fila).join('')}` : '';
  }).join('');
}

function planificar(dia, sugerir = false) {
  const dias = [...Array(7)].map((_, i) => sumarDias(semana, i));
  const h = hoy();
  const quedan = dias.filter(d => d >= h);
  const iniciales = new Set(sugerir ? (quedan.length ? quedan : dias) : [dia || (dias.includes(h) ? h : semana)]);
  const dg = diagnosticos();
  let tipo = 'auto', modo = 'prio';
  let sel = new Set(sugerir ? porPrioridad(lista('temas'), dg).slice(0, 6).map(t => t.id) : []);
  abrir(`${cabecera('Planificar temas')}
    <div class="dlg-b">
      <div class="dsec">Días</div>
      <div class="chips" id="pdias">${dias.map((d, i) => `<button class="chipsel ${iniciales.has(d) ? 'on' : ''}" type="button" data-d="${d}">${DIAS[i].slice(0, 3)} ${aFecha(d).getDate()}</button>`).join('')}</div>
      <label class="check" style="margin-top:6px"><input type="checkbox" id="prepartir" checked> Repartir los temas entre los días elegidos</label>
      <div class="dsec">Qué toca</div>
      <div class="seg" id="ptipo"><button type="button" data-t="auto" class="on">Según cómo lo lleve</button>${Object.entries(TIPOS).map(([k, v]) => `<button type="button" data-t="${k}">${v}</button>`).join('')}</div>
      <div class="dsec">Temas</div>
      <div class="sugiere"><span>Sugerir los</span><input class="input num" type="number" id="pn" min="1" max="40" value="6" aria-label="Número de temas a sugerir"><span>más urgentes</span><button class="btn sm primary" type="button" id="psug">Sugerir</button></div>
      <div class="seg" id="porden"><button type="button" data-o="prio" class="on">Por prioridad</button><button type="button" data-o="materia">Por materia</button></div>
      <div class="pick" id="ptemas"></div>
      <p class="muted small" style="margin-top:8px">La prioridad sube con la importancia del tema, lo poco que se controla y el tiempo que lleva sin tocarse.</p>
    </div>
    <div class="dlg-f"><button class="btn" type="button" data-cerrar>Cancelar</button><button class="btn primary" type="button" id="pok">Añadir al plan</button></div>`, d => {
    const leerSel = () => { sel = new Set([...d.querySelectorAll('input[name=tema]:checked')].map(i => i.value)); };
    const pintar = () => { $('#ptemas', d).innerHTML = pickTemas(sel, dg, modo); };
    const contar = () => { const n = sel.size; $('#pok', d).textContent = n ? `Añadir ${n} ${n === 1 ? 'tema' : 'temas'} al plan` : 'Añadir al plan'; };
    pintar(); contar();
    $('#ptemas', d).onchange = () => { leerSel(); contar(); };
    $('#pdias', d).onclick = e => { const b = e.target.closest('[data-d]'); if (b) b.classList.toggle('on'); };
    const seg = (id, attr, fn) => { $(id, d).onclick = e => { const b = e.target.closest(`[${attr}]`); if (!b) return; $(id, d).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b); }; };
    seg('#ptipo', 'data-t', b => { tipo = b.dataset.t; });
    seg('#porden', 'data-o', b => { leerSel(); modo = b.dataset.o; pintar(); });
    $('#psug', d).onclick = () => {
      sel = new Set(porPrioridad(lista('temas'), dg).slice(0, Math.max(1, num($('#pn', d).value, 6))).map(t => t.id));
      modo = 'prio'; $('#porden', d).querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.o === 'prio'));
      pintar(); contar(); $('#ptemas', d).scrollTop = 0;
    };
    $('#pok', d).onclick = () => {
      leerSel();
      const ds = [...d.querySelectorAll('#pdias .on')].map(b => b.dataset.d);
      const ts = porPrioridad([...sel].map(tema).filter(Boolean), dg);
      if (!ds.length || !ts.length) return toast('Elige al menos un día y un tema');
      const repartir = $('#prepartir', d).checked && ds.length > 1;
      const pares = repartir ? ts.map((t, i) => [ds[i % ds.length], t]) : ds.flatMap(f => ts.map(t => [f, t]));
      pares.forEach(([f, t], i) => put('plan', { id: nuevoId(), fecha: f, temaId: t.id, tipo: tipo === 'auto' ? tipoSugerido(dg[t.id].estado) : tipo, hecho: false, orden: Date.now() + i }));
      dlg.close(); render(); toast(pares.length === 1 ? 'Añadido al plan' : `${pares.length} temas añadidos al plan`);
    };
  });
}

function opcionesPlan(p) {
  if (!p) return;
  const t = tema(p.temaId);
  const dias = [...Array(7)].map((_, i) => sumarDias(lunes(p.fecha), i));
  abrir(`${cabecera(nombreTema(t))}
    <div class="dlg-b">
      <label class="lbl" for="odia">Día<select class="input" id="odia">${dias.map((d, i) => `<option value="${d}" ${d === p.fecha ? 'selected' : ''}>${DIAS[i]} ${aFecha(d).getDate()}</option>`).join('')}
        <option value="${sumarDias(p.fecha, 7)}">La semana que viene (${fmtFecha(sumarDias(p.fecha, 7))})</option></select></label>
      <label class="lbl" for="otipo">Qué toca<select class="input" id="otipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}" ${k === p.tipo ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <button class="btn block" type="button" id="oficha">Ver ficha del tema</button>
    </div>
    <div class="dlg-f"><button class="btn danger" type="button" id="oborrar">Quitar del plan</button><button class="btn primary" type="button" id="ook">Guardar</button></div>`, d => {
    $('#ook', d).onclick = () => { put('plan', { ...p, fecha: $('#odia', d).value, tipo: $('#otipo', d).value }); dlg.close(); render(); };
    $('#oficha', d).onclick = () => { dlg.close(); fichaTema(p.temaId); };
    $('#oborrar', d).onclick = () => {
      lista('sesiones').filter(s => s.planId === p.id).forEach(s => quitar('sesiones', s.id));
      quitar('plan', p.id); dlg.close(); render(); toast('Quitado del plan');
    };
  });
}

function chipsEstado(actual, id) {
  return `<div class="chips estados" id="${id}">${['dominado', 'repasar', 'reforzar'].map(e => `<button class="chipsel est-${e} ${actual === e ? 'on' : ''}" type="button" data-e="${e}"><i aria-hidden="true">${ESTADOS[e].ic}</i> ${ESTADOS[e].n}</button>`).join('')}</div>`;
}
function chipsSeleccion(el, attr) {
  el.onclick = e => {
    const b = e.target.closest(`[${attr}]`); if (!b) return;
    const on = !b.classList.contains('on');
    el.querySelectorAll('button').forEach(x => x.classList.toggle('on', on && x === b));
  };
}
const leerChip = (el, attr) => el.querySelector('.on')?.getAttribute(attr) || '';

function registrarEstudio({ temaId = '', plan = null, fecha = hoy(), tipo = 'estudio' } = {}) {
  const t0 = tema(temaId);
  abrir(`${cabecera(plan ? 'Hecho' : 'Registrar estudio')}
    <div class="dlg-b">
      ${plan ? `<p><b>${esc(nombreTema(t0))}</b> ${badgeImp(t0)}</p>` : `<label class="lbl" for="rtema">Tema<select class="input" id="rtema">${MATERIAS.map(([m, nom]) => `<optgroup label="${esc(nom)}">${temasDe(m).map(t => `<option value="${t.id}" ${t.id === temaId ? 'selected' : ''}>${esc(nombreTema(t))}</option>`).join('')}</optgroup>`).join('')}</select></label>`}
      <div class="grid2">
        <label class="lbl" for="rfecha">Fecha<input class="input" type="date" id="rfecha" value="${fecha}" max="${hoy()}"></label>
        <label class="lbl" for="rtipo">Tipo<select class="input" id="rtipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}" ${k === tipo ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
      <label class="lbl" for="rmin">Tiempo (minutos)<input class="input num" type="number" inputmode="numeric" min="0" step="5" id="rmin" value="60"></label>
      <div class="chips" id="rmins">${[30, 45, 60, 90, 120, 180].map(m => `<button class="chipsel ${m === 60 ? 'on' : ''}" type="button" data-m="${m}">${horas(m)}</button>`).join('')}</div>
      <div class="lbl">¿Cómo lo llevas después de hoy?</div>
      <div id="rest"></div>
      <label class="lbl" for="rprog">Dominio del tema <output id="rprogv"></output><input type="range" id="rprog" min="0" max="100" step="5"></label>
      <label class="check"><input type="checkbox" id="rvuelta" ${tipo === 'repaso' ? 'checked' : ''}> Sumar una vuelta al tema</label>
      <label class="lbl" for="rnota">Nota (opcional)<textarea class="input" id="rnota" placeholder="Qué ha costado, qué hay que repasar…"></textarea></label>
    </div>
    <div class="dlg-f"><button class="btn" type="button" data-cerrar>Cancelar</button><button class="btn primary" type="button" id="rok">Guardar</button></div>`, d => {
    const prog = $('#rprog', d), out = $('#rprogv', d);
    const selTema = () => plan ? plan.temaId : $('#rtema', d).value;
    const cargarTema = () => {
      const t = tema(selTema());
      prog.value = num(t?.progreso); out.textContent = prog.value + ' %';
      $('#rest', d).innerHTML = chipsEstado(t?.autoeval || '', 'restc');
      chipsSeleccion($('#restc', d), 'data-e');
    };
    cargarTema();
    prog.oninput = () => { out.textContent = prog.value + ' %'; };
    if (!plan) $('#rtema', d).onchange = cargarTema;
    $('#rtipo', d).onchange = e => { $('#rvuelta', d).checked = e.target.value === 'repaso'; };
    $('#rmins', d).onclick = e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      $('#rmin', d).value = b.dataset.m;
      d.querySelectorAll('#rmins .chipsel').forEach(x => x.classList.toggle('on', x === b));
    };
    $('#rok', d).onclick = () => {
      const id = selTema(), t = tema(id);
      if (!t) return toast('Elige un tema');
      const f = $('#rfecha', d).value || hoy();
      put('sesiones', { id: nuevoId(), fecha: f, temaId: id, minutos: num($('#rmin', d).value), tipo: $('#rtipo', d).value, nota: $('#rnota', d).value.trim(), planId: plan?.id || '' });
      put('temas', { ...t, progreso: num(prog.value), vueltas: num(t.vueltas) + ($('#rvuelta', d).checked ? 1 : 0), autoeval: leerChip($('#restc', d), 'data-e') });
      if (plan) put('plan', { ...plan, hecho: true, tipo: $('#rtipo', d).value });
      dlg.close(); render(); toast('Estudio registrado');
    };
  });
}

function verSesion(s) {
  if (!s) return;
  abrir(`${cabecera(nombreTema(tema(s.temaId)))}
    <div class="dlg-b"><p>${esc(TIPOS[s.tipo] || 'Estudio')} · ${esc(fmtFecha(s.fecha))} · ${horas(num(s.minutos))}</p>
      ${s.nota ? `<p class="muted">${esc(s.nota)}</p>` : ''}</div>
    <div class="dlg-f"><button class="btn danger" type="button" id="sborrar">Borrar registro</button><button class="btn" type="button" data-cerrar>Cerrar</button></div>`, d => {
    $('#sborrar', d).onclick = () => {
      quitar('sesiones', s.id);
      if (s.planId && S.d.plan[s.planId]) put('plan', { ...S.d.plan[s.planId], hecho: false });
      dlg.close(); render(); toast('Registro borrado');
    };
  });
}

// ---------- Temario ----------
let filtroTem = 'todos', ordenTem = 'num';

function vTemario() {
  const dg = diagnosticos();
  const ts = temasDe(matTemario);
  const pesoT = ts.reduce((a, t) => a + pesoExamen(t), 0);
  const avPond = pesoT ? ts.reduce((a, t) => a + pesoExamen(t) * num(t.progreso), 0) / pesoT : null;
  const pasa = (t, f) => f === 'todos' || (f === 'critica' ? imp(t) === 'critica' : f === 'avisos' ? !!dg[t.id].aviso : dg[t.id].estado === f);
  const filtros = [['todos', 'Todos'], ['critica', 'Críticos'], ['reforzar', 'Reforzar'], ['repasar', 'Repasar'], ['dominado', 'Dominados'], ['nuevo', 'Sin empezar'], ['avisos', 'A revisar']]
    .map(([k, n]) => [k, n, ts.filter(t => pasa(t, k)).length]).filter(([k, , c]) => c || k === filtroTem || k === 'todos');
  let vis = ts.filter(t => pasa(t, filtroTem));
  if (ordenTem === 'prio') vis = porPrioridad(vis, dg);
  else if (ordenTem === 'olvido') vis.sort((a, b) => (dg[b.id].d ?? 1e9) - (dg[a.id].d ?? 1e9) || a.num - b.num);
  const criticosMal = ts.filter(t => imp(t) === 'critica' && ['reforzar', 'nuevo'].includes(dg[t.id].estado)).length;

  main.innerHTML = `<div class="seg" id="mats">${MATERIAS.map(([m, n]) => `<button type="button" data-m="${m}" class="${m === matTemario ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>
    <div class="card">
      <div class="row between"><b>${esc(NOMBRE_MAT[matTemario])}</b><span class="num"><b>${avPond == null ? '–' : Math.round(avPond)} %</b> <span class="muted small">de avance</span></span></div>
      <div class="progress ${matTemario}" style="margin:8px 0 4px"><i style="width:${Math.round(avPond || 0)}%"></i></div>
      <p class="muted small">Ponderado por lo que pesa cada tema en el examen.${criticosMal ? ` <b class="txt-bad">${criticosMal} ${criticosMal === 1 ? 'tema crítico' : 'temas críticos'} sin controlar.</b>` : ''}</p>
      ${barraEstados(ts, dg)}
    </div>
    <div class="card">${mapaTemas(ts, dg)}</div>
    <div class="chips" id="ftem" style="margin-bottom:8px">${filtros.map(([k, n, c]) => `<button class="chipsel ${k === filtroTem ? 'on' : ''}" type="button" data-f="${k}">${n}${k !== 'todos' ? ` <span class="num">${c}</span>` : ''}</button>`).join('')}</div>
    <div class="row between" style="margin-bottom:10px">
      <select class="input" id="otem" style="width:auto;min-height:36px;padding:4px 10px" aria-label="Ordenar">
        ${[['num', 'Por número'], ['prio', 'Por prioridad'], ['olvido', 'Más olvidados primero']].map(([k, n]) => `<option value="${k}" ${k === ordenTem ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="btn sm" type="button" id="clasif">Marcar importancia</button>
    </div>
    ${vis.map(t => {
      const g = dg[t.id], x = g.x;
      return `<div class="card tema bl-${imp(t)}" data-tema="${t.id}">
        <span class="n">${t.materia === 'temario' ? t.num : '·'}</span>
        <span class="t">${esc(t.materia === 'temario' ? (t.titulo || `Tema ${t.num}`) : t.titulo)}</span>
        <span class="pc">${num(t.progreso)} %</span>
        <div class="bar"><div class="progress ${t.materia}"><i style="width:${num(t.progreso)}%"></i></div></div>
        <div class="meta">${badgeImp(t)}${pillEst(g.estado)}${pillDias(x)}${g.aviso ? '<span class="badge warn">? Revisar</span>' : ''}</div>
        <div class="meta sub">${num(t.preguntasExamen) ? `<span>~${num(t.preguntasExamen)} preguntas</span>` : ''}${num(t.vueltas) ? `<span>${t.vueltas} ${t.vueltas == 1 ? 'vuelta' : 'vueltas'}</span>` : ''}${x.minutos ? `<span>${horas(x.minutos)}</span>` : ''}${g.nm != null ? `<span>Tests ${fmt1(g.nm)}</span>` : ''}${g.pend ? `<span>${g.pend} art. por repasar</span>` : ''}</div>
      </div>`;
    }).join('') || '<div class="card empty">Ningún tema en este filtro.</div>'}
    <button class="btn block" type="button" id="nuevoTema">+ Añadir tema a ${esc(NOMBRE_MAT[matTemario])}</button>`;
  $('#otem').onchange = e => { ordenTem = e.target.value; render(); };
  main.onclick = e => {
    const m = e.target.closest('[data-m]');
    if (m) { matTemario = m.dataset.m; filtroTem = 'todos'; return render(); }
    const f = e.target.closest('[data-f]');
    if (f) { filtroTem = f.dataset.f; return render(); }
    const t = e.target.closest('[data-tema]');
    if (t) return fichaTema(t.dataset.tema);
    if (e.target.closest('#clasif')) return clasificar(matTemario);
    if (e.target.closest('#nuevoTema')) {
      const n = Math.max(0, ...temasDe(matTemario).map(x => num(x.num))) + 1;
      const id = nuevoId();
      put('temas', { id, materia: matTemario, num: n, titulo: matTemario === 'temario' ? `Tema ${n}` : 'Nuevo tema', progreso: 0, vueltas: 0, notas: '', importancia: 'media' });
      render(); fichaTema(id);
    }
  };
}

function chipsImportancia(actual) {
  return `<div class="impsel" id="fimp">${ORDEN_IMP.map(k => `<button type="button" class="imp-op imp-${k} ${k === actual ? 'on' : ''}" data-i="${k}"><b>${IMPORTANCIA[k].n}</b><span>${IMPORTANCIA[k].desc}</span></button>`).join('')}</div>`;
}

// Importancia de todos los temas de una materia en una sola pantalla
function clasificar(m) {
  const fila = t => `<div class="clas" data-id="${t.id}">
      <span class="nm">${esc(nombreTema(t))}</span>
      <div class="seg mini-seg">${ORDEN_IMP.map(k => `<button type="button" data-i="${k}" class="imp-${k} ${imp(t) === k ? 'on' : ''}">${IMPORTANCIA[k].n}</button>`).join('')}</div>
      <input class="input num" type="number" inputmode="numeric" min="0" placeholder="nº" value="${num(t.preguntasExamen) || ''}" aria-label="Preguntas que suelen caer de ${esc(nombreTema(t))}">
    </div>`;
  abrir(`${cabecera('Importancia · ' + NOMBRE_MAT[m])}
    <div class="dlg-b">
      <p class="muted small">Marca cuánto cae de cada tema en el examen. En la casilla de la derecha, si lo sabes, el número de preguntas que suelen caer: se usa para calcular el avance y las prioridades.</p>
      ${temasDe(m).map(fila).join('')}
    </div>
    <div class="dlg-f"><button class="btn primary" type="button" data-cerrar>Hecho</button></div>`, d => {
    d.querySelectorAll('.clas').forEach(el => {
      const t = () => tema(el.dataset.id);
      el.querySelector('.seg').onclick = e => {
        const b = e.target.closest('[data-i]'); if (!b) return;
        el.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b));
        put('temas', { ...t(), importancia: b.dataset.i });
      };
      el.querySelector('input').onchange = e => put('temas', { ...t(), preguntasExamen: num(e.target.value) });
    });
    dlg.addEventListener('close', () => render(), { once: true });
  });
}

function fichaTema(id) {
  const t = tema(id);
  if (!t) return;
  const g = diagnosticos()[id], x = g.x;
  const hist = [
    ...lista('sesiones').filter(s => s.temaId === id).map(s => ({ f: s.fecha, txt: `${TIPOS[s.tipo] || 'Estudio'} · ${horas(num(s.minutos))}${s.nota ? ' · ' + s.nota : ''}` })),
    ...lista('tests').filter(ts => (ts.temaIds || []).includes(id)).map(ts => { const n = notaTest(ts); return { f: ts.fecha, txt: `Test${ts.nombre ? ' «' + ts.nombre + '»' : ''} · ${n == null ? '–' : fmt1(n)}` }; }),
  ].sort((a, b) => b.f.localeCompare(a.f));
  const arts = articulosFallados().filter(a => a.temaId === id);
  const proxRepaso = x.ultimo ? sumarDias(x.ultimo, g.estab) : '';
  abrir(`${cabecera(t.materia === 'temario' ? `Tema ${t.num}` : NOMBRE_MAT[t.materia])}
    <div class="dlg-b">
      <div class="dsec">El tema</div>
      <div class="${t.materia === 'temario' ? 'grid2' : ''}" style="${t.materia === 'temario' ? 'grid-template-columns:80px 1fr' : ''}">
        ${t.materia === 'temario' ? `<label class="lbl" for="fnum">Nº<input class="input num" type="number" id="fnum" min="1" value="${num(t.num)}"></label>` : ''}
        <label class="lbl" for="ftit">Título<input class="input" id="ftit" value="${esc(t.titulo)}" placeholder="Por ejemplo: Derecho Constitucional"></label>
      </div>
      <div class="lbl">Importancia en el examen</div>
      ${chipsImportancia(imp(t))}
      <label class="lbl" for="fpreg">Preguntas que suelen caer (aprox., opcional)<input class="input num" type="number" inputmode="numeric" min="0" id="fpreg" value="${num(t.preguntasExamen) || ''}" placeholder="Por ejemplo: 8"></label>

      <div class="dsec">Cómo lo llevo</div>
      ${chipsEstado(g.propio, 'fest')}
      <div class="diag est-borde-${g.auto}">
        <div class="row between"><span class="small"><b>Diagnóstico de la app</b></span>${pillEst(g.auto)}</div>
        <p class="small" style="margin:6px 0 0">${esc(g.mot.join(' · '))}${g.punt != null ? ` · control ${fmt1(g.punt)}/10` : ''}</p>
        ${proxRepaso ? `<p class="small muted" style="margin:4px 0 0">Aguanta unos ${g.estab} días sin repasar (más con cada vuelta). Próximo repaso recomendado: <b>${esc(fmtFecha(proxRepaso))}</b>.</p>` : ''}
        ${g.aviso ? `<p class="aviso small" style="margin:8px 0 0">${esc(g.aviso)}</p>` : ''}
      </div>
      <label class="lbl" for="fprog">Dominio del tema <output id="fprogv">${num(t.progreso)} %</output><input type="range" id="fprog" min="0" max="100" step="5" value="${num(t.progreso)}"></label>
      <div class="row between"><span class="lbl" style="margin:0">Vueltas completas</span>
        <span class="row"><button class="btn sm" type="button" id="fmenos" aria-label="Quitar una vuelta">−</button><b class="num" id="fvueltas">${num(t.vueltas)}</b><button class="btn sm" type="button" id="fmas" aria-label="Sumar una vuelta">+</button></span></div>
      <label class="lbl" for="fnotas">Apuntes del tema<textarea class="input" id="fnotas" placeholder="Leyes que entran, trucos para recordar…">${esc(t.notas)}</textarea></label>

      <div class="dsec">Cifras</div>
      <div class="grid4">
        <div class="kpi"><div class="kpi-l">Última vez</div><div class="kpi-v kpi-s">${x.ultimo ? (g.d === 0 ? 'Hoy' : `${g.d} d`) : '–'}</div></div>
        <div class="kpi"><div class="kpi-l">Tiempo</div><div class="kpi-v kpi-s">${x.minutos ? horas(x.minutos) : '–'}</div></div>
        <div class="kpi"><div class="kpi-l">Nota tests</div><div class="kpi-v kpi-s">${g.nm == null ? '–' : fmt1(g.nm)}</div></div>
        <div class="kpi"><div class="kpi-l">Fallos</div><div class="kpi-v kpi-s">${x.fallos}</div></div>
      </div>
      ${arts.length ? `<div class="dsec">Artículos fallados</div><ul class="lista">${arts.map(a => `<li><span>${esc(nombreArt(a))}${a.repasado ? ' <span class="badge ok">Repasado</span>' : ''}</span><b class="num">${a.veces}×</b></li>`).join('')}</ul>` : ''}
      <div class="dsec">Historial</div>
      ${hist.length ? `<ul class="lista">${hist.slice(0, 30).map(h => `<li><span>${esc(h.txt)}</span><span class="muted small">${esc(fmtFecha(h.f))}</span></li>`).join('')}</ul>` : '<p class="muted small">Todavía no hay estudio ni tests de este tema.</p>'}
      <button class="btn block" type="button" id="freg">Registrar estudio de este tema</button>
    </div>
    <div class="dlg-f"><button class="btn danger" type="button" id="fborrar">Borrar tema</button><button class="btn primary" type="button" id="fok">Guardar</button></div>`, d => {
    let vueltas = num(t.vueltas), importancia = imp(t);
    chipsSeleccion($('#fest', d), 'data-e');
    $('#fimp', d).onclick = e => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      importancia = b.dataset.i;
      $('#fimp', d).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    };
    $('#fprog', d).oninput = e => { $('#fprogv', d).textContent = e.target.value + ' %'; };
    $('#fmenos', d).onclick = () => { vueltas = Math.max(0, vueltas - 1); $('#fvueltas', d).textContent = vueltas; };
    $('#fmas', d).onclick = () => { vueltas++; $('#fvueltas', d).textContent = vueltas; };
    const leer = () => ({ ...t, titulo: $('#ftit', d).value.trim() || (t.materia === 'temario' ? `Tema ${t.num}` : t.titulo), num: $('#fnum', d) ? num($('#fnum', d).value, t.num) : t.num,
      progreso: num($('#fprog', d).value), vueltas, notas: $('#fnotas', d).value, importancia, preguntasExamen: num($('#fpreg', d).value), autoeval: leerChip($('#fest', d), 'data-e') });
    $('#fok', d).onclick = () => { put('temas', leer()); dlg.close(); render(); toast('Tema guardado'); };
    $('#freg', d).onclick = () => { put('temas', leer()); registrarEstudio({ temaId: id, tipo: tipoSugerido(g.estado) }); };
    $('#fborrar', d).onclick = async () => {
      if (!await preguntar(`¿Borrar «${nombreTema(t)}»? Se quitan también sus días planificados. El historial de tests se conserva.`)) return;
      lista('plan').filter(p => p.temaId === id).forEach(p => quitar('plan', p.id));
      quitar('temas', id); dlg.close(); render(); toast('Tema borrado');
    };
  });
}

// ---------- Tests ----------
function vTests() {
  const ts = lista('tests').sort((a, b) => b.fecha.localeCompare(a.fecha) || num(b.mod) - num(a.mod));
  let html = `<div class="seg" id="subt"><button type="button" data-s="lista" class="${subTests === 'lista' ? 'on' : ''}">Tests hechos</button><button type="button" data-s="arts" class="${subTests === 'arts' ? 'on' : ''}">Artículos fallados</button></div>`;
  if (subTests === 'lista') {
    const ult = ts.slice(0, 5).map(notaTest).filter(n => n != null);
    const tot = ts.reduce((a, t) => ({ p: a.p + num(t.preguntas), a: a.a + num(t.aciertos) }), { p: 0, a: 0 });
    html += `<div class="resumen">
      <div class="kpi"><div class="kpi-l">Tests</div><div class="kpi-v">${ts.length}</div></div>
      <div class="kpi"><div class="kpi-l">Media últimos 5</div><div class="kpi-v ${claseNota(media(ult))}">${ult.length ? fmt1(media(ult)) : '–'}</div></div>
      <div class="kpi"><div class="kpi-l">Aciertos</div><div class="kpi-v">${tot.p ? Math.round(tot.a / tot.p * 100) : '–'}<small>${tot.p ? ' %' : ''}</small></div></div>
    </div>`;
    html += ts.length ? ts.map(t => {
      const n = notaTest(t), tms = (t.temaIds || []).map(tema).filter(Boolean);
      const desc = tms.length > 3 ? `${tms.length} temas` : tms.map(x => x.materia === 'temario' ? `T${x.num}` : x.titulo).join(', ');
      return `<div class="card test" data-test="${t.id}">
        <div class="grow"><b>${esc(t.nombre || 'Test')}</b> ${matChip(t.materia)}<div class="muted small">${esc(fmtFecha(t.fecha))}${desc ? ' · ' + esc(desc) : ''}</div></div>
        <div class="nota ${claseNota(n)}">${n == null ? '–' : fmt1(n)}</div>
        <div class="aff"><span class="a">✓ ${num(t.aciertos)}</span><span class="f">✕ ${num(t.fallos)}</span><span class="b">○ ${num(t.blancos)}</span>${(t.fallosArt || []).length ? `<span class="muted">${t.fallosArt.length} art. anotados</span>` : ''}</div>
      </div>`;
    }).join('') : `<div class="card empty">Aún no hay tests. Pulsa «+ Añadir test» después de cada test: aciertos, fallos, en blanco y los artículos que has fallado.</div>`;
  } else {
    const arts = articulosFallados();
    const vis = filtroArt === 'pendientes' ? arts.filter(a => !a.repasado) : arts;
    html += `<div class="row between" style="margin-bottom:10px"><div class="chips">
      <button class="chipsel ${filtroArt === 'pendientes' ? 'on' : ''}" type="button" data-f="pendientes">Por repasar (${arts.filter(a => !a.repasado).length})</button>
      <button class="chipsel ${filtroArt === 'todos' ? 'on' : ''}" type="button" data-f="todos">Todos (${arts.length})</button></div></div>`;
    if (!vis.length) html += `<div class="card empty">${arts.length ? 'Todo repasado. Si vuelves a fallar un artículo, aparecerá aquí otra vez.' : 'Cuando anotes en un test los artículos fallados, aquí verás cuáles fallas más.'}</div>`;
    const porTema = new Map();
    vis.forEach(a => { if (!porTema.has(a.temaId)) porTema.set(a.temaId, []); porTema.get(a.temaId).push(a); });
    const orden = [...porTema.keys()].sort((a, b) => { const x = tema(a), y = tema(b); return (x ? MATERIAS.findIndex(m => m[0] === x.materia) * 1000 + num(x.num) : 1e6) - (y ? MATERIAS.findIndex(m => m[0] === y.materia) * 1000 + num(y.num) : 1e6); });
    html += orden.map(id => `<div class="card"><h3>${esc(nombreTema(tema(id)))}</h3>
      ${porTema.get(id).map(a => `<div class="art ${a.repasado ? 'repasado' : ''}">
        <div class="grow"><b>${esc(nombreArt(a))}</b><div class="muted small">Último fallo: ${esc(fmtFecha(a.ultimo))}${a.notas.length ? ' · ' + esc(a.notas[a.notas.length - 1]) : ''}</div></div>
        <div class="row"><span class="veces">${a.veces}×</span><button class="btn sm" type="button" data-rep="${esc(a.clave)}">${a.repasado ? 'Desmarcar' : 'Repasado'}</button></div>
      </div>`).join('')}</div>`).join('');
  }
  main.innerHTML = html;
  main.onclick = e => {
    const b = e.target.closest('[data-s],[data-test],[data-f],[data-rep]');
    if (!b) return;
    if (b.dataset.s) { subTests = b.dataset.s; render(); }
    else if (b.dataset.test) editarTest(S.d.tests[b.dataset.test]);
    else if (b.dataset.f) { filtroArt = b.dataset.f; render(); }
    else if (b.dataset.rep) {
      const id = idMarca(b.dataset.rep), a = articulosFallados().find(x => x.clave === b.dataset.rep);
      if (a?.repasado) quitar('marcas', id); else put('marcas', { id, clave: b.dataset.rep, fecha: hoy() });
      render();
    }
  };
}

function editarTest(t0) {
  const nuevo = !t0;
  const t = t0 ? JSON.parse(JSON.stringify(t0)) : { id: nuevoId(), fecha: hoy(), nombre: '', materia: 'temario', temaIds: [], preguntas: '', aciertos: '', fallos: '', blancos: '', minutos: '', sinPenal: false, fallosArt: [] };
  let sel = new Set(t.temaIds);
  const normas = [...new Set(lista('tests').flatMap(x => (x.fallosArt || []).map(f => f.norma).filter(Boolean)))];
  abrir(`${cabecera(nuevo ? 'Nuevo test' : 'Test')}
    <div class="dlg-b">
      <div class="grid2">
        <label class="lbl" for="tfecha">Fecha<input class="input" type="date" id="tfecha" value="${esc(t.fecha)}"></label>
        <label class="lbl" for="tmat">Materia<select class="input" id="tmat">${MATERIAS.map(([m, n]) => `<option value="${m}" ${m === t.materia ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      </div>
      <label class="lbl" for="tnom">Nombre<input class="input" id="tnom" value="${esc(t.nombre)}" placeholder="Por ejemplo: Test academia nº 12, Simulacro oficial 2024"></label>
      <div class="lbl">Temas que entran</div>
      <div class="chips" id="ttemas"></div>
      <div class="dsec">Resultado</div>
      <div class="cifras">
        <label class="lbl" for="tpre">Preguntas<input class="input num" type="number" inputmode="numeric" min="0" id="tpre" value="${esc(t.preguntas)}"></label>
        <label class="lbl" for="tacie">Aciertos<input class="input num" type="number" inputmode="numeric" min="0" id="tacie" value="${esc(t.aciertos)}"></label>
        <label class="lbl" for="tfall">Fallos<input class="input num" type="number" inputmode="numeric" min="0" id="tfall" value="${esc(t.fallos)}"></label>
        <label class="lbl" for="tblan">En blanco<input class="input num" type="number" inputmode="numeric" min="0" id="tblan" value="${esc(t.blancos)}"></label>
      </div>
      <div class="grid2">
        <label class="lbl" for="tmin">Tiempo (minutos)<input class="input num" type="number" inputmode="numeric" min="0" id="tmin" value="${esc(t.minutos)}"></label>
        <label class="check" style="align-self:end"><input type="checkbox" id="tsinp" ${t.sinPenal ? 'checked' : ''}> Sin penalización</label>
      </div>
      <div class="notabox"><span>Nota sobre 10 <span class="muted small" id="tformula"></span></span><b id="tnota">–</b></div>
      <div class="dsec">Artículos o preguntas falladas</div>
      <p class="muted small">Apunta la ley y el artículo de cada fallo (por ejemplo: Constitución, art. 14). Así sabrás cuáles fallas más.</p>
      <datalist id="normas">${normas.map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
      <div id="tfallos"></div>
      <button class="btn block" type="button" id="tmasf">+ Añadir fallo</button>
    </div>
    <div class="dlg-f">${nuevo ? '<button class="btn" type="button" data-cerrar>Cancelar</button>' : '<button class="btn danger" type="button" id="tborrar">Borrar</button>'}<button class="btn primary" type="button" id="tok">Guardar</button></div>`, d => {
    let montado = false;
    const temasMat = () => temasDe($('#tmat', d).value);
    const pintarTemas = () => {
      const ts = temasMat();
      $('#ttemas', d).innerHTML = `<button class="chipsel ${ts.length && ts.every(x => sel.has(x.id)) ? 'on' : ''}" type="button" data-todos>Todos</button>` +
        ts.map(x => `<button class="chipsel ${sel.has(x.id) ? 'on' : ''}" type="button" data-tid="${x.id}">${esc(x.materia === 'temario' ? `T${x.num}` : x.titulo)}</button>`).join('');
      pintarFallos();
    };
    const opcionesTema = actual => {
      const ts = sel.size ? [...sel].map(tema).filter(Boolean) : temasMat();
      if (actual && !ts.some(x => x.id === actual) && tema(actual)) ts.push(tema(actual));
      return ts.map(x => `<option value="${x.id}" ${x.id === actual ? 'selected' : ''}>${esc(nombreTema(x))}</option>`).join('');
    };
    const leerFallos = () => [...d.querySelectorAll('#tfallos .fallo')].map(r => ({
      temaId: $('.tsel', r).value, norma: $('.fn', r).value.trim(), articulo: $('.fa', r).value.trim(), nota: $('.fx', r).value.trim(),
    }));
    function pintarFallos(lst = null) {
      const fs = lst || (montado ? leerFallos() : t.fallosArt);
      montado = true;
      $('#tfallos', d).innerHTML = fs.map((f, i) => `<div class="fallo">
        <select class="input tsel" aria-label="Tema">${opcionesTema(f.temaId)}</select>
        <input class="input fn" list="normas" placeholder="Ley o norma" value="${esc(f.norma)}" aria-label="Ley o norma">
        <input class="input fa" placeholder="Art." value="${esc(f.articulo)}" aria-label="Artículo">
        <button class="icon-btn" type="button" data-qf="${i}" aria-label="Quitar fallo">×</button>
        <input class="input fx ancho" placeholder="Qué preguntaban o qué confundiste (opcional)" value="${esc(f.nota)}" aria-label="Nota del fallo">
      </div>`).join('');
    }
    const calc = () => {
      const p = num($('#tpre', d).value), a = num($('#tacie', d).value), f = num($('#tfall', d).value);
      const bl = $('#tblan', d);
      if (p && bl.dataset.auto !== '0') bl.value = Math.max(0, p - a - f);
      const n = notaTest({ preguntas: p, aciertos: a, fallos: f, sinPenal: $('#tsinp', d).checked });
      $('#tnota', d).textContent = n == null ? '–' : fmt1(n);
      $('#tnota', d).className = 'nota ' + claseNota(n);
      const div = num(cfg().penal, 3);
      $('#tformula', d).textContent = $('#tsinp', d).checked || !div ? '(aciertos / preguntas)' : `(aciertos − fallos/${div})`;
    };
    pintarTemas(); calc();
    ['#tpre', '#tacie', '#tfall', '#tsinp'].forEach(s => { $(s, d).oninput = calc; });
    $('#tblan', d).oninput = e => { e.target.dataset.auto = '0'; };
    if (!nuevo) $('#tblan', d).dataset.auto = '0';
    $('#tmat', d).onchange = () => { sel = new Set(); pintarTemas(); };
    $('#ttemas', d).onclick = e => {
      const b = e.target.closest('[data-tid],[data-todos]'); if (!b) return;
      if (b.dataset.todos != null) { const ts = temasMat(); const todos = ts.every(x => sel.has(x.id)); ts.forEach(x => todos ? sel.delete(x.id) : sel.add(x.id)); }
      else sel.has(b.dataset.tid) ? sel.delete(b.dataset.tid) : sel.add(b.dataset.tid);
      const fs = leerFallos(); pintarTemas(); pintarFallos(fs);
    };
    $('#tmasf', d).onclick = () => {
      const fs = leerFallos();
      const ult = fs[fs.length - 1];
      fs.push({ temaId: ult?.temaId || [...sel][0] || temasMat()[0]?.id || '', norma: ult?.norma || '', articulo: '', nota: '' });
      pintarFallos(fs);
      d.querySelectorAll('#tfallos .fa')[fs.length - 1]?.focus();
    };
    $('#tfallos', d).onclick = e => {
      const b = e.target.closest('[data-qf]'); if (!b) return;
      const fs = leerFallos(); fs.splice(+b.dataset.qf, 1); pintarFallos(fs);
    };
    $('#tok', d).onclick = () => {
      const p = num($('#tpre', d).value), a = num($('#tacie', d).value), f = num($('#tfall', d).value), bl = num($('#tblan', d).value);
      if (!p) return toast('Indica el número de preguntas');
      if (a + f + bl > p) return toast('Aciertos + fallos + en blanco no puede superar las preguntas');
      const fallosArt = leerFallos().filter(x => x.norma || x.articulo || x.nota);
      const temaIds = sel.size ? [...sel] : [...new Set(fallosArt.map(x => x.temaId).filter(Boolean))];
      put('tests', { ...t, fecha: $('#tfecha', d).value || hoy(), nombre: $('#tnom', d).value.trim(), materia: $('#tmat', d).value, temaIds,
        preguntas: p, aciertos: a, fallos: f, blancos: bl, minutos: num($('#tmin', d).value), sinPenal: $('#tsinp', d).checked, fallosArt });
      dlg.close(); render(); toast(nuevo ? 'Test guardado' : 'Cambios guardados');
    };
    if (!nuevo) $('#tborrar', d).onclick = async () => {
      if (!await preguntar('¿Borrar este test y sus fallos anotados?')) return;
      quitar('tests', t.id); dlg.close(); render(); toast('Test borrado');
    };
  });
}

// ---------- Informe ----------
function graficoNotas(ts) {
  const pts = ts.map(t => ({ f: t.fecha, n: notaTest(t) })).filter(p => p.n != null).slice(-20);
  if (pts.length < 2) return '<p class="muted small">Con dos tests o más verás aquí cómo evoluciona la nota.</p>';
  const W = 400, H = 170, L = 26, R = 12, T = 12, B = 24;
  const x = i => L + i * (W - L - R) / (pts.length - 1), y = n => T + (10 - n) * (H - T - B) / 10;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.n).toFixed(1)}`).join('');
  const area = `${line}L${x(pts.length - 1).toFixed(1)} ${y(0)}L${x(0)} ${y(0)}Z`;
  const u = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la nota de los últimos ${pts.length} tests">
    ${[0, 5, 10].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <path class="area" d="${area}"/><path class="linea" d="${line}"/>
    ${pts.map((p, i) => `<circle class="pt ${i === pts.length - 1 ? 'fin' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.n).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3.5}"><title>${esc(fmtFecha(p.f))}: ${fmt1(p.n)}</title></circle>`).join('')}
    <text x="${x(pts.length - 1)}" y="${Math.max(12, y(u.n) - 10)}" text-anchor="end" style="font-weight:700">${fmt1(u.n)}</text>
    <text x="${L}" y="${H - 6}">${esc(fmtFecha(pts[0].f, { day: 'numeric', month: 'short' }))}</text>
    <text x="${W - R}" y="${H - 6}" text-anchor="end">${esc(fmtFecha(u.f, { day: 'numeric', month: 'short' }))}</text>
  </svg>`;
}

function graficoHoras(obj) {
  const l0 = lunes(hoy());
  const sem = [...Array(8)].map((_, i) => sumarDias(l0, (i - 7) * 7));
  const ses = lista('sesiones');
  const v = sem.map(s => ses.filter(x => x.fecha >= s && x.fecha <= sumarDias(s, 6)).reduce((a, x) => a + num(x.minutos), 0) / 60);
  const max = Math.max(obj || 0, ...v, 1) * 1.15;
  const W = 400, H = 170, L = 26, R = 6, T = 18, B = 24, bw = (W - L - R) / 8;
  const y = h => T + (1 - h / max) * (H - T - B);
  const paso = max > 40 ? 10 : max > 16 ? 5 : max > 6 ? 2 : 1;
  const ticks = []; for (let t = 0; t <= max; t += paso) ticks.push(t);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Horas de estudio de las últimas 8 semanas">
    ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
    ${v.map((h, i) => `<rect class="barra ${i === 7 ? 'actual' : ''}" x="${(L + i * bw + bw * .18).toFixed(1)}" y="${y(h).toFixed(1)}" width="${(bw * .64).toFixed(1)}" height="${(y(0) - y(h)).toFixed(1)}" rx="3"><title>${fmt1(h)} h</title></rect>
      ${h ? `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${(y(h) - 5).toFixed(1)}" text-anchor="middle">${fmt1(h)}</text>` : ''}
      <text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${i === 7 ? 'Esta' : `${aFecha(sem[i]).getDate()}/${aFecha(sem[i]).getMonth() + 1}`}</text>`).join('')}
    ${obj ? `<line class="obj" x1="${L}" x2="${W - R}" y1="${y(obj)}" y2="${y(obj)}"><title>Objetivo: ${obj} h</title></line>` : ''}
  </svg>`;
}

function datosInforme() {
  const dg = diagnosticos(), st = Object.fromEntries(Object.entries(dg).map(([k, g]) => [k, g.x])), c = cfg(), h = hoy();
  const temas = MATERIAS.flatMap(([m]) => temasDe(m));
  const ts = lista('tests').sort((a, b) => a.fecha.localeCompare(b.fecha) || num(a.mod) - num(b.mod));
  const ses = lista('sesiones');
  const l0 = lunes(h);
  const minSem = ses.filter(s => s.fecha >= l0).reduce((a, s) => a + num(s.minutos), 0);
  const ult5 = ts.slice(-5).map(notaTest).filter(n => n != null);
  const tem = temasDe('temario'), pesoT = tem.reduce((a, t) => a + pesoExamen(t), 0);
  const graves = temas.filter(t => ['critica', 'alta'].includes(imp(t)));
  const alertas = [
    ...porPrioridad(graves.filter(t => ['reforzar', 'nuevo'].includes(dg[t.id].estado)), dg)
      .map(t => ({ t, cls: 'bad', txt: dg[t.id].estado === 'nuevo' ? 'sin empezar' : 'no lo controla: reforzar' })),
    ...graves.filter(t => dg[t.id].estado !== 'nuevo' && dg[t.id].d != null && dg[t.id].d > dg[t.id].estab)
      .map(t => ({ t, cls: 'warn', txt: `${dg[t.id].d} días sin tocar: toca repaso` })),
    ...temas.filter(t => dg[t.id].aviso).map(t => ({ t, cls: 'warn', txt: dg[t.id].aviso })),
  ];
  return {
    dg, st, c, temas, ts, ses, minSem, alertas,
    avance: pesoT ? tem.reduce((a, t) => a + pesoExamen(t) * num(t.progreso), 0) / pesoT : null,
    criticos: temas.filter(t => imp(t) === 'critica'),
    sinEstudiar: temas.filter(t => !st[t.id].ultimo),
    olvidados: temas.filter(t => st[t.id].ultimo && diasSin(st[t.id]) > 7).sort((a, b) => diasSin(st[b.id]) - diasSin(st[a.id])),
    notaMedia: media(ult5),
    diasExamen: c.fechaExamen ? diasEntre(h, c.fechaExamen) : null,
    arts: articulosFallados().filter(a => !a.repasado),
    flojos: temas.filter(t => dg[t.id].nm != null && dg[t.id].nm < 5),
    prioridades: porPrioridad(temas, dg).filter(t => dg[t.id].estado !== 'dominado' || dg[t.id].d > dg[t.id].estab).slice(0, 10),
  };
}

function matrizImportancia(I) {
  const { dg, temas } = I;
  const cols = ['reforzar', 'nuevo', 'repasar', 'dominado'];
  return `<div class="tabla-w"><table class="tabla matriz">
    <thead><tr><th>Importancia</th>${cols.map(e => `<th class="r">${ESTADOS[e].corto}</th>`).join('')}<th class="r">Total</th></tr></thead>
    <tbody>${ORDEN_IMP.map(k => {
      const fila = temas.filter(t => imp(t) === k);
      return `<tr><td><span class="imp imp-${k}">${IMPORTANCIA[k].n}</span></td>${cols.map(e => {
        const n = fila.filter(t => dg[t.id].estado === e).length;
        const alarma = n && (k === 'critica' || k === 'alta') && (e === 'reforzar' || e === 'nuevo');
        return `<td class="r"><span class="celda-n ${n ? 'est-' + e : ''} ${alarma ? 'alarma' : ''}">${n || '·'}</span></td>`;
      }).join('')}<td class="r"><b>${fila.length}</b></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function barraPreguntas(I) {
  const { dg, temas } = I;
  const con = temas.filter(t => num(t.preguntasExamen));
  if (!con.length) return '';
  const tot = con.reduce((a, t) => a + num(t.preguntasExamen), 0);
  const por = e => con.filter(t => dg[t.id].estado === e).reduce((a, t) => a + num(t.preguntasExamen), 0);
  const orden = ['dominado', 'repasar', 'reforzar', 'nuevo'];
  return `<div class="sec">Preguntas que suelen caer</div>
    <div class="card"><p style="margin:0 0 8px">De unas <b class="num">${tot}</b> preguntas de los ${con.length} temas con cifra, <b class="num">${por('dominado')}</b> son de temas que lleva muy bien.</p>
      <div class="apilada">${orden.map(e => por(e) ? `<i class="est-${e}" style="width:${por(e) / tot * 100}%"></i>` : '').join('')}</div>
      <div class="leyenda">${orden.map(e => `<span><i class="sw est-${e}"></i>${ESTADOS[e].corto} <b class="num">${por(e)}</b></span>`).join('')}</div></div>`;
}

function htmlInforme(I) {
  const { st, dg, c, temas } = I;
  const kpi = (l, v, cls = '') => `<div class="kpi"><div class="kpi-l">${l}</div><div class="kpi-v ${cls}">${v}</div></div>`;
  const critOk = I.criticos.filter(t => dg[t.id].estado === 'dominado').length;
  return `
    <div class="grid4" style="margin-bottom:12px">
      ${kpi('Avance temario', `${I.avance == null ? '–' : Math.round(I.avance)}<small> %</small>`)}
      ${kpi('Críticos dominados', I.criticos.length ? `${critOk}<small>/${I.criticos.length}</small>` : '–', I.criticos.length && critOk < I.criticos.length ? 'nota bad' : '')}
      ${kpi('Esta semana', `${fmt1(I.minSem / 60)}<small> h${num(c.objetivoH) ? ' / ' + num(c.objetivoH) : ''}</small>`)}
      ${kpi('Media 5 tests', I.notaMedia == null ? '–' : fmt1(I.notaMedia), 'nota ' + claseNota(I.notaMedia))}
    </div>
    ${I.diasExamen != null && I.diasExamen >= 0 ? `<p class="muted">Quedan <b>${I.diasExamen} días</b> para el examen (${esc(fmtFecha(c.fechaExamen, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}).</p>` : ''}
    ${!I.criticos.length ? '<p class="aviso">Aún no hay temas marcados como críticos. En Temario → «Marcar importancia» indica cuánto cae de cada tema: así las prioridades y las alertas serán mucho más útiles.</p>' : ''}

    ${I.alertas.length ? `<div class="sec">Alertas (${I.alertas.length})</div>
    <div class="card alertas"><ul class="lista">${I.alertas.slice(0, 15).map(a => `<li><span>${badgeImp(a.t)} <b>${esc(nombreTema(a.t))}</b><br><span class="small ${a.cls === 'bad' ? 'txt-bad' : 'muted'}">${esc(a.txt)}</span></span>${pillEst(dg[a.t.id].estado)}</li>`).join('')}</ul></div>` : ''}

    <div class="sec">Mapa del temario</div>
    <div class="card">${MATERIAS.map(([m, n]) => temasDe(m).length ? `<div class="submapa"><div class="small muted" style="margin-bottom:6px"><b>${esc(n)}</b></div>${mapaTemas(temasDe(m), dg, false)}</div>` : '').join('')}
      ${leyendaMapa()}</div>

    <div class="sec">Importancia frente a cómo se lleva</div>
    <div class="card">${matrizImportancia(I)}<p class="muted small" style="margin:8px 0 0">En rojo, temas críticos o altos que no se controlan o no se han empezado: son los que más puntos cuestan.</p></div>

    ${barraPreguntas(I)}

    <div class="sec">Lo siguiente que conviene estudiar</div>
    <div class="card"><ul class="lista">${I.prioridades.map((t, i) => `<li><span><b class="num">${i + 1}.</b> ${badgeImp(t)} ${esc(nombreTema(t))} <span class="muted small">· ${esc(motivoPrio(t, dg[t.id]))}</span></span>${pillEst(dg[t.id].estado)}</li>`).join('') || '<li><span class="muted">Todo al día.</span></li>'}</ul></div>

    <div class="sec">Por materia</div>
    <div class="matgrid">${MATERIAS.map(([m]) => {
      const tm = temasDe(m), pw = tm.reduce((a, t) => a + pesoExamen(t), 0);
      const av = pw ? tm.reduce((a, t) => a + pesoExamen(t) * num(t.progreso), 0) / pw : null;
      const min = tm.reduce((a, t) => a + st[t.id].minutos, 0);
      const nt = media(I.ts.filter(t => t.materia === m).map(notaTest).filter(x => x != null));
      return `<div class="card"><div class="row between">${matChip(m)}<b class="num">${av == null ? '–' : Math.round(av)} %</b></div>
        <div class="progress ${m}" style="margin:8px 0"><i style="width:${Math.round(av || 0)}%"></i></div>
        <div class="muted small" style="margin-bottom:8px">${min ? horas(min) : 'Sin horas'} · ${nt == null ? 'sin tests' : 'nota ' + fmt1(nt)}</div>
        ${barraEstados(tm, dg)}</div>`;
    }).join('')}</div>

    <div class="sec">Evolución de la nota en tests</div>
    <div class="card">${graficoNotas(I.ts)}</div>

    <div class="sec">Horas de estudio por semana</div>
    <div class="card">${graficoHoras(num(c.objetivoH))}${num(c.objetivoH) ? `<p class="muted small" style="margin:6px 0 0">La línea discontinua es el objetivo de ${num(c.objetivoH)} h semanales.</p>` : ''}</div>

    <div class="sec">Temas pendientes sin estudiar (${I.sinEstudiar.length})</div>
    <div class="card">${I.sinEstudiar.length ? MATERIAS.map(([m]) => {
      const ps = porPrioridad(I.sinEstudiar.filter(t => t.materia === m), dg);
      return ps.length ? `<div class="pend"><div class="row between">${matChip(m)}<span class="muted small">${ps.length} de ${temasDe(m).length}</span></div>
        <div class="chips">${ps.map(t => `<span class="imp imp-${imp(t)}">${esc(m === 'temario' ? `Tema ${t.num}` : t.titulo)}</span>`).join('')}</div></div>` : '';
    }).join('') + '<p class="muted small" style="margin:8px 0 0">El color es la importancia: en rojo, los críticos.</p>' : '<p class="muted" style="margin:0">Todos los temas se han estudiado al menos una vez.</p>'}</div>

    <div class="sec">Hace más de una semana que no se tocan (${I.olvidados.length})</div>
    <div class="card">${I.olvidados.length ? `<ul class="lista">${I.olvidados.map(t => `<li><span>${badgeImp(t)} ${esc(nombreTema(t))} <span class="muted small">· ${num(t.progreso)} %</span></span>${pillDias(st[t.id])}</li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Nada olvidado: todo lo estudiado se ha tocado en los últimos 7 días.</p>'}</div>

    <div class="sec">Artículos más fallados sin repasar (${I.arts.length})</div>
    <div class="card">${I.arts.length ? `<ul class="lista">${I.arts.slice(0, 20).map(a => `<li><span><b>${esc(nombreArt(a))}</b> <span class="muted small">· ${esc(nombreTema(tema(a.temaId)))}</span></span><b class="num txt-bad">${a.veces}×</b></li>`).join('')}</ul>` : '<p class="muted" style="margin:0">No hay artículos fallados pendientes de repasar.</p>'}</div>

    ${I.flojos.length ? `<div class="sec">Temas con nota media de test por debajo de 5</div>
    <div class="card"><ul class="lista">${I.flojos.map(t => `<li><span>${badgeImp(t)} ${esc(nombreTema(t))}</span><b class="num nota bad">${fmt1(dg[t.id].nm)}</b></li>`).join('')}</ul></div>` : ''}

    <div class="sec">Todos los temas</div>
    <div class="card tabla-w"><table class="tabla">
      <thead><tr><th>Tema</th><th>Importancia</th><th>Cómo va</th><th class="r">Dominio</th><th class="r">Vueltas</th><th class="r">Sin tocar</th><th class="r">Horas</th><th class="r">Nota</th><th class="r">Fallos</th></tr></thead>
      <tbody>${temas.map(t => {
        const x = st[t.id], g = dg[t.id], d = g.d;
        return `<tr><td class="t">${matChip(t.materia)} ${esc(nombreTema(t))}</td>
          <td>${badgeImp(t)}${num(t.preguntasExamen) ? ` <span class="muted small">~${num(t.preguntasExamen)}</span>` : ''}</td>
          <td>${pillEst(g.estado)}${g.aviso ? ' <span class="badge warn" title="' + esc(g.aviso) + '">?</span>' : ''}</td>
          <td class="r"><span class="mini"><i style="width:${num(t.progreso)}%"></i></span>${num(t.progreso)} %</td>
          <td class="r">${num(t.vueltas)}</td>
          <td class="r">${d == null ? '<span class="badge none">nunca</span>' : `<span class="badge ${d <= 7 ? 'ok' : d <= 14 ? 'warn' : 'bad'}">${d} d</span>`}</td>
          <td class="r">${x.minutos ? fmt1(x.minutos / 60) : '–'}</td>
          <td class="r">${g.nm == null ? '–' : `<span class="nota ${claseNota(g.nm)}">${fmt1(g.nm)}</span>`}</td>
          <td class="r">${x.fallos || '–'}</td></tr>`;
      }).join('')}</tbody></table></div>`;
}

function textoInforme(I) {
  const { st, dg, c } = I;
  const l = [`INFORME DE OPOSICIÓN · GUARDIA CIVIL${c.nombre ? ' · ' + c.nombre : ''}`, `Fecha: ${fmtFecha(hoy(), { day: 'numeric', month: 'long', year: 'numeric' })}`];
  if (I.diasExamen != null && I.diasExamen >= 0) l.push(`Días hasta el examen: ${I.diasExamen}`);
  l.push('', `Avance del temario (ponderado): ${I.avance == null ? '–' : Math.round(I.avance)} %`,
    `Temas críticos dominados: ${I.criticos.filter(t => dg[t.id].estado === 'dominado').length} de ${I.criticos.length}`,
    `Horas esta semana: ${fmt1(I.minSem / 60)}${num(c.objetivoH) ? ' de ' + num(c.objetivoH) : ''}`,
    `Nota media últimos 5 tests: ${I.notaMedia == null ? '–' : fmt1(I.notaMedia)}`);
  if (I.alertas.length) l.push('', `ALERTAS (${I.alertas.length})`, ...I.alertas.map(a => `- ${nombreTema(a.t)} [${IMPORTANCIA[imp(a.t)].n}]: ${a.txt}`));
  l.push('', 'LO SIGUIENTE QUE CONVIENE ESTUDIAR', ...I.prioridades.map((t, i) => `${i + 1}. ${nombreTema(t)} [${IMPORTANCIA[imp(t)].n}] · ${ESTADOS[dg[t.id].estado].corto} · ${motivoPrio(t, dg[t.id])}`));
  l.push('', 'TODOS LOS TEMAS');
  I.temas.forEach(t => {
    const x = st[t.id], d = diasSin(x);
    l.push(`- [${NOMBRE_MAT[t.materia]}] ${nombreTema(t)} · ${IMPORTANCIA[imp(t)].n} · ${ESTADOS[dg[t.id].estado].n}: ${num(t.progreso)} %, ${num(t.vueltas)} vueltas, ${d == null ? 'sin estudiar' : `hace ${d} días`}${x.fallos ? `, ${x.fallos} fallos` : ''}`);
  });
  l.push('', `PENDIENTES SIN ESTUDIAR (${I.sinEstudiar.length})`, ...porPrioridad(I.sinEstudiar, dg).map(t => `- ${nombreTema(t)} [${IMPORTANCIA[imp(t)].n}]`));
  l.push('', `MÁS DE UNA SEMANA SIN TOCAR (${I.olvidados.length})`, ...I.olvidados.map(t => `- ${nombreTema(t)}: hace ${diasSin(st[t.id])} días`));
  l.push('', `ARTÍCULOS FALLADOS SIN REPASAR (${I.arts.length})`, ...I.arts.map(a => `- ${nombreArt(a)} (${nombreTema(tema(a.temaId))}): ${a.veces} veces`));
  return l.join('\n');
}

function vInforme() {
  const I = datosInforme();
  main.innerHTML = `<div class="row wrap" style="margin-bottom:12px">
      <button class="btn sm" type="button" id="icopiar">Copiar informe</button>
      <button class="btn sm" type="button" id="ibajar">Descargar informe</button></div>
    <textarea class="input small" id="itexto" hidden readonly rows="8"></textarea>
    ${htmlInforme(I)}`;
  main.onclick = e => { const t = e.target.closest('[data-tema]'); if (t) fichaTema(t.dataset.tema); };
  $('#icopiar').onclick = async () => {
    const txt = textoInforme(I);
    try { await navigator.clipboard.writeText(txt); toast('Informe copiado: pégalo en WhatsApp o en un correo'); }
    catch { const ta = $('#itexto'); ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); toast('Selecciona el texto y cópialo'); }
  };
  $('#ibajar').onclick = async () => {
    let css = '';
    try { css = await (await fetch('app.css')).text(); } catch { /* se descarga sin estilos */ }
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Informe oposición ${esc(hoy())}</title><style>${css}</style></head>
      <body><header class="top"><h1>Informe de oposición${I.c.nombre ? ' · ' + esc(I.c.nombre) : ''} · ${esc(fmtFecha(hoy(), { day: 'numeric', month: 'long', year: 'numeric' }))}</h1></header>
      <main style="padding-bottom:24px">${htmlInforme(I)}</main></body></html>`;
    descargar(`informe-oposicion-${hoy()}.html`, doc, 'text/html');
  };
}

// ---------- Descargas (visor de claude.ai o navegador) ----------
let capDescargas = null;
async function descargar(nombre, contenido, tipo) {
  capDescargas ||= window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  const dl = await capDescargas;
  if (dl) {
    try { const r = await dl.save({ filename: nombre, data: new Blob([contenido], { type: tipo }) }); if (r?.status === 'saved') toast('Descargado'); }
    catch (e) { if (e?.code !== 'cancelled' && e?.code !== 'declined') toast('No se pudo descargar'); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Ajustes ----------
function vAjustes() {
  const c = cfg();
  const sync = { ok: 'Sincronizado: los cambios se ven al momento en todos los dispositivos donde se abra esta app con la misma cuenta, y en los de quien la tenga compartida con permiso de edición.',
    error: 'Sin conexión con la nube: lo que hagas se guarda en este dispositivo y se sube al recuperar la conexión.',
    conectando: 'Conectando con la nube…',
    local: 'Los datos se guardan solo en este navegador. Para no perderlos, descarga de vez en cuando una copia de seguridad.' }[nube.estado];
  main.innerHTML = `
    <div class="card"><h3>Opositora</h3>
      <label class="lbl" for="anom">Nombre<input class="input" id="anom" value="${esc(c.nombre)}" placeholder="Aparece en el informe"></label>
      <label class="lbl" for="aexa">Fecha del examen<input class="input" type="date" id="aexa" value="${esc(c.fechaExamen)}"></label>
      <label class="lbl" for="aobj">Objetivo de horas de estudio por semana<input class="input num" type="number" inputmode="numeric" min="0" id="aobj" value="${num(c.objetivoH)}"></label>
      <label class="lbl" for="apen">Penalización de los tests<select class="input" id="apen">
        ${[[3, 'Cada fallo resta 1/3 de acierto (3 respuestas incorrectas anulan 1 correcta)'], [4, 'Cada fallo resta 1/4 de acierto'], [2, 'Cada fallo resta 1/2 de acierto'], [0, 'Los fallos no restan']].map(([v, t]) => `<option value="${v}" ${num(c.penal, 3) === v ? 'selected' : ''}>${t}</option>`).join('')}
      </select></label>
      <p class="muted small" style="margin-top:6px">Compruébala en las bases de tu convocatoria. En cada test puedes marcar «Sin penalización» si ese test no penaliza.</p>
    </div>
    <div class="card"><h3>Pantalla</h3>
      <label class="lbl" for="atema">Tema<select class="input" id="atema">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, t]) => `<option value="${v}" ${(S.vista.tema || 'auto') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    </div>
    <div class="card"><h3>Sincronización</h3><p class="small">${sync}</p></div>
    <div class="card"><h3>Copia de seguridad</h3>
      <button class="btn block" type="button" id="acopia">Descargar copia de seguridad (.json)</button>
      <label class="btn block" for="arest">Restaurar una copia…</label>
      <input type="file" id="arest" accept=".json,application/json" hidden>
      <button class="btn block danger" type="button" id="aborrar">Borrar todos los datos</button>
    </div>`;
  const guardarCfg = () => put('config', { ...c, ...cfg(), nombre: $('#anom').value.trim(), fechaExamen: $('#aexa').value, objetivoH: num($('#aobj').value), penal: num($('#apen').value, 3) });
  ['#anom', '#aexa', '#aobj', '#apen'].forEach(s => { $(s).onchange = () => { guardarCfg(); pintarCuenta(); toast('Guardado'); }; });
  $('#atema').onchange = e => { guardarVista('tema', e.target.value); aplicarTema(); };
  $('#acopia').onclick = () => {
    const d = Object.fromEntries(COLS.map(k => [k, S.d[k]]));
    descargar(`oposicion-copia-${hoy()}.json`, JSON.stringify({ app: 'oposicion-gc', version: 1, fecha: new Date().toISOString(), d }, null, 1), 'application/json');
  };
  $('#arest').onchange = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    let copia;
    try { copia = JSON.parse(await f.text()); } catch { return toast('El archivo no es una copia válida'); }
    if (copia?.app !== 'oposicion-gc' || !copia.d?.temas) return toast('El archivo no es una copia de esta app');
    if (!await preguntar('Se sustituirán todos los datos actuales por los de la copia. ¿Continuar?', 'Restaurar')) return;
    COLS.forEach(k => {
      const nuevos = copia.d[k] && typeof copia.d[k] === 'object' ? copia.d[k] : {};
      Object.keys(S.d[k]).filter(id => !nuevos[id]).forEach(id => quitar(k, id));
      Object.values(nuevos).forEach(o => { if (o?.id) put(k, o); });
    });
    render(); pintarCuenta(); toast('Copia restaurada');
  };
  $('#aborrar').onclick = async () => {
    if (!await preguntar('¿Borrar todo? Se pierden planes, estudio, tests y fallos, también en los demás dispositivos. Descarga antes una copia si tienes dudas.', 'Borrar todo')) return;
    COLS.forEach(k => Object.keys(S.d[k]).forEach(id => quitar(k, id)));
    temasBase().forEach(t => put('temas', t));
    render(); pintarCuenta(); toast('Datos borrados');
  };
}

// ---------- Arranque ----------
$('#fab').onclick = () => {
  if (vista === 'semana') planificar();
  else if (vista === 'temario') { const t = porPrioridad(temasDe(matTemario), diagnosticos())[0]; registrarEstudio({ temaId: t?.id }); }
  else if (vista === 'tests') editarTest(null);
};
window.addEventListener('hashchange', ir);
aplicarTema();
ir();
conectarNube();
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.claude) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo sin conexión */ });
}
