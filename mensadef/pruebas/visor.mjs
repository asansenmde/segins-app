import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const O = 'https://mensadef.mdef.es', WEB = '/ambito/2SUIGE';
const verbose = process.argv[2] === 'v';
const hoy = new Date(); const d = n => { const x = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - n); return x.getFullYear() + String(x.getMonth() + 1).padStart(2, '0') + String(x.getDate()).padStart(2, '0'); };
const dias = [0, 1, 2, 5].map(d);
const lists = dias.map((s, i) => ({ Id: 'dia' + i, Title: 'SMDMDMensajes_' + s, ItemCount: 3, RootFolder: { ServerRelativeUrl: WEB + '/Lists/SMDMDMensajes_' + s } }))
  .concat([{ Id: 'hist', Title: 'SMDMDMensajes20263', ItemCount: 2, RootFolder: { ServerRelativeUrl: WEB + '/Lists/SMDMDMensajes20263' } },
           { Id: 'docs', Title: 'SMDMDMensajesDocumentos_' + dias[0], ItemCount: 9, RootFolder: { ServerRelativeUrl: WEB + '/SMDMDMensajesDocumentos_' + dias[0] } },
           { Id: 'pag', Title: 'Páginas del sitio', ItemCount: 2, RootFolder: { ServerRelativeUrl: WEB + '/SitePages' } }]);
const item = (l, i) => ({ ID: i + 1, FileSystemObjectType: 0, Title: 'T' + i, Created: '2026-09-27T10:00:00Z', Attachments: i === 0,
  MensajeId: l + '-' + i, MensajeAsunto: (i === 1 ? 'Revista <b>extintores</b> ' : 'Asunto ') + l + ' ' + i, MensajeFecha: new Date(hoy.getTime() - (i + 1) * 3600e3).toISOString(),
  MensajeAutoridad: 'AUT' + (i % 2), MensajeNombre_Autoridad: i % 2 ? 'Jefe B' : 'Jefe A', MensajeCanal: 'Canal ' + (i % 2), MensajeEstado: i === 2 ? 'Leído' : l === 'dia0' && i === 1 ? 'Borrador' : 'Pendiente',
  MensajeNegociadoDestino: ['Seguridad', 'Personal'][i % 2], MensajeDestinatario: { Title: 'Usuario ' + i }, Oculto: 'no debe leerse',
  MensajeTipo_es: i === 0 ? 'Orden' : 'Informe', MensajeNivel_1_Organico: 'SUIGE', MensajeNivel_2_Organico: 'Sección ' + i, MensajeNum_referencia: 'REF-' + l + '-' + i,
  MensajeUrlCarpeta: WEB + '/SMDMDMensajesDocumentos_' + dias[0] + '/' + l + '-' + i });
const b = await chromium.launch();
const mp = await b.newPage();
// PRUEBAS=1: copia de pruebas del visor (marcador-visor-mensadef-pruebas.html)
const PRUEBAS = !!process.env.PRUEBAS;
await mp.goto(new URL(PRUEBAS ? '../marcador-visor-mensadef-pruebas.html' : '../marcador-visor-mensadef.html', import.meta.url).href);
const codigo = decodeURIComponent((await mp.getAttribute('#marcador', 'href')).slice(11));
const p = await b.newPage({ acceptDownloads: true }); const errs = []; p.on('pageerror', e => errs.push(e.message)); const metodos = new Set(); const pedidas = [];
await p.route(O + '/**', async r => {
  const u = decodeURIComponent(r.request().url()); metodos.add(r.request().method()); pedidas.push(u.replace(O, ''));
  const acc = r.request().headers().accept || '';
  if (verbose && acc.includes('nometadata') && u.includes('/_api/')) return r.fulfill({ status: 406, body: '' });
  const J = (o, next) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(verbose ? { d: Array.isArray(o.value) ? { results: o.value, __next: next } : o } : Object.assign(o, next ? { 'odata.nextLink': next } : {})) });
  if (!u.includes('/_api/')) return r.fulfill({ contentType: 'text/html', body: '<html><body>Portada</body></html>' });
  // CELULA=1: las listas de mensajes no están en el ámbito sino en un subsitio (y ocultas); otro subsitio sin permiso
  // NADA=1: no hay listas de mensajes en ningún sitio (debe decir dónde ha buscado)
  if (process.env.NADA) {
    if (u.includes('/_api/web/lists?')) return J({ value: [lists[lists.length - 1]] });
    if (u.startsWith(O + WEB + '/_api/web/webs')) return J({ value: [{ Title: 'SETEC', ServerRelativeUrl: WEB + '/SETEC' }] });
    if (u.includes('/_api/web/webs')) return J({ value: [] });
    if (u.includes('/_api/site/rootweb')) return J({ Url: O });
  }
  if (process.env.CELULA) {
    const SUB = O + WEB + '/SETEC', OTRO = O + '/ambito/OTRO';
    // Otro ámbito (otra colección de sitios) que solo se encuentra con la búsqueda de SharePoint
    if (u.includes('/_api/search/query')) return J({ PrimaryQueryResult: { RelevantResults: { Table: { Rows: [{ Cells: [{ Key: 'SPWebUrl', Value: OTRO }] }, { Cells: [{ Key: 'SPWebUrl', Value: SUB }] }] } } } });
    if (u.startsWith(OTRO + '/_api/web/lists?')) return J({ value: [Object.assign({}, lists[0], { Id: 'otro0' })] });
    if (u.startsWith(OTRO + '/_api/web/webs')) return J({ value: [] });
    if (u.startsWith(OTRO + '/_api/web?')) return J({ Title: 'Otro negociado' });
    if (u.startsWith(SUB + '/_api/web?')) return J({ Title: 'SETEC SEGURIDAD' });
    if (u.startsWith(OTRO + '/_api/web/lists(guid')) { /* sigue abajo */ }
    else {
    if (u.startsWith(O + WEB + '/_api/web/lists?')) return J({ value: [lists[lists.length - 1]] });
    if (u.startsWith(O + WEB + '/_api/web/webs')) return J({ value: [{ Title: 'Otra', ServerRelativeUrl: WEB + '/OTRA' }, { Title: 'SETEC', ServerRelativeUrl: WEB + '/SETEC' }] });
    if (u.startsWith(O + WEB + '/OTRA/_api/')) return r.fulfill({ status: 403, body: '' });
    if (u.startsWith(SUB + '/_api/web/webs') || u.includes('/_api/site/rootweb')) return J(u.includes('rootweb') ? { Url: O + WEB } : { value: [] });
    if (u.includes('/_api/web/lists?') && !u.startsWith(SUB)) return J({ value: [] });
    if (u.includes("/_api/web/lists(guid") && !u.startsWith(SUB)) return r.fulfill({ status: 404, body: '' });
    }
  }
  if (u.startsWith(O + WEB + '/_api/web?')) return J({ Url: O + WEB, Title: 'Segunda SUIGE' });
  if (u.includes('/_api/web?')) return r.fulfill({ status: 404, body: '' });
  if (u.includes('currentuser')) return J({ Title: 'usuario' });
  if (u.includes('/_api/web/lists?')) return J({ value: lists });
  let m = /lists\(guid'(\w+)'\)\/items\((\d+)\)\?\$select=MensajeCuerpo/.exec(u);
  if (m) return J({ MensajeCuerpo: '<div>Línea 1<br>Línea <script>alert(1)</script>2</div><p>Fin</p>' });
  m = /lists\(guid'(\w+)'\)\/items\((\d+)\)\/AttachmentFiles/.exec(u);
  if (m) return J({ value: [{ FileName: 'adjunto.pdf', ServerRelativeUrl: WEB + '/Lists/x/Attachments/1/adjunto.pdf' }] });
  if (u.includes('GetFolderByServerRelativeUrl')) return J({ value: [{ Name: 'mensaje.pdf', ServerRelativeUrl: WEB + '/docs/mensaje.pdf', Length: 20480 }] });
  m = /lists\(guid'(\w+)'\)\/fields/.exec(u);
  // Columnas: la lista dia2 es antigua (le faltan); el resto tiene las de MENSADEF y dos propias (negociado destino, destinatario)
  if (m && m[1] === 'dia2') return J({ value: ['ID', 'Title', 'MensajeAsunto', 'MensajeFecha', 'MensajeId'].map(n => ({ InternalName: n })) });
  if (m) return J({ value: ['ID', 'Title', 'Created', 'Attachments', 'MensajeId', 'MensajeAsunto', 'MensajeFecha', 'MensajeAutoridad', 'MensajeNombre_Autoridad', 'MensajeCanal', 'MensajeEstado', 'MensajeTipo_es',
    'MensajeNivel_1_Organico', 'MensajeNivel_2_Organico', 'MensajeNum_referencia', 'MensajeUrlCarpeta'].map(n => ({ InternalName: n, TypeAsString: 'Text' }))
    .concat([{ InternalName: 'MensajeNegociadoDestino', Title: 'Negociado destino', TypeAsString: 'Choice' }, { InternalName: 'MensajeDestinatario', Title: 'Destinatario', TypeAsString: 'User' },
      { InternalName: 'Oculto', Title: 'Oculto', Hidden: true, TypeAsString: 'Text' }, { InternalName: 'Modified', Title: 'Modificado', FromBaseType: true, TypeAsString: 'DateTime' },
      { InternalName: 'MensajeCuerpo', Title: 'Cuerpo', TypeAsString: 'Note' }]) });
  m = /lists\(guid'(\w+)'\)\/items\?(.*)/.exec(u);
  if (m) {
    const id = m[1], q = m[2];
    if (id === 'dia2' && q.includes('MensajeCSV')) return r.fulfill({ status: 400, body: '' }); // lista sin alguna columna
    if (id === 'dia2') return J({ value: [{ ID: 1, FileSystemObjectType: 0, Title: 'Sin columnas', MensajeAsunto: 'Mensaje antiguo', MensajeFecha: '2026-09-26T08:00:00Z', MensajeId: 'viejo' }] });
    if (id === 'hist') return J({ value: [item('H', 0), Object.assign(item('dia0', 0), {})] }); // uno duplicado por MensajeId
    if (id === 'dia0' && !q.includes('skiptoken')) return J({ value: [item('dia0', 0), item('dia0', 1), { ID: 9, FileSystemObjectType: 1, Title: 'carpeta' }] }, u.split('/_api/')[0] + "/_api/web/lists(guid'dia0')/items?skiptoken=1");
    if (id === 'dia0') return J({ value: [item('dia0', 2)] });
    return J({ value: [item(id, 0), item(id, 1), item(id, 2)] });
  }
  r.fulfill({ status: 404, body: '' });
});
await p.goto(process.env.INICIO || O + WEB + '/SitePages/Inicio.aspx'); // INICIO=… para arrancar desde otra página de MENSADEF
await p.evaluate(codigo); await p.waitForTimeout(1200);
console.log('quién:', await p.textContent('#quien'), '| estado:', await p.textContent('#estado'));
if (process.env.NADA) { console.log('aviso:', await p.textContent('#aviso')); await b.close(); process.exit(); }
// Columnas propias de MENSADEF, negociados (sitios) y borradores
console.log('columnas:', await p.textContent('#nColumnas'), '| filtros extra:', await p.$$eval('#masFiltros label', l => l.map(x => x.firstChild.textContent)), '| negociado/sitio visible:', await p.isVisible('#fSitio'));
const nfil = () => p.$$eval('#lista tbody tr', t => t.length);
const antesB = await nfil(); await p.uncheck('#fBorrador'); console.log('borradores ocultos por defecto: con =', await nfil(), 'sin =', antesB); await p.check('#fBorrador');
await p.selectOption('#fx_MensajeNegociadoDestino', 'Personal'); console.log('Negociado destino = Personal:', await nfil()); await p.selectOption('#fx_MensajeNegociadoDestino', '');
await p.fill('#buscar', 'Usuario 2'); await p.waitForTimeout(400); console.log('buscar por destinatario:', await nfil()); await p.fill('#buscar', ''); await p.waitForTimeout(300);
if (process.env.CELULA) { const ops = await p.$$eval('#fSitio option', o => o.map(x => x.textContent)); console.log('sitios:', ops); await p.selectOption('#fSitio', { index: 1 }); console.log('solo ' + ops[1] + ':', await nfil()); await p.selectOption('#fSitio', ''); }
await p.click('#estructura'); const est = await p.inputValue('#cajaEstructura textarea'); console.log('estructura:\n' + est);
console.log('¿estructura con contenido?', /Asunto |Jefe A|Usuario 2|REF-/.test(est), '| pidió la columna oculta o el cuerpo en masa?', pedidas.some(x => x.includes('items?') && (x.includes('Oculto') || x.includes('MensajeCuerpo'))));
const filas = () => p.$$eval('#lista tbody tr', t => t.length);
console.log('filas (3 días: dia0 3 + dia1 3 + dia2 1):', await filas(), '| chips:', await p.textContent('#chips'));
await p.fill('#buscar', 'extintores'); await p.waitForTimeout(400); console.log('buscar extintores:', await filas());
await p.fill('#buscar', ''); await p.selectOption('#fTipo', 'Orden'); await p.waitForTimeout(100); console.log('tipo Orden:', await filas());
await p.click('#limpiar'); await p.check('#fAdjuntos'); console.log('con adjuntos:', await filas()); await p.click('#limpiar');
await p.click('#lista tbody tr >> nth=0'); await p.waitForTimeout(500);
console.log('detalle:', (await p.textContent('#detalle')).replace(/\s+/g, ' ').slice(0, 330));
console.log('cuerpo:', JSON.stringify(await p.textContent('#cuerpo')), '| script inyectado?', await p.$('#cuerpo script') !== null);
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv')]);
const csv = require('fs').readFileSync(await dl.path(), 'utf8'); console.log('csv:', dl.suggestedFilename(), csv.split('\r\n').length - 1, 'filas;', csv.split('\r\n')[0]);
await p.click('button[data-dias="6"]'); await p.waitForTimeout(800); console.log('7 días:', await filas());
await p.check('#historicas'); await p.click('#cargar'); await p.waitForTimeout(800); console.log('con históricas (+1, sin duplicado):', await filas(), '|', await p.textContent('#estado'));
console.log('métodos:', [...metodos], '| errores de página:', errs);
console.log('pidió cuerpo en la carga masiva?', pedidas.some(x => x.includes('items?') && x.includes('MensajeCuerpo')));
// Pasar a Tareas Colabora: la primera vez pide la dirección de la página; abre Colabora con los datos en el fragmento
const aColabora = []; await p.context().route('https://colabora.mdef.es/**', r => aColabora.push(r.request().url()) && r.fulfill({ contentType: 'text/html', body: '<html><body>Colabora</body></html>' }));
await p.click('#lista tbody tr >> nth=1'); await p.waitForTimeout(500);
console.log('botón activo tras leer el cuerpo:', await p.isEnabled('#aColabora'));
await p.click('#aColabora'); console.log('pide dirección:', await p.isVisible('#urlColabora'));
await p.fill('#urlColabora', O + WEB + '/x'); await p.click('#guardarColabora'); console.log('rechaza dirección de MENSADEF:', await p.textContent('#errColabora'));
if (PRUEBAS) { await p.fill('#urlColabora', 'https://colabora.mdef.es/et/SUIGESUR/JSUIGE/Documentos/tareas-nlt-colabora.html'); await p.click('#guardarColabora'); console.log('PRUEBAS rechaza la página buena:', await p.textContent('#errColabora'), '| banda:', await p.$eval('body > div', d => d.textContent)); }
await p.fill('#urlColabora', 'https://colabora.mdef.es/et/SUIGESUR/JSUIGE/Documentos/tareas-nlt-colabora' + (PRUEBAS ? '-pruebas' : '') + '.html');
const [nueva] = await Promise.all([p.context().waitForEvent('page'), p.click('#guardarColabora')]);
await nueva.waitForLoadState(); const destino = nueva.url(); const enviado = JSON.parse(decodeURIComponent(destino.split('#importar=')[1]));
console.log('abre:', destino.split('#')[0], '| datos:', JSON.stringify(enviado).slice(0, 330));
console.log('los datos llegaron al servidor de Colabora?', aColabora.some(x => x.includes('importar')), '| peticiones a Colabora:', aColabora.length);
await nueva.close(); await p.waitForTimeout(200);
console.log('marca en la tabla:', await p.$$eval('#lista tbody tr', t => t.filter(r => r.textContent.includes('➜ Tarea')).length), '| detalle:', (await p.textContent('#colabora')).slice(0, 80));
const [otra] = await Promise.all([p.context().waitForEvent('page'), p.click('#aColabora')]); await otra.waitForLoadState(); console.log('segunda vez sin preguntar:', otra.url().includes('#importar=')); await otra.close();
await p.setViewportSize({ width: 390, height: 800 }); await p.screenshot({ path: new URL('visor-movil.png', import.meta.url).pathname, fullPage: false });
await p.setViewportSize({ width: 1400, height: 900 }); await p.screenshot({ path: new URL('visor.png', import.meta.url).pathname });
await b.close();
