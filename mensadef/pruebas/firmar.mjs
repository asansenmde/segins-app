// Prueba de «Firmar con SENDERO» (firmar-portafirmas.js, dentro del favorito SENDERO) con un Portafirmas simulado (estructura de las escuchas de
// «Explorar Portafirmas»: lista Firmantes.do con chkDoc, título enlazado a DetalleDocumento, visor showPFViewer y Firmar).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const PF = 'https://portafirmas.mdef.es';
const b = await chromium.launch(), ctx = await b.newContext(), errs = [];
const mp = await ctx.newPage();
await mp.goto(new URL('../marcador-visor-mensadef.html', import.meta.url).href);   // el favorito SENDERO, en el Portafirmas
const codigo = decodeURIComponent((await mp.getAttribute('#marcador', 'href')).slice(11)); await mp.close();
const fila = (cd, titulo) => '<tr><td>Normal</td><td><input type="checkbox" name="chkDoc" value="' + cd + '#1" onclick="window.clics=(window.clics||0)+1"></td>' +
  '<td><a href="/ePortafirmas/DetalleDocumento.do?codDocumento=' + cd + '">' + titulo + '</a></td><td>Oficio</td><td>X</td><td>1</td><td>18/11/26</td><td></td>' +
  '<td><a id="link_' + cd + '" href="javascript: showPFViewer(\'' + cd + '\')">ver</a></td></tr>';
const lista = '<html><body><form name="formDocumentos" action="/ePortafirmas/Firmantes.do"><input name="titulo" value=""><input name="operacion" type="hidden">' +
  '<table id="TablaParaModificar"><tbody>' + fila('A1', 'PTRADEC - Re: SDO. INFORME ANUAL DE SEGURIDAD DE INSTALACIONES') + fila('B2', 'Solicitud de visita a acuartelamiento') +
  fila('C3', 'Solicitud de visita a acuartelamiento') + '</tbody></table>' +
  '<button type="button" id="botPtfrFirmar" onclick="window.firmado=[...document.querySelectorAll(\'input[name=chkDoc]:checked\')].map(x=>x.value)">Firmar</button></form>' +
  '<div id="modalVisor" hidden>Visor <button id="idBtnAcceptReadModal">He leído el documento</button></div>' +
  '<script>function showPFViewer(cd){window.visto=cd;document.getElementById("modalVisor").hidden=false;}</script></body></html>';
await ctx.route(PF + '/**', r => {
  const u = new URL(r.request().url());
  if (/Inicio\.do/.test(u.pathname) && !u.search) return r.fulfill({ contentType: 'text/html', body: '<html><body><form name="formLogin"><input type="password" name="pw"></form></body></html>' });
  if (/Inicio\.do/.test(u.pathname)) return r.fulfill({ contentType: 'text/html', body: '<html><body><a href="/ePortafirmas/Inicio.do?rol=F">Firmante</a></body></html>' });
  return r.fulfill({ contentType: 'text/html', body: lista });
});
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
const error = t => console.log('Error: ' + t);
// 1. Con el asunto que deja SENDERO en el nombre de la pestaña: localiza, marca solo esa, abre el visor y firma
await p.goto(PF + '/ePortafirmas/Firmantes.do?operacion=ListaPendientes');
await p.evaluate(n => { window.name = n; }, 'SENDEROFIRMA_' + encodeURIComponent('SDO. INFORME ANUAL DE SEGURIDAD DE INSTALACIONES'));
await p.evaluate(() => { document.querySelectorAll('input[name=chkDoc]')[1].checked = true; });   // otra marcada de antes
await p.evaluate(codigo); await p.waitForTimeout(300);
const marcadas = await p.$$eval('input[name=chkDoc]:checked', l => l.map(x => x.value));
await p.click('#sfVer'); await p.waitForTimeout(300); const visto = await p.evaluate(() => window.visto);
await p.click('#sfFirmar'); const firmado = await p.evaluate(() => window.firmado), nombre = await p.evaluate(() => window.name);
console.log('firmar: marcada', marcadas.join(','), '| visor del documento', visto, '| Firmar con', JSON.stringify(firmado), '| nombre de la pestaña borrado:', !nombre);
if (marcadas.join() !== 'A1#1' || visto !== 'A1' || JSON.stringify(firmado) !== '["A1#1"]' || nombre) error('firmar la petición');
// 2. Dos con el mismo asunto: deja elegir
await p.reload(); await p.evaluate(n => { window.name = n; }, 'SENDEROFIRMA_' + encodeURIComponent('Solicitud de visita a acuartelamiento'));
await p.evaluate(codigo); await p.waitForTimeout(300);
const opciones = await p.$$eval('[data-sf]', l => l.length); await p.click('[data-sf] >> nth=1'); await p.waitForTimeout(200);
const elegida = await p.$$eval('input[name=chkDoc]:checked', l => l.map(x => x.value));
console.log('firmar: con dos iguales, para elegir', opciones, '→ marcada', elegida.join(','));
if (opciones !== 2 || elegida.join() !== 'C3#1') error('elegir entre iguales');
// 3. En la pantalla de identificarse: lo dice; tras entrar (página de perfil), va a la lista filtrada
await p.goto(PF + '/ePortafirmas/Inicio.do'); await p.evaluate(n => { window.name = n; }, 'SENDEROFIRMA_' + encodeURIComponent('Asunto X'));
await p.evaluate(codigo); await p.waitForTimeout(200); const login = /Identifícate/.test(await p.textContent('#senderoFirma'));
await p.goto(PF + '/ePortafirmas/Inicio.do?cr=1'); await p.evaluate(codigo);
await p.waitForURL(/Firmantes\.do\?operacion=ListaPendientes&titulo=Asunto%20X/, { timeout: 5000 }).catch(() => 0);
console.log('firmar: en identificarse lo dice', login, '| desde el inicio va a la lista filtrada:', /titulo=Asunto%20X/.test(p.url()));
if (!login || !/titulo=Asunto%20X/.test(p.url())) error('fuera de la lista');
console.log('errores:', JSON.stringify(errs));
await b.close();
