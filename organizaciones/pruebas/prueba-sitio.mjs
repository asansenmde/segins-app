// Prueba de organizaciones/prueba-sitio.html con un Colabora simulado de varios sitios (sin datos reales).
// VERBOSE=1: SharePoint 2013 (solo odata=verbose). Uso: node organizaciones/pruebas/prueba-sitio.mjs
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const VERBOSE = !!process.env.VERBOSE;
const HTML = readFileSync(new URL('../prueba-sitio.html', import.meta.url), 'utf8');
const ORIGEN = 'https://colabora.mdef.es', PAGINA = ORIGEN + '/et/SUIGESUR/JSUIGE/aplicaciones/prueba-sitio.html';
const TODO = { High: '2147483647', Low: '4294967295' };
const SITIOS = {
  '/et/SUIGESUR/JSUIGE': { titulo: 'JSUIGE', col: '/et/SUIGESUR', perm: TODO, listas: ['Gestor de Tareas MENSADEF', 'META MIEMBROS', 'PS Puntos', 'PS Negociados', 'PS Aportaciones'], roles: ['Control total', 'Diseño', 'Colaborar', 'Leer', 'Lectura restringida', 'META'] },
  '/et/IGE/JIGE': { titulo: 'JIGE', col: '/et/IGE', perm: { High: '32', Low: String(0x1 | 0x20 | 0x10000 | 0x20000) }, listas: ['Documentos', 'PS Puntos'], roles: null },
  '/et/MAPER': { titulo: 'MAPER', col: '/et/MAPER', perm: { High: '32', Low: String(0x1 | 0x2 | 0x4 | 0x8 | 0x800 | 0x2000000 | 0x10000 | 0x20000) }, listas: ['Tareas', 'META MIEMBROS'], roles: ['Control total', 'Colaborar', 'Leer'] }
};
const PRIVADO = '/et/PRIVADO';
const metodos = [];
const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }), errs = [];
await ctx.route(ORIGEN + '/**', r => {
  const req = r.request(), u = new URL(req.url()), ruta = decodeURIComponent(u.pathname), acc = req.headers().accept || '';
  if (ruta === new URL(PAGINA).pathname) return r.fulfill({ contentType: 'text/html', body: HTML });
  const m = /^(.*?)\/_api\/(.*)$/.exec(ruta);
  if (!m) return r.fulfill({ status: 404, body: 'no' });
  metodos.push(req.method() + ' ' + ruta);
  const base = m[1], que = m[2];
  if (base === PRIVADO || base.startsWith(PRIVADO + '/')) return r.fulfill({ status: 401, body: '' });   // el 401 llega antes que el formato
  if (VERBOSE && /nometadata/.test(acc)) return r.fulfill({ status: 406, body: '' });
  const s = SITIOS[base];
  if (!s) return r.fulfill({ status: 404, body: '' });
  const hdr = { 'MicrosoftSharePointTeamServices': VERBOSE ? '15.0.0.4569' : '16.0.0.5000' };
  const resp = (o, lista) => r.fulfill({ contentType: 'application/json', headers: hdr, body: JSON.stringify(VERBOSE ? { d: lista ? { results: o } : o } : lista ? { value: o } : o) });
  if (que === 'contextinfo') {
    if (req.method() !== 'POST') return r.fulfill({ status: 405, body: '' });
    return resp(VERBOSE ? { GetContextWebInformation: { FormDigestValue: '0x1,simulada' } } : { FormDigestValue: '0x1,simulada' });
  }
  if (req.method() !== 'GET') return r.fulfill({ status: 403, body: '' });
  if (que === 'web') return resp({ Title: s.titulo, Url: ORIGEN + base, ServerRelativeUrl: base, Language: 3082, EffectiveBasePermissions: s.perm });
  if (que === 'site') return resp({ Url: ORIGEN + s.col, ServerRelativeUrl: s.col });
  if (que === 'web/currentuser') return resp({ Id: 9, IsSiteAdmin: s.perm === TODO, Title: 'USUARIO SIMULADO' });
  if (que === 'web/lists') return resp(s.listas.map(t => ({ Title: t, Hidden: false, ItemCount: 3 })).concat([{ Title: 'Oculta', Hidden: true, ItemCount: 0 }]), true);
  if (que === 'web/roledefinitions') return s.roles ? resp(s.roles.map(n => ({ Name: n, Hidden: false })).concat([{ Name: 'Acceso limitado', Hidden: true }]), true) : r.fulfill({ status: 403, body: '' });
  return r.fulfill({ status: 404, body: '' });
});
await ctx.route('https://otro.mdef.es/**', r => { metodos.push('OTRO ' + r.request().url()); r.fulfill({ status: 200, body: '{}' }); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
let fallos = 0; const error = t => { fallos++; console.log('Error: ' + t); };
await p.goto(PAGINA);
await p.waitForFunction(() => !/Comprobando/.test(document.getElementById('aqui').textContent), null, { timeout: 8000 });
const aqui = await p.textContent('#aqui');
console.log('aquí:', aqui.replace(/\s+/g, ' ').slice(0, 220));
if (!/\/et\/SUIGESUR\/JSUIGE/.test(aqui) || !/el de SUIGESUR/.test(aqui) || !/\/et\/SUIGESUR\b/.test(aqui)) error('dónde está la página');
if (!(VERBOSE ? /2013\) · formato verbose/ : /2016 o posterior\) · formato ligero/).test(aqui)) error('versión y formato de esta página');
await p.fill('#sitios', [ORIGEN + '/et/IGE/JIGE/SitePages/Inicio.aspx', ORIGEN + '/et/MAPER/Lists/Tareas/AllItems.aspx', ORIGEN + '/et/IGE/JIGE/NOEXISTE',
  ORIGEN + '/et/PRIVADO/SitePages/Inicio.aspx', 'https://otro.mdef.es/sites/X', ORIGEN + '/et/NADA/SitePages/a.aspx'].join('\n'));
await p.click('#probar');
await p.waitForFunction(() => document.querySelectorAll('.sitio').length === 6 && !document.getElementById('probar').disabled, null, { timeout: 15000 });
const tarjetas = await p.$$eval('.sitio', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
tarjetas.forEach((t, i) => console.log('sitio ' + (i + 1) + ':', t.slice(0, 260)));
const [ige, maper, sub, priv, otro, nada] = tarjetas;
if (!/Se puede: META y el PSIT/.test(ige) || !/solo lee/.test(ige) || !/Instalar lo tendría que hacer/.test(ige)) error('IGE solo lectura');
if (!/otra distinta de la de esta página/.test(ige) || !/Listas del PSIT\s*ya existen: PS Puntos/.test(ige) || !/no se ven con tu cuenta/.test(ige)) error('IGE detalles');
if (!/Administrar listas \(crear listas y columnas\): no/.test(ige)) error('IGE permisos');
if (!/Se puede/.test(maper) || !/Con tu cuenta se podría instalar/.test(maper) || !/Listas de META\s*ya existen: META MIEMBROS/.test(maper) || !/«Lectura restringida»: no · nivel «META»: no/.test(maper)) error('MAPER instalable');
if (!/\/et\/MAPER/.test(maper)) error('MAPER: ruta desde la dirección de una lista');
if (!/\/et\/IGE\/JIGE/.test(sub) || !/dentro de este sitio/.test(sub)) error('subsitio inexistente: sube al sitio de arriba');
if (!/sin acceso con tu cuenta \(HTTP 401\)/.test(priv) || !/alguien de esa organización/.test(priv)) error('sitio sin acceso');
if (!/Otro servidor/.test(otro)) error('otro servidor');
if (!/No encuentro el sitio/.test(nada)) error('sitio que no existe');
// Solo lee: GET y la clave de escritura; nada a otro servidor
const raros = metodos.filter(x => !/^GET /.test(x) && !/^POST .*\/_api\/contextinfo$/.test(x));
console.log('peticiones:', metodos.length, '· que no son GET ni la clave:', JSON.stringify(raros));
if (raros.length) error('ha hecho peticiones que no son de lectura');
// Con 401 deja de subir (más arriba sería otro sitio): una sola petición a PRIVADO
if (metodos.filter(x => /PRIVADO/.test(x)).length !== 1) error('con 401 debe parar de subir');
// Texto para copiar: sin nombre de la persona
const copia = await p.textContent('#copiaTxt');
if (/USUARIO SIMULADO/.test(copia) || !/SITIO: \/et\/MAPER/.test(copia) || !/Página en: \/et\/SUIGESUR\/JSUIGE/.test(copia)) error('texto para copiar');
console.log('copia (principio):\n' + copia.split('\n').slice(0, 12).join('\n'));
// Se recuerdan los sitios
await p.reload(); await p.waitForTimeout(300);
if (!/MAPER/.test(await p.inputValue('#sitios'))) error('recordar los sitios');
// Móvil: sin desplazamiento horizontal
await p.setViewportSize({ width: 390, height: 800 }); await p.click('#probar');
await p.waitForFunction(() => document.querySelectorAll('.sitio').length === 6 && !document.getElementById('probar').disabled, null, { timeout: 15000 });
const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
if (ancho > 392) error('en el móvil se sale de ancho (' + ancho + ')');
await p.setViewportSize({ width: 1100, height: 900 });
await p.screenshot({ path: new URL('./prueba-sitio' + (VERBOSE ? '-verbose' : '') + '.png', import.meta.url).pathname, fullPage: true });
console.log('errores:', JSON.stringify(errs));
if (errs.length) fallos++;
console.log(fallos ? 'HAY FALLOS' : 'TODO BIEN');
await b.close();
process.exit(fallos ? 1 : 0);
