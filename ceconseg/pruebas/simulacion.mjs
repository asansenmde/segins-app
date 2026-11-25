// Prueba de ceconseg.html contra un SharePoint simulado (datos inventados), en formato ligero y verbose.
// Uso: node ceconseg/pruebas/simulacion.mjs    ·  CEC_HTML=ceconseg/colabora/ceconseg.html para la copia protegida  ·  PROXY=1 filtro de la red
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.CEC_HTML || new URL('../ceconseg.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo', PAGINA = O + WEB + '/Documentos%20compartidos/ceconseg.html';
let fallos = 0;
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
  22: { Id: 22, Title: 'RESPONSABLE INCIDENTES SUR', EMail: 'rsur@et.mde.es', Name: 'i:0#.w|et\\rsur' }
};
const GRUPOS = { SEGURIDAD_SUIGESUR: [20], SEGURIDAD_SUIGENOR: [21], SEGURIDAD_IGE: [30], CECONSEG_UNIDADES: [10, 11] };
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
    // Responsables de Incidentes (mismo sitio): CECONSEG los usa si no tiene los suyos
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
    const lm = resto.match(/^web\/lists\/getbytitle\('([^']+)'\)(.*)$/), Lx = lm && lista(lm[1]), sub = lm ? lm[2] : '';
    if (metodo === 'POST') {
      let c = {}; try { c = JSON.parse(req.postData() || '{}'); } catch (e) { c = {}; }
      if (resto === 'contextinfo') return J({ GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = c.properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
        if (dest.some(x => /@/.test(x))) return ERR(400, 'No se puede enviar el correo electrónico. Asegúrese de que tenga un destinatario válido.');
        correos.push({ to: pr.To.results, cc: (pr.CC || { results: [] }).results, asunto: pr.Subject, cuerpo: pr.Body }); return J({});
      }
      if (resto === 'web/ensureuser') { const pe = Object.values(GENTE).find(x => x.EMail === String(c.logonName).toLowerCase() || x.Name === c.logonName); return pe ? J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }) : ERR(404, 'no'); }
      if (resto === 'web/lists') { if (!admin) return ERR(403, 'Acceso denegado.'); L[c.Title] = nuevaLista(c.Title, []); return J({ Title: c.Title }, 201); }
      if (lm) {
        if (!Lx) return NO();
        const av = sub.match(/^\/DefaultView\/ViewFields\/addviewfield\('([^']+)'\)$/); if (av) { (Lx.vista = Lx.vista || []).push(av[1]); return J({}); }
        if (/\/fields\/createfieldasxml$/.test(sub)) { if (!admin) return ERR(403, 'Acceso denegado.'); const x = c.parameters.SchemaXml, nm = x.match(/Name="([^"]+)"/)[1]; Lx.campos.push({ InternalName: /^[A-Za-z]{1,3}\d+$/.test(nm) ? '_x' + nm.charCodeAt(0).toString(16).padStart(4, '0') + '_' + nm.slice(1) : nm, TypeAsString: x.match(/Type="([^"]+)"/)[1] }); return J({}); }
        if (/AttachmentFiles\/add/.test(sub)) return J({});
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
      const ad = sub.match(/^\/items\((\d+)\)\/AttachmentFiles/); if (ad) return J([]);
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
const partes = () => (lista('CECONSEG OPERADORES') || { items: [] }).items;

async function escenario(verbose) {
  const tag = '[' + (verbose ? 'verbose' : 'ligero') + '] ';
  console.log('\n== ' + (verbose ? 'SharePoint 2013 (verbose)' : 'JSON ligero') + ' ==');
  servidor();
  const b = await chromium.launch();
  // 1. El administrador prepara la aplicación: lista de partes, unidades obligadas
  let { b: c, p, errs } = await abrir(b, 1, { verbose, admin: true });
  ok(/Preparar la aplicación en Colabora/.test(await texto(p)), tag + 'sin la lista, el administrador ve «Preparar la aplicación»');
  await p.click('[data-preparar]'); await p.waitForTimeout(2500); if (process.env.DEPURAR) console.log('DEPURAR', await texto(p), errs);
  const LP = lista('CECONSEG OPERADORES');
  ok(LP && LP.campos.length >= 32 && LP.campos.some(f => f.InternalName === 'ResponsableDeLaInformacion' && f.TypeAsString === 'User'), tag + 'crea la lista de partes con sus columnas', LP && LP.campos.length);
  ok(!!(await p.$('#tabs a[data-v="ajustes"]')), tag + 'después entra en la aplicación (con Ajustes y Accesos)');
  await tab(p, 'ajustes');
  await p.click('[data-crearuni]'); await p.waitForTimeout(2000);
  ok(!!lista('CECONSEG UNIDADES'), tag + 'crea la lista de unidades obligadas');
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('#oblCaja details').forEach(d => { d.open = true; }));
  await p.check('[data-obl="1"]'); await p.check('[data-obl="2"]'); await p.check('[data-obl="3"]');
  await p.click('[data-oblguardar]'); await p.waitForTimeout(2000);
  ok(lista('CECONSEG UNIDADES').items.length === 3 && lista('CECONSEG UNIDADES').items.find(x => x.M3N === 3).SUIGES === 'SUIGENOR', tag + 'guarda las unidades obligadas con su SUIGE');
  ok(errs.length === 0, tag + 'sin errores de página (administrador)', errs.join(' | '));
  await c.close();

  // 2. La unidad crea el parte del trimestre anterior y lo envía a su SUIGE
  ({ b: c, p, errs } = await abrir(b, 10, { verbose }));
  await p.click('#nuevo'); await p.waitForTimeout(1200);
  await p.selectOption('[name=m2]', '1'); await p.waitForTimeout(100); await p.selectOption('[name=m3]', '1');
  ok(/Se enviará a SUIGESUR/.test(await p.textContent('#fCadena')), tag + 'el formulario dice a qué SUIGE va');
  const vals = { NUMEROOPERADORES: '20', OPERADORESTROPA: '15', HPSSINCURSAR: '2', HPSENTRAMITE: '3', HPSEJECUTADA: '14', CERTSINCURSAR: '1', CERTEJECUTADO: '19', COMPROMISOCONF: '20' };
  for (const k in vals) await p.fill('[name=' + k + ']', vals[k]);
  if (!verbose) { await p.setViewportSize({ width: 1100, height: 1300 }); await p.screenshot({ path: new URL('formulario.png', import.meta.url).pathname, fullPage: false }); }
  ok(/tienen que sumar el nº de operadores/.test(await p.textContent('#fSuma')), tag + 'avisa si las HPS no suman los operadores (19 de 20)');
  ok(await p.isVisible('#jHps') && await p.isVisible('#jHpsF') && await p.isVisible('#jCert') && !(await p.isVisible('#jComp')), tag + 'pide justificar las HPS y los certificados que faltan (no los compromisos, que están todos)');
  await p.click('#fEnviar'); await p.waitForTimeout(800);
  ok(/motivos de los operadores sin HPS/.test(await p.textContent('#fError')) && /fecha prevista de los cursos/.test(await p.textContent('#fError')) && partes().length === 0, tag + 'sin justificar no deja enviar');
  await p.selectOption('[name=SIRVENSINHPS]', 'SI'); await p.fill('[name=MOTIVOSHPS]', '2 incorporados en octubre sin solicitar; 3 en trámite desde septiembre');
  await p.fill('[name=FECHAPREVISTAHPS]', '2027-01-31'); await p.fill('[name=MOTIVOSCERT]', 'Curso en enero'); await p.fill('[name=FECHAPREVISTACERT]', '2027-01-20');
  ok(await p.isVisible('#jMed'), tag + 'si sirven operadores sin HPS pide las medidas');
  await p.fill('[name=MEDIDASUNIDAD]', 'Prestan servicio acompañados de operador con HPS');
  await p.click('#fEnviar'); await p.waitForTimeout(800);
  ok(/tienen que sumar/.test(await p.textContent('#fError')) && partes().length === 0, tag + 'con el desglose descuadrado no deja enviar');
  await p.fill('[name=HPSEJECUTADA]', '15');
  correos.length = 0; await p.click('#fEnviar'); await p.waitForTimeout(2500);
  const p1 = partes()[0];
  ok(p1 && p1.ESTADO === 'REMITIDO A SUIGE' && p1.SUIGES === 'SUIGESUR' && p1.NOMBRE3N === 'ACUARTELAMIENTO X' && p1.NUMEROOPERADORES === 20 && p1.TIPODETRAMITE === 'TRIMESTRAL' && p1.SIRVENSINHPS === 'SI' && /trámite/.test(p1.MOTIVOSHPS) && /^2027-01-31/.test(p1.FECHAPREVISTAHPS) && p1.MOTIVOSCOMP === '', tag + 'parte enviado: REMITIDO A SUIGE (SUIGESUR) con sus datos y la justificación', JSON.stringify(p1));
  ok(correos.some(m => /Prestan servicio operadores SIN HPS/.test(m.cuerpo)), tag + 'el aviso a la SUIGE lleva lo que hay que revisar');
  ok(correos.every(m => !/INCIDENTE/.test(m.cuerpo)) && correos.some(m => /ESTADILLO DE OPERADORES CECONSEG/.test(m.cuerpo)), tag + 'la cabecera del correo es la del estadillo CECONSEG (no la de Incidentes)');
  ok(correos.some(m => /PARTE DE OPERADORES CECONSEG/.test(m.asunto) && m.to.includes('i:0#.w|et\\sur1')), tag + 'aviso a la SUIGE, a su CUENTA', JSON.stringify(correos.map(m => m.to)));
  ok(correos.some(m => /PARTE DE OPERADORES CECONSEG/.test(m.asunto) && m.to.includes('i:0#.w|et\\rsur')), tag + 'sin responsables propios, el aviso llega también al responsable de la SUIGE en Incidentes', JSON.stringify(correos.map(m => m.to)));
  // Segundo trimestral de la misma unidad y trimestre: no deja
  await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300); await p.click('#nuevo'); await p.waitForTimeout(1200);
  await p.selectOption('[name=m2]', '1'); await p.waitForTimeout(100); await p.selectOption('[name=m3]', '1'); await p.fill('[name=NUMEROOPERADORES]', '5');
  await p.click('#fBorrador'); await p.waitForTimeout(800);
  ok(/Ya existe el parte trimestral de esta unidad/.test(await p.textContent('#fError')) && partes().length === 1, tag + 'no deja un segundo parte trimestral de la misma unidad y trimestre');
  // Otro de BASE SUR DOS en borrador y enviado (para devolverlo)
  await p.selectOption('[name=m3]', '2');
  for (const [k, v] of [['HPSEJECUTADA', '5'], ['CERTEJECUTADO', '5'], ['COMPROMISOCONF', '5']]) await p.fill('[name=' + k + ']', v);
  ok(await p.isHidden('#fJust'), tag + 'todo completo: no pide justificación');
  await p.click('#fEnviar'); await p.waitForTimeout(2500);
  ok(partes().length === 2 && partes()[1].ESTADO === 'REMITIDO A SUIGE', tag + 'segundo parte (otra unidad) enviado');
  ok(errs.length === 0, tag + 'sin errores de página (unidad)', errs.join(' | '));
  await c.close();

  // 3. La SUIGE valora uno e informa a DIACU, y devuelve el otro
  ({ b: c, p, errs } = await abrir(b, 20, { verbose }));
  await tab(p, 'pendientes');
  ok((await p.$$('.inc')).length === 2, tag + 'la SUIGE ve los 2 partes pendientes de valorar');
  ok(/Sirven sin HPS/.test(await p.textContent('.inc[data-id="1"]')), tag + 'la tarjeta avisa de que sirven operadores sin HPS');
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(800);
  const fi = await p.textContent('#dlg');
  ok(/Situación para el analista/.test(fi) && /5 de 20 operadores sin HPS concedida \(2 sin solicitar, 3 en trámite\)/.test(fi) && /acompañados/.test(fi) && /31\/01\/2027/.test(fi), tag + 'la ficha resume los huecos y la justificación para el analista');
  await p.selectOption('#vSuige', 'BIEN'); await p.fill('#oSuige', 'Correcto'); correos.length = 0;
  await p.click('[data-acc=suigeDiacu]'); await p.waitForTimeout(2500);
  ok(partes()[0].ESTADO === 'REMITIDO A DIACU' && partes()[0].VALORACIONSUIGE === 'BIEN', tag + 'valoración SUIGE: REMITIDO A DIACU');
  ok(correos.some(m => /VALORADO POR SUIGESUR/.test(m.asunto) && m.to.includes('i:0#.w|et\\ige1')), tag + 'aviso a DIACU (SEGURIDAD_IGE)', JSON.stringify(correos.map(m => m.asunto)));
  await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300);
  await tab(p, 'pendientes'); if (process.env.DEPURAR) console.log('DEPURAR', (await texto(p)).slice(0, 900)); await p.evaluate(() => document.querySelector('.inc[data-id="2"]').click()); await p.waitForTimeout(800); if (process.env.DEPURAR) console.log('DEPURAR2', await p.evaluate(() => document.querySelector('#dlg').open), (await p.textContent('#dlg')).slice(0, 300));
  await p.fill('#vRechazo', 'Faltan los compromisos'); correos.length = 0;
  await p.click('[data-acc=suigeDevolver]'); await p.waitForTimeout(2500);
  ok(partes()[1].ESTADO === 'DEVUELTO A LA UNIDAD' && correos.some(m => /DEVUELTO/.test(m.asunto) && m.to.includes('i:0#.w|et\\jefex')), tag + 'devuelto a la unidad con aviso a su cuenta');
  // Control trimestral: falta BASE NORTE (SUIGENOR no es suya) → la SUIGE ve solo las suyas
  await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300); await tab(p, 'control');
  const filasCtl = await p.$$eval('#vista table.t tr', t => t.slice(1).map(x => x.textContent.replace(/\s+/g, ' ')));
  ok(filasCtl.length === 2 && filasCtl.some(x => /BASE SUR DOS.*Devuelto/.test(x)), tag + 'control trimestral de su SUIGE: 2 unidades (una devuelta)', JSON.stringify(filasCtl));
  correos.length = 0; await p.click('[data-recordaru]'); await p.waitForTimeout(1500);
  ok(correos.some(m => /RECORDATORIO · PARTE CECONSEG/.test(m.asunto) && m.to.includes('i:0#.w|et\\jefex')), tag + '«Recordar» escribe a quien envió partes de esa unidad', JSON.stringify(correos.map(m => [m.asunto, m.to])));
  ok(errs.length === 0, tag + 'sin errores de página (SUIGE)', errs.join(' | '));
  await c.close();

  // 4. DIACU e IGE (mismo grupo): DIACU informa a IGE e IGE cierra
  ({ b: c, p, errs } = await abrir(b, 30, { verbose }));
  await tab(p, 'pendientes'); await p.click('.inc[data-id="1"]'); await p.waitForTimeout(800);
  await p.selectOption('#vDiacu', 'REGULAR'); await p.click('[data-acc=diacuIge]'); await p.waitForTimeout(2500);
  ok(partes()[0].ESTADO === 'REMITIDO A IGE' && partes()[0].VALORACIONDIACU === 'REGULAR', tag + 'DIACU valora: REMITIDO A IGE');
  await p.selectOption('#vIge', 'BIEN'); await p.fill('#oIge', 'Conforme'); correos.length = 0;
  await p.click('[data-acc=igeCerrar]'); await p.waitForTimeout(2500);
  ok(partes()[0].ESTADO === 'CERRADO' && partes()[0].VALORACIONIGE === 'BIEN' && correos.some(m => /CERRADO/.test(m.asunto) && m.to.includes('i:0#.w|et\\jefex')), tag + 'IGE valora y cierra; aviso a la unidad');
  ok(/Historial del expediente/.test(await texto(p)) && /INFORMADO A DIACU/.test(await texto(p)), tag + 'la ficha enseña el historial');
  await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300);
  if (!verbose) { await tab(p, 'panel'); await p.setViewportSize({ width: 1300, height: 1000 }); await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: false }); }
  // Estadísticas e informe
  await tab(p, 'estadisticas');
  await p.selectOption('#eAnio', ''); await p.waitForTimeout(300); await p.selectOption('#eTrim', ''); await p.waitForTimeout(300);
  const tot = await p.$$eval('#vista table.t tr', t => t.map(x => [...x.cells].map(c => c.textContent.trim()).join(' ')).find(x => /TOTAL/.test(x)) || '');
  ok(/TOTAL 1 20 15 2 3 15 0 75 % 0 1 19 95 % 20 1/.test(tot), tag + 'estadísticas por SUIGE (solo partes enviados): ' + tot);
  // Informe detallado (como Incidentes): desde Estadísticas con el mismo periodo
  await p.click('[data-iest]'); await p.waitForTimeout(500);
  ok(await p.$eval('#tabs a.on', a => a.dataset.v) === 'informe' && await p.$eval('#iAnio', s => s.value) === '' && await p.$eval('#iTrim', s => s.value) === '', tag + '«Informe detallado» abre su pestaña con el periodo de Estadísticas');
  let inf = (await p.textContent('#vista .inf')).replace(/\s+/g, ' ');
  ok(/Resumen general/.test(inf) && /HPS concedida\s*75 %/.test(inf) && /Unidades con operadores sin HPS de servicio\s*1/.test(inf), tag + 'resumen con indicadores (75 % HPS, 1 unidad con operadores sin HPS de servicio)', inf.slice(0, 400));
  ok(/Comparativa por SUIGE/.test(inf) && /Situación de las HPS/.test(inf) && /Valoración de IGE/.test(inf) && /menor % de HPS concedida/.test(inf) && /Huecos y justificación/.test(inf) && /acompañados/.test(inf), tag + 'comparativa, gráficos, ranking y huecos en pantalla');
  ok((await p.$$('#vista .inf .apil, #vista .inf .inf-barra')).length >= 5, tag + 'con gráficos de barras');
  if (!verbose) { await p.setViewportSize({ width: 1300, height: 1500 }); await p.screenshot({ path: new URL('informe.png', import.meta.url).pathname, fullPage: false }); }
  await p.selectOption('#iAgr', 'unidad'); await p.waitForTimeout(400); await p.check('[data-isec="detalle"]'); await p.waitForTimeout(400);
  inf = await p.textContent('#vista .inf');
  ok(/Comparativa por unidad/.test(inf) && /Detalle de cada parte/.test(inf), tag + 'se puede agrupar por unidad y añadir el detalle de cada parte');
  await p.check('[data-isec="historial"]'); await p.waitForTimeout(300);
  const [w] = await Promise.all([c.waitForEvent('page'), p.click('[data-iimp]')]); await w.waitForLoadState(); await w.waitForTimeout(500);
  const tw = await w.textContent('body');
  ok(/INFORME DE OPERADORES CECONSEG/.test(await w.textContent('.banda')) && /Por unidad/.test(tw), tag + 'informe para imprimir / PDF con la cabecera oficial');
  ok(/Huecos y justificación/.test(tw) && /acompañados/.test(tw) && /Historial del expediente/.test(tw) && /INFORMADO A DIACU/.test(tw), tag + 'el informe impreso trae huecos, motivos, detalle e historial');
  await w.close();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-icsv]')]);
  const csvTxt = require('fs').readFileSync(await dl.path(), 'utf8');
  ok(/ACUARTELAMIENTO X/.test(csvTxt) && /% HPS concedida/.test(csvTxt) && /acompañados/.test(csvTxt), tag + 'Excel (CSV) del informe con los grupos y los partes');
  ok(errs.length === 0, tag + 'sin errores de página (IGE)', errs.join(' | '));
  await c.close();

  // 5. Periodicidad abierta: el administrador la pasa a SEMESTRAL
  ({ b: c, p, errs } = await abrir(b, 1, { verbose, admin: true }));
  await tab(p, 'ajustes'); await p.selectOption('#aPer', 'SEMESTRAL'); await p.click('[data-guardarcfg]'); await p.waitForTimeout(1500);
  ok(/Configuración CECONSEG: \{"periodicidad":"SEMESTRAL"\}/.test(LP.info.Description || ''), tag + 'guarda la periodicidad en la descripción de la lista', LP.info.Description);
  await p.click('#nuevo'); await p.waitForTimeout(1200);
  const opsT = await p.$$eval('[name=tipo] option', o => o.map(x => x.value).filter(Boolean)), opsP = await p.$$eval('[name=trim] option', o => o.map(x => x.value).filter(Boolean));
  ok(opsT.join() === 'SEMESTRAL,EXTRAORDINARIO' && opsP.join() === 'S1,S2', tag + 'el formulario ofrece semestral y los periodos S1/S2', opsT + ' / ' + opsP);
  await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await p.waitForTimeout(300); await tab(p, 'control');
  ok(/^S[12]$/.test(await p.$eval('#cTrim', s => s.value)) && /ACUARTELAMIENTO X/.test(await texto(p)), tag + 'el control de entregas va por semestres');
  ok(errs.length === 0, tag + 'sin errores de página (periodicidad)', errs.join(' | '));
  await c.close();

  // 6. Sin acceso: formulario de solicitud
  ({ b: c, p, errs } = await abrir(b, 40, { verbose }));
  ok(/No tienes acceso/.test(await texto(p)) && !!(await p.$('[data-accsolicitar]')), tag + 'sin acceso: formulario de solicitud de acceso');
  ok(errs.length === 0, tag + 'sin errores de página (sin acceso)', errs.join(' | '));
  await c.close();
  await b.close();
}
// Listas creadas con la versión anterior (MN1, MN2, MN3 guardadas por SharePoint como _x004d_N1…): «Crearlas» las arregla
async function actualizacion() {
  const tag = '[actualización] ';
  console.log('\n== Listas de la versión anterior ==');
  servidor();
  const b = await chromium.launch();
  let { b: c, p, errs } = await abrir(b, 1, { verbose: false, admin: true });
  await p.click('[data-preparar]'); await p.waitForTimeout(2500); await tab(p, 'ajustes'); await p.click('[data-crearuni]'); await p.waitForTimeout(2000);
  await c.close();
  const LP = lista('CECONSEG OPERADORES'), LU = lista('CECONSEG UNIDADES');
  LP.campos = LP.campos.filter(f => !/^NOMBRE\dN$/.test(f.InternalName)).concat(['_x004d_N1', '_x004d_N2', '_x004d_N3'].map(n => ({ InternalName: n, TypeAsString: 'Text' })));
  LU.campos = LU.campos.filter(f => f.InternalName !== 'NOMBRE2N').concat([{ InternalName: '_x004d_N2', TypeAsString: 'Text' }]);
  ({ b: c, p, errs } = await abrir(b, 1, { verbose: false, admin: true }));
  await tab(p, 'ajustes');
  let t = await texto(p);
  ok(/le faltan 3 columnas: NOMBRE1N, NOMBRE2N, NOMBRE3N/.test(t) && /«CECONSEG UNIDADES» le faltan 1 columnas: NOMBRE2N/.test(t), tag + 'avisa de las columnas que faltan en las dos listas (y la de unidades se ve, no «falta la lista»)');
  await p.click('[data-crearuni]'); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('[data-preparar]').click()); await p.waitForTimeout(2500); await tab(p, 'ajustes');
  t = await texto(p);
  ok(/✔ Lista «CECONSEG OPERADORES» con todas sus columnas/.test(t) && /✔ Lista «CECONSEG UNIDADES» de unidades obligadas/.test(t) && lista('CECONSEG UNIDADES') === LU, tag + '«Crearlas» deja las dos listas completas sin crear otra lista', t.slice(0, 300));
  ok(['NOMBRE1N', 'MANDO3N', 'NUMEROOPERADORES', 'ESTADO'].every(n => (LP.vista || []).includes(n)) && (LU.vista || []).includes('NOMBRE2N'), tag + 'las columnas se ponen en la vista de la lista (se ven al abrirla en SharePoint)', JSON.stringify([LP.vista, LU.vista]));
  await p.evaluate(() => document.querySelectorAll('#oblCaja details').forEach(d => { d.open = true; })); await p.check('[data-obl="1"]'); await p.click('[data-oblguardar]'); await p.waitForTimeout(1500);
  ok(LU.items.length === 1 && LU.items[0].NOMBRE2N === 'SUIGESUR', tag + 'después guarda las unidades obligadas', JSON.stringify(LU.items));
  // Con solo ACUARTELAMIENTO X obligada, el formulario solo ofrece esa unidad (y su mando)
  await p.evaluate(() => location.reload()); await p.waitForTimeout(2500); await p.click('#nuevo'); await p.waitForTimeout(1200);
  const o2 = await p.$$eval('[name=m2] option', o => o.map(x => x.textContent).filter(x => !/Seleccionar/.test(x)));
  await p.selectOption('[name=m2]', '1'); await p.waitForTimeout(200);
  const o3 = await p.$$eval('[name=m3] option', o => o.map(x => x.textContent).filter(x => !/Seleccionar/.test(x)));
  ok(o2.join() === 'SUIGESUR' && o3.join() === 'ACUARTELAMIENTO X' && /Solo salen las 1 unidades obligadas/.test(await p.textContent('#fCadena')), tag + 'el formulario solo ofrece las unidades obligadas', o2 + ' / ' + o3);
  ok(errs.length === 0, tag + 'sin errores de página', errs.join(' | '));
  await c.close(); await b.close();
}
await escenario(false);
await escenario(true);
await actualizacion();
console.log(fallos ? '\nHAY FALLOS (' + fallos + ')' : '\nTODO BIEN');
process.exit(fallos ? 1 : 0);
