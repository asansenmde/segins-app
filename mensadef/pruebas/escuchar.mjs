// Prueba del favorito «Escuchar MENSADEF»: anota las consultas de la aplicación (fetch, XMLHttpRequest, $batch y búsqueda)
// con su estructura y sin valores. Datos simulados.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const O = 'https://mensadef.mdef.es';
const b = await chromium.launch();
const mp = await b.newPage();
await mp.goto(new URL('../marcador-escuchar-mensadef.html', import.meta.url).href);
const codigo = decodeURIComponent((await mp.getAttribute('#marcador', 'href')).slice(11));
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
// Servicio propio de MENSADEF (otro servidor): bandeja de una célula, paginada
const API = 'https://mensadefapi.mdef.es';
await p.route(API + '/**', r => r.fulfill({ headers: { 'Access-Control-Allow-Origin': O, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' },
  json: r.request().method() === 'OPTIONS' ? {} : { ListaElementos: [{ IdMensaje: '11111111-2222-3333-4444-555555555555', Asunto: 'SECRETO 9', FechaRegistro: '2026-10-28T08:00:00', Leido: false, Remitente: 'SECRETO 10',
    Etiquetas: [{ IdEtiqueta: 3, Nombre: 'SECRETO 11' }] }], ListaAgrupaciones: [{ Clave: 'SECRETO 12', Total: 1 }], IndicePagina: 0, TamanoPagina: 50, TotalRegistros: 1 } }));
await p.route(O + '/**', r => {
  const u = decodeURIComponent(r.request().url());
  if (u.includes('/_api/web/lists/getbytitle')) return r.fulfill({ json: { value: [{ Id: 1, Title: 'SECRETO 1', MensajeCelula: 'SETEC SECRETARIA', MensajeDestinatarioId: 7 }, { Id: 2, Title: 'SECRETO 2', MensajeCelula: 'SETEC SEGURIDAD', MensajeLeido: true }] } });
  const celdas = [{ Key: 'Title', Value: 'SECRETO 3' }, { Key: 'MensajeCelulaOWSTEXT', Value: 'SETEC' }, { Key: 'Path', Value: 'x' }];
  const pq = { RelevantResults: { TotalRows: 2, Table: { Rows: { results: [{ Cells: { results: celdas } }] } } } };
  if (u.includes('/_api/search/postquery')) return r.fulfill({ json: { d: { postquery: { PrimaryQueryResult: pq } } } });
  if (u.includes('/_api/$batch')) return r.fulfill({ contentType: 'multipart/mixed; boundary=b', body: '--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"d":{"results":[{"Id":5,"Title":"SECRETO 4","MensajeBandeja":"Entrada"}]}}\r\n--b--' });
  if (u.includes('/_vti_bin/SMDMD')) return r.fulfill({ contentType: 'text/xml', body: '<Mensajes><Mensaje><Asunto>SECRETO 5</Asunto><Celula>X</Celula></Mensaje><Mensaje><Asunto>SECRETO 6</Asunto></Mensaje></Mensajes>' });
  // Código de la aplicación (simulado): llama al servicio con una clave en la cabecera y el token de la memoria
  if (u.endsWith('mensadef-app.js')) return r.fulfill({ contentType: 'text/javascript', body: 'var cfg={api:"https://mensadefapi.mdef.es/api/",clave:"ABCDEF0123456789ABCDEF0123456789",soporte:"soporte@mde.es"};' +
    'function llamar(r,p){return fetch(cfg.api+r+"?"+p,{headers:{"Ocp-Apim-Subscription-Key":cfg.clave,Authorization:"Bearer "+sessionStorage.getItem("tokenMensadef")}})}' + ' '.repeat(400) +
    'function celulas(u){return llamar("ambito/UsuarioCelulas","idUsuario="+u+"&tipoCelula=-1")}' + ' '.repeat(400) +
    'function cab(){var d=new Date();return {"Content-Type":"application/json",passcode:md5(cfg.semilla+d.toISOString().slice(0,10)),user:JSON.parse(sessionStorage.getItem("rolesUsuario2SUIGE")).idUsuario}}' });
  if (u.endsWith('.js')) return r.fulfill({ contentType: 'text/javascript', body: '' });
  return r.fulfill({ contentType: 'text/html', body: '<html><body><h1>Portada MENSADEF</h1><script src="/ambito/2SUIGE/ClientSideAssets/mensadef-app.js"></script></body></html>' });
});
await p.goto(O + '/ambito/2SUIGE/SitePages/ambito.aspx#/celula/SETEC%20SECRETARIA/8d714e44-b2b5-41a8-9780-2228204861b5');
// Antes de escuchar, la aplicación ya pidió la lista de células (queda en el registro del navegador; aquí se simula)
await p.evaluate(() => { const o = performance.getEntriesByType.bind(performance); performance.getEntriesByType = t => t !== 'resource' ? o(t) : [
  { name: 'https://mensadefapi.mdef.es/api/celula/ObtenerCelulasUsuario?emailUsuario=persona@et.mde.es&urlColeccionSitio=https://mensadef.mdef.es/ambito/2SUIGE' },
  { name: location.origin + '/ambito/2SUIGE/SiteAssets/app.js' }]; });
await p.evaluate(codigo);
console.log('página intacta:', await p.textContent('h1'), '| recuadro:', (await p.textContent('div[style*="2147483647"]')).slice(0, 60));
// La «aplicación» carga la bandeja de la célula
await p.evaluate(async () => {
  await fetch("/ambito/2SUIGE/_api/web/lists/getbytitle('SMDMDMensajes_20261028')/items?$select=Id,Title,MensajeCelula&$filter=MensajeCelula eq 'SETEC SECRETARIA' and MensajeDestinatarioId eq 7&$top=100");
  await fetch('/ambito/2SUIGE/_api/search/postquery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { Querytext: 'SECRETO MensajeCelulaOWSTEXT:"SETEC SECRETARIA"', SelectProperties: { results: ['Title', 'MensajeCelulaOWSTEXT'] } } }) });
  await fetch('/ambito/2SUIGE/_api/$batch', { method: 'POST', body: "--b\r\nGET https://mensadef.mdef.es/ambito/2SUIGE/_api/web/lists/getbytitle('Bandeja%20SETEC')/items?$filter=Asunto eq 'SECRETO 7' HTTP/1.1\r\n--b--" });
  await new Promise(res => { const x = new XMLHttpRequest(); x.open('GET', '/ambito/2SUIGE/_vti_bin/SMDMD/Mensajes.svc/Bandeja?celula=SECRETO8'); x.onloadend = res; x.send(); });
  await fetch('/ambito/2SUIGE/SiteAssets/app.js');
  sessionStorage.setItem('tokenMensadef', 'eyJhbGciOiJSUzI1NiJ9.SECRETO14.firma');
  await fetch('https://mensadefapi.mdef.es/api/ambito/UsuarioCelulas?idUsuario=77&tipoCelula=-1', { headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.SECRETO14.firma', Accept: 'application/json, text/plain, */*', 'X-Clave': 'SECRETO15-larguisimo' } });
  await fetch('https://mensadefapi.mdef.es/api/buzon/ObtenerBuzonCelula?idCelula=8d714e44-b2b5-41a8-9780-2228204861b5&emailUsuario=persona@et.mde.es&urlColeccionSitio=https%3A%2F%2Fmensadef.mdef.es%2Fambito%2F2SUIGE&indicePagina=0&tamanoPagina=50&tipoES=E&criterioBusqueda=SECRETO&soloPendientes=false',
    { credentials: 'include', headers: { Authorization: 'Bearer SECRETO13' } });
});
await p.waitForTimeout(400);
const t = await p.inputValue('div[style*="2147483647"] textarea');
console.log(t);
console.log('¿con contenido?', /SECRETO|eyJ|SETEC S|Entrada|asansen|persona@/.test(t.split('\n').slice(2).join('\n')), '| errores:', errs);
await p.click('[data-a="codigo"]'); await p.waitForTimeout(800);
const tc = await p.inputValue('div[style*="2147483647"] textarea'); const cod = tc.slice(tc.indexOf('CÓDIGO'));
console.log(cod);
console.log('¿código con clave, token o correo?', /ABCDEF0123|soporte@|eyJ/.test(cod));
await p.click('[data-a="min"]'); console.log('minimizado:', (await p.textContent('div[style*="2147483647"]')).slice(0, 60));
await p.evaluate(codigo); console.log('segunda pulsación lo vuelve a mostrar:', await p.isVisible('div[style*="2147483647"] textarea'));
await b.close();
