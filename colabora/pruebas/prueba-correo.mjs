// Prueba del diagnóstico del correo (colabora/prueba-correo.html) contra un Colabora simulado.
// node colabora/pruebas/prueba-correo.mjs   ·   VERBOSE=1 (SharePoint 2013)   ·   PAGINA=colabora/colabora/prueba-correo.html (copia protegida)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.PAGINA || new URL('../prueba-correo.html', import.meta.url), 'utf8');
const VERBOSE = !!process.env.VERBOSE, WEB = '/et/SUIGESUR/JSUIGE';
let ok = true; const comprueba = (t, c, x) => { console.log((c ? '✔ ' : '✘ ') + t + (x !== undefined ? ': ' + x : '')); if (!c) ok = false; };
const b = await chromium.launch();
async function caso(nombre, { correo = 'usuario@et.mde.es', sitioLow = 0x7FFFFFFF, sitioDenegado = false, envio = 200, msgEnvio = '' }) {
  const p = await (await b.newContext()).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const enviados = [];
  await p.route('https://colabora.mdef.es/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    const resto = u.split('/_api/')[1];
    const J = (x, st = 200) => r.fulfill({ status: st, json: VERBOSE ? { d: x.value ? { results: x.value } : x } : x });
    if (VERBOSE && req.method() === 'GET' && /nometadata/.test(req.headers().accept || '')) return r.fulfill({ status: 406, body: '' });
    if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'D', WebFullUrl: 'https://colabora.mdef.es' + WEB } } } });
    if (resto.startsWith('SP.Utilities.Utility.SendEmail')) { enviados.push(JSON.parse(req.postData()).properties.To.results); return envio === 200 ? r.fulfill({ json: { d: {} } }) : r.fulfill({ status: envio, json: { error: { message: { value: msgEnvio } } } }); }
    if (resto.startsWith('web/currentuser/groups')) return J({ value: [{ Title: 'INCIDENTES_UNIDADES' }] });
    if (resto.startsWith('web/currentuser')) return J({ Id: 7, Title: 'USUARIO DE PRUEBA', Email: correo, LoginName: 'i:0#.w|et\\usuario' });
    if (resto.startsWith('web?')) return sitioDenegado ? r.fulfill({ status: 403, json: { error: { message: { value: 'Acceso denegado.' } } } }) : J({ Title: 'JSUIGE', EffectiveBasePermissions: { High: '432', Low: String(sitioLow) } });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.goto('https://colabora.mdef.es' + WEB + '/aplicaciones/prueba-correo.html'); await p.waitForTimeout(900);
  const lista = (await p.textContent('#lista')).replace(/\s+/g, ' ');
  await p.click('#enviar'); await p.waitForTimeout(700);
  const ver = (await p.textContent('#veredicto').catch(() => '')).replace(/\s+/g, ' '), res = await p.textContent('#resumen');
  await p.context().close();
  return { lista, ver, res, enviados, errs };
}
let r = await caso('todo bien', {});
comprueba('todo bien: cuenta con correo y permiso en el sitio', /usuario@et\.mde\.es/.test(r.lista) && /Permisos en el sitio\s*✓ Ver páginas/.test(r.lista));
comprueba('todo bien: envía a su dirección y dice que Colabora lo aceptó', r.enviados[0] && r.enviados[0][0] === 'usuario@et.mde.es' && /sí envía/.test(r.ver), r.ver.slice(0, 80));
comprueba('resumen sin nombres ni direcciones', !/USUARIO DE PRUEBA|@/.test(r.res), r.res.replace(/\n/g, ' | '));
r = await caso('solo lista', { sitioLow: 0x10001, envio: 403, msgEnvio: 'Acceso denegado. No tiene permiso para realizar esta acción.' });
comprueba('solo lista: lo detecta en los permisos', /solo «Acceso limitado»/.test(r.lista));
comprueba('solo lista: el envío dice que es el permiso', /Este es el problema/.test(r.ver) && /solo tienes permiso en las listas/.test(r.ver), r.ver.slice(0, 120));
r = await caso('sitio ilegible', { sitioDenegado: true, envio: 401, msgEnvio: 'Access denied.' });
comprueba('sin poder leer el sitio: lo dice y el envío también', /Colabora no deja leerlos/.test(r.lista) && /Este es el problema/.test(r.ver));
r = await caso('sin correo', { correo: '' });
comprueba('cuenta sin correo: lo explica', /no tiene dirección de correo/.test(r.lista));
r = await caso('dirección rechazada', { envio: 400, msgEnvio: 'No se puede enviar el mensaje de correo electrónico. Asegúrese de que tenga un destinatario válido.' });
comprueba('dirección no aceptada: lo explica', /alguna dirección no la acepta/.test(r.ver));
comprueba('errores de página', r.errs.length === 0, JSON.stringify(r.errs));
await b.close();
console.log(ok ? 'TODO BIEN' : 'HAY FALLOS'); process.exit(ok ? 0 : 1);
