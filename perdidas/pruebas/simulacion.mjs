// Prueba de perdidas.html contra una lista «PERDIDA DOCUMENTACION» simulada (datos inventados).
// Uso: node perdidas/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
// PER_HTML=perdidas/colabora/perdidas.html para probar la versión protegida.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.PER_HTML ? process.env.PER_HTML : new URL('../perdidas.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const YO = { Id: 61, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' };
const P = { 61: YO, 62: { Id: 62, Title: 'JEFE UNIDAD', EMail: 'jefe@et.mde.es' }, 70: { Id: 70, Title: 'PEREZ GOMEZ JUAN', EMail: 'jperez@et.mde.es' } };
const GRUPOS = { SEGURIDAD_SUIGESUR: 101, SEGURIDAD_SUIGENOR: 102, SEGURIDAD_IGE: 105, INCIDENTES_UNIDADES: 110 };
const MIEMBROS = { SEGURIDAD_SUIGESUR: ['sur1@et.mde.es'], SEGURIDAD_SUIGENOR: ['nor1@et.mde.es'], SEGURIDAD_IGE: ['ige1@et.mde.es'], INCIDENTES_UNIDADES: ['jefe@et.mde.es'] };
const AUXL = { M1N: [{ Id: 1, Title: 'FUTER' }, { Id: 2, Title: 'MCANA' }],
  M2N: [{ Id: 1, Title: 'SUIGESUR', ID_M1NId: 1 }, { Id: 2, Title: 'SUIGENOR', ID_M1NId: 1 }, { Id: 4, Title: 'OFICINA X', ID_M1NId: 1 }],
  M3N: [{ Id: 1, Title: 'ACUARTELAMIENTO X', M1NId: 1, M2NId: 1 }, { Id: 2, Title: 'BASE NORTE', M1NId: 1, M2NId: 2 }],
  PROVINCIAS: [{ Id: 1, Title: 'SEVILLA' }, { Id: 2, Title: 'LEÓN' }], empleos: [{ Id: 1, Title: 'Sargento' }, { Id: 2, Title: 'Comandante' }] };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(9, 30, 0, 0); return x.toISOString(); };
const SEG = ['ObservacionesDelExpediente', 'VALORACIONSUIGES', 'ValoradoPorSUIGE'];
const COLS = { Title: 'Text', ESTADO: 'Choice', ResponsableDeLaInformacion: 'User', REGISTRODEACTIVIDAD: 'Text', ModificadoPorTEXTO: 'Text', Comentario: 'Note', A_x00f1_o: 'Choice', SUIGES: 'Choice',
  Unidad: 'Lookup', Tipo_Documento: 'MultiChoice', Denuncia_Tramitada: 'Choice', FechaDeLaPerdia: 'DateTime', NT08_22: 'Boolean', OTRO: 'Text', MANDO1N: 'Text', MANDO2N: 'Text', MANDO3N: 'Text',
  _x004d_N1: 'Text', _x004d_N2: 'Text', _x004d_N3: 'Text', _x004d_N4: 'Text', Denunciante: 'Text', DNI: 'Text', Provincia: 'Text', Empleo: 'Text', Modo: 'Choice', FechaNotificacion: 'DateTime',
  Testigos: 'Choice', NDenuncia: 'Text', Acciones: 'MultiChoice', Usuario: 'User', TipoDoc: 'Text', Author: 'User', Editor: 'User', Created: 'DateTime', Modified: 'DateTime', Attachments: 'Attachments',
  ObservacionesDelExpediente: 'Note', VALORACIONSUIGES: 'Note', ValoradoPorSUIGE: 'Boolean' };
const CHOICES = { Tipo_Documento: ['TIM', 'DNI', 'TARETA APARCAMIENTO', 'CONTROL DE ACCESO BAE', 'TEMD', 'TARJETA ACCESO ZAR', 'PMC', 'OTRA DOCUMENTACIÓN'], Modo: ['Pérdida', 'Sustración o Robo', 'Extravío'],
  Denuncia_Tramitada: ['SI', 'NO'], Testigos: ['Si', 'No'], Acciones: ['Tarjetas bloqueadas', 'Revisado el control de actividad', 'Auditado camaras de Seguridad'],
  SUIGES: ['JEFATURA DE IGE', 'SECOORCEN', 'SUIGESUR', 'SUIGEPIR', 'SUIGENOR', 'SUIGECAN', 'DIIN'], A_x00f1_o: ['2025', '2026', '2027'] };
const sur = { MANDO1N: '1', MANDO2N: '1', MANDO3N: '1', OData__x004d_N1: 'FUTER', OData__x004d_N2: 'SUIGESUR', OData__x004d_N3: 'ACUARTELAMIENTO X' };
const nor = { MANDO1N: '1', MANDO2N: '2', MANDO3N: '2', OData__x004d_N1: 'FUTER', OData__x004d_N2: 'SUIGENOR', OData__x004d_N3: 'BASE NORTE' };
const priv = { DNI: '12345678Z', Denunciante: 'PEREZ GOMEZ JUAN', UsuarioId: 70 };
let items, segCols, misGrupos = [], admin = false, correoDenegado = false;
const nuevoStore = () => {
  items = [
    { Id: 1, ESTADO: 'BORRADOR', ...sur, Tipo_Documento: ['TIM'], Modo: 'Pérdida', FechaDeLaPerdia: d(-2), Provincia: 'SEVILLA', Empleo: 'Sargento', Author: YO, ResponsableDeLaInformacion: YO, Denuncia_Tramitada: 'SI', Testigos: 'No', ...priv },
    { Id: 2, ESTADO: 'REMITIDO A M1', ...sur, Tipo_Documento: ['TIM', 'PMC'], Modo: 'Sustración o Robo', FechaDeLaPerdia: d(-10), FechaNotificacion: d(-9), Provincia: 'SEVILLA', Empleo: 'Cabo', Author: P[62], ResponsableDeLaInformacion: P[62], Denuncia_Tramitada: 'SI', NDenuncia: '45/26', Testigos: 'Si', NT08_22: true, ...priv },
    { Id: 3, ESTADO: 'EN SEGUIMIENTO', ...nor, Tipo_Documento: ['TEMD'], Modo: 'Extravío', FechaDeLaPerdia: d(-30), Provincia: 'LEÓN', Empleo: 'Soldado', Author: P[62], ResponsableDeLaInformacion: P[62], Denuncia_Tramitada: 'NO', Testigos: 'No', NT08_22: false, ValoradoPorSUIGE: true, ...priv },
    { Id: 4, ESTADO: 'EXP CERRADO', ...sur, Tipo_Documento: ['OTRA DOCUMENTACIÓN'], OTRO: 'Pasaporte', Modo: 'Pérdida', FechaDeLaPerdia: d(-90), Provincia: 'SEVILLA', Author: P[62], ResponsableDeLaInformacion: P[62], Denuncia_Tramitada: 'SI', NT08_22: true, Acciones: ['Tarjetas bloqueadas'], ...priv },
    { Id: 5, ESTADO: 'REMITIDO A M1', ...nor, Tipo_Documento: ['DNI'], Modo: 'Pérdida', FechaDeLaPerdia: d(-5), Provincia: 'LEÓN', Author: P[62], ResponsableDeLaInformacion: P[62], Denuncia_Tramitada: 'SI', NT08_22: true, ...priv },
    { Id: 6, ESTADO: 'ENVIADO', ...sur, Tipo_Documento: ['TIM'], Modo: 'Pérdida', FechaDeLaPerdia: d(-20), Provincia: 'SEVILLA', Author: P[62], ResponsableDeLaInformacion: P[62], Denuncia_Tramitada: 'SI', NT08_22: true, ...priv }
  ].map(x => ({ Title: '', Created: d(-3), Modified: d(-2), Editor: { Id: 62, Title: 'JEFE UNIDAD' }, Attachments: false, Comentario: 'Se le cayó la cartera en el comedor.', ObservacionesDelExpediente: '', ...x }));
};
async function prueba(verbose, esc) {
  nuevoStore();
  if (esc === 'sin acceso') items.forEach(x => { x.Author = P[62]; x.ResponsableDeLaInformacion = P[62]; });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } }); const p = await ctx.newPage();
  const errs = [], posts = [], getsLista = [], getsItem = [], correos = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) { if (/\.png$/.test(u)) return r.fulfill({ status: 404, body: '' }); return r.fulfill({ body: html, contentType: 'text/html' }); }
    if (verbose && req.method() === 'GET' && (req.headers().accept || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    const LISTA = "web/lists/getbytitle('PERDIDA DOCUMENTACION')";
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = JSON.parse(req.postData()).properties;
        if (correoDenegado) return r.fulfill({ status: 401, json: { error: { message: { value: 'Acceso denegado. No tiene el permiso necesario para realizar esta acción o tener acceso a este recurso.' } } } });
        correos.push({ to: pr.To.results, cc: pr.CC.results, asunto: pr.Subject, cuerpo: pr.Body }); return r.fulfill({ json: { d: {} } });
      }
      if (resto.startsWith('SP.UI.ApplicationPages')) {
        const q = JSON.parse(req.postData()).queryParams.QueryString.toUpperCase();
        return r.fulfill({ json: { d: { ClientPeoplePickerSearchUser: JSON.stringify(Object.values(P).filter(x => x.Title.includes(q)).map(x => ({ Key: 'i:0#.w|et\\u' + x.Id, DisplayText: x.Title, EntityType: 'User', EntityData: { Email: x.EMail } }))) } } });
      }
      if (resto === 'web/ensureuser') { const k = JSON.parse(req.postData()).logonName; const id = Number(k.replace(/\D/g, '')); return r.fulfill({ json: { d: P[id] ? { Id: id, Title: P[id].Title, Email: P[id].EMail } : { Id: 99 } } }); }
      if (resto.startsWith(LISTA + '/fields/createfieldasxml')) { const n = /Name="([^"]+)"/.exec(JSON.parse(req.postData()).parameters.SchemaXml)[1]; segCols.push(n); return r.fulfill({ json: { d: {} } }); }
      const ad = resto.match(/items\((\d+)\)\/AttachmentFiles\/add/);
      if (ad) { items.find(x => x.Id === +ad[1]).Attachments = true; return r.fulfill({ json: { d: {} } }); }
      const c = JSON.parse(req.postData() || '{}'); delete c.__metadata;
      for (const k of Object.keys(c)) if (k.endsWith('Id') && k !== 'Id' && typeof c[k] === 'number') c[k.slice(0, -2)] = P[c[k]] || { Id: c[k] };
      for (const k of Object.keys(c)) if (c[k] && Array.isArray(c[k].results)) c[k] = c[k].results;
      const mi = resto.match(/items\((\d+)\)/);
      if (mi) {
        const it = items.find(x => x.Id === +mi[1]);
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
        Object.assign(it, c, { Modified: new Date(Date.now() + posts.length * 1000).toISOString(), Editor: { Id: YO.Id, Title: YO.Title } });
        return r.fulfill({ status: 204, body: '' });
      }
      if (resto.endsWith(LISTA + '/items')) { const it = { Id: 20 + items.length, Created: new Date().toISOString(), Modified: new Date().toISOString(), Author: YO, Editor: YO, Attachments: false, ...c }; items.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } }); }
      if (resto.startsWith("web/lists/getbytitle('SOLICITUDES DE ACCESO')")) return r.fulfill({ status: 201, json: { d: { Id: 1 } } });
      return r.fulfill({ status: 400, body: '' });
    }
    if (resto.startsWith('web/currentuser/groups')) return J({ value: misGrupos.map(n => ({ Id: GRUPOS[n] || 1, Title: n })) });
    if (resto.startsWith('web/currentuser')) return J({ Id: YO.Id, Title: YO.Title, Email: YO.EMail, LoginName: 'i:0#.w|et\\usuario' });
    { const g = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users/); if (g) return MIEMBROS[g[1]] ? J({ value: MIEMBROS[g[1]].map((e, i) => ({ Id: 300 + i, Title: e, Email: e })) }) : r.fulfill({ status: 404, body: '' }); }
    if (resto.startsWith('web/siteusers')) return J({ value: Object.values(P).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail })) });
    if (resto.match(/web\/getuserbyid\((\d+)\)/)) return J({ LoginName: 'i:0#.w|et\\u' + resto.match(/getuserbyid\((\d+)\)/)[1] });
    if (resto.startsWith("web/lists/getbytitle('SOLICITUDES DE ACCESO')")) { if (resto.includes('/items')) return J({ value: [] }); if (resto.includes('/fields')) return J({ value: [] }); return J({ Id: 'a', Title: 'SOLICITUDES DE ACCESO', ListItemEntityTypeFullName: 'SP.Data.SOLItem', ReadSecurity: 2, WriteSecurity: 2 }); }
    if (resto.startsWith('SP.UserProfiles')) return J({ Title: 'COMANDANTE', UserProfileProperties: verbose ? { results: [] } : [] });
    { const aux = resto.match(/getbytitle\('(M1N|M2N|M3N|PROVINCIAS|empleos)'\)\/items/); if (aux) return J({ value: AUXL[aux[1]] }); }
    if (resto.startsWith(LISTA + '/fields')) {
      const hay = Object.keys(COLS).filter(k => !SEG.includes(k) || segCols.includes(k));
      if (resto.includes('Choices')) return J({ value: Object.keys(CHOICES).map(k => ({ InternalName: k, Choices: verbose ? { results: CHOICES[k] } : CHOICES[k], TypeAsString: COLS[k] })) });
      return J({ value: hay.map(k => ({ InternalName: k, EntityPropertyName: k.startsWith('_') ? 'OData_' + k : k, TypeAsString: COLS[k] })) });
    }
    const mi = resto.match(/items\((\d+)\)\?/);
    if (mi) {
      const sel = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(','); getsItem.push({ id: +mi[1], sel });
      const it = items.find(x => x.Id === +mi[1]); const o = { __metadata: { etag: '"' + it.Modified + '"' } };
      sel.forEach(k => { o[k] = it[k] === undefined ? null : it[k]; });
      return r.fulfill({ json: { d: o } });
    }
    if (resto.startsWith(LISTA + '/items')) {
      const sel = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',');
      getsLista.push(sel.join(','));
      const malo = sel.find(f => SEG.includes(f) && !segCols.includes(f));
      if (malo) return r.fulfill({ status: 400, json: { 'odata.error': { message: { value: "The field or property '" + malo + "' does not exist." } } } });
      const fl = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      const cumple = it => !fl || fl.split(' or ').some(c => {
        let m;
        if ((m = c.match(/(\w+)Id eq (\d+)/))) return it[m[1]] && it[m[1]].Id === +m[2];
        if ((m = c.match(/SUIGES eq '([^']+)'/))) return it.SUIGES === m[1];
        if ((m = c.match(/substringof\('([^']+)',(\w+)\)/))) return String(it[m[2]] || '').includes(m[1]);
        if ((m = c.match(/Id eq (\d+)/))) return it.Id === +m[1];
        return false;
      });
      const ls = items.filter(cumple).map(it => { const o = {}; Object.keys(it).forEach(k => { if (sel.includes(k) || sel.some(s => s.startsWith(k + '/'))) o[k] = it[k]; }); o.Id = it.Id; return o; });
      return J({ value: verbose ? ls.map(x => ({ ...x, Tipo_Documento: x.Tipo_Documento ? { results: x.Tipo_Documento } : x.Tipo_Documento, Acciones: x.Acciones ? { results: x.Acciones } : x.Acciones })) : ls });
    }
    if (resto.startsWith(LISTA)) return J({ Id: 'g', Title: 'PERDIDA DOCUMENTACION', ListItemEntityTypeFullName: 'SP.Data.PERDIDA_x0020_DOCUMENTACIONListItem',
      EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x2000BFF : 0x7) }, DefaultNewFormUrl: WEB + '/Lists/PERDIDA DOCUMENTACION/NewForm.aspx', DefaultEditFormUrl: WEB + '/Lists/PERDIDA DOCUMENTACION/EditForm.aspx', DefaultDisplayFormUrl: WEB + '/Lists/PERDIDA DOCUMENTACION/DispForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = (verbose ? '[verbose] ' : '[ligero] ') + esc;
  const abrirN = async n => { await p.evaluate(n => { const a = document.createElement('a'); a.className = 'inc'; a.dataset.id = String(n); document.body.append(a); a.click(); a.remove(); }, n); await p.waitForTimeout(700); };
  const ok = async () => { await p.waitForTimeout(150); const bk = await p.$('[data-accok], #fConfOk'); if (bk) await bk.click(); await p.waitForTimeout(1500); };
  const merge = id => { const m = posts.filter(x => new RegExp('items\\(' + id + '\\)$').test(x.ruta) && x.cab['x-http-method'] === 'MERGE' && !/AVISO POR CORREO/.test(x.cuerpo)).pop(); return m && JSON.parse(m.cuerpo); };
  const privEnLista = () => getsLista.some(s => /(^|,)(DNI|Denunciante|UsuarioId|Usuario\/)/.test(s));
  await p.goto(O + WEB + '/Documentos%20compartidos/perdidas.html'); await p.waitForTimeout(1000);
  const pest = await p.$$eval('#tabs a .tx', a => a.map(x => x.textContent).join(' | '));
  console.log(tag, '| pestañas:', pest, '| ve:', items.filter(() => true) && await p.evaluate(() => document.querySelectorAll('#vista .inc').length), '| cabecera:', await p.textContent('#estadoCarga'));
  if (esc === 'sin acceso') { console.log(tag, '| pantalla:', (await p.textContent('#vista')).replace(/\s+/g, ' ').slice(0, 160), '| errores:', errs); await b.close(); return; }
  if (esc === 'sin columnas') {
    console.log(tag, '| aviso:', (await p.textContent('#vista .aviso').catch(() => 'NINGUNO')).replace(/\s+/g, ' ').slice(0, 140));
    await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(300);
    await p.click('[data-segcols]'); await p.waitForTimeout(1500);
    console.log(tag, '| columnas creadas:', segCols.join(', '), '| ajustes:', (await p.textContent('#vista .card')).replace(/\s+/g, ' ').slice(0, 200), '| errores:', errs);
    await b.close(); return;
  }
  await p.click('#tabs a[data-v=consulta]'); await p.waitForTimeout(300);
  console.log(tag, '| ve en la consulta:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).sort().join(',')), '| datos personales pedidos en listados:', privEnLista());
  if (esc === 'unidad') {
    // Borrador propio: se completa y se remite
    await abrirN(1);
    console.log(tag, '| ficha 1 (mía): datos personales:', (await p.textContent('#detPriv')).replace(/\s+/g, ' ').slice(0, 120), '| paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
    await p.click('[data-editar="1"]'); await p.waitForTimeout(900);
    console.log(tag, '| formulario: NIF', await p.inputValue('#fParte [name=dni]'), '| nombre', await p.inputValue('#fParte [name=denunciante]'), '| gestor:', await p.textContent('#fGestor'), '| otros docs visible:', await p.isVisible('#cajaOtro'));
    await p.click('#fRemitir'); await ok();
    console.log(tag, '| remitir incompleto:', (await p.textContent('#fError')).slice(0, 200));
    await p.fill('#fParte [name=dni]', '12345678A'); await p.fill('#fParte [name=fden]', d(-1).slice(0, 10)); await p.selectOption('#fParte [name=modo]', 'Sustración o Robo');
    await p.check('#fParte [name=nt][value=true]'); await p.check('#fParte [name=docs][value="OTRA DOCUMENTACIÓN"]'); await p.check('#fParte [name=aceptacion]');
    console.log(tag, '| otros docs visible tras marcar:', await p.isVisible('#cajaOtro'));
    await p.click('#fRemitir'); await ok();
    console.log(tag, '| NIF mal:', (await p.textContent('#fError')).slice(0, 120));
    await p.fill('#fParte [name=dni]', '12345678Z'); await p.fill('#fParte [name=otro]', 'Pasaporte');
    posts.length = 0; correos.length = 0; await p.click('#fRemitir'); await p.waitForTimeout(200);
    console.log(tag, '| confirmación:', (await p.textContent('#fParte .confirma')).replace(/\s+/g, ' ').slice(0, 140)); await ok();
    const c = merge(1);
    console.log(tag, '| remitida:', JSON.stringify(c && { ESTADO: c.ESTADO, SUIGES: c.SUIGES, DNI: c.DNI, Denunciante: c.Denunciante, Tipo: c.Tipo_Documento, OTRO: c.OTRO, NT: c.NT08_22, Modo: c.Modo, Reg: (c.REGISTRODEACTIVIDAD || '').slice(0, 60), Hist: (c.ObservacionesDelExpediente || '').slice(-30) }));
    console.log(tag, '| correo:', correos.map(x => x.to.join() + ' cc ' + x.cc.join() + ' «' + x.asunto + '» sin datos personales: ' + !/12345678Z|PEREZ GOMEZ/.test(x.cuerpo)).join(' / '), '| ficha cerrada:', !(await p.evaluate(() => document.querySelector('#dlg').open)),
      '| resultado:', (await p.textContent('#vista .resultado').catch(() => '')).replace(/\s+/g, ' ').slice(0, 120));
    // Nueva notificación: borrador con lo mínimo y la persona elegida del directorio
    await p.click('#nuevo'); await p.waitForTimeout(900);
    await p.fill('#fUsuario input', 'PEREZ'); await p.waitForTimeout(800); await p.click('#fUsuario .sugs button'); await p.waitForTimeout(200);
    console.log(tag, '| nombre copiado del usuario:', await p.inputValue('#fParte [name=denunciante]'));
    await p.selectOption('#fParte [name=m1]', '1'); await p.selectOption('#fParte [name=m2]', '2'); await p.selectOption('#fParte [name=m3]', '2');
    console.log(tag, '| cadena:', await p.textContent('#fCadena'));
    await p.fill('#fParte [name=fecha]', d(-1).slice(0, 10)); posts.length = 0; await p.click('#fBorrador'); await p.waitForTimeout(1500);
    const alta = posts.find(x => x.ruta.endsWith("'PERDIDA DOCUMENTACION')/items")), ca = alta && JSON.parse(alta.cuerpo);
    console.log(tag, '| alta borrador:', JSON.stringify(ca && { ESTADO: ca.ESTADO, UsuarioId: ca.UsuarioId, Denunciante: ca.Denunciante, MN2: ca.OData__x004d_N2, Año: ca.A_x00f1_o, Hist: (ca.ObservacionesDelExpediente || '').slice(-40) }), '| ficha:', await p.textContent('#dlg h2').catch(() => ''));
    await p.click('#dlg [data-cerrar]').catch(() => {});
  }
  if (esc === 'suige') {
    await abrirN(2);
    console.log(tag, '| ficha 2 (de mi SUIGE): datos personales:', (await p.textContent('#detPriv')).replace(/\s+/g, ' ').slice(0, 120), '| paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
    await p.click('[data-acc=seguimiento]'); await p.waitForTimeout(200);
    console.log(tag, '| sin revisión:', await p.textContent('#accMsg'));
    await p.fill('#vSuige', 'Revisado: tarjetas anuladas.'); await p.check('#detAcc [name=vAcc][value="Tarjetas bloqueadas"]'); await p.fill('#vAccOtra', 'Aviso a la guardia');
    if (correoDenegado) correos.length = 0;
    posts.length = 0; await p.click('[data-acc=seguimiento]'); await ok();
    const c = merge(2);
    console.log(tag, '| seguimiento:', JSON.stringify(c && { ESTADO: c.ESTADO, VAL: c.VALORACIONSUIGES, Rev: c.ValoradoPorSUIGE, Acc: c.Acciones, Reg: (c.REGISTRODEACTIVIDAD || '').slice(0, 40) }),
      '| correo:', correos.map(x => x.to.join() + ' cc ' + x.cc.join() + ' «' + x.asunto + '»').join(' / ') || '(ninguno)', '| resultado:', (await p.textContent('#vista .resultado').catch(() => '')).replace(/\s+/g, ' ').slice(0, 200));
    if (!correoDenegado) {
      await abrirN(6);
      await p.fill('#vSuige', 'Falta el número de denuncia.'); posts.length = 0; correos.length = 0; await p.click('[data-acc=devolver]'); await ok();
      console.log(tag, '| devolver la 6 (ENVIADO antiguo):', JSON.stringify(merge(6) && { ESTADO: merge(6).ESTADO }), '| correo:', correos.map(x => x.to.join() + ' «' + x.asunto + '»').join(' / '));
    }
  }
  if (esc === 'ige') {
    await abrirN(3);
    console.log(tag, '| ficha 3: datos personales:', (await p.textContent('#detPriv')).replace(/\s+/g, ' ').slice(0, 100), '| paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
    await p.fill('#vCierre', 'Documentación anulada.'); posts.length = 0; correos.length = 0; await p.click('[data-acc=cerrar]'); await ok();
    console.log(tag, '| cerrar:', JSON.stringify(merge(3) && { ESTADO: merge(3).ESTADO, Hist: (merge(3).ObservacionesDelExpediente || '').slice(-40) }), '| correo:', correos.map(x => x.to.join() + ' cc ' + x.cc.join() + ' «' + x.asunto + '»').join(' / '));
    await abrirN(4); await p.click('[data-acc=reabrir]'); await p.waitForTimeout(200);
    console.log(tag, '| reabrir sin motivo:', await p.textContent('#accMsg'));
    await p.click('#dlg [data-cerrar]');
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(300);
    console.log(tag, '| pendientes:', (await p.$$eval('#vista .sec', s => s.map(x => x.textContent.replace(/(\d+)$/, ' = $1')))).join(' · '));
    await p.click('#tabs a[data-v=estadisticas]'); await p.waitForTimeout(300);
    console.log(tag, '| estadísticas:', await p.$$eval('#vista .estadis h3', h => h.map(x => x.textContent).join(' | ')));
    await p.click('#tabs a[data-v=informe]'); await p.waitForTimeout(300);
    console.log(tag, '| informe:', await p.$$eval('#vista .inf h3', h => h.map(x => x.textContent).join(' | ')), '| sin datos personales:', !/12345678Z|PEREZ GOMEZ/.test(await p.textContent('#vista')));
    await abrirN(2);
    const [imp] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-fichaimp]')]); await imp.waitForLoadState();
    console.log(tag, '| ficha impresa (IGE ve el NIF):', (await imp.content()).includes('12345678Z'), '|', await imp.title());
    if (!verbose) await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
    await imp.close(); await p.click('#dlg [data-cerrar]');
    await p.click('#tabs a[data-v=panel]'); await p.waitForTimeout(300);
    if (!verbose) await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: true });
  }
  console.log(tag, '| fichas: datos personales pedidos:', getsItem.filter(x => x.sel.includes('DNI')).map(x => x.id).join(',') || 'ninguna', '| en listados:', privEnLista(), '| errores:', errs);
  await b.close();
}
for (const v of [false, true]) {
  segCols = SEG.slice();
  misGrupos = ['INCIDENTES_UNIDADES']; admin = false; await prueba(v, 'unidad');
  misGrupos = ['SEGURIDAD_SUIGESUR']; await prueba(v, 'suige');
  misGrupos = ['SEGURIDAD_IGE']; await prueba(v, 'ige');
  misGrupos = []; await prueba(v, 'sin acceso');
}
segCols = SEG.slice(); misGrupos = ['SEGURIDAD_SUIGESUR']; correoDenegado = true; await prueba(false, 'suige'); correoDenegado = false;
segCols = []; misGrupos = ['SEGURIDAD_IGE']; admin = true; await prueba(false, 'sin columnas'); admin = false;
