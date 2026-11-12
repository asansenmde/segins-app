import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
// TAREAS_HTML=colabora/colabora/tareas-nlt-colabora.html para probar la versión protegida; VERBOSE=1 para SharePoint 2013 (odata=verbose)
const html0 = fs.readFileSync(process.env.TAREAS_HTML ? process.env.TAREAS_HTML : new URL('../tareas-nlt-colabora.html', import.meta.url), 'utf8'); const html = html0;
const CLAVE = /mensadef|META\.html/.test(process.env.TAREAS_HTML || '') ? 'tareas-nlt-colabora-mensadef' : /pruebas/.test(process.env.TAREAS_HTML || '') ? 'tareas-nlt-colabora-pruebas' : 'tareas-nlt-colabora';
let admin = false;   // Control total en la lista (solo entonces sale Ajustes)
const VERBOSE = !!process.env.VERBOSE, CAPTURAS = process.env.CAPTURAS || '';
const aVerbose = j => j && !j.d && !j.error ? (Array.isArray(j.value) ? { d: { results: j.value, __next: j['odata.nextLink'] } } : { d: j }) : j;
const WEB = '/et/SUIGESUR/JSUIGE';
const ESTADOS = ['BORRADOR', 'REMITIDO AL NEGOCIADO', 'EN CURSO', 'EN ESPERA DE RESPUESTA', 'FINALIZADO'];
const PRIOS = ['Alta', 'Media', 'Baja', 'Urgente'];
const NEGS = ['Seguridad', 'Personal', 'Logística'];
const hoy = new Date(); const d = n => { const x = new Date(hoy); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x.toISOString(); };
const items = Array.from({ length: 706 }, (_, i) => {
  // MUCHAS=1: la mitad terminados (más de 200), para probar «Mostrar más» y «Terminados desde / hasta»
  const est = (process.env.MUCHAS ? i % 2 === 1 : i % 13 === 5) ? 'FINALIZADO' : ESTADOS[i % 4];
  return { Id: i + 1, Title: `Asunto ${i + 1}`, ESTADO: est, Prioridad: PRIOS[i % 4], FechaDeInicio: d(-30), FechaVencimiento: i % 9 === 0 ? null : d((i % 40) - 10),
    fECHAFINALIZACION: est === 'FINALIZADO' ? d(-(i % 20)) : null, NegociadoAsignado: NEGS[i % 3], NegociadosImplicados: [NEGS[(i + 1) % 3]],
    Descripcion: 'Resumen ' + i, DescripcionDelAsunto: `<div><p>Descripción <b>detallada</b> ${i}</p><p>Segunda línea</p></div>`, Comentarios: i % 5 ? '' : 'Obs <br>línea 2',
    ControlExpediente: `EXP-2026/${1000 + i}`, REGISTRODEACTIVIDAD: 'Registrado', NombreResponsable: '', NombreImplicados: '',
    Created: d(-(i % 60)), Modified: d(-(i % 15)),
    ResponsableDeLaInformacion: { Id: i % 6 === 0 ? 7 : 20 + (i % 5), Title: i % 6 === 0 ? 'USUARIO DE PRUEBA' : 'PERSONA ' + (i % 5), EMail: i % 6 === 0 ? 'usuario@et.mde.es' : 'persona' + (i % 5) + '@et.mde.es' },
    correoResponsable: i % 6 === 0 ? 'usuario@et.mde.es' : (i % 5 === 4 ? '' : 'persona' + (i % 5) + '@et.mde.es'), correoimplicados: i % 10 === 1 ? 'implicado@et.mde.es; usuario@et.mde.es' : '',
    PersonalImplicado0: i % 10 === 1 ? [{ Id: 7, Title: 'USUARIO DE PRUEBA' }] : [], Author: { Title: 'AUTOR' }, Editor: { Title: 'EDITOR' } };
});
// Datos incoherentes heredados: fecha de fin con estado abierto (Id 3) y terminado sin fecha (Id 19)
items[2].fECHAFINALIZACION = d(-3); items[18].fECHAFINALIZACION = null;
// Colabora que rechaza direcciones («destinatario válido»): buzonMal = direcciones rechazadas; enviados = las que acepta
let buzonMal = [], enviados = [];
let conTratar = false, papelera = [];   // asuntos «eliminados» (se restauran tras comprobarlo)   // columna «TratarEn» (se crea desde Ajustes)
let denegar = false, correoFalla = false, anexar = true, versiones = {};
async function prueba() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const posts = [];
  await p.route('https://colabora.mdef.es/**', async r0 => {
    const req = r0.request();
    const r = { request: () => req, fulfill: o => r0.fulfill(VERBOSE && o.json ? { ...o, json: aVerbose(o.json) } : o) };
    if (VERBOSE && req.method() === 'GET' && /odata=nometadata/.test(req.headers().accept || '')) return r0.fulfill({ status: 406, body: '' });
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
    if (mItem && req.method() === 'POST' && resto.endsWith('/recycle()')) { posts.push({ ruta: resto, cab: req.headers(), cuerpo: '' }); const i = items.findIndex(x => x.Id === Number(mItem[1])); if (i >= 0) papelera.push([i, items.splice(i, 1)[0]]); return r.fulfill({ json: { d: { Recycle: '00000000-0000-0000-0000-000000000001' } } }); }
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
      if (resto.includes('/fields/createfieldasxml')) { if (/TratarEn/.test(req.postData())) conTratar = true; return r.fulfill({ json: { d: {} } }); }
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
        const pr = JSON.parse(req.postData()).properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
        if (dest.some(x => buzonMal.includes(String(x).toLowerCase()))) return r.fulfill({ status: 400, json: { error: { message: { value: 'No se puede enviar el mensaje de correo electrónico. Asegúrese de que tenga un destinatario válido.' } } } });
        enviados.push(...dest);
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
    if (resto.startsWith('web/siteusers')) return r.fulfill({ json: { value: [{ Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' }, { Id: 31, Title: 'GARCIA LOPEZ ANA', Email: 'agarcia@et.mde.es' }, { Id: 32, Title: 'PEREZ RUIZ LUIS', Email: 'lperez@et.mde.es' }, { Id: 41, Title: 'Garcia Lopez, Ana', Email: 'agarcia2@et.mde.es' }] } });
    if (resto.includes("/fields")) return r.fulfill({ json: { value: [{ InternalName: 'ESTADO', Choices: ESTADOS }, { InternalName: 'Prioridad', Choices: PRIOS }, { InternalName: 'NegociadoAsignado', Choices: NEGS, FillInChoice: !process.env.SINCELULAS },
      { InternalName: 'NegociadosImplicados', Choices: NEGS, FillInChoice: !process.env.SINCELULAS }, { InternalName: 'DescripcionDelAsunto', RichText: true }, { InternalName: 'Comentarios', RichText: false }, { InternalName: 'FechaVencimiento', Required: false }].concat(conTratar ? [{ InternalName: 'TratarEn', Choices: ['PUNTO DE SITUACIÓN', 'TRATAR CON EL GENERAL'], TypeAsString: 'MultiChoice' }] : []) } });
    if (resto.includes("/items")) {
      const skip = Number((u.match(/skip=(\d+)/) || [0, 0])[1]);
      const next = skip + 500 < items.length ? `https://colabora.mdef.es${WEB}/_api/web/lists/getbytitle('Gestor de Tareas')/items?skip=${skip + 500}` : undefined;
      return r.fulfill({ json: { value: items.slice(skip, skip + 500), 'odata.nextLink': next } });
    }
    if (/^web\/lists\/getbytitle\('Gestor de Tareas[^']*'\)\?/.test(resto)) return r.fulfill({ json: { Id: 'g', Title: resto.match(/getbytitle\('([^']*)'/)[1], ItemCount: items.length, EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x7FFFFFFF : 0x1F) }, ListItemEntityTypeFullName: 'SP.Data.Gestor_x0020_de_x0020_TareasListItem', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Gestor de Tareas' } } });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.goto('https://colabora.mdef.es' + WEB + '/seguridad/Documentos%20compartidos/tareas-nlt-colabora.html'); await p.waitForTimeout(1500);
  // Panel: cabecera, resumen, grupos plegables, filtros y vista en tabla
  console.log('hero:', (await p.textContent('.hero')).replace(/\s+/g, ' '));
  console.log('resumen:', (await p.$$eval('.mini button', bs => bs.map(b => b.innerText.replace(/\s+/g, ' ')))).join(' | '));
  console.log('grupos:', (await p.$$eval('details.grupo', ds => ds.map(d => d.dataset.grupo + (d.open ? '(abierto)' : '') + ':' + d.querySelector('.n').textContent))).join(' '));
  console.log('pie:', await p.textContent('.fpie'), '| autor:', await p.textContent('footer.autor'));
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/movil-tarjetas.png', fullPage: false });
  await p.click('details[data-grupo=semana] > summary');
  console.log('semana abierta y recordada:', await p.evaluate(K => JSON.parse(localStorage.getItem(K)).grupos.semana, CLAVE));
  await p.click('[data-kpi=vencidas]');
  console.log('solo vencidas:', (await p.$$eval('details.grupo', ds => ds.map(d => d.dataset.grupo + (d.open ? '(abierto)' : '')))).join(' '));
  await p.click('.fpie [data-kpi]');
  await p.selectOption('#fquien', 'todos');
  await p.click('[data-kpi=hechasMes]');
  console.log('terminados este mes:', await p.textContent('details.grupo .n'));
  await p.click('[data-kpi=hechasMes]');
  await p.selectOption('#fresp', 'PERSONA 1');
  console.log('filtro responsable:', await p.textContent('.fpie'), '| responsables distintos:', await p.$$eval('details.grupo .tarea', ts => new Set(ts.map(t => (t.innerText.match(/👤 (.+)/) || [])[1])).size));
  await p.click('[data-limpiar]');
  console.log('tras limpiar:', await p.inputValue('#fresp') === '', '| quien sigue en', await p.inputValue('#fquien'));
  // Terminados: todos, de 200 en 200, y por fechas
  { const nTer = () => p.$$eval('details[data-grupo=hechas] .tarea', x => x.length);
    console.log('terminados en pantalla:', await nTer(), '| botón más:', (await p.textContent('[data-mashechas]').catch(() => 'no hay')).trim());
    if (await p.$('[data-mashechas]')) { await p.click('[data-mashechas]'); console.log('tras «mostrar más»:', await nTer()); }
    const f = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
    await p.fill('#fterd', f(5)); await p.dispatchEvent('#fterd', 'change'); await p.fill('#fterh', f(2)); await p.dispatchEvent('#fterh', 'change'); await p.waitForTimeout(200);
    console.log('terminados del', f(5), 'al', f(2) + ':', await nTer(), '|', (await p.textContent('details[data-grupo=hechas] summary')).replace(/\s+/g, ' '), '| fuera de rango:',
      await p.$$eval('details[data-grupo=hechas] .tarea', x => x.length) && 'ver arriba');
    // Ajustes solo con Control total
    { const ajVisible = () => p.$eval('#tabs a[data-v="ajustes"]', a => getComputedStyle(a).display !== 'none');
      console.log('Ajustes sin Control total: pestaña visible:', await ajVisible());
      await p.evaluate(() => document.querySelector('#tabs a[data-v="ajustes"]').click()); await p.waitForTimeout(300);
      console.log('  forzar el clic: pestaña activa:', await p.$eval('#tabs a.on', a => a.dataset.v));
      admin = true; await p.click('#recargar'); await p.waitForTimeout(2500);
      console.log('Ajustes con Control total: pestaña visible:', await ajVisible()); }
    // Marcas «para tratar»: crear la columna en Ajustes, marcar en la ficha, recuadro e impresión
    await p.click('#tabs [data-v=ajustes]'); await p.waitForTimeout(200);
    console.log('ajustes, columna:', (await p.textContent('p:has([data-creartratar])').catch(() => 'sin botón')).slice(0, 60));
    await p.click('[data-creartratar]'); await p.waitForTimeout(1500);
    console.log('tras crear:', (await p.$$eval('p.small', n => (n.find(x => /Tratar en/.test(x.textContent)) || { textContent: '-' }).textContent)).slice(0, 60));
    await p.click('#tabs [data-v=nlt]'); await p.waitForTimeout(300);
    await p.click('details.grupo .tarea >> nth=0'); await p.waitForTimeout(300); const idT = await p.$eval('[data-tratar=gen]', b => b.dataset.id);
    await p.click('[data-tratar=gen]'); await p.waitForTimeout(1500);
    const itT = items.find(x => x.Id === Number(idT));
    console.log('marcado nº', idT, ':', JSON.stringify(itT.TratarEn && itT.TratarEn.results), '| botón:', (await p.textContent('[data-tratar=gen]')).trim());
    await p.click('[data-tratar=ps]'); await p.waitForTimeout(1500); await p.click('#dlg [data-cerrar]');
    console.log('recuadros:', (await p.$$eval('[data-kpi^="tr:"]', b => b.map(x => x.innerText.replace(/\s+/g, ' ')))).join(' | '));
    await p.click('[data-kpi="tr:gen"]'); await p.waitForTimeout(200);
    console.log('lista para el General:', await p.$$eval('details[data-grupo=tratar] .tarea', x => x.length), '| chip en tarjeta:', await p.$$eval('details[data-grupo=tratar] .badge.tr-gen', x => x.length));
    const [imp] = await Promise.all([p.context().waitForEvent('page'), p.click('[data-imptratar]')]); await imp.waitForLoadState();
    console.log('impresión:', (await imp.textContent('h2')).trim(), '|', await imp.$$eval('table tr', x => x.length - 1), 'filas'); await imp.close();
    await p.click('[data-kpi="tr:gen"]');
    // Estado desde la ficha: finalizar, reabrir, cambiar a cualquiera y eliminar (a la papelera)
    { const est = id => { const x = items.find(y => y.Id === id); return x ? x.ESTADO + (x.fECHAFINALIZACION ? ' (fin ' + String(x.fECHAFINALIZACION).slice(0, 10) + ')' : ' (sin fin)') : 'ELIMINADO'; };
      await p.click('details.grupo .tarea >> nth=0'); await p.waitForTimeout(300);
      // META (12/11/2026): el estado se elige en los pasos de arriba de la ficha; Gestor común: Finalizar / Reabrir / Cambiar estado
      const enMeta = !!(await p.$('[data-fase]'));
      let id, e1, e2, e3;
      if (enMeta) {
        id = Number(await p.$eval('[data-fase]', b => b.dataset.id));
        const botones = (await p.$$eval('#dlg .ficha-datos .acciones .btn', n => n.map(x => x.textContent.trim()))).join(' | ');
        const sinViejo = !(await p.$('#selEstado')) && !(await p.$('[data-finalizar]')) && !(await p.$('#dlg a[href*="DispForm.aspx"]'));
        const nombres = (await p.textContent('#dlg .tratar')).replace(/\s+/g, ' ');
        const correoNueva = await p.$$eval('#dlg a[href^="mailto:"]', n => n.every(x => x.target === '_blank'));
        console.log('META ficha | pasos:', (await p.$$eval('[data-fase]', n => n.map(x => x.textContent.trim()))).join(' › '), '| botones:', botones, '| sin Finalizar/Cambiar estado/Ver en Colabora:', sinViejo,
          '| marcas:', /Reunión de entradas/.test(nombres) && /Punto Situación semanal/.test(nombres) && !/Tratar con el General/.test(nombres), '| correo en ventana nueva:', correoNueva);
        if (!sinViejo || !/Modificar/.test(botones) || !/Eliminar/.test(botones) || /Ver en Colabora/.test(botones)) console.log('HAY FALLOS: ficha de META');
        await p.click('[data-fase="hecha"]'); await p.waitForTimeout(1500); e1 = est(id);
        await p.click('[data-fase="curso"]'); await p.waitForTimeout(1500); e2 = est(id);
        await p.click('[data-fase="espera"]'); await p.waitForTimeout(1500); e3 = est(id);
        if (!/\(fin /.test(e1) || /\(fin /.test(e2) || !/ESPERA/.test(e3)) console.log('HAY FALLOS: estados desde los pasos', e1, e2, e3);
      } else {
        id = Number(await p.$eval('[data-finalizar]', b => b.dataset.finalizar));
        await p.click('[data-finalizar]'); await p.waitForTimeout(1500); e1 = est(id);
        await p.click('[data-reabrir]'); await p.waitForTimeout(1500); e2 = est(id);
        await p.selectOption('#selEstado', 'EN ESPERA DE RESPUESTA'); await p.click('[data-cambiarestado]'); await p.waitForTimeout(1500); e3 = est(id);
      }
      await p.click('[data-eliminar]'); const txt = (await p.textContent('[data-eliminar]')).trim(); await p.click('[data-eliminar]'); await p.waitForTimeout(1500);
      const elim = est(id); papelera.forEach(([i, x]) => items.splice(i, 0, x)); papelera = []; await p.click('#recargar'); await p.waitForTimeout(1200);
      console.log('estados nº', id, ':', e1, '→ reabrir:', e2, '→ cambiar:', e3, '| eliminar pide confirmar:', txt, '→', elim, '| ficha cerrada:', !(await p.evaluate(() => document.querySelector('#dlg').open)));
      // Finalizar desde la pantalla principal (dos clics)
      const b0 = p.locator('[data-finrapido]').first(); const id2 = Number(await b0.getAttribute('data-finrapido'));
      await b0.click(); const t1 = (await b0.textContent()).trim(); await b0.click(); await p.waitForTimeout(1500);
      console.log('finalizar rápido nº', id2, ':', t1, '→', est(id2), '| ficha abierta:', await p.evaluate(() => document.querySelector('#dlg').open)); }
    await p.click('[data-limpiar]'); console.log('tras limpiar, fechas vacías:', !(await p.inputValue('#fterd')) && !(await p.inputValue('#fterh'))); }
  await p.click('[data-modo=tabla]');
  console.log('tabla filas:', await p.$$eval('table.tt tr.tarea', x => x.length));
  await p.setViewportSize({ width: 1280, height: 900 });
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/escritorio-tabla.png', fullPage: false });
  await p.click('table.tt tr.tarea'); await p.waitForTimeout(200);
  console.log('ficha desde tabla:', await p.evaluate(() => document.querySelector('#dlg').open));
  await p.click('#dlg [data-cerrar]'); await p.click('[data-modo=tarjetas]');
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/escritorio-tarjetas.png', fullPage: false });
  // Recorrido de estados, ficha, calendario y estadísticas
  console.log('recorrido:', (await p.$$eval('.flujo .fp', bs => bs.map(b => b.innerText.replace(/\s+/g, ' ')))).join(' | '));
  await p.click('.flujo [data-kpi="c:espera"]');
  console.log('solo en espera:', (await p.$$eval('details.grupo', ds => ds.map(d => d.dataset.grupo + ':' + d.querySelector('.n').textContent))).join(' '),
    '| todas en espera:', await p.$$eval('details.grupo .tarea .badge[class*=st-]', bs => bs.every(b => b.classList.contains('st-espera'))));
  await p.click('details.grupo .tarea'); await p.waitForTimeout(200);
  console.log('fase en ficha:', await p.textContent('#dlg .pasos .on'));
  await p.click('#dlg [data-cerrar]'); await p.click('.flujo [data-kpi="c:espera"]');
  if (CAPTURAS) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: CAPTURAS + '/escritorio-panel.png' }); }
  await p.click('#tabs [data-v=calendario]');
  console.log('calendario: días con vencidos', await p.$$eval('.dia .pt', x => x.length), '| colores', JSON.stringify(await p.$$eval('.dia i', is => is.reduce((a, i) => (a[i.className || 'resto'] = (a[i.className || 'resto'] || 0) + 1, a), {}))));
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/calendario.png', fullPage: true });
  await p.click('[data-mes="1"]'); await p.click('[data-mes="0"]');
  console.log('vuelve a hoy:', await p.$$eval('.dia.hoy', x => x.length));
  await p.click('#tabs [data-v=estadisticas]');
  console.log('kpis:', (await p.$$eval('#estDoc .kpi', ks => ks.map(k => k.innerText.replace(/\s+/g, ' ')))).join(' | '));
  console.log('meses:', await p.$$eval('.columnas .mes', x => x.length), '| bloques:', (await p.$$eval('#estDoc .est h3', x => x.map(e => e.textContent))).join(', '),
    '| negociados:', (await p.$$eval('#estDoc .est', es => es[1].innerText.replace(/\s+/g, ' ').slice(0, 300))));
  await p.click('[data-estper=mes]');
  console.log('este mes:', (await p.$$eval('#estDoc .kpi', ks => ks.slice(2, 5).map(k => k.innerText.replace(/\s+/g, ' ')))).join(' | '), '| meses', await p.$$eval('.columnas .mes', x => x.length));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-est=csv]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  console.log('csv:', dl.suggestedFilename(), csv.split('\r\n').length, 'líneas;', csv.split('\r\n').slice(0, 3).join(' / '));
  await p.click('[data-estper="12m"]');
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/estadisticas.png', fullPage: true });
  await p.setViewportSize({ width: 420, height: 900 });
  if (CAPTURAS) await p.screenshot({ path: CAPTURAS + '/movil-estadisticas.png', fullPage: false });
  await p.click('#tabs [data-v=nlt]');
  await p.selectOption('#fquien', 'mias');
  // alta rápida con fecha en el texto
  await p.fill('#altaRapida', 'Preparar informe de visita antes del viernes urgente');
  await p.press('#altaRapida', 'Enter'); await p.waitForTimeout(500);
  console.log('form asunto:', await p.inputValue('#fNuevo [name=Title]'), '| NLT:', await p.inputValue('#fNuevo [name=nlt]'), '| estado:', await p.inputValue('#fNuevo [name=ESTADO]'), '| prioridad:', await p.inputValue('#fNuevo [name=Prioridad]'), '| resp:', await p.inputValue('#fNuevo [name=resp]'));
  console.log('departamentos ofrecidos (solo células):', await p.$$eval('#nDeps option', o => o.map(x => x.value).join(', ')) || '(ninguno aún)', '| responsable propuesto:', await p.inputValue('#fNuevo [name=resp]'));
  // META: departamento = célula de MENSADEF (campo de texto); Gestor común: negociado de la lista (desplegable)
  const esMeta = (await p.$eval('#fNuevo [name=NegociadoAsignado]', e => e.tagName)) === 'INPUT';
  if (esMeta) await p.fill('#fNuevo [name=NegociadoAsignado]', 'ET 2SUIGE SEGURIDAD'); else await p.selectOption('#fNuevo [name=NegociadoAsignado]', 'Seguridad');
  console.log('formulario:', esMeta ? 'META (departamentos)' : 'Gestor común (negociados)', '| etiqueta:', await p.$eval('#fNuevo [name=NegociadoAsignado]', e => e.closest('div').querySelector('.lbl').textContent));
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
  if (esMeta) { await p.fill('#nDepTxt', 'ET 2SUIGE PERSONAL'); await p.click('#nDepAdd'); } else await p.check('#fNuevo [name=negImpl][value=Personal]');
  console.log('departamentos implicados marcados:', await p.$$eval('#nDepImpl [name=negImpl]:checked', c => c.map(x => x.value).join(', ')));
  console.log('expediente en el alta:', await p.isDisabled('#fNuevo [data-exp]'), await p.inputValue('#fNuevo [data-exp]'));
  // Estado y fecha de finalización deben ir de acuerdo
  { const est0 = await p.inputValue('#fNuevo [name=ESTADO]');
    await p.fill('#fNuevo [name=fin]', '2026-10-20'); await p.click('#nCrear'); await p.waitForTimeout(300);
    console.log('fin sin estado terminado:', await p.textContent('#nError'));
    await p.fill('#fNuevo [name=fin]', ''); await p.selectOption('#fNuevo [name=ESTADO]', 'FINALIZADO'); await p.click('#nCrear'); await p.waitForTimeout(300);
    console.log('terminado sin fin:', await p.textContent('#nError'));
    await p.selectOption('#fNuevo [name=ESTADO]', est0); }
  await p.fill('#fNuevo [name=DescripcionDelAsunto]', 'Línea 1\nLínea <2>');
  await p.click('#nCrear'); await p.waitForTimeout(1500);
  if (process.env.SINCELULAS) { console.log('sin admitir células:', await p.textContent('#nError')); await b.close(); process.exit(0); }
  const alta = posts.find(x => x.ruta.endsWith('/items'));
  console.log('cabeceras:', alta.cab['x-requestdigest'], alta.cab['content-type']);
  console.log('cuerpo:', alta.cuerpo);
  { const fija = posts.find(x => /items\(707\)/.test(x.ruta)); console.log('nº de expediente tras crear:', fija && fija.cuerpo, '| en la lista:', items[706].ControlExpediente); }
  console.log('abierto tras crear:', await p.evaluate(() => document.querySelector('#dlg').open), '|', (await p.textContent('#dlg h2')));
  console.log('cabecera:', await p.textContent('#estadoCarga'));
  const mail = posts.find(x => x.ruta === 'SP.Utilities.Utility.SendEmail');
  console.log('correo:', mail && mail.cab['x-requestdigest'], mail && mail.cuerpo.slice(0, 400));
  { const cuerpoMail = mail ? JSON.parse(mail.cuerpo).properties.Body : ''; console.log('enlace del correo:', (cuerpoMail.match(/href=\\?"([^"\\]+)/) || [])[1], '| sin formulario de SharePoint:', !/DispForm|EditForm|NewForm/.test(cuerpoMail)); }
  console.log('caja correo:', await p.textContent('#correoAsig'));
  await p.screenshot({ path: new URL('asig-ok.png', import.meta.url).pathname });
  correoFalla = true;
  await p.click('#dlg [data-cerrar]'); await p.click('[data-abrir="707"]').catch(()=>{}); await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(300);
  await p.click('[data-asignar]'); await p.waitForTimeout(600);
  console.log('caja tras fallo:', await p.textContent('#correoAsig'));
  console.log('mailto:', (await p.getAttribute('#correoAsig a', 'href')).slice(0, 200));
  await p.screenshot({ path: new URL('asig-fallo.png', import.meta.url).pathname });
  correoFalla = false;
  // Colabora no acepta la dirección de una implicada (cuenta antigua): se le envía a su otra cuenta
  buzonMal = ['agarcia@et.mde.es']; enviados = [];
  await p.click('#dlg [data-cerrar]'); await p.evaluate(() => { const a = document.createElement('a'); a.dataset.abrir = '707'; document.body.append(a); a.click(); }); await p.waitForTimeout(300);
  await p.click('[data-asignar]'); await p.waitForTimeout(1500);
  console.log('caja con dirección rechazada:', (await p.textContent('#correoAsig')).replace(/\s+/g, ' ').slice(0, 300), '| llegó a:', enviados.join(', '));
  console.log('comentario del aviso:', (await p.textContent('#comLista')).replace(/\s+/g, ' ').slice(0, 200));
  buzonMal = [];
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
  // El enlace de los correos abre la ficha del asunto en la página (y la ficha ya no enlaza al formulario de SharePoint)
  await p.goto('https://colabora.mdef.es' + WEB + '/seguridad/Documentos%20compartidos/tareas-nlt-colabora.html?id=5'); await p.waitForTimeout(1800);
  console.log('abrir con ?id=5:', await p.evaluate(() => document.querySelector('#dlg').open), '|', await p.textContent('#dlg h2').catch(() => ''), '| URL limpia:', !p.url().includes('?id='),
    '| «Ver en Colabora» en la ficha (se mantiene):', await p.$$eval('#dlg a[href*="Form.aspx"]', n => n.length));
  // Incoherencias heredadas: la situación la manda el estado y se avisa con ⚠
  await p.click('#dlg [data-cerrar]').catch(() => {});
  await p.selectOption('#fquien', 'todos'); await p.fill('#fq', 'exp 3'); await p.waitForTimeout(500);
  console.log('buscar «exp 3»:', (await p.$$eval('.tarea', n => n.map(x => x.innerText.replace(/\s+/g, ' ').slice(0, 160)))).slice(0, 3).join(' || '));
  await p.fill('#fq', ''); await p.waitForTimeout(300);
  console.log('avisos ⚠ en pantalla:', await p.$$eval('.badge.warn', n => [...new Set(n.map(x => x.textContent))].join(' / ')));
  console.log('errores:', errs);
  await b.close();
}
await prueba();
