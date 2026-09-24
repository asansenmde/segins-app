// Editor del cuestionario (áreas, ítems, prioridades y pesos). Afecta solo a evaluaciones nuevas.
import { S, guardar, guardarLuego } from '../state.js';
import { esc, uid, confirmar, toast } from '../ui.js';
import { PLANTILLA_BASE } from '../plantilla.js';

export function cuestionario(main) {
  const cfg = S.config;

  const pintar = () => {
    const sumaPesos = cfg.areas.reduce((s, a) => s + (Number(a.peso) || 0), 0);
    const nItems = cfg.areas.reduce((s, a) => s + a.items.length, 0);
    main.innerHTML = `
      <p class="muted small">${nItems} ítems en ${cfg.areas.length} áreas. Los cambios se aplican a las evaluaciones <strong>nuevas</strong>; las ya creadas conservan su cuestionario.</p>
      <p class="small">Suma de pesos de las áreas: <strong>${sumaPesos}</strong>${sumaPesos !== 100 ? ' <span class="muted">(se normaliza automáticamente)</span>' : ''}</p>
      ${cfg.areas.map((a, ai) => `
        <details class="card area-ed" data-a="${ai}">
          <summary><strong>${esc(a.id)}. ${esc(a.nombre)}</strong> <span class="muted small">peso ${esc(a.peso)} · ${a.items.length} ítems</span></summary>
          <div class="grid2">
            <label class="lbl">Nombre<input class="input" data-k="nombre" value="${esc(a.nombre)}"></label>
            <label class="lbl">Peso del área<input class="input" type="number" min="0" data-k="peso" value="${esc(a.peso)}"></label>
          </div>
          ${a.items.map((it, ii) => `
            <div class="item-ed" data-i="${ii}">
              <div class="row gap">
                <input class="input cod" data-ik="codigo" value="${esc(it.codigo)}" aria-label="Código">
                <select class="input" data-ik="prioridad" aria-label="Prioridad"><option ${it.prioridad === 'P1' ? 'selected' : ''}>P1</option><option ${it.prioridad === 'P2' ? 'selected' : ''}>P2</option></select>
                <input class="input peso" type="number" min="0" data-ik="peso" value="${esc(it.peso)}" aria-label="Peso">
                <button type="button" class="icon-btn" data-del="${ii}" aria-label="Eliminar ítem">✕</button>
              </div>
              <textarea class="input" data-ik="texto" rows="2" aria-label="Cuestión">${esc(it.texto)}</textarea>
            </div>`).join('')}
          <div class="row gap">
            <button type="button" class="btn grow" data-add="1">＋ Añadir ítem</button>
            ${a.items.length === 0 ? '<button type="button" class="btn danger" data-delarea="1">Eliminar área</button>' : ''}
          </div>
        </details>`).join('')}
      <button class="btn block" id="addarea">＋ Añadir área</button>
      <div class="danger-zone"><button class="btn" id="restaurar">Restaurar cuestionario base (44 ítems)</button></div>`;
  };
  pintar();

  const abiertos = () => [...main.querySelectorAll('details[open]')].map(d => d.dataset.a);
  const repintar = (abrir = abiertos()) => {
    pintar();
    for (const a of abrir) main.querySelector(`details[data-a="${a}"]`)?.setAttribute('open', '');
  };

  main.addEventListener('input', e => {
    const el = e.target;
    const det = el.closest('[data-a]');
    if (!det) return;
    const a = cfg.areas[+det.dataset.a];
    if (el.dataset.k) a[el.dataset.k] = el.dataset.k === 'peso' ? Number(el.value) || 0 : el.value;
    if (el.dataset.ik) {
      const it = a.items[+el.closest('[data-i]').dataset.i];
      it[el.dataset.ik] = el.dataset.ik === 'peso' ? Number(el.value) || 0 : el.value;
    }
    guardarLuego('config', cfg);
  });

  main.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const det = b.closest('[data-a]');
    const a = det ? cfg.areas[+det.dataset.a] : null;
    if (b.dataset.add) {
      let n = a.items.length + 1, cod;
      do cod = `${a.id}${String(n++).padStart(2, '0')}`; while (a.items.some(i => i.codigo === cod));
      a.items.push({ id: 'x' + uid(), codigo: cod, prioridad: 'P2', peso: 3, texto: '', base: false });
    } else if (b.dataset.del != null) {
      if (!(await confirmar('¿Eliminar este ítem del cuestionario?', 'Eliminar', 'danger'))) return;
      a.items.splice(+b.dataset.del, 1);
    } else if (b.dataset.delarea) {
      cfg.areas.splice(+det.dataset.a, 1);
    } else if (b.id === 'addarea') {
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const id = [...letras].find(l => !cfg.areas.some(x => x.id === l)) || 'Z' + cfg.areas.length;
      cfg.areas.push({ id, nombre: 'Nueva área', peso: 0, items: [] });
      await guardar('config', cfg);
      repintar([...abiertos(), String(cfg.areas.length - 1)]);
      return;
    } else if (b.id === 'restaurar') {
      if (!(await confirmar('Se sustituirá el cuestionario por el base de 44 ítems. Perderás los ítems y áreas que hayas añadido.', 'Restaurar', 'danger'))) return;
      cfg.areas = structuredClone(PLANTILLA_BASE);
      toast('Cuestionario restaurado');
    } else return;
    await guardar('config', cfg);
    repintar();
  });

  return { titulo: 'Cuestionario', atras: true, seccion: 'mas' };
}
