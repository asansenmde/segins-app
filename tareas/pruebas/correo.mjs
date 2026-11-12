// Prueba de «tareas desde correos» y del aspecto nuevo de Tareas NLT (versión 16).
// node tareas/pruebas/correo.mjs   (sirve la carpeta con un servidor local; datos ficticios)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const RAIZ = path.resolve(new URL('..', import.meta.url).pathname);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const URL_ = `http://localhost:${srv.address().port}/index.html`;
let ok = true; const comprueba = (txt, c, extra) => { console.log((c ? '✔ ' : '✘ ') + txt + (extra !== undefined ? ': ' + extra : '')); if (!c) ok = false; };

// Archivo compuesto de Microsoft (CFB) mínimo con propiedades MAPI, como un .msg de Outlook
function crearMsg(props, adjunto) {
  const SS = 512, MS = 64, FIN = 0xFFFFFFFE, LIBRE = 0xFFFFFFFF;
  const u16 = s => Buffer.from(s + '\0', 'utf16le').subarray(0, -2);
  const ents = [{ nombre: 'Root Entry', tipo: 5, hijos: [] }];
  const flujo = (nombre, datos, padre = 0) => { ents.push({ nombre, tipo: 2, datos }); ents[padre].hijos.push(ents.length - 1); };
  for (const [k, v] of Object.entries(props)) flujo('__substg1.0_' + k, typeof v === 'string' ? u16(v) : v);
  const pv = Buffer.alloc(32 + 16); pv.writeUInt32LE(0x0E060040, 32); const ft = BigInt(Date.UTC(2026, 9, 20, 9, 30)) * 10000n + 116444736000000000n;
  pv.writeUInt32LE(Number(ft & 0xFFFFFFFFn), 40); pv.writeUInt32LE(Number(ft >> 32n), 44); flujo('__properties_version1.0', pv);
  if (adjunto) { ents.push({ nombre: '__attach_version1.0_#00000000', tipo: 1, hijos: [] }); const a = ents.length - 1; ents[0].hijos.push(a); flujo('__substg1.0_3707001F', u16(adjunto), a); flujo('__substg1.0_37010102', Buffer.alloc(5000, 7), a); }
  // Árbol de hermanos: cadena por la derecha (válido para el lector)
  for (const e of ents) if (e.hijos) { e.hijo = e.hijos.length ? e.hijos[0] : LIBRE; e.hijos.forEach((h, i) => { ents[h].der = i + 1 < e.hijos.length ? e.hijos[i + 1] : LIBRE; }); }
  // Flujos pequeños en el miniflujo; grandes en sectores normales
  let mini = Buffer.alloc(0); const miniFat = []; const grandes = [];
  for (const e of ents) if (e.tipo === 2) {
    if (e.datos.length < 4096) { const n = Math.ceil(e.datos.length / MS) || 1, ini = mini.length / MS; e.ini = ini; for (let i = 0; i < n; i++) miniFat.push(i + 1 < n ? ini + i + 1 : FIN); mini = Buffer.concat([mini, e.datos, Buffer.alloc(n * MS - e.datos.length)]); }
    else grandes.push(e);
  }
  const sectores = []; const fat = [];
  const poner = buf => { const n = Math.ceil(buf.length / SS) || 1, ini = sectores.length; for (let i = 0; i < n; i++) { sectores.push(Buffer.concat([buf.subarray(i * SS, (i + 1) * SS), Buffer.alloc(SS)]).subarray(0, SS)); fat.push(i + 1 < n ? ini + i + 1 : FIN); } return ini; };
  ents[0].ini = poner(mini); ents[0].datos = mini;
  for (const e of grandes) e.ini = poner(e.datos);
  const mf = Buffer.alloc(Math.ceil(miniFat.length * 4 / SS) * SS, 0xFF); miniFat.forEach((v, i) => mf.writeUInt32LE(v, i * 4)); const iniMiniFat = poner(mf);
  const dir = Buffer.alloc(Math.ceil(ents.length / 4) * 4 * 128);
  ents.forEach((e, i) => { const o = i * 128, nb = Buffer.from(e.nombre + '\0', 'utf16le'); nb.copy(dir, o); dir.writeUInt16LE(nb.length, o + 64); dir[o + 66] = e.tipo; dir[o + 67] = 1;
    dir.writeUInt32LE(LIBRE, o + 68); dir.writeUInt32LE(e.der ?? LIBRE, o + 72); dir.writeUInt32LE(e.hijo ?? LIBRE, o + 76); dir.writeUInt32LE(e.ini ?? 0, o + 116); dir.writeUInt32LE(e.datos ? e.datos.length : 0, o + 120); });
  for (let i = ents.length; i < dir.length / 128; i++) { dir.writeUInt32LE(LIBRE, i * 128 + 68); dir.writeUInt32LE(LIBRE, i * 128 + 72); dir.writeUInt32LE(LIBRE, i * 128 + 76); }
  const iniDir = poner(dir);
  const nFat = Math.ceil((fat.length + 2) / (SS / 4)), iniFat = sectores.length;
  for (let i = 0; i < nFat; i++) { sectores.push(Buffer.alloc(SS)); fat.push(0xFFFFFFFD); }
  const fatBuf = Buffer.alloc(nFat * SS, 0xFF); fat.forEach((v, i) => fatBuf.writeUInt32LE(v, i * 4)); for (let i = 0; i < nFat; i++) fatBuf.copy(sectores[iniFat + i], 0, i * SS, (i + 1) * SS);
  const cab = Buffer.alloc(SS, 0); Buffer.from('D0CF11E0A1B11AE1', 'hex').copy(cab); cab.writeUInt16LE(0x3E, 24); cab.writeUInt16LE(3, 26); cab.writeUInt16LE(0xFFFE, 28); cab.writeUInt16LE(9, 30); cab.writeUInt16LE(6, 32);
  cab.writeUInt32LE(nFat, 44); cab.writeUInt32LE(iniDir, 48); cab.writeUInt32LE(4096, 56); cab.writeUInt32LE(iniMiniFat, 60); cab.writeUInt32LE(mf.length / SS, 64); cab.writeUInt32LE(FIN, 68); cab.writeUInt32LE(0, 72);
  for (let i = 0; i < 109; i++) cab.writeUInt32LE(i < nFat ? iniFat + i : LIBRE, 76 + i * 4);
  return Buffer.concat([cab, ...sectores]);
}

const msg = crearMsg({ '0037001F': 'RE: Revista de extintores · Nave 3 antes del viernes', '0C1A001F': 'Ruiz Gómez, Ana', '5D01001F': 'aruiz@et.mde.es', '0E04001F': 'Usuario de prueba',
  '1000001F': 'Buenos días:\r\nHay que revisar los extintores.\r\n' + 'Párrafo largo del correo. '.repeat(300), '1035001F': '<abc123@et.mde.es>' }, 'acta revisión.pdf');
const eml = ['From: =?utf-8?Q?Jos=C3=A9_P=C3=A9rez?= <jperez@et.mde.es>', 'To: usuario@et.mde.es', 'Subject: =?utf-8?B?' + Buffer.from('Petición de informe ñandú').toString('base64') + '?=',
  'Date: Tue, 20 Oct 2026 10:15:00 +0200', 'Message-ID: <eml-777@et.mde.es>', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="XYZ"', '', '--XYZ',
  'Content-Type: text/plain; charset=iso-8859-1', 'Content-Transfer-Encoding: quoted-printable', '', 'Env=EDa el informe.', '', 'Gracias. <script>alert(1)</script>', '--XYZ',
  'Content-Type: application/pdf; name="anexo.pdf"', 'Content-Disposition: attachment; filename="anexo.pdf"', 'Content-Transfer-Encoding: base64', '', 'JVBERi0=', '--XYZ--', ''].join('\r\n');
const dir = fs.mkdtempSync('/tmp/nlt-correo-');
const rutaMsg = path.join(dir, 'correo.msg'), malo = path.join(dir, 'malo.eml'); fs.writeFileSync(rutaMsg, msg); fs.writeFileSync(malo, 'esto no es un correo');

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 1000 }, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(URL_); await p.waitForTimeout(1200);
await p.click('[data-accion=ejemplos]'); await p.waitForTimeout(600);
// Aspecto como META
comprueba('cabecera con escudo y botón «Desde correo»', !!(await p.$('.top .escudo')) && /Desde correo/.test(await p.textContent('#btnCorreo')));
comprueba('bienvenida', /Tareas NLT · Gestor personal/.test(await p.textContent('.hero')) && /Arrastra aquí un correo/.test(await p.textContent('.hero')));
const kpis = await p.$$eval('.kpi', n => n.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
comprueba('5 recuadros con icono', kpis.length === 5 && kpis.every(k => /^\S+ \d+ /.test(k)), kpis.join(' | '));
const pasos = await p.$$eval('.paso', n => n.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
comprueba('recorrido por estados', pasos.length === 4, pasos.join(' | '));
const nCurso = Number((pasos[1].match(/\d+/) || [])[0]);
await p.click('.paso.p-curso'); await p.waitForTimeout(200);
const vistas = await p.$$eval('main > .tarea', n => n.length);
comprueba('pulsar «En curso» filtra', vistas === nCurso && await p.$('.paso.p-curso.on') !== null, vistas + ' de ' + nCurso);
await p.click('.paso.p-curso'); await p.waitForTimeout(200);
await p.click('.kpi[data-kpi=hechas]'); await p.waitForTimeout(200);
comprueba('«Hechas este mes» lista las hechas', /Hechas este mes|No hay tareas hechas/.test(await p.textContent('main')));
await p.click('.kpi[data-kpi=hechas]'); await p.waitForTimeout(200);
if (process.env.CAPTURA) await p.screenshot({ path: process.env.CAPTURA });

// .msg con el botón
await p.setInputFiles('#ficheroCorreo', rutaMsg); await p.waitForTimeout(700);
comprueba('se abre la ficha de tarea nueva', await p.evaluate(() => document.querySelector('#dlg').open) && /Nueva tarea/.test(await p.textContent('#dlg h2')));
const v = n => p.inputValue(`#fed [name=${n}]`);
comprueba('título sin «RE:» y sin el plazo', (await v('titulo')) === 'Revista de extintores · Nave 3', await v('titulo'));
comprueba('NLT sacada del asunto («antes del viernes»)', /^\d{4}-\d{2}-\d{2}$/.test(await v('nlt')), await v('nlt'));
comprueba('ordenada por el remitente', (await v('ordenadaPor')) === 'Ruiz Gómez, Ana', await v('ordenadaPor'));
comprueba('fecha de la orden la del correo', (await v('fechaOrden')) === '2026-10-20', await v('fechaOrden'));
comprueba('descripción con el texto del correo', /Hay que revisar los extintores/.test(await v('descripcion')));
await p.click('#dlg [data-cerrar]'); await p.waitForTimeout(300);
comprueba('cerrar sin guardar pregunta antes de descartarla', /Cerrar sin guardar/.test(await p.textContent('#dlg2')));
await p.click('#dlg2 [data-r=no]'); await p.waitForTimeout(300);
await p.click('#dlg [data-guardar]'); await p.waitForTimeout(500);
const t1 = await p.evaluate(() => JSON.parse(localStorage.getItem('tareas-nlt-v1')).tareas.find(t => /Nave 3/.test(t.titulo)));
comprueba('guardada con el origen en observaciones', !!t1 && /De: Ruiz Gómez, Ana <aruiz@et.mde.es>/.test(t1.notas) && /Adjuntos: acta revisión.pdf/.test(t1.notas) && /Id. correo: abc123@et.mde.es/.test(t1.notas), t1 && t1.notas.replace(/\n/g, ' | '));

// Mismo correo otra vez: avisa
await p.setInputFiles('#ficheroCorreo', rutaMsg); await p.waitForTimeout(600);
comprueba('el mismo correo otra vez avisa', /ya tiene una tarea/.test(await p.textContent('#dlg2')));
await p.click('#dlg2 [data-r=no]'); await p.waitForTimeout(400);
comprueba('y abre la que ya existe', /T-\d{4}-\d{3}/.test(await p.textContent('#dlg h2')));
await p.click('#dlg [data-cerrar]'); await p.waitForTimeout(300);

// .eml arrastrado
const b64 = Buffer.from(eml).toString('base64');
await p.evaluate(async b64 => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'correo.eml', { type: 'message/rfc822' }));
  document.querySelector('main').dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
  window.__soltando = document.body.classList.contains('soltando');
  document.querySelector('main').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, b64); await p.waitForTimeout(700);
comprueba('al arrastrar se ve «Suelta el correo»', await p.evaluate(() => window.__soltando));
comprueba('.eml: título decodificado', (await v('titulo')) === 'Petición de informe ñandú', await v('titulo'));
comprueba('.eml: remitente', (await v('ordenadaPor')) === 'José Pérez', await v('ordenadaPor'));
comprueba('.eml: texto (latin-1) y el <script> como texto', /Envía el informe/.test(await v('descripcion')) && !(await p.evaluate(() => window.__xss)));
await p.click('#dlg [data-cerrar]'); await p.waitForTimeout(300);
await p.click('#dlg2 [data-r=si]'); await p.waitForTimeout(300);
comprueba('descartada: no se guarda', !(await p.evaluate(() => JSON.parse(localStorage.getItem('tareas-nlt-v1')).tareas.some(t => /ñandú/.test(t.titulo)))));

// Arrastrar tarjetas del tablero no debe abrir nada
await p.goto(URL_ + '#tablero'); await p.waitForTimeout(500);
await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'x'); document.querySelector('main').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
await p.waitForTimeout(300);
comprueba('arrastrar algo que no es archivo no hace nada', !(await p.evaluate(() => document.querySelector('#dlg').open)));

// Archivo que no es un correo
await p.setInputFiles('#ficheroCorreo', malo); await p.waitForTimeout(500);
comprueba('archivo no válido: lo explica', /No se pudo leer el correo/.test(await p.textContent('#dlg2')));
await p.click('#dlg2 [data-r=si]');

// Móvil
await p.setViewportSize({ width: 390, height: 800 }); await p.goto(URL_); await p.waitForTimeout(600);
comprueba('en el móvil sin desbordar', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
if (process.env.CAPTURA) await p.screenshot({ path: process.env.CAPTURA.replace('.png', '-movil.png') });
comprueba('errores de página', errs.length === 0, JSON.stringify(errs));
await b.close(); srv.close(); fs.rmSync(dir, { recursive: true });
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS');
process.exit(ok ? 0 : 1);
