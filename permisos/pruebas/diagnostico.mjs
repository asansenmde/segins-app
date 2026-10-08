// Prueba de prueba-permisos.html contra una lista «Solicitud de Permisos» simulada (sin datos reales).
// Uso: node permisos/pruebas/diagnostico.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../prueba-permisos.html', import.meta.url), 'utf8');
const WEB = '/et/SUIGESUR/colaborativo/CALIDAD-VIDA';
const ESTADOS = ['Borrador', 'Pendiente de Aprobación', 'Pendiente de Autorización', 'Autorizado', 'Denegado', 'Registrado'];
const items = Array.from({ length: 1234 }, (_, i) => ({
  Id: i + 1, Estado: ESTADOS[i % 6], EstadoDeAprobacion: i % 6 > 1 ? 'Aprobado por PERSONA ' + (i % 4) + ' el ' + (i % 28 + 1) + '/09/2026' : '',
  EstadoDeAutorizacion: i % 6 > 2 ? (i % 6 === 4 ? 'Denegado' : 'Autorizado') : '', EstadoDeRegistro: i % 6 === 5 ? 'Registrado: SIPERDEF ' + i : '',
  ValidacionEstado: 'OK', AutorizarDirecto: i % 10 === 0, TipoDePermiso: ['Vacaciones', 'Asuntos propios', 'Permiso por matrimonio'][i % 3], CupoDeA_x00f1_o: '2026',
  Created: '2026-0' + (1 + i % 9) + '-10T08:00:00Z', FechaInicio: '2026-10-0' + (1 + i % 9) + 'T00:00:00Z', FechaDeFin: '2026-10-1' + (i % 9) + 'T00:00:00Z',
  SolicitanteId: 100 + (i % 50), AuthorId: 100 + (i % 50), AprobadorDePermisoId: i % 6 > 0 ? 7 : null, AutorizadorDelPermisoId: 8, Registro_x0020_SIPERDEFId: i % 6 === 5 ? 9 : null, RepresentanteDelSolicitanteId: null,
}));
async function prueba(verbose) {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const metodos = new Set();
  await p.route('https://colabora.mdef.es/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url()); metodos.add(req.method() + ' ' + (u.split('/_api/')[1] || '').split(/[(?]/)[0]);
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    const acc = req.headers()['accept'] || '';
    if (verbose && acc.includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = d => r.fulfill({ json: verbose ? { d: Array.isArray(d.value) ? { results: d.value, __next: d['odata.nextLink'] } : d } : d });
    if (u.endsWith('/_api/contextinfo')) return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'X' } } } });
    if (u.includes('EnumerateSubscriptionsByList')) return r.fulfill({ json: { d: { results: [{ Name: 'Aprobación permisos', EventTypes: { results: ['ItemAdded', 'ItemUpdated'] }, StatusFieldName: 'Aprobaci' }] } } });
    if (u.includes('currentuser/groups')) return J({ value: [{ Title: 'Autorizadores IGE' }] });
    if (u.includes('currentuser')) return J({ Id: 7, Title: 'USUARIO' });
    if (u.includes('sitegroups')) return J({ value: [{ Title: 'Autorizadores IGE' }, { Title: 'Registro SIPERDEF' }, { Title: 'CALIDAD-VIDA Miembros' }] });
    if (u.includes('/WorkflowAssociations')) return J({ value: [] });
    if (u.includes('/contenttypes')) return J({ value: [{ Name: 'Elemento', NewFormUrl: '', EditFormUrl: '', DisplayFormUrl: '' }] });
    if (u.includes('/fields')) return J({ value: [{ Title: 'Estado', InternalName: 'Estado', TypeAsString: 'Choice', Choices: verbose ? { results: ESTADOS } : ESTADOS },
      { Title: 'JEFE', InternalName: 'JEFE', TypeAsString: 'Choice', Choices: ['CORONEL PEREZ', 'COMANDANTE LOPEZ'] }, { Title: 'Asunto', InternalName: 'Title', TypeAsString: 'Text', Required: true }] });
    if (u.includes('/items')) {
      const skip = Number((u.match(/skip=(\d+)/) || [0, 0])[1]);
      const next = skip + 1000 < items.length ? `https://colabora.mdef.es${WEB}/_api/web/lists/getbytitle('Solicitud de Permisos')/items?skip=${skip + 1000}` : undefined;
      return J({ value: items.slice(skip, skip + 1000), 'odata.nextLink': next });
    }
    if (u.includes("getbytitle('Solicitud de Permisos')")) return J({ Id: 'abc-123', Title: 'Solicitud de Permisos', ItemCount: items.length, EnableVersioning: true,
      EffectiveBasePermissions: { High: '0', Low: String(1 | 2 | 4 | 0x10) }, DefaultNewFormUrl: WEB + '/Lists/Solicitud de Permisos/Item/newifs.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.goto('https://colabora.mdef.es' + WEB + '/Documentos%20compartidos/prueba-permisos.html');
  await p.click('#analizar'); await p.waitForFunction(() => /Terminado/.test(document.getElementById('estado').textContent), null, { timeout: 15000 });
  const R = JSON.parse(await p.textContent('#resumen'));
  const txt = JSON.stringify(R);
  console.log(verbose ? '[verbose]' : '[ligero]', 'elementos:', R.elementos.total, '| estados:', JSON.stringify(R.elementos.Estado));
  console.log('  aprobación:', JSON.stringify(R.elementos.EstadoDeAprobacion), '| registro:', JSON.stringify(R.elementos.EstadoDeRegistro));
  console.log('  JEFE:', JSON.stringify(R.columnas.find(c => c.interno === 'JEFE')), '| permisos:', JSON.stringify(R.lista_info.mis_permisos_en_la_lista));
  console.log('  flujos 2013:', JSON.stringify(R.flujos_2013), '| yo:', JSON.stringify(R.elementos.yo_figuro_como));
  console.log('  ¿se filtra algún nombre o fecha?', /PERSONA|PEREZ|LOPEZ|09\/2026|SIPERDEF \d/.test(txt), '| métodos:', [...metodos].filter(m => !m.startsWith('GET')).join(', '), '| errores:', errs, R.errores);
  await b.close();
}
await prueba(false); await prueba(true);
