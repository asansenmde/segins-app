// Prueba de permisos.html contra una lista «Solicitud de Permisos» simulada (datos inventados).
// Uso: node permisos/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../permisos.html', import.meta.url), 'utf8');
const WEB = '/et/SUIGESUR/colaborativo/CALIDAD-VIDA', O = 'https://colabora.mdef.es';
const U = { 279: { Id: 279, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, 11: { Id: 11, Title: 'APROBADOR UNO', EMail: 'aprob1@et.mde.es' },
  12: { Id: 12, Title: 'AUTORIZADOR UNO', EMail: 'autor1@et.mde.es' }, 13: { Id: 13, Title: 'SOLICITANTE DOS', EMail: 'sol2@et.mde.es' } };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x.toISOString(); };
let ultimoFiltro = '', items, gestor = false, registro = true;
const nuevoStore = () => {
  items = [
    { Id: 1, Title: 'Vacaciones', Estado: '1-Pendiente de Aprobar', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(5), FechaDeFin: d(9), Solicitante: U[13], AprobadorDePermiso: U[279], CorreoDelSolicitante: 'sol2@et.mde.es', CorreoDeAPROBADOR: 'usuario@et.mde.es', AprobadorTexto: 'USUARIO DE PRUEBA', EstadoDeAprobacion: 'SIN APROBAR', Unidad0: { Id: 2, Title: 'UNIDAD B' }, Dependencia: 'SEGURIDAD' },
    { Id: 2, Title: 'Asuntos propios', Estado: '2-Aprobado', TipoDePermiso: 'Permiso por asuntos particulares (Art.6.a)', CupoDeA_x00f1_o: '2026', FechaInicio: d(1), FechaDeFin: d(1), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[279], CorreoDelSolicitante: 'sol2@et.mde.es', CorreoDeAPROBADOR: 'aprob1@et.mde.es', CorreoDeAUTORIZADOR: 'usuario@et.mde.es', AprobadorTexto: 'APROBADOR UNO', AutorizadorTexto: 'USUARIO DE PRUEBA', EstadoDeAprobacion: 'APROBADO', Unidad0: { Id: 1, Title: 'UNIDAD A' }, Dependencia: 'JEFATURA' },
    { Id: 3, Title: 'Compensa servicio', Estado: '3-Autorizado', TipoDePermiso: 'Permiso para compensar un servicio.', CupoDeA_x00f1_o: '2026', FechaInicio: d(0), FechaDeFin: d(2), Solicitante: U[279], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[12], EstadoDeRegistro: 'Pendiente de Registro', Unidad0: { Id: 1, Title: 'UNIDAD A' } },
    { Id: 5, Title: 'Ajena', Estado: '1-Pendiente de Aprobar', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(3), FechaDeFin: d(4), Solicitante: U[13], AprobadorDePermiso: U[11], Unidad0: { Id: 2, Title: 'UNIDAD B' } },
    { Id: 4, Title: 'Viejo', Estado: '4-Registrado SIPERDEF', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2025', FechaInicio: d(-40), FechaDeFin: d(-30), Solicitante: U[279], Unidad0: { Id: 1, Title: 'UNIDAD A' } },
  ].map(x => ({ Created: d(-3), Modified: d(-2) + '', Author: { Id: x.Solicitante.Id, Title: x.Solicitante.Title }, Editor: { Title: 'X' }, NIF: '00000000T', RegistroDeBorrador: '', ...x }));
};
async function prueba(verbose, soloAlcance) {
  nuevoStore();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 800 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [];
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) return r.fulfill({ json: { d: {} } });
      if (resto.startsWith('SP.UI.ApplicationPages')) return r.fulfill({ json: { d: { ClientPeoplePickerSearchUser: '[]' } } });
      const mi = resto.match(/items\((\d+)\)/);
      const c = JSON.parse(req.postData()); delete c.__metadata;
      const aplica = (it, c) => { for (const [k, v] of Object.entries(c)) { const m = k.match(/^(.*)Id$/); if (m && m[1] !== 'Unidad0' && (v === null || typeof v === 'number')) it[m[1]] = v ? U[v] : null; else if (k === 'Unidad0Id') it.Unidad0 = { Id: v, Title: v === 1 ? 'UNIDAD A' : 'UNIDAD B' }; else it[k] = v; } it.Modified = new Date(Date.now() + 1000).toISOString(); };
      if (mi) {
        const it = items.find(x => x.Id === +mi[1]);
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
        aplica(it, c); return r.fulfill({ status: 204, body: '' });
      }
      if (resto.endsWith('/items')) { const it = { Id: items.length + 1, Created: new Date().toISOString(), Author: { Id: 279, Title: U[279].Title }, Editor: { Title: U[279].Title } }; aplica(it, c); items.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } }); }
      return r.fulfill({ status: 400, body: '' });
    }
    if (resto.startsWith('web/currentuser/groups')) return J({ value: registro ? [{ Title: 'Personal de Registro' }] : [{ Title: 'Integrantes cdv' }] });
    if (resto.startsWith('web/currentuser')) return J({ Id: 279, Title: U[279].Title, Email: U[279].EMail, LoginName: 'i:0#.w|et\\usuario' });
    if (resto.startsWith('web/siteusers')) return J({ value: Object.values(U).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail })) });
    if (resto.includes("getbytitle('empleos')")) return J({ value: [{ Title: 'Comandante' }, { Title: 'Sargento' }] });
    if (resto.includes("getbytitle('UNIDADES')")) return J({ value: [{ Id: 1, Title: 'UNIDAD A' }, { Id: 2, Title: 'UNIDAD B' }] });
    if (resto.includes('/fields')) return J({ value: [{ InternalName: 'Estado', Choices: ['0-Borrador de Solicitante', '1-Pendiente de Aprobar', '2-Aprobado', '3-Autorizado', '4-Registrado SIPERDEF', '5-Rechazado'] },
      { InternalName: 'TipoDePermiso', Choices: ['Vacaciones (Art.5)', 'Permiso por asuntos particulares (Art.6.a)', 'Permiso para compensar un servicio.'] }, { InternalName: 'CupoDeA_x00f1_o', Choices: ['2025', '2026'] },
      { InternalName: 'Dependencia', Choices: ['JEFATURA', 'SEGURIDAD'] }] });
    const mi = resto.match(/items\((\d+)\)/);
    if (mi) { const it = items.find(x => x.Id === +mi[1]); return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, ...it } } }); }
    if (resto.includes('/items')) {
      ultimoFiltro = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      if (!ultimoFiltro) return J({ value: items });
      const ids = [...ultimoFiltro.matchAll(/(\w+)Id eq (\d+)/g)], est = [...ultimoFiltro.matchAll(/Estado eq '([^']+)'/g)].map(x => x[1]);
      return J({ value: items.filter(it => ids.some(([, k, v]) => it[k] && it[k].Id === +v) || est.includes(it.Estado)) });
    }
    if (resto.includes("getbytitle('Solicitud de Permisos')")) return J({ Id: 'g', Title: 'Solicitud de Permisos', ListItemEntityTypeFullName: 'SP.Data.Solicitud_x0020_de_x0020_PermisosListItem', EffectiveBasePermissions: { High: '0', Low: String(gestor ? 0x80F : 0x7) }, RootFolder: { ServerRelativeUrl: WEB + '/Lists/Solicitud de Permisos' } });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = verbose ? '[verbose]' : '[ligero]';
  await p.goto(O + WEB + '/Documentos%20compartidos/permisos.html'); await p.waitForTimeout(800);
  if (soloAlcance) {
    await p.click('#tabs a[data-v=todas]'); await p.waitForTimeout(300);
    console.log(tag, soloAlcance, '| filtro en servidor:', ultimoFiltro ? 'sí' : 'no', '| ids en consulta:', await p.$$eval('.sol', n => n.map(x => x.dataset.id).join(',')), '|', await p.textContent('#vista p.muted.small'));
    await b.close(); return;
  }
  console.log(tag, 'pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent)), '| mis:', await p.$$eval('.sol', n => n.length));
  // Nueva solicitud propia con aprobador
  await p.click('[data-nueva]'); await p.waitForTimeout(400);
  await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
  console.log(tag, 'validación vacía:', await p.textContent('#nError'));
  await p.selectOption('#fSol [name=tipo]', 'Vacaciones (Art.5)'); await p.fill('#fSol [name=ini]', d(20).slice(0, 10)); await p.fill('#fSol [name=fin]', d(24).slice(0, 10));
  await p.selectOption('#fSol [name=empleo]', 'Comandante'); await p.selectOption('#fSol [name=unidad]', '1');
  await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
  console.log(tag, 'sin NIF:', await p.textContent('#nError'));
  await p.fill('#fSol [name=nif]', '12345678Z');
  await p.fill('#nApr input', 'aprob'); await p.waitForTimeout(200); await p.click('#nApr [data-sug="0"]'); await p.waitForTimeout(300);
  posts.length = 0;
  await p.click('#fSol #nEnviar'); await p.waitForTimeout(1500);
  const alta = posts.find(x => x.ruta.endsWith('/items')), cAlta = JSON.parse(alta.cuerpo);
  console.log(tag, 'alta:', JSON.stringify({ Estado: cAlta.Estado, Sol: cAlta.SolicitanteId, Apr: cAlta.AprobadorDePermisoId, AprT: cAlta.AprobadorTexto, Cor: cAlta.CorreoDeAPROBADOR, Uni: cAlta.Unidad0Id, mas1: cAlta.dia_x0020_mas_x0020_uno, Motivo: cAlta.MotivoSeleccionado, Reg: cAlta.RegistroDeBorrador.slice(0, 50), Titulo: cAlta.Title }));
  const m1 = JSON.parse(posts.find(x => x.ruta.startsWith('SP.Utilities')).cuerpo).properties;
  console.log(tag, 'correo alta:', m1.To.results, m1.CC.results, '|', m1.Subject);
  console.log(tag, 'mensaje:', await p.textContent('#dlg .okmsg, #dlg .aviso'));
  await p.click('#dlg [data-cerrar]');
  // Aprobar: sin autorizador → error; con autorizador → 2-Aprobado
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, 'pendientes:', await p.$$eval('.sec span:first-child', n => n.map(x => x.textContent)), await p.$$eval('.sec span:last-child', n => n.map(x => x.textContent)));
  await p.click('.sol[data-id="1"]'); await p.waitForTimeout(500);
  await p.click('[data-acc=aprobar]'); await p.waitForTimeout(200);
  console.log(tag, 'aprobar sin autorizador:', await p.textContent('#accMsg'));
  await p.click('[data-acc=devolverAprob]'); await p.waitForTimeout(200);
  console.log(tag, 'devolver sin obs:', await p.textContent('#accMsg'));
  await p.fill('#pAut input', 'autor'); await p.waitForTimeout(200); await p.click('#pAut [data-sug="0"]'); await p.waitForTimeout(300);
  posts.length = 0;
  await p.click('[data-acc=aprobar]'); await p.waitForTimeout(1500);
  const ap = posts.find(x => /items\(1\)/.test(x.ruta)); const cAp = JSON.parse(ap.cuerpo);
  console.log(tag, 'aprobar:', ap.cab['x-http-method'], JSON.stringify({ Estado: cAp.Estado, EA: cAp.EstadoDeAprobacion, Aut: cAp.AutorizadorDelPermisoId, AutT: cAp.AutorizadorTexto, Cor: cAp.CorreoDeAUTORIZADOR }));
  const m2 = JSON.parse(posts.find(x => x.ruta.startsWith('SP.Utilities')).cuerpo).properties;
  console.log(tag, 'correo aprobado:', m2.To.results, m2.CC.results, m2.BCC.results, '|', m2.Subject);
  await p.click('#dlg [data-cerrar]');
  // Autorizar la 2
  await p.click('.sol[data-id="2"]'); await p.waitForTimeout(500);
  posts.length = 0; await p.click('[data-acc=autorizar]'); await p.waitForTimeout(1500);
  const cAu = JSON.parse(posts.find(x => /items\(2\)/.test(x.ruta)).cuerpo);
  console.log(tag, 'autorizar:', JSON.stringify({ Estado: cAu.Estado, EAu: cAu.EstadoDeAutorizacion, ER: cAu.EstadoDeRegistro }));
  await p.click('#dlg [data-cerrar]');
  // Registrar la 3 (grupo Personal de Registro) y comprobar NIF visible
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  await p.click('.sol[data-id="3"]'); await p.waitForTimeout(600);
  console.log(tag, 'NIF visible para quien interviene:', (await p.textContent('#detMas')).includes('00000000T'));
  posts.length = 0; await p.click('[data-acc=registrar]'); await p.waitForTimeout(1500);
  const cRg = JSON.parse(posts.find(x => /items\(3\)/.test(x.ruta)).cuerpo);
  console.log(tag, 'registrar:', JSON.stringify({ Estado: cRg.Estado, ER: cRg.EstadoDeRegistro, Reg: cRg.Registro_x0020_SIPERDEFId, RegT: cRg.RegistradorTexto }));
  await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
  await p.click('#dlg [data-cerrar]');
  // Conflicto: otro cambia la 2 (ya autorizada → ahora la ve el registro) mientras está abierta
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  await p.click('.sol[data-id="2"]'); await p.waitForTimeout(400);
  items.find(x => x.Id === 2).Modified = new Date(Date.now() + 99999).toISOString();
  await p.click('[data-acc=registrar]'); await p.waitForTimeout(800);
  console.log(tag, 'conflicto:', await p.textContent('#accMsg'));
  await p.click('#dlg [data-cerrar]');
  // Calendario e impresión
  await p.click('#tabs a[data-v=calendario]'); await p.waitForTimeout(300);
  console.log(tag, 'calendario: nombres pintados', await p.$$eval('.dia span', n => n.length));
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-impcal]')]); await pop.waitForLoadState();
  console.log(tag, 'impresión:', await pop.title(), (await pop.$$eval('.cal td .t', n => n.length)) + ' entradas');
  await pop.close();
  await p.click('#tabs a[data-v=todas]'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-csv]')]);
  console.log(tag, 'CSV:', dl.suggestedFilename(), '| errores:', errs);
  await p.click('#tabs a[data-v=mias]'); await p.waitForTimeout(200);
  await p.screenshot({ path: new URL('inicio.png', import.meta.url).pathname });
  await b.close();
}
await prueba(false); await prueba(true);
registro = false; await prueba(false, 'usuario normal');
registro = true; await prueba(false, 'registro');
gestor = true; await prueba(true, 'gestor');
