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
let nClaves = 0, marcadoLeido = 0; let sesion = !process.env.PORTAL || !!process.env.SESION; /* PORTAL=1: se empieza en la portada sin sesión en el ámbito */ const comentarios = [], banderasPuestas = [], rubricas = [], leidos = [];
const PASS = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', UID = 'abcdef01-2345-6789-abcd-ef0123456789';
// Consulta que hace la aplicación de MENSADEF al cambiar de célula (de ahí el favorito toma las cabeceras)
const consultaApp = pg => pg.evaluate(([P, U]) => fetch('https://mensadefapi.mdef.es/api/usuariovista/UsuarioVistaObtener?emailUsuario=persona%40et.mde.es', { headers: { 'Content-Type': 'application/json', passcode: P, user: U } }).catch(() => 0), [PASS, UID]);
const hoy = new Date(); const hace = h => { const d = new Date(hoy.getTime() - h * 3600e3); return d.toISOString().slice(0, 19); };
// Bandeja simulada: SEGURIDAD tiene 130 mensajes de entrada (2 páginas) en las últimas horas y otros antiguos; SECRETARIA 3
// PRESENTA: datos ficticios pero verosímiles para las capturas de presentación (no son mensajes reales)
const ASUNTOS = ['Revista anual de seguridad de instalaciones · calendario', 'Solicitud de visita a acuartelamiento durante festivos', 'Actualización del plan de seguridad de la base',
  'Informe de incidencias del mes de octubre', 'Instrucciones para el control de accesos de personal civil', 'Remisión de normativa de protección de la información',
  'Convocatoria de reunión de coordinación de seguridad', 'Petición de datos para el informe trimestral', 'Ejercicio de evacuación · resultados y lecciones aprendidas',
  'Mantenimiento de sistemas de videovigilancia', 'Designación de responsables de seguridad por unidad', 'Comunicación de obras en el perímetro'];
const bandeja = (cel, es, pag, tam) => {
  const total = cel === G1 && es === '1' ? 230 : cel === G2 ? 3 : cel === G4 ? 500 : 0;
  const els = [];
  for (let i = (pag - 1) * tam; i < Math.min(total, pag * tam); i++) els.push({ IdMensaje: '0000' + cel.slice(0, 4) + '-' + es + '000-0000-0000-' + String(i).padStart(12, '0'), IdBuzonCelula: G3, Asunto: process.env.PRESENTA ? ASUNTOS[i % ASUNTOS.length] : 'Mensaje ' + i + ' de ' + cel.slice(0, 4),
    Cuerpo: process.env.PRESENTA ? '<p>Se remite para su conocimiento y efectos la documentación adjunta. Se ruega acuse de recibo y, en su caso, la designación de un punto de contacto antes del próximo viernes.</p>' : '<p>Texto del mensaje ' + i + '</p><script>alert(1)</script>', Fecha: hace(i < 130 ? i * 0.3 : 24 * 40 + i), FechaRegistroEntrada: hace(i), IdEstadoMensaje: 3,
    NombreEstadoUltimaDistribucionSalida: es === '2' && i === 0 ? 'Pendiente de Validar' : '', EstadoMensaje: es === '2' && i === 0 ? 'Borrador' : es === '2' && i === 2 ? 'Enviado' : es === '2' && i === 1 ? 'Pendiente de firma' : i === 7 ? 'Pendiente de firma' : i % 3 ? 'Pendiente' : 'Leído', EstadoParaUsuario: i % 2 ? 'No leído' : 'Leído', TipoES: es === '1' ? 'E' : 'S', TipoMensaje: i % 4 ? 'Informe' : 'Orden', CodigoPrioridad: i % 9 ? 'R' : 'U',
    CelulaRemitente: i % 2 ? 'ET 2SUIGE JEFATURA' : 'ET 2SUIGE REGISTRO', CelulaDestinataria: 'ET 2SUIGE SETEC SEGURIDAD', NumeroRegistroEntrada: 'RE-' + i, Sref: 'SREF-' + i,
    ContieneAnexos: i % 5 === 0 ? 'Sí' : 'No', Leido: !!(i % 3), Actuacion: i % 3 === 0 ? 'ACCIÓN' : i % 3 === 1 ? 'INFORMACIÓN' : '', UltimoComentario: i % 4 === 0 ? 'Comentario ficticio ' + i : '', Firma: i % 2 ? (process.env.PRESENTA ? 'GENERAL JEFE DE LA SUIGE' : 'GENERAL JEFE <b>A</b>') : '', MotivoDistribucion: i % 3 ? 'Para conocimiento' : 'Para actuación', EnviableARubrica: es === '2' ? 'Sí' : 'No', BuzonPersonal: false, IdEtiqueta: i % 6 === 0 ? 1 : i % 6 === 1 ? 4 : i % 11 === 2 ? 9 : 0, IdCelulaRM: G3 });
  return { ListaElementos: els, ListaAgrupaciones: [], IndicePagina: pag, TamanoPagina: tam, TotalRegistros: total };
};
const b = await chromium.launch();
const mp = await b.newPage();
// FINAL=1: prueba el favorito definitivo (marcador-visor-mensadef.html) en lugar del de pruebas
const FINAL = !!process.env.FINAL, MEM = FINAL ? 'visorMensadef.' : 'visorMensadefPruebas.';
await mp.goto(new URL(FINAL ? '../marcador-visor-mensadef.html' : '../marcador-visor-mensadef-pruebas.html', import.meta.url).href);
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
  // Como el real: lo del ámbito con la colección raíz (la de la portada) contesta 500
  if (process.env.PORTAL && /^(etiqueta\/EtiquetasObtener|ambito\/UsuarioCelulas|buzon\/ObtenerBuzonCelula)$/.test(ruta) && !/\/ambito\//i.test(q.urlColeccionSitio || '')) return r.fulfill({ status: 500, headers: H, body: '' });
  if (ruta === 'usuariovista/UsuarioVistaObtener') return r.fulfill({ headers: H, json: {} });
  // Como el real: la consulta sin clave devuelve la clave en las cabeceras de la respuesta (IdUsuario = passcode, User)
  // (como en el real, MensadefActivo responde pero sin clave; la da ValidateUser con la cuenta del usuario)
  if (ruta === 'ambitocomun/MensadefActivo') return r.fulfill({ headers: H, json: true });
  if (ruta === 'usuario/ValidateUser') { nClaves++; const ok = !process.env.NOCLAVE && q.idUsuario === 'persona'; return r.fulfill({ headers: Object.assign({ 'Access-Control-Expose-Headers': 'IdUsuario, User' }, H, ok ? { IdUsuario: PASS, User: UID } : {}), json: true }); }
  if (hd.passcode !== PASS || hd.user !== UID) return r.fulfill({ status: 406, headers: H, body: '' });
  if (q.emailUsuario !== 'persona@et.mde.es' || q.urlColeccionSitio !== O + WEB) return r.fulfill({ status: 400, headers: H, json: { error: 'parámetros' } });
  if (ruta === 'usuario/ConsultaUsuarioDicodefPorCorreo' && process.env.PORTAL) return r.fulfill({ headers: H, json: { Datos: { IdUsuario: 999, Nombre: 'PERSONA', Correo: q.emailUsuario } } });
  if (ruta === 'usuario/ConsultaUsuarioDicodefPorCorreo') return r.fulfill({ headers: H, json: { Datos: { IdUsuario: 77, Nombre: 'PERSONA', Correo: q.emailUsuario } } });
  // Como el real: con un número de usuario que no es el suyo contesta 500
  if (ruta === 'ambito/UsuarioCelulas' && process.env.PORTAL && q.idUsuario !== '77') return r.fulfill({ status: 500, headers: H, body: '' });
  if (ruta === 'ambito/UsuarioCelulas') return r.fulfill({ headers: H, json: q.idUsuario !== '77' ? [] : q.tipoCelula === '4' ? [{ IdCelula: G1, NombreCelula: 'SETEC SEGURIDAD', TipoCelula: 4 }, { IdCelula: G2, NombreCelula: 'SETEC SECRETARIA', TipoCelula: 4 }]
    : [{ IdCelula: G1, NombreCelula: 'SETEC SEGURIDAD', TipoCelula: 4 }, { IdCelula: G2, NombreCelula: 'SETEC SECRETARIA', TipoCelula: 4 }, { IdCelula: G4, NombreCelula: 'ET 2SUIGE REGISTRO', TipoCelula: 1 }, { IdCelula: G3, NombreCelula: 'ET 2SUIGE JEFATURA PORTAFIRMAS', TipoCelula: 2 }] });
  // Catálogo de banderas, como el real: [{IdEtiqueta, Nombre, Color}] (la 9 no está: se ve como «Bandera 9»)
  if (ruta === 'etiqueta/EtiquetasObtener') return r.fulfill({ headers: H, json: [{ IdEtiqueta: 1, Nombre: 'Urgente', Color: '#FF0000' }, { IdEtiqueta: 4, Nombre: 'Finalizado', Color: 'verde' }, { IdEtiqueta: 5, Nombre: 'Seguimiento', Color: 'x;}<b>' }] });
  // Cuerpo del mensaje con sus anexos (como el real: solo responde con el modoVer que usa la aplicación)
  if (ruta === 'mensaje/ObtenerCuerpo') return q.modoVer !== 'true' ? r.fulfill({ status: 400, headers: H, body: '' }) : r.fulfill({ headers: H, json: { ID: q.id, Cuerpo: 'Texto completo', Destinatarios: Array.from({ length: 9 }, (_, k) => ({ ID: k, Nombre: (process.env.PRESENTA ? ['GENERAL JEFE DE LA SUIGESUR', 'JEFE DE LA SECCIÓN DE SEGURIDAD', 'JEFE DEL NEGOCIADO DE INSTALACIONES'][k % 3] + ' ' + (k + 1) : 'DESTINATARIO <b>' + k + '</b>'), TipoDestinatario: 'Autoridad' })), DestinatariosCopia: [{ Nombre: 'COPIA UNO' }], UrlCarpeta: WEB + '/SMDMDMensajesDocumentos_20261105/' + q.id, AnexosFisicos: [{}],
    AnexosDigitales: [{ Titulo: process.env.PRESENTA ? 'Calendario de revistas 2027' : 'Informe <b>anexo</b>', Nombre: process.env.PRESENTA ? 'calendario revistas 2027.pdf' : 'informe anexo.pdf', UrlFichero: WEB + '/SMDMDMensajesDocumentos_20261105/' + q.id + '/informe anexo.pdf', TipoDocumento: 'Informe', TamanoMB: '0,2', Firma: 'Firmado' },
      { Titulo: process.env.PRESENTA ? 'Relación de instalaciones' : 'Datos', Nombre: process.env.PRESENTA ? 'relacion instalaciones.7z.cif' : 'datos.7z.cif', UrlFichero: WEB + '/SMDMDMensajesDocumentos_20261105/' + q.id + '/datos.7z.cif', TamanoMB: '0,1' }] } });
  if (ruta === 'mensaje/EnvioAPortafirmas') { rubricas.push({ metodo: r.request().method(), q: [...u.searchParams.keys()].join(','), id: q.idMensaje, personal: q.buzonPersonal, cuerpo: r.request().postData() || '', passcode: hd.passcode === PASS }); return r.fulfill({ headers: H, json: rubricas.length === 1 ? { Correcto: false, MensajeInformativo: 'El mensaje no está en <b>validación</b>', ListaRespuestas: [] } : { Correcto: true, MensajeInformativo: 'Enviado al portafirmas', ListaRespuestas: [] } }); }
  if (ruta === 'etiqueta/EtiquetaMensajeGuardar') { banderasPuestas.push({ metodo: r.request().method(), q: [...u.searchParams.keys()].join(','), idBuzon: q.idBuzonCelula, idEtiqueta: q.idEtiqueta, cuerpo: r.request().postData() || '', passcode: hd.passcode === PASS }); return r.fulfill({ headers: H, body: '' }); }
  if (ruta === 'mensaje/ComentarioCrear') { comentarios.push({ metodo: r.request().method(), params: [...u.searchParams.keys()].join(','), cuerpo: JSON.parse(r.request().postData() || '{}'), passcode: hd.passcode === PASS }); return r.fulfill({ headers: H, json: true }); }
  if (ruta === 'buzon/BuzonCelulaMensajeLeido') { marcadoLeido++; leidos.push({ metodo: r.request().method(), q: [...u.searchParams.keys()].join(','), estado: q.estado, buzon: !!q.idBuzonCelula, cuerpo: r.request().postData() || '', passcode: hd.passcode === PASS }); return r.fulfill({ headers: H, json: {} }); }
  if (ruta === 'buzon/ObtenerBuzonCelula') return r.fulfill({ headers: H, json: bandeja(q.idCelula, q.tipoES, +q.indicePagina, +q.tamanoPagina) });
  r.fulfill({ status: 404, headers: H, body: '' });
});
await ctx.route(O + '/**', r => {
  if (r.request().url().includes('SMDMDMensajesDocumentos')) return r.fulfill({ contentType: /\.cif$/.test(r.request().url()) ? 'application/octet-stream' : 'application/pdf', body: '%PDF-1.4 simulado' });
  const u = decodeURIComponent(r.request().url()), acc = r.request().headers().accept || '';
  if (verbose && acc.includes('nometadata') && u.includes('/_api/')) return r.fulfill({ status: 406, body: '' });
  const J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(verbose ? { d: o } : o) });
  // Página de MENSADEF simulada: al entrar en la ruta de una célula, la aplicación consulta su servicio con sus cabeceras
  // Bandeja pintada por la «aplicación» (para «Abrir en MENSADEF»): 5 filas tras 1,5 s y un buscador que deja la fila pedida
  // Inicio de sesión de MENSADEF simulado: un botón que abre la sesión y lleva al ámbito
  if (u.includes('/_layouts/15/Defensa/Default.aspx')) return r.fulfill({ contentType: 'text/html', body: '<html><body><h1>Inicio de sesión</h1><button id="entrar">Iniciar sesión</button><script>entrar.onclick=function(){fetch("/login-ok").then(function(){location.href=new URLSearchParams(location.search).get("Source")+"/SitePages/ambito.aspx";});};</script></body></html>' });
  if (u.endsWith('/login-ok')) { sesion = true; return r.fulfill({ body: 'ok' }); }
  if (!sesion && u.includes(WEB + '/_api/')) return r.fulfill({ status: 403, contentType: 'text/html', body: 'sin sesión' });
  if (!u.includes('/_api/') && u.includes('?app=1')) return r.fulfill({ contentType: 'text/html', body: '<html><body><h1>MENSADEF</h1><input placeholder="Buscar mensajes"><table id="t"></table><script>' +
    'function fila(i){return "<tr class=\\"ms-Row\\" onclick=\\"window.abierto=\\x27RE-"+i+"\\x27\\"><td>RE-"+i+"</td><td><span>Mensaje "+i+" de 8d71</span></td></tr>";}' +
    'setTimeout(function(){t.innerHTML=[0,1,2,3,4].map(fila).join("");},1500);' +
    'document.querySelector("input").addEventListener("keyup",function(e){if(e.key!=="Enter")return;var n=/RE-(\\d+)/.exec(this.value);window.buscado=this.value;setTimeout(function(){t.innerHTML=n?fila(n[1]):"";},600);});' +
    '</script></body></html>' });
  if (!u.includes('/_api/')) return r.fulfill({ contentType: 'text/html', body: '<html><body>MENSADEF<script>if (/Landing\\.aspx/i.test(location.pathname)) { fetch("' + API + '/api/usuario/ValidateUser?idUsuario=persona&useUid=false"); fetch("' + API + '/api/ambitocomun/AmbitoRegistral?emailUsuario=persona%40et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es"); fetch("' + API + '/api/ambito/UsuarioCelulas?idUsuario=77&tipoCelula=-1&emailUsuario=persona%40et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es"); }if (/SitePages\\/ambito\\.aspx/i.test(location.pathname)) setTimeout(function () { fetch("' + API + '/api/usuario/ValidateUser?idUsuario=persona&useUid=false"); fetch("' + API + '/api/ambito/UsuarioCelulas?idUsuario=77&tipoCelula=-1&emailUsuario=persona%40et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es%2Fambito%2F2SUIGE", { headers: { "Content-Type": "application/json", passcode: "' + PASS + '", user: "' + UID + '" } }); }, ' + (process.env.LENTO ? 18000 : 300) + ');addEventListener("hashchange", function () { if (/^#\\/celula\\//.test(location.hash)) fetch("' + API + '/api/usuariovista/UsuarioVistaObtener?x=1", { headers: { "Content-Type": "application/json", passcode: "' + PASS + '", user: "' + UID + '" } }); });</script></body></html>' });
  if (u.startsWith(O + WEB + '/_api/web?')) return J({ Url: O + WEB, Title: 'Segunda SUIGE' });
  if (u.includes('/_api/web?')) return r.fulfill({ status: 404, body: '' });
  if (u.includes('currentuser')) return J(process.env.SINCORREO ? { Title: 'PERSONA', Email: '', UserPrincipalName: '', LoginName: 'i:0#.w|et\\persona' } : { Title: 'PERSONA', Email: 'persona@et.mde.es', LoginName: 'i:0#.w|et\\persona' });
  if (u.includes('GetMyProperties')) return J({ Email: '', UserProfileProperties: [] });
  if (u.includes('/_api/site?')) return J({ Url: O + WEB });
  r.fulfill({ status: 404, body: '' });
});
// Se pulsa desde una tercera célula que no viene en la lista (se añade por la dirección)
await p.goto(process.env.PORTAL ? O + '/SitePages/Landing.aspx' : O + WEB + '/SitePages/ambito.aspx');
// Lo que la aplicación de MENSADEF ya consultó en la página (en la realidad lo vuelve a hacer al recargar)
const consultasApp = pg => !process.env.SINCORREO ? null : pg.evaluate(() => { const o = performance.getEntriesByType.bind(performance); performance.getEntriesByType = t => t !== 'resource' ? o(t) : [
  { name: 'https://mensadefapi.mdef.es/api/usuario/ValidateUser?idUsuario=persona&useUid=true' },
  { name: 'https://mensadefapi.mdef.es/api/ambito/UsuarioCelulas?idUsuario=77&tipoCelula=-1&emailUsuario=persona%40et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es%2Fambito%2F2SUIGE' }]; });
await consultasApp(p);
if (process.env.VENTANA) await p.evaluate(M => localStorage.setItem(M + 'sinAutoentrada', 'true'), MEM);
await p.evaluate(codigo); await p.waitForTimeout(2500);
if (process.env.PORTAL && !process.env.SESION && !process.env.VENTANA) {
  // Entrada automática (pruebas): sin ventana y sin pulsar nada
  let ventanas = 0; ctx.on('page', () => ventanas++);
  await p.waitForFunction(() => /mensajes del/.test(document.getElementById('estado').textContent), null, { timeout: 90000 }).catch(() => 0);
  console.log('aviso:', (await p.textContent('#aviso')).slice(0, 200), '| msg:', await p.textContent('#msgPortal').catch(() => '-'));
  console.log('entrada automática: ventanas abiertas:', ventanas, '| marco quitado:', !(await p.$('iframe')), '| estado:', await p.textContent('#estado'));
}
if (process.env.PORTAL && !process.env.SESION && process.env.VENTANA) {
  console.log('portal:', (await p.textContent('#aviso')).replace(/\s+/g, ' ').slice(0, 160), '| ámbito propuesto:', await p.inputValue('#codAmbito'));
  await p.setViewportSize({ width: 1366, height: 900 }); await p.screenshot({ path: new URL('portal.png', import.meta.url).pathname }); await p.setViewportSize({ width: 390, height: 844 }); await p.screenshot({ path: new URL('portal-movil.png', import.meta.url).pathname }); await p.setViewportSize({ width: 1280, height: 720 });
  const [w] = await Promise.all([ctx.waitForEvent('page'), p.click('#entrarAmbito')]); await w.waitForLoadState();
  console.log('ventana de inicio de sesión:', decodeURIComponent(w.url().replace(O, '')));
  await w.click('#entrar'); await p.waitForFunction(() => /mensajes del/.test(document.getElementById('estado').textContent), null, { timeout: 90000 }).catch(() => 0);
  console.log('tras iniciar sesión: ventana cerrada:', w.isClosed(), '| portal oculto:', await p.isHidden('#aviso'), '| estado:', await p.textContent('#estado'));
}
if (true) {
  // Uso real: «Ocultar vistos» marcado; abrir uno no leído y marcarlo visto enseguida (el leído aún en camino)
  await p.check('#fVistos'); await p.waitForTimeout(300);
  const n = () => p.$$eval('#lista tbody tr[data-i]', x => x.length);
  const sel = 'tr.noleido >> nth=0';
  let n0 = await n(); await p.click('#lista tbody ' + sel + ' >> td.asunto'); await p.click('#verDet'); await p.waitForTimeout(1200);
  console.log('VISTO ficha nada más abrir: filas', n0, '→', await n());
  n0 = await n(); await p.click('#lista tbody tr[data-i] >> nth=2 >> td.asunto'); await p.waitForTimeout(800); await p.click('#verDet'); await p.waitForTimeout(800);
  console.log('VISTO ficha tras abrir: filas', n0, '→', await n());
  n0 = await n(); await p.click('#lista tbody tr[data-i] >> nth=3 >> [data-visto]'); await p.waitForTimeout(800);
  console.log('VISTO casilla de la tabla: filas', n0, '→', await n());
  await p.click('#kpis [data-kpi="noleidos"]'); await p.waitForTimeout(300); n0 = await n(); await p.click('#lista tbody tr[data-i] >> nth=0 >> [data-visto]'); await p.waitForTimeout(800);
  console.log('VISTO con la tarjeta «No leídos»: filas', n0, '→', await n()); await p.click('#kpis [data-kpi="noleidos"]');
  await p.uncheck('#fVistos'); await p.click('#kpis [data-kpi="sinver"]'); await p.waitForTimeout(300); n0 = await n(); await p.click('#lista tbody tr[data-i] >> nth=0 >> [data-visto]'); await p.waitForTimeout(800);
  console.log('VISTO en la tarjeta «Sin revisar» (sin «Ocultar vistos»): filas', n0, '→', await n()); await p.click('#kpis [data-kpi="sinver"]');
}
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
await p2.evaluate(M => { try { localStorage.removeItem(M + 'celulasElegidas'); } catch (e) {} }, MEM);
await consultasApp(p2); await p2.evaluate(codigo); await p2.waitForTimeout(1500); console.log('desde la célula SECRETARIA:', await p2.textContent('#resumenCelulas')); await p2.close();
await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(300);
console.log('detalle:', (await p.textContent('#detalle')).replace(/\s+/g, ' ').slice(0, 420));
console.log('abrir en MENSADEF: botón', !!(await p.$('#abrirMensadef')));
console.log('gestor por defecto:', await p.$$eval('#gestorSel option', o => o.map(x => x.textContent + (x.selected ? ' (elegido)' : '')).join(' | ')), '| texto del botón PSIT:', await p.textContent('#aPunto').catch(() => '(no está)'));
await p.click('#cambiarColabora'); await p.fill('#nomGestor', 'Mi gestor de pruebas'); await p.fill('#urlColabora', 'https://colabora.mdef.es/x/tareas-nlt-colabora-pruebas.html');
await ctx.route('https://colabora.mdef.es/**', r => r.fulfill({ contentType: 'text/html', body: 'ok' }));
await p.click('#guardarColabora'); await p.waitForTimeout(200);
const [nueva] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await nueva.waitForLoadState();
console.log('a Colabora:', decodeURIComponent(nueva.url().split('#importar=')[1]).slice(0, 400));
await p.bringToFront();
// Segundo gestor (el común) y elegir a cuál va: en la versión definitiva se admite cualquier dirección de Colabora
if (FINAL) {
  await nueva.close(); await p.click('#cambiarColabora'); await p.fill('#nomGestor', 'Gestor común SUIGESUR'); await p.fill('#urlColabora', 'https://colabora.mdef.es/et/SUIGESUR/JSUIGE/Documentos/tareas-nlt-colabora.html');
  await p.click('#guardarColabora'); await p.waitForTimeout(200);
  console.log('gestores:', await p.$$eval('#gestorSel option', o => o.map(x => x.textContent + (x.selected ? ' (elegido)' : '')).join(' | ')));
  const [n2] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await n2.waitForLoadState();
  console.log('va al común:', n2.url().split('#')[0]); await n2.close();
  await p.selectOption('#gestorSel', '1'); const [n3] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await n3.waitForLoadState();
  console.log('va al mío:', n3.url().split('#')[0], '| aviso:', (await p.textContent('#colabora p.muted')).trim()); await n3.close(); await p.bringToFront();
}
// Departamento para META: la célula de MENSADEF del mensaje; el responsable lo pone META (quien crea la tarea)
{ console.log('META aviso:', (await p.textContent('#colabora')).match(/Departamento en META:[^·]*/)?.[0]);
  const [n6] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await n6.waitForLoadState();
  const d6 = JSON.parse(decodeURIComponent(n6.url().split('#importar=')[1])); await n6.close(); await p.bringToFront();
  // «📋 Al Punto de Situación» (de momento solo en pruebas): pasa por META con la marca punto
  { const [n7] = await Promise.all([ctx.waitForEvent('page'), p.click('#aPunto')]); await n7.waitForLoadState();
    const d7 = JSON.parse(decodeURIComponent(n7.url().split('#importar=')[1])); await n7.close(); await p.bringToFront();
    { const r = await p.$eval('#aPunto', b => { const x = b.getBoundingClientRect(), y = document.querySelector('#aColabora').getBoundingClientRect(); return { alto: Math.round(x.height), altoMeta: Math.round(y.height), unaLinea: b.scrollWidth <= b.clientWidth + 1 }; });
      console.log('PUNTO: botón entero en una línea:', r.unaLinea, '| alto', r.alto, 'como META', r.altoMeta); }
    console.log('PUNTO: botón', !!(await p.$('#aPunto')), '| va a META con punto =', d7.punto, '| departamento', d7.departamento); }
  console.log('META recibe todas las células:', (d6.departamentos || []).join(', '));
  console.log('META recibe: departamento', d6.departamento, '| responsable', d6.responsable === undefined ? '(no se manda)' : d6.responsable, '| negociado', d6.negociado === undefined ? '(no se manda)' : d6.negociado); }
// Anexos: lista, abrir (pestaña nueva) y descargar con la sesión; el visor no marca el mensaje como leído
await p.fill('#buscar', 'RE-5'); await p.waitForTimeout(400); await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(1200);
console.log('anexos:', (await p.textContent('#adjuntos').catch(() => '-')).replace(/\s+/g, ' ').slice(0, 220), '| ¿HTML del servidor?', !!(await p.$('#adjuntos b b')));
{ await p.evaluate(() => { const o = window.open; window.open = function (u) { window.__abierto = u; return o.apply(this, arguments); }; }); const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#adjuntos [data-anexo="0"][data-modo="abrir"]')]); console.log('url pedida:', decodeURI(await p.evaluate(() => window.__abierto)).replace(O, '')); await pop.close().catch(() => {}); }
{ const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#adjuntos [data-anexo="1"][data-modo="bajar"]')]); console.log('descargar cifrado →', dl.suggestedFilename(), '| botón abrir en el cifrado:', !!(await p.$('#adjuntos [data-anexo="1"][data-modo="abrir"]'))); }
console.log('¿lo ha marcado como leído en MENSADEF?', marcadoLeido > 0, '(sí: al abrir los no leídos)');
// Leído en MENSADEF: abrir uno no leído lo marca (PUT estado=true) y quita la negrita; «Marcar no leído» lo deshace
{
  await p.fill('#buscar', 'RE-6'); await p.waitForTimeout(400);
  const fila = '#lista tbody tr[data-i] >> nth=0'; const neg = () => p.$eval('#lista tbody tr[data-i]', t => t.classList.contains('noleido'));
  const n0 = leidos.length, antes = await neg(); await p.click(fila); await p.waitForTimeout(600);
  const l = leidos[leidos.length - 1] || {};
  console.log('leído al abrir: negrita antes', antes, '→ después', await neg(), '| llamada:', l.metodo, l.q, 'estado=' + l.estado, '| buzón:', l.buzon, '| sin cuerpo:', l.cuerpo === '', '| passcode:', l.passcode, '| nuevas:', leidos.length - n0, '| botón:', (await p.textContent('#leidoBtn')).trim());
  await p.click('#leidoBtn'); await p.waitForTimeout(500);
  console.log('marcar no leído: estado=' + (leidos[leidos.length - 1] || {}).estado, '| negrita:', await neg(), '| botón:', (await p.textContent('#leidoBtn')).trim());
  await p.click('#leidoBtn'); await p.waitForTimeout(500); await p.fill('#buscar', ''); await p.waitForTimeout(300);
}
// Actualizar: vuelve a leer, deja la ficha abierta y muestra la hora
{ const h0 = await p.textContent('#detalle .cab-msg h2'), n0 = llamadas.filter(x => /ObtenerBuzonCelula/.test(x)).length, t0 = await p.textContent('#ultimaAct');
  await p.click('#actualizar'); await p.waitForFunction(() => !document.getElementById('actualizar').disabled, null, { timeout: 30000 }); await p.waitForTimeout(300);
  console.log('actualizar: hora antes', JSON.stringify(t0), '→', (await p.textContent('#ultimaAct')).replace(/\d\d:\d\d:\d\d/, 'HH:MM:SS'), '| relee MENSADEF:', llamadas.filter(x => /ObtenerBuzonCelula/.test(x)).length > n0, '| misma ficha abierta:', !(await p.isHidden('#detalle')) && (await p.textContent('#detalle .cab-msg h2')) === h0, '| botón:', (await p.textContent('#actualizar')).trim()); }
// Comentario en MENSADEF (solo en la copia de pruebas): caja con confirmación y comentario automático al añadir a META
{ console.log('selector de bandera presente:', !!(await p.$('#selBandera'))); console.log('caja de comentario:', !!(await p.$('#txtComentario')), '| casilla anotar en META:', !!(await p.$('#anotarMeta')), '| comentarios automáticos hasta aquí:', comentarios.length);
  {
    await p.fill('#txtComentario', 'Revisado por la sección'); await p.click('#guardarComentario'); await p.waitForTimeout(200);
    console.log('primer clic: pide confirmar:', (await p.textContent('#guardarComentario')).trim(), '| enviados:', comentarios.length);
    await p.click('#guardarComentario'); await p.waitForTimeout(500);
    const c = comentarios[comentarios.length - 1] || {};
    console.log('comentario:', c.metodo, c.params, JSON.stringify(c.cuerpo), '| passcode:', c.passcode, '|', (await p.textContent('#msgComentario')).trim(),
      '| último comentario en la ficha:', await p.$$eval('#detalle .ficha-campos dt', l => (l.find(d => d.textContent === 'Último comentario') || {}).nextElementSibling?.textContent));
    if (!/— PERSONA"$/.test(JSON.stringify(c.cuerpo.Comentario || ''))) console.log('Error: el comentario no va firmado con el nombre');
    const n0 = comentarios.length; const [n4] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await n4.close(); await p.waitForTimeout(500); await p.bringToFront();
    console.log('al añadir a META:', comentarios.length - n0, '→', (comentarios[comentarios.length - 1] || {}).cuerpo?.Comentario?.replace(/el .* ·/, 'el (fecha) ·'), '|', (await p.textContent('#colabora')).includes('Comentario añadido en MENSADEF'));
    { const subs = await p.$$eval('td.asunto .sub', n => n.map(x => x.innerHTML));
      const ok2 = subs.some(h => /act accion/.test(h)) && subs.some(h => /act info/.test(h)) && subs.some(h => /class="com"/.test(h)) && !subs.some(h => /Motivo:|GENERAL JEFE/.test(h));
      const fila = await p.$eval('tr.sel td.asunto', e => e.textContent).catch(() => '');
      const ancho = await p.evaluate(() => Math.round(document.querySelector('main').getBoundingClientRect().width / window.innerWidth * 100));
      console.log('bajo el asunto: acción/info y último comentario:', ok2, '| la fila muestra el comentario de META:', / por PERSONA el /.test(fila), '| ancho de la zona de trabajo:', ancho + '%');
      if (!ok2 || !/ por PERSONA el /.test(fila) || ancho < 95) console.log('Error: línea bajo el asunto o ancho'); }
    if (process.env.CAPTURA_ANCHA) { const v = p.viewportSize(); await p.setViewportSize({ width: 1920, height: 1000 }); await p.evaluate(() => { const l = document.querySelector('#layout'); scrollTo(0, l.getBoundingClientRect().top + scrollY - 80); }); await p.waitForTimeout(400); await p.screenshot({ path: process.env.CAPTURA_ANCHA }); await p.setViewportSize(v); }
    if (!/ por PERSONA el /.test((comentarios[comentarios.length - 1] || {}).cuerpo?.Comentario || '')) console.log('Error: el comentario de META no lleva el nombre de quien lo añade');
    await p.uncheck('#anotarMeta'); const n1 = comentarios.length; const [n5] = await Promise.all([ctx.waitForEvent('page'), p.click('#aColabora')]); await n5.close(); await p.waitForTimeout(400); await p.bringToFront();
    console.log('casilla desmarcada → sin comentario:', comentarios.length === n1); await p.check('#anotarMeta');
    // Bandera: poner «Seguimiento» y quitarla
    console.log('selector de bandera:', await p.$$eval('#selBandera option', o => o.map(x => x.textContent).join(' | ')));
    await p.selectOption('#selBandera', '5'); await p.waitForTimeout(500);
    const bp = banderasPuestas[banderasPuestas.length - 1] || {};
    console.log('bandera puesta:', bp.metodo, bp.q, 'idEtiqueta=' + bp.idEtiqueta, '| buzón:', !!bp.idBuzon, '| sin cuerpo:', bp.cuerpo === '', '| passcode:', bp.passcode, '| ficha:', (await p.textContent('#detalle .cab-msg .bandera').catch(() => '-')), '| aviso:', (await p.textContent('#colabora p').catch(() => '-')), '| selector:', await p.$eval('#selBandera', x => x.options[x.selectedIndex].textContent));
    await p.selectOption('#selBandera', ''); await p.waitForTimeout(500);
    console.log('bandera quitada: idEtiqueta=' + (banderasPuestas[banderasPuestas.length - 1] || {}).idEtiqueta, '| en la ficha:', !!(await p.$('#detalle .cab-msg .bandera')), '| selector:', await p.$eval('#selBandera', x => x.options[x.selectedIndex].textContent));
    // Pasar a rúbrica: solo en los «Enviable a rúbrica»; dos pulsaciones; si MENSADEF dice que no, se ve su motivo
    console.log('rúbrica en uno de entrada:', !!(await p.$('#aRubrica')));
    {
    await p.fill('#buscar', ''); await p.selectOption('#fSitio', ''); await p.selectOption('[data-x="EnviableARubrica"]', 'Sí'); await p.waitForTimeout(300);
    const conR = await p.$$eval('#lista tbody tr[data-i]', l => l.length); let k = 0;
    for (; k < conR; k++) { await p.click('#lista tbody tr[data-i] >> nth=' + k); await p.waitForTimeout(250); if (await p.$('#aRubrica')) break; }
    { const con = []; for (let k2 = 0; k2 < conR; k2++) { await p.click('#lista tbody tr[data-i] >> nth=' + k2); await p.waitForTimeout(250); { const t = await p.textContent('#detalle .cab-msg'); con.push((/Pendiente de firma/.test(t) ? 'pendiente de firma' : /Enviado/.test(t) ? 'enviado' : 'en validación') + '→' + (await p.$('#aRubrica') ? 'botón' : 'sin botón')); } }
      console.log('enviables (estado Enviado:botón):', con.join(' ')); await p.click('#lista tbody tr[data-i] >> nth=' + k); await p.waitForTimeout(250); }
    console.log('estado en la tabla del que está en validación:', await p.$$eval('#lista tbody tr[data-i]', l => l.map(t => t.textContent).filter(x => /Pendiente de Validar/.test(x)).length), '| ocultos como borrador:', /borradores ocultos/.test(await p.textContent('#chips')));
    console.log('salida:', conR, '| con botón rúbrica en la fila', k, '| filtro «Enviable a rúbrica»:', await p.$$eval('[data-x="EnviableARubrica"] option', o => o.map(x => x.textContent).join(', ')).catch(() => 'no hay'));
    await p.click('#aRubrica'); await p.waitForTimeout(200); console.log('1.ª pulsación:', (await p.textContent('#aRubrica')).trim(), '| enviados:', rubricas.length);
    await p.click('#aRubrica'); await p.waitForTimeout(500); console.log('MENSADEF dice que no:', (await p.textContent('#colabora p')).trim(), '| ¿HTML?', !!(await p.$('#colabora p b')), '| botón vuelve:', (await p.textContent('#aRubrica')).trim());
    await p.click('#aRubrica'); await p.click('#aRubrica'); await p.waitForTimeout(500);
    const rr = rubricas[rubricas.length - 1] || {};
    console.log('rúbrica:', rr.metodo, rr.q, '| id:', !!rr.id, '| buzonPersonal=' + rr.personal, '| sin cuerpo:', rr.cuerpo === '', '| passcode:', rr.passcode, '|', (await p.textContent('#colabora p')).trim(), '| botón tras enviar:', !!(await p.$('#aRubrica')), '| marca en la tabla:', await p.$$eval('#lista tr[data-i] .tag', l => l.some(x => /Rúbrica/.test(x.textContent))));
    console.log('enlace a Rúbrica:', await p.getAttribute('#irRubrica', 'href').catch(() => 'no hay'), '| nueva pestaña:', await p.getAttribute('#irRubrica', 'target').catch(() => '-'));
    await p.selectOption('[data-x="EnviableARubrica"]', ''); await p.fill('#buscar', 'RE-7'); await p.waitForTimeout(400); await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(300);
    console.log('pendiente de firma → enlace a Rúbrica:', !!(await p.$('#irRubrica')), '| pasar a rúbrica:', !!(await p.$('#aRubrica'))); await p.fill('#buscar', '');
    }
    await p.selectOption('[data-x="EnviableARubrica"]', ''); await p.waitForTimeout(300);
  }
}
// PRESENTA=carpeta: capturas para presentar SENDERO (datos simulados)
if (process.env.PRESENTA) {
  const dir = process.env.PRESENTA; await p.setViewportSize({ width: 1400, height: 900 });
  await p.fill('#buscar', ''); await p.waitForTimeout(400); await p.click('#lista tbody tr[data-i] >> nth=2'); await p.waitForTimeout(1500);
  await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: dir + '/p1.png' });
  await p.evaluate(() => { const l = document.querySelector('#layout'); scrollTo(0, l.getBoundingClientRect().top + scrollY - 70); }); await p.waitForTimeout(300); await p.screenshot({ path: dir + '/p2.png' });
}
// Correo (mailto) con la información del mensaje, botón naranja
await p.evaluate(() => { document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (a) { window.__mailto = a.href; e.preventDefault(); } }, true); });
await p.click('#porCorreo'); await p.waitForTimeout(200);
{ const mt = await p.evaluate(() => window.__mailto || ''); const body = decodeURIComponent((mt.split('&body=')[1] || '')); const subj = decodeURIComponent((mt.split('subject=')[1] || '').split('&')[0]);
  console.log('correo:', subj, '| líneas:', body.split('\n').slice(0, 6).join(' / '), '| enlace a MENSADEF:', /Abrir MENSADEF: https/.test(body), '| documentos:', /Documentos del mensaje/.test(body), '| largo:', mt.length, '| botón naranja:', await p.$eval('#porCorreo', b => b.classList.contains('naranja'))); }
// Visto: con «Ocultar vistos» desaparece al momento y el botón se pone verde
await p.fill('#buscar', ''); await p.waitForTimeout(300); await p.check('#fVistos'); await p.waitForTimeout(200);
{ const n0 = await p.$$eval('#lista tr[data-i]', x => x.length); await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(500);
  await p.click('#verDet'); await p.waitForTimeout(300); const n1 = await p.$$eval('#lista tr[data-i]', x => x.length);
  console.log('visto con filtro: filas', n0, '→', n1, '| botón verde:', await p.$eval('#verDet', b => b.classList.contains('visto-on')), '|', (await p.textContent('#verDet')).trim());
  await p.click('#lista tbody tr[data-i] >> nth=3'); await p.waitForTimeout(400); await p.click('#ampliar'); await p.waitForTimeout(200); const pos0 = await p.textContent('.navmax .muted'), t0 = await p.textContent('#detalle .cab-msg h2');
  await p.keyboard.press('v'); await p.waitForTimeout(500);
  console.log('ampliada + tecla V: pasa al siguiente:', (await p.textContent('#detalle .cab-msg h2')) !== t0 || pos0 !== (await p.textContent('.navmax .muted')), '|', pos0, '→', await p.textContent('.navmax .muted'), '| botón META:', (await p.textContent('#aColabora')).trim());
  await p.click('#ampliar'); await p.uncheck('#fVistos'); await p.waitForTimeout(300); }
// Con la tabla larga y bajando, la barra de la ficha sigue a la vista
await p.setViewportSize({ width: 1400, height: 800 }); await p.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.7)); await p.waitForTimeout(200);
console.log('barra visible al bajar:', await p.evaluate(() => { const r = document.querySelector('#detalle .barra-ficha').getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return r.top >= h.bottom - 2 && r.bottom <= innerHeight; }));
await p.screenshot({ path: new URL('bajando.png', import.meta.url).pathname });
console.log('botón derecho bloqueado:', await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.querySelector('#lista').dispatchEvent(e); return e.defaultPrevented; }),
  '| en un campo de texto se permite:', await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.querySelector('#buscar').dispatchEvent(e); return !e.defaultPrevented; }),
  '| Ctrl+U bloqueado:', await p.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'u', ctrlKey: true, bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; }));
await p.fill('#buscar', ''); await p.waitForTimeout(300); await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(300);
// Ficha con los campos pedidos y ampliar
console.log('destinatarios:', (await p.textContent('#fDest').catch(() => 'sin campo')).replace(/\s+/g, ' ').slice(0, 200));
console.log('ficha:', await p.$$eval('#detalle dl.ficha-campos dt', l => l.map(x => x.textContent).join(', ')), '| otros plegados:', await p.textContent('#detalle details.otros summary').catch(() => '-'));
await p.click('#ampliar'); console.log('ampliada: tabla oculta', await p.isHidden('#lista'), '|', await p.textContent('#ampliar')); await p.setViewportSize({ width: 1300, height: 900 }); await p.evaluate(() => scrollTo(0, document.querySelector('#detalle').getBoundingClientRect().top + scrollY + 120)); await p.waitForTimeout(200); await p.screenshot({ path: new URL('ficha-ampliada.png', import.meta.url).pathname });
{ const tit = () => p.textContent('#detalle .cab-msg h2'), pos = () => p.textContent('.navmax .muted');
  const t0 = await tit(), p0 = await pos(); await p.click('#msgSig'); await p.waitForTimeout(300); const t1 = await tit(), p1 = await pos();
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); const p2 = await pos(); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); await p.click('#msgAnt'); await p.waitForTimeout(300);
  console.log('navegar ampliado:', p0, '→', p1, '→ (tecla →)', p2, '→ (← y ◀)', await pos(), '| cambia el mensaje:', t0 !== t1, '| vuelve al primero:', (await tit()) === t0, '| sigue ampliada:', await p.isHidden('#lista')); }
// Barra fija con la ficha ampliada, también si el «sticky» no actúa (se simula con overflow:hidden en el contenedor)
for (const roto of [false, true]) {
  if (roto) await p.addStyleTag({ content: '#layout { overflow: hidden; }' });
  await p.setViewportSize({ width: 1300, height: 420 }); await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(300);
  console.log('ampliada y abajo' + (roto ? ' (sticky roto)' : '') + ': barra a la vista:', await p.evaluate(() => { const r = document.querySelector('#detalle .barra-ficha').getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return r.top >= h.bottom - 2 && r.top < h.bottom + 30 && r.bottom <= innerHeight; }), '| scroll:', await p.evaluate(() => scrollY));
  if (roto) { await p.screenshot({ path: new URL('barra-fija.png', import.meta.url).pathname }); await p.evaluate(() => document.querySelectorAll('style').forEach(x => x.textContent === '#layout { overflow: hidden; }' && x.remove())); }
}
await p.evaluate(() => scrollTo(0, 0)); await p.setViewportSize({ width: 1300, height: 900 });
await p.click('#ampliar'); console.log('reducida: botones ocultos', !(await p.isVisible('#msgSig')));
console.log('firma y motivo en la ficha:', (await p.textContent('#detalle .firmamot')).replace(/\s+/g, ' '), '| en la tabla:', await p.$$eval('#lista .sub', l => l.some(x => /✍ GENERAL JEFE <b>A<\/b> · Motivo: Para/.test(x.textContent))));
// Banderas: en la tabla con su color, en la ficha y con filtro
console.log('banderas en la tabla:', await p.$$eval('#lista .bandera', l => [...new Set(l.map(x => x.textContent + ' ' + x.style.getPropertyValue('--cb')))].join(', ')),
  '| filtro:', await p.$$eval('[data-x="Bandera"] option', l => l.map(x => x.textContent).join(', ')).catch(() => 'no hay'));
await p.selectOption('[data-x="Bandera"]', 'Urgente');
await p.waitForTimeout(200); console.log('solo urgentes:', await p.$$eval('#lista tr[data-i]', l => l.length), '| todas con bandera Urgente:', await p.$$eval('#lista tr[data-i]', l => l.every(t => /Urgente/.test(t.textContent))));
await p.selectOption('[data-x="Bandera"]', '');
// «Abrir en MENSADEF» localiza el mensaje: a la vista (RE-0) y con el buscador (uno que no está en las 5 primeras)
await p.evaluate(() => { const o = window.open; window.open = (url, n) => o.call(window, url.replace('#', '?app=1#'), n); });
for (const n of [0, 40]) {
  await p.fill('#buscar', 'RE-' + n); await p.waitForTimeout(400);
  await p.click('#lista tbody tr[data-i] >> nth=0'); await p.waitForTimeout(200);
  const [pest] = await Promise.all([ctx.waitForEvent('page'), p.click('#abrirMensadef')]);
  await pest.waitForFunction(() => window.abierto || (document.getElementById('avisoVisor') || {}).style?.background === 'rgb(138, 28, 28)', null, { timeout: 30000 }).catch(() => 0);
  console.log('localizar RE-' + n + ':', await pest.evaluate(() => ({ abierto: window.abierto || '', buscado: window.buscado || '', aviso: (document.getElementById('avisoVisor') || {}).textContent || '', resaltada: !!document.querySelector('tr[style*="outline"]'), url: location.hash.slice(0, 20) })));
  await pest.close(); await p.bringToFront();
}
await p.fill('#buscar', ''); await p.waitForTimeout(300);
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
// Impresión: PDF como lo sacaría el navegador al pulsar «Imprimir»
await p.evaluate(() => document.body.classList.add('imprimiendo')); await p.emulateMedia({ media: 'print' });
await p.pdf({ path: new URL('informe.pdf', import.meta.url).pathname, preferCSSPageSize: true, printBackground: true });
await p.emulateMedia({ media: 'screen' }); await p.evaluate(() => document.body.classList.remove('imprimiendo'));
const txtInf = await p.evaluate(() => { let t = ''; navigator.clipboard.writeText = x => { t = x; return Promise.resolve(); }; document.querySelector('[data-inf="texto"]').click(); return new Promise(r => setTimeout(() => r(t), 100)); });
console.log('texto:', txtInf.split('\n').slice(0, 9).join(' ⏎ ').slice(0, 400));
const [w] = await Promise.all([p.waitForEvent('download'), p.click('[data-inf="word"]')]); console.log('word:', w.suggestedFilename(), require('fs').readFileSync(await w.path(), 'utf8').includes('Relación de mensajes'));
await p.click('[data-inf="cerrar"]'); await p.click('#kpis [data-kpi="todos"]'); await p.selectOption('#fSitio', '');
if (await p.isHidden('#estructura')) { console.log('«Ver estructura» oculto: sí'); await p.keyboard.press('Control+Alt+KeyE'); }
await p.click('#estructura'); const est = await p.inputValue('#cajaEstructura textarea');
console.log(est.split('\n').slice(0, 12).join('\n'));
console.log('¿estructura con contenido?', /Mensaje \d|MANDO|persona@|R-\d/.test(est), '| errores:', errs);
// Clave caducada: el servicio contesta 406 a la clave guardada; el visor pide otra y sigue
const p3 = await ctx.newPage(); await p3.goto(O + WEB + '/SitePages/ambito.aspx#/celula/SETEC%20SEGURIDAD/' + G1); await consultasApp(p3);
await p3.evaluate(M => sessionStorage.setItem(M + 'cabecerasApi', JSON.stringify({ passcode: 'caducada', user: 'x', momento: Date.now() })), MEM);
const antes = nClaves; await p3.evaluate(codigo); await p3.waitForTimeout(2500);
console.log('clave caducada → pide otra:', nClaves - antes, '|', await p3.$eval('#estado', e => e.textContent).catch(() => '-'));
await p3.close();
await p.setViewportSize({ width: 1400, height: 1000 }); await p.click('#lista tbody tr[data-i] >> nth=2'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#kpis').scrollIntoView()); await p.screenshot({ path: new URL('bandejas.png', import.meta.url).pathname }); await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: new URL('bandejas-arriba.png', import.meta.url).pathname });
await p.setViewportSize({ width: 390, height: 800 }); await p.screenshot({ path: new URL('bandejas-movil.png', import.meta.url).pathname });
await b.close();
