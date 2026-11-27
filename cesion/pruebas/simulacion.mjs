// Prueba de cesion.html contra un SharePoint simulado (datos inventados), en formato ligero y verbose.
// Uso: node cesion/pruebas/simulacion.mjs    ·  CES_HTML=cesion/colabora/cesion.html para la copia protegida  ·  PROXY=1 filtro de la red
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.CES_HTML || new URL('../cesion.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo', PAGINA = O + WEB + '/Documentos%20compartidos/cesion.html';
let fallos = 0;
const todosCorreos = [];
const ok = (c, m, det) => { if (!c) fallos++; console.log((c ? '  ✔ ' : '  ✘ ') + m + (!c && det !== undefined ? ' → ' + String(det).slice(0, 400) : '')); };

// ---------- Personas y grupos ----------
const GENTE = {
  1: { Id: 1, Title: 'ADMINISTRADOR', EMail: 'asansen@et.mde.es', Name: 'i:0#.w|et\\asansen' },
  10: { Id: 10, Title: 'JEFE UNIDAD X', EMail: 'jefex@et.mde.es', Name: 'i:0#.w|et\\jefex' },
  11: { Id: 11, Title: 'JEFE BASE NORTE', EMail: 'jefen@et.mde.es', Name: 'i:0#.w|et\\jefen' },
  20: { Id: 20, Title: 'NEGOCIADO SUR', EMail: 'sur1@et.mde.es', Name: 'i:0#.w|et\\sur1' },
  21: { Id: 21, Title: 'NEGOCIADO NORTE', EMail: 'nor1@et.mde.es', Name: 'i:0#.w|et\\nor1' },
  30: { Id: 30, Title: 'ANALISTA IGE', EMail: 'ige1@et.mde.es', Name: 'i:0#.w|et\\ige1' },
  40: { Id: 40, Title: 'SIN ACCESO', EMail: 'nadie@et.mde.es', Name: 'i:0#.w|et\\nadie' },
  50: { Id: 50, Title: 'ANALISTA SINTSEG', EMail: 'sint1@et.mde.es', Name: 'i:0#.w|et\\sint1' },
  22: { Id: 22, Title: 'RESPONSABLE INCIDENTES SUR', EMail: 'rsur@et.mde.es', Name: 'i:0#.w|et\\rsur' }
};
const GRUPOS = { SEGURIDAD_SUIGESUR: [20], SEGURIDAD_SUIGENOR: [21], SEGURIDAD_IGE: [30], CESION_UNIDADES: [10, 11] };
const quien = id => GENTE[id] || { Id: id, Title: 'USUARIO ' + id, EMail: 'u' + id + '@et.mde.es', Name: 'i:0#.w|et\\u' + id };
const persona = id => id ? { Id: id, Title: quien(id).Title, EMail: quien(id).EMail } : null;

// ---------- Listas ----------
let L, correos;
const nuevaLista = (titulo, campos, items) => ({ titulo, campos: ['Title'].concat(campos || []).map(n => typeof n === 'string' ? { InternalName: n, TypeAsString: 'Text' } : n), items: items || [], n: (items || []).length,
  info: { Id: 'g' + Math.random().toString(16).slice(2), Title: titulo, ListItemEntityTypeFullName: 'SP.Data.' + titulo.replace(/\W/g, '') + 'ListItem', Description: 'Lista común', ReadSecurity: 2, WriteSecurity: 2 } });
function servidor() {
  correos = [];
  L = {
    M1N: nuevaLista('M1N', [], [{ Id: 1, Title: 'IGE' }, { Id: 2, Title: 'MCANA' }]),
    M2N: nuevaLista('M2N', ['ID_M1NId'], [{ Id: 1, Title: 'SUIGESUR', ID_M1NId: 1 }, { Id: 2, Title: 'SUIGENOR', ID_M1NId: 1 }, { Id: 3, Title: 'OFICINA X', ID_M1NId: 1 }]),
    M3N: nuevaLista('M3N', ['M1NId', 'M2NId'], [{ Id: 1, Title: 'ACUARTELAMIENTO X', M1NId: 1, M2NId: 1 }, { Id: 2, Title: 'BASE SUR DOS', M1NId: 1, M2NId: 1 }, { Id: 3, Title: 'BASE NORTE', M1NId: 1, M2NId: 2 }]),
    // Responsables de Incidentes (mismo sitio): se usan si la aplicación no tiene los suyos
    'INCIDENTES RESPONSABLES': nuevaLista('INCIDENTES RESPONSABLES', ['Responsables', 'Correos'], [{ Id: 1, Title: 'SUIGESUR', ResponsablesId: { results: [22] }, Correos: '' }]),
    'SOLICITUDES ACCESO APLICACIONES': nuevaLista('SOLICITUDES ACCESO APLICACIONES', ['Solicitante', 'Correo', 'Empleo', 'MandoSegundo', 'Unidad', 'Telefono', 'Papel', 'Motivo', 'Aplicacion', 'EstadoSolicitud', 'GrupoAsignado', 'Resolucion', 'ResueltoPor', 'FechaResolucion'])
  };
}
const lista = n => L[Object.keys(L).find(k => k.toLowerCase() === String(n).toLowerCase())];
// Evalúa un $filter sencillo: or/and de «(Campo eq valor)» y «substringof('x',Campo)»
function cumple(it, f) {
  if (!f) return true;
  return f.split(/\)\s+or\s+\(/).some(parte => {
    const p = parte.replace(/^\(+|\)+$/g, '');
    return p.split(/\)\s+and\s+\(/).every(c => {
      const m = c.match(/^\(?(\w+)(?:\/Id)? eq (?:'([^']*)'|(\d+))\)?$/);
      if (m) return String(it[m[1]] == null ? '' : it[m[1]]) === (m[2] !== undefined ? m[2] : m[3]);
      return true;
    });
  });
}
function expandir(it) {
  const o = { ...it };
  ['Author', 'Editor', 'ResponsableDeLaInformacion', 'Solicitante', 'ResueltoPor'].forEach(k => { if (it[k + 'Id']) o[k] = persona(it[k + 'Id']); });
  if (it.ResponsablesId) o.Responsables = (it.ResponsablesId.results || it.ResponsablesId).map(id => ({ ...persona(id), Name: quien(id).Name }));
  return o;
}

async function abrir(b, yoId, opc) {
  const verbose = opc.verbose, ctx = await b.newContext(), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  const admin = !!opc.admin;
  await ctx.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url()), metodo = req.method();
    if (!u.includes('/_api/')) return r.fulfill({ body: process.env.PROXY ? html.replace(/<\/head>/gi, '<script>/*filtro*/</script></head>') : html, contentType: 'text/html' });
    const resto = u.split('/_api/')[1]; if (process.env.DEPURAR && /fields|lists'$|web\/lists$/.test(resto)) console.log('PET', metodo, resto.slice(0, 120));
    const acc = req.headers().accept || '';
    if (verbose && metodo === 'GET' && acc.includes('nometadata')) return r.fulfill({ status: 406, body: '' });
    const J = (x, st) => r.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(acc.includes('verbose') ? { d: Array.isArray(x) ? { results: x } : x } : Array.isArray(x) ? { value: x } : x) });
    const NO = m => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { message: { value: m || 'List does not exist.' } } }) });
    const ERR = (st, m) => r.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify({ error: { message: { value: m } } }) });
    const perm = { Low: String(admin ? 0x2000000 | 0x800 | 0xff : 0x7), High: '0' };
    const lg = resto.match(/^web\/lists\(guid'([^']+)'\)$/);
    if (lg && metodo === 'POST') { const Lg = Object.values(L).find(x => x.info.Id === lg[1]); if (!Lg) return NO(); Object.assign(Lg.info, { Hidden: JSON.parse(r.request().postData()).Hidden }); return r.fulfill({ status: 204, body: '' }); }
    const lm = resto.match(/^web\/lists\/getbytitle\('([^']+)'\)(.*)$/), Lx = lm && lista(lm[1]), sub = lm ? lm[2] : '';
    if (metodo === 'POST') {
      let c = {}; try { c = JSON.parse(req.postData() || '{}'); } catch (e) { c = {}; }
      if (resto === 'contextinfo') return J({ GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = c.properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
        if (dest.some(x => /@/.test(x))) return ERR(400, 'No se puede enviar el correo electrónico. Asegúrese de que tenga un destinatario válido.');
        todosCorreos.push({ asunto: pr.Subject, cuerpo: pr.Body }); correos.push({ to: pr.To.results, cc: (pr.CC || { results: [] }).results, asunto: pr.Subject, cuerpo: pr.Body }); return J({});
      }
      if (resto === 'web/ensureuser') { const pe = Object.values(GENTE).find(x => x.EMail === String(c.logonName).toLowerCase() || x.Name === c.logonName); return pe ? J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }) : ERR(404, 'no'); }
      if (resto === 'web/lists') { if (!admin) return ERR(403, 'Acceso denegado.'); L[c.Title] = nuevaLista(c.Title, []); return J({ Title: c.Title }, 201); }
      if (lm) {
        if (!Lx) return NO();
        const av = sub.match(/^\/DefaultView\/ViewFields\/addviewfield\('([^']+)'\)$/); if (av) { (Lx.vista = Lx.vista || []).push(av[1]); return J({}); }
        if (/\/fields\/createfieldasxml$/.test(sub)) { if (!admin) return ERR(403, 'Acceso denegado.'); const x = c.parameters.SchemaXml, nm = x.match(/Name="([^"]+)"/)[1]; Lx.campos.push({ InternalName: /^[A-Za-z]{1,3}\d+$/.test(nm) ? '_x' + nm.charCodeAt(0).toString(16).padStart(4, '0') + '_' + nm.slice(1) : nm, TypeAsString: x.match(/Type="([^"]+)"/)[1] }); return J({}); }
        { const aa = sub.match(/^\/items\((\d+)\)\/AttachmentFiles\/add\(FileName='([^']+)'\)/); if (aa) { ((Lx.adj = Lx.adj || {})[aa[1]] = Lx.adj[aa[1]] || []).push(decodeURIComponent(aa[2])); const it = Lx.items.find(x => x.Id === +aa[1]); if (it) it.Attachments = true; return J({}); } }
        const rc = sub.match(/^\/items\((\d+)\)\/recycle\(\)$/); if (rc) { if (!admin) return ERR(403, 'Acceso denegado.'); Lx.items = Lx.items.filter(x => x.Id !== +rc[1]); return J({}); }
        if (sub === '' ) { Object.assign(Lx.info, c); delete Lx.info.__metadata; return r.fulfill({ status: 204, body: '' }); }
        const mi = sub.match(/^\/items\((\d+)\)$/); delete c.__metadata;
        for (const k of Object.keys(c)) { const base = k.replace(/Id$/, ''); if (!Lx.campos.some(f => f.InternalName === k || f.InternalName === base)) return ERR(400, "The property '" + k + "' does not exist on type '" + Lx.info.ListItemEntityTypeFullName + "'."); }
        if (mi) { const it = Lx.items.find(x => x.Id === +mi[1]); if (!it) return NO('Item does not exist.'); Object.assign(it, c, { Modified: new Date(Date.now() + 1000 * (++Lx.m || (Lx.m = 1))).toISOString(), EditorId: yoId }); return r.fulfill({ status: 204, body: '' }); }
        if (sub === '/items') { const it = { Id: ++Lx.n, ...c, Created: new Date().toISOString(), Modified: new Date().toISOString(), AuthorId: yoId, EditorId: yoId }; Lx.items.push(it); return J({ Id: it.Id, ID: it.Id }, 201); }
      }
      const gm = resto.match(/^web\/sitegroups\/getbyname\('([^']+)'\)\/users$/);
      if (gm) { const pe = Object.values(GENTE).find(x => x.Name === c.LoginName); if (pe) (GRUPOS[gm[1]] = GRUPOS[gm[1]] || []).push(pe.Id); return J({}); }
      if (resto === 'web/sitegroups') { GRUPOS[c.Title] = []; return J({ Id: 900, Title: c.Title }); }
      return J({});
    }
    // ---------- GET ----------
    if (resto.startsWith('web/currentuser/groups')) return J(Object.keys(GRUPOS).filter(g => GRUPOS[g].includes(yoId)).map((g, i) => ({ Id: 100 + i, Title: g })));
    if (resto.startsWith('web/currentuser')) { const pe = quien(yoId); return J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }); }
    if (resto.startsWith('web/EffectiveBasePermissions')) return J(acc.includes('verbose') ? { EffectiveBasePermissions: perm } : perm);
    { const gn = resto.match(/^web\/sitegroups\/getbyname\('([^']+)'\)(\?|$)/); if (gn) return GRUPOS[gn[1]] ? J({ Id: 500 + Object.keys(GRUPOS).indexOf(gn[1]), Title: gn[1] }) : NO('Group cannot be found.'); }
    const gu = resto.match(/^web\/sitegroups\/getbyname\('([^']+)'\)\/users/);
    if (gu) return GRUPOS[gu[1]] ? J(GRUPOS[gu[1]].map(id => ({ Id: id, Title: quien(id).Title, Email: quien(id).EMail, LoginName: quien(id).Name }))) : NO('Group cannot be found.');
    if (resto.startsWith('web/sitegroups')) return J(Object.keys(GRUPOS).map((g, i) => ({ Id: 100 + i, Title: g })));
    if (resto.startsWith('web/siteusers')) { const f = (u.match(/Email eq '([^']+)'/) || [])[1]; return J(Object.values(GENTE).filter(x => !f || x.EMail === f).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail, LoginName: x.Name }))); }
    const gb = resto.match(/^web\/getuserbyid\((\d+)\)/); if (gb) { const pe = quien(+gb[1]); return J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }); }
    if (lm) {
      if (!Lx) return NO();
      if (sub === '/DefaultView/ViewFields') return J({ Items: acc.includes('verbose') ? { results: Lx.vista || [] } : (Lx.vista || []) });
      if (sub.startsWith('/fields')) return J(Lx.campos.map(f => ({ InternalName: f.InternalName, Title: f.InternalName, TypeAsString: f.TypeAsString, Choices: [] })));
      if (sub.startsWith('/roleassignments')) return J([]);
      const ad = sub.match(/^\/items\((\d+)\)\/AttachmentFiles/); if (ad) return J(((Lx.adj || {})[ad[1]] || []).map(n => ({ FileName: n, ServerRelativeUrl: WEB + '/Lists/x/Attachments/' + ad[1] + '/' + n })));
      const mi = sub.match(/^\/items\((\d+)\)/);
      if (mi) { const it = Lx.items.find(x => x.Id === +mi[1]); if (!it) return NO('Item does not exist.'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ d: { __metadata: { etag: '"' + it.Modified + '"' }, ...expandir(it) } }) }); }
      if (sub.startsWith('/items')) {
        const f = decodeURIComponent((u.match(/\$filter=([^&]*)/) || [])[1] || '');
        // Solo devuelve columnas existentes (como SharePoint: una columna que no existe da 400)
        const selq = decodeURIComponent((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',').filter(Boolean);
        const malo = selq.map(x => x.split('/')[0]).find(x => !['Id', 'ID', 'Title', 'Created', 'Modified', 'Attachments', 'Author', 'Editor', 'AuthorId', 'EditorId'].includes(x) && !Lx.campos.some(c => c.InternalName === x || c.InternalName + 'Id' === x));
        if (malo) return ERR(400, "The field or property '" + malo + "' does not exist.");
        return J(Lx.items.filter(it => cumple(it, f)).map(expandir));
      }
      return J({ ...Lx.info, EffectiveBasePermissions: perm, RootFolder: { ServerRelativeUrl: WEB + '/Lists/' + Lx.titulo } });
    }
    if (resto.includes('GetFileByServerRelativeUrl')) return J({ Id: 'lib', Title: 'Documentos compartidos', Hidden: false, BaseTemplate: 101 });
    if (resto.startsWith('web/roledefinitions')) return J({ Id: 1073741827 });
    if (resto.startsWith('SP.UserProfiles')) return J({ DisplayName: quien(yoId).Title, UserProfileProperties: [] });
    if (resto.startsWith('web')) return J({ Url: O + WEB, Title: 'Colaborativo' });
    return J([]);
  });
  await p.goto(PAGINA); await p.waitForTimeout(1500);
  return { b: ctx, p, errs };
}
const texto = async p => (await p.textContent('body')).replace(/\s+/g, ' ');
const tab = async (p, v) => { await p.click('#tabs a[data-v="' + v + '"]'); await p.waitForTimeout(400); };
const solicitudes = () => (lista('CESION DE IMAGENES') || { items: [] }).items;
const cerrarDlg = async p => { await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300); };
const abrirSol = async (p, id) => { await p.evaluate(i => { const e = document.querySelector('.inc[data-id="' + i + '"]'); if (e) e.click(); }, id); await p.waitForTimeout(900); };
const manana = () => { const d = new Date(Date.now() + 86400000); return d.toISOString().slice(0, 10) + 'T09:00'; };
const nuevoItem = (o) => { const LP = lista('CESION DE IMAGENES'); const it = { Id: ++LP.n, Created: new Date().toISOString(), Modified: new Date().toISOString(), AuthorId: 10, EditorId: 10, ResponsableDeLaInformacionId: 10,
  MANDO1N: 1, MANDO2N: 1, MANDO3N: 2, NOMBRE1N: 'IGE', NOMBRE2N: 'SUIGESUR', NOMBRE3N: 'BASE SUR DOS', SUIGES: 'SUIGESUR', ANIO: new Date().getFullYear(), CUERPOSOLICITANTE: 'POLICÍA NACIONAL', ORGANOSOLICITANTE: 'Comisaría Y', ...o }; LP.items.push(it); return it; };

async function escenario(verbose) {
  const tag = '[' + (verbose ? 'verbose' : 'ligero') + '] ';
  console.log('\n== ' + (verbose ? 'SharePoint 2013 (verbose)' : 'JSON ligero') + ' ==');
  servidor();
  const b = await chromium.launch();
  // 1. El administrador prepara la aplicación
  let { b: c, p, errs } = await abrir(b, 1, { verbose, admin: true });
  ok(/Preparar la aplicación en Colabora/.test(await texto(p)), tag + 'sin la lista, el administrador ve «Preparar la aplicación»');
  await p.click('[data-preparar]'); await p.waitForTimeout(3000);
  const LP = lista('CESION DE IMAGENES');
  ok(LP && LP.campos.length >= 46 && LP.campos.some(f => f.InternalName === 'RESOLUCIONSINTSEG') && !LP.campos.some(f => /^_x/.test(f.InternalName)), tag + 'crea la lista de solicitudes con sus columnas (ninguna con nombre de celda de Excel)', LP && LP.campos.length);
  await tab(p, 'accesos'); await p.waitForTimeout(1500);
  const ta = await texto(p);
  ok(/Crear el grupo «SINTSEG_CESION»/.test(ta) && /Crear el grupo «DIACU_CESION»/.test(ta) && /Listas de la aplicación/.test(ta) && /Ocultar la biblioteca/.test(ta), tag + 'Accesos: grupos SINTSEG_CESION y DIACU_CESION, ocultar biblioteca y listas');
  ok(errs.length === 0, tag + 'sin errores de página (administrador)', errs.join(' | '));
  await c.close();

  // 2. La unidad pide la cesión (urgente, grabación sin preservar)
  ({ b: c, p, errs } = await abrir(b, 10, { verbose }));
  await p.click('#nuevo'); await p.waitForTimeout(1200);
  await p.selectOption('[name=m2]', '1'); await p.waitForTimeout(100); await p.selectOption('[name=m3]', '1');
  ok(/Se enviará a SUIGESUR/.test(await p.textContent('#fCadena')), tag + 'el formulario dice a qué SUIGE va');
  await p.selectOption('[name=CUERPOSOLICITANTE]', 'GUARDIA CIVIL'); await p.fill('[name=ORGANOSOLICITANTE]', 'Puesto de la Guardia Civil de X');
  await p.fill('[name=REFSOLICITANTE]', 'AT-123/26'); await p.selectOption('[name=URGENTE]', 'SI'); await p.fill('[name=MOTIVOSOLICITUD]', 'Robo en el exterior del acuartelamiento');
  await p.fill('[name=IMAGENESDESDE]', '2026-11-20T10:00'); await p.fill('[name=IMAGENESHASTA]', '2026-11-20T12:00'); await p.selectOption('[name=PRESERVADAS]', 'NO'); await p.selectOption('[name=VISIONADASFCS]', 'SI'); await p.fill('[name=VISIONADOPOR]', 'Agente TIP 999'); await p.fill('[name=CAMARAS]', 'Cámara 3, puerta principal');
  if (!verbose) { await p.setViewportSize({ width: 1100, height: 1400 }); await p.screenshot({ path: new URL('formulario.png', import.meta.url).pathname, fullPage: false }); }
  await p.click('#fEnviar'); await p.waitForTimeout(800);
  ok(/fecha en que se sobrescribe/.test(await p.textContent('#fError')) && /cuándo las visionaron/.test(await p.textContent('#fError')) && solicitudes().length === 0, tag + 'pide la fecha en que se sobrescribe y cuándo las visionaron las FCS');
  await p.fill('[name=FECHAVISIONADO]', '2026-11-21T09:00'); await p.fill('[name=FECHASOBRESCRITURA]', manana());
  await p.click('#fEnviar'); await p.waitForTimeout(800);
  ok(/copia de la solicitud de la policía/.test(await p.textContent('#fError')) && /Dirección General de Coordinación y Estudios/.test(await p.textContent('#fError')) && solicitudes().length === 0, tag + 'sin la copia de la solicitud de la policía ni la comunicación a la DGCE no deja enviar');
  await p.setInputFiles('[name=solicitudPolicia]', { name: 'oficio GC 123.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') }); await p.check('[name=COMUNICADODGCE]');
  await p.fill('[name=FECHASOBRESCRITURA]', manana());
  correos.length = 0; await p.click('#fEnviar'); await p.waitForTimeout(2500);
  const s1 = () => solicitudes()[0];
  ok(s1() && s1().COMUNICADODGCE === 'SI' && !!s1().FECHACOMUNICADODGCE && (lista('CESION DE IMAGENES').adj || {})[1] && lista('CESION DE IMAGENES').adj[1].includes('SOLICITUD-POLICIA - oficio GC 123.pdf'), tag + 'guarda la comunicación a la DGCE y sube la copia de la solicitud de la policía', JSON.stringify([s1() && s1().COMUNICADODGCE, (lista('CESION DE IMAGENES').adj || {})[1]]));
  ok(s1() && s1().VISIONADASFCS === 'SI' && s1().VISIONADOPOR === 'Agente TIP 999' && /^2026-11-21/.test(s1().FECHAVISIONADO), tag + 'guarda que las FCS ya visionaron las imágenes, cuándo y quién', JSON.stringify([s1() && s1().VISIONADASFCS, s1() && s1().FECHAVISIONADO]));
  ok(s1() && s1().ESTADO === 'REMITIDO A SUIGE' && s1().SUIGES === 'SUIGESUR' && s1().URGENTE === 'SI' && s1().CUERPOSOLICITANTE === 'GUARDIA CIVIL' && /^2026-11-20/.test(s1().IMAGENESDESDE), tag + 'solicitud enviada: REMITIDO A SUIGE con sus datos', JSON.stringify(s1()));
  ok(correos.some(m => /^URGENTE · SOLICITUD DE CESIÓN DE IMÁGENES/.test(m.asunto) && m.to.includes('i:0#.w|et\\sur1') && m.to.includes('i:0#.w|et\\rsur')), tag + 'aviso a la SUIGE (grupo y responsable de Incidentes), a su CUENTA', JSON.stringify(correos.map(m => [m.asunto, m.to])));
  ok(/sur1@et\.mde\.es \(miembro del grupo SEGURIDAD_SUIGESUR\)/.test(s1().ObservacionesDelExpediente) && /rsur@et\.mde\.es \(responsable SUIGESUR en Incidentes\)/.test(s1().ObservacionesDelExpediente), tag + 'el historial dice de dónde sale cada destinatario (grupo o responsable de Incidentes)', (s1().ObservacionesDelExpediente || '').split('\n').pop());
  await cerrarDlg(p); await tab(p, 'panel');
  ok(/Grabación en riesgo/.test(await texto(p)), tag + 'el panel avisa de la grabación a punto de sobrescribirse');
  ok(errs.length === 0, tag + 'sin errores de página (unidad)', errs.join(' | '));
  await c.close();

  // 3. La SUIGE informa y remite a DIACU
  ({ b: c, p, errs } = await abrir(b, 20, { verbose }));
  await tab(p, 'pendientes'); await abrirSol(p, 1);
  await p.selectOption('#vSuige', 'FAVORABLE'); await p.fill('#oSuige', 'Procede'); correos.length = 0;
  await p.click('[data-acc=suigeDiacu]'); await p.waitForTimeout(2500);
  ok(s1().ESTADO === 'REMITIDO A IGE' && s1().INFORMESUIGE === 'FAVORABLE', tag + 'SUIGE: informe favorable, REMITIDO directamente A IGE (DIACU solo informada)');
  ok(correos.some(m => /INFORMADA POR SUIGESUR/.test(m.asunto) && m.to.includes('i:0#.w|et\\ige1') && /DIACU RECIBE COPIA/.test(m.cuerpo)), tag + 'aviso inmediato a IGE con DIACU en copia', JSON.stringify(correos.map(m => m.asunto)));
  ok(errs.length === 0, tag + 'sin errores de página (SUIGE)', errs.join(' | '));
  await c.close();

  // 4. DIACU informa; IGE consulta a SINTSEG (fuera) y registra su resolución; IGE la traslada a la SUIGE
  ({ b: c, p, errs } = await abrir(b, 30, { verbose }));
  await tab(p, 'pendientes'); await abrirSol(p, 1);
  await p.selectOption('#vDiacu', 'FAVORABLE CON OBSERVACIONES'); correos.length = 0; await p.click('[data-acc=diacuIge]'); await p.waitForTimeout(2500);
  ok(s1().ESTADO === 'REMITIDO A IGE' && s1().INFORMEDIACU === 'FAVORABLE CON OBSERVACIONES' && correos.some(m => /INFORME DE DIACU/.test(m.asunto)), tag + 'DIACU añade su informe sin parar la solicitud (sigue en IGE) y avisa a IGE');
  await p.selectOption('#vIge', 'FAVORABLE'); await p.fill('#vRefConsulta', 'OF-55/26'); correos.length = 0;
  await p.click('[data-acc=igeSintseg]'); await p.waitForTimeout(2500);
  ok(s1().ESTADO === 'CONSULTADO A SINTSEG' && s1().REFCONSULTASINTSEG === 'OF-55/26' && correos.some(m => /CONSULTADO A SINTSEG/.test(m.asunto)), tag + 'IGE consulta a SINTSEG (fuera de la aplicación)', JSON.stringify(correos.map(m => m.asunto)));
  ok(/Registrar la resolución de SINTSEG/.test(await p.textContent('#dlg')), tag + 'sin grupo SINTSEG, IGE registra su resolución');
  await p.selectOption('#vRes', 'AUTORIZADA CON CONDICIONES'); await p.click('[data-acc=sintsegResolver]'); await p.waitForTimeout(600);
  ok(/condiciones o el motivo/.test(await p.textContent('#accMsg')), tag + 'con condiciones, las pide');
  await p.fill('#oSintseg', 'Solo el tramo de 10:00 a 11:00'); await p.click('[data-acc=sintsegResolver]'); await p.waitForTimeout(600);
  ok(/referencia del oficio/.test(await p.textContent('#accMsg')), tag + 'registrada por IGE, pide la referencia del oficio de SINTSEG');
  await p.fill('#vRefSintseg', 'SINTSEG-9/26'); correos.length = 0; await p.click('[data-acc=sintsegResolver]'); await p.waitForTimeout(2500);
  const rs = correos.find(m => /SINTSEG HA RESUELTO/.test(m.asunto)) || { to: [], cc: [] }, rsTodos = rs.to.concat(rs.cc).join(' ');
  ok(/ige1/.test(rsTodos) && /sur1/.test(rsTodos) && /jefex/.test(rsTodos), tag + 'la resolución de SINTSEG llega a la vez a IGE, la SUIGE, DIACU y la unidad', rsTodos);
  ok(s1().ESTADO === 'RESUELTO POR SINTSEG' && s1().RESOLUCIONSINTSEG === 'AUTORIZADA CON CONDICIONES' && /por SINTSEG/.test(s1().RESOLUCIONREGISTRADAPOR), tag + 'resolución de SINTSEG registrada por IGE', JSON.stringify([s1().ESTADO, s1().RESOLUCIONREGISTRADAPOR]));
  correos.length = 0; await p.click('[data-acc=igeBaja]'); await p.waitForTimeout(2500);
  ok(s1().ESTADO === 'RESPUESTA EN LA SUIGE' && correos.some(m => /RESOLUCIÓN DE SINTSEG: AUTORIZADA CON CONDICIONES/.test(m.asunto) && m.to.includes('i:0#.w|et\\sur1')), tag + 'IGE traslada la resolución a la SUIGE', JSON.stringify(correos.map(m => m.asunto)));
  ok(errs.length === 0, tag + 'sin errores de página (DIACU / IGE)', errs.join(' | '));
  await c.close();

  // 5. La SUIGE comunica a la unidad (con las condiciones) y la unidad entrega; la SUIGE cierra
  ({ b: c, p, errs } = await abrir(b, 20, { verbose }));
  await tab(p, 'pendientes'); await abrirSol(p, 1);
  ok(/Solo el tramo/.test(await p.inputValue('#oInstr')), tag + 'las instrucciones a la unidad parten de las condiciones de SINTSEG');
  correos.length = 0; await p.click('[data-acc=suigeUnidad]'); await p.waitForTimeout(2500);
  ok(s1().ESTADO === 'COMUNICADO A LA UNIDAD' && correos.some(m => /AUTORIZADA: ENTREGUE LAS IMÁGENES/.test(m.asunto) && m.to.includes('i:0#.w|et\\jefex')), tag + 'comunicada a la unidad (a su cuenta)', JSON.stringify(correos.map(m => [m.asunto, m.to])));
  await c.close();
  ({ b: c, p, errs } = await abrir(b, 10, { verbose }));
  await tab(p, 'pendientes'); await abrirSol(p, 1);
  await p.click('[data-acc=entregar]'); await p.waitForTimeout(500);
  ok(/cuándo se entregaron/.test(await p.textContent('#accMsg')), tag + 'la entrega pide fecha, receptor y soporte');
  await p.fill('#vFEntrega', '2026-11-25T09:30'); await p.fill('#vReceptor', 'Agente TIP 1234'); await p.fill('#vSoporte', 'USB cifrado'); correos.length = 0;
  await p.click('[data-acc=entregar]'); await p.waitForTimeout(2500);
  const fin = correos.find(m => /FINALIZADA: IMÁGENES ENTREGADAS/.test(m.asunto)) || { to: [], cc: [] }, finTodos = fin.to.concat(fin.cc).join(' ');
  ok(s1().ESTADO === 'CERRADO' && !!s1().FECHACIERRE && s1().RECEPTOR === 'Agente TIP 1234' && /Nº 1 FINALIZADA/.test(fin.asunto || '') && /sur1/.test(finTodos) && /ige1/.test(finTodos) && /jefex/.test(finTodos), tag + 'al entregar se cierra el ciclo y se avisa a todos (cesión Nº 1 finalizada)', fin.asunto + ' ' + finTodos);
  ok(errs.length === 0, tag + 'sin errores de página (unidad, entrega)', errs.join(' | '));
  await c.close();
  ({ b: c, p, errs } = await abrir(b, 20, { verbose }));
  // Denegada: la SUIGE la comunica y queda cerrada sin entrega
  nuevoItem({ ESTADO: 'RESPUESTA EN LA SUIGE', RESOLUCIONSINTSEG: 'DENEGADA', OBSSINTSEG: 'No procede', URGENTE: 'NO' });
  await p.click('#recargar'); await p.waitForTimeout(1500); await tab(p, 'pendientes'); await abrirSol(p, 2); correos.length = 0;
  await p.click('[data-acc=suigeUnidad]'); await p.waitForTimeout(2500);
  ok(solicitudes()[1].ESTADO === 'CERRADO' && correos.some(m => /DENEGADA/.test(m.asunto)), tag + 'denegada: se comunica a la unidad y queda cerrada');
  ok(errs.length === 0, tag + 'sin errores de página (SUIGE, cierre)', errs.join(' | '));
  await c.close();

  // 6. IGE: ficha, estadísticas e informe
  ({ b: c, p, errs } = await abrir(b, 30, { verbose }));
  await tab(p, 'consulta'); await abrirSol(p, 1);
  ok(/Instrucciones de la SUIGE/.test(await p.textContent('#dlg')) && /Agente TIP 1234/.test(await p.textContent('#dlg')), tag + 'la ficha enseña informes, resolución y entrega');
  let [w] = await Promise.all([c.waitForEvent('page'), p.click('[data-fichaimp]')]); await w.waitForLoadState(); await w.waitForTimeout(300);
  ok(/RESOLUCIÓN DE SINTSEG/.test(await w.textContent('body')) && /Solo el tramo/.test(await w.textContent('body')), tag + 'ficha para imprimir / PDF con la resolución');
  await w.close(); await cerrarDlg(p);
  if (!verbose) { await tab(p, 'panel'); await p.setViewportSize({ width: 1300, height: 1000 }); await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: false }); }
  await tab(p, 'estadisticas'); await p.selectOption('#eAnio', ''); await p.waitForTimeout(300);
  const tot = await p.$$eval('#vista table.t tr', t => t.map(x => [...x.cells].map(c => c.textContent.trim()).join(' ')).find(x => /TOTAL/.test(x)) || '');
  ok(/^TOTAL 2 0 2 1 0 1 1 0 1 0/.test(tot), tag + 'estadísticas por SUIGE: ' + tot);
  await p.click('[data-iest]'); await p.waitForTimeout(500);
  const inf = (await p.textContent('#vista .inf')).replace(/\s+/g, ' ');
  ok(/Resumen general/.test(inf) && /Comparativa por SUIGE/.test(inf) && /Resolución de SINTSEG/.test(inf) && /Quién pide las imágenes/.test(inf), tag + 'informe detallado con indicadores, comparativa y gráficos', inf.slice(0, 300));
  if (!verbose) { await p.setViewportSize({ width: 1300, height: 1500 }); await p.screenshot({ path: new URL('informe.png', import.meta.url).pathname, fullPage: false }); }
  await p.check('[data-isec="detalle"]'); await p.waitForTimeout(300); await p.check('[data-isec="historial"]'); await p.waitForTimeout(300);
  [w] = await Promise.all([c.waitForEvent('page'), p.click('[data-iimp]')]); await w.waitForLoadState(); await w.waitForTimeout(500);
  ok(/INFORME DE CESIÓN DE IMÁGENES/.test(await w.textContent('.banda')) && /Historial del expediente/.test(await w.textContent('body')), tag + 'informe para imprimir / PDF con detalle e historial');
  await w.close();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-icsv]')]);
  ok(/GUARDIA CIVIL/.test(require('fs').readFileSync(await dl.path(), 'utf8')), tag + 'Excel (CSV) del informe');
  ok(errs.length === 0, tag + 'sin errores de página (IGE)', errs.join(' | '));
  await c.close();

  // 7. SINTSEG se integra: el administrador crea SINTSEG_CESION y sus miembros resuelven en la aplicación
  ({ b: c, p, errs } = await abrir(b, 1, { verbose, admin: true }));
  await tab(p, 'accesos'); await p.waitForTimeout(1500); await p.click('[data-acccrearsintseg]'); await p.waitForTimeout(3000);
  ok(!!GRUPOS.SINTSEG_CESION && /SINTSEG en la aplicación: grupo «SINTSEG_CESION»/.test(await texto(p)), tag + 'crea el grupo SINTSEG_CESION');
  ok(errs.length === 0, tag + 'sin errores de página (grupo SINTSEG)', errs.join(' | '));
  await c.close();
  GRUPOS.SINTSEG_CESION.push(50); nuevoItem({ ESTADO: 'CONSULTADO A SINTSEG', INFORMEIGE: 'FAVORABLE', URGENTE: 'NO' });
  ({ b: c, p, errs } = await abrir(b, 50, { verbose }));
  ok(/\bSINTSEG\b/.test(await p.$$eval('.rolh', x => x.map(y => y.textContent).join(' '))) && !(await p.$('[data-accsolicitar]')), tag + 'quien está en SINTSEG_CESION entra como SINTSEG');
  await tab(p, 'pendientes'); ok(/SINTSEG: resolver/.test(await texto(p)), tag + 'SINTSEG ve lo que tiene que resolver');
  await abrirSol(p, 3); await p.selectOption('#vRes', 'AUTORIZADA'); correos.length = 0; await p.click('[data-acc=sintsegResolver]'); await p.waitForTimeout(2500);
  ok(solicitudes()[2].ESTADO === 'RESUELTO POR SINTSEG' && !/por SINTSEG/.test(solicitudes()[2].RESOLUCIONREGISTRADAPOR) && correos.some(m => /SINTSEG HA RESUELTO/.test(m.asunto) && m.to.includes('i:0#.w|et\\ige1')), tag + 'SINTSEG resuelve en la aplicación y avisa a IGE', JSON.stringify(correos.map(m => m.asunto)));
  ok(errs.length === 0, tag + 'sin errores de página (SINTSEG)', errs.join(' | '));
  await c.close();
  delete GRUPOS.SINTSEG_CESION;
  nuevoItem({ ESTADO: 'REMITIDO A IGE', INFORMESUIGE: 'FAVORABLE', URGENTE: 'NO' });
  ({ b: c, p, errs } = await abrir(b, 30, { verbose }));
  await tab(p, 'pendientes'); await abrirSol(p, 4); await p.click('[data-acc=igeRechazar]'); await p.waitForTimeout(500);
  ok(/motivo del rechazo/.test(await p.textContent('#accMsg')), tag + 'IGE: rechazar pide el motivo');
  await p.fill('#oIge', 'Petición sin orden judicial'); correos.length = 0; await p.click('[data-acc=igeRechazar]'); await p.waitForTimeout(2500);
  const s4 = solicitudes()[3], rj = correos.find(m => /RECHAZADA POR IGE/.test(m.asunto)) || { to: [], cc: [] };
  ok(s4.ESTADO === 'RESPUESTA EN LA SUIGE' && s4.RESOLUCIONSINTSEG === 'DENEGADA' && !s4.FECHACONSULTASINTSEG && /sur1/.test(rj.to.concat(rj.cc).join(' ')) && /jefex/.test(rj.to.concat(rj.cc).join(' ')), tag + 'IGE rechaza sin pasar a SINTSEG: baja a la SUIGE y avisa a la unidad', JSON.stringify([s4.ESTADO, rj.asunto]));
  const fi4 = await p.textContent('#dlg');
  ok(/Decisión de IGE/.test(fi4) && !/Propuesta IGE a SINTSEG/.test(fi4) && /no consultado/.test(fi4), tag + 'la ficha dice «Decisión de IGE» (no «Propuesta IGE a SINTSEG») y SINTSEG no consultado');
  ok(errs.length === 0, tag + 'sin errores de página (rechazo de IGE)', errs.join(' | '));
  await c.close();

  // 8. Pasar a histórico (Control total): ver, exportar (ZIP con Excel y registro) y borrar con confirmación
  ({ b: c, p, errs } = await abrir(b, 1, { verbose, admin: true }));
  await tab(p, 'ajustes'); await p.waitForTimeout(500);
  ok(/Pasar a histórico/.test(await texto(p)), tag + 'Ajustes trae «Pasar a histórico»');
  await p.click('[data-histver]'); await p.waitForTimeout(1500);
  ok(/Entran 2 registros/.test(await texto(p)), tag + 'por defecto solo los cerrados (2 de 4)', (await p.textContent('#histCaja')).slice(0, 300));
  await p.check('#hAbiertos'); await p.waitForTimeout(300);
  ok(/Entran 4 registros/.test(await texto(p)) && await p.$eval('[data-histborrar]', x => x.disabled), tag + 'con «Incluir también los abiertos» entran los 4; borrar sigue bloqueado hasta exportar');
  const [zz] = await Promise.all([p.waitForEvent('download'), p.click('[data-histexp]')]); await p.waitForTimeout(800);
  const zb = require('fs').readFileSync(await zz.path()).toString('latin1'); if (process.env.ZIPOUT) require('fs').copyFileSync(await zz.path(), process.env.ZIPOUT);
  ok(/^PK/.test(zb) && /cesion-historico-\d{4}\.csv/.test(zb) && /REGISTRO\.txt/.test(zb) && /GUARDIA CIVIL/.test(zb) && /Agente TIP 1234/.test(zb), tag + 'el ZIP lleva el Excel con todas las columnas y el registro de la operación');
  p.removeAllListeners('dialog'); let respuesta = 'BORRAR 2000'; p.on('dialog', d => d.type() === 'prompt' ? d.accept(respuesta) : d.accept());
  await p.click('[data-histborrar]'); await p.waitForTimeout(800);
  ok(solicitudes().length === 4 && /no coincide/.test(await p.textContent('#histCaja')), tag + 'con una confirmación equivocada no borra nada');
  respuesta = 'BORRAR ' + new Date().getFullYear(); await p.click('[data-histborrar]'); await p.waitForTimeout(3000);
  ok(solicitudes().length === 0 && /enviados a la papelera/.test(await texto(p)), tag + 'borra lo exportado (a la papelera) y la lista queda para el nuevo ciclo', solicitudes().length);
  ok(errs.length === 0, tag + 'sin errores de página (histórico)', errs.join(' | '));
  await c.close();

  // 9. Sin acceso; ningún correo lleva el nombre de otra aplicación
  ({ b: c, p, errs } = await abrir(b, 40, { verbose }));
  ok(/No tienes acceso/.test(await texto(p)) && /SINTSEG/.test(await p.$eval('[name=papel]', s => s.textContent).catch(() => '')), tag + 'sin acceso: solicitud de acceso con el papel SINTSEG');
  ok(errs.length === 0, tag + 'sin errores de página (sin acceso)', errs.join(' | '));
  await c.close();
  ok(todosCorreos.length > 8 && todosCorreos.every(m => !/CECONSEG|INCIDENTE|OPERADORES/i.test((m.asunto + m.cuerpo).replace(/incidentes-(minisdef|uso-oficial)\.png/g, ''))), tag + 'ningún correo lleva el nombre de otra aplicación', todosCorreos.filter(m => /CECONSEG|INCIDENTE|OPERADORES/i.test(m.asunto + m.cuerpo)).map(m => m.asunto + ' :: ' + (m.asunto + m.cuerpo).match(/.{0,60}(CECONSEG|INCIDENTE|OPERADORES).{0,40}/i)[0]).slice(0, 3).join(' // '));
  await b.close();
}
await escenario(false);
await escenario(true);
console.log(fallos ? '\nHAY FALLOS (' + fallos + ')' : '\nTODO BIEN');
process.exit(fallos ? 1 : 0);
