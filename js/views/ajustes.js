// Menú "Más" y ajustes: umbrales, informe, seguridad y copias de seguridad.
import * as db from '../db.js';
import { S, guardarLuego, cargar, volcarPendientes } from '../state.js';
import { esc, hoyISO, modal, confirmar, toast, descargar } from '../ui.js';
import { limpiarCache } from '../fotos.js';

export function mas(main) {
  main.innerHTML = `
    <div class="card list">
      <a class="ag-row" href="#/cuestionario"><span class="ag-ic">☰</span><div class="ag-txt"><strong>Cuestionario</strong><div class="muted small">Áreas, ítems, prioridades y pesos</div></div></a>
      <a class="ag-row" href="#/ajustes"><span class="ag-ic">⚙</span><div class="ag-txt"><strong>Ajustes</strong><div class="muted small">Umbrales, informe, PIN y copias de seguridad</div></div></a>
    </div>
    <div class="card small">
      <h3>Instalar en el móvil</h3>
      <p><strong>Android (Chrome):</strong> menú ⋮ → <em>Instalar aplicación</em> o <em>Añadir a pantalla de inicio</em>.</p>
      <p><strong>iPhone (Safari):</strong> botón Compartir → <em>Añadir a pantalla de inicio</em>.</p>
      <p class="muted">Una vez instalada funciona sin conexión. Los datos se guardan cifrados solo en este dispositivo.</p>
    </div>`;
  return { titulo: 'Más' };
}

export async function ajustes(main) {
  const c = S.config;
  let uso = '';
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) uso = `${(est.usage / 1048576).toFixed(1)} MB usados de ${(est.quota / 1048576 / 1024).toFixed(1)} GB disponibles`;
  } catch { /* sin datos de uso */ }

  main.innerHTML = `
    <form class="form card" id="f" onsubmit="return false">
      <h3>Niveles</h3>
      <div class="grid2">
        <label class="lbl">Satisfactorio desde<input class="input" type="number" min="0" max="100" name="umbralSat" value="${c.umbralSat}"></label>
        <label class="lbl">Mejorable desde<input class="input" type="number" min="0" max="100" name="umbralMej" value="${c.umbralMej}"></label>
      </div>
      <p class="muted small">Por debajo de "Mejorable" es Deficiente. Se aplica a las evaluaciones nuevas.</p>
      <h3>Informe</h3>
      <label class="lbl">Encabezado (organismo)</label><input class="input" name="cabeceraOrganismo" value="${esc(c.cabeceraOrganismo)}">
      <label class="lbl">Marca de clasificación (encabezado y pie)</label><input class="input" name="marcaClasificacion" value="${esc(c.marcaClasificacion)}" placeholder="Vacío = sin marca">
      <div class="grid2">
        <label class="lbl">Empleo del evaluador<input class="input" name="evaluadorEmpleo" value="${esc(c.evaluadorEmpleo)}"></label>
        <label class="lbl">Nombre del evaluador<input class="input" name="evaluadorNombre" value="${esc(c.evaluadorNombre)}"></label>
      </div>
      <h3>Fotos</h3>
      <label class="check"><input type="checkbox" name="sellarFotos" ${c.sellarFotos ? 'checked' : ''}> Sellar las fotos con código del ítem, fecha y hora</label>
      <p class="muted small">Las fotos se guardan sin ubicación GPS ni otros metadatos.</p>
    </form>

    <div class="card">
      <h3>Seguridad</h3>
      <label class="lbl" for="bloqueoMin">Pedir el PIN otra vez tras</label>
      <select class="input" id="bloqueoMin">
        <option value="5" ${(c.bloqueoMin ?? 30) === 5 ? 'selected' : ''}>5 minutos</option>
        <option value="15" ${(c.bloqueoMin ?? 30) === 15 ? 'selected' : ''}>15 minutos</option>
        <option value="30" ${(c.bloqueoMin ?? 30) === 30 ? 'selected' : ''}>30 minutos</option>
        <option value="60" ${(c.bloqueoMin ?? 30) === 60 ? 'selected' : ''}>1 hora</option>
        <option value="240" ${(c.bloqueoMin ?? 30) === 240 ? 'selected' : ''}>4 horas</option>
        <option value="0" ${(c.bloqueoMin ?? 30) === 0 ? 'selected' : ''}>Solo al cerrar la app</option>
      </select>
      <p class="muted small">Sin usarla o con la app en segundo plano. Al cerrarla del todo siempre pedirá el PIN: sin él los datos no se pueden descifrar.</p>
      <button class="btn block" id="pin">Cambiar PIN</button>
    </div>

    <div class="card">
      <h3>Copia de seguridad</h3>
      <p class="muted small">El archivo sale cifrado con tu PIN actual. Guárdalo en un medio autorizado. ${esc(uso)}</p>
      <button class="btn block" id="exp">Exportar copia</button>
      <button class="btn block" id="imp">Restaurar copia…</button>
    </div>

    <div class="danger-zone"><button class="btn danger" id="wipe">Borrar todos los datos del dispositivo</button></div>`;

  main.querySelector('#f').addEventListener('input', e => {
    const el = e.target;
    c[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
    guardarLuego('config', c);
  });

  main.querySelector('#bloqueoMin').onchange = e => {
    c.bloqueoMin = Number(e.target.value);
    guardarLuego('config', c);
    toast('Guardado');
  };

  main.querySelector('#pin').onclick = async () => {
    const v = await modal({
      title: 'Cambiar PIN',
      body: `<input class="input pin" name="a" type="password" inputmode="numeric" placeholder="PIN actual">
        <input class="input pin" name="b" type="password" inputmode="numeric" placeholder="PIN nuevo (6-12 cifras)">
        <input class="input pin" name="c" type="password" inputmode="numeric" placeholder="Repite el PIN nuevo">`,
      buttons: [{ label: 'Cancelar', value: null }, {
        label: 'Cambiar', cls: 'primary', value: w => {
          const [a, b, cc] = ['a', 'b', 'c'].map(n => w.querySelector(`[name=${n}]`).value);
          if (!/^\d{6,12}$/.test(b)) { toast('El PIN nuevo debe tener entre 6 y 12 cifras'); return false; }
          if (b !== cc) { toast('Los PIN nuevos no coinciden'); return false; }
          return { a, b };
        },
      }],
    });
    if (!v) return;
    await volcarPendientes();
    toast('Recifrando datos…', 10000);
    toast(await db.changePin(v.a, v.b) ? 'PIN cambiado' : 'El PIN actual no es correcto');
  };

  main.querySelector('#exp').onclick = async () => {
    await volcarPendientes();
    await descargar(await db.exportBackup(), `segins_copia_${hoyISO()}.json`);
  };

  main.querySelector('#imp').onclick = async () => {
    const file = await new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file';
      i.accept = '.segins,application/octet-stream,application/json';
      i.onchange = () => res(i.files[0]);
      i.click();
    });
    if (!file) return;
    const pin = await modal({
      title: 'Restaurar copia',
      body: `<p>Se <strong>sustituirán todos los datos</strong> de este dispositivo por los de la copia.</p>
        <input class="input pin" name="p" type="password" inputmode="numeric" placeholder="PIN con el que se hizo la copia">`,
      buttons: [{ label: 'Cancelar', value: null }, { label: 'Restaurar', cls: 'danger', value: w => w.querySelector('[name=p]').value }],
    });
    if (!pin) return;
    try {
      await db.importBackup(file, pin);
      limpiarCache();
      await cargar();
      toast('Copia restaurada. Tu PIN pasa a ser el de la copia.', 4000);
      location.hash = '#/';
    } catch (err) {
      toast(err.message, 4000);
    }
  };

  main.querySelector('#wipe').onclick = async () => {
    if (!(await confirmar('Se borrarán TODAS las evaluaciones, fotos, instalaciones y agenda de este dispositivo. No se puede deshacer.', 'Borrar todo', 'danger'))) return;
    if (!(await confirmar('¿Seguro? Esta es la última confirmación.', 'Sí, borrar todo', 'danger'))) return;
    await db.wipe();
    location.reload();
  };

  return { titulo: 'Ajustes', atras: true, seccion: 'mas' };
}
