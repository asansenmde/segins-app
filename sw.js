// Service worker: la app funciona sin conexión. Cambia VERSION al publicar una actualización.
const VERSION = 'segins-v3';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/db.js', 'js/state.js', 'js/ui.js', 'js/scoring.js', 'js/plantilla.js',
  'js/fotos.js', 'js/informe.js', 'js/lib/docx.iife.js',
  'js/views/comun.js', 'js/views/inicio.js', 'js/views/agenda.js', 'js/views/evaluaciones.js',
  'js/views/instalaciones.js', 'js/views/cuestionario.js', 'js/views/ajustes.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
