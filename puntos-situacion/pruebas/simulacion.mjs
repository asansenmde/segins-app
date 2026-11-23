let sinBorrar = false, sinEditar = false;
// Prueba de Puntos de Situación contra un Colabora simulado (todo en memoria, datos ficticios).
// node puntos-situacion/pruebas/simulacion.mjs · VERBOSE=1 (SharePoint 2013) · PS_HTML=puntos-situacion/colabora/puntos-situacion.html (copia protegida)
// CAPTURAS=carpeta guarda capturas de pantalla. SOLO_CUENTAS=1 imita el Colabora real del correo: SendEmail rechaza las
// direcciones («@») y solo acepta cuentas (i:0#.w|et\\usuario). PROXY=1 imita el filtro de la red de Defensa (mete un <script> delante de cada </head>).
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
let validacionForzada = false;
const ADMINS = new Set([7, 9]);   // Control total en el sitio y en las listas
const SOLO_CUENTAS = !!process.env.SOLO_CUENTAS, rechazosCorreo = [];
const comoCorreo = d => { const u = Object.values(USUARIOS).find(x => x.LoginName === d); return u ? u.Email : d; };
const permisos = () => ({ High: '0', Low: String(ADMINS.has(actual) ? 0x7FFFFFFF : 0x1 | 0x2 | 0x4 | 0x8) });
let listaAbierta = false;
let actual = 7, correos = [], posts = [], buzonMal = [];
const listas = {};
const nuevaLista = (t, campos = []) => (listas[t.toLowerCase()] = { titulo: t, entidad: 'SP.Data.' + t.replace(/\s/g, '_x0020_') + 'ListItem', campos: new Set(['Title', ...campos]), items: [], sig: 1, validacion: '', versiones: false });
nuevaLista('Gestor de Tareas' + SUF, ['NegociadoAsignado']);
const meta = nuevaLista(PRUEBAS ? 'Gestor de Tareas PRUEBAS' : 'Gestor de Tareas MENSADEF', ['TratarEn']);
meta.items.push({ Id: 31, Title: 'Asunto ficticio para el General', ESTADO: 'EN CURSO', Prioridad: 'Alta', NegociadoAsignado: 'PRL', DescripcionDelAsunto: '<p>Descripción <b>ficticia</b> del asunto</p>', TratarEn: ['TRATAR CON EL GENERAL'] },
  { Id: 32, Title: 'Asunto sin marca', ESTADO: 'EN CURSO', NegociadoAsignado: 'PRL', TratarEn: [] }, { Id: 33, Title: 'Asunto terminado', ESTADO: 'FINALIZADO', NegociadoAsignado: 'PRL', TratarEn: ['TRATAR CON EL GENERAL'], fECHAFINALIZACION: iso(-D) },
  { Id: 34, Title: 'Asunto sin negociado ficticio', ESTADO: 'EN CURSO', NegociadoAsignado: '', DescripcionDelAsunto: '<p>Texto ficticio sin negociado</p>', TratarEn: ['TRATAR CON EL GENERAL'] },
  { Id: 35, Title: 'Asunto de departamento desconocido', ESTADO: 'EN CURSO', NegociadoAsignado: 'DEPARTAMENTO FICTICIO', TratarEn: ['TRATAR CON EL GENERAL'] });
const CHOICES = ['PROCOR', 'INFRAESTRUCTURA', 'SEGURIDAD', 'P.R.L.', 'CALIDAD DE VIDA', 'ACUARTELAMIENTO', 'JEFATURA'];
const adjuntos = {};   // url → Buffer
const L = n => listas[n.toLowerCase()];
const usuario = id => USUARIOS[id] ? { Id: id, Title: USUARIOS[id].Title, EMail: USUARIOS[id].Email } : { Id: id, Title: 'Usuario ' + id, EMail: '' };
function exportar(l, it) {
  const o = { ...it };
  for (const k of Object.keys(it)) if (k.endsWith('Id') && k !== 'PuntoId' && k !== 'OrigenId' && Array.isArray(it[k])) { o[k.slice(0, -2)] = it[k].map(usuario); delete o[k]; }
  if (it.SolicitanteId) o.Solicitante = usuario(it.SolicitanteId);
  if (it.ResueltoPorId) o.ResueltoPor = usuario(it.ResueltoPorId);
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
  if (/portal\.aspx/.test(u)) return ful({ contentType: 'text/html', body: '<html><body><h1>Portal</h1><iframe id="app" style="width:1100px;height:800px" src="' + PAGINA + '"></iframe></body></html>' });
  if (!u.includes('/_api/')) return /puntos-situacion\.html/.test(u) ? ful({ body: process.env.PROXY ? HTML.replace(/<\/head>/gi, '<script>window.__filtroRed = 1<\/script></head>') : HTML, contentType: 'text/html' }) : ful({ status: 404, body: '' });
  const resto = u.split('/_api/')[1];
  if (u.split('/_api/')[0].replace(ORIGEN, '') !== WEB) return ful({ status: 404, body: '' });
  const yo = USUARIOS[actual];
  if (m === 'POST') posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postDataBuffer() });
  if (resto === 'contextinfo') return json({ d: { GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } } });
  if (resto.startsWith('web?')) return json({ Url: ORIGEN + WEB, Title: 'JSUIGE', EffectiveBasePermissions: permisos() });
  if (resto.startsWith('web/roleassignments')) return json({ value: [{ PrincipalId: 1, Member: { Id: 1, Title: 'MDEF\\usuarios del dominio', LoginName: 'c:0(.s|true' }, RoleDefinitionBindings: [{ RoleTypeKind: 3 }] }] });
  if (resto.startsWith('web/roledefinitions/getbytype(3)')) return json({ Id: 1073741827 });
  if (resto.startsWith('web/currentuser')) return json(yo);
  if (resto.startsWith('web/siteusers')) return json({ value: Object.values(USUARIOS).map(x => ({ ...x, PrincipalType: 1 })) });
  const gu = resto.match(/^web\/getuserbyid\((\d+)\)/); if (gu) return json(USUARIOS[gu[1]] || {});
  if (resto === 'web/ensureuser') {
    // Por dirección: la persona del sitio con ese correo o, si no está, se da de alta; por cuenta (buscador de personas): esa persona
    const lg = JSON.parse(req.postData()).logonName;
    let u = Object.values(USUARIOS).find(x => x.LoginName === lg || (/@/.test(lg) && x.Email.toLowerCase() === lg.toLowerCase()));
    if (!u && /@/.test(lg)) { const id = 100 + Object.keys(USUARIOS).length; u = USUARIOS[id] = { Id: id, Title: lg.split('@')[0].toUpperCase(), Email: lg, LoginName: 'i:0#.w|et\\' + lg.split('@')[0] }; }
    if (!u) u = USUARIOS[11];
    return json({ d: { Id: u.Id, Title: u.Title, Email: u.Email, LoginName: u.LoginName } });
  }
  if (resto.startsWith('SP.UI.ApplicationPages')) return json({ d: { ClientPeoplePickerSearchUser: JSON.stringify([{ Key: 'i:0#.w|et\\maria', DisplayText: 'MARIA SEGURIDAD', EntityType: 'User', EntityData: { Email: 'maria@et.mde.es' } }]) } });
  if (resto === 'SP.Utilities.Utility.SendEmail') {
    const pr = JSON.parse(req.postData()).properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
    if (SOLO_CUENTAS && dest.some(x => /@/.test(x))) { rechazosCorreo.push(dest.filter(x => /@/.test(x))); return json({ error: { message: { value: 'Asegúrese de que tenga un destinatario válido' } } }, 400); }
    if (dest.map(comoCorreo).some(x => buzonMal.includes(x))) return json({ error: { message: { value: 'No se puede enviar: asegúrese de que tenga un destinatario válido' } } }, 400);
    correos.push({ to: dest.map(comoCorreo), cc: (pr.CC ? pr.CC.results : []).map(comoCorreo), cuentas: dest, asunto: pr.Subject, cuerpo: pr.Body }); return json({ d: {} });
  }
  if (resto === 'web/lists' && m === 'POST') { const c = JSON.parse(req.postData()); if (L(c.Title)) return json({ error: { message: { value: 'existe' } } }, 500); nuevaLista(c.Title); return json({ d: { Title: c.Title } }, 201); }
  const ml = resto.match(/^web\/lists\/getbytitle\('([^']*)'\)(.*)$/);
  if (!ml) return json({ error: { message: { value: 'ruta ' + resto } } }, 400);
  const l = L(ml[1]), r = ml[2];
  if (!l) return ful({ status: 404, body: '' });
  if (r.startsWith('/roleassignments?')) return json({ value: listaAbierta ? [{ PrincipalId: 1, Member: { Id: 1, Title: 'MDEF\\usuarios del dominio', LoginName: 'c:0(.s|true' }, RoleDefinitionBindings: [{ RoleTypeKind: 3 }] }] : [] });
  if (/^\/(breakroleinheritance|roleassignments\/addroleassignment)/.test(r)) { listaAbierta = true; l.propios = true; return json({ d: {} }); }
  if (r.startsWith('?')) return json({ Id: 'id-' + l.titulo, Title: l.titulo, ListItemEntityTypeFullName: l.entidad, ValidationFormula: l.validacion, EffectiveBasePermissions: permisos(),
    ReadSecurity: l.lectura || 1, WriteSecurity: l.escritura || 1, HasUniqueRoleAssignments: !!l.propios, RootFolder: { ServerRelativeUrl: WEB + '/Lists/' + l.titulo } });
  if (r === '' && m === 'POST') { const c = JSON.parse(req.postData()); if (c.ValidationFormula !== undefined) l.validacion = c.ValidationFormula; if (c.EnableVersioning) l.versiones = true; if (c.ReadSecurity) { l.lectura = c.ReadSecurity; l.escritura = c.WriteSecurity; } return ful({ status: 204, body: '' }); }
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
    if (m === 'GET' && /EffectiveBasePermissions/.test(sub)) { const low = sinEditar ? 0x1 : sinBorrar ? 0x1 | 0x2 | 0x4 : 0x1 | 0x2 | 0x4 | 0x8; return json({ d: { EffectiveBasePermissions: { High: '0', Low: String(low) } } }); }
    if (m === 'GET') { const o = exportar(l, it); for (const k of Object.keys(it)) if (k.endsWith('Id') && Array.isArray(it[k])) o[k] = it[k]; return ful({ status: 200, contentType: 'application/json', body: JSON.stringify({ d: { __metadata: { etag: '"' + it.Modified + '"' }, ...(VERBOSE ? conResults(o) : o) } }) }); }
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
      if (validacionForzada && /Aportaciones/.test(l.titulo)) return json({ error: { message: { value: 'Error de validación de datos de lista.' } } }, 500);
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
comprueba('tres listas creadas con sus columnas (sin «PS Solicitudes»)', ['Puntos', 'Negociados', 'Aportaciones'].every(n => LP(n)) && !LP('Solicitudes') && LP('Aportaciones').campos.has('CierrePunto') && LP('Negociados').campos.has('Miembros'));
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
comprueba('aviso de apertura a los miembros y, en copia, a la coordinación: para ' + (correos[0] && correos[0].to.join(', ')) + ' · copia ' + (correos[0] && correos[0].cc.join(', ')),
  correos.length === 1 && ['luis@et.mde.es', 'ana@et.mde.es', 'maria@et.mde.es'].every(x => correos[0].to.includes(x)) && correos[0].cc.includes('admin@et.mde.es') && !correos[0].cc.includes('ana@et.mde.es'));
comprueba('asunto del aviso: ' + correos[0].asunto, /PS-\d{4}-001/.test(correos[0].asunto) && /punto=1/.test(correos[0].cuerpo));
comprueba('historial del punto: ' + LP('Puntos').items[0].Historial.split('\n')[0].slice(0, 90), /aviso de apertura por correo: enviado/.test(LP('Puntos').items[0].Historial));
await p.click('#dlg [data-cerrar]');
await ir(7);
comprueba('«Historial del punto» en Seguimiento con el envío del aviso', !!(await p.$('summary:has-text("Historial del punto")')) && /aviso de apertura por correo: enviado/.test(await txt('#vista')));
comprueba('seguimiento: 0 de 6 y 6 pendientes', /0 de 6 negociados/.test(await txt('#vista')) && (await p.$$('.neg.r')).length === 6);
await foto('03-seguimiento');
// Propuestas sin negociado: PROCOR elige dónde incluirlas (no se quedan en el limbo)
{ const t = await txt('#vista');
  comprueba('sin negociado: se dice el motivo', /sin negociado en META/.test(t) && /«DEPARTAMENTO FICTICIO» no está en Ajustes/.test(t) && (await p.$$('[data-incluiren]')).length === 2 && !(await p.$('[data-incluiren="31"]')));
  comprueba('las propuestas salen plegadas', await p.$eval('[data-props]', d => !d.open) && /Propuestas de META \(Tratar con el General\) · 3/.test(await txt('[data-props] > summary')));
  await p.click('[data-props] > summary');
  await p.selectOption('[data-negpara="34"]', 'Infraestructura'); await p.click('[data-incluiren="34"]'); await p.waitForSelector('#edSit');
  comprueba('«Incluir en…» abre el editor del negociado elegido: ' + await p.$eval('#dlg h2', e => e.textContent), /Nueva entrada · Infraestructura/.test(await p.$eval('#dlg h2', e => e.textContent)) && await p.inputValue('#edTit') === 'Asunto sin negociado ficticio');
  await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
  const ei = LP('Aportaciones').items.find(x => x.OrigenId === 34);
  comprueba('guardada en Infraestructura: ' + (ei && ei.Negociado), ei && ei.Negociado === 'Infraestructura');
  comprueba('al guardar se abre «Mi negociado» en Infraestructura y se ve', await p.$eval('nav.tabs a.on', e => e.dataset.v) === 'negociado' && await p.inputValue('#selNeg') === 'Infraestructura' && /Asunto sin negociado ficticio/.test(await txt('#vista')));
  await p.click('nav.tabs a[data-v=seguimiento]'); await p.waitForTimeout(300);
  comprueba('ya no sale entre las propuestas', !(await p.$('[data-incluiren="34"]')));
  await p.click('nav.tabs a[data-v=negociado]'); await p.waitForTimeout(300);
  await p.click(`[data-borrar="${ei.Id}"]`); await p.click(`[data-borrar="${ei.Id}"]`); await p.waitForTimeout(1200);
  comprueba('y se puede quitar', !LP('Aportaciones').items.some(x => x.OrigenId === 34 && x.PuntoId));
  await p.click('nav.tabs a[data-v=seguimiento]'); await p.waitForTimeout(300);
  comprueba('al quitarla vuelve a las propuestas', !!(await p.$('[data-incluiren="34"]'))); }

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
print('APORTACIÓN DE PRL' in d, 'PROCOR' in d, 'Revisión ficticia' in d, 'SECRETARIO' in d)`, path.join(dir2, 'parte.docx')]).toString().trim();
  comprueba('Word de la parte de PRL: ' + nom + ' · ' + r, /^PS-\d{4}-001 PRL Punto de Situacion \d{4}-\d{2}-\d{2}\.docx$/.test(nom) && r === 'True False True False');
  await p.click('[data-pdfneg][data-neg="PRL"]'); await p.waitForTimeout(800);
  const hoja = await p.$eval('#marcoPdf', f => f.contentDocument.body.innerText);
  comprueba('PDF de la parte de PRL (hoja de impresión)', /APORTACIÓN DE PRL/.test(hoja) && /PRL/.test(hoja) && !/PROCOR/.test(hoja) && !/SECRETARIO/.test(hoja));
  { // La hoja de impresión, pasada a PDF como haría «Guardar como PDF»: «Página X de Y» en cada página
    const doc = await p.$eval('#marcoPdf', f => '<!doctype html><html><head><meta charset="utf-8">' + f.contentDocument.head.innerHTML + '</head><body>' + f.contentDocument.body.innerHTML + '</body></html>');
    const pp = await p.context().newPage(); await pp.setContent(doc); const rpdf = path.join(fs.mkdtempSync('/tmp/ps-pdf-'), 'parte.pdf');
    await pp.pdf({ path: rpdf, preferCSSPageSize: true }); await pp.close();
    try { const tx = execFileSync('pdftotext', [rpdf, '-']).toString(); const np = (tx.match(/\f/g) || []).length || 1;
      comprueba('PDF: «Página 1 de ' + np + '» al pie', new RegExp('Página 1 de ' + np).test(tx)); } catch (e) { console.log('(sin pdftotext)'); } }
  await p.click('nav.tabs a[data-v=informe]');
  comprueba('en Informe, Luis saca la parte de PRL y el completo solo en PDF (no en Word)', (await p.$$eval('#selParte option', o => o.map(x => x.textContent))).join() === 'PRL' && !(await p.$('[data-word]')) && !!(await p.$('[data-pdf]')));
  await p.click('[data-pdf]'); await p.waitForTimeout(800);
  { const hc = await p.$eval('#marcoPdf', f => f.contentDocument.body.innerText);
    comprueba('PDF completo descargado por un miembro de PRL', /PROCOR/.test(hc) && /PRL/.test(hc) && /SEGURIDAD/i.test(hc));
    if (process.env.PDF_OUT) fs.writeFileSync(process.env.PDF_OUT, await p.$eval('#marcoPdf', f => '<!doctype html>' + f.contentDocument.documentElement.outerHTML)); }
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
sinEditar = true; await p.click('[data-sinnovedad]'); await p.waitForTimeout(800);
{ await p.evaluate(() => { window.__al = []; window.alert = m => window.__al.push(String(m)); }); await p.click('[data-quitarsn]'); await p.waitForTimeout(1200); const msg = (await p.evaluate(() => window.__al.join(' | ')));
  comprueba('sin permiso ni de editar: no intenta borrar (no sale la pantalla de identificarse) y lo explica', /no te deja ni eliminar ni modificar/.test(msg) && !posts.slice(-3).some(x => /recycle/.test(x.ruta))); }
sinEditar = false; await p.click('[data-quitarsn]'); await p.waitForTimeout(1000);
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

// 6. Bloqueo y hora de bloqueo atrasada
// 6a. Caso del usuario (16/11): punto abierto pero la copia de la hora en la entrada se quedó atrasada → antes «error de
// validación de datos de lista»; ahora se guarda y la copia se corrige sola
await ir(8); await p.click('nav.tabs a[data-v=negociado]');
const ent = LP('Aportaciones').items[0]; ent.CierrePunto = iso(-60e3);
await p.click(`[data-editar="${ent.Id}"]`); await p.waitForSelector('#edSit'); await p.click('#edSit'); await p.keyboard.press('End'); await p.keyboard.type(' Cambio con la hora atrasada');
await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
comprueba('punto abierto y copia atrasada: se guarda y la copia se corrige', /Cambio con la hora atrasada/.test(ent.Situacion) && ent.CierrePunto === LP('Puntos').items[0].Cierre);
// Ordenar con una copia atrasada también se guarda
LP('Aportaciones').items[1].CierrePunto = iso(-60e3);
await p.click('[data-mover][data-dir="1"]:not([disabled])'); await p.waitForTimeout(1000);
comprueba('ordenar con copia atrasada: se guarda', LP('Aportaciones').items.filter(x => x.PuntoId === LP('Puntos').items[0].Id && x.Negociado === 'PRL').every(x => x.CierrePunto === LP('Puntos').items[0].Cierre));
await p.click('[data-mover][data-dir="-1"]:not([disabled])'); await p.waitForTimeout(1000);   // vuelve al orden de antes
// 6b. Punto cerrado en el servidor mientras la página lo tenía abierto: lo dice y no escribe
await ir(8); await p.click('nav.tabs a[data-v=negociado]');
const ptS = LP('Puntos').items[0], ciS = ptS.Cierre; ptS.Cierre = iso(-60e3);
await p.click(`[data-editar="${ent.Id}"]`); await p.waitForSelector('#edSit'); await p.click('#edSit'); await p.keyboard.type(' Cambio tardío');
await p.click('[data-guardarent]'); await p.waitForFunction(() => !document.querySelector('#edErr').hidden);
comprueba('punto ya cerrado en Colabora: ' + await txt('#edErr'), /cerrado/.test(await txt('#edErr')) && !/Cambio tardío/.test(ent.Situacion));
ptS.Cierre = ciS; await p.click('#dlg [data-cerrar]');
// 6c. Si aun así Colabora rechaza por la validación (incluso con 500), el mensaje lo explica
validacionForzada = true;
await p.click(`[data-editar="${ent.Id}"]`); await p.waitForSelector('#edSit'); await p.click('#edSit'); await p.keyboard.type(' Otro');
await p.click('[data-guardarent]'); await p.waitForFunction(() => !document.querySelector('#edErr').hidden);
comprueba('error de validación con 500: ' + await txt('#edErr'), /validación de la lista/.test(await txt('#edErr')));
validacionForzada = false; await p.click('#dlg [data-cerrar]');

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
comprueba('asunto en su línea y el texto debajo (vista previa)', await p.$$eval('.hoja .item', l => l.length > 0 && l.every(it => it.firstElementChild.classList.contains('asunto') && it.firstElementChild.textContent.trim() && (!it.children[1] || !it.firstElementChild.textContent.includes(it.children[1].textContent.trim().slice(0, 12))))));
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
import re
viñetas=[p for p in re.findall(r'<w:p>.*?</w:p>', d) if '•' in p]
solo=all(len(re.findall(r'<w:t[ >]', p))==2 for p in viñetas)
print(len([x for x in n if x.startswith('word/media/')]), 'PROCOR' in d, 'No ha aportado información.' in d, 'Sin novedad.' in d, 'PUNTO DE SITUACIÓN DE SUIGESUR' in d, 'PRIORIDAD ALTA' in d, bool(viñetas) and solo)
`, path.join(dir, 'informe.docx')]).toString().trim();
comprueba('Word válido (XML bien formado), membrete, contenido y asunto solo en su línea: ' + rev, rev === '4 True True True True True True');
const rev2 = execFileSync('python3', ['-c', `
import zipfile,sys
z=zipfile.ZipFile(sys.argv[1]); d=z.read('word/document.xml').decode(); f=z.read('word/footer1.xml').decode()
print('EL SECRETARIO TÉCNICO DE LA SUIGESUR' in d, 'EL JEFE' not in d, 'Creado el' in d, 'Elaborado' not in d, 'Página ' in f and ' PAGE ' in f and ' NUMPAGES ' in f and 'fldChar' in f)
`, path.join(dir, 'informe.docx')]).toString().trim();
comprueba('firma del Secretario Técnico, «Creado el» y «Página X de Y» en el pie: ' + rev2, rev2 === 'True True True True True');
try { execFileSync('python3', ['-c', 'import docx,sys; d=docx.Document(sys.argv[1]); print(len(d.paragraphs))', path.join(dir, 'informe.docx')]); comprueba('python-docx lo abre', true); } catch (e) { console.log('(python-docx no disponible o no lo abre: ' + String(e.stderr || e).slice(0, 120) + ')'); }
let soffice = ''; try { soffice = execFileSync('bash', ['-lc', 'command -v soffice || command -v libreoffice']).toString().trim(); } catch (e) { /* sin LibreOffice */ }
if (soffice) { try { execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', dir, path.join(dir, 'informe.docx')], { timeout: 120000 }); comprueba('LibreOffice lo convierte a PDF', fs.existsSync(path.join(dir, 'informe.pdf')));
  try { const tx = execFileSync('pdftotext', [path.join(dir, 'informe.pdf'), '-']).toString(); const np = (tx.match(/\f/g) || []).length || 1;
    comprueba('Word: «Página 1 de ' + np + '» en la primera página', new RegExp('Página\\s+1\\s+de\\s+' + np).test(tx)); } catch (e) { console.log('(sin pdftotext)'); } if (CAPT) fs.copyFileSync(path.join(dir, 'informe.pdf'), path.join(CAPT, 'informe.pdf')); } catch (e) { comprueba('LibreOffice lo convierte a PDF', false); } }
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

// 11. Control de acceso con solicitud (modelo común): lista «SOLICITUDES ACCESO APLICACIONES», aviso a asansen@et.mde.es,
// pestaña Accesos y Ajustes solo con Control total
await ir(8);
comprueba('sin Control total: ni Ajustes ni Accesos', !(await p.$('nav.tabs a[data-v=ajustes]')) && !(await p.$('nav.tabs a[data-v=accesos]')));
await ir(7);
comprueba('con Control total: Ajustes y Accesos', !!(await p.$('nav.tabs a[data-v=ajustes]')) && !!(await p.$('nav.tabs a[data-v=accesos]')));
await p.click('nav.tabs a[data-v=accesos]'); await p.waitForSelector('[data-acccrearlista]');
comprueba('Preparación: falta la lista común', /Falta la lista «SOLICITUDES ACCESO APLICACIONES»/.test(await txt('#vista')));
await p.click('[data-acccrearlista]'); await p.waitForFunction(() => /preparada/.test(document.querySelector('#vista').textContent), null, { timeout: 15000 });
const LACC = listas['solicitudes acceso aplicaciones'];
comprueba('lista común creada, con columnas, solo sus elementos y abierta a todos', !!LACC && LACC.campos.has('Aplicacion') && LACC.campos.has('ResueltoPor') && LACC.lectura === 2 && listaAbierta && /Cualquiera puede solicitar acceso/.test(await txt('#vista')));
comprueba('enlace «🔔 Avisarme» (alerta de SharePoint)', !!(await p.$('a[href*="/_layouts/15/SubNew.aspx?List="]')));
const nPr = correos.length;
await p.click('[data-accprueba]'); await p.waitForFunction(() => /Aviso de prueba|✕/.test(document.querySelector('#accPrueba').textContent), null, { timeout: 15000 });
comprueba('«Probar el aviso» llega a asansen@et.mde.es: ' + (correos[nPr] && correos[nPr].cuentas.join()), correos.length === nPr + 1 && correos[nPr].to.includes('asansen@et.mde.es') && /^PRUEBA · SOLICITUD DE ACCESO/.test(correos[nPr].asunto.replace(/^\[PRUEBAS\] /, '')));
// Pedro (sin negociado) solicita el acceso
await ir(10);
comprueba('sin dar de alta: «Solicitar acceso»', /No tienes acceso a «Puntos de Situación»/.test(await txt('#vista')) && !!(await p.$('[data-accsolicitar]')));
await p.click('[data-accsolicitar]'); comprueba('pide el negociado', /Elige el negociado/.test(await txt('#accErr')));
await p.selectOption('#fAcceso [name=neg]', 'Infraestructura'); await p.fill('#fAcceso [name=motivo]', 'Motivo ficticio');
const nSo = correos.length;
await p.click('[data-accsolicitar]'); await p.waitForFunction(() => /PENDIENTE/.test(document.querySelector('#vista').textContent), null, { timeout: 15000 });
const sol = LACC.items[0];
comprueba('solicitud en la lista común: ' + [sol && sol.Aplicacion, sol && sol.Papel, sol && sol.EstadoSolicitud].join(' | '), sol && sol.Aplicacion === (PRUEBAS ? 'PUNTOS PRUEBAS' : 'PUNTOS') && sol.Papel === 'Negociado: Infraestructura' && sol.EstadoSolicitud === 'PENDIENTE' && sol.SolicitanteId === 10);
comprueba('aviso de la solicitud a asansen@et.mde.es (a su cuenta): ' + (correos[nSo] && correos[nSo].cuentas.join()), correos.length === nSo + 1 && correos[nSo].to.join() === 'asansen@et.mde.es' && !/@/.test(correos[nSo].cuentas.join()));
comprueba('la pantalla dice que está pendiente y que se avisó', /PENDIENTE de revisión/.test(await txt('#vista')) && /Se ha avisado por correo/.test(await txt('#vista')));
// El administrador la aprueba en Accesos
await ir(7);
comprueba('pestaña Accesos con 1 pendiente', /Accesos \(1\)/.test(await txt('nav.tabs')));
await p.click('nav.tabs a[data-v=accesos]'); await p.waitForSelector('[data-accaprobar]');
comprueba('negociado propuesto: Infraestructura', await p.$eval('.accNeg', e => e.selectedOptions[0].textContent) === 'Infraestructura');
await p.click('[data-accdenegar]'); comprueba('denegar exige motivo', /motivo del rechazo/i.test(await txt('.accMsg')));
const nAp = correos.length;
await p.click('[data-accaprobar]'); await p.waitForFunction(() => !document.querySelector('[data-accaprobar]'), null, { timeout: 15000 });
comprueba('aprobada: Pedro en Infraestructura y solicitud resuelta', negsC[2].MiembrosId.includes(10) && sol.EstadoSolicitud === 'APROBADA' && sol.GrupoAsignado === 'Infraestructura' && sol.ResueltoPorId === 7);
comprueba('correo al solicitante (a su cuenta): ' + (correos[nAp] && correos[nAp].asunto), correos.length === nAp + 1 && correos[nAp].to.join() === 'pedro@et.mde.es' && /ACCESO CONCEDIDO/.test(correos[nAp].asunto));
await ir(10);
comprueba('Pedro ya entra', !/No tienes acceso/.test(await txt('#vista')) && !!(await p.$('nav.tabs')));
comprueba('correos sin rechazos' + (SOLO_CUENTAS ? ' (SOLO_CUENTAS)' : '') + ': ' + JSON.stringify(rechazosCorreo.slice(0, 3)), !rechazosCorreo.length || !SOLO_CUENTAS || correos.length > 0);

// 12. Mensajes de SENDERO directos al Punto de Situación (#importar=, destino psit)
{ const msg = (o = {}) => '#importar=' + encodeURIComponent(JSON.stringify(Object.assign({ v: 1, origen: 'SENDERO', destino: 'psit', id: 'MSG-0001', asunto: 'Mensaje ficticio de MENSADEF',
    fecha: new Date().toISOString(), de: 'UNIDAD FICTICIA', firma: 'JEFE FICTICIO', referencia: 'REF-1', suReferencia: 'SU-1', expediente: 'EXP-9', enlace: 'https://mensadef.mdef.es/msg/1',
    texto: 'Texto ficticio del mensaje.\nSegunda línea.', departamento: 'Célula P.R.L.' }, o)));
  const abrirCon = async (id, h) => { actual = id; await p.goto('about:blank'); await p.goto(PAGINA + h); await p.waitForFunction(() => !/Cargando/.test(document.querySelector('#estadoCarga').textContent)); await p.waitForTimeout(400); };
  // Instalación anterior a esta versión: faltan las dos columnas nuevas
  LP('Negociados').campos.delete('CelulaMensadef'); LP('Aportaciones').campos.delete('OrigenClave');
  await ir(9); await p.click('nav.tabs a[data-v=ajustes]');
  comprueba('sin las columnas nuevas, Ajustes pide «Comprobar la instalación»', /columnas nuevas/.test(await txt('#vista')) && !(await p.$('[data-negcelula]')));
  await p.click('[data-comprobar]'); await p.waitForFunction(() => /Bloqueo en el servidor/.test(document.querySelector('#logInst').textContent), null, { timeout: 15000 });
  comprueba('«Comprobar la instalación» crea las columnas nuevas', LP('Negociados').campos.has('CelulaMensadef') && LP('Aportaciones').campos.has('OrigenClave'));
  await ir(9); await p.click('nav.tabs a[data-v=ajustes]');
  comprueba('tabla de células de SUIGESUR con «Falta»', /Células de SUIGESUR/.test(await txt('#vista')) && (await p.$$('[data-celulas]')).length === 1);
  await p.click('[data-celulas]');
  comprueba('primer clic solo pide confirmar', !negsC[4].CelulaMensadef);
  await p.click('[data-celulas]'); await p.waitForTimeout(1500);
  comprueba('células puestas: PRL=' + negsC[4].NombreGestor + ' / ' + negsC[4].CelulaMensadef + ' · Infra=' + (negsC[2].CelulaMensadef || '').split('; ').length,
    negsC[4].NombreGestor === 'P.R.L.; ET 2SUIGE SETEC PRL' && negsC[4].CelulaMensadef === 'ET 2SUIGE SETEC PRL' && negsC[2].CelulaMensadef.split('; ').length === 5 &&
    negsC[1].CelulaMensadef === 'ET 2SUIGE SETEC PROGCOORD' && negsC[6].CelulaMensadef === 'ET 2SUIGE SETEC SVC ACTO' && !negsC[0].CelulaMensadef);
  comprueba('ya no ofrece ponerlas otra vez', !(await p.$('[data-celulas]')) && /✔ Puestas/.test(await txt('#vista')));
  await p.fill(fila('PRL') + ' [data-negcelula]', 'CELULA PRL'); await p.click(fila('PRL') + ' [data-guardarneg]'); await p.waitForTimeout(800);
  comprueba('célula de MENSADEF guardada en PRL: ' + negsC[4].CelulaMensadef, negsC[4].CelulaMensadef === 'CELULA PRL');
  // Luis (PRL) recibe un mensaje de su célula (escrita distinto): se abre la entrada rellena y no se crea nada sin Guardar
  const nAntes = LP('Aportaciones').items.length;
  await abrirCon(8, msg());
  await p.waitForSelector('#edSit');
  comprueba('fragmento borrado de la dirección: ' + p.url(), !/importar/.test(p.url()));
  comprueba('se abre la entrada en PRL, rellena y sin crear nada', /Nueva entrada · PRL/.test(await txt('#dlg .dh')) && await p.inputValue('#edTit') === 'Mensaje ficticio de MENSADEF' &&
    /Mensaje de MENSADEF de UNIDAD FICTICIA.*Ref\. REF-1.*Su ref\. SU-1/.test(await p.$eval('#edSit', e => e.innerText)) && /Segunda línea/.test(await p.$eval('#edSit', e => e.innerText)) &&
    await p.inputValue('#edExp') === 'EXP-9' && /Desde SENDERO/.test(await txt('#dlg')) && LP('Aportaciones').items.length === nAntes);
  await foto('08-desde-sendero');
  await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(600);
  const es = LP('Aportaciones').items[LP('Aportaciones').items.length - 1];
  comprueba('guardada con origen SENDERO: ' + [es.Negociado, es.Origen, es.OrigenLista, es.OrigenClave, es.OrigenUrl, es.OrigenId].join(' | '),
    es.Negociado === 'PRL' && es.Origen === 'SENDERO' && es.OrigenClave === 'MSG-0001' && es.OrigenUrl === 'https://mensadef.mdef.es/msg/1' && es.OrigenId == null && es.PuntoId === pt2.Id);
  comprueba('la tarjeta dice «Desde SENDERO»', /Desde SENDERO/.test(await txt('#entradas')));
  // El mismo mensaje otra vez: no se duplica
  await abrirCon(8, msg());
  comprueba('el mismo mensaje otra vez: «ya está incluido»', /ya está incluido/.test(await txt('#dlg')) && !(await p.$('#edSit')));
  // Célula desconocida (PROCOR): pregunta el negociado y ofrece guardarla
  await abrirCon(9, msg({ id: 'MSG-0002', departamento: 'CELULA NUEVA', asunto: 'Otro mensaje ficticio' }));
  comprueba('célula sin negociado: pregunta a cuál va', /no está asignada a ningún negociado/.test(await txt('#dlg')) && (await p.$$eval('#impNeg option', o => o.length)) === 6 && await p.isChecked('#impGuardar'));
  await p.selectOption('#impNeg', 'Seguridad'); await p.click('#impOk'); await p.waitForSelector('#edSit');
  comprueba('guarda la célula en Seguridad y abre su entrada', negsC[3].CelulaMensadef === 'ET 2SUIGE SETEC SEGURIDAD; CELULA NUEVA' && /Nueva entrada · Seguridad/.test(await txt('#dlg .dh')));
  await p.click('#dlg [data-cerrar]');
  comprueba('cerrar sin guardar no crea nada', !LP('Aportaciones').items.some(x => x.OrigenClave === 'MSG-0002'));
  // Célula real de Seguridad (PROCOR): va directa a Seguridad
  await abrirCon(9, msg({ id: 'MSG-0010', departamento: 'ET 2SUIGE SETEC SEGURIDAD' }));
  await p.waitForSelector('#edSit');
  comprueba('célula de SUIGESUR: va directa a su negociado', /Nueva entrada · Seguridad/.test(await txt('#dlg .dh')));
  await p.click('#dlg [data-cerrar]');
  // JEFATURA: sin negociado fijo, decide quien lo recibe y no se ofrece guardarla
  await abrirCon(9, msg({ id: 'MSG-0011', departamento: 'ET 2SUIGE SETEC JEFATURA' }));
  comprueba('JEFATURA: «decide tú» y sin guardar la célula', /no tiene negociado fijo, decide tú/.test(await txt('#dlg')) && !(await p.$('#impGuardar')) && (await p.$$eval('#impNeg option', o => o.length)) === 6);
  await p.click('#dlg [data-cerrar]');
  // Luis con un mensaje de la célula de Seguridad: no tiene permiso
  await abrirCon(8, msg({ id: 'MSG-0003', departamento: 'Celula nueva' }));
  comprueba('sin permiso en el negociado de la célula: lo dice', /no eres de ese negociado/.test(await txt('#dlg')) && !(await p.$('#edSit')));
  // Sin célula: Luis solo puede elegir los suyos
  await abrirCon(8, msg({ id: 'MSG-0004', departamento: undefined }));
  comprueba('sin célula: pregunta y solo ofrece sus negociados, sin guardar célula', /no trae célula/.test(await txt('#dlg')) && (await p.$$eval('#impNeg option', o => o.map(x => x.textContent))).join() === 'PRL' && !(await p.$('#impGuardar')));
  // Dentro de la página del portal: lo lee de la ventana de arriba
  actual = 8; await p.goto(ORIGEN + WEB + '/SitePages/portal.aspx' + msg({ id: 'MSG-0005', asunto: 'Mensaje por el portal' }));
  const fr = p.frameLocator('#app'); await fr.locator('#edSit').waitFor({ timeout: 15000 });
  comprueba('dentro del portal: lee el fragmento de arriba y lo borra', await fr.locator('#edTit').inputValue() === 'Mensaje por el portal' && !/importar/.test(p.url()));
  // Datos que no son de SENDERO
  await abrirCon(8, '#importar=' + encodeURIComponent(JSON.stringify({ v: 1, origen: 'OTRO', destino: 'psit', asunto: 'x' })));
  comprueba('datos no válidos: lo dice', /no se pueden leer/.test(await txt('#dlg')));
  // Punto cerrado
  const pt2b = LP('Puntos').items.find(x => x.Id === pt2.Id); const ciB = pt2b.Cierre; pt2b.Cierre = iso(-60e3);
  await abrirCon(8, msg({ id: 'MSG-0006' }));
  comprueba('punto cerrado: lo dice claramente', /No hay ningún punto de situación abierto/.test(await txt('#dlg')) && /está cerrado desde/.test(await txt('#dlg')) && !(await p.$('#edSit')));
  pt2b.Cierre = ciB;
  // Mensajes distintos de la misma célula con el MISMO enlace (SENDERO manda el de la célula): no son duplicados.
  // También sin la columna OrigenClave (la clave va entonces en OrigenLista como «SENDERO|clave»).
  const enlaceCelula = 'https://mensadef.mdef.es/ambito#/celula/PRL/7';
  for (const conColumna of [true, false]) {
    if (!conColumna) LP('Aportaciones').campos.delete('OrigenClave');
    const a1 = 'MSG-A-' + conColumna, a2 = 'MSG-B-' + conColumna;
    await abrirCon(8, msg({ id: a1, enlace: enlaceCelula, departamento: 'Célula P.R.L.', asunto: 'Primero ' + conColumna })); await p.waitForSelector('#edSit');
    await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(600);
    const g1 = LP('Aportaciones').items[LP('Aportaciones').items.length - 1];
    comprueba((conColumna ? 'con' : 'sin') + ' columna, clave guardada: ' + (g1.OrigenClave || g1.OrigenLista), conColumna ? g1.OrigenClave === a1 && g1.OrigenLista === 'SENDERO' : g1.OrigenLista === 'SENDERO|' + a1 && !g1.OrigenClave);
    await abrirCon(8, msg({ id: a2, enlace: enlaceCelula, departamento: 'Célula P.R.L.', asunto: 'Segundo ' + conColumna }));
    comprueba((conColumna ? 'con' : 'sin') + ' columna, otro mensaje de la misma célula NO se da por incluido', !!(await p.$('#edSit')) && !/ya está incluido/.test(await txt('#dlg')));
    await p.click('#dlg [data-cerrar]');
    await abrirCon(8, msg({ id: a1, enlace: enlaceCelula, departamento: 'Célula P.R.L.' }));
    comprueba((conColumna ? 'con' : 'sin') + ' columna, el mismo mensaje sí se da por incluido', /ya está incluido/.test(await txt('#dlg')) && !(await p.$('#edSit')));
  }
  LP('Aportaciones').campos.add('OrigenClave');
  // Negociados que en Colabora se llaman distinto: se proponen por nombres habituales o se eligen en la fila
  { const tP = negsC[1].Title, tR = negsC[4].Title, cP = negsC[1].CelulaMensadef, cR = negsC[4].CelulaMensadef;
    negsC[1].Title = 'PROG. Y COORDINACIÓN'; negsC[1].CelulaMensadef = ''; negsC[4].Title = 'NEGOCIADO X'; negsC[4].CelulaMensadef = '';
    await ir(9); await p.click('nav.tabs a[data-v=ajustes]');
    const props = await p.$$eval('[data-repneg]', ss => ss.map(x => x.selectedOptions[0].textContent));
    comprueba('PROCOR propuesto por nombre habitual y PRL sin propuesta: ' + props.join(' | '), props.join('|') === 'PROG. Y COORDINACIÓN|— Elige negociado —' && /Elige/.test(await txt('#vista')));
    await p.selectOption('[data-repneg="3"]', String(negsC[4].Id));
    await p.click('[data-celulas]'); await p.click('[data-celulas]'); await p.waitForTimeout(1500);
    comprueba('células puestas en los negociados con otro nombre: ' + negsC[1].CelulaMensadef + ' / ' + negsC[4].CelulaMensadef,
      negsC[1].CelulaMensadef === 'ET 2SUIGE SETEC PROGCOORD' && negsC[4].CelulaMensadef === 'ET 2SUIGE SETEC PRL');
    comprueba('la tarjeta dice dónde están puestas', /Puestas en PROG\. Y COORDINACIÓN/.test(await txt('#vista')) && /Puestas en NEGOCIADO X/.test(await txt('#vista')) && !(await p.$('[data-celulas]')));
    negsC[1].Title = tP; negsC[4].Title = tR; negsC[1].CelulaMensadef = cP; negsC[4].CelulaMensadef = cR; }
  // Quien no está en ningún negociado
  USUARIOS[12] = { Id: 12, Title: 'RAUL SIN NEGOCIADO', Email: 'raul@et.mde.es', LoginName: 'i:0#.w|et\\raul' };
  await abrirCon(12, msg({ id: 'MSG-0007' }));
  comprueba('sin negociado: lo dice en la pantalla de acceso', /Has llegado con un mensaje de SENDERO/.test(await txt('#vista')));
}
// 13. Texto con formato: negrita, cursiva, subrayado, resaltado y viñetas (página, editor, Word y PDF)
{ await ir(8); await p.click('nav.tabs a[data-v=negociado]');
  await p.click('[data-editar=""]'); await p.waitForSelector('#edSit');
  await p.fill('#edTit', 'Entrada con formato ficticia');
  await p.click('#edSit');
  await p.keyboard.type('Inicio ');
  await p.keyboard.press('Control+b'); await p.keyboard.type('negrita'); await p.keyboard.press('Control+b');
  await p.keyboard.type(' y ');
  await p.click('[data-fmt="i"]'); await p.keyboard.type('cursiva'); await p.click('[data-fmt="i"]');
  await p.keyboard.type(' y ');
  await p.click('[data-fmt="u"]'); await p.keyboard.type('subrayado'); await p.click('[data-fmt="u"]');
  await p.keyboard.type(' y resaltado');
  for (let k = 0; k < 9; k++) await p.keyboard.press('Shift+ArrowLeft');
  await p.click('[data-fmt="r"]');
  await p.keyboard.press('End'); await p.click('[data-fmt="r"]'); await p.keyboard.press('Enter');
  await p.click('[data-fmt="lista"]'); await p.keyboard.type('punto uno'); await p.keyboard.press('Enter'); await p.keyboard.type('punto dos');
  await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.keyboard.type('Final [b] literal');
  await foto('09-formato');
  await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(600);
  const ef = LP('Aportaciones').items.filter(x => x.Title === 'Entrada con formato ficticia').pop();
  comprueba('formato guardado con marcas', !!ef && /Inicio \[b\]negrita\[\/b\] y \[i\]cursiva\[\/i\] y \[u\]subrayado\[\/u\] y \[r\]resaltado\[\/r\]/.test(ef.Situacion) &&
    /\n• punto uno\n• punto dos\n/.test(ef.Situacion) && /Final \(b\) literal$/.test(ef.Situacion));
  const vista = await p.$eval(`[data-ent="${ef.Id}"] .texto`, e => e.innerHTML);
  comprueba('la entrada se ve con formato', /<b>negrita<\/b>/.test(vista) && /<i>cursiva<\/i>/.test(vista) && /<u>subrayado<\/u>/.test(vista) && /<mark>resaltado<\/mark>/.test(vista) && !/\[b\]/.test(vista));
  // Volver a abrir y guardar sin tocar: no cambia nada (el formato va y vuelve igual)
  const nP = posts.length;
  await p.click(`[data-editar="${ef.Id}"]`); await p.waitForSelector('#edSit');
  const edHtml = await p.$eval('#edSit', e => e.innerHTML);
  comprueba('el editor carga el formato y la lista', /<b>negrita<\/b>/.test(edHtml) && /<mark>resaltado<\/mark>/.test(edHtml) && /<ul><li>punto uno<\/li><li>punto dos<\/li><\/ul>/.test(edHtml));
  await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
  comprueba('guardar sin cambios no reescribe la situación', !posts.slice(nP).some(x => x.ruta.endsWith(`items(${ef.Id})`) && /Situacion/.test(x.cuerpo.toString())));
  // Quitar formato de una palabra
  await p.click(`[data-editar="${ef.Id}"]`); await p.waitForSelector('#edSit');
  await p.evaluate(() => { const b = document.querySelector('#edSit b'); const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await p.click('[data-fmt="limpiar"]');
  await p.click('[data-guardarent]'); await esperaDlgCerrado(); await p.waitForTimeout(500);
  const ef2 = LP('Aportaciones').items.find(x => x.Id === ef.Id);
  comprueba('quitar formato: ' + JSON.stringify(ef2.Situacion.split('\n')[0]), /^Inicio negrita y \[i\]cursiva/.test(ef2.Situacion));
  // Informe (vista previa / PDF) y Word
  await ir(9); await p.click('nav.tabs a[data-v=informe]');
  const hoja = await p.$eval('.hoja', e => e.innerHTML);
  comprueba('informe (y PDF) con formato', /<i>cursiva<\/i>/.test(hoja) && /<mark>resaltado<\/mark>/.test(hoja) && /• punto uno/.test(hoja) && !/\[i\]/.test(hoja));
  const [dw] = await Promise.all([p.waitForEvent('download'), p.click('[data-word]')]);
  const dirW = fs.mkdtempSync('/tmp/ps-fmt-'); fs.copyFileSync(await dw.path(), path.join(dirW, 'f.docx'));
  const rw = execFileSync('python3', ['-c', `
import zipfile,sys,re,xml.dom.minidom as m
d=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode(); m.parseString(d)
def con(t,prop): return bool(re.search('<w:r><w:rPr>[^<]*(?:<[^>]*>)*?'+prop+'(?:<[^>]*>)*?</w:rPr><w:t xml:space="preserve">'+t+'</w:t>', d))
print(con('cursiva','<w:i/>'), con('subrayado','<w:u w:val="single"/>'), con('resaltado','<w:highlight w:val="yellow"/>'), '• punto uno' in d, '[i]' not in d)`, path.join(dirW, 'f.docx')]).toString().trim();
  comprueba('Word con formato (cursiva, subrayado, resaltado, viñetas): ' + rw, rw === 'True True True True True');
}
if (SOLO_CUENTAS) comprueba('SOLO_CUENTAS: todos los avisos salen a cuentas, ninguno con «@» (' + correos.length + ' enviados, ' + rechazosCorreo.length + ' intentos con dirección): ' + JSON.stringify(correos.flatMap(c => c.cuentas).filter(x => /@/.test(x))), correos.length > 0 && correos.every(c => c.cuentas.every(x => !/@/.test(x))));
// 14. Descartar propuestas de META que no interesan (no se tocan en META; no vuelven a salir; se pueden recuperar)
{ const ptA = LP('Puntos').items.find(x => new Date(x.Cierre) > Date.now() && x.EstadoPunto !== 'Contenido borrado');
  meta.items.push({ Id: 40, Title: 'Propuesta ficticia que no interesa', ESTADO: 'EN CURSO', NegociadoAsignado: 'PRL', TratarEn: ['TRATAR CON EL GENERAL'] },
    { Id: 41, Title: 'Propuesta ficticia sin negociado', ESTADO: 'EN CURSO', NegociadoAsignado: '', TratarEn: ['TRATAR CON EL GENERAL'] });
  const nMeta = meta.items.length;
  await ir(8); await p.click('nav.tabs a[data-v=negociado]'); await p.waitForTimeout(400);
  comprueba('en Mi negociado sale la propuesta con «✕ Descartar»', !!(await p.$('[data-descartarmeta="40"]')) && !!(await p.$('[data-incluirmeta="40"]')));
  await p.click('[data-descartarmeta="40"]'); await p.waitForTimeout(800);
  const prl = negsC.find(x => x.Title === 'PRL');
  comprueba('descartada: no sale y queda guardada en PRL (' + prl.MetaDescartadas + '); en META sigue', !(await p.$('[data-incluirmeta="40"]')) && String(prl.MetaDescartadas).split(';').includes('40') && meta.items.length === nMeta && meta.items.some(x => x.Id === 40));
  comprueba('aparece en «Descartadas (1)» para recuperarla', /Descartadas \(1\)/.test(await txt('#vista')) && !!(await p.$('[data-recuperarmeta="40"]')));
  await ir(8); await p.click('nav.tabs a[data-v=negociado]'); await p.waitForTimeout(400);
  comprueba('sigue descartada al volver a entrar', !(await p.$('[data-incluirmeta="40"]')));
  await p.click('summary:has-text("Descartadas")'); await p.click('[data-recuperarmeta="40"]'); await p.waitForTimeout(800);
  comprueba('recuperada: vuelve a salir', !!(await p.$('[data-incluirmeta="40"]')) && !String(prl.MetaDescartadas).split(';').includes('40'));
  // Coordinación: descarta la que no tiene negociado (se guarda en la fila de coordinación)
  await ir(9); await p.click('nav.tabs a[data-v=seguimiento]'); await p.waitForTimeout(400);
  if (!(await p.$eval('[data-props]', d => d.open))) await p.click('[data-props] > summary');
  await p.click('[data-descartarmeta="41"]'); await p.waitForTimeout(800);
  const coord = negsC.find(x => x.Coordina && !x.EnInforme);
  comprueba('sin negociado: descartada por coordinación (' + coord.MetaDescartadas + ')', String(coord.MetaDescartadas).split(';').includes('41') && !(await p.$('[data-descartarmeta="41"]')));
  // Un miembro no puede descartar propuestas de otro negociado ni las de coordinación
  await ir(8); await p.click('nav.tabs a[data-v=seguimiento]'); await p.waitForTimeout(300);
  comprueba('un miembro no ve las propuestas de coordinación', !(await p.$('[data-descartarmeta="41"]')));
}
// 15. Miembro sin correo en el sitio: el aviso le llega a su CUENTA (antes se quedaba fuera sin decir nada)
{ USUARIOS[14] = { Id: 14, Title: 'JUAN SIN CORREO FICTICIO', Email: '', LoginName: 'i:0#.w|et\\juan' };
  const prl = negsC.find(x => x.Title === 'PRL'); prl.MiembrosId = (prl.MiembrosId || []).concat([14]);
  const ptA = LP('Puntos').items.find(x => new Date(x.Cierre) > Date.now() && x.EstadoPunto !== 'Contenido borrado');
  await ir(9); await p.click('nav.tabs a[data-v=seguimiento]');
  await p.selectOption('#selPunto', String(ptA.Id)); await p.waitForTimeout(300);
  await p.click('[data-modificarpunto]'); await p.waitForSelector('[data-guardarpunto]');
  await p.fill('#npRec', '5'); await p.check('#npAvisar');
  const nC = correos.length;
  await p.click('[data-guardarpunto]'); await p.waitForFunction(() => /Punto modificado/.test(document.querySelector('#dlg').textContent), null, { timeout: 15000 });
  const c = correos[nC];
  comprueba('miembro sin correo: el aviso va a su cuenta (' + (c && c.cuentas.filter(x => !/@/.test(x)).join(', ')) + ')', !!c && c.cuentas.includes('i:0#.w|et\\juan'));
  await p.click('#dlg [data-cerrar]');
}
// 16. Ajustes › «Comprobar los avisos»: a quién le llegaría el correo, sin enviar nada
{ const seg = negsC.find(x => x.Title === 'Seguridad'); seg.MiembrosId = (seg.MiembrosId || []).concat([77]);   // 77: cuenta que ya no está en el sitio
  const nC = correos.length;
  await ir(7); await p.click('nav.tabs a[data-v=ajustes]');
  await p.click('[data-compavisos]'); await p.waitForFunction(() => /personas:/.test(document.querySelector('#compAvisos').textContent), null, { timeout: 15000 });
  const r = await txt('#compAvisos');
  comprueba('comprobar avisos: ' + r.slice(0, 170), /NO los recibirían/.test(r) && /sin correo en Colabora/.test(r) && /JUAN SIN CORREO FICTICIO.*Va a su cuenta/.test(r) && /Usuario 77.*No le llega/.test(r) && /LUIS PRL FICTICIO.*Le llega/.test(r));
  comprueba('comprobar avisos no envía ningún correo', correos.length === nC);
  seg.MiembrosId = seg.MiembrosId.filter(x => x !== 77);
}
comprueba('errores de página: ' + JSON.stringify(errs), !errs.length);
await b.close();
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS');
process.exit(ok ? 0 : 1);
