// Fotos: captura, compresión, sello de fecha, visor y anotación (flechas, círculos, texto…).
import * as db from './db.js';
import { esc, modal, uid } from './ui.js';

const MAX_LADO = 1600;
const cacheURL = new Map();

function cargarImagen(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const aBlob = (canvas, q = 0.82) => new Promise(res => canvas.toBlob(res, 'image/jpeg', q));

// Redimensiona, sella y recodifica a JPEG. Recodificar elimina los metadatos EXIF (incluido GPS).
export async function procesarImagen(file, sello) {
  const url = URL.createObjectURL(file);
  try {
    const img = await cargarImagen(url);
    const k = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    if (sello) {
      const fs = Math.max(14, Math.round(c.width / 45));
      g.font = `600 ${fs}px system-ui, sans-serif`;
      const w = g.measureText(sello).width;
      g.fillStyle = 'rgba(0,0,0,.6)';
      g.fillRect(c.width - w - fs * 1.2, c.height - fs * 1.9, w + fs * 1.2, fs * 1.9);
      g.fillStyle = '#fff';
      g.fillText(sello, c.width - w - fs * 0.6, c.height - fs * 0.6);
    }
    return await aBlob(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function guardarFoto(blob) {
  const id = 'f' + uid();
  await db.putFoto(id, blob);
  return id;
}

export async function urlFoto(id) {
  if (!cacheURL.has(id)) {
    const b = await db.getFoto(id);
    if (!b) return '';
    cacheURL.set(id, URL.createObjectURL(b));
  }
  return cacheURL.get(id);
}

export function limpiarCache() {
  for (const u of cacheURL.values()) URL.revokeObjectURL(u);
  cacheURL.clear();
}

export async function borrarFoto(f) {
  for (const id of [f.id, f.origId]) {
    if (!id) continue;
    await db.delFoto(id);
    if (cacheURL.has(id)) { URL.revokeObjectURL(cacheURL.get(id)); cacheURL.delete(id); }
  }
}

// Pide al usuario una o varias imágenes (cámara o galería).
export function elegirImagenes(camara) {
  return new Promise(res => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    if (camara) inp.capture = 'environment';
    else inp.multiple = true;
    inp.onchange = () => res([...inp.files]);
    inp.click();
  });
}

// ---------- Anotador ----------

const COLORES = ['#e11d1d', '#facc15', '#ffffff', '#111111'];
const HERRAMIENTAS = [
  ['flecha', '➚', 'Flecha'], ['circulo', '◯', 'Círculo'], ['rect', '▭', 'Rectángulo'],
  ['libre', '✎', 'Trazo libre'], ['texto', 'T', 'Texto'],
];

export function anotar(blob) {
  return new Promise(async res => {
    const url = URL.createObjectURL(blob);
    const img = await cargarImagen(url);
    const W = img.naturalWidth, H = img.naturalHeight;
    const lw = Math.max(4, Math.round(Math.max(W, H) / 220));
    let tool = 'flecha', color = COLORES[0];
    const formas = [];
    let actual = null;

    const el = document.createElement('div');
    el.className = 'anotador';
    el.innerHTML = `
      <div class="anot-bar">
        ${HERRAMIENTAS.map(([t, ic, n]) => `<button type="button" class="anot-t${t === tool ? ' on' : ''}" data-t="${t}" title="${n}" aria-label="${n}">${ic}</button>`).join('')}
        <span class="anot-sep"></span>
        ${COLORES.map(c => `<button type="button" class="anot-c${c === color ? ' on' : ''}" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}
      </div>
      <div class="anot-lienzo"><canvas></canvas></div>
      <div class="anot-bar">
        <button type="button" class="btn" data-a="deshacer">Deshacer</button>
        <span style="flex:1"></span>
        <button type="button" class="btn" data-a="cancelar">Cancelar</button>
        <button type="button" class="btn primary" data-a="guardar">Guardar</button>
      </div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');

    const flecha = (x1, y1, x2, y2) => {
      const a = Math.atan2(y2 - y1, x2 - x1), L = lw * 5;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - L * Math.cos(a - 0.45), y2 - L * Math.sin(a - 0.45));
      g.lineTo(x2 - L * Math.cos(a + 0.45), y2 - L * Math.sin(a + 0.45));
      g.closePath(); g.fill();
    };
    const pintar = (f) => {
      g.strokeStyle = g.fillStyle = f.color;
      g.lineWidth = lw; g.lineCap = g.lineJoin = 'round';
      const [x1, y1] = f.p[0], [x2, y2] = f.p[f.p.length - 1];
      if (f.tipo === 'flecha') flecha(x1, y1, x2, y2);
      else if (f.tipo === 'rect') g.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      else if (f.tipo === 'circulo') {
        g.beginPath();
        g.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2 || 1, Math.abs(y2 - y1) / 2 || 1, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (f.tipo === 'libre') {
        g.beginPath(); g.moveTo(x1, y1); for (const [x, y] of f.p) g.lineTo(x, y); g.stroke();
      } else if (f.tipo === 'texto') {
        const fs = lw * 7;
        g.font = `700 ${fs}px system-ui, sans-serif`;
        g.lineWidth = lw * 0.8;
        g.strokeStyle = f.color === '#111111' ? '#fff' : '#000';
        g.strokeText(f.texto, x1, y1); g.fillText(f.texto, x1, y1);
      }
    };
    const redibujar = () => {
      g.drawImage(img, 0, 0);
      formas.forEach(pintar);
      if (actual) pintar(actual);
    };
    redibujar();

    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    };
    cv.addEventListener('pointerdown', async e => {
      e.preventDefault();
      const p = pos(e);
      if (tool === 'texto') {
        const t = await modal({
          title: 'Texto', body: '<input class="input" name="t" autofocus>',
          buttons: [{ label: 'Cancelar', value: null }, { label: 'Añadir', cls: 'primary', value: w => w.querySelector('input').value.trim() }],
          onOpen: w => setTimeout(() => w.querySelector('input').focus(), 50),
        });
        if (t) { formas.push({ tipo: 'texto', color, p: [p], texto: t }); redibujar(); }
        return;
      }
      cv.setPointerCapture(e.pointerId);
      actual = { tipo: tool, color, p: [p, p] };
    });
    cv.addEventListener('pointermove', e => {
      if (!actual) return;
      const p = pos(e);
      if (actual.tipo === 'libre') actual.p.push(p); else actual.p[1] = p;
      redibujar();
    });
    const fin = () => { if (actual) { formas.push(actual); actual = null; redibujar(); } };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);

    const cerrar = (v) => { el.remove(); URL.revokeObjectURL(url); res(v); };
    el.addEventListener('click', async e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.t) {
        tool = b.dataset.t;
        el.querySelectorAll('.anot-t').forEach(x => x.classList.toggle('on', x === b));
      } else if (b.dataset.c) {
        color = b.dataset.c;
        el.querySelectorAll('.anot-c').forEach(x => x.classList.toggle('on', x === b));
      } else if (b.dataset.a === 'deshacer') { formas.pop(); redibujar(); }
      else if (b.dataset.a === 'cancelar') cerrar(null);
      else if (b.dataset.a === 'guardar') cerrar(formas.length ? await aBlob(cv, 0.85) : null);
    });
  });
}

// ---------- Visor de una foto de un ítem ----------
// Devuelve 'cambio' si se modificó algo (pie, anotación, borrado).
export async function verFoto(foto) {
  const src = await urlFoto(foto.id);
  const conPie = (accion) => (w) => ({ accion, pie: w.querySelector('[name=pie]').value.trim() });
  const res = await modal({
    body: `<img class="visor-img" src="${src}" alt="">
      <label class="lbl">Pie de foto</label>
      <input class="input" name="pie" value="${esc(foto.pie || '')}" placeholder="Descripción breve (aparece en el informe)">`,
    buttons: [
      { label: 'Eliminar', cls: 'danger', value: 'borrar' },
      ...(foto.origId ? [{ label: 'Quitar marcas', value: conPie('original') }] : []),
      { label: 'Marcar', value: conPie('anotar') },
      { label: 'Hecho', cls: 'primary', value: conPie('hecho') },
    ],
  });
  if (!res) return null;
  if (res === 'borrar') return 'borrar';
  const pieCambiado = res.pie !== (foto.pie || '');
  foto.pie = res.pie;
  const accion = res.accion;
  if (accion === 'hecho') return pieCambiado ? 'cambio' : null;
  if (accion === 'original') {
    await db.delFoto(foto.id);
    foto.id = foto.origId;
    delete foto.origId;
    return 'cambio';
  }
  if (accion === 'anotar') {
    const nueva = await anotar(await db.getFoto(foto.id));
    if (!nueva) return pieCambiado ? 'cambio' : null;
    const id = await guardarFoto(nueva);
    if (foto.origId) await db.delFoto(foto.id); // solo guardamos original + última anotada
    else foto.origId = foto.id;
    foto.id = id;
    return 'cambio';
  }
  return pieCambiado ? 'cambio' : null;
}
