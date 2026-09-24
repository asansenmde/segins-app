// Utilidades de interfaz: escape HTML, fechas, avisos, diálogos.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function fmtFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function diasHasta(iso) {
  const a = new Date(hoyISO() + 'T00:00:00');
  const b = new Date(iso.slice(0, 10) + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function toast(msg, ms = 2500) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

// Diálogo modal. `body` es HTML; los botones devuelven su `value`.
export function modal({ title, body = '', buttons = [{ label: 'Cerrar', value: null }], onOpen }) {
  return new Promise(res => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      ${title ? `<h2>${esc(title)}</h2>` : ''}
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>
    </div>`;
    document.body.appendChild(wrap);
    const close = (v) => { wrap.remove(); res(v); };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b && b.parentElement.classList.contains('modal-actions')) {
        const btn = buttons[+b.dataset.i];
        const v = typeof btn.value === 'function' ? btn.value(wrap) : btn.value;
        if (v === false) return; // validación fallida: no cerrar
        close(v);
      } else if (e.target === wrap) close(null);
    });
    onOpen?.(wrap);
  });
}

export const confirmar = (msg, okLabel = 'Aceptar', cls = 'primary') =>
  modal({ body: `<p>${esc(msg)}</p>`, buttons: [{ label: 'Cancelar', value: null },{ label: okLabel, value: true, cls }] })
    .then(v => v === true);

// Lee los campos [name] de un contenedor como objeto.
export function leerForm(root) {
  const o = {};
  root.querySelectorAll('[name]').forEach(el => {
    o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  });
  return o;
}

export function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Comparte el archivo (correo, mensajería del móvil…) si el sistema lo permite; si no, lo descarga.
export async function compartirODescargar(blob, nombre) {
  const file = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nombre });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  descargar(blob, nombre);
}
