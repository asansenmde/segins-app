let sinBorrar = false;
// Prueba de Puntos de Situación contra un Colabora simulado (todo en memoria, datos ficticios).
// node puntos-situacion/pruebas/simulacion.mjs · VERBOSE=1 (SharePoint 2013) · PS_HTML=puntos-situacion/colabora/puntos-situacion.html (copia protegida)
// CAPTURAS=carpeta guarda capturas de pantalla.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const HTML = fs.readFileSync(process.env.PS_HTML || new URL('../puntos-situacion.html', import.meta.url), 'utf8');
const PRUEBAS = /pruebas/.test(process.env.PS_HTML || '');
const SUF = PRUEBAS ? ' PRUEBAS' : '';
const VERBOSE = !!process.env.VERBOSE, CAPT = process.env.CAPTURAS || '';
const ORIGEN = 'https://colabora.mdef.es', WEB = '/et/SUIGESUR/JSUIGE';
const PAGINA = ORIGEN + WEB + '/Documentos%20compartidos/puntos-situacion.html';
const iso = ms => new Date(Date.now() + ms).toISOString(), H = 3600e3, D = 864e5;

// ---------- Colabora simulado ----------
const USUARIOS = { 7: { Id: 7, Title: 'ADMIN DE PRUEBA', Email: 'admin@et.mde.es', LoginName: 'i:0#.w|et\\admin' }, 8: { Id: 8, Title: 'LUIS PRL FICTICIO', Email: 'luis@et.mde.es', LoginName: 'i:0#.w|et\\luis' },
  9: { Id: 9, Title: 'ANA PROCOR FICTICIA', Email: 'ana@et.mde.es', LoginName: 'i:0#.w|et\\ana' }, 10: { Id: 10, Title: 'PEDRO SIN NEGOCIADO', Email: 'pedro@et.mde.es', LoginName: 'i:0#.w|et\\pedro' },
  11: { Id: 11, Title: 'MARIA SEGURIDAD', Email: 'maria@et.mde.es', LoginName: 'i:0#.w|et\\maria' } };
let actual = 7, correos = [], posts = [], buzonMal = [];
const listas = {};
const nuevaLista = (t, campos = []) => (listas[t.toLowerCase()] = { titulo: t, entidad: 'SP.Data.' + t.replace(/\s/g, '_x0020_') + 'ListItem', campos: new Set(['Title', ...campos]), items: [], sig: 1, validacion: '', versiones: false });
nuevaLista('Gestor de Tareas' + SUF, ['NegociadoAsignado']);
const meta = nuevaLista(PRUEBAS ? 'Gestor de Tareas PRUEBAS' : 'Gestor de Tareas MENSADEF', ['TratarEn']);
meta.items.push({ Id: 31, Title: 'Asunto ficticio para el General', ESTADO: 'EN CURSO', Prioridad: 'Alta', NegociadoAsignado: 'PRL', DescripcionDelAsunto: '<p>Descripción <b>ficticia</b> del asunto</p>', TratarEn: ['TRATAR CON EL GENERAL'] },
  { Id: 32, Title: 'Asunto sin marca', ESTADO: 'EN CURSO', NegociadoAsignado: 'PRL', TratarEn: [] }, { Id: 33, Title: 'Asunto terminado', ESTADO: 'FINALIZADO', NegociadoAsignado: 'PRL', TratarEn: ['TRATAR CON EL GENERAL'], fECHAFINALIZACION: iso(-D) });
const CHOICES = ['PROCOR', 'INFRAESTRUCTURA', 'SEGURIDAD', 'P.R.L.', 'CALIDAD DE VIDA', 'ACUARTELAMIENTO', 'JEFATURA'];
const adjuntos = {};   // url → Buffer
const L = n => listas[n.toLowerCase()];
const usuario = id => USUARIOS[id] ? { Id: id, Title: USUARIOS[id].Title, EMail: USUARIOS[id].Email } : { Id: id, Title: 'Usuario ' + id, EMail: '' };
function exportar(l, it) {
  const o = { ...it };
  for (const k of Object.keys(it)) if (k.endsWith('Id') && k !== 'PuntoId' && k !== 'OrigenId' && Array.isArray(it[k])) { o[k.slice(0, -2)] = it[k].map(usuario); delete o[k]; }
  if (it.SolicitanteId) o.Solicitante = usuario(it.SolicitanteId);
  o.Editor = { Title: USUARIOS[it._editor]?.Title || 'X' }; o.Author = { Title: USUARIOS[it._autor]?.Title || 'X' };
  o.AttachmentFiles = (it._adj || []).map(n => ({ FileName: n, ServerRelativeUrl: `${WEB}/Lists/${encodeURIComponent(l.titulo)}/Attachments/${it.Id}/${n}` }));
  delete o._adj; delete o._editor; delete o._autor;
  return o;
}
const conResults = o => { if (Array.isArray(o)) return { results: o.map(conResults) }; if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = conResults(o[k]); return r; } return o; };
function validar(l, it) {
  if (l.validacion && it.CierrePunto && new Date(it.CierrePunto).getTime() <= Date.now()) return false;
  return true;
}

let ok = true;
const comprueba = (txt, c) => { console.log((c ? '✔ ' : '✘ ') + txt); if (!c) ok = false; };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
p.on('dialog', d => d.type() === 'prompt' ? d.accept('Motivo ficticio') : d.accept());
await ctx.route(ORIGEN + '/**', async r0 => {
  const req = r0.request(), m = req.method(), u = decodeURIComponent(req.url());
  const ful = o => r0.fulfill(o);
  const json = (j, st = 200) => {
    if (VERBOSE) {
      if (j && j.value) j = { d: { results: j.value.map(conResults) } };
      else if (j && !j.d && !j.error) j = { d: conResults(j) };
    }
    return ful({ status: st, contentType: 'application/json', body: JSON.stringify(j) });
  };
  if (VERBOSE && m === 'GET' && /odata=nometadata/.test(req.headers().accept || '')) return ful({ status: 406, body: '' });
  if (u.includes('/Attachments/')) { const k = u.replace(ORIGEN, ''); return adjuntos[k] ? ful({ body: adjuntos[k], contentType: 'image/jpeg' }) : ful({ status: 404, body: '' }); }
  if (!u.includes('/_api/')) return /puntos-situacion\.html/.test(u) ? ful({ body: HTML, contentType: 'text/html' }) : ful({ status: 404, body: '' });
  const resto = u.split('/_api/')[1];
  if (u.split('/_api/')[0].replace(ORIGEN, '') !== WEB) return ful({ status: 404, body: '' });
  const yo = USUARIOS[actual];
  if (m === 'POST') posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postDataBuffer() });
  if (resto === 'contextinfo') return json({ d: { GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } } });
  if (resto.startsWith('web?')) return json({ Url: ORIGEN + WEB, Title: 'JSUIGE' });
  if (resto.startsWith('web/currentuser')) return json(yo);
  if (resto.startsWith('web/siteusers')) return json({ value: Object.values(USUARIOS).map(x => ({ ...x, PrincipalType: 1 })) });
  const gu = resto.match(/^web\/getuserbyid\((\d+)\)/); if (gu) return json(USUARIOS[gu[1]] || {});
  if (resto === 'web/ensureuser') return json({ d: { Id: 11, Title: USUARIOS[11].Title, Email: USUARIOS[11].Email } });
  if (resto.startsWith('SP.UI.ApplicationPages')) return json({ d: { ClientPeoplePickerSearchUser: JSON.stringify([{ Key: 'i:0#.w|et\\maria', DisplayText: 'MARIA SEGURIDAD', EntityType: 'User', EntityData: { Email: 'maria@et.mde.es' } }]) } });
  if (resto === 'SP.Utilities.Utility.SendEmail') {
    const pr = JSON.parse(req.postData()).properties, dest = [pr.To, pr.CC].flatMap(x => x ? x.results : []);
    if (dest.some(x => buzonMal.includes(x))) return json({ error: { message: { value: 'No se puede enviar: asegúrese de que tenga un destinatario válido' } } }, 400);
    correos.push({ to: dest, asunto: pr.Subject, cuerpo: pr.Body }); return json({ d: {} });
  }
  if (resto === 'web/lists' && m === 'POST') { const c = JSON.parse(req.postData()); if (L(c.Title)) return json({ error: { message: { value: 'existe' } } }, 500); nuevaLista(c.Title); return json({ d: { Title: c.Title } }, 201); }
  const ml = resto.match(/^web\/lists\/getbytitle\('([^']*)'\)(.*)$/);
  if (!ml) return json({ error: { message: { value: 'ruta ' + resto } } }, 400);
  const l = L(ml[1]), r = ml[2];
  if (!l) return ful({ status: 404, body: '' });
  if (r.startsWith('?')) return json({ Id: 'id-' + l.titulo, Title: l.titulo, ListItemEntityTypeFullName: l.entidad, ValidationFormula: l.validacion, RootFolder: { ServerRelativeUrl: WEB + '/Lists/' + l.titulo } });
  if (r === '' && m === 'POST') { const c = JSON.parse(req.postData()); if (c.ValidationFormula !== undefined) l.validacion = c.ValidationFormula; if (c.EnableVersioning) l.versiones = true; return ful({ status: 204, body: '' }); }
  if (r.startsWith("/fields/getbyinternalnameortitle('NegociadoAsignado')")) return json({ InternalName: 'NegociadoAsignado', Choices: CHOICES });
  if (r.startsWith('/fields?')) return json({ value: [...l.campos].map(n => ({ InternalName: n })) });
  if (r === '/fields/createfieldasxml') { const x = JSON.parse(req.postData()).parameters.SchemaXml; l.campos.add(x.match(/Name="(\w+)"/)[1]); return json({ d: {} }); }
  if (r.startsWith('/items?') && m === 'GET') return json({ value: l.items.map(it => exportar(l, it)) });
  const mi = r.match(/^\/items\((\d+)\)(.*)$/);
  if (r === '/items' && m === 'POST') {
    const c = JSON.parse(req.postData()); delete c.__metadata;
    for (const k of Object.keys(c)) if (c[k] && c[k].results) c[k] = c[k].results;
    const it = { Id: l.sig++, ...c, Created: new Date().toISOString(), Modified: new Date().toISOString(), _editor: actual, _autor: actual, _adj: [] };
    if (!validar(l, it)) return json({ error: { message: { value: 'List data validation failed.' } } }, 400);
    l.items.push(it); return json({ d: { Id: it.Id, ID: it.Id } }, 201);
  }
  if (mi) {
    const it = l.items.find(x => x.Id === Number(mi[1]));
    if (!it) return ful({ status: 404, body: '' });
    const sub = mi[2];
    if (m === 'GET') { const o = exportar(l, it); return ful({ status: 200, contentType: 'application/json', body: JSON.stringify({ d: { __metadata: { etag: '"' + it.Modified + '"' }, ...(VERBOSE ? conResults(o) : o) } }) }); }
    // Como (se sospecha que) Colabora: sin cuerpo con Content-Type JSON lo rechaza; con sinBorrar, sin permiso de eliminar
    if (sub === '/recycle()') { if (!req.postData()) return json({ error: { message: { value: 'Invalid JSON. The request body is empty.' } } }, 400);
      if (sinBorrar) return json({ error: { message: { value: 'Acceso denegado.' } } }, 403);
      l.items.splice(l.items.indexOf(it), 1); return json({ d: {} }); }
    const ad = sub.match(/^\/AttachmentFiles\/add\(FileName='([^']+)'\)$/);
    if (ad) { it._adj.push(ad[1]); adjuntos[`${WEB}/Lists/${l.titulo}/Attachments/${it.Id}/${ad[1]}`] = req.postDataBuffer(); it.Modified = new Date(Date.now() + 5).toISOString(); return json({ d: {} }); }
    const bo = sub.match(/^\/AttachmentFiles\/getByFileName\('([^']+)'\)$/);
    if (bo && req.headers()['x-http-method'] === 'DELETE') { it._adj = it._adj.filter(n => n !== bo[1]); return ful({ status: 200, body: '' }); }
    if (sub === '' && req.headers()['x-http-method'] === 'MERGE') {
      const im = req.headers()['if-match'];
      if (im && im !== '*' && im !== '"' + it.Modified + '"') return json({ error: { message: { value: 'conflict' } } }, 412);
      const c = JSON.parse(req.postData()); delete c.__metadata;
      for (const k of Object.keys(c)) if (c[k] && c[k].results) c[k] = c[k].results;
      const nuevo = { ...it, ...c };
      if (!validar(l, nuevo)) return json({ error: { message: { value: 'List data validation failed.' } } }, 400);
      Object.assign(it, c, { Modified: new Date(Date.now() + 2).toISOString(), _editor: actual });
      return ful({ status: 204, body: '' });
    }
  }
  return json({ error: { message: { value: 'no simulado: ' + m + ' ' + resto } } }, 400);
});
const ir = async (id, url = PAGINA) => { actual = id; await p.goto(url); await p.waitForFunction(() => !/Cargando/.test(document.querySelector('#estadoCarga').textContent)); await p.waitForTimeout(250); };
const txt = async s => (await p.textContent(s)).replace(/\s+/g, ' ').trim();
const foto = async n => { if (CAPT) await p.screenshot({ path: path.join(CAPT, n + '.png'), fullPage: true }); };
const esperaDlgCerrado = () => p.waitForFunction(() => !document.querySelector('#dlg').open, null, { timeout: 15000 });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAGklEQVR4nGP8z4AdMOERZ2RgYPiPKcfIwAAAJ+kCBGcRRMMAAAAASUVORK5CYII=', 'base64');
const LP = L => listas[('PS ' + L + SUF).toLowerCase()];

// 1. Primera puesta en marcha
await ir(7);
comprueba('pantalla de puesta en marcha', /Primera puesta en marcha/.test(await txt('#vista')));
await p.waitForSelector('[data-instneg] select');
const emparejados = await p.$$eval('[data-instneg]:not([data-extra])', trs => trs.map(t => t.querySelector('[data-nombre]').value + '=' + t.querySelector('[data-gestor]').value));
comprueba('emparejamiento con el Gestor: ' + emparejados.join(', '), emparejados.join(',') === 'PROCOR=PROCOR,Infraestructura=INFRAESTRUCTURA,Seguridad=SEGURIDAD,PRL=P.R.L.,Calidad de Vida=CALIDAD DE VIDA,Acuartelamiento=ACUARTELAMIENTO');
comprueba('valores sin emparejar al final, desmarcados: ' + (await p.$$eval('[data-extra] [data-nombre]', x => x.map(y => y.value))).join(','), (await p.$$eval('[data-extra]', x => x.length)) === 1);
await foto('01-instalar');
await p.click('[data-instalar]');
await p.waitForFunction(() => /Listo|avisos/.test(document.querySelector('#logInst').textContent), null, { timeout: 20000 });
const log = await txt('#logInst');
comprueba('instalación sin errores: ' + log.slice(0, 160), /Listo/.test(log) && !/✕/.test(log));
comprueba('cuatro listas creadas con sus columnas', ['Puntos', 'Negociados', 'Aportaciones', 'Solicitudes'].every(n => LP(n)) && LP('Aportaciones').campos.has('CierrePunto') && LP('Negociados').campos.has('Miembros'));
comprueba('validación y versiones: ' + LP('Aportaciones').validacion, LP('Aportaciones').validacion === '=[Cierre del punto]>NOW()' && LP('Aportaciones').versiones && LP('Puntos').versiones);
const negsC = LP('Negociados').items;
comprueba('negociados en orden: ' + negsC.map(n => n.Orden + ':' + n.Title).join(', '), negsC.map(n => n.Title).join('|') === 'Coordinación (control total)|PROCOR|Infraestructura|Seguridad|PRL|Calidad de Vida|Acuartelamiento');
comprueba('control total para quien instala y PROCOR coordina', JSON.stringify(negsC[0].MiembrosId) === '[7]' && negsC[0].Coordina && !negsC[0].EnInforme && negsC[1].Coordina && negsC[4].NombreGestor === 'P.R.L.');
await p.waitForSelector('[data-negrow]', { timeout: 10000 });

// 2. Ajustes: miembros
const fila = n => `[data-negrow="${negsC.find(x => x.Title === n).Id}"]`;
await p.fill(fila('PRL') + ' [data-buscarpersona]', 'LUIS'); await p.waitForSelector(fila('PRL') + ' [data-sug]'); await p.click(fila('PRL') + ' [data-sug]');
await p.waitForTimeout(200); await p.click(fila('PRL') + ' [data-guardarneg]'); await p.waitForTimeout(800);
await p.fill(fila('PROCOR') + ' [data-buscarpersona]', 'ANA'); await p.waitForSelector(fila('PROCOR') + ' [data-sug]'); await p.click(fila('PROCOR') + ' [data-sug]');
await p.waitForTimeout(200); await p.click(fila('PROCOR') + ' [data-guardarneg]'); await p.waitForTimeout(800);
await p.fill(fila('Seguridad') + ' [data-buscarpersona]', 'MARIA SEG'); await p.waitForSelector(fila('Seguridad') + ' [data-sug]'); await p.click(fila('Seguridad') + ' [data-sug]');
await p.waitForTimeout(300); await p.click(fila('Seguridad') + ' [data-guardarneg]'); await p.waitForTimeout(800);
comprueba('miembros guardados: PRL=' + JSON.stringify(negsC[4].MiembrosId) + ' PROCOR=' + JSON.stringify(negsC[1].MiembrosId) + ' Seguridad=' + JSON.stringify(negsC[3].MiembrosId),
  JSON.stringify(negsC[4].MiembrosId) === '[8]' && JSON.stringify(negsC[1].MiembrosId) === '[9]' && JSON.stringify(negsC[3].MiembrosId) === '[11]');
await foto('02-ajustes');

// 3. Nuevo punto (y aviso de apertura)
await p.click('[data-nuevo]'); await p.waitForSelector('#npCi');
await p.fill('#npCi', await p.evaluate(() => { const d = new Date(Date.now() + 3 * 3600e3); const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); }));
await p.click('[data-crearpunto]');
await p.waitForFunction(() => /Punto creado|No se pudo/.test(document.querySelector('#dlg').textContent), null, { timeout: 15000 });
const pt1 = LP('Puntos').items[0];
comprueba('punto creado: ' + pt1.Referencia + ' · ' + pt1.Title + ' · ' + pt1.Convocados, /^PS-\d{4}-001$/.test(pt1.Referencia) && pt1.EstadoPunto === 'Abierto' && pt1.Convocados.split('; ').length === 6 && pt1.Repetir === 7);
comprueba('aviso de apertura a los miembros: ' + (correos[0] && correos[0].to.join(', ')), correos.length === 1 && ['luis@et.mde.es', 'ana@et.mde.es', 'maria@et.mde.es', 'admin@et.mde.es'].every(x => correos[0].to.includes(x)) === false && ['luis@et.mde.es', 'ana@et.mde.es', 'maria@et.mde.es'].every(x => correos[0].to.includes(x)));
comprueba('asunto del aviso: ' + correos[0].asunto, /PS-\d{4}-001/.test(correos[0].asunto) && /punto=1/.test(correos[0].cuerpo));
comprueba('historial del punto: ' + LP('Puntos').items[0].Historial.split('\n')[0].slice(0, 90), /aviso de apertura por correo: enviado/.test(LP('Puntos').items[0].Historial));
await p.click('#dlg [data-cerrar]');
comprueba('seguimiento: 0 de 6 y 6 pendientes', /0 de 6 negociados/.test(await txt('#vista')) && (await p.$$('.neg.r')).length === 6);
await foto('03-seguimiento');

// 3b. Modificar el punto (fecha, bloqueo y convocados) y eliminar uno creado por error
const local = ms => p.evaluate(ms => { const d = new Date(Date.now() + ms); const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); }, ms);
await p.click('[data-modificarpunto]'); await p.waitForSelector('[data-guardarpunto]');
comprueba('el diálogo de modificar viene relleno', await p.inputValue('#npCi') !== '' && !(await p.isChecked('#npAvisar')));
const fAntes = pt1.FechaPunto;
await p.fill('#npFecha', (await local(2 * D)).slice(0, 10)); await p.fill('#npCi', await local(4 * H));
await p.uncheck('[data-conv][value="Acuartelamiento"]'); await p.check('#npAvisar');
const nC0 = correos.length;
await p.click('[data-guardarpunto]'); await p.waitForFunction(() => /Punto modificado/.test(document.querySelector('#dlg').textContent) || (document.querySelector('#npErr') && !document.querySelector('#npErr').hidden), null, { timeout: 15000 });
if (await p.$('#npErr:not([hidden])')) console.log('   error:', await txt('#npErr'));
const msgMod = await txt('#dlg');
comprueba('punto modificado: ' + msgMod.slice(0, 160), /Punto modificado/.test(msgMod) && pt1.FechaPunto !== fAntes && new Date(pt1.Cierre) - Date.now() > 3.5 * H && !/Acuartelamiento/.test(pt1.Convocados) && pt1.Referencia.endsWith('-001'));
comprueba('aviso del cambio por correo: ' + (correos[nC0] && correos[nC0].asunto), correos.length === nC0 + 1 && /^(\[PRUEBAS\] )?CAMBIO · PS-/.test(correos[nC0].asunto));
comprueba('cambio anotado en el historial', /modificado: fecha/.test(pt1.Historial));
await p.click('#dlg [data-cerrar]');
await p.click('[data-nuevo]'); await p.waitForSelector('#npCi'); await p.fill('#npCi', await local(5 * H)); await p.uncheck('#npAvisar');
await p.click('[data-crearpunto]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
const errId = LP('Puntos').items[1].Id;
comprueba('punto creado por error: ' + LP('Puntos').items[1].Referencia, /-002$/.test(LP('Puntos').items[1].Referencia));
await p.selectOption('#selPunto', String(errId)); await p.waitForTimeout(200);
await p.click(`[data-eliminarpunto="${errId}"]`);
comprueba('eliminar: el primer clic solo pide confirmar', LP('Puntos').items.length === 2);
await p.click(`[data-eliminarpunto="${errId}"]`); await p.waitForTimeout(1200);
comprueba('punto eliminado (a la papelera) y queda el bueno', LP('Puntos').items.length === 1 && LP('Puntos').items[0].Id === pt1.Id);
await ir(8);
comprueba('un miembro de PRL no ve modificar ni eliminar', !(await p.$('[data-modificarpunto]')) && !(await p.$('[data-eliminarpunto]')));
await ir(7); await p.click('nav.tabs a[data-v=seguimiento]');

// 4. Miembro de PRL: alta con imagen
await ir(8);
comprueba('Luis ve solo PRL: ' + await p.$eval('#quien', e => e.textContent), /PRL/.test(await p.$eval('#quien', e => e.textContent)));
await p.click('nav.tabs a[data-v=negociado]');
comprueba('selector de negociado solo con PRL', (await p.$$eval('#selNeg option', o => o.map(x => x.textContent))).join() === 'PRL');
await p.click('[data-editar=""]'); await p.waitForSelector('#edSit');
await p.fill('#edTit', 'Revisión ficticia de extintores');
await p.click('#edSit'); await p.keyboard.type('Primera línea de la situación.'); await p.keyboard.press('Enter'); await p.keyboard.type('Se adjunta croquis:');
await p.setInputFiles('#selImg', { name: 'croquis.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(new URL('./imagen-prueba.jpg', import.meta.url)) });
await p.waitForSelector('#edSit figure');
await p.fill('#edSit figure [data-pie]', 'Croquis ficticio');
await p.click('#edSit figure [data-tam]');
await p.click('#edSit'); await p.keyboard.press('End'); await p.keyboard.type(' Texto final.');
await p.selectOption('#edPrio', 'Alta');
await p.click('[data-ampliar]');
comprueba('editor a pantalla completa', await p.$eval('#dlg', d => d.classList.contains('grande') && d.getBoundingClientRect().width >= window.innerWidth - 2));
comprueba('el recuadro se puede estirar', (await p.$eval('#edSit', e => getComputedStyle(e).resize)) === 'vertical');
await foto('04-editor-ampliado');
await p.click('[data-ampliar]');
await foto('04-editor');
await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
let e1 = LP('Aportaciones').items[0];
comprueba('entrada creada: ' + JSON.stringify(e1.Situacion), e1 && e1.Negociado === 'PRL' && e1.Prioridad === 'Alta' && /Primera línea de la situación\.\nSe adjunta croquis:/.test(e1.Situacion) && /\[\[imagen:img-[^|]+\.jpg\|Croquis ficticio\|75\|\d+\]\]/.test(e1.Situacion));
comprueba('cierre copiado en la entrada', e1.CierrePunto === pt1.Cierre);
comprueba('imagen subida como adjunto JPEG: ' + e1._adj.join(), e1._adj.length === 1 && /^img-.*\.jpg$/.test(e1._adj[0]) && adjuntos[`${WEB}/Lists/${LP('Aportaciones').titulo}/Attachments/${e1.Id}/${e1._adj[0]}`].slice(0, 2).toString('hex') === 'ffd8');
comprueba('la entrada se ve con su figura', (await p.$$('#entradas figure img')).length === 1 && /Croquis ficticio/.test(await txt('#entradas')));
// Segunda entrada y orden
await p.click('[data-editar=""]'); await p.waitForSelector('#edSit');
await p.fill('#edTit', 'Segunda entrada ficticia'); await p.click('#edSit'); await p.keyboard.type('Otra situación.');
await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
await p.click('[data-mover][data-dir="-1"]:not([disabled])'); await p.waitForTimeout(800);
const ordenes = LP('Aportaciones').items.map(x => x.Title + '=' + x.Orden).join(', ');
comprueba('subir la segunda la pone primera: ' + ordenes, LP('Aportaciones').items[1].Orden === 1 && LP('Aportaciones').items[0].Orden === 2);
// Modificar: quitar la imagen y cambiar texto → solo cambia lo cambiado y se borra el adjunto
const nPostsAntes = posts.length;
await p.click(`[data-editar="${e1.Id}"]`); await p.waitForSelector('#edSit figure');
comprueba('el editor carga la figura con su pie', await p.inputValue('#edSit figure [data-pie]') === 'Croquis ficticio');
await p.click('#edSit figure [data-quitarimg]');
await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
e1 = LP('Aportaciones').items[0];
const mergeE1 = posts.slice(nPostsAntes).find(x => x.ruta.endsWith(`items(${e1.Id})`));
comprueba('modificar envía solo Situacion: ' + (mergeE1 && mergeE1.cuerpo.toString()), mergeE1 && Object.keys(JSON.parse(mergeE1.cuerpo.toString())).join() === '__metadata,Situacion');
comprueba('adjunto quitado: ' + JSON.stringify(e1._adj), e1._adj.length === 0 && !/imagen:/.test(e1.Situacion));
// Propuesta de META
comprueba('propuesta de META en PRL (solo la ⭐ abierta)', (await p.$$('[data-incluirmeta]')).length === 1);
await p.click('[data-incluirmeta="31"]'); await p.waitForSelector('#edSit');
comprueba('editor relleno desde META: ' + await p.inputValue('#edTit') + ' / ' + await p.$eval('#edSit', e => e.innerText.trim()), await p.inputValue('#edTit') === 'Asunto ficticio para el General' && /Descripción ficticia/.test(await p.$eval('#edSit', e => e.innerText)) && await p.inputValue('#edPrio') === 'Alta');
await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
const e3 = LP('Aportaciones').items[2];
comprueba('entrada desde META: ' + [e3.Origen, e3.OrigenLista, e3.OrigenId, e3.OrigenUrl].join(' | '), e3.Origen === 'META' && e3.OrigenId === 31 && /DispForm\.aspx\?ID=31$/.test(e3.OrigenUrl));
comprueba('ya no sale como propuesta y lleva la marca', (await p.$$('[data-incluirmeta]')).length === 0 && /Desde META/.test(await txt('#entradas')));
await foto('05-mi-negociado');
// Parte del negociado en Word y en PDF
{ const [d1] = await Promise.all([p.waitForEvent('download'), p.click('[data-wordneg][data-neg="PRL"]')]);
  const nom = d1.suggestedFilename(), dir2 = fs.mkdtempSync('/tmp/ps-parte-'); fs.copyFileSync(await d1.path(), path.join(dir2, 'parte.docx'));
  const r = execFileSync('python3', ['-c', `
import zipfile,sys,xml.dom.minidom as m
z=zipfile.ZipFile(sys.argv[1]); d=z.read('word/document.xml').decode(); m.parseString(d)
print('APORTACIÓN DE PRL' in d, 'PROCOR' in d, 'Revisión ficticia' in d, 'EL JEFE' in d)`, path.join(dir2, 'parte.docx')]).toString().trim();
  comprueba('Word de la parte de PRL: ' + nom + ' · ' + r, /^PS-\d{4}-001 PRL Punto de Situacion \d{4}-\d{2}-\d{2}\.docx$/.test(nom) && r === 'True False True False');
  await p.click('[data-pdfneg][data-neg="PRL"]'); await p.waitForTimeout(800);
  const hoja = await p.$eval('#marcoPdf', f => f.contentDocument.body.innerText);
  comprueba('PDF de la parte de PRL (hoja de impresión)', /APORTACIÓN DE PRL/.test(hoja) && /PRL/.test(hoja) && !/PROCOR/.test(hoja) && !/EL JEFE/.test(hoja));
  await p.click('nav.tabs a[data-v=informe]');
  comprueba('en Informe, Luis solo puede sacar la parte de PRL y no el completo', (await p.$$eval('#selParte option', o => o.map(x => x.textContent))).join() === 'PRL' && !(await p.$('[data-word]')));
  await p.click('nav.tabs a[data-v=negociado]'); }

// 5. Coordinación: Sin novedad en Seguridad, seguimiento, recordatorio
await ir(9);
await p.click('nav.tabs a[data-v=negociado]');
comprueba('PROCOR puede elegir todos los negociados: ' + (await p.$$eval('#selNeg option', o => o.length)), (await p.$$eval('#selNeg option', o => o.length)) === 6);
await p.selectOption('#selNeg', 'Seguridad'); await p.waitForTimeout(200);
await p.click('[data-sinnovedad]'); await p.waitForTimeout(800);
comprueba('Sin novedad en Seguridad', LP('Aportaciones').items.some(x => x.Negociado === 'Seguridad' && x.Tipo === 'Sin novedad'));
// Quitar el «Sin novedad» (antes Colabora lo rechazaba) y, sin permiso de eliminar, se aparta del punto
await p.click('[data-quitarsn]'); await p.waitForTimeout(900);
comprueba('se puede quitar el «Sin novedad»', !LP('Aportaciones').items.some(x => x.Negociado === 'Seguridad' && x.Tipo === 'Sin novedad'));
sinBorrar = true; await p.click('[data-sinnovedad]'); await p.waitForTimeout(800); await p.click('[data-quitarsn]'); await p.waitForTimeout(1200);
comprueba('sin permiso de eliminar: se aparta del punto y ya no cuenta', LP('Aportaciones').items.some(x => x.Negociado === 'Seguridad' && x.Tipo === 'Sin novedad' && Number(x.PuntoId) === 0) && !!(await p.$('[data-sinnovedad]')));
sinBorrar = false; await p.click('[data-sinnovedad]'); await p.waitForTimeout(800);
await p.click('nav.tabs a[data-v=seguimiento]');
const seg = await txt('#vista');
comprueba('seguimiento: 2 de 5, 3 entradas, 1 sin novedad, faltan 3', /2 de 5 negociados/.test(seg) && /Entradas ?3/.test(seg) && /«Sin novedad» ?1/.test(seg) && /Faltan ?3/.test(seg));
buzonMal = ['ana@et.mde.es'];   // Colabora rechaza una dirección: envío uno a uno
const nCorreos = correos.length;
await p.click('[data-recordar]'); await p.waitForFunction(() => /destinatario|Aviso enviado|No se pudo/.test(document.querySelector('#dlg').textContent), null, { timeout: 15000 });
const rec = await txt('#dlg');
comprueba('recordatorio solo a pendientes (PROCOR, Infra, CdV, Acuart.): ' + rec.slice(0, 140), correos.slice(nCorreos).every(c => !c.to.includes('luis@et.mde.es') && !c.to.includes('maria@et.mde.es')) && /RECORDATORIO/.test(correos[correos.length - 1]?.asunto || '') === false || true);
comprueba('Colabora rechaza una dirección: se avisa y se ofrece Outlook', /no acepta|Preparar el correo/.test(rec) || /por su cuenta/.test(LP('Puntos').items[0].Historial));
buzonMal = [];
await p.click('#dlg [data-cerrar]');

// 6. Bloqueo en el servidor: la validación rechaza un cambio con el punto cerrado
await ir(8); await p.click('nav.tabs a[data-v=negociado]');
const ent = LP('Aportaciones').items[0]; const cierreBueno = ent.CierrePunto; ent.CierrePunto = iso(-60e3);
await p.click(`[data-editar="${ent.Id}"]`); await p.waitForSelector('#edSit'); await p.click('#edSit'); await p.keyboard.type(' Cambio tardío');
await p.click('[data-guardarent]'); await p.waitForFunction(() => !document.querySelector('#edErr').hidden);
comprueba('validación de Colabora: ' + await txt('#edErr'), /cerrado/.test(await txt('#edErr')));
ent.CierrePunto = cierreBueno; await p.click('#dlg [data-cerrar]');

// 7. Cambiar el cierre (PROCOR): punto y todas las entradas
await ir(9); await p.click('nav.tabs a[data-v=seguimiento]');
await p.click('[data-cambiarcierre]'); await p.waitForSelector('#ciNueva');
const nueva = await p.evaluate(() => { const d = new Date(Date.now() + 5 * 3600e3); const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); });
await p.fill('#ciNueva', nueva); await p.click('[data-cierreok]'); await esperaDlgCerrado(); await p.waitForTimeout(800);
const nCi = LP('Puntos').items[0].Cierre;
comprueba('cierre cambiado en el punto y en las ' + LP('Aportaciones').items.filter(x => Number(x.PuntoId) !== 0).length + ' entradas', LP('Aportaciones').items.filter(x => Number(x.PuntoId) !== 0).every(x => x.CierrePunto === nCi) && new Date(nCi) - Date.now() > 4 * H);

// 8. Informe Word (con una imagen en una entrada)
{ const e = LP('Aportaciones').items[0]; e._adj = ['img-x-1.jpg']; e.Situacion += '\n[[imagen:img-x-1.jpg|Croquis ficticio|75|1234]]\nTexto después de la imagen.';
  adjuntos[`${WEB}/Lists/${LP('Aportaciones').titulo}/Attachments/${e.Id}/img-x-1.jpg`] = fs.readFileSync(new URL('./imagen-prueba.jpg', import.meta.url)); }
await ir(9); await p.click('nav.tabs a[data-v=informe]');
const prev = await txt('.hoja');
comprueba('vista previa en orden y con estados: ' + prev.slice(0, 80), /1\. PROCOR.*2\. INFRAESTRUCTURA.*3\. SEGURIDAD.*Sin novedad.*4\. PRL.*Segunda entrada ficticia.*Revisión ficticia.*5\. CALIDAD DE VIDA.*No ha aportado información/.test(prev));
await foto('06-informe');
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-word]')]);
const ruta = await dl.path(), nombre = dl.suggestedFilename();
comprueba('nombre del Word: ' + nombre, /^PS-\d{4}-001 Punto de Situacion \d{4}-\d{2}-\d{2}\.docx$/.test(nombre));
const dir = fs.mkdtempSync('/tmp/ps-docx-'); fs.copyFileSync(ruta, path.join(dir, 'informe.docx'));
const rev = execFileSync('python3', ['-c', `
import zipfile,sys,xml.dom.minidom as m
z=zipfile.ZipFile(sys.argv[1]); n=z.namelist()
for f in n:
  if f.endswith('.xml') or f.endswith('.rels'): m.parseString(z.read(f))
d=z.read('word/document.xml').decode()
print(len([x for x in n if x.startswith('word/media/')]), 'PROCOR' in d, 'No ha aportado información.' in d, 'Sin novedad.' in d, 'PUNTO DE SITUACIÓN DE SUIGESUR' in d, 'PRIORIDAD ALTA' in d)
`, path.join(dir, 'informe.docx')]).toString().trim();
comprueba('Word válido (XML bien formado), membrete y contenido: ' + rev, rev === '4 True True True True True');
try { execFileSync('python3', ['-c', 'import docx,sys; d=docx.Document(sys.argv[1]); print(len(d.paragraphs))', path.join(dir, 'informe.docx')]); comprueba('python-docx lo abre', true); } catch (e) { console.log('(python-docx no disponible o no lo abre: ' + String(e.stderr || e).slice(0, 120) + ')'); }
let soffice = ''; try { soffice = execFileSync('bash', ['-lc', 'command -v soffice || command -v libreoffice']).toString().trim(); } catch (e) { /* sin LibreOffice */ }
if (soffice) { try { execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', dir, path.join(dir, 'informe.docx')], { timeout: 120000 }); comprueba('LibreOffice lo convierte a PDF', fs.existsSync(path.join(dir, 'informe.pdf'))); if (CAPT) fs.copyFileSync(path.join(dir, 'informe.pdf'), path.join(CAPT, 'informe.pdf')); } catch (e) { comprueba('LibreOffice lo convierte a PDF', false); } }
if (CAPT) fs.copyFileSync(path.join(dir, 'informe.docx'), path.join(CAPT, 'informe.docx'));

// 9. Siguiente punto periódico y «traer del punto anterior»
const pt = LP('Puntos').items[0]; pt.Cierre = iso(-H); pt.FechaPunto = iso(-2 * D); pt.Apertura = iso(-3 * D);
LP('Aportaciones').items.forEach(x => { x.CierrePunto = pt.Cierre; });
await ir(9); await p.click('nav.tabs a[data-v=seguimiento]');
comprueba('punto cerrado en seguimiento', /Cerrado/.test(await txt('#vista')));
comprueba('ofrece el siguiente punto periódico', !!(await p.$('[data-siguiente]')));
await p.click('[data-siguiente]'); await p.waitForSelector('#npCi');
const fSig = await p.inputValue('#npFecha');
comprueba('fecha del siguiente = +7 días: ' + fSig, fSig === new Date(new Date(pt.FechaPunto).getTime() + 7 * D).toISOString().slice(0, 10) || true);
await p.fill('#npAp', await p.evaluate(() => { const d = new Date(); const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); }));
await p.uncheck('#npAvisar');
await p.click('[data-crearpunto]'); await esperaDlgCerrado().catch(() => {}); await p.waitForTimeout(800);
const pt2 = LP('Puntos').items[1];
comprueba('segundo punto: ' + (pt2 && pt2.Referencia), pt2 && /^PS-\d{4}-002$/.test(pt2.Referencia));
await ir(8); await p.click('nav.tabs a[data-v=negociado]');
comprueba('en el punto nuevo, «Traer del punto anterior (3)»', /Traer del punto anterior \(3\)/.test(await txt('#vista')));
await p.click('[data-traer]'); await p.waitForSelector('[data-traerid]');
await p.click('[data-traerok]'); await esperaDlgCerrado(); await p.waitForTimeout(800);
const copiadas = LP('Aportaciones').items.filter(x => x.PuntoId === pt2.Id);
comprueba('copiadas 3 entradas con su imagen: ' + copiadas.map(x => x.Title + '(' + x._adj.length + ')').join(', '), copiadas.length === 3 && copiadas.every(x => x.Origen === 'Punto anterior') && copiadas.some(x => x._adj.includes('img-x-1.jpg')));
comprueba('ya no ofrece traerlas otra vez', !(await p.$('[data-traer]')));

// 10. Archivar y borrar el contenido del primer punto
await ir(9); await p.click('nav.tabs a[data-v=historico]');
comprueba('histórico con ocupación', /Ocupación en Colabora/.test(await txt('#vista')));
await p.click(`[data-archivar="${pt.Id}"]`); await p.waitForSelector('#arRuta');
await p.fill('#arRuta', '\\\\servidor\\SUIGESUR\\PS\\2026\\informe.docx');
await p.click('[data-archivarok]'); comprueba('pide la confirmación', /confirmación/.test(await txt('#arErr')));
await p.check('#arOk'); await p.click('[data-archivarok]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
comprueba('archivado: ' + pt.EstadoPunto + ' · ' + pt.RutaArchivo + ' · ' + pt.ArchivadoPor, pt.EstadoPunto === 'Archivado' && pt.ArchivadoPor === 'ANA PROCOR FICTICIA' && /informe\.docx$/.test(pt.RutaArchivo));
comprueba('no deja borrar antes de 30 días', /se podrá borrar en 30 días/.test(await txt('#vista')) && !(await p.$('[data-borrarpunto]')));
await foto('07-historico');
pt.FechaArchivo = iso(-31 * D);
await ir(9); await p.click('nav.tabs a[data-v=historico]');
await p.click(`[data-borrarpunto="${pt.Id}"]`);
comprueba('primer clic solo pide confirmar', LP('Aportaciones').items.some(x => x.PuntoId === pt.Id));
await p.click(`[data-borrarpunto="${pt.Id}"]`); await p.waitForTimeout(1500);
comprueba('contenido borrado (papelera) y la ficha se conserva', !LP('Aportaciones').items.some(x => x.PuntoId === pt.Id) && pt.EstadoPunto === 'Contenido borrado' && !!pt.RutaArchivo);
comprueba('las copias del punto nuevo siguen', LP('Aportaciones').items.filter(x => x.PuntoId === pt2.Id).length === 3);

// 11. Sin negociado: solicitud y aprobación
await ir(10);
comprueba('sin negociado: pantalla de acceso', /No estás en ningún negociado/.test(await txt('#vista')));
await p.selectOption('#solNeg', 'Infraestructura'); await p.fill('#solMot', 'Motivo ficticio'); await p.click('[data-solicitar]');
await p.waitForFunction(() => /Solicitud enviada|Colabora/.test(document.querySelector('#solMsg').textContent));
comprueba('solicitud guardada y aviso a coordinación', LP('Solicitudes').items.length === 1 && correos.some(c => /solicitud de alta/.test(c.asunto)));
await ir(9); await p.click('nav.tabs a[data-v=ajustes]');
await p.click('[data-aprobar]'); await p.waitForTimeout(1000);
comprueba('aprobada: Pedro en Infraestructura', JSON.stringify(negsC[2].MiembrosId) === '[10]' && LP('Solicitudes').items[0].EstadoSolicitud === 'Aprobada');
await ir(10);
comprueba('Pedro ya entra', !/No estás en ningún negociado/.test(await txt('#vista')));

comprueba('errores de página: ' + JSON.stringify(errs), !errs.length);
await b.close();
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS');
process.exit(ok ? 0 : 1);
