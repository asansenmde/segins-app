// Prueba de «📋 Incluir en el Punto de Situación» (META / Gestor de Tareas → aplicación Puntos de Situación) contra un Colabora simulado.
// node colabora/pruebas/punto-situacion.mjs   ·   VERBOSE=1 (SharePoint 2013)   ·   TAREAS_HTML=colabora/colabora/tareas-nlt-colabora-mensadef.html (copia protegida)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.TAREAS_HTML || new URL('../tareas-nlt-colabora.html', import.meta.url), 'utf8');
const LISTA = /mensadef/.test(process.env.TAREAS_HTML || '') ? 'Gestor de Tareas MENSADEF' : /pruebas/.test(process.env.TAREAS_HTML || '') ? 'Gestor de Tareas PRUEBAS' : 'Gestor de Tareas';
const SUF = /PRUEBAS$/.test(LISTA) ? ' PRUEBAS' : '';
const VERBOSE = !!process.env.VERBOSE;
const aVerbose = j => j && !j.d && !j.error ? (Array.isArray(j.value) ? { d: { results: j.value, __next: j['odata.nextLink'] } } : { d: j }) : j;
const WEB = '/et/SUIGESUR/JSUIGE';
const h = n => new Date(Date.now() + n * 3600e3).toISOString();
const items = [
  { Id: 1, Title: 'Revisión de extintores del edificio B', ESTADO: 'EN CURSO', Prioridad: 'Alta', NegociadoAsignado: 'PRL', DescripcionDelAsunto: '<p>Descripción ficticia</p>', Comentarios: '', TratarEn: [] },
  { Id: 2, Title: 'Asunto de infraestructura', ESTADO: 'EN CURSO', Prioridad: 'Media', NegociadoAsignado: 'Infraestructura', DescripcionDelAsunto: 'Otra descripción', Comentarios: '', TratarEn: [] },
].map(x => ({ ...x, Created: h(-48), Modified: h(-24), Author: { Title: 'AUTOR' }, Editor: { Title: 'EDITOR' }, ResponsableDeLaInformacion: { Id: 7, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, PersonalImplicado0: [], NegociadosImplicados: [] }));
let instalada = false, validacion = false, soyPRL = true;
const puntos = [{ Id: 45, Title: 'Punto de Situación 10/11/2026', Referencia: 'PS-2026-045', FechaPunto: h(24), Apertura: h(-20), Cierre: h(4), EstadoPunto: 'Abierto' },
  { Id: 44, Title: 'Punto de Situación 03/11/2026', Referencia: 'PS-2026-044', FechaPunto: h(-150), Apertura: h(-200), Cierre: h(-148), EstadoPunto: 'Cerrado' }];
const miembros = ids => VERBOSE ? { results: ids.map(Id => ({ Id })) } : ids.map(Id => ({ Id }));
const negs = () => [['PROCOR', 1, 'PROCOR', [50], true], ['Infraestructura', 2, 'Infraestructura', [51], false], ['Seguridad', 3, 'Seguridad', [], false],
  ['PRL', 4, 'PRL;Prevención de Riesgos Laborales', soyPRL ? [7] : [], false], ['Calidad de Vida', 5, 'Calidad de Vida', [], false], ['Acuartelamiento', 6, '', [], false]]
  .map(([Title, Orden, NombreGestor, m, Coordina], i) => ({ Id: i + 1, Title, Orden, NombreGestor, Miembros: miembros(m), Coordina, EnInforme: true }));
const aport = [];
const posts = [];
let ok = true; const comprueba = (txt, c) => { console.log((c ? '✔ ' : '✘ ') + txt); if (!c) ok = false; };

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
    const c = JSON.parse(req.postData() || '{}'); delete c.__metadata;
    if (lst === 'PS Aportaciones' + SUF) {
      if (validacion) return ful({ status: 400, json: { error: { message: { value: 'List data validation failed.' } } } });
      const m = resto.match(/items\((\d+)\)/);
      if (m) { Object.assign(aport.find(a => a.Id === Number(m[1])), c, { Modified: new Date().toISOString() }); return ful({ status: 204, body: '' }); }
      const a = { Id: aport.length + 1, ...c, Modified: new Date().toISOString() }; aport.push(a); return ful({ status: 201, json: { d: a } });
    }
    if (lst === LISTA) { const it = items.find(x => x.Id === Number(resto.match(/items\((\d+)\)/)[1])); if (c.TratarEn) it.TratarEn = c.TratarEn.results; it.Modified = new Date().toISOString(); return ful({ status: 204, body: '' }); }
    return ful({ status: 400, body: '' });
  }
  if (resto.startsWith('web?')) return ful({ json: { Url: 'https://colabora.mdef.es' + WEB, Title: 'JSUIGE' } });
  if (resto.startsWith('web/currentuser')) return ful({ json: { Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' } });
  if (lst.startsWith('PS ')) {
    if (!instalada) return ful({ status: 404, body: '' });
    if (lst === 'PS Aportaciones' + SUF && !resto.includes('/items')) return ful({ json: { Id: 'a', ListItemEntityTypeFullName: 'SP.Data.PS_x0020_AportacionesListItem' } });
    if (lst === 'PS Puntos' + SUF) return ful({ json: { value: puntos } });
    if (lst === 'PS Negociados' + SUF) return ful({ json: { value: negs() } });
    if (lst === 'PS Aportaciones' + SUF) {
      const m = resto.match(/items\((\d+)\)/);
      if (m) { const a = aport.find(x => x.Id === Number(m[1])); return ful({ json: { __metadata: { etag: '"1"' }, ...a } }); }
      let l = aport;
      const fo = resto.match(/OrigenId eq (\d+)\) and \(OrigenLista eq '([^']*)'/); if (fo) l = l.filter(a => a.OrigenId === Number(fo[1]) && a.OrigenLista === fo[2]);
      const fp = resto.match(/PuntoId eq (\d+)/); if (fp && !fo) l = l.filter(a => a.PuntoId === Number(fp[1]));
      return ful({ json: { value: l } });
    }
    return ful({ status: 404, body: '' });
  }
  if (lst === LISTA) {
    if (resto.includes('/fields?')) return ful({ json: { value: [{ InternalName: 'ESTADO', Choices: ['EN CURSO', 'FINALIZADO'] }, { InternalName: 'TratarEn', Choices: ['PUNTO DE SITUACIÓN', 'TRATAR CON EL GENERAL'], TypeAsString: 'MultiChoice' }] } });
    if (resto.includes('getbyinternalnameortitle')) return ful({ json: { InternalName: 'Comentarios', AppendOnly: false } });
    const m = resto.match(/items\((\d+)\)/);
    if (m) { const it = items.find(x => x.Id === Number(m[1])); return ful({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, Id: it.Id, Modified: it.Modified } } }); }
    if (resto.includes('/items')) return ful({ json: { value: items.map(x => ({ ...x, TratarEn: VERBOSE ? { results: x.TratarEn } : x.TratarEn })) } });
    return ful({ json: { Id: 'g', Title: LISTA, ItemCount: items.length, ListItemEntityTypeFullName: 'SP.Data.GestorListItem', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Gestor' } } });
  }
  if (resto.includes('_vti_bin') || resto.includes('siteusers')) return ful({ json: { value: [] } });
  return ful({ status: 404, body: '' });
});
const URL0 = 'https://colabora.mdef.es' + WEB + '/Documentos%20compartidos/tareas.html';
const ficha = async id => { await p.goto(URL0 + '?id=' + id); await p.waitForSelector('#psBox'); await p.waitForFunction(() => !/comprobando/.test(document.querySelector('#psBox').textContent)); return (await p.textContent('#psBox')).replace(/\s+/g, ' ').trim(); };

// 1. Sin la aplicación instalada
let t = await ficha(1);
comprueba('sin instalar, lo explica: ' + t.slice(0, 90), /aún no está instalada/.test(t));
// 2. Instalada, punto abierto, el usuario es de PRL
instalada = true;
t = await ficha(1);
comprueba('botón de incluir en el punto abierto: ' + t.slice(0, 90), /Incluir en PS-2026-045/.test(t));
await p.click('[data-psform]'); await p.waitForSelector('#psSit');
comprueba('negociado propuesto PRL', await p.inputValue('#psNeg') === 'PRL');
comprueba('prioridad Alta (asunto de prioridad alta)', await p.inputValue('#psPrio') === 'Alta');
comprueba('negociados en los que puede escribir: ' + await p.$$eval('#psNeg option', o => o.map(x => x.textContent).join(',')), await p.$$eval('#psNeg option', o => o.length) === 1);
await p.fill('#psSit', '');
await p.click('[data-psok]'); comprueba('pide la situación', /situación/.test(await p.textContent('#psErr')));
await p.fill('#psSit', 'Situación ficticia del asunto.');
if (process.env.CAPTURAS) await p.locator('#psBox').screenshot({ path: process.env.CAPTURAS + '/ps-incluir.png' });
await p.click('[data-psok]'); await p.waitForFunction(() => /Incluido en/.test(document.querySelector('#psBox') ? document.querySelector('#psBox').textContent : ''));
const a1 = aport[0] || {};
comprueba('entrada creada: ' + JSON.stringify({ Title: a1.Title, PuntoId: a1.PuntoId, Referencia: a1.Referencia, Negociado: a1.Negociado, Prioridad: a1.Prioridad, Orden: a1.Orden, Origen: a1.Origen, OrigenLista: a1.OrigenLista, OrigenId: a1.OrigenId }),
  a1.PuntoId === 45 && a1.Negociado === 'PRL' && a1.Origen === 'META' && a1.OrigenId === 1 && a1.OrigenLista === LISTA && a1.Orden === 1 && a1.Referencia === 'PS-2026-045');
comprueba('cierre copiado en la entrada', a1.CierrePunto === new Date(puntos[0].Cierre).toISOString());
comprueba('enlace a la ficha: ' + a1.OrigenUrl, /tareas\.html\?id=1$/.test(a1.OrigenUrl || ''));
comprueba('tipo de elemento de la lista', /PS_x0020_Aportaciones/.test(posts.find(x => /PS Aportaciones/.test(x.ruta)).cuerpo));
comprueba('marca 📋 puesta en el asunto: ' + JSON.stringify(items[0].TratarEn), items[0].TratarEn.includes('PUNTO DE SITUACIÓN'));
t = (await p.textContent('#psBox')).replace(/\s+/g, ' ');
if (process.env.CAPTURAS) await p.locator('#psBox').screenshot({ path: process.env.CAPTURAS + '/ps-incluido.png' });
comprueba('la ficha lo muestra incluido y sin botón de volver a incluir: ' + t.slice(0, 100), /Incluido en PS-2026-045 · PRL/.test(t) && !/Incluir en PS/.test(t));
// 3. Actualizar la situación
await p.click('[data-psaport]'); await p.waitForSelector('#psSit');
comprueba('formulario de actualizar con el texto guardado', await p.inputValue('#psSit') === 'Situación ficticia del asunto.');
await p.fill('#psSit', 'Situación actualizada.'); await p.click('[data-psok]'); await p.waitForFunction(() => /actualizada/.test(document.querySelector('#psBox').textContent));
const merge = posts.filter(x => /PS Aportaciones.*items\(1\)/.test(x.ruta)).pop();
comprueba('actualizada con MERGE e IF-MATCH', aport[0].Situacion === 'Situación actualizada.' && merge.cab['x-http-method'] === 'MERGE' && merge.cab['if-match'] === '"1"');
// 4. Validación de la lista (punto cerrado en el servidor)
validacion = true;
await p.click('[data-psaport]'); await p.waitForSelector('#psSit'); await p.fill('#psSit', 'Tarde'); await p.click('[data-psok]');
await p.waitForFunction(() => !document.querySelector('#psErr').hidden);
comprueba('validación de Colabora: ' + await p.textContent('#psErr'), /cerrado/.test(await p.textContent('#psErr')));
validacion = false;
// 5. Asunto de otro negociado: no se puede escribir en Infraestructura
t = await ficha(2);
await p.click('[data-psform]'); await p.waitForSelector('#psNeg');
comprueba('asunto de Infraestructura: avisa y ofrece solo PRL: ' + (await p.textContent('#psForm')).replace(/\s+/g, ' ').slice(0, 120),
  /donde no puedes escribir/.test(await p.textContent('#psForm')) && await p.inputValue('#psNeg') === '');
await p.fill('#psSit', 'x'); await p.click('[data-psok]'); comprueba('pide el negociado', /negociado/.test(await p.textContent('#psErr')));
// 6. Sin ser de ningún negociado
soyPRL = false;
t = await ficha(2); await p.click('[data-psform]'); await p.waitForSelector('#psForm .aviso');
comprueba('sin negociado: ' + (await p.textContent('#psForm')).slice(0, 80), /Solo los miembros/.test(await p.textContent('#psForm')));
soyPRL = true;
// 7. Sin punto abierto
puntos[0].Cierre = h(-1);
t = await ficha(2);
comprueba('sin punto abierto: ' + t.slice(0, 120), /No hay ningún punto de situación abierto/.test(t) && !/Incluir en/.test(t));
t = await ficha(1);
comprueba('incluido en punto ya cerrado: ' + t.slice(0, 100), /punto cerrado/.test(t) && !(await p.$('[data-psaport]')));
comprueba('errores de página: ' + JSON.stringify(errs), !errs.length);
await b.close();
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS');
process.exit(ok ? 0 : 1);
