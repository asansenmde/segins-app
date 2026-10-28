// Prueba del visor (copia de pruebas) leyendo las bandejas de las células con el servicio de MENSADEF (mensadefapi), con
// datos simulados: usuario → células → bandejas tipoES 1 y 2 paginadas. VERBOSE=1 para SharePoint 2013 (odata=verbose).
// SINCORREO=1: SharePoint no tiene el correo del usuario; se toma de las consultas que ya hizo la aplicación en la página.
// (Playwright no aplica CORS a las respuestas simuladas: el «primero sin cookies, luego con la sesión» no se puede comprobar aquí.)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const O = 'https://mensadef.mdef.es', API = 'https://mensadefapi.mdef.es', WEB = '/ambito/2SUIGE';
const verbose = !!process.env.VERBOSE;
const G4 = '44444444-4444-4444-4444-444444444444', G1 = '8d714e44-b2b5-41a8-9780-2228204861b5', G2 = '11111111-2222-3333-4444-555555555555', G3 = '99999999-8888-7777-6666-555555555555';
let nClaves = 0;
const PASS = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', UID = 'abcdef01-2345-6789-abcd-ef0123456789';
// Consulta que hace la aplicación de MENSADEF al cambiar de célula (de ahí el favorito toma las cabeceras)
const consultaApp = pg => pg.evaluate(([P, U]) => fetch('https://mensadefapi.mdef.es/api/usuariovista/UsuarioVistaObtener?emailUsuario=persona%40et.mde.es', { headers: { 'Content-Type': 'application/json', passcode: P, user: U } }).catch(() => 0), [PASS, UID]);
const hoy = new Date(); const hace = h => { const d = new Date(hoy.getTime() - h * 3600e3); return d.toISOString().slice(0, 19); };
// Bandeja simulada: SEGURIDAD tiene 130 mensajes de entrada (2 páginas) en las últimas horas y otros antiguos; SECRETARIA 3
const bandeja = (cel, es, pag, tam) => {
  const total = cel === G1 && es === '1' ? 230 : cel === G2 ? 3 : cel === G4 ? 500 : 0;
  const els = [];
  for (let i = (pag - 1) * tam; i < Math.min(total, pag * tam); i++) els.push({ IdMensaje: '0000' + cel.slice(0, 4) + '-' + es + '000-0000-0000-' + String(i).padStart(12, '0'), IdBuzonCelula: G3, Asunto: 'Mensaje ' + i + ' de ' + cel.slice(0, 4),
    Cuerpo: '<p>Texto del mensaje ' + i + '</p><script>alert(1)</script>', Fecha: hace(i < 130 ? i * 0.3 : 24 * 40 + i), FechaRegistroEntrada: hace(i), IdEstadoMensaje: 3,
    EstadoMensaje: i % 3 ? 'Pendiente' : 'Leído', EstadoParaUsuario: i % 2 ? 'No leído' : 'Leído', TipoES: es === '1' ? 'E' : 'S', TipoMensaje: i % 4 ? 'Informe' : 'Orden', CodigoPrioridad: i % 9 ? 'R' : 'U',
    CelulaRemitente: i % 2 ? 'ET 2SUIGE JEFATURA' : 'ET 2SUIGE REGISTRO', CelulaDestinataria: 'ET 2SUIGE SETEC SEGURIDAD', NumeroRegistroEntrada: 'RE-' + i, Sref: 'SREF-' + i,
    ContieneAnexos: i % 5 === 0 ? 'Sí' : 'No', Leido: !!(i % 3), Actuacion: i % 7 ? '' : 'URGENTE', IdEtiqueta: i % 6 === 0 ? 1 : i % 6 === 1 ? 4 : i % 11 === 2 ? 9 : 0, IdCelulaRM: G3 });
  return { ListaElementos: els, ListaAgrupaciones: [], IndicePagina: pag, TamanoPagina: tam, TotalRegistros: total };
};
const b = await chromium.launch();
const mp = await b.newPage();
await mp.goto(new URL('../marcador-visor-mensadef-pruebas.html', import.meta.url).href);
const codigo = decodeURIComponent((await mp.getAttribute('#marcador', 'href')).slice(11));
const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const llamadas = [];
await ctx.route(API + '/**', r => {
  const u = new URL(r.request().url()), q = Object.fromEntries(u.searchParams), ruta = u.pathname.replace('/api/', '');
  llamadas.push(ruta + (q.idCelula ? ' ' + q.idCelula.slice(0, 4) + ' es' + q.tipoES + ' p' + q.indicePagina : ''));
  const H = { 'Access-Control-Allow-Origin': O, 'Access-Control-Allow-Credentials': 'true' };
  // ACCEPT406=1: el servicio contesta 406 si no se pide JSON en la cabecera Accept
  if (process.env.ACCEPT406 && !/application\/json/.test(r.request().headers().accept || '')) return r.fulfill({ status: 406, headers: H, body: '' });
  // Como el real: sin las cabeceras de la aplicación (passcode y user) contesta 406
  const hd = r.request().headers();
  if (r.request().method() === 'OPTIONS') return r.fulfill({ headers: Object.assign({ 'Access-Control-Allow-Headers': 'content-type, passcode, user' }, H), body: '' });
  if (ruta === 'usuariovista/UsuarioVistaObtener') return r.fulfill({ headers: H, json: {} });
  // Como el real: la consulta sin clave devuelve la clave en las cabeceras de la respuesta (IdUsuario = passcode, User)
  // (como en el real, MensadefActivo responde pero sin clave; la da ValidateUser con la cuenta del usuario)
  if (ruta === 'ambitocomun/MensadefActivo') return r.fulfill({ headers: H, json: true });
  if (ruta === 'usuario/ValidateUser') { nClaves++; const ok = !process.env.NOCLAVE && q.idUsuario === 'persona'; return r.fulfill({ headers: Object.assign({ 'Access-Control-Expose-Headers': 'IdUsuario, User' }, H, ok ? { IdUsuario: PASS, User: UID } : {}), json: true }); }
  if (hd.passcode !== PASS || hd.user !== UID) return r.fulfill({ status: 406, headers: H, body: '' });
  if (q.emailUsuario !== 'persona@et.mde.es' || q.urlColeccionSitio !== O + WEB) return r.fulfill({ status: 400, headers: H, json: { error: 'parámetros' } });
  if (ruta === 'usuario/ConsultaUsuarioDicodefPorCorreo') return r.fulfill({ headers: H, json: { Datos: { IdUsuario: 77, Nombre: 'PERSONA', Correo: q.emailUsuario } } });
  if (ruta === 'ambito/UsuarioCelulas') return r.fulfill({ headers: H, json: q.idUsuario !== '77' ? [] : q.tipoCelula === '4' ? [{ IdCelula: G1, NombreCelula: 'SETEC SEGURIDAD', TipoCelula: 4 }, { IdCelula: G2, NombreCelula: 'SETEC SECRETARIA', TipoCelula: 4 }]
    : [{ IdCelula: G1, NombreCelula: 'SETEC SEGURIDAD', TipoCelula: 4 }, { IdCelula: G2, NombreCelula: 'SETEC SECRETARIA', TipoCelula: 4 }, { IdCelula: G4, NombreCelula: 'ET 2SUIGE REGISTRO', TipoCelula: 1 }, { IdCelula: G3, NombreCelula: 'ET 2SUIGE JEFATURA PORTAFIRMAS', TipoCelula: 2 }] });
  // Catálogo de banderas, como el real: [{IdEtiqueta, Nombre, Color}] (la 9 no está: se ve como «Bandera 9»)
  if (ruta === 'etiqueta/EtiquetasObtener') return r.fulfill({ headers: H, json: [{ IdEtiqueta: 1, Nombre: 'Urgente', Color: '#FF0000' }, { IdEtiqueta: 4, Nombre: 'Finalizado', Color: 'verde' }, { IdEtiqueta: 5, Nombre: 'Seguimiento', Color: 'x;}<b>' }] });
  if (ruta === 'buzon/ObtenerBuzonCelula') return r.fulfill({ headers: H, json: bandeja(q.idCelula, q.tipoES, +q.indicePagina, +q.tamanoPagina) });
  r.fulfill({ status: 404, headers: H, body: '' });
});
await ctx.route(O + '/**', r => {
  const u = decodeURIComponent(r.request().url()), acc = r.request().headers().accept || '';
  if (verbose && acc.includes('nometadata') && u.includes('/_api/')) return r.fulfill({ status: 406, body: '' });
  const J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(verbose ? { d: o } : o) });
  // Página de MENSADEF simulada: al entrar en la ruta de una célula, la aplicación consulta su servicio con sus cabeceras
  if (!u.includes('/_api/')) return r.fulfill({ contentType: 'text/html', body: '<html><body>MENSADEF<script>addEventListener("hashchange", function () { if (/^#\\/celula\\//.test(location.hash)) fetch("' + API + '/api/usuariovista/UsuarioVistaObtener?x=1", { headers: { "Content-Type": "application/json", passcode: "' + PASS + '", user: "' + UID + '" } }); });</script></body></html>' });
  if (u.startsWith(O + WEB + '/_api/web?')) return J({ Url: O + WEB, Title: 'Segunda SUIGE' });
  if (u.includes('/_api/web?')) return r.fulfill({ status: 404, body: '' });
  if (u.includes('currentuser')) return J(process.env.SINCORREO ? { Title: 'PERSONA', Email: '', UserPrincipalName: '', LoginName: 'i:0#.w|et\\persona' } : { Title: 'PERSONA', Email: 'persona@et.mde.es', LoginName: 'i:0#.w|et\\persona' });
  if (u.includes('GetMyProperties')) return J({ Email: '', UserProfileProperties: [] });
  if (u.includes('/_api/site?')) return J({ Url: O + WEB });
  r.fulfill({ status: 404, body: '' });
});
// Se pulsa desde una tercera célula que no viene en la lista (se añade por la dirección)
await p.goto(O + WEB + '/SitePages/ambito.aspx');
// Lo que la aplicación de MENSADEF ya consultó en la página (en la realidad lo vuelve a hacer al recargar)
const consultasApp = pg => !process.env.SINCORREO ? null : pg.evaluate(() => { const o = performance.getEntriesByType.bind(performance); performance.getEntriesByType = t => t !== 'resource' ? o(t) : [
  { name: 'https://mensadefapi.mdef.es/api/usuario/ValidateUser?idUsuario=persona&useUid=true' },
  { name: 'https://mensadefapi.mdef.es/api/ambito/UsuarioCelulas?idUsuario=77&tipoCelula=-1&emailUsuario=persona%40et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es%2Fambito%2F2SUIGE' }]; });
await consultasApp(p);
await p.evaluate(codigo); await p.waitForTimeout(2500);
console.log('clave pedida al servicio:', nClaves, 'vez/veces');
if (process.env.NOCLAVE) { console.log('sin clave del servicio:', (await p.textContent('#aviso')).replace(/\s+/g, ' ').slice(0, 260)); await b.close(); process.exit(); }
const filas = () => p.$$eval('#lista tbody tr[data-i]', t => t.length);
console.log('estado:', await p.textContent('#estado'), '| células:', await p.textContent('#resumenCelulas'));
console.log('llamadas:', llamadas.join(' | '));
console.log('filas (130 recientes + 3, sin borradores):', await filas(), '| chips:', await p.textContent('#chips'));
console.log('filtros extra:', await p.$$eval('#masFiltros label', l => l.map(x => x.firstChild.textContent)), '| célula:', await p.$$eval('#fSitio option', o => o.map(x => x.textContent)), '| etiqueta del filtro:', await p.$eval('#fSitio', s => s.previousSibling.textContent));
await p.selectOption('#fSitio', 'SETEC SECRETARIA'); console.log('solo SECRETARIA:', await filas()); await p.selectOption('#fSitio', '');
console.log('tarjetas:', await p.$$eval('#kpis .kpi', l => l.map(k => k.textContent)), '| píldoras:', await p.$$eval('#pildoras .pildora', l => l.map(k => k.textContent)));
await p.click('#pildoras .pildora:has-text("SECRETARIA")'); console.log('píldora SECRETARIA:', await filas()); await p.click('#pildoras .pildora >> nth=0');
await p.click('#kpis [data-kpi="noleidos"]'); console.log('tarjeta No leídos:', await filas()); await p.click('#kpis [data-kpi="todos"]');
await p.click('#lista tbody tr[data-i] >> nth=0 >> [data-visto]'); await p.click('#lista tbody tr[data-i] >> nth=1 >> [data-visto]');
console.log('2 vistos → Sin revisar:', await p.textContent('#kpis [data-kpi="sinver"] b'), '| detalle abierto al marcar?', !(await p.isHidden('#detalle')));
await p.check('#fVistos'); console.log('ocultar vistos:', await filas()); await p.uncheck('#fVistos');
await p.selectOption('#fTipo', 'Orden'); console.log('tipo Orden:', await filas()); await p.selectOption('#fTipo', '');
await p.selectOption('#fx_CodigoPrioridad', 'U'); console.log('prioridad U:', await filas()); await p.selectOption('#fx_CodigoPrioridad', '');
await p.click('#kpis [data-kpi="salida"]'); console.log('tarjeta Salida:', await filas()); await p.click('#kpis [data-kpi="todos"]');
console.log('cabeceras de día:', await p.$$eval('#lista tr.dia-cab', l => l.map(x => x.textContent)));
// Elegir solo SECRETARIA y recargar; se recuerda
await p.click('#elegirCelulas'); console.log('selector:', (await p.textContent('#cajaCelulas')).replace(/\s+/g, ' ').slice(0, 220));
await p.click('[data-cel="ninguna"]'); await p.check('#cajaCelulas label:has-text("SETEC SECRETARIA") input'); await p.click('#aplicarCelulas'); await p.waitForTimeout(800);
console.log('solo SECRETARIA elegida:', await p.textContent('#resumenCelulas'), '|', await p.textContent('#estado'));
await p.reload(); await consultasApp(p); await p.evaluate(codigo); await p.waitForTimeout(1500); console.log('recordado:', await p.textContent('#resumenCelulas'));
await p.click('#elegirCelulas'); console.log('grupos:', await p.$$eval('#cajaCelulas p b, #cajaCelulas [data-cel]', l => l.map(x => x.textContent)));
await p.click('[data-cel="g:registro"]'); console.log('solo Registro marca:', await p.$$eval('#cajaCelulas input:checked', l => l.length));
await p.click('[data-cel="t4"]'); await p.click('#aplicarCelulas'); await p.waitForTimeout(1500);
// Desde la página de una célula (sin elección guardada) se carga esa
const p2 = await ctx.newPage(); await p2.goto(O + WEB + '/SitePages/ambito.aspx#/celula/SETEC%20SECRETARIA/' + G2);
await p2.evaluate(() => { try { localStorage.removeItem('visorMensadefPruebas.celulasElegidas'); } catch (e) {} });
await consultasApp(p2); await p2.evaluate(codigo); await p2.waitForTimeout(1500); console.log('desde la célula SECRETARIA:', await p2.textContent('#resumenCelulas')); await p2.close();
await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(300);
console.log('detalle:', (await p.textContent('#detalle')).replace(/\s+/g, ' ').slice(0, 420));
console.log('abrir en MENSADEF:', await p.$eval('#detalle a', a => a.href));
await p.click('#aColabora'); await p.fill('#urlColabora', 'https://colabora.mdef.es/x/tareas-nlt-colabora-pruebas.html');
await ctx.route('https://colabora.mdef.es/**', r => r.fulfill({ contentType: 'text/html', body: 'ok' }));
const [nueva] = await Promise.all([ctx.waitForEvent('page'), p.click('#guardarColabora')]); await nueva.waitForLoadState();
console.log('a Colabora:', decodeURIComponent(nueva.url().split('#importar=')[1]).slice(0, 400));
await p.bringToFront();
// Ficha con los campos pedidos y ampliar
console.log('ficha:', await p.$$eval('#detalle dl.ficha-campos dt', l => l.map(x => x.textContent).join(', ')), '| otros plegados:', await p.textContent('#detalle details.otros summary').catch(() => '-'));
await p.click('#ampliar'); console.log('ampliada: tabla oculta', await p.isHidden('#lista'), '|', await p.textContent('#ampliar')); await p.click('#ampliar');
// Banderas: en la tabla con su color, en la ficha y con filtro
console.log('banderas en la tabla:', await p.$$eval('#lista .bandera', l => [...new Set(l.map(x => x.textContent + ' ' + x.style.getPropertyValue('--cb')))].join(', ')),
  '| filtro:', await p.$$eval('[data-x="Bandera"] option', l => l.map(x => x.textContent).join(', ')).catch(() => 'no hay'));
await p.selectOption('[data-x="Bandera"]', 'Urgente');
await p.waitForTimeout(200); console.log('solo urgentes:', await p.$$eval('#lista tr[data-i]', l => l.length), '| todas con bandera Urgente:', await p.$$eval('#lista tr[data-i]', l => l.every(t => /Urgente/.test(t.textContent))));
await p.selectOption('[data-x="Bandera"]', '');
// Informe con los filtros
await p.selectOption('#fSitio', 'SETEC SEGURIDAD'); await p.click('#kpis [data-kpi="noleidos"]');
await p.click('#informe'); await p.waitForTimeout(300);
await p.setViewportSize({ width: 1300, height: 900 }); await p.screenshot({ path: new URL('informe.png', import.meta.url).pathname });
console.log('informe:', (await p.textContent('#informeDoc')).replace(/\s+/g, ' ').slice(0, 420));
// Opciones: encabezado, agrupado por célula y detalle con el texto completo
await p.fill('[data-o="unidad"]', 'Jefatura de pruebas'); await p.fill('[data-o="marca"]', 'uso oficial');
await p.selectOption('[data-o="agrupar"]', 'tipo'); await p.check('[data-o="detalle"]'); await p.waitForTimeout(200);
const doc = await p.textContent('#informeDoc');
console.log('informe con opciones: marca', doc.includes('USO OFICIAL'), '| unidad', doc.includes('Jefatura de pruebas'), '| grupos', await p.$$eval('#informeDoc tr.grupo', l => l.length),
  '| fichas', await p.$$eval('#informeDoc .msg', l => l.length), '| texto completo', await p.$$eval('#informeDoc .msg .texto', l => l.length), '| extractos', await p.$$eval('#informeDoc .extracto', l => l.length),
  '| autoría', doc.includes('Cte. Alfredo Sánchez Sender'), '| ¿escapa?', !(await p.$('#informeDoc script')));
await p.screenshot({ path: new URL('informe-detalle.png', import.meta.url).pathname, fullPage: false });
const txtInf = await p.evaluate(() => { let t = ''; navigator.clipboard.writeText = x => { t = x; return Promise.resolve(); }; document.querySelector('[data-inf="texto"]').click(); return new Promise(r => setTimeout(() => r(t), 100)); });
console.log('texto:', txtInf.split('\n').slice(0, 9).join(' ⏎ ').slice(0, 400));
const [w] = await Promise.all([p.waitForEvent('download'), p.click('[data-inf="word"]')]); console.log('word:', w.suggestedFilename(), require('fs').readFileSync(await w.path(), 'utf8').includes('Relación de mensajes'));
await p.click('[data-inf="cerrar"]'); await p.click('#kpis [data-kpi="todos"]'); await p.selectOption('#fSitio', '');
await p.click('#estructura'); const est = await p.inputValue('#cajaEstructura textarea');
console.log(est.split('\n').slice(0, 12).join('\n'));
console.log('¿estructura con contenido?', /Mensaje \d|MANDO|persona@|R-\d/.test(est), '| errores:', errs);
// Clave caducada: el servicio contesta 406 a la clave guardada; el visor pide otra y sigue
const p3 = await ctx.newPage(); await p3.goto(O + WEB + '/SitePages/ambito.aspx#/celula/SETEC%20SEGURIDAD/' + G1); await consultasApp(p3);
await p3.evaluate(() => sessionStorage.setItem('visorMensadefPruebas.cabecerasApi', JSON.stringify({ passcode: 'caducada', user: 'x', momento: Date.now() })));
const antes = nClaves; await p3.evaluate(codigo); await p3.waitForTimeout(2500);
console.log('clave caducada → pide otra:', nClaves - antes, '|', await p3.$eval('#estado', e => e.textContent).catch(() => '-'));
await p3.close();
await p.setViewportSize({ width: 1400, height: 1000 }); await p.click('#lista tbody tr[data-i] >> nth=2'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#kpis').scrollIntoView()); await p.screenshot({ path: new URL('bandejas.png', import.meta.url).pathname });
await p.setViewportSize({ width: 390, height: 800 }); await p.screenshot({ path: new URL('bandejas-movil.png', import.meta.url).pathname });
await b.close();
