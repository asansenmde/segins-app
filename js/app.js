// Arranque, bloqueo por PIN, navegación.
import * as db from './db.js';
import { S, cargar, vaciar, volcarPendientes } from './state.js';
import { esc, toast } from './ui.js';
import { limpiarCache } from './fotos.js';
import * as vInicio from './views/inicio.js';
import * as vAgenda from './views/agenda.js';
import * as vEval from './views/evaluaciones.js';
import * as vInst from './views/instalaciones.js';
import * as vCuest from './views/cuestionario.js';
import * as vAjustes from './views/ajustes.js';

const app = document.getElementById('app');
// Minutos sin uso antes de pedir el PIN otra vez (se elige en Ajustes; 0 = solo al cerrar la app).
const minutosBloqueo = () => S.config?.bloqueoMin ?? 30;

const RUTAS = [
  [/^$/, vInicio.inicio],
  [/^agenda$/, vAgenda.agenda],
  [/^evaluaciones$/, vEval.lista],
  [/^eval\/([^/]+)\/area\/([^/]+)$/, vEval.area],
  [/^eval\/([^/]+)(?:\/(datos|areas|resultados|informe))?$/, vEval.detalle],
  [/^instalaciones$/, vInst.lista],
  [/^inst\/([^/]+)$/, vInst.detalle],
  [/^mas$/, vAjustes.mas],
  [/^cuestionario$/, vCuest.cuestionario],
  [/^ajustes$/, vAjustes.ajustes],
];

const NAV = [
  ['', 'Inicio', '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  ['agenda', 'Agenda', '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ['evaluaciones', 'Evaluaciones', '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 13l2 2 4-4"/>'],
  ['instalaciones', 'Instalaciones', '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"/>'],
  ['mas', 'Más', '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'],
];

const ruta = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));

function marco() {
  app.innerHTML = `
    <header class="top"><button class="back" id="back" aria-label="Atrás" hidden>‹</button><h1 id="titulo"></h1>
      <button class="lockbtn" id="lockbtn" aria-label="Bloquear" title="Bloquear"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></button></header>
    <main id="main"></main>
    <nav class="bottom">${NAV.map(([h, n, ic]) => `<a href="#/${h}" data-nav="${h}"><svg viewBox="0 0 24 24">${ic}</svg><span>${n}</span></a>`).join('')}</nav>`;
  document.getElementById('back').onclick = () => history.back();
  document.getElementById('lockbtn').onclick = bloquear;
}

export async function render() {
  if (!db.isUnlocked()) return;
  const r = ruta();
  // Se sustituye <main> en cada navegación para no arrastrar escuchadores de la vista anterior.
  const viejo = document.getElementById('main');
  const main = viejo.cloneNode(false);
  viejo.replaceWith(main);
  let hit = null;
  for (const [re, fn] of RUTAS) {
    const m = r.match(re);
    if (m) { hit = [fn, m.slice(1)]; break; }
  }
  if (!hit) { location.hash = '#/'; return; }
  const info = (await hit[0](main, ...hit[1])) || {};
  document.getElementById('titulo').textContent = info.titulo || 'SEGINS';
  document.getElementById('back').hidden = !info.atras;
  const seccion = info.seccion ?? r.split('/')[0];
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === seccion));
  window.scrollTo(0, 0);
}

// ---------- Bloqueo ----------

async function pantallaPIN() {
  const nuevo = !(await db.isSetup());
  app.innerHTML = `
    <div class="lock">
      <img src="icons/icon.svg" alt="" class="lock-logo">
      <h1>Evaluación SEGINS</h1>
      <p class="muted">${nuevo
        ? 'Crea un PIN (mínimo 6 cifras). Cifra todos los datos del móvil. <strong>Si lo olvidas, no hay forma de recuperar los datos.</strong>'
        : 'Introduce tu PIN'}</p>
      <form id="pinform" autocomplete="off">
        <input class="input pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" minlength="6" maxlength="12" placeholder="PIN" required autofocus>
        ${nuevo ? '<input class="input pin" name="pin2" type="password" inputmode="numeric" pattern="[0-9]*" minlength="6" maxlength="12" placeholder="Repite el PIN" required>' : ''}
        <button class="btn primary big" type="submit">${nuevo ? 'Crear PIN' : 'Desbloquear'}</button>
        <p class="err" id="pinerr"></p>
      </form>
    </div>`;
  const f = document.getElementById('pinform');
  const err = document.getElementById('pinerr');
  let fallos = 0;
  f.onsubmit = async e => {
    e.preventDefault();
    const pin = f.pin.value;
    if (!/^\d{6,12}$/.test(pin)) { err.textContent = 'El PIN debe tener entre 6 y 12 cifras.'; return; }
    const btn = f.querySelector('button');
    btn.disabled = true;
    err.textContent = '';
    try {
      if (nuevo) {
        if (pin !== f.pin2.value) { err.textContent = 'Los PIN no coinciden.'; return; }
        await db.setup(pin);
      } else if (!(await db.unlock(pin))) {
        fallos++;
        f.pin.value = '';
        if (fallos >= 5) {
          err.textContent = 'Demasiados intentos. Espera 30 segundos.';
          await new Promise(r => setTimeout(r, 30000));
          fallos = 0;
          err.textContent = '';
        } else err.textContent = 'PIN incorrecto.';
        return;
      }
      await cargar();
      marco();
      render();
    } finally {
      btn.disabled = false;
    }
  };
}

export async function bloquear() {
  await volcarPendientes();
  db.lock();
  vaciar();
  limpiarCache();
  document.querySelectorAll('.modal-wrap,.anotador').forEach(x => x.remove());
  pantallaPIN();
}

let ultimo = Date.now();
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { ultimo = Date.now(); }, { passive: true }));
setInterval(() => {
  if (db.isUnlocked() && minutosBloqueo() > 0 && Date.now() - ultimo > minutosBloqueo() * 60000) bloquear();
}, 15000);
let ocultoDesde = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ocultoDesde = Date.now(); volcarPendientes(); }
  else if (db.isUnlocked() && minutosBloqueo() > 0 && ocultoDesde && Date.now() - ocultoDesde > minutosBloqueo() * 60000) bloquear();
});

addEventListener('hashchange', render);

(async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.storage?.persist?.();
  if (!window.indexedDB || !crypto.subtle) {
    app.innerHTML = `<div class="lock"><p>${esc('Este navegador no admite almacenamiento cifrado. Abre la app con HTTPS en Chrome o Safari actualizados.')}</p></div>`;
    return;
  }
  pantallaPIN();
})();

window.addEventListener('unhandledrejection', e => { console.error(e.reason); toast('Error: ' + (e.reason?.message || e.reason)); });
