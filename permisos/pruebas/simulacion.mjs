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
    { Id: 6, Title: 'Otra unidad', Estado: '3-Autorizado', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(6), FechaDeFin: d(8), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[12], Empleo: 'Sargento', EstadoDeRegistro: 'Pendiente de Registro', Unidad0: { Id: 2, Title: 'UNIDAD B' } },
    { Id: 5, Title: 'Ajena', Estado: '1-Pendiente de Aprobar', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(3), FechaDeFin: d(4), Solicitante: U[13], AprobadorDePermiso: U[11], Unidad0: { Id: 2, Title: 'UNIDAD B' } },
    { Id: 4, Title: 'Viejo', Estado: '4-Registrado SIPERDEF', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2025', FechaInicio: d(-40), FechaDeFin: d(-30), Solicitante: U[279], Unidad0: { Id: 1, Title: 'UNIDAD A' } },
  ].map(x => ({ Created: d(-3), Modified: d(-2) + '', Author: { Id: x.Solicitante.Id, Title: x.Solicitante.Title }, Editor: { Title: 'X' }, NIF: '00000000T', RegistroDeBorrador: '', ...x }));
};
async function prueba(verbose, soloAlcance) {
  nuevoStore();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 800 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [], gets = [], alertas = [];
  p.on('dialog', dl => { alertas.push(dl.message()); dl.dismiss(); });
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'GET') gets.push(resto);
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
      const filtro = (u.match(/\$filter=([^&]*)/) || [])[1] || ''; if (u.includes('Title')) ultimoFiltro = filtro;
      if (!filtro) return J({ value: items });
      const ids = [...filtro.matchAll(/(\w+)Id eq (\d+)/g)], est = [...filtro.matchAll(/Estado eq '([^']+)'/g)].map(x => x[1]);
      return J({ value: items.filter(it => ids.some(([, k, v]) => it[k] && it[k].Id === +v) || est.includes(it.Estado)) });
    }
    if (resto.includes('sitegroups/getbyname')) return J({ value: [{ Title: 'REGISTRADOR UNO' }, { Title: U[279].Title }] });
    if (resto.includes('/roleassignments')) return J({ value: [{ Member: { Title: 'Integrantes CALIDAD-VIDA', PrincipalType: 8 }, RoleDefinitionBindings: [{ Name: 'Leer' }] },
      { Member: { Title: 'Personal de Registro', PrincipalType: 8 }, RoleDefinitionBindings: [{ Name: 'Colaborar' }, { Name: 'Acceso limitado' }] }] });
    if (resto.includes("getbytitle('Solicitud de Permisos')")) return J({ Id: 'g', Title: 'Solicitud de Permisos', ListItemEntityTypeFullName: 'SP.Data.Solicitud_x0020_de_x0020_PermisosListItem', EffectiveBasePermissions: { High: '0', Low: String(gestor ? 0x80F : 0x7) }, RootFolder: { ServerRelativeUrl: WEB + '/Lists/Solicitud de Permisos' } });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = verbose ? '[verbose]' : '[ligero]';
  await p.goto(O + WEB + '/Documentos%20compartidos/permisos.html' + (soloAlcance === 'enlace' ? '?id=1' : '')); await p.waitForTimeout(800);
  if (soloAlcance === 'enlace') {
    console.log(tag, 'enlace del correo abre:', await p.textContent('#dlg h2').catch(() => 'nada'), '| URL limpia:', p.url().endsWith('permisos.html'));
    await b.close(); return;
  }
  if (soloAlcance === 'seguridad') {
    // 1) Te quitan del grupo de registro con la página abierta: no se registra
    await p.click('#tabs a[data-v=registro]'); await p.waitForTimeout(200);
    registro = false; posts.length = 0;
    await p.click('[data-regok="3"]'); await p.waitForTimeout(100); await p.click('[data-regok="3"]'); await p.waitForTimeout(800);
    console.log(tag, 'fuera del grupo:', alertas.pop(), '| MERGE enviado:', posts.some(x => /items\(3\)/.test(x.ruta)));
    await p.click('#recargar'); await p.waitForTimeout(600);
    console.log(tag, 'pestañas tras actualizar:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
    // 2) El estado cambió en el servidor (sin cambiar la fecha): no se pisa
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
    await p.click('.sol[data-id="2"]'); await p.waitForTimeout(500);
    items.find(x => x.Id === 2).Estado = '5-Rechazado'; posts.length = 0;
    await p.click('[data-acc=autorizar]'); await p.waitForTimeout(800);
    console.log(tag, 'estado cambiado en el servidor:', await p.textContent('#accMsg'), '| MERGE enviado:', posts.some(x => /items\(2\)/.test(x.ruta) && x.cab['x-http-method']));
    await p.click('#dlg [data-cerrar]');
    // 3) NIF: el gestor que no interviene ni lo pide ni lo ve
    gestor = true; await p.click('#recargar'); await p.waitForTimeout(600); gets.length = 0;
    await p.click('#tabs a[data-v=todas]'); await p.waitForTimeout(200); await p.click('.sol[data-id="5"]'); await p.waitForTimeout(500);
    console.log(tag, 'gestor ajeno: NIF pedido:', gets.some(g => /items\(5\).*NIF/.test(g)), '| NIF visible:', (await p.textContent('#dlg')).includes('00000000T'));
    await p.click('#dlg [data-cerrar]'); gestor = false;
    // 4) Comprobar accesos
    registro = true; await p.click('#recargar'); await p.waitForTimeout(600);
    await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(200); await p.click('[data-seguridad]'); await p.waitForTimeout(600);
    console.log(tag, 'accesos:', (await p.textContent('#segRes')).replace(/\s+/g, ' ').slice(0, 520));
    await p.screenshot({ path: new URL('seguridad.png', import.meta.url).pathname, fullPage: true });
    console.log(tag, 'errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance) {
    await p.click('#tabs a[data-v=todas]'); await p.waitForTimeout(300);
    console.log(tag, soloAlcance, '| pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
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
  console.log(tag, 'correo alta:', m1.To.results, m1.CC.results, '|', m1.Subject, '| enlace:', (m1.Body.match(/href="([^"]+)"/) || [])[1]);
  console.log(tag, 'mensaje:', await p.textContent('#dlg .okmsg, #dlg .aviso'));
  await p.click('#dlg [data-cerrar]');
  // Aprobar: sin autorizador → error; con autorizador → 2-Aprobado
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, 'pendientes:', await p.$$eval('.sec span:first-child', n => n.map(x => x.textContent)), await p.$$eval('.sec span:last-child', n => n.map(x => x.textContent)));
  console.log(tag, 'espera en pendientes:', await p.$$eval('.badge.espera', n => n.map(x => x.textContent).join(' / ')));
  await p.click('.sol[data-id="1"]'); await p.waitForTimeout(500);
  console.log(tag, 'aviso de solape al aprobador:', (await p.textContent('#dlg .solape').catch(() => 'ninguno')).replace(/\s+/g, ' '));
  await p.click('[data-acc=aprobar]'); await p.waitForTimeout(200);
  console.log(tag, 'aprobar sin autorizador:', await p.textContent('#accMsg'));
  await p.click('[data-acc=devolverAprob]'); await p.waitForTimeout(200);
  console.log(tag, 'devolver sin obs:', await p.textContent('#accMsg'));
  await p.fill('#pAut input', 'autor'); await p.waitForTimeout(200); await p.click('#pAut [data-sug="0"]'); await p.waitForTimeout(300);
  posts.length = 0;
  await p.click('[data-acc=aprobar]'); await p.waitForTimeout(1500);
  const ap = posts.find(x => /items\(1\)/.test(x.ruta)); const cAp = JSON.parse(ap.cuerpo);
  console.log(tag, 'aprobar:', ap.cab['x-http-method'], JSON.stringify({ Hist: (cAp.RegistroDeBorrador || '').slice(0, 70), Estado: cAp.Estado, EA: cAp.EstadoDeAprobacion, Aut: cAp.AutorizadorDelPermisoId, AutT: cAp.AutorizadorTexto, Cor: cAp.CorreoDeAUTORIZADOR }));
  const m2 = JSON.parse(posts.find(x => x.ruta.startsWith('SP.Utilities')).cuerpo).properties;
  if (!verbose) fs.writeFileSync(new URL('correo.html', import.meta.url), m2.Body);
  console.log(tag, 'correo aprobado:', m2.To.results, m2.CC.results, m2.BCC.results, '|', m2.Subject);
  await p.click('#dlg [data-cerrar]');
  // Autorizar la 2
  await p.click('.sol[data-id="2"]'); await p.waitForTimeout(500);
  posts.length = 0; await p.click('[data-acc=autorizar]'); await p.waitForTimeout(1500);
  const cAu = JSON.parse(posts.find(x => /items\(2\)/.test(x.ruta)).cuerpo);
  console.log(tag, 'autorizar:', JSON.stringify({ Estado: cAu.Estado, EAu: cAu.EstadoDeAutorizacion, ER: cAu.EstadoDeRegistro }));
  await p.click('#dlg [data-cerrar]');
  // Registro SIPERDEF: pestaña aparte, agrupada por unidad, con NIF; registrar pide confirmación
  console.log(tag, 'pendientes de mí (sin registro):', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
  await p.click('#tabs a[data-v=registro]'); await p.waitForTimeout(300);
  console.log(tag, 'registro por unidad:', await p.$$eval('#vista .sec span:first-child', n => n.map(x => x.textContent)), '| NIF en tabla:', (await p.textContent('#vista')).includes('00000000T'));
  await p.screenshot({ path: new URL('registro-antes.png', import.meta.url).pathname });
  const [popR] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-regimp]')]); await popR.waitForLoadState();
  console.log(tag, 'relación impresa:', await popR.$$eval('h3', h => h.map(x => x.textContent))); await popR.close();
  console.log(tag, 'botón pendiente:', await p.textContent('[data-regok="3"]'), await p.$eval('[data-regok="3"]', b => getComputedStyle(b).backgroundColor));
  posts.length = 0; await p.click('[data-regok="3"]'); await p.waitForTimeout(200);
  console.log(tag, 'primer clic:', await p.textContent('[data-regok="3"]'), '| sin guardar:', !posts.some(x => /items\(3\)/.test(x.ruta)));
  await p.click('[data-regcancel]'); await p.waitForTimeout(100);
  console.log(tag, 'cancelar vuelve a:', await p.textContent('[data-regok="3"]'));
  await p.click('[data-regok="3"]'); await p.waitForTimeout(100);
  await p.click('[data-regok="3"]'); await p.waitForTimeout(1500);
  console.log(tag, 'tras registrar, en la fila:', await p.textContent('#vista .regok').catch(() => 'nada'), await p.$eval('#vista .regok', x => getComputedStyle(x).backgroundColor).catch(() => ''));
  if (!verbose) await p.screenshot({ path: new URL('registro.png', import.meta.url).pathname, fullPage: true });
  const cRg = JSON.parse(posts.find(x => /items\(3\)/.test(x.ruta)).cuerpo);
  console.log(tag, 'registrar:', JSON.stringify({ Estado: cRg.Estado, ER: cRg.EstadoDeRegistro, Reg: cRg.Registro_x0020_SIPERDEFId, RegT: cRg.RegistradorTexto }));
  console.log(tag, 'quedan por registrar:', await p.$$eval('[data-regok]', n => n.map(x => x.dataset.regok)));
  await p.click('[data-ver="6"]'); await p.waitForTimeout(500);
  console.log(tag, 'NIF visible en la ficha para registro:', (await p.textContent('#detMas')).includes('00000000T'));
  await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
  await p.click('#dlg [data-cerrar]');
  // Conflicto: otro cambia la 2 (ya autorizada → ahora la ve el registro) mientras está abierta
  await p.click('#tabs a[data-v=registro]'); await p.waitForTimeout(200);
  await p.click('[data-ver="2"]'); await p.waitForTimeout(400);
  items.find(x => x.Id === 2).Modified = new Date(Date.now() + 99999).toISOString();
  await p.click('[data-acc=registrar]'); await p.waitForTimeout(200);
  console.log(tag, 'ficha, primer clic:', await p.textContent('[data-acc=registrar]'));
  await p.click('[data-acc=registrar]'); await p.waitForTimeout(800);
  console.log(tag, 'conflicto:', await p.textContent('#accMsg'));
  await p.click('#dlg [data-cerrar]');
  // Calendario e impresión
  await p.click('#tabs a[data-v=calendario]'); await p.waitForTimeout(300);
  const clases = async () => p.$$eval('.dia span', n => { const c = {}; n.forEach(x => { const k = x.className || 'otros'; c[k] = (c[k] || 0) + 1; }); return JSON.stringify(c); });
  console.log(tag, 'calendario (mis + tramitados):', await clases(), '| control del mes:', await p.$$eval('#vista table.t tr', r => r.length - 1), 'filas');
  await p.selectOption('#cVer', 'mios'); await p.waitForTimeout(200); console.log(tag, 'calendario solo míos:', await clases());
  await p.selectOption('#cVer', 'tramitados'); await p.waitForTimeout(200); console.log(tag, 'calendario tramitados:', await clases());
  await p.selectOption('#cVer', 'todos'); await p.waitForTimeout(200); console.log(tag, 'calendario todos:', await clases());
  await p.selectOption('#cVer', 'control'); await p.waitForTimeout(200);
  if (!verbose) await p.screenshot({ path: new URL('calendario.png', import.meta.url).pathname, fullPage: true });
  const [ics] = await Promise.all([p.waitForEvent('download'), p.click('[data-ics=cal]')]);
  const icsTxt = fs.readFileSync(await ics.path(), 'utf8');
  console.log(tag, 'ics:', ics.suggestedFilename(), (icsTxt.match(/BEGIN:VEVENT/g) || []).length, 'eventos | CRLF:', icsTxt.includes('\r\n'), '|', (icsTxt.match(/SUMMARY:.*/g) || []).join(' ; '));
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-impcal]')]); await pop.waitForLoadState();
  console.log(tag, 'impresión:', await pop.title(), (await pop.$$eval('.cal td .t', n => n.length)) + ' entradas');
  await pop.close();
  await p.click('#tabs a[data-v=todas]'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-csv]')]);
  console.log(tag, 'CSV:', dl.suggestedFilename(), '| errores:', errs);
  const [rel] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-relimp]')]); await rel.waitForLoadState();
  console.log(tag, 'relación impresa:', await rel.title(), (await rel.$$eval('table.r tr', r => r.length)) - 1, 'filas | logos:', await rel.$$eval('img', i => i.filter(x => x.naturalWidth > 0).length));
  if (!verbose) { await rel.setViewportSize({ width: 1123, height: 794 }); await rel.screenshot({ path: new URL('relacion.png', import.meta.url).pathname }); }
  await rel.close();
  await p.click('.sol[data-id="1"]'); await p.waitForTimeout(600);
  const [fic] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-fichaimp]')]); await fic.waitForLoadState();
  console.log(tag, 'ficha impresa:', await fic.title(), '| secciones:', await fic.$$eval('h3', h => h.map(x => x.textContent)));
  if (!verbose) { await fic.setViewportSize({ width: 794, height: 1123 }); await fic.screenshot({ path: new URL('ficha-impresa.png', import.meta.url).pathname, fullPage: true }); }
  await fic.close(); await p.click('#dlg [data-cerrar]');
  await p.click('#tabs a[data-v=mias]'); await p.waitForTimeout(200);
  console.log(tag, 'resumen de días:', await p.$$eval('table.resumen tr', r => r.map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ')));
  await p.screenshot({ path: new URL('inicio.png', import.meta.url).pathname, fullPage: true });
  // Recordatorio al aprobador de mi solicitud pendiente (la 7, creada arriba)
  await p.click('.sol[data-id="7"]'); await p.waitForTimeout(500);
  posts.length = 0; await p.click('[data-recordar]'); await p.waitForTimeout(800);
  const mr = posts.find(x => x.ruta.startsWith('SP.Utilities')); const pr = mr && JSON.parse(mr.cuerpo).properties;
  console.log(tag, 'recordatorio:', pr ? [pr.To.results, pr.CC.results, pr.Subject].join(' | ') : 'no enviado', '|', await p.textContent('#accMsg'), '| botón desactivado:', await p.$eval('[data-recordar]', b => b.disabled));
  await p.click('#dlg [data-cerrar]');
  // Solape con una solicitud mía al dar de alta otra en las mismas fechas
  await p.click('[data-nueva]'); await p.waitForTimeout(400);
  await p.selectOption('#fSol [name=tipo]', 'Vacaciones (Art.5)'); await p.fill('#fSol [name=ini]', d(21).slice(0, 10)); await p.fill('#fSol [name=fin]', d(22).slice(0, 10));
  await p.selectOption('#fSol [name=empleo]', 'Comandante'); await p.selectOption('#fSol [name=unidad]', '1');
  posts.length = 0; await p.click('#fSol #nBorrador'); await p.waitForTimeout(300);
  console.log(tag, 'solape al guardar:', await p.textContent('#nError'), '| sin guardar:', !posts.some(x => x.ruta.endsWith('/items')));
  await p.click('#fSol #nBorrador'); await p.waitForTimeout(1200);
  console.log(tag, 'segundo clic guarda:', posts.some(x => x.ruta.endsWith('/items')), '| errores:', errs);
  await p.click('#dlg [data-cerrar]');
  await b.close();
}
await prueba(false); await prueba(true);
registro = false; await prueba(false, 'usuario normal');
registro = true; await prueba(false, 'registro');
gestor = true; await prueba(true, 'gestor');
gestor = false; await prueba(false, 'enlace');
registro = true; await prueba(false, 'seguridad'); await prueba(true, 'seguridad');
