// Prueba de «Quién ve los expedientes de META» (solo en META, la copia --propio) contra un Colabora simulado.
// node colabora/pruebas/meta-acceso.mjs   ·   VERBOSE=1 (SharePoint 2013)   ·   TAREAS_HTML=colabora/colabora/META.html (copia protegida)
// Datos ficticios. Usuario 7 (USUARIO DE PRUEBA).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = process.env.TAREAS_HTML ? fs.readFileSync(process.env.TAREAS_HTML, 'utf8')
  : fs.readFileSync(new URL('../tareas-nlt-colabora.html', import.meta.url), 'utf8').replace('var PROPIO = false;', 'var PROPIO = true;');
const LISTA = 'Gestor de Tareas MENSADEF', MIEM = 'META MIEMBROS';
const VERBOSE = !!process.env.VERBOSE;
const aVerbose = j => j && !j.d && !j.error ? (Array.isArray(j.value) ? { d: { results: j.value, __next: j['odata.nextLink'] } } : { d: j }) : j;
const WEB = '/et/SUIGESUR/JSUIGE';
const h = n => new Date(Date.now() + n * 3600e3).toISOString();
const YO = { Id: 7, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, OTRO = { Id: 20, Title: 'OTRA PERSONA', EMail: 'otra@et.mde.es' };
const per = l => VERBOSE ? { results: l } : l;
// 1 lo creé yo · 2 soy responsable · 3 estoy implicado · 4 de PRL (asignado) · 5 PRL como implicado · 6 de Seguridad, nada mío
const items = [
  { Id: 1, Title: 'Creado por mí', Author: YO, ResponsableDeLaInformacion: OTRO, NegociadoAsignado: 'Seguridad' },
  { Id: 2, Title: 'Soy responsable', Author: OTRO, ResponsableDeLaInformacion: YO, NegociadoAsignado: 'Seguridad' },
  { Id: 3, Title: 'Estoy implicado', Author: OTRO, ResponsableDeLaInformacion: OTRO, PersonalImplicado0: [YO], NegociadoAsignado: 'Seguridad' },
  { Id: 4, Title: 'Del negociado PRL', Author: OTRO, ResponsableDeLaInformacion: OTRO, NegociadoAsignado: 'PRL' },
  { Id: 5, Title: 'PRL implicado', Author: OTRO, ResponsableDeLaInformacion: OTRO, NegociadoAsignado: 'Seguridad', NegociadosImplicados: ['PRL'] },
  { Id: 6, Title: 'Ajeno de Seguridad', Author: OTRO, ResponsableDeLaInformacion: OTRO, NegociadoAsignado: 'Seguridad' },
].map(x => ({ ESTADO: 'EN CURSO', Prioridad: 'Media', DescripcionDelAsunto: 'Texto ficticio', Comentarios: '', Created: h(-48), Modified: h(-24), Editor: OTRO,
  PersonalImplicado0: [], NegociadosImplicados: [], ...x }));
let admin = false, hayMiembros = true, filas = [], haySolic = false, solicitudes = [], correos = []; const SOL = 'META SOLICITUDES';
const posts = [];
let ok = true; const comprueba = (txt, c, extra) => { console.log((c ? '✔ ' : '✘ ') + txt + (extra !== undefined ? ': ' + extra : '')); if (!c) ok = false; };

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route('https://colabora.mdef.es/**', async r0 => {
  const req = r0.request();
  const ful = o => r0.fulfill(VERBOSE && o.json ? { ...o, json: aVerbose(o.json) } : o);
  if (VERBOSE && req.method() === 'GET' && /odata=nometadata/.test(req.headers().accept || '')) return r0.fulfill({ status: 406, body: '' });
  const u = decodeURIComponent(req.url());
  if (!u.includes('/_api/')) return ful({ body: html, contentType: 'text/html' });
  const resto = u.split('/_api/')[1];
  const lst = (resto.match(/getbytitle\('([^']*)'\)/) || [])[1] || '';
  if (req.method() === 'POST') {
    posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
    if (resto === 'contextinfo') return ful({ json: { d: { GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } } } });
    const c = JSON.parse(req.postData() || '{}');
    if (resto === 'web/lists') { if (c.Title === MIEM) hayMiembros = true; if (c.Title === SOL) haySolic = true; return ful({ status: 201, json: { d: { Id: 'm' } } }); }
    if (resto === 'SP.Utilities.Utility.SendEmail') { correos.push(c.properties); return ful({ json: { d: {} } }); }
    if (lst === SOL) {
      if (/createfieldasxml|breakroleinheritance|addroleassignment/.test(resto) || !resto.includes('/items')) return ful({ json: { d: {} } });
      const m = resto.match(/items\((\d+)\)$/); delete c.__metadata;
      if (m) { Object.assign(solicitudes.find(f => f.Id === +m[1]), c); return ful({ status: 204, body: '' }); }
      const quien = [YO, OTRO].find(x => x.Id === c.PersonaId); const f = { Id: solicitudes.length + 1, ...c, Persona: quien, Created: new Date().toISOString() }; solicitudes.push(f); return ful({ status: 201, json: { d: f } });
    }
    if (resto === 'web/ensureuser') return ful({ json: { d: { Id: 30, Title: 'NUEVA PERSONA', Email: 'nueva@et.mde.es' } } });
    if (resto.includes('clientPeoplePickerSearchUser')) return ful({ json: { d: { ClientPeoplePickerSearchUser: JSON.stringify([{ Key: 'i:0#.w|et\\nueva', DisplayText: 'NUEVA PERSONA', EntityType: 'User', EntityData: { Email: 'nueva@et.mde.es' } }]) } } });
    if (lst === MIEM) {
      if (resto.includes('createfieldasxml')) return ful({ json: { d: {} } });
      if (!admin) return ful({ status: 403, json: { error: { message: { value: 'Acceso denegado.' } } } });
      const rc = resto.match(/items\((\d+)\)\/recycle\(\)/); if (rc) { filas = filas.filter(f => f.Id !== +rc[1]); return ful({ json: { d: { Recycle: 'g' } } }); }
      const m = resto.match(/items\((\d+)\)$/); delete c.__metadata;
      if (m) { Object.assign(filas.find(f => f.Id === +m[1]), c); return ful({ status: 204, body: '' }); }
      const quien = [YO, OTRO, { Id: 30, Title: 'NUEVA PERSONA', EMail: 'nueva@et.mde.es' }].find(x => x.Id === c.PersonaId);
      const f = { Id: filas.length ? Math.max(...filas.map(x => x.Id)) + 1 : 1, ...c, Persona: quien }; filas.push(f); return ful({ status: 201, json: { d: f } });
    }
    return ful({ status: 400, body: '' });
  }
  if (resto.startsWith('web?')) return ful({ json: { Url: 'https://colabora.mdef.es' + WEB, Title: 'JSUIGE' } });
  if (resto.startsWith('web/currentuser')) return ful({ json: { Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' } });
  if (lst === SOL) {
    if (!haySolic) return ful({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
    if (!resto.includes('/items')) return ful({ json: { Id: '{5a1}', Title: SOL, ListItemEntityTypeFullName: 'SP.Data.META_x0020_SOLICITUDESListItem', ReadSecurity: 2, WriteSecurity: 2 } });
    return ful({ json: { value: solicitudes.filter(f => admin || f.PersonaId === 7).map(f => ({ ...f })).reverse() } });
  }
  if (resto.startsWith('web/roleassignments')) return ful({ json: { value: [{ PrincipalId: 99, Member: { Id: 99, Title: 'MDEF\\usuarios del dominio', LoginName: 'c:0-.f|rolemanager|usuarios del dominio' } }] } });
  if (resto.startsWith('web/roledefinitions/getbytype(3)')) return ful({ json: { Id: 1073741827 } });
  if (lst === MIEM) {
    if (!hayMiembros) return ful({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
    if (!resto.includes('/items')) return ful({ json: { Id: 'm', Title: MIEM, ListItemEntityTypeFullName: 'SP.Data.META_x0020_MIEMBROSListItem' } });
    return ful({ json: { value: filas.map(f => ({ Id: f.Id, Title: f.Title, Negociados: f.Negociados, VeTodo: f.VeTodo, Persona: f.Persona })) } });
  }
  if (lst === LISTA) {
    if (resto.includes('/fields?')) return ful({ json: { value: [{ InternalName: 'ESTADO', Choices: per(['EN CURSO', 'FINALIZADO']) }, { InternalName: 'NegociadoAsignado', Choices: per(['Seguridad', 'PRL', 'Infraestructura', 'ET 2SUIGE SETEC PRL']) }, { InternalName: 'NegociadosImplicados', Choices: per(['Seguridad', 'PRL', 'Infraestructura']) }] } });
    if (resto.includes('getbyinternalnameortitle')) return ful({ json: { InternalName: 'Comentarios', AppendOnly: false } });
    if (resto.includes('/items')) return ful({ json: { value: items.map(x => ({ ...x, PersonalImplicado0: per(x.PersonalImplicado0), NegociadosImplicados: per(x.NegociadosImplicados) })) } });
    return ful({ json: { Id: 'g', Title: LISTA, ItemCount: items.length, ListItemEntityTypeFullName: 'SP.Data.GestorListItem', EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x7FFFFFFF : 0x7) }, RootFolder: { ServerRelativeUrl: WEB + '/Lists/Gestor' } } });
  }
  if (resto.includes('siteusers')) return ful({ json: { value: [YO, OTRO].map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail, PrincipalType: 1 })) } });
  if (resto.includes('_vti_bin')) return ful({ json: { value: [] } });
  return ful({ status: 404, body: '' });
});
const URL_ = 'https://colabora.mdef.es' + WEB + '/Documentos%20compartidos/meta.html';
const vistos = async () => { await p.selectOption('#fquien', 'todos').catch(() => {}); await p.waitForTimeout(300); return [...new Set(await p.$$eval('.tarea[data-id]', n => n.map(x => Number(x.dataset.id))))].sort().join(','); };
const recargar = async () => { await p.click('#recargar'); await p.waitForTimeout(1500); };
const ajVisible = () => p.$eval('#tabs a[data-v="ajustes"]', a => getComputedStyle(a).display !== 'none');

// 1. Sin la lista de miembros: solo lo suyo
hayMiembros = false;
await p.goto(URL_); await p.waitForTimeout(1800);
comprueba('sin lista de miembros ve lo que creó, lo suyo como responsable y donde está implicado', (await vistos()) === '1,2,3', await vistos());
comprueba('cabecera con «x de y»', /3 de 6 asuntos/.test(await p.textContent('#estadoCarga')), await p.textContent('#estadoCarga'));
comprueba('lo explica en la bienvenida', /Ves los expedientes que has creado/.test(await p.textContent('.hero')));
comprueba('no ve Ajustes', !(await ajVisible()));

// 2. Dado de alta en PRL
hayMiembros = true; filas = [{ Id: 1, Title: 'USUARIO DE PRUEBA', Persona: YO, Negociados: 'PRL', VeTodo: false }];
await recargar();
comprueba('con PRL ve también los de PRL (asignado o implicado)', (await vistos()) === '1,2,3,4,5', await vistos());
comprueba('la bienvenida nombra sus negociados', /y los de PRL/.test(await p.textContent('.hero')));
// 3. Lo ve todo
filas[0].VeTodo = true; await recargar();
comprueba('«Lo ve todo» ve los 6', (await vistos()) === '1,2,3,4,5,6', await vistos());
// 4. Control total: todo, y Ajustes con el alta
filas = []; hayMiembros = false; admin = true; await recargar();
comprueba('Control total ve los 6', (await vistos()) === '1,2,3,4,5,6');
comprueba('Control total ve Ajustes', await ajVisible());
await p.click('#tabs a[data-v="ajustes"]'); await p.waitForTimeout(400);
comprueba('Ajustes ofrece crear la lista', !!(await p.$('[data-mmcrear]')));
posts.length = 0; await p.click('[data-mmcrear]'); await p.waitForTimeout(1500);
comprueba('crea la lista y sus 3 columnas', posts.some(x => x.ruta === 'web/lists' && /META MIEMBROS/.test(x.cuerpo)) && posts.filter(x => x.ruta.includes('createfieldasxml')).length === 3);
comprueba('después muestra el alta', !!(await p.$('#mmPersona')));
// Alta sin elegir persona
await p.click('[data-mmguardar]'); await p.waitForTimeout(200);
comprueba('sin persona lo pide', /Elige la persona/.test(await p.textContent('#mmMsg')));
await p.fill('#mmPersona', 'OTRA'); await p.waitForTimeout(400);
await p.click('#mmSug [data-sug="0"]'); await p.waitForTimeout(500);
await p.click('[data-mmguardar]'); await p.waitForTimeout(200);
comprueba('sin negociados ni «lo ve todo» lo pide', /al menos un (departamento|negociado)/.test(await p.textContent('#mmMsg')));
// Solo se ofrecen células de MENSADEF; los nombres de esta prueba se añaden con el campo «Añadir otra célula»
comprueba('no ofrece negociados antiguos', !(await p.$('#mmNegs input[value="PRL"]')));
for (const n of ['PRL', 'Infraestructura']) { await p.fill('#mmDepTxt', n); await p.click('[data-mmdep]'); }
await p.click('[data-mmguardar]'); await p.waitForTimeout(1200);
comprueba('alta guardada', filas.length === 1 && filas[0].PersonaId === 20 && filas[0].Negociados === 'Infraestructura; PRL' && filas[0].VeTodo === false, JSON.stringify(filas[0] && { P: filas[0].PersonaId, N: filas[0].Negociados, T: filas[0].VeTodo }));
comprueba('sale en la tabla', /OTRA PERSONA.*Infraestructura, PRL/.test((await p.textContent('#vista table.t')).replace(/\s+/g, ' ')));
// Del directorio (no está en el sitio): ensureuser
await p.fill('#mmPersona', 'NUEVA'); await p.waitForTimeout(900);
const sug = await p.$$eval('#mmSug [data-sug]', n => n.map(x => x.textContent));
comprueba('busca en el directorio', sug.some(x => /NUEVA PERSONA/.test(x)), sug.join(' | '));
await p.click('#mmSug [data-sug="0"]'); await p.waitForTimeout(600); await p.check('#mmTodo'); await p.click('[data-mmguardar]'); await p.waitForTimeout(1200);
comprueba('alta del directorio con «lo ve todo»', filas.some(f => f.PersonaId === 30 && f.VeTodo === true));
// Modificar
await p.click('[data-mmeditar="1"]'); await p.waitForTimeout(300);
comprueba('modificar muestra sus negociados marcados', await p.isChecked('#mmNegs input[value="PRL"]') && await p.isChecked('#mmNegs input[value="Infraestructura"]'));
await p.uncheck('#mmNegs input[value="Infraestructura"]'); posts.length = 0; await p.click('[data-mmguardar]'); await p.waitForTimeout(1200);
comprueba('cambio guardado con MERGE', filas.find(f => f.Id === 1).Negociados === 'PRL' && posts.some(x => /items\(1\)$/.test(x.ruta) && x.cab['x-http-method'] === 'MERGE'));
// Elegir a alguien ya dado de alta pasa a modificarlo (no duplica)
await p.fill('#mmPersona', 'OTRA'); await p.waitForTimeout(400); await p.click('#mmSug [data-sug="0"]'); await p.waitForTimeout(500);
comprueba('elegir a quien ya está pasa a modificarlo', /Modificar a OTRA PERSONA/.test(await p.textContent('#vista')));
await p.click('[data-mmcancelar]'); await p.waitForTimeout(200);
// Quitar con doble pulsación
await p.click('[data-mmquitar="1"]'); await p.waitForTimeout(150);
comprueba('quitar pide confirmación', /Pulsa otra vez/.test(await p.textContent('[data-mmquitar="1"]')) && filas.length === 2);
await p.click('[data-mmquitar="1"]'); await p.waitForTimeout(1200);
comprueba('quitado (a la papelera)', filas.length === 1 && !filas.some(f => f.Id === 1));
// 5. Sin Control total no puede escribir aunque fuerce
admin = false; await recargar();
comprueba('sin Control total vuelve a Tareas y no ve Ajustes', !(await ajVisible()) && !(await p.$('#mmPersona')));
// 6. Sin alta (con la lista de miembros creada): no ve nada y pide acceso
filas = filas.filter(f => f.PersonaId !== 7 && (!f.Persona || f.Persona.Id !== 7)); await recargar();
let t6 = (await p.textContent('#vista')).replace(/\s+/g, ' ');
comprueba('sin alta y sin lista de solicitudes: no ve expedientes y se lo explica', /Aún no tienes acceso a META/.test(t6) && /no ha preparado las solicitudes/.test(t6) && !(await p.$('.tarea[data-id]')) && await p.isHidden('#tabs'), t6.slice(0, 160));
// el administrador crea la lista de solicitudes
admin = true; await recargar(); await p.click('#tabs a[data-v="ajustes"]'); await p.waitForTimeout(400);
posts.length = 0; await p.click('[data-solcrear]'); await p.waitForTimeout(2000);
comprueba('crea la lista de solicitudes, sus 5 columnas, solo sus elementos y abierta a todos', posts.some(x => x.ruta === 'web/lists' && /META SOLICITUDES/.test(x.cuerpo)) && posts.filter(x => x.ruta.includes(SOL) && x.ruta.includes('createfieldasxml')).length === 5
  && posts.some(x => /breakroleinheritance/.test(x.ruta)) && posts.some(x => /addroleassignment\(principalid=99,roledefid=1073741827\)/.test(x.ruta)) && posts.some(x => /ReadSecurity/.test(x.cuerpo || '')));
// el usuario pide acceso
admin = false; await recargar(); t6 = (await p.textContent('#vista')).replace(/\s+/g, ' ');
comprueba('ofrece pedir acceso con los departamentos', /Solicitar acceso/.test(t6) && !!(await p.$('#solDeps input')), t6.slice(0, 100));
await p.click('[data-solpedir]'); await p.waitForTimeout(200); comprueba('sin departamento lo pide', /Marca tu departamento/.test(await p.textContent('#solMsg')));
await p.check('#solDeps input >> nth=0'); await p.fill('#solMotivo', 'Destino nuevo'); await p.click('[data-solpedir]'); await p.waitForTimeout(1200);
comprueba('solicitud guardada', solicitudes.length === 1 && solicitudes[0].PersonaId === 7 && solicitudes[0].Estado === 'Pendiente' && !!solicitudes[0].Departamentos, JSON.stringify(solicitudes[0]));
comprueba('luego ve que está pendiente', /Está pendiente/.test(await p.textContent('#vista')));
// el administrador la ve y lo da de alta
admin = true; await recargar();
comprueba('aviso de solicitudes pendientes en la bienvenida', /1 solicitud de acceso pendiente/.test(await p.textContent('.hero')));
await p.click('#tabs a[data-v="ajustes"]'); await p.waitForTimeout(400);
comprueba('la solicitud sale en Ajustes', /USUARIO DE PRUEBA/.test(await p.textContent('#vista table.t:last-of-type')));
await p.click('[data-solalta="1"]'); await p.waitForTimeout(1500);
comprueba('dado de alta en su departamento y solicitud aprobada', filas.some(f => f.PersonaId === 7 && f.Negociados === solicitudes[0].Departamentos) && solicitudes[0].Estado === 'Aprobada');
comprueba('correo de acceso concedido', correos.some(c => /acceso concedido/.test(c.Subject)));
admin = false; await recargar(); comprueba('ya entra en META', !(await p.isHidden('#tabs')) && !/Aún no tienes acceso/.test(await p.textContent('#vista')));
// denegar: otra solicitud
filas = filas.filter(f => f.PersonaId !== 7); await recargar(); await p.check('#solDeps input >> nth=0'); await p.click('[data-solpedir]'); await p.waitForTimeout(1000);
admin = true; await recargar(); await p.click('#tabs a[data-v="ajustes"]'); await p.waitForTimeout(400);
p.once('dialog', d => d.accept('No corresponde a la sección')); await p.click('[data-soldeny="2"]'); await p.waitForTimeout(1200);
comprueba('denegada con motivo y correo', solicitudes[1].Estado === 'Denegada' && solicitudes[1].Respuesta === 'No corresponde a la sección' && correos.some(c => /denegada/.test(c.Subject)));
admin = false; await recargar(); comprueba('el usuario ve el motivo y puede pedir otra vez', /se denegó: «No corresponde a la sección»/.test(await p.textContent('#vista')) && !!(await p.$('[data-solpedir]')));
comprueba('errores de página', errs.length === 0, JSON.stringify(errs));
await b.close();
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS');
process.exit(ok ? 0 : 1);
