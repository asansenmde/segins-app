// Prueba de incidentes.html contra una lista «INCIDENTES DE SEGURIDAD» simulada (datos inventados).
// Uso: node incidentes/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../incidentes.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const YO = { Id: 50, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' };
const P = { 61: { Id: 61, Title: 'JEFE UNIDAD A', EMail: 'jefea@et.mde.es' }, 62: { Id: 62, Title: 'JEFE UNIDAD B', EMail: 'jefeb@et.mde.es' } };
const GRUPOS = { SEGURIDAD_SUIGESUR: 101, SEGURIDAD_SUIGENOR: 102, SEGURIDAD_SUIGECAN: 103, SEGURIDAD_DIAPER: 104, SEGURIDAD_IGE: 105, 'Integrantes de la Colaborativo': 106 };
const MIEMBROS = { SEGURIDAD_SUIGESUR: ['sur1@et.mde.es', 'sur2@et.mde.es'], SEGURIDAD_SUIGENOR: ['nor1@et.mde.es'], SEGURIDAD_SUIGECAN: ['can1@et.mde.es'], SEGURIDAD_DIAPER: ['diacu1@et.mde.es'], SEGURIDAD_IGE: ['ige1@et.mde.es'] };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(9, 0, 0, 0); return x.toISOString(); };
let expandRoto = false, faltaCampo = null, items, misGrupos = [], admin = false, sinSubstringof = false, ultimoFiltro = '', lecturaMinima = '';
const base = { A_x00f1_o: '2026', Provincia: 'SEVILLA', Empleo: 'Sargento', ZONASE_x00d1_ALIZADA: true, Reiterada: 'NO', Denuncia: false, ValoradoPorSUIGE: false, ValoradoPorDIACU: false, ValoradoPorIGE: false,
  OBSERVACION: '<p>TEXTO RESERVADO DEL PARTE</p>', ANALISIS: '<div>Análisis</div>', MEDIDAS: 'Medidas', CONTROLMEDIDASADOPTADAS: 'Control', CONCLUSION: 'Conclusión', ObservacionesDelExpediente: '',
  ResponsableDeLaInformacion: P[61], correosPersonasInfo: 'info1@et.mde.es; info2@et.mde.es', MANDO1N: 'FUTER', MANDO2N: '', MANDO3N: '', OData__x004d_N1: '', OData__x004d_N2: '', OData__x004d_N3: '', OData__x004d_N4: '',
  Title: '', ESTADO: '', REGISTRODEACTIVIDAD: '', ModificadoPorTEXTO: '', SUIGES: null, Unidad: null, OTRO: '', NDenuncia: '', PROBABILIDADES: '', ACEPTACION: null, TipoDeIncidente: '', ResponsableDelParte: '', DIACU: null, VALORACIONSUIGES: '', VALORACIONDIACU: '', valoracionIGE: '', Usuario: null, grupo: null };
const nuevoStore = () => {
  items = [
    { Id: 1, ESTADO: 'REMITIDO A M1', TipoDeIncidente: 'Intrusión no autorizada', MANDO2N: 'SUIGESUR', OTRO: 'ACUARTELAMIENTO X', PROBABILIDADES: 'MUY ALTO', FechaNotificacion: d(-10), Created: d(-9), Author: P[61] },
    { Id: 2, ESTADO: 'EN SEGUIMIENTO', TipoDeIncidente: 'Robo o sustracción', grupo: { Id: 102, Title: 'SEGURIDAD_SUIGENOR' }, ValoradoPorSUIGE: true, PROBABILIDADES: 'MEDIO', FechaNotificacion: d(-20), Created: d(-19), Author: P[62], Provincia: 'LEÓN', VALORACIONSUIGES: 'Valorado NOR' },
    { Id: 3, ESTADO: 'EN SEGUIMIENTO', TipoDeIncidente: 'Incidentes con UAS', SUIGES: 'SUIGECAN', ValoradoPorSUIGE: true, DIACU: 'ELEVADO POR DIACU', ValoradoPorDIACU: true, PROBABILIDADES: 'ALTO', FechaNotificacion: d(-40), Created: d(-39), Author: P[62], Provincia: 'LAS PALMAS' },
    { Id: 4, ESTADO: 'EN SEGUIMIENTO', TipoDeIncidente: 'Pintadas', MANDO3N: 'SUIGESUR', ValoradoPorSUIGE: true, DIACU: 'VISTO POR DIACU', ValoradoPorDIACU: true, PROBABILIDADES: 'BAJO', FechaNotificacion: d(-60), Created: d(-59), Author: P[61] },
    { Id: 5, ESTADO: 'EXP CERRADO', TipoDeIncidente: 'Otro', MANDO2N: 'SUIGESUR', ValoradoPorSUIGE: true, DIACU: 'VISTO POR DIACU', PROBABILIDADES: 'MUY BAJO', FechaNotificacion: d(-90), Created: d(-89), Author: P[61], Denuncia: true, NDenuncia: '123/26' },
    { Id: 6, ESTADO: 'BORRADOR', TipoDeIncidente: 'Sabotaje', MANDO2N: 'SUIGESUR', PROBABILIDADES: 'MEDIO', FechaNotificacion: d(-1), Created: d(-1), Author: YO },
    { Id: 7, ESTADO: 'REMITIDO A M1', TipoDeIncidente: 'Intrusión no autorizada', grupo: { Id: 102, Title: 'SEGURIDAD_SUIGENOR' }, PROBABILIDADES: 'ALTO', FechaNotificacion: d(-3), Created: d(-3), Author: P[62], Provincia: 'BURGOS' },
    { Id: 8, ESTADO: 'REMITIDO A M1', TipoDeIncidente: 'Intrusión no autorizada', MANDO2N: 'SUIGESUR', OTRO: 'ACUARTELAMIENTO X', Reiterada: 'SI', PROBABILIDADES: 'ALTO', FechaNotificacion: d(-2), Created: d(-2), Author: P[61] },
  ].map(x => ({ ...base, Title: '01/01/2026', Modified: d(-1), Editor: { Id: 61, Title: 'JEFE UNIDAD A' }, Attachments: x.Id === 1, ...x }));
};
// Evalúa el $filter de alcance (or de igualdades de persona, SUIGES y substringof)
const cumple = (it, filtro) => filtro.split(' or ').some(c => {
  let m;
  if ((m = c.match(/\((\w+)Id eq (\d+)\)/))) return it[m[1]] && it[m[1]].Id === +m[2];
  if ((m = c.match(/\(SUIGES eq '([^']+)'\)/))) return it.SUIGES === m[1];
  if ((m = c.match(/substringof\('([^']+)',(\w+)\)/))) return String(it[m[2]] || '').includes(m[1]);
  if ((m = c.match(/\(Id eq (\d+)\)/))) return it.Id === +m[1];
  return false;
});
async function prueba(verbose, escenario) {
  nuevoStore();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [], gets = [];
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) {
      if (/\.png$/.test(u)) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ body: html, contentType: 'text/html' });
    }
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) return r.fulfill({ json: { d: {} } });
      const mi = resto.match(/items\((\d+)\)/);
      if (mi) {
        const it = items.find(x => x.Id === +mi[1]);
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
        const c = JSON.parse(req.postData()); delete c.__metadata; Object.assign(it, c, { Modified: new Date().toISOString(), Editor: { Id: YO.Id, Title: YO.Title } });
        return r.fulfill({ status: 204, body: '' });
      }
      return r.fulfill({ status: 400, body: '' });
    }
    gets.push(resto);
    if (resto.startsWith('web/currentuser/groups')) return J({ value: misGrupos.map(n => ({ Id: GRUPOS[n], Title: n })) });
    if (resto.startsWith('web/currentuser')) return J({ Id: YO.Id, Title: YO.Title, Email: YO.EMail, LoginName: 'i:0#.w|et\\usuario' });
    const g = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users/);
    if (g) return MIEMBROS[g[1]] ? J({ value: MIEMBROS[g[1]].map(e => ({ Email: e })) }) : r.fulfill({ status: 404, body: '' });
    const mi = resto.match(/items\((\d+)\)/);
    if (mi) { const it = items.find(x => x.Id === +mi[1]); return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, ...it } } }); }
    if (resto.includes('/items') && expandRoto && u.includes('$expand')) return r.fulfill({ status: 400, body: '' });
    if (resto.includes('/items')) {
      const selRaw = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',').filter(Boolean);
      const exp = ((u.match(/\$expand=([^&]*)/) || [])[1] || '').split(',');
      const malo = selRaw.find(f => { const [a, b] = f.split('/'); if (a === faltaCampo) return true; if (b) return !exp.includes(a); if (/Id$/.test(a) && (a.slice(0, -2) in base || ['Author', 'Editor'].includes(a.slice(0, -2)))) return false; return !(a in base) && !['Id', 'Created', 'Modified', 'Attachments', 'Author', 'Editor', 'ValoradoPorSUIGE', 'ValoradoPorDIACU', 'ValoradoPorIGE', 'FechaNotificacion', 'Reiterada', 'ZONASE_x00d1_ALIZADA', 'Denuncia', 'A_x00f1_o', 'Provincia', 'Empleo', 'correosPersonasInfo', 'ResponsableDeLaInformacion'].includes(a); });
      if (malo) return r.fulfill({ status: 400, json: { 'odata.error': { message: { value: "The field or property '" + malo.split('/')[0] + "' does not exist." } } } });
      const filtro = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      ultimoFiltro = filtro;
      if (filtro.includes('substringof') && sinSubstringof) return r.fulfill({ status: 400, body: '' });
      const lista = filtro ? items.filter(it => cumple(it, filtro)) : items;
      // Lectura mínima de la vía alternativa: solo las columnas pedidas en $select
      const campos = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',');
      if (!campos.includes('Title')) { lecturaMinima = campos.join(','); return J({ value: lista.map(it => Object.fromEntries(Object.entries(it).filter(([k]) => campos.includes(k) || (k === 'grupo' && campos.includes('grupo/Title'))))) }); }
      return J({ value: lista });
    }
    if (resto.includes("getbytitle('INCIDENTES DE SEGURIDAD')")) return J({ Id: 'g', Title: 'INCIDENTES DE SEGURIDAD', ListItemEntityTypeFullName: 'SP.Data.INTRUSIONESListItem',
      EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x2000BFF : 0x7) }, DefaultNewFormUrl: WEB + '/Lists/INTRUSIONES/NewForm.aspx', DefaultEditFormUrl: WEB + '/Lists/INTRUSIONES/EditForm.aspx', DefaultDisplayFormUrl: WEB + '/Lists/INTRUSIONES/DispForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = (verbose ? '[verbose] ' : '[ligero] ') + escenario;
  const correos = () => posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties);
  const merge = id => { const m = posts.filter(x => new RegExp('items\\(' + id + '\\)').test(x.ruta) && x.cab['x-http-method'] === 'MERGE').pop(); return m && JSON.parse(m.cuerpo); };
  await p.goto(O + '/et/SUIGESUR/JSUIGE/Documentos%20compartidos/incidentes.html' + (escenario === 'enlace' ? '?id=3' : '')); await p.waitForTimeout(900);
  const pestañas = await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | '));
  if (escenario === 'columna inexistente') { console.log(tag, '| carga:', await p.textContent('#estadoCarga'), '| aviso:', await p.textContent('#vista .aviso').catch(() => 'ninguno'), '| errores:', errs); await b.close(); return; }
  if (escenario === 'enlace') { console.log(tag, '| ficha abierta:', await p.textContent('#dlg h2').catch(() => 'nada'), '| URL limpia:', p.url().endsWith('incidentes.html')); await b.close(); return; }
  console.log(tag, '| pestañas:', pestañas, '| filtro:', ultimoFiltro ? (ultimoFiltro.includes('substringof') ? 'con cadena de mando' : 'sin cadena de mando') : 'ninguno (ve todo)');
  console.log(tag, '| panel:', (await p.$$eval('.kpi', k => k.map(x => x.textContent.replace(/(\d+)$/, ':$1')))).join(' · '));
  if (escenario === 'solo SEGURIDAD_IGE') { await p.click('#tabs a[data-v=panel]'); await p.waitForTimeout(200); }
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, '| pendientes:', (await p.$$eval('#vista .sec', s => s.map(x => x.textContent.replace(/(\d+)$/, ' = $1')))).join(' · '), '| ids:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).join(',')));
  if (escenario === 'solo SEGURIDAD_IGE') { console.log(tag, '| papeles:', await p.$$eval('#vista .badge.rol', n => n.map(x => x.textContent).join(', ')).catch(() => ''), '| errores:', errs); await b.close(); return; }
  if (escenario === 'solo SUIGESUR' || escenario === 'SUIGESUR sin substringof') {
    await p.click('#tabs a[data-v=consulta]'); await p.waitForTimeout(200);
    console.log(tag, '| ve:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).sort().join(',')), lecturaMinima ? '| lectura mínima: ' + lecturaMinima : '');
    await p.click('.inc[data-id="7"]').catch(() => {}); await p.waitForTimeout(100);
    await p.click('.inc[data-id="1"]'); await p.waitForTimeout(500);
    console.log(tag, '| ficha 1, panel:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')), '| editar en Colabora:', !!(await p.$('#dlg a[href*="EditForm"]')));
    await p.click('#dlg [data-cerrar]');
    await p.click('#tabs a[data-v=panel]'); await p.click('.inc[data-id="6"]'); await p.waitForTimeout(400);
    console.log(tag, '| borrador propio 6: editar en Colabora:', !!(await p.$('#dlg a[href*="EditForm"]')), '| errores:', errs);
    await b.close(); return;
  }
  // 1) SUIGE valora el 1 (sin texto, error; con texto, pasa a DIACU)
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(600);
  console.log(tag, '| pasos 1:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '), '| aviso reiterado:', (await p.textContent('#dlg .aviso').catch(() => '')).slice(0, 40));
  console.log(tag, '| textos leídos:', (await p.textContent('#detTextos')).includes('TEXTO RESERVADO DEL PARTE'));
  await p.fill('#vTexto', ''); await p.click('[data-acc=valSuige]'); await p.waitForTimeout(150);
  console.log(tag, '| valorar sin texto:', await p.textContent('#accMsg'));
  await p.fill('#vTexto', 'Riesgo alto: reforzar el vallado.\nRevisar cámaras.'); posts.length = 0;
  await p.click('[data-acc=valSuige]'); await p.waitForTimeout(1400);
  let c = merge(1), m = correos().pop();
  console.log(tag, '| valSuige:', JSON.stringify({ ESTADO: c.ESTADO, ValoradoPorSUIGE: c.ValoradoPorSUIGE, VALORACIONSUIGES: c.VALORACIONSUIGES, Obs: (c.ObservacionesDelExpediente || '').slice(-60), Mod: c.ModificadoPorTEXTO }));
  console.log(tag, '| correo:', m.To.results, m.CC.results, '|', m.Subject, '| sin texto del parte:', !m.Body.includes('TEXTO RESERVADO'), '| enlace:', (m.Body.match(/href="([^"]+)"/) || [])[1]);
  if (!verbose) fs.writeFileSync(new URL('correo.html', import.meta.url), m.Body);
  console.log(tag, '| mensaje:', (await p.textContent('#dlg .okmsg, #dlg .aviso')).slice(0, 90));
  await p.click('#dlg [data-cerrar]');
  // 2) DIACU eleva el 2 (sin texto, error)
  await p.click('#tabs a[data-v=pendientes]'); await p.click('.inc[data-id="2"]'); await p.waitForTimeout(600);
  await p.click('[data-acc=diacuElevar]'); await p.waitForTimeout(150);
  console.log(tag, '| elevar sin texto:', await p.textContent('#accMsg'));
  await p.fill('#vTexto', 'Se eleva por reincidencia.'); posts.length = 0; await p.click('[data-acc=diacuElevar]'); await p.waitForTimeout(1400);
  c = merge(2); m = correos().pop();
  console.log(tag, '| elevar:', JSON.stringify({ DIACU: c.DIACU, ValoradoPorDIACU: c.ValoradoPorDIACU, VALORACIONDIACU: c.VALORACIONDIACU }), '| correo a:', m.To.results, 'cc:', m.CC.results);
  await p.click('#dlg [data-cerrar]');
  // 3) IGE valora el 3
  await p.click('#tabs a[data-v=pendientes]'); await p.click('.inc[data-id="3"]'); await p.waitForTimeout(600);
  await p.fill('#vTexto', 'Conforme con las medidas.'); posts.length = 0; await p.click('[data-acc=valIge]'); await p.waitForTimeout(1400);
  c = merge(3); m = correos().pop();
  console.log(tag, '| IGE:', JSON.stringify({ ValoradoPorIGE: c.ValoradoPorIGE, valoracionIGE: c.valoracionIGE }), '| correo a:', m.To.results, '| ahora:', await p.textContent('#detAcc h3'));
  // 4) Cierre del 3 (ya valorado por IGE)
  await p.fill('#vCierre', 'Medidas implantadas.'); posts.length = 0; await p.click('[data-acc=cerrar]'); await p.waitForTimeout(1400);
  c = merge(3); m = correos().pop();
  console.log(tag, '| cerrar:', JSON.stringify({ ESTADO: c.ESTADO, Obs: (c.ObservacionesDelExpediente || '').split('\n').length + ' líneas' }), '| correo a:', m.To.results, 'cc:', m.CC.results);
  if (!verbose) await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
  // 5) Reabrir exige motivo; anotar; recordatorio
  await p.click('[data-acc=reabrir]'); await p.waitForTimeout(150);
  console.log(tag, '| reabrir sin motivo:', await p.textContent('#accMsg'));
  await p.fill('#vNota', 'Pendiente informe de la Guardia Civil.'); posts.length = 0; await p.click('[data-acc=anotar]'); await p.waitForTimeout(1200);
  c = merge(3);
  console.log(tag, '| anotar:', (c.ObservacionesDelExpediente || '').split('\n').pop().replace(/^.*? · /, '… · '), '| sin correo:', !correos().length);
  await p.click('#dlg [data-cerrar]');
  await p.click('#tabs a[data-v=consulta]'); await p.click('.inc[data-id="7"]'); await p.waitForTimeout(500);
  posts.length = 0; await p.click('[data-acc=recordar]'); await p.waitForTimeout(800);
  m = correos().pop(); console.log(tag, '| recordatorio:', m && m.To.results, m && m.Subject);
  // 6) Conflicto: otro cambia el 8 mientras está abierto
  await p.click('#dlg [data-cerrar]'); await p.click('.inc[data-id="8"]'); await p.waitForTimeout(500);
  items.find(x => x.Id === 8).Modified = new Date(Date.now() + 99999).toISOString();
  await p.fill('#vTexto', 'x'); await p.click('[data-acc=valSuige]'); await p.waitForTimeout(800);
  console.log(tag, '| conflicto:', await p.textContent('#accMsg'));
  await p.click('#dlg [data-cerrar]');
  // 7) Consulta, filtros, impresión, CSV y estadísticas
  await p.click('#tabs a[data-v=panel]'); await p.click('.kpi[data-ir="prob:alta"]'); await p.waitForTimeout(200);
  console.log(tag, '| prob. alta abiertos →', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).join(',')));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-csv]')]);
  console.log(tag, '| CSV:', dl.suggestedFilename(), fs.readFileSync(await dl.path(), 'utf8').split('\r\n').length - 1, 'filas');
  const [rel] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-relimp]')]); await rel.waitForLoadState();
  console.log(tag, '| relación:', await rel.title(), (await rel.$$eval('table.r tr', r => r.length)) - 1, 'filas');
  if (!verbose) { await rel.setViewportSize({ width: 1123, height: 794 }); await rel.screenshot({ path: new URL('relacion.png', import.meta.url).pathname }); }
  await rel.close();
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(600);
  const [fic] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-fichaimp]')]); await fic.waitForLoadState();
  console.log(tag, '| ficha impresa:', await fic.$$eval('h3', h => h.map(x => x.textContent).join(' | ')), '| con descripción:', (await fic.content()).includes('TEXTO RESERVADO'));
  if (!verbose) { await fic.setViewportSize({ width: 794, height: 1123 }); await fic.screenshot({ path: new URL('ficha-impresa.png', import.meta.url).pathname, fullPage: true }); }
  await fic.close(); await p.click('#dlg [data-cerrar]');
  await p.click('[data-limpiar]'); await p.click('#tabs a[data-v=estadisticas]'); await p.waitForTimeout(300);
  console.log(tag, '| estadísticas:', await p.$$eval('.estadis h3', h => h.map(x => x.textContent).join(' | ')));
  console.log(tag, '| por tipo:', await p.$$eval('.estadis .card:first-child .barras .n', n => n.map(x => x.textContent).join(' / ')));
  if (!verbose) await p.screenshot({ path: new URL('estadisticas.png', import.meta.url).pathname, fullPage: true });
  await p.click('#tabs a[data-v=panel]'); await p.waitForTimeout(200);
  if (!verbose) await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: true });
  console.log(tag, '| errores:', errs);
  await b.close();
}
const TODOS = ['SEGURIDAD_SUIGESUR', 'SEGURIDAD_SUIGENOR', 'SEGURIDAD_SUIGECAN', 'SEGURIDAD_DIAPER', 'SEGURIDAD_IGE', 'Integrantes de la Colaborativo'];
misGrupos = TODOS; admin = true; await prueba(false, 'control total'); await prueba(true, 'control total');
misGrupos = ['SEGURIDAD_SUIGESUR', 'Integrantes de la Colaborativo']; admin = false; await prueba(false, 'solo SUIGESUR');
sinSubstringof = true; await prueba(true, 'SUIGESUR sin substringof'); sinSubstringof = false;
misGrupos = ['SEGURIDAD_IGE']; admin = false; await prueba(false, 'solo SEGURIDAD_IGE');
misGrupos = TODOS; admin = true; await prueba(false, 'enlace');
faltaCampo = 'ResponsableDelParte'; await prueba(true, 'columna inexistente'); faltaCampo = null;
expandRoto = true; await prueba(false, 'columna inexistente'); expandRoto = false;
