// Prueba del Centro de Control NLT SUIGESUR contra un SharePoint simulado (sin datos reales).
// Uso: node suigesur/pruebas/simulacion.mjs  (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../CENTRO_CONTROL_NLT_SUIGESUR.html', import.meta.url), 'utf8');
const ORIGEN = 'https://colabora.mdef.es', WEB = '/et/SUIGESUR/JSUIGE';
const PAGINA = ORIGEN + WEB + '/aplicaciones/CENTRO_CONTROL_NLT_SUIGESUR.html';

let fallos = 0;
const ok = (cond, txt) => { console.log((cond ? '  ✔ ' : '  ✖ ') + txt); if (!cond) fallos++; };

function servidor(modo) {
  // modo: 'ligero' (admite nometadata) o 'verbose' (SharePoint 2013: solo verbose)
  const F = (n, t, tipo, extra) => Object.assign({ InternalName: n, Title: t, TypeAsString: tipo, Hidden: false, ReadOnlyField: false }, extra || {});
  const SIS = () => [F('ID', 'ID', 'Counter', { ReadOnlyField: true }), F('Title', 'Título', 'Text'), F('Created', 'Creado', 'DateTime', { ReadOnlyField: true }),
    F('Modified', 'Modificado', 'DateTime', { ReadOnlyField: true }), F('Author', 'Creado por', 'User', { ReadOnlyField: true }), F('Editor', 'Modificado por', 'User', { ReadOnlyField: true }),
    F('ContentType', 'Tipo de contenido', 'Computed', { Hidden: true })];
  const listas = {
    // Listas tal como las dejó la versión anterior (columnas de ChatGPT, Title vacío)
    UCO_SUIGESUR: { campos: SIS().concat([F('NombreUnidad', 'NombreUnidad', 'Text'), F('Siglas', 'Siglas', 'Text'), F('Ambito', 'Ambito', 'Text'), F('Contacto', 'Contacto', 'Text'), F('Activa', 'Activa', 'Boolean')]),
      items: [{ Id: 1, Title: null, NombreUnidad: 'UNIDAD DE PRUEBA UNO', Siglas: 'UPU', Ambito: 'UCO', Contacto: '', Activa: true }, { Id: 2, Title: null, NombreUnidad: 'UNIDAD DE PRUEBA DOS', Siglas: 'UPD', Ambito: 'BAE', Contacto: '', Activa: null }] },
    NLT_MAESTRO: { campos: SIS().concat([F('NombreObligacion', 'NombreObligacion', 'Text'), F('Periodicidad', 'Periodicidad', 'Text'), F('DiaNLT', 'DiaNLT', 'Number'), F('Meses', 'Meses', 'Text'),
      F('Categoria', 'Categoria', 'Text'), F('Ambito', 'Ambito', 'Text'), F('Notas', 'Notas', 'Note', { RichText: false }), F('Activa', 'Activa', 'Boolean')]),
      items: [{ Id: 1, NombreObligacion: 'Obligación mensual de prueba', Periodicidad: 'Mensual', DiaNLT: 5, Meses: '', Categoria: 'Prueba', Activa: true }] },
    CONTROL_ENTREGAS: { campos: SIS().concat([F('Unidad', 'Unidad', 'Text'), F('SiglasUnidad', 'SiglasUnidad', 'Text'), F('Obligacion', 'Obligacion', 'Text'), F('ObligacionID', 'ObligacionID', 'Number'),
      F('Periodo', 'Periodo', 'Text'), F('FechaNLT', 'FechaNLT', 'DateTime'), F('FechaRecepcion', 'FechaRecepcion', 'DateTime'), F('Estado', 'Estado', 'Text'), F('Observaciones', 'Observaciones', 'Note'), F('LinkDocumento', 'LinkDocumento', 'Text')]),
      items: [{ Id: 1, Title: null, Unidad: 'UNIDAD DE PRUEBA UNO', SiglasUnidad: 'UPU', Obligacion: 'Obligación mensual de prueba', ObligacionID: 1, Periodo: '2026-01', FechaNLT: '2026-01-04T23:00:00Z', FechaRecepcion: '2026-01-10T23:00:00Z', Estado: 'Recibida' },
        { Id: 2, Title: null, Unidad: 'UNIDAD DE PRUEBA DOS', SiglasUnidad: 'UPD', Obligacion: 'Obligación mensual de prueba', ObligacionID: 1, Periodo: '2026-01', FechaNLT: '2026-01-04T23:00:00Z', Estado: 'Pendiente' }] }
    // SEGUIMIENTO_EVENTOS no existe
  };
  Object.values(listas).forEach(l => l.items.forEach(i => { i.Created = i.Modified = '2026-01-01T10:00:00Z'; i.Author = i.Editor = { Title: 'AUTOR' }; }));
  return { modo, listas, denegar: false, ignorar: null, posts: [], sinGestion: false };
}
const tipoEnt = n => 'SP.Data.' + n.replace(/_/g, '_x005f_') + 'ListItem';

async function enrutar(page, S) {
  await page.route(ORIGEN + '/**', async r => {
    const req = r.request(), metodo = req.method();
    const u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    const [base, resto] = u.split('/_api/');
    if (base.replace(ORIGEN, '') !== WEB) return r.fulfill({ status: 404, json: { error: { message: { value: 'not found' } } } });
    const acc = req.headers()['accept'] || '';
    const verbose = acc.includes('verbose');
    if (!verbose && S.modo === 'verbose') return r.fulfill({ status: 406, body: '' });
    const env = d => verbose ? (Array.isArray(d) ? { d: { results: d } } : { d: d }) : (Array.isArray(d) ? { value: d } : d);
    const err = (st, m) => r.fulfill({ status: st, json: { error: { code: '-1', message: { lang: 'es', value: m } } } });
    if (metodo === 'POST') {
      const cuerpo = req.postData() ? JSON.parse(req.postData()) : null;
      S.posts.push({ ruta: resto, cab: req.headers(), cuerpo });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DIGEST-1', FormDigestTimeoutSeconds: 1800 } } } });
      if (req.headers()['x-requestdigest'] !== 'DIGEST-1') return err(403, 'The security validation for this page is invalid.');
      if (S.denegar) return err(403, 'Access denied. You do not have permission to perform this action or access this resource.');
      if (resto === 'web/lists') {
        if (S.sinGestion) return err(403, 'Access denied.');
        const n = cuerpo.Title; S.listas[n] = { campos: servidor().listas.UCO_SUIGESUR.campos.slice(0, 7), items: [] };
        return r.fulfill({ status: 201, json: { d: { Title: n } } });
      }
      const m = resto.match(/^web\/lists\/getbytitle\('([^']+)'\)(.*)$/);
      if (!m || !S.listas[m[1]]) return err(404, "List does not exist.");
      const L = S.listas[m[1]], sub = m[2];
      if (sub === '/fields/addfieldasxml') return err(404, 'No se encuentra el recurso para la solicitud addfieldasxml.');
      if (sub === '/fields/createfieldasxml') {
        const x = cuerpo.parameters.SchemaXml;
        if (!cuerpo.parameters.__metadata) return err(400, 'Invalid JSON. A token was not recognized in the JSON content.');
        const name = x.match(/Name="([^"]+)"/)[1], tipo = x.match(/Type="([^"]+)"/)[1], disp = x.match(/DisplayName="([^"]+)"/)[1];
        const interno = (cuerpo.parameters.Options & 8) ? name : disp.replace(/ /g, '_x0020_');
        L.campos.push({ InternalName: interno, Title: disp, TypeAsString: tipo, Hidden: false, ReadOnlyField: false, RichText: false });
        return r.fulfill({ status: 200, json: { d: { InternalName: interno } } });
      }
      if (sub.startsWith('/fields/getbyinternalnameortitle')) { L.campos.find(c => c.InternalName === 'Title').Title = cuerpo.Title; return r.fulfill({ status: 204, body: '' }); }
      const comprobar = c => {
        if (!c.__metadata || c.__metadata.type !== tipoEnt(m[1])) return "A type named '" + (c.__metadata && c.__metadata.type) + "' could not be resolved by the model.";
        for (const k of Object.keys(c)) if (k !== '__metadata' && !L.campos.some(f => f.InternalName === k)) return "The property '" + k + "' does not exist on type '" + tipoEnt(m[1]) + "'. Make sure to only use property names that are defined by the type.";
        return '';
      };
      const guardarValores = (it, c) => { Object.keys(c).forEach(k => { if (k !== '__metadata' && k !== S.ignorar) it[k] = c[k]; }); it.Modified = new Date(Date.now() + 1000).toISOString(); it.Editor = { Title: 'USUARIO DE PRUEBA' }; };
      if (sub === '/items') {
        const e = comprobar(cuerpo); if (e) return err(400, e);
        const id = Math.max(0, ...L.items.map(i => i.Id)) + 1, it = { Id: id, Created: new Date().toISOString(), Author: { Title: 'USUARIO DE PRUEBA' } };
        guardarValores(it, cuerpo); L.items.push(it);
        return r.fulfill({ status: 201, json: { d: Object.assign({ __metadata: { type: tipoEnt(m[1]) }, ID: id }, it) } });
      }
      const mi = sub.match(/^\/items\((\d+)\)(\/recycle\(\))?$/);
      if (mi) {
        const it = L.items.find(i => i.Id === Number(mi[1])); if (!it) return err(404, 'Item does not exist.');
        if (mi[2]) { L.items = L.items.filter(i => i !== it); return r.fulfill({ json: { d: { Recycle: 'guid' } } }); }
        if (req.headers()['x-http-method'] !== 'MERGE') return err(400, 'falta MERGE');
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return err(412, 'The request ETag value does not match the object\'s ETag value.');
        const e = comprobar(cuerpo); if (e) return err(400, e);
        guardarValores(it, cuerpo); return r.fulfill({ status: 204, body: '' });
      }
      return err(400, 'POST no simulado: ' + resto);
    }
    if (resto.startsWith('web?')) return r.fulfill({ json: env({ Url: ORIGEN + WEB, Title: 'JSUIGE' }) });
    if (resto.startsWith('web/currentuser')) return r.fulfill({ json: env({ Id: 7, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es' }) });
    if (resto === 'web/EffectiveBasePermissions') return r.fulfill({ json: env({ EffectiveBasePermissions: { High: '432', Low: S.sinGestion ? '1011030767' & ~0x800 : '1011030767' } }) });
    const m = resto.match(/^web\/lists\/getbytitle\('([^']+)'\)(.*)$/);
    if (!m) return err(404, 'no simulado');
    const L = S.listas[m[1]];
    if (!L) return err(404, "List '" + m[1] + "' does not exist at site with URL '" + ORIGEN + WEB + "'.");
    const sub = m[2];
    if (sub.startsWith('?')) return r.fulfill({ json: env({ Id: 'g-' + m[1], Title: m[1], ItemCount: L.items.length, ListItemEntityTypeFullName: tipoEnt(m[1]), RootFolder: { ServerRelativeUrl: WEB + '/Lists/' + m[1] } }) });
    if (sub.startsWith('/fields')) return r.fulfill({ json: env(L.campos.map(c => verbose && c.Choices ? Object.assign({}, c, { Choices: { results: c.Choices } }) : c)) });
    if (sub === '/EffectiveBasePermissions') return r.fulfill({ json: env({ EffectiveBasePermissions: { High: '432', Low: String(S.sinGestion ? 0x2ff : 0xfff) } }) });
    const sel = (sub.match(/\$select=([^&]+)/) || [, ''])[1].split(',').map(s => s.split('/')[0]);
    const bad = sel.find(s => s && !L.campos.some(c => c.InternalName === s) && s !== 'Id');
    if (bad) return err(400, "The field or property '" + bad + "' does not exist.");
    const mi = sub.match(/^\/items\((\d+)\)/);
    if (mi) {
      const it = L.items.find(i => i.Id === Number(mi[1])); if (!it) return err(404, 'Item does not exist. It may have been deleted by another user.');
      const o = Object.assign({}, it); if (verbose) o.__metadata = { etag: '"' + it.Modified + '"' };
      return r.fulfill({ json: verbose ? { d: o } : o });
    }
    if (sub.startsWith('/items')) {
      const skip = Number((u.match(/skiptoken=(\d+)/) || [0, 0])[1]);
      const pag = L.items.slice(skip, skip + 500), next = skip + 500 < L.items.length ? ORIGEN + WEB + "/_api/web/lists/getbytitle('" + m[1] + "')/items?$top=500&$select=" + sel.join(',') + '&skiptoken=' + (skip + 500) : undefined;
      return r.fulfill({ json: verbose ? { d: { results: pag, __next: next } } : { value: pag, 'odata.nextLink': next } });
    }
    return err(404, 'no simulado ' + sub);
  });
}

const esperar = (p, ms) => p.waitForTimeout(ms || 400);
async function pestana(p, v) { await p.click('#tabs a[data-v="' + v + '"]'); await esperar(p, 200); }

async function escenarioLigero(b) {
  console.log('\n== SharePoint con JSON ligero, listas de la versión anterior ==');
  const S = servidor('ligero');
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await enrutar(p, S);
  await p.goto(PAGINA); await esperar(p, 2500);
  // Preparación automática al conectar: crea la lista que falta y las columnas que faltan, sin duplicar las de la versión anterior
  ok((await p.textContent('#estado')).includes('lectura correcta'), 'conecta y prepara las listas sola: ' + await p.textContent('#estado'));
  ok((await p.textContent('#vista')).includes('preparadas automáticamente'), 'Inicio informa de la preparación');
  ok(!!S.listas.SEGUIMIENTO_EVENTOS && S.listas.SEGUIMIENTO_EVENTOS.campos.some(c => c.InternalName === 'FechaLimite'), 'lista SEGUIMIENTO_EVENTOS creada con sus columnas');
  const nombres = n => S.listas[n].campos.map(c => c.InternalName);
  ok(['Codigo', 'ReglaNLT', 'PlazoDias', 'UnidadesHabituales'].every(c => nombres('NLT_MAESTRO').includes(c)) && !nombres('NLT_MAESTRO').includes('Observaciones'), 'NLT_MAESTRO: añade las que faltan y reutiliza «Notas» como observaciones');
  ok(['UnidadID', 'FechaValidacion', 'Responsable'].every(c => nombres('CONTROL_ENTREGAS').includes(c)) && !nombres('CONTROL_ENTREGAS').includes('Referencia'), 'CONTROL_ENTREGAS: añade las que faltan y reutiliza «LinkDocumento»');
  ok(!nombres('UCO_SUIGESUR').includes('Title0') && nombres('UCO_SUIGESUR').filter(c => c === 'NombreUnidad').length === 1, 'UCO_SUIGESUR: sin columnas duplicadas');
  const xml = S.posts.find(x => x.ruta.endsWith('createfieldasxml'));
  ok(xml.cuerpo.parameters.__metadata.type === 'SP.XmlSchemaFieldCreationInformation' && xml.cuerpo.parameters.Options === 24, 'createfieldasxml con tipo y AddFieldInternalNameHint');
  ok(S.listas.UCO_SUIGESUR.items.length === 2 && S.listas.CONTROL_ENTREGAS.items.length === 2, 'los datos existentes no se tocan');
  await pestana(p, 'ajustes');
  const aj = await p.textContent('#vista');
  ok((aj.match(/Lista y columnas correctas/g) || []).length === 4, 'Ajustes: las 4 listas correctas');
  ok(aj.includes('NombreUnidad'), 'el detalle técnico reconoce NombreUnidad de la versión anterior');
  await p.screenshot({ path: new URL('ajustes.png', import.meta.url).pathname, fullPage: true });
  const nCrear = S.posts.filter(x => x.ruta.endsWith('fieldasxml') || x.ruta === 'web/lists').length;
  await p.reload(); await esperar(p, 1500);
  ok(S.posts.filter(x => x.ruta.endsWith('fieldasxml') || x.ruta === 'web/lists').length === nCrear && !(await p.textContent('#vista')).includes('preparadas automáticamente'), 'al volver a abrir no crea nada más');
  // Unidades: lectura (Title vacío → NombreUnidad)
  await pestana(p, 'unidades');
  ok((await p.textContent('#res')).includes('UNIDAD DE PRUEBA UNO'), 'lee unidades existentes con Title vacío');
  // Alta de unidad
  await p.click('[data-acc=nuevaUnidad]');
  await p.fill('[name=nombre]', 'UNIDAD NUEVA TRES'); await p.fill('[name=siglas]', 'UNT'); await p.fill('[name=ambito]', 'UCO');
  await p.press('[name=siglas]', 'Enter'); await esperar(p, 800);
  const alta = S.posts.find(x => x.ruta.endsWith("('UCO_SUIGESUR')/items"));
  ok(alta && alta.cab['x-requestdigest'] === 'DIGEST-1' && alta.cab['content-type'].includes('verbose'), 'alta con X-RequestDigest y JSON verbose');
  ok(alta && alta.cuerpo.__metadata.type === tipoEnt('UCO_SUIGESUR') && alta.cuerpo.Title === 'UNIDAD NUEVA TRES' && alta.cuerpo.NombreUnidad === 'UNIDAD NUEVA TRES', 'escribe Title y NombreUnidad con el tipo de la lista');
  ok(!(await p.evaluate(() => document.querySelector('#dlg').open)), 'el formulario se cierra tras verificar');
  ok((await p.textContent('#escritura')).includes('ID 3'), 'estado de escritura: ' + await p.textContent('#escritura'));
  ok(S.listas.UCO_SUIGESUR.items.some(i => i.Title === 'UNIDAD NUEVA TRES'), 'la unidad está en el servidor');
  // Duplicado
  await p.click('[data-acc=nuevaUnidad]'); await p.fill('[name=nombre]', 'unidad nueva tres'); await p.click('#fdlg button[type=submit]'); await esperar(p);
  ok((await p.textContent('#dlgMsg')).includes('Ya existe'), 'impide duplicados');
  await p.click('#fdlg [data-cerrar]');
  // Servidor que ignora una columna → verificación falla
  S.ignorar = 'Contacto';
  await p.click('[data-acc=nuevaUnidad]'); await p.fill('[name=nombre]', 'UNIDAD CUATRO'); await p.fill('[name=contacto]', 'Negociado'); await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  const m1 = await p.textContent('#dlgMsg');
  ok(m1.includes('NO verificada') && m1.includes('Contacto'), 'detecta escritura no persistida: ' + m1.split('\n')[0].slice(0, 120));
  ok((await p.textContent('#escritura')).includes('Sin verificar'), 'cabecera: ' + await p.textContent('#escritura'));
  S.ignorar = null; await p.click('#fdlg [data-cerrar]');
  // Catálogo inicial
  await pestana(p, 'ajustes');
  await p.click('[data-acc=semillaOblig]'); await esperar(p);
  await p.click('#fdlg button[type=submit]'); await esperar(p, 4000);
  ok((await p.textContent('#dlgMsg')).includes('26 creados'), 'catálogo inicial: ' + (await p.textContent('#dlgMsg')).slice(0, 60));
  await p.click('#fdlg [data-cerrar]');
  ok(S.listas.NLT_MAESTRO.items.length === 27, 'NLT_MAESTRO tiene 27 obligaciones en el servidor');
  // Asignación selectiva: M-05 VSA a dos unidades
  await pestana(p, 'obligaciones');
  await p.fill('[data-f=oq]', 'VSA'); await esperar(p, 200);
  const idVsa = S.listas.NLT_MAESTRO.items.find(i => i.Codigo === 'M-05').Id;
  await p.click('[data-acc=asignar][data-id="' + idVsa + '"]'); await esperar(p);
  ok((await p.textContent('#asResumen')).includes('se crearán 0'), 'sin unidades marcadas no se crea nada');
  await p.check('[data-asu="1"]'); await p.check('[data-asu="3"]');
  await p.check('[data-pl="0"]');
  const resumen = await p.textContent('#asResumen');
  ok(/2<\/b> periodos|× 2 periodos/.test(await p.innerHTML('#asResumen')) && resumen.includes('se crearán 4'), 'resumen: ' + resumen);
  await p.check('[name=recordar]');
  await p.screenshot({ path: new URL('asignar.png', import.meta.url).pathname });
  await p.click('#asCrear'); await esperar(p, 2500);
  const ra = await p.textContent('#dlgMsg');
  ok(ra.includes('4 registros creados y verificados') && ra.includes('obligadas guardadas'), 'asignación: ' + ra.slice(0, 90));
  ok((await p.textContent('#asResumen')).includes('se crearán 0') && (await p.textContent('#asResumen')).includes('ya existen'), 'repetir la asignación no duplica');
  await p.click('#fdlg [data-cerrar]');
  const ce = S.listas.CONTROL_ENTREGAS.items.filter(i => i.ObligacionID === idVsa);
  ok(ce.length === 4 && ce.every(i => i.UnidadID && i.Estado === 'Pendiente' && i.FechaNLT), 'CONTROL_ENTREGAS: 4 registros con UnidadID, Estado y FechaNLT');
  // Entregas: recepción rápida, validación, edición
  await pestana(p, 'entregas');
  await p.selectOption('[data-f=anio]', ''); await esperar(p, 300);
  const id2 = 2;
  await p.click('[data-acc=recibir][data-id="' + id2 + '"]'); await esperar(p, 800);
  const it2 = S.listas.CONTROL_ENTREGAS.items.find(i => i.Id === 2);
  ok(it2.Estado === 'Recibido' && it2.FechaRecepcion, 'recibido hoy guardado (fuera de plazo, NLT enero)');
  ok((await p.innerHTML('tr[data-entrega="2"]')).includes('Fuera de plazo'), 'la fila muestra «Fuera de plazo»');
  await p.click('[data-acc=validar][data-id="2"]'); await esperar(p, 800);
  ok(S.listas.CONTROL_ENTREGAS.items.find(i => i.Id === 2).Estado === 'Validado', 'validación guardada');
  ok((await p.innerHTML('tr[data-entrega="1"]')).includes('Fuera de plazo'), 'estado heredado «Recibida» se interpreta como Recibido');
  // Edición con conflicto
  await p.click('tr[data-entrega="1"] td:nth-child(4)'); await esperar(p);
  S.listas.CONTROL_ENTREGAS.items.find(i => i.Id === 1).Modified = '2026-02-02T10:00:00Z';
  await p.fill('[name=obs]', 'Observación nueva'); await p.click('#fdlg button[type=submit]'); await esperar(p, 600);
  ok((await p.textContent('#dlgMsg')).includes('Otra persona ha modificado'), 'conflicto detectado antes de escribir');
  await p.click('#fdlg [data-cerrar]');
  await p.click('#recargar'); await esperar(p, 1000);
  await p.click('tr[data-entrega="1"] td:nth-child(4)'); await esperar(p);
  await p.selectOption('[name=estado]', 'Validado'); await p.fill('[name=obs]', 'Línea 1\nLínea <2>'); await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  const it1 = S.listas.CONTROL_ENTREGAS.items.find(i => i.Id === 1);
  ok(it1.Estado === 'Validado' && it1.FechaValidacion && it1.Observaciones === 'Línea 1\nLínea <2>', 'edición tras recargar: validado con fecha y observaciones');
  const merge = S.posts.filter(x => x.ruta.endsWith('items(1)')).pop();
  ok(merge.cab['x-http-method'] === 'MERGE' && merge.cab['if-match'].startsWith('"') && !('Unidad' in merge.cuerpo), 'MERGE con etag y solo campos cambiados: ' + Object.keys(merge.cuerpo).join(','));
  // Lote
  await p.selectOption('[data-f=sit]', 'pendiente'); await esperar(p, 300);
  await p.check('[data-acc=selTodas]'); await esperar(p, 200);
  await p.click('[data-acc=loteRecibir]'); await esperar(p, 2000);
  ok(S.listas.CONTROL_ENTREGAS.items.filter(i => i.Estado === 'Recibido').length === 2, 'recepción por lote de las 2 pendientes en plazo');
  // Papelera
  await p.selectOption('[data-f=sit]', ''); await esperar(p, 200);
  const nAntes = S.listas.CONTROL_ENTREGAS.items.length;
  await p.click('tr[data-entrega="3"] td:nth-child(4)'); await esperar(p);
  await p.click('[data-acc=papelera]'); await esperar(p, 800);
  ok(S.listas.CONTROL_ENTREGAS.items.length === nAntes - 1 && !(await p.$('tr[data-entrega="3"]')), 'enviar a la papelera, verificado');
  // Eventos
  await pestana(p, 'eventos');
  await p.click('[data-acc=nuevoEvento]');
  await p.selectOption('[name=tipo]', 'Cambio de destino'); await p.selectOption('[name=unidad]', '1');
  const idE1 = S.listas.NLT_MAESTRO.items.find(i => i.Codigo === 'E-01').Id;
  await p.selectOption('[name=ob]', String(idE1)); await esperar(p, 100);
  const lim = await p.inputValue('[name=limite]');
  ok(!!lim, 'fecha límite calculada con el plazo de la obligación: ' + lim);
  await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  ok(S.listas.SEGUIMIENTO_EVENTOS.items.length === 1 && S.listas.SEGUIMIENTO_EVENTOS.items[0].Title === 'Informe de personal por cambio de destino', 'evento creado y verificado');
  await p.click('[data-acc=cerrarEvento]'); await esperar(p, 800);
  ok(S.listas.SEGUIMIENTO_EVENTOS.items[0].Estado === 'Finalizado' && S.listas.SEGUIMIENTO_EVENTOS.items[0].FechaCierre, 'evento finalizado con fecha de cierre');
  // Sin permiso
  S.denegar = true;
  await pestana(p, 'unidades'); await p.click('[data-acc=nuevaUnidad]'); await p.fill('[name=nombre]', 'SIN PERMISO'); await p.click('#fdlg button[type=submit]'); await esperar(p, 600);
  const m403 = await p.textContent('#dlgMsg');
  ok(m403.includes('Sin permiso') && m403.includes('HTTP: 403') && m403.includes('UCO_SUIGESUR'), '403 con operación, lista y código: ' + m403.slice(0, 80));
  S.denegar = false; await p.click('#fdlg [data-cerrar]');
  // Quién entrega cada obligación: VSA solo por unas unidades, otra definida desde la unidad, otra para todas
  const itO = cod => S.listas.NLT_MAESTRO.items.find(i => i.Codigo === cod);
  await pestana(p, 'obligaciones'); await p.fill('[data-f=oq]', ''); await esperar(p, 200);
  await p.click('tr[data-oblig="' + itO('M-05').Id + '"] td:nth-child(2)'); await esperar(p);
  await p.check('[name=quien][value=lista]');
  await p.uncheck('[data-obu="3"]'); await p.check('[data-obu="1"]'); await p.check('[data-obu="2"]'); await p.check('[data-obu="3"]');
  ok((await p.textContent('#obUnisN')).includes('3 unidades'), 'VSA: 3 unidades marcadas');
  await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  ok(itO('M-05').UnidadesHabituales.split(';').sort().join(';') === '1;2;3', 'VSA guardada con sus 3 unidades obligadas: ' + itO('M-05').UnidadesHabituales);
  ok((await p.innerText('tr[data-oblig="' + itO('M-05').Id + '"]')).includes('3 unidades'), 'el catálogo muestra quién la entrega');
  await p.click('tr[data-oblig="' + itO('A-01').Id + '"] td:nth-child(2)'); await esperar(p);
  await p.check('[name=quien][value=todas]'); await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  ok(itO('A-01').UnidadesHabituales === 'TODAS', 'Informe anual UCO: todas las unidades');
  await pestana(p, 'unidades');
  await p.click('tr[data-unidad="2"] td:nth-child(2)'); await esperar(p);
  ok(await p.isDisabled('[data-uob="' + itO('A-01').Id + '"]') && await p.isChecked('[data-uob="' + itO('M-05').Id + '"]'), 'la ficha de la unidad muestra sus obligaciones');
  await p.check('[data-uob="' + itO('M-01').Id + '"]'); await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  ok(itO('M-01').UnidadesHabituales === '2', 'obligación definida desde la ficha de la unidad: ' + itO('M-01').UnidadesHabituales);
  // Generar todo 2027 solo para quien corresponde
  const activas = S.listas.UCO_SUIGESUR.items.filter(i => i.Activa !== false).length;
  await pestana(p, 'entregas'); await p.click('[data-acc=generar]'); await esperar(p);
  await p.fill('[name=ganio]', '2027'); await p.selectOption('[name=gdesde]', '1'); await p.selectOption('[name=ghasta]', '12'); await esperar(p, 300);
  const gt = await p.textContent('#genTabla');
  const esperado = 3 * 12 + 1 * 12 + activas;
  ok(gt.includes('Sin definir: no se genera') && gt.includes('Se crearán ' + esperado + ' registros'), 'previsión 2027: ' + esperado + ' registros (VSA 3×12, M-01 1×12, anual ' + activas + ')');
  await p.click('#genCrear'); await esperar(p, 8000);
  ok((await p.textContent('#dlgMsg')).includes(esperado + ' registros creados y verificados'), 'generación 2027: ' + (await p.textContent('#dlgMsg')).slice(0, 60));
  const e27 = S.listas.CONTROL_ENTREGAS.items.filter(i => /^2027/.test(i.Periodo));
  ok(e27.filter(i => i.ObligacionID === itO('M-05').Id).length === 36 && e27.every(i => i.ObligacionID !== itO('M-06').Id), 'solo las unidades obligadas reciben VSA; las obligaciones sin definir no generan nada');
  ok((await p.textContent('#genTabla')).includes('Se crearán 0 registros'), 'volver a generar no duplica');
  await p.click('#fdlg [data-cerrar]');
  // Una obligación que deja de hacerse: se desactiva y sus entregas futuras pasan a «No aplicable»
  await pestana(p, 'obligaciones');
  await p.click('tr[data-oblig="' + itO('M-01').Id + '"] td:nth-child(2)'); await esperar(p);
  await p.uncheck('#fdlg [name=activa]');
  ok(!(await p.isHidden('#bajaNA')) && (await p.textContent('#bajaNA')).includes('12'), 'ofrece marcar sus 12 entregas futuras como no aplicables');
  await p.click('#fdlg button[type=submit]'); await esperar(p, 3000);
  ok(itO('M-01').Activa === false && S.listas.CONTROL_ENTREGAS.items.filter(i => i.ObligacionID === itO('M-01').Id && /^2027/.test(i.Periodo)).every(i => i.Estado === 'No aplicable'), 'obligación desactivada y sus entregas futuras «No aplicable»; el histórico se conserva');
  // Inicio, análisis e informes
  await pestana(p, 'inicio'); await p.selectOption('[data-f=anio]', ''); await esperar(p, 300);
  await p.screenshot({ path: new URL('inicio.png', import.meta.url).pathname, fullPage: true });
  ok((await p.textContent('.kpis')).includes('Puntualidad'), 'dashboard con indicadores');
  for (const s of ['unidades', 'obligaciones', 'evolucion', 'comparativa', 'reincidencia', 'matriz']) { await pestana(p, 'analisis'); await p.click('[data-sub=' + s + ']'); await esperar(p, 200); }
  ok((await p.textContent('#res')).includes('Matriz'), 'análisis: todas las subpestañas se pintan');
  await p.click('[data-sub=unidades]'); await esperar(p, 200);
  await p.screenshot({ path: new URL('analisis.png', import.meta.url).pathname, fullPage: true });
  await pestana(p, 'informes');
  for (const t of ['periodo', 'unidad', 'obligacion', 'incumplimientos', 'retrasos', 'reincidencia', 'eventos']) { await p.selectOption('#infOpts [name=tipo]', t); await esperar(p, 150); }
  await p.click('[data-infper=anio]'); await p.selectOption('#infOpts [name=tipo]', 'periodo'); await esperar(p, 200);
  ok((await p.textContent('#informeDoc')).includes('Cumplimiento por unidad'), 'informe de seguimiento generado');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-inf=csv]')]);
  ok(dl.suggestedFilename().endsWith('.csv'), 'CSV descargado: ' + dl.suggestedFilename());
  await pestana(p, 'ajustes');
  ok((await p.textContent('#res')).includes('Verificación correcta'), 'el registro de operaciones muestra las verificaciones');
  ok(errs.length === 0, 'sin errores de JavaScript ' + (errs.length ? errs.join(' | ') : ''));
  await p.close();
}

async function escenarioSinPermisoDeGestion(b) {
  console.log('\n== Usuario sin permiso para crear listas ni columnas ==');
  const S = servidor('ligero'); S.sinGestion = true;
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await enrutar(p, S);
  await p.goto(PAGINA); await esperar(p, 1500);
  ok(!S.posts.some(x => x.ruta.endsWith('fieldasxml') || x.ruta === 'web/lists'), 'no intenta crear nada sin permiso');
  const v = await p.textContent('#vista');
  ok(v.includes('no tiene permiso') && v.includes('SEGUIMIENTO_EVENTOS'), 'explica qué falta y quién puede prepararlo');
  ok((await p.textContent('#estado')).includes('revisar estructura'), 'estado: ' + await p.textContent('#estado'));
  // Alta con una columna inexistente: error de configuración y no se envía nada
  await pestana(p, 'obligaciones');
  await p.click('[data-acc=nuevaOblig]'); await p.fill('[name=nombre]', 'Obligación con código'); await p.fill('[name=codigo]', 'X-1'); await p.fill('[name=dia]', '5');
  const nPosts = S.posts.length;
  await p.click('#fdlg button[type=submit]'); await esperar(p);
  ok((await p.textContent('#dlgMsg')).includes('no existen las columnas') && S.posts.length === nPosts, 'columna inexistente: error de configuración y no se envía nada');
  ok(errs.length === 0, 'sin errores de JavaScript ' + errs.join(' | '));
  await p.close();
}

async function escenarioVerbose(b) {
  console.log('\n== SharePoint 2013 (solo verbose) ==');
  const S = servidor('verbose');
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await enrutar(p, S);
  await p.goto(PAGINA); await esperar(p, 1500);
  await pestana(p, 'unidades');
  ok((await p.textContent('#res')).includes('UNIDAD DE PRUEBA DOS'), 'lee en verbose');
  await p.click('[data-acc=nuevaUnidad]'); await p.fill('[name=nombre]', 'UNIDAD VERBOSE'); await p.click('#fdlg button[type=submit]'); await esperar(p, 800);
  ok(S.listas.UCO_SUIGESUR.items.some(i => i.NombreUnidad === 'UNIDAD VERBOSE') && !(await p.evaluate(() => document.querySelector('#dlg').open)), 'alta verificada en verbose');
  await pestana(p, 'entregas'); await p.selectOption('[data-f=anio]', ''); await esperar(p, 300);
  await p.click('[data-acc=recibir][data-id="2"]'); await esperar(p, 800);
  ok(S.listas.CONTROL_ENTREGAS.items.find(i => i.Id === 2).Estado === 'Recibido', 'MERGE verificado en verbose');
  await pestana(p, 'ajustes');
  ok((await p.textContent('#res')).includes('verbose (SharePoint 2013)'), 'Ajustes indica formato verbose');
  ok(errs.length === 0, 'sin errores de JavaScript ' + errs.join(' | '));
  await p.close();
}

async function escenarioFueraDeSharePoint(b) {
  console.log('\n== Página abierta fuera de SharePoint ==');
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://otro.servidor/**', r => r.request().url().includes('/_api/') ? r.fulfill({ status: 404, body: 'no' }) : r.fulfill({ body: html, contentType: 'text/html' }));
  await p.goto('https://otro.servidor/x/CENTRO_CONTROL_NLT_SUIGESUR.html'); await esperar(p, 1000);
  ok((await p.textContent('#vista')).includes('No hay conexión') && !(await p.textContent('#vista')).includes('UNIDAD'), 'sin conexión no muestra datos: ' + (await p.textContent('#estado')));
  ok(errs.length === 0, 'sin errores de JavaScript');
  await p.close();
}

async function escenarioServidorQueInyecta(b) {
  console.log('\n== Servidor que inserta un script tras <head>, </head> y <body> (como un filtro corporativo) ==');
  const a = html.indexOf("<script>\n(function"), z = html.lastIndexOf('</script>');
  const js = html.slice(a, z);
  ok(!/<\/|<(html|head|body|meta|script|!--)/i.test(js.slice(8)), 'el código no contiene «</» ni etiquetas de documento literales');
  const S = servidor('ligero');
  const alterado = html.replace(/<head>|<\/head>|<body>/g, m => m + '<script>window.inyectado=(window.inyectado||0)+1</script>');
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await enrutar(p, S);
  await p.route(PAGINA, r => r.fulfill({ body: alterado, contentType: 'text/html' }));
  await p.goto(PAGINA); await esperar(p, 1200);
  ok((await p.textContent('#estado')).includes('Conectado') && !(await p.innerText('body')).includes('htmlInforme'), 'arranca con el HTML alterado: ' + await p.textContent('#estado'));
  // Archivo realmente roto: debe avisar en vez de quedarse en «Conectando…»
  const roto = html.replace("window.CCNLT_ARRANCADA = true;", "window.CCNLT_ARRANCADA = true; }} roto(;");
  await p.route(PAGINA, r => r.fulfill({ body: roto, contentType: 'text/html' }));
  await p.goto(PAGINA); await esperar(p, 800);
  ok((await p.textContent('#vista')).includes('no se ha podido ejecutar'), 'si el código no arranca, lo dice: ' + (await p.textContent('#vista')).slice(0, 90));
  await p.close();
}

const b = await chromium.launch();
await escenarioServidorQueInyecta(b);
await escenarioLigero(b);
await escenarioSinPermisoDeGestion(b);
await escenarioVerbose(b);
await escenarioFueraDeSharePoint(b);
await b.close();
console.log(fallos ? '\n' + fallos + ' comprobaciones fallidas' : '\nTodas las comprobaciones correctas');
process.exit(fallos ? 1 : 0);
