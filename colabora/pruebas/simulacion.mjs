import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html0 = fs.readFileSync(new URL('../tareas-nlt-colabora.html', import.meta.url), 'utf8'); const html = html0;
const WEB = '/et/SUIGESUR/JSUIGE';
const ESTADOS = ['BORRADOR', 'REMITIDO AL NEGOCIADO', 'EN CURSO', 'EN ESPERA DE RESPUESTA', 'FINALIZADO'];
const PRIOS = ['Alta', 'Media', 'Baja', 'Urgente'];
const NEGS = ['Seguridad', 'Personal', 'Logística'];
const hoy = new Date(); const d = n => { const x = new Date(hoy); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x.toISOString(); };
const items = Array.from({ length: 706 }, (_, i) => {
  const est = ESTADOS[i % 4];
  return { Id: i + 1, Title: `Asunto ${i + 1}`, ESTADO: est, Prioridad: PRIOS[i % 4], FechaDeInicio: d(-30), FechaVencimiento: i % 9 === 0 ? null : d((i % 40) - 10),
    fECHAFINALIZACION: est === 'FINALIZADO' ? d(-(i % 20)) : null, NegociadoAsignado: NEGS[i % 3], NegociadosImplicados: [NEGS[(i + 1) % 3]],
    Descripcion: 'Resumen ' + i, DescripcionDelAsunto: `<div><p>Descripción <b>detallada</b> ${i}</p><p>Segunda línea</p></div>`, Comentarios: i % 5 ? '' : 'Obs <br>línea 2',
    ControlExpediente: `EXP-2026/${1000 + i}`, REGISTRODEACTIVIDAD: 'Registrado', NombreResponsable: '', NombreImplicados: '',
    Created: d(-(i % 60)), Modified: d(-(i % 15)),
    ResponsableDeLaInformacion: { Id: i % 6 === 0 ? 7 : 20 + (i % 5), Title: i % 6 === 0 ? 'USUARIO DE PRUEBA' : 'PERSONA ' + (i % 5), EMail: i % 6 === 0 ? 'usuario@et.mde.es' : 'persona' + (i % 5) + '@et.mde.es' },
    correoResponsable: i % 6 === 0 ? 'usuario@et.mde.es' : (i % 5 === 4 ? '' : 'persona' + (i % 5) + '@et.mde.es'), correoimplicados: i % 10 === 1 ? 'implicado@et.mde.es; usuario@et.mde.es' : '',
    PersonalImplicado0: i % 10 === 1 ? [{ Id: 7, Title: 'USUARIO DE PRUEBA' }] : [], Author: { Title: 'AUTOR' }, Editor: { Title: 'EDITOR' } };
});
let denegar = false, correoFalla = false, anexar = true, versiones = {};
async function prueba() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const posts = [];
  await p.route('https://colabora.mdef.es/**', async r => {
    const req = r.request();
    const u = decodeURIComponent(req.url());
    if (u.includes('/_vti_bin/Lists.asmx')) {
      const id = Number(req.postData().match(/<strlistItemID>(\d+)</)[1]);
      const vs = (versiones[id] || []).slice().reverse().map(v => `<Version Comentarios="${v.t.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}" Modified="${v.f}" Editor="7;#${v.a},#i:0#.w|et\\x,#x@et.mde.es" />`).join('');
      return r.fulfill({ contentType: 'text/xml', body: `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetVersionCollectionResponse xmlns="http://schemas.microsoft.com/sharepoint/soap/"><GetVersionCollectionResult><Versions>${vs}</Versions></GetVersionCollectionResult></GetVersionCollectionResponse></soap:Body></soap:Envelope>` });
    }
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    const [base, resto] = u.split('/_api/');
    if (base.replace('https://colabora.mdef.es', '') !== WEB) return r.fulfill({ status: 404, body: '' });
    const mItem = resto.match(/\/items\((\d+)\)/);
    if (mItem && req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      const it = items.find(x => x.Id === Number(mItem[1]));
      const c = JSON.parse(req.postData()); delete c.__metadata;
      if (req.headers()['if-match'] !== '*' && req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
      if (c.Comentarios !== undefined && anexar) { (versiones[it.Id] ||= []).push({ t: c.Comentarios, f: new Date().toISOString(), a: 'USUARIO DE PRUEBA' }); }
      Object.assign(it, c);
      if (c.ResponsableDeLaInformacionId !== undefined) it.ResponsableDeLaInformacion = c.ResponsableDeLaInformacionId ? { Id: c.ResponsableDeLaInformacionId, Title: c.NombreResponsable, EMail: c.correoResponsable } : null;
      if (c.PersonalImplicado0Id) it.PersonalImplicado0 = c.PersonalImplicado0Id.results.map(id => ({ Id: id, Title: id === 55 ? 'MARTIN GOMEZ JUAN' : id === 31 ? 'GARCIA LOPEZ ANA' : 'PEREZ RUIZ LUIS', EMail: id === 55 ? 'jmartin@et.mde.es' : id === 31 ? 'agarcia@et.mde.es' : 'lperez@et.mde.es' }));
      it.Modified = new Date(Date.now() + 1000).toISOString();
      return r.fulfill({ status: 204, body: '' });
    }
    if (mItem) {
      const it = items.find(x => x.Id === Number(mItem[1]));
      return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, Id: it.Id, Modified: it.Modified, Comentarios: it.Comentarios || '' } } });
    }
    if (resto.includes('getbyinternalnameortitle')) {
      const k = resto.match(/'(\w+)'\)/)[1];
      return r.fulfill({ json: { InternalName: k, AppendOnly: k === 'Comentarios' ? anexar : false, RichText: false } });
    }
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DIGEST-123', FormDigestTimeoutSeconds: 1800 } } } });
      if (resto.startsWith('SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface')) {
        const q = JSON.parse(req.postData()).queryParams.QueryString.toUpperCase();
        const dir = [{ Key: 'i:0#.w|et\\jmartin', DisplayText: 'MARTIN GOMEZ JUAN', EntityType: 'User', EntityData: { Email: 'jmartin@et.mde.es' } },
          { Key: 'i:0#.w|et\\agarcia', DisplayText: 'GARCIA LOPEZ ANA', EntityType: 'User', EntityData: { Email: 'agarcia@et.mde.es' } }].filter(x => x.DisplayText.includes(q));
        return r.fulfill({ json: { d: { ClientPeoplePickerSearchUser: JSON.stringify(dir) } } });
      }
      if (resto === 'web/ensureuser') { const k = JSON.parse(req.postData()).logonName; return r.fulfill({ json: { d: { Id: k.includes('jmartin') ? 55 : 31, Title: k.includes('jmartin') ? 'MARTIN GOMEZ JUAN' : 'GARCIA LOPEZ ANA', Email: k.includes('jmartin') ? 'jmartin@et.mde.es' : 'agarcia@et.mde.es' } } }); }
      if (resto === 'SP.Utilities.Utility.SendEmail') {
        if (correoFalla) return r.fulfill({ status: 500, json: { error: { message: { value: 'The e-mail message cannot be sent. Make sure the outgoing e-mail settings for the server are configured correctly.' } } } });
        return r.fulfill({ json: { d: { SendEmail: null } } });
      }
      if (resto.endsWith('/items')) {
        if (denegar) return r.fulfill({ status: 403, json: { error: { message: { value: 'Access denied' } } } });
        const c = JSON.parse(req.postData());
        const id = items.length + 1;
        items.push({ Id: id, Title: c.Title, ESTADO: c.ESTADO, Prioridad: c.Prioridad || '', FechaVencimiento: c.FechaVencimiento, FechaDeInicio: c.FechaDeInicio, NegociadoAsignado: c.NegociadoAsignado || '',
          NegociadosImplicados: c.NegociadosImplicados ? c.NegociadosImplicados.results : [], Created: new Date().toISOString(), Modified: new Date().toISOString(),
          ResponsableDeLaInformacion: { Id: c.ResponsableDeLaInformacionId, Title: c.NombreResponsable, EMail: c.correoResponsable }, correoResponsable: c.correoResponsable, correoimplicados: c.correoimplicados, PersonalImplicado0: (c.PersonalImplicado0Id ? c.PersonalImplicado0Id.results : []).map(id => ({ Id: id, Title: 'GARCIA LOPEZ ANA', EMail: 'agarcia@et.mde.es' })), Author: { Title: 'USUARIO DE PRUEBA' }, Editor: { Title: 'USUARIO DE PRUEBA' },
          DescripcionDelAsunto: c.DescripcionDelAsunto, ControlExpediente: c.ControlExpediente });
        return r.fulfill({ status: 201, json: { d: { Id: id, Title: c.Title } } });
      }
      return r.fulfill({ status: 400, body: '' });
    }
    if (resto.startsWith('web?')) return r.fulfill({ json: { Url: 'https://colabora.mdef.es' + WEB, Title: 'JSUIGE' } });
    if (resto.startsWith('web/currentuser')) return r.fulfill({ json: { Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' } });
    if (resto.startsWith('web/siteusers')) return r.fulfill({ json: { value: [{ Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' }, { Id: 31, Title: 'GARCIA LOPEZ ANA', Email: 'agarcia@et.mde.es' }, { Id: 32, Title: 'PEREZ RUIZ LUIS', Email: 'lperez@et.mde.es' }] } });
    if (resto.includes("/fields")) return r.fulfill({ json: { value: [{ InternalName: 'ESTADO', Choices: ESTADOS }, { InternalName: 'Prioridad', Choices: PRIOS }, { InternalName: 'NegociadoAsignado', Choices: NEGS },
      { InternalName: 'NegociadosImplicados', Choices: NEGS }, { InternalName: 'DescripcionDelAsunto', RichText: true }, { InternalName: 'Comentarios', RichText: false }, { InternalName: 'FechaVencimiento', Required: false }] } });
    if (resto.includes("/items")) {
      const skip = Number((u.match(/skip=(\d+)/) || [0, 0])[1]);
      const next = skip + 500 < items.length ? `https://colabora.mdef.es${WEB}/_api/web/lists/getbytitle('Gestor de Tareas')/items?skip=${skip + 500}` : undefined;
      return r.fulfill({ json: { value: items.slice(skip, skip + 500), 'odata.nextLink': next } });
    }
    if (resto.startsWith("web/lists/getbytitle('Gestor de Tareas')?")) return r.fulfill({ json: { Id: 'g', Title: 'Gestor de Tareas', ItemCount: items.length, ListItemEntityTypeFullName: 'SP.Data.Gestor_x0020_de_x0020_TareasListItem', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Gestor de Tareas' } } });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.goto('https://colabora.mdef.es' + WEB + '/seguridad/Documentos%20compartidos/tareas-nlt-colabora.html'); await p.waitForTimeout(1500);
  // alta rápida con fecha en el texto
  await p.fill('#altaRapida', 'Preparar informe de visita antes del viernes urgente');
  await p.press('#altaRapida', 'Enter'); await p.waitForTimeout(500);
  console.log('form asunto:', await p.inputValue('#fNuevo [name=Title]'), '| NLT:', await p.inputValue('#fNuevo [name=nlt]'), '| estado:', await p.inputValue('#fNuevo [name=ESTADO]'), '| prioridad:', await p.inputValue('#fNuevo [name=Prioridad]'), '| resp:', await p.inputValue('#fNuevo [name=resp]'));
  await p.selectOption('#fNuevo [name=NegociadoAsignado]', 'Seguridad');
  await p.fill('#nImplTxt', 'GARCIA LOPEZ ANA'); await p.press('#nImplTxt', 'Enter');
  await p.type('#nImplTxt', 'perez'); await p.waitForTimeout(700);
  console.log('sugerencias perez:', await p.textContent('#nImplSug'));
  await p.click('#nImplSug [data-sug="0"]'); await p.waitForTimeout(300);
  await p.type('#nImplTxt', 'martin'); await p.waitForTimeout(700);
  console.log('sugerencias martin:', await p.textContent('#nImplSug'));
  await p.locator('#nImplSug').scrollIntoViewIfNeeded(); await p.screenshot({ path: new URL('sugs.png', import.meta.url).pathname });
  await p.click('#nImplSug [data-sug="0"]'); await p.waitForTimeout(400);
  console.log('chips:', await p.textContent('#nImpl'));
  await p.fill('#nImplTxt', 'NADIE INVENTADO'); await p.click('#nImplAdd');
  console.log('error implicado inexistente:', await p.textContent('#nError'));
  await p.check('#fNuevo [name=negImpl][value=Personal]');
  await p.fill('#fNuevo [name=ControlExpediente]', 'EXP-2026/9999');
  await p.fill('#fNuevo [name=DescripcionDelAsunto]', 'Línea 1\nLínea <2>');
  await p.click('#nCrear'); await p.waitForTimeout(1500);
  const alta = posts.find(x => x.ruta.endsWith('/items'));
  console.log('cabeceras:', alta.cab['x-requestdigest'], alta.cab['content-type']);
  console.log('cuerpo:', alta.cuerpo);
  console.log('abierto tras crear:', await p.evaluate(() => document.querySelector('#dlg').open), '|', (await p.textContent('#dlg h2')));
  console.log('cabecera:', await p.textContent('#estadoCarga'));
  const mail = posts.find(x => x.ruta === 'SP.Utilities.Utility.SendEmail');
  console.log('correo:', mail && mail.cab['x-requestdigest'], mail && mail.cuerpo.slice(0, 400));
  console.log('caja correo:', await p.textContent('#correoAsig'));
  await p.screenshot({ path: new URL('asig-ok.png', import.meta.url).pathname });
  correoFalla = true;
  await p.click('#dlg [data-cerrar]'); await p.click('[data-abrir="707"]').catch(()=>{}); await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(300);
  await p.click('[data-asignar]'); await p.waitForTimeout(600);
  console.log('caja tras fallo:', await p.textContent('#correoAsig'));
  console.log('mailto:', (await p.getAttribute('#correoAsig a', 'href')).slice(0, 200));
  await p.screenshot({ path: new URL('asig-fallo.png', import.meta.url).pathname });
  correoFalla = false;
  // ---- Modificar ----
  await p.click('#dlg [data-cerrar]');
  await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(300);
  await p.click('[data-modificar]'); await p.waitForTimeout(300);
  console.log('form mod: asunto', await p.inputValue('#fNuevo [name=Title]'), '| nlt', await p.inputValue('#fNuevo [name=nlt]'), '| resp', await p.inputValue('#fNuevo [name=resp]'), '| impl', await p.textContent('#nImpl'), '| obs visible', await p.$('#fNuevo [name=Comentarios]') !== null);
  await p.selectOption('#fNuevo [name=ESTADO]', 'EN CURSO');
  await p.fill('#fNuevo [name=nlt]', '2026-10-20');
  await p.click('#nImpl [data-quitarimpl="0"]');
  posts.length = 0;
  await p.click('#nCrear'); await p.waitForTimeout(1500);
  const merge = posts.find(x => /items\(707\)/.test(x.ruta));
  console.log('MERGE:', merge && merge.cab['x-http-method'], merge && merge.cab['if-match'], merge && merge.cuerpo);
  console.log('tras guardar:', await p.textContent('#dlg h2'), '| estado en ficha:', (await p.textContent('#dlg .db')).includes('EN CURSO'), '| cabecera', await p.textContent('#estadoCarga'));
  // conflicto: otro cambia el asunto mientras
  await p.click('[data-modificar]'); await p.waitForTimeout(300);
  items.find(x => x.Id === 707).Modified = new Date(Date.now() + 99999).toISOString();
  await p.fill('#fNuevo [name=Title]', 'Cambio que choca'); await p.click('#nCrear'); await p.waitForTimeout(800);
  console.log('conflicto:', await p.textContent('#nError'));
  await p.click('#dlg [data-cerrar]'); await p.click('#recargar'); await p.waitForTimeout(1500);
  // ---- Comentarios (columna con historial) ----
  await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(500);
  await p.fill('#comTxt', 'Primer comentario <b>'); await p.click('[data-comentar]'); await p.waitForTimeout(1500);
  await p.fill('#comTxt', 'Segundo comentario'); await p.click('[data-comentar]'); await p.waitForTimeout(1500);
  console.log('comentarios (historial):', await p.textContent('#comLista'));
  const cm = posts.filter(x => /items\(707\)/.test(x.ruta)).slice(-1)[0];
  console.log('cuerpo comentario:', cm.cuerpo);
  await p.screenshot({ path: new URL('comentarios.png', import.meta.url).pathname, fullPage: false });
  await p.locator('#comLista').scrollIntoViewIfNeeded(); await p.screenshot({ path: new URL('comentarios.png', import.meta.url).pathname });
  // ---- Comentarios (columna normal) ----
  anexar = false;
  await p.click('#dlg [data-cerrar]'); await p.click('#recargar'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(500);
  await p.fill('#comTxt', 'Tercero'); await p.click('[data-comentar]'); await p.waitForTimeout(1500);
  console.log('comentarios (normal):', JSON.stringify(await p.textContent('#comLista')));
  await p.click('#dlg [data-cerrar]');
  anexar = true;
  // sin permiso
  denegar = true;
  await p.click('#nuevo'); await p.waitForTimeout(300);
  console.log('casilla marcada por defecto:', await p.isChecked('#nCorreo'));
  await p.fill('#fNuevo [name=Title]', 'Sin permiso'); await p.click('#nCrear'); await p.waitForTimeout(800);
  console.log('sin permiso:', await p.textContent('#nError'), '| sigue abierto:', await p.evaluate(() => document.querySelector('#dlg').open));
  console.log('métodos POST:', posts.map(x => x.ruta));
  console.log('errores:', errs);
  await b.close();
}
await prueba();
