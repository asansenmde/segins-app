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
  MensajeAutoridad: 'AUT' + (i % 2), MensajeNombre_Autoridad: i % 2 ? 'Jefe B' : 'Jefe A', MensajeCanal: 'Canal ' + (i % 2), MensajeEstado: i === 2 ? 'Leído' : 'Pendiente',
  MensajeTipo_es: i === 0 ? 'Orden' : 'Informe', MensajeNivel_1_Organico: 'SUIGE', MensajeNivel_2_Organico: 'Sección ' + i, MensajeNum_referencia: 'REF-' + l + '-' + i,
  MensajeUrlCarpeta: WEB + '/SMDMDMensajesDocumentos_' + dias[0] + '/' + l + '-' + i });
const b = await chromium.launch();
const mp = await b.newPage();
await mp.goto(new URL('../marcador-visor-mensadef.html', import.meta.url).href);
const codigo = decodeURIComponent((await mp.getAttribute('#marcador', 'href')).slice(11));
const p = await b.newPage({ acceptDownloads: true }); const errs = []; p.on('pageerror', e => errs.push(e.message)); const metodos = new Set(); const pedidas = [];
await p.route(O + '/**', async r => {
  const u = decodeURIComponent(r.request().url()); metodos.add(r.request().method()); pedidas.push(u.replace(O, ''));
  const acc = r.request().headers().accept || '';
  if (verbose && acc.includes('nometadata') && u.includes('/_api/')) return r.fulfill({ status: 406, body: '' });
  const J = (o, next) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(verbose ? { d: Array.isArray(o.value) ? { results: o.value, __next: next } : o } : Object.assign(o, next ? { 'odata.nextLink': next } : {})) });
  if (!u.includes('/_api/')) return r.fulfill({ contentType: 'text/html', body: '<html><body>Portada</body></html>' });
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
  if (m) return J({ value: ['ID', 'Title', 'MensajeAsunto', 'MensajeFecha', 'MensajeId'].map(n => ({ InternalName: n })) });
  m = /lists\(guid'(\w+)'\)\/items\?(.*)/.exec(u);
  if (m) {
    const id = m[1], q = m[2];
    if (id === 'dia2' && q.includes('MensajeCSV')) return r.fulfill({ status: 400, body: '' }); // lista sin alguna columna
    if (id === 'dia2') return J({ value: [{ ID: 1, FileSystemObjectType: 0, Title: 'Sin columnas', MensajeAsunto: 'Mensaje antiguo', MensajeFecha: '2026-09-26T08:00:00Z', MensajeId: 'viejo' }] });
    if (id === 'hist') return J({ value: [item('H', 0), Object.assign(item('dia0', 0), {})] }); // uno duplicado por MensajeId
    if (id === 'dia0' && !q.includes('skiptoken')) return J({ value: [item('dia0', 0), item('dia0', 1), { ID: 9, FileSystemObjectType: 1, Title: 'carpeta' }] }, O + WEB + "/_api/web/lists(guid'dia0')/items?skiptoken=1");
    if (id === 'dia0') return J({ value: [item('dia0', 2)] });
    return J({ value: [item(id, 0), item(id, 1), item(id, 2)] });
  }
  r.fulfill({ status: 404, body: '' });
});
await p.goto(O + WEB + '/SitePages/Inicio.aspx');
await p.evaluate(codigo); await p.waitForTimeout(1200);
console.log('quién:', await p.textContent('#quien'), '| estado:', await p.textContent('#estado'));
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
await p.setViewportSize({ width: 390, height: 800 }); await p.screenshot({ path: new URL('visor-movil.png', import.meta.url).pathname, fullPage: false });
await p.setViewportSize({ width: 1400, height: 900 }); await p.screenshot({ path: new URL('visor.png', import.meta.url).pathname });
await b.close();
