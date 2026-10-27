// Prueba de la importación en Tareas Colabora: mensaje de MENSADEF (#importar=…), correo .eml y .msg de Outlook,
// duplicados y actualización automática con novedades de otras personas. Datos simulados.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../tareas-nlt-colabora.html', import.meta.url), 'utf8');
const WEB = '/et/SUIGESUR/JSUIGE', O = 'https://colabora.mdef.es';
const PAGINA = O + WEB + '/Documentos%20compartidos/tareas-nlt-colabora.html';
const ESTADOS = ['REMITIDO AL NEGOCIADO', 'EN CURSO', 'FINALIZADO'];
const ahora = () => new Date().toISOString();
const items = [1, 2, 3].map(i => ({ Id: i, Title: 'Asunto ' + i, ESTADO: ESTADOS[i % 3], Prioridad: 'Media', FechaVencimiento: ahora(), DescripcionDelAsunto: 'Texto ' + i,
  ControlExpediente: '', Created: ahora(), Modified: '2026-01-01T00:00:00Z', ResponsableDeLaInformacion: { Id: 7, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' },
  PersonalImplicado0: [], Author: { Title: 'OTRA PERSONA' }, Editor: { Title: 'OTRA PERSONA' } }));

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
const largo = 'Párrafo largo del correo. '.repeat(300); // > 4096 bytes en UTF-16: va en sectores normales
const msg = crearMsg({ '0037001F': 'Revista de extintores · Nave 3', '0C1A001F': 'Ruiz Gómez, Ana', '5D01001F': 'aruiz@et.mde.es', '0E04001F': 'Usuario de prueba',
  '1000001F': 'Buenos días:\r\nHay que revisar los extintores antes del 30.\r\n' + largo, '1035001F': '<abc123@et.mde.es>' }, 'acta revisión.pdf');
const rutaMsg = new URL('correo-prueba.msg', import.meta.url).pathname; fs.writeFileSync(rutaMsg, msg);
const eml = ['From: =?utf-8?Q?Jos=C3=A9_P=C3=A9rez?= <jperez@et.mde.es>', 'To: usuario@et.mde.es', 'Subject: =?utf-8?B?' + Buffer.from('Petición de informe ñandú').toString('base64') + '?=',
  'Date: Tue, 20 Oct 2026 10:15:00 +0200', 'Message-ID: <eml-777@et.mde.es>', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="XYZ"', '', '--XYZ',
  'Content-Type: multipart/alternative; boundary="ALT"', '', '--ALT', 'Content-Type: text/plain; charset=iso-8859-1', 'Content-Transfer-Encoding: quoted-printable', '',
  'Env=EDa el informe antes del viernes.=', '', 'Gracias. <script>alert(1)</script>', '--ALT', 'Content-Type: text/html; charset=utf-8', '', '<p>HTML</p>', '--ALT--', '--XYZ',
  'Content-Type: application/pdf; name="anexo.pdf"', 'Content-Disposition: attachment; filename="anexo.pdf"', 'Content-Transfer-Encoding: base64', '', 'JVBERi0=', '--XYZ--', ''].join('\r\n');
const rutaEml = new URL('correo-prueba.eml', import.meta.url).pathname; fs.writeFileSync(rutaEml, eml);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
const altas = []; let lecturas = 0;
await p.route(O + '/**', async r => {
  const req = r.request(), u = decodeURIComponent(req.url());
  if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
  const [base, resto] = u.split('/_api/');
  if (base.replace(O, '') !== WEB) return r.fulfill({ status: 404, body: '' });
  if (req.method() === 'POST') {
    if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } } } });
    if (resto === 'SP.Utilities.Utility.SendEmail') return r.fulfill({ json: { d: {} } });
    if (resto.endsWith('/items')) {
      const c = JSON.parse(req.postData()); altas.push(c);
      items.push({ Id: items.length + 1, Title: c.Title, ESTADO: c.ESTADO, Prioridad: c.Prioridad || '', FechaVencimiento: c.FechaVencimiento, DescripcionDelAsunto: c.DescripcionDelAsunto, ControlExpediente: c.ControlExpediente,
        Created: ahora(), Modified: ahora(), ResponsableDeLaInformacion: { Id: 7, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, PersonalImplicado0: [], Author: { Title: 'USUARIO DE PRUEBA' }, Editor: { Title: 'USUARIO DE PRUEBA' } });
      return r.fulfill({ status: 201, json: { d: { Id: items.length } } });
    }
    return r.fulfill({ status: 400, body: '' });
  }
  if (resto.startsWith('web?')) return r.fulfill({ json: { Url: O + WEB, Title: 'JSUIGE' } });
  if (resto.startsWith('web/currentuser')) return r.fulfill({ json: { Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' } });
  if (resto.startsWith('web/siteusers')) return r.fulfill({ json: { value: [{ Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' }] } });
  if (resto.includes('getbyinternalnameortitle')) return r.fulfill({ json: { AppendOnly: false, RichText: false } });
  if (resto.includes('/fields')) return r.fulfill({ json: { value: [{ InternalName: 'ESTADO', Choices: ESTADOS }, { InternalName: 'DescripcionDelAsunto', RichText: false }] } });
  if (resto.includes('/items')) { lecturas++; return r.fulfill({ json: { value: items } }); }
  if (resto.startsWith("web/lists/getbytitle('Gestor de Tareas')?")) return r.fulfill({ json: { Title: 'Gestor de Tareas', ItemCount: items.length, ListItemEntityTypeFullName: 'SP.Data.GestorListItem', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Gestor' } } });
  return r.fulfill({ status: 404, body: '' });
});

// 1. Desde MENSADEF
const datos = { v: 1, origen: 'MENSADEF', id: 'MSG-2026-0042', asunto: 'Inspección de seguridad 3 de noviembre', fecha: '2026-10-20T08:00:00Z', de: 'Jefe A', tipo: 'Orden',
  referencia: 'REF-77', suReferencia: 'SU-1', expediente: 'EXP-2026/55', enlace: 'https://mensadef.mdef.es/ambito/2SUIGE/Lists/X/DispForm.aspx?ID=4', texto: 'Cuerpo <b>con</b> marcas & símbolos' };
const conDatos = PAGINA + '#importar=' + encodeURIComponent(JSON.stringify(datos));
await p.goto(conDatos); await p.waitForTimeout(1200);
console.log('dirección limpia:', !p.url().includes('#'), '| título:', await p.textContent('#dlg h2'));
console.log('asunto:', await p.inputValue('#fNuevo [name=Title]'), '| NLT:', await p.inputValue('#fNuevo [name=nlt]'), '| exp.:', await p.inputValue('#fNuevo [name=ControlExpediente]'));
console.log('descripción:\n' + await p.inputValue('#fNuevo [name=DescripcionDelAsunto]'));
await p.click('#nCrear'); await p.waitForTimeout(1200);
console.log('alta MENSADEF:', JSON.stringify({ Title: altas[0].Title, Exp: altas[0].ControlExpediente, NLT: altas[0].FechaVencimiento, Estado: altas[0].ESTADO }));
await p.goto(conDatos); await p.waitForTimeout(1200);
console.log('segunda vez:', await p.textContent('#dlg h2'), '|', (await p.textContent('#dlg .db')).replace(/\s+/g, ' ').slice(0, 140));
await p.click('#impOtro'); console.log('crear otro igualmente abre:', await p.textContent('#dlg h2')); await p.click('#dlg [data-cerrar]');
// datos manipulados en la dirección: no rompe nada ni ejecuta código
await p.goto(PAGINA + '#importar=' + encodeURIComponent(JSON.stringify({ asunto: '<img src=x onerror=alert(1)>', texto: '<script>alert(2)</script>' }))); await p.waitForTimeout(1000);
console.log('manipulado: asunto como texto:', await p.inputValue('#fNuevo [name=Title]'), '| img inyectada?', await p.$('#dlg img') !== null); await p.click('#dlg [data-cerrar]');
await p.goto(PAGINA + '#importar=%E0%A4%A'); await p.waitForTimeout(800); console.log('basura en la dirección: diálogo abierto?', await p.evaluate(() => document.querySelector('#dlg').open));

// 2. Correo .msg (Outlook de escritorio) con el botón
await p.setInputFiles('#ficheroCorreo', rutaMsg); await p.waitForTimeout(600);
console.log('msg título:', await p.textContent('#dlg h2'), '| asunto:', await p.inputValue('#fNuevo [name=Title]'));
const dm = await p.inputValue('#fNuevo [name=DescripcionDelAsunto]'); console.log('msg descripción:', dm.split('\n').slice(0, 10).join(' | ').slice(0, 400), '| largo:', dm.length);
await p.click('#nCrear'); await p.waitForTimeout(1200);
await p.setInputFiles('#ficheroCorreo', rutaMsg); await p.waitForTimeout(600); console.log('msg repetido:', await p.textContent('#dlg h2')); await p.click('#dlg [data-cerrar]');

// 3. Correo .eml arrastrado a la página
const contenido = fs.readFileSync(rutaEml).toString('base64');
await p.evaluate(async b64 => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'correo.eml', { type: 'message/rfc822' }));
  document.querySelector('main').dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
  document.querySelector('main').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, contenido); await p.waitForTimeout(600);
console.log('eml asunto:', await p.inputValue('#fNuevo [name=Title]'), '| NLT:', await p.inputValue('#fNuevo [name=nlt]'));
console.log('eml descripción:', (await p.inputValue('#fNuevo [name=DescripcionDelAsunto]')).replace(/\n/g, ' | '));
await p.click('#dlg [data-cerrar]');
const malo = new URL('malo.eml', import.meta.url).pathname; fs.writeFileSync(malo, 'esto no es un correo');
await p.setInputFiles('#ficheroCorreo', malo); await p.waitForTimeout(500); console.log('archivo no válido:', await p.textContent('#dlg .error')); await p.click('#dlg [data-cerrar]');
fs.unlinkSync(malo);

// 4. Actualización automática: otra persona cambia un asunto y crea otro
await p.goto(PAGINA); await p.waitForTimeout(1000);
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('tareas-nlt-colabora')); s.quien = 'todos'; localStorage.setItem('tareas-nlt-colabora', JSON.stringify(s)); });
await p.clock.install(); await p.goto(PAGINA); await p.waitForTimeout(1000);
items[0].Modified = ahora(); items[0].Editor = { Title: 'OTRA PERSONA' };
items.push(Object.assign({}, items[1], { Id: 99, Title: 'Asunto creado por otro', Modified: ahora(), Created: ahora() }));
const antes = lecturas; await p.clock.fastForward('02:20'); await p.waitForTimeout(800);
console.log('lecturas automáticas:', lecturas - antes, '| cabecera:', await p.textContent('#estadoCarga'));
console.log('marcas:', await p.$$eval('.tarea .tit .badge', x => x.map(e => e.textContent + ' ' + e.parentNode.textContent.replace(e.textContent, '').trim())));
await p.screenshot({ path: new URL('importar.png', import.meta.url).pathname });
console.log('errores de página:', errs);
await b.close();
if (!process.argv.includes('conservar')) { fs.unlinkSync(rutaMsg); fs.unlinkSync(rutaEml); }
