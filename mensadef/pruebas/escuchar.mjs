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
await p.route(O + '/**', r => {
  const u = decodeURIComponent(r.request().url());
  if (u.includes('/_api/web/lists/getbytitle')) return r.fulfill({ json: { value: [{ Id: 1, Title: 'SECRETO 1', MensajeCelula: 'SETEC SECRETARIA', MensajeDestinatarioId: 7 }, { Id: 2, Title: 'SECRETO 2', MensajeCelula: 'SETEC SEGURIDAD', MensajeLeido: true }] } });
  const celdas = [{ Key: 'Title', Value: 'SECRETO 3' }, { Key: 'MensajeCelulaOWSTEXT', Value: 'SETEC' }, { Key: 'Path', Value: 'x' }];
  const pq = { RelevantResults: { TotalRows: 2, Table: { Rows: { results: [{ Cells: { results: celdas } }] } } } };
  if (u.includes('/_api/search/postquery')) return r.fulfill({ json: { d: { postquery: { PrimaryQueryResult: pq } } } });
  if (u.includes('/_api/$batch')) return r.fulfill({ contentType: 'multipart/mixed; boundary=b', body: '--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"d":{"results":[{"Id":5,"Title":"SECRETO 4","MensajeBandeja":"Entrada"}]}}\r\n--b--' });
  if (u.includes('/_vti_bin/SMDMD')) return r.fulfill({ contentType: 'text/xml', body: '<Mensajes><Mensaje><Asunto>SECRETO 5</Asunto><Celula>X</Celula></Mensaje><Mensaje><Asunto>SECRETO 6</Asunto></Mensaje></Mensajes>' });
  if (u.endsWith('.js')) return r.fulfill({ contentType: 'text/javascript', body: '' });
  return r.fulfill({ contentType: 'text/html', body: '<html><body><h1>Portada MENSADEF</h1></body></html>' });
});
await p.goto(O + '/ambito/2SUIGE/SitePages/ambito.aspx#/celula/SETEC%20SECRETARIA/8d714e44-b2b5-41a8-9780-2228204861b5');
await p.evaluate(codigo);
console.log('página intacta:', await p.textContent('h1'), '| recuadro:', (await p.textContent('div[style*="2147483647"]')).slice(0, 60));
// La «aplicación» carga la bandeja de la célula
await p.evaluate(async () => {
  await fetch("/ambito/2SUIGE/_api/web/lists/getbytitle('SMDMDMensajes_20261028')/items?$select=Id,Title,MensajeCelula&$filter=MensajeCelula eq 'SETEC SECRETARIA' and MensajeDestinatarioId eq 7&$top=100");
  await fetch('/ambito/2SUIGE/_api/search/postquery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { Querytext: 'SECRETO MensajeCelulaOWSTEXT:"SETEC SECRETARIA"', SelectProperties: { results: ['Title', 'MensajeCelulaOWSTEXT'] } } }) });
  await fetch('/ambito/2SUIGE/_api/$batch', { method: 'POST', body: "--b\r\nGET https://mensadef.mdef.es/ambito/2SUIGE/_api/web/lists/getbytitle('Bandeja%20SETEC')/items?$filter=Asunto eq 'SECRETO 7' HTTP/1.1\r\n--b--" });
  await new Promise(res => { const x = new XMLHttpRequest(); x.open('GET', '/ambito/2SUIGE/_vti_bin/SMDMD/Mensajes.svc/Bandeja?celula=SECRETO8'); x.onloadend = res; x.send(); });
  await fetch('/ambito/2SUIGE/SiteAssets/app.js');
});
await p.waitForTimeout(400);
const t = await p.inputValue('div[style*="2147483647"] textarea');
console.log(t);
console.log('¿con contenido?', /SECRETO|SETEC S|Entrada|asansen/.test(t.split('\n').slice(2).join('\n')), '| errores:', errs);
await p.click('[data-a="min"]'); console.log('minimizado:', (await p.textContent('div[style*="2147483647"]')).slice(0, 60));
await p.evaluate(codigo); console.log('segunda pulsación lo vuelve a mostrar:', await p.isVisible('div[style*="2147483647"] textarea'));
await b.close();
