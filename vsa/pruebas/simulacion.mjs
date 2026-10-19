// Prueba de vsa.html contra una lista «CUESTIONARIO DE CALIDAD VSA» simulada (datos inventados).
// Uso: node vsa/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../vsa.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const YO = { Id: 50, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' };
const P = { 61: { Id: 61, Title: 'JEFE BAE A', EMail: 'baea@et.mde.es' }, 62: { Id: 62, Title: 'JEFE BAE B', EMail: 'baeb@et.mde.es' } };
const GRUPOS = { SEGURIDAD_SUIGESUR: 101, SEGURIDAD_SUIGENOR: 102, SEGURIDAD_IGE: 105, 'Integrantes de la Colaborativo': 106 };
const MIEMBROS = { 'Propietarios Colaborativo': ['admin1@et.mde.es'], SEGURIDAD_SUIGESUR: ['sur1@et.mde.es'], SEGURIDAD_SUIGENOR: ['nor1@et.mde.es'], SEGURIDAD_IGE: ['ige1@et.mde.es'] };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(9, 0, 0, 0); return x.toISOString(); };
const RESP = Array.from({ length: 24 }, (_, i) => (i + 1 === 9 || i + 1 === 14 || i + 1 === 17 ? 'RES_' : 'RESP_') + (i + 1));
const OBS = Array.from({ length: 24 }, (_, i) => 'OBS_' + (i + 1));
const NOTAS = ['4 Muy Bien', '3 Bien', '2 Mejorable', '1 Muy Mejorable', '0 No Observado'];
const AUXL = {
  M1N: [{ Id: 1, Title: 'IGE' }, { Id: 2, Title: 'OTRO' }],
  M2N: [{ Id: 1, Title: 'SUIGESUR', ID_M1NId: 1 }, { Id: 2, Title: 'SUIGENOR', ID_M1NId: 1 }, { Id: 3, Title: 'OFICINA X', ID_M1NId: 1 }],
  M3N: [{ Id: 1, Title: 'BAE SEVILLA', M2NId: 1 }, { Id: 2, Title: 'BAE LEON', M2NId: 2 }, { Id: 3, Title: 'BAE SIN SUIGE', M2NId: 3 }],
};
let seg = 2, sols, accLista = true, accAbierta = true, accCerrada = false, propios = true, grupoBae = true, baeMiembros, anadidos, items, misGrupos = [], admin = false, sinSubstringof = false, faltaCampo = null, ultimoFiltro = '', lecturaMinima = '';
const base = { Title: '01/10/2026', ESTADO: 'BORRADOR', VALORACIONSUIGE: null, REGISTRODEACTIVIDAD: '', ModificadoPorTEXTO: '', A_x00f1_o: '2026', EMPRESA0: 'EULEN', NOVEDADES: 'SIN NOVEDAD',
  MANDO1N: '1', MANDO2N: '1', MANDO3N: '1', M1N: 'IGE', M2N: 'SUIGESUR', M3N: 'BAE SEVILLA', suige: 'SUIGESUR', Observaciones: '', ControlDeRegistro: '',
  ResponsableDeLaInformacion: P[61], NegSeg: null, PersonalVisibilidad: [], ...Object.fromEntries(RESP.map(k => [k, '3 Bien'])), ...Object.fromEntries(OBS.map(k => [k, ''])) };
const nor = { MANDO2N: '2', MANDO3N: '2', M2N: 'SUIGENOR', M3N: 'BAE LEON', suige: 'SUIGENOR' };
const nuevoStore = () => {
  sols = [{ Id: 1, Title: 'JEFE BAE B', Solicitante: P[62], Correo: P[62].EMail, Empleo: 'CAPITAN', MandoSegundo: 'SUIGENOR', Unidad: 'BAE LEON', Telefono: '600', Papel: 'Responsable de BAE (cumplimentar el cuestionario)', Motivo: 'Responsable del contrato', Aplicacion: 'VSA', EstadoSolicitud: 'PENDIENTE', Created: d(-1), Modified: d(-1) }];
  baeMiembros = [{ Id: 61, Title: P[61].Title, Email: P[61].EMail, LoginName: 'i:0#.w|et\\jefea' }]; anadidos = [];
  items = [
    { Id: 1, ESTADO: 'ENVIADO', EMPRESA0: 'EULEN', RESP_3: '1 Muy Mejorable', OBS_3: 'Vehículo con más de 5 años', RESP_5: '2 Mejorable', Created: d(-9), Author: P[61] },
    { Id: 2, ESTADO: 'ENVIADO', VALORACIONSUIGE: 'ELEVADO A DIACU', ...nor, EMPRESA0: 'SECURITAS', NOVEDADES: 'CON NOVEDAD', Created: d(-20), Author: P[62], ResponsableDeLaInformacion: P[62] },
    { Id: 3, ESTADO: 'CERRADO', VALORACIONSUIGE: 'CERRADO', EMPRESA0: 'PROSEGUR', Created: d(-40), Author: P[61], ...Object.fromEntries(RESP.map(k => [k, '4 Muy Bien'])) },
    { Id: 4, ESTADO: 'BORRADOR', Created: d(-1), Author: YO, ResponsableDeLaInformacion: YO },
    { Id: 5, ESTADO: 'ENVIADO', ...nor, Created: d(-3), Author: P[62], ResponsableDeLaInformacion: P[62] },
    { Id: 6, ESTADO: 'ENVIADO', ...nor, Created: d(-4), Author: P[62], ResponsableDeLaInformacion: P[62], PersonalVisibilidad: [YO] },
  ].map(x => ({ ...base, Modified: d(-1), Editor: { Id: 61, Title: 'JEFE BAE A' }, Attachments: false, ...x }));
};
const quien = id => id === YO.Id ? YO : P[id] || { Id: id, Title: 'Usuario ' + id };
const personasDe = c => {
  if ('ResponsableDeLaInformacionId' in c) c.ResponsableDeLaInformacion = c.ResponsableDeLaInformacionId ? quien(c.ResponsableDeLaInformacionId) : null;
  if ('NegSegId' in c) c.NegSeg = c.NegSegId ? quien(c.NegSegId) : null;
  if ('PersonalVisibilidadId' in c) c.PersonalVisibilidad = (c.PersonalVisibilidadId && c.PersonalVisibilidadId.results ? c.PersonalVisibilidadId.results : c.PersonalVisibilidadId ? [c.PersonalVisibilidadId] : []).map(quien);
  return c;
};
const cumple = (it, filtro) => filtro.split(' or ').some(c => {
  let m;
  if ((m = c.match(/\(PersonalVisibilidad\/Id eq (\d+)\)/))) return (it.PersonalVisibilidad || []).some(g => g.Id === +m[1]);
  if ((m = c.match(/\((\w+)Id eq (\d+)\)/))) return it[m[1]] && it[m[1]].Id === +m[2];
  if ((m = c.match(/substringof\('([^']+)',(\w+)\)/))) return String(it[m[2]] || '').includes(m[1]);
  if ((m = c.match(/\(Id eq (\d+)\)/))) return it.Id === +m[1];
  return false;
});
async function prueba(verbose, escenario) {
  nuevoStore();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('vsa-calidad-ige', JSON.stringify({ agrupar: '' })); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [];
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) { if (/\.png$/.test(u)) return r.fulfill({ status: 404, body: '' }); return r.fulfill({ body: html, contentType: 'text/html' }); }
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) return r.fulfill({ json: { d: {} } });
      if (resto.startsWith("web/lists/getbytitle('SOLICITUDES DE ACCESO')")) {
        if (resto.includes('createfieldasxml')) return r.fulfill({ json: { d: {} } });
        if (resto.includes('breakroleinheritance')) { propios = true; return r.fulfill({ status: 200, json: { d: {} } }); }
        const ra = resto.match(/addroleassignment\(principalid=(\d+),roledefid=(\d+)\)/);
        if (ra) { if (+ra[1] === 7 && +ra[2] === 1073741827) accAbierta = true; return r.fulfill({ status: 200, json: { d: {} } }); }
        const ms = resto.match(/items\((\d+)\)/);
        const c = JSON.parse(req.postData()); delete c.__metadata;
        if (ms) { Object.assign(sols.find(x => x.Id === +ms[1]), c, c.ResueltoPorId ? { ResueltoPor: quien(c.ResueltoPorId) } : {}); return r.fulfill({ status: 204, body: '' }); }
        if (resto.endsWith('/items')) { const it = { Id: sols.length + 1, ...c, Solicitante: quien(c.SolicitanteId), Created: new Date().toISOString() }; sols.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } }); }
        if (c.ReadSecurity === 2) seg = 2;
        return r.fulfill({ status: 204, body: '' });
      }
      if (resto === 'web/ensureuser') return r.fulfill({ json: { d: { Id: 8 } } });
      if (resto === 'web/lists') { accAbierta = false; propios = false; accLista = true; sols = []; return r.fulfill({ status: 201, json: { d: { Id: 'x' } } }); }
      if (resto === 'web/sitegroups') { grupoBae = true; baeMiembros = []; return r.fulfill({ status: 201, json: { d: { Id: 999 } } }); }
      const gu = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users(\/removebyid\((\d+)\))?/);
      if (gu) { if (gu[3]) baeMiembros = baeMiembros.filter(x => x.Id !== +gu[3]); else anadidos.push({ grupo: gu[1], login: JSON.parse(req.postData()).LoginName }); return r.fulfill({ status: 200, json: { d: {} } }); }
      const mi = resto.match(/items\((\d+)\)/);
      if (mi) {
        const it = items.find(x => x.Id === +mi[1]);
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
        const c = personasDe(JSON.parse(req.postData())); delete c.__metadata; Object.assign(it, c, { Modified: new Date().toISOString(), Editor: { Id: YO.Id, Title: YO.Title } });
        return r.fulfill({ status: 204, body: '' });
      }
      if (resto.endsWith('/items')) {
        const c = personasDe(JSON.parse(req.postData())); delete c.__metadata;
        const it = { ...base, Id: Math.max(...items.map(x => x.Id)) + 1, Created: new Date().toISOString(), Modified: new Date().toISOString(), Author: YO, Editor: YO, Attachments: false, ...c };
        items.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } });
      }
      return r.fulfill({ status: 400, body: '' });
    }
    if (resto.startsWith('web/currentuser/groups')) return J({ value: misGrupos.map(n => ({ Id: GRUPOS[n], Title: n })) });
    if (resto.startsWith('web/currentuser')) return J({ Id: YO.Id, Title: YO.Title, Email: YO.EMail, LoginName: 'i:0#.w|et\\usuario' });
    if (resto.startsWith('SP.UserProfiles.PeopleManager/GetMyProperties')) return J({ DisplayName: YO.Title, Title: 'COMANDANTE', UserProfileProperties: verbose ? { results: [{ Key: 'Department', Value: 'NEGOCIADO X' }] } : [{ Key: 'Department', Value: 'NEGOCIADO X' }] });
    const gid = resto.match(/web\/getuserbyid\((\d+)\)/);
    if (gid) return J({ LoginName: 'i:0#.w|et\\usuario' + gid[1] });
    if (resto.startsWith('web/sitegroups?')) return J({ value: Object.keys(GRUPOS).concat(grupoBae ? ['VSA_BAE'] : []).map((t, i) => ({ Id: i + 1, Title: t })) });
    if (resto.startsWith("web/sitegroups/getbyname('VSA_BAE')/users")) return grupoBae ? J({ value: baeMiembros }) : r.fulfill({ status: 404, body: '' });
    const asig = (todos) => J({ value: [{ PrincipalId: 3, Member: { Id: 3, Title: 'Propietarios Colaborativo', LoginName: 'Propietarios Colaborativo' }, RoleDefinitionBindings: verbose ? { results: [{ RoleTypeKind: 5, Name: 'Control total' }] } : [{ RoleTypeKind: 5, Name: 'Control total' }] }]
      .concat(todos ? [{ PrincipalId: 7, Member: { Id: 7, Title: 'ET\\Usuarios del dominio', LoginName: 'c:0+.w|s-1-5-21-513' }, RoleDefinitionBindings: verbose ? { results: [{ RoleTypeKind: todos, Name: 'x' }] } : [{ RoleTypeKind: todos, Name: 'x' }] }] : []) });
    if (resto.startsWith('web/roleassignments')) return asig(2);
    if (resto.startsWith('web/roledefinitions/getbytype(3)')) return J({ Id: 1073741827 });
    if (resto.startsWith("web/lists/getbytitle('SOLICITUDES DE ACCESO')/roleassignments")) return asig(accAbierta ? 3 : 0);
    if (resto.startsWith("web/lists/getbytitle('SOLICITUDES DE ACCESO')")) {
      if (accCerrada) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
      if (resto.includes('HasUniqueRoleAssignments')) return J({ HasUniqueRoleAssignments: propios });
      if (!accLista) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
      if (!resto.includes('/items')) return J({ Id: 'a', Title: 'SOLICITUDES DE ACCESO', ListItemEntityTypeFullName: 'SP.Data.SOLICITUDESItem', ReadSecurity: seg, WriteSecurity: seg });
      const fs_ = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      const me = fs_.match(/SolicitanteId eq (\d+)/);
      return J({ value: sols.filter(x => !me || x.Solicitante.Id === +me[1]) });
    }
    const g = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users/);
    if (g) return MIEMBROS[g[1]] ? J({ value: MIEMBROS[g[1]].map(e => ({ Email: e })) }) : r.fulfill({ status: 404, body: '' });
    const mi = resto.match(/items\((\d+)\)/);
    if (mi) { const it = items.find(x => x.Id === +mi[1]); return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, ...it } } }); }
    const aux = resto.match(/getbytitle\('(M1N|M2N|M3N)'\)\/items/);
    if (aux) return J({ value: AUXL[aux[1]] });
    if (resto.startsWith('web/siteusers')) return J({ value: [YO, ...Object.values(P)].map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail })) });
    if (resto.includes("getbytitle('CUESTIONARIO DE CALIDAD VSA')/fields")) {
      const ch = a => verbose ? { results: a } : a;
      if (resto.includes('TypeAsString')) return J({ value: [{ InternalName: 'PersonalVisibilidad', EntityPropertyName: 'PersonalVisibilidad', TypeAsString: 'UserMulti' }] });
      return J({ value: [{ InternalName: 'A_x00f1_o', Choices: ch(['2025', '2026']) }, { InternalName: 'EMPRESA0', Choices: ch(['EULEN', 'SECURITAS', 'PROSEGUR']) }, { InternalName: 'NOVEDADES', Choices: ch(['CON NOVEDAD', 'SIN NOVEDAD']) }] });
    }
    if (resto.includes('/items')) {
      const sel = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',').filter(Boolean);
      const exp = ((u.match(/\$expand=([^&]*)/) || [])[1] || '').split(',');
      const malo = sel.find(f => { const [a, b2] = f.split('/'); if (a === faltaCampo) return true; if (b2) return !exp.includes(a); if (/Id$/.test(a) && a !== 'Id') return !(a.slice(0, -2) in base || ['Author', 'Editor'].includes(a.slice(0, -2))); return !(a in base) && !['Id', 'Created', 'Modified', 'Attachments', 'Author', 'Editor'].includes(a); });
      if (malo) return r.fulfill({ status: 400, json: { 'odata.error': { message: { value: "The field or property '" + malo.split('/')[0] + "' does not exist." } } } });
      const filtro = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      ultimoFiltro = filtro;
      if (filtro.includes('substringof') && sinSubstringof) return r.fulfill({ status: 400, body: '' });
      const lista = filtro ? items.filter(it => cumple(it, filtro)) : items;
      if (!sel.includes('Title')) {
        lecturaMinima = sel.join(',');
        return J({ value: lista.map(it => { const o = {}; sel.forEach(k => { if (k === 'PersonalVisibilidad/Id') o.PersonalVisibilidad = it.PersonalVisibilidad.map(x => ({ Id: x.Id })); else if (/Id$/.test(k) && k !== 'Id') o[k] = it[k.slice(0, -2)] ? it[k.slice(0, -2)].Id : null; else o[k] = it[k]; }); return o; }) });
      }
      return J({ value: verbose ? lista.map(it => ({ ...it, PersonalVisibilidad: { results: it.PersonalVisibilidad } })) : lista });
    }
    if (resto.includes("getbytitle('CUESTIONARIO DE CALIDAD VSA')")) return J({ Id: 'g', Title: 'CUESTIONARIO DE CALIDAD VSA', ListItemEntityTypeFullName: 'SP.Data.PARTES_x0020_VSAListItem',
      EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x2000BFF : 0x7) }, DefaultNewFormUrl: WEB + '/Lists/PARTES VSA/NewForm.aspx', DefaultEditFormUrl: WEB + '/Lists/PARTES VSA/EditForm.aspx', DefaultDisplayFormUrl: WEB + '/Lists/PARTES VSA/DispForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = (verbose ? '[verbose] ' : '[ligero] ') + escenario;
  const correos = () => posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties);
  const merge = id => { const m = posts.filter(x => new RegExp('items\\(' + id + '\\)').test(x.ruta) && x.cab['x-http-method'] === 'MERGE').pop(); return m && JSON.parse(m.cuerpo); };
  await p.goto(O + '/et/jige/colaborativo/Documentos/vsa.html'); await p.waitForTimeout(900);
  if (escenario.startsWith('sin acceso')) {
    console.log(tag, '| pestañas:', await p.$$eval('#tabs a', a => a.length), '| nuevo visible:', await p.$eval('#nuevo', b => !b.hidden), '| pantalla:', (await p.textContent('#vista h3')).trim());
    if (escenario !== 'sin acceso') { console.log(tag, '| aviso:', (await p.textContent('#vista .aviso')).slice(0, 110), '| errores:', errs); await b.close(); return; }
    console.log(tag, '| propuesto: empleo', await p.$eval('#fAcceso [name=empleo]', s => s.value), '· unidad', await p.$eval('#fAcceso [name=unidadTxt]', i => i.value));
    await p.click('[data-accsolicitar]'); await p.waitForTimeout(100);
    console.log(tag, '| solicitar vacío:', await p.textContent('#accErr'));
    await p.selectOption('#fAcceso [name=m2]', '1'); await p.selectOption('#fAcceso [name=m3]', '1'); await p.selectOption('#fAcceso [name=papel]', { index: 1 });
    await p.fill('#fAcceso [name=tel]', '912345678'); await p.fill('#fAcceso [name=motivo]', 'Responsable del contrato en la BAE');
    posts.length = 0; await p.click('[data-accsolicitar]'); await p.waitForTimeout(1200);
    const alta = JSON.parse(posts.find(x => x.ruta.includes("SOLICITUDES DE ACCESO')/items")).cuerpo), m = correos().pop();
    console.log(tag, '| solicitud:', JSON.stringify({ Title: alta.Title, Sol: alta.SolicitanteId, Empleo: alta.Empleo, Mando: alta.MandoSegundo, Unidad: alta.Unidad, Papel: alta.Papel, App: alta.Aplicacion, Estado: alta.EstadoSolicitud }), '| correo:', m && m.Subject);
    console.log(tag, '| después:', (await p.textContent('#vista .okmsg')).slice(0, 90), '| errores:', errs);
    if (!verbose) await p.screenshot({ path: new URL('sin-acceso.png', import.meta.url).pathname, fullPage: true });
    await b.close(); return;
  }
  if (escenario === 'seguridad') {
    await p.click('#tabs a[data-v=accesos]'); await p.waitForTimeout(700);
    const t = async () => (await p.textContent('#vista .card p')).replace(/\s+/g, ' ').slice(0, 90);
    const antes = await t(); await p.click('[data-accseguridad]'); await p.waitForTimeout(900);
    console.log(tag, '| antes:', antes, '| después:', await t(), '| errores:', errs);
    await b.close(); return;
  }
  if (escenario === 'abrir') {
    await p.click('#tabs a[data-v=accesos]'); await p.waitForTimeout(700);
    const antes = (await p.textContent('#vista .card')).replace(/\s+/g, ' ').match(/[✔✕] (Cualquiera|Los usuarios)[^.]*/)[0];
    posts.length = 0; await p.click('[data-accabrir]'); await p.waitForTimeout(900);
    const despues = (await p.textContent('#vista .card')).replace(/\s+/g, ' ').match(/[✔✕] (Cualquiera|Los usuarios)[^.]*/)[0];
    console.log(tag, '| antes:', antes, '| POST:', posts.filter(x => x.ruta !== 'contextinfo').map(x => x.ruta.split('/').pop()).join(' ; '), '| después:', despues, '| errores:', errs);
    await b.close(); return;
  }
  if (escenario === 'accesos' || escenario === 'preparación') {
    await p.click('#tabs a[data-v=accesos]'); await p.waitForTimeout(700);
    if (escenario === 'preparación') {
      console.log(tag, '| preparación:', (await p.textContent('#vista .card')).replace(/\s+/g, ' ').slice(0, 160));
      posts.length = 0; await p.click('[data-acccrearlista]'); await p.waitForTimeout(1500);
      console.log(tag, '| crear lista:', posts.filter(x => x.ruta.includes('createfieldasxml')).length, 'columnas ·', !!posts.find(x => x.ruta === 'web/lists'), '· seguridad', !!posts.find(x => /ReadSecurity/.test(x.cuerpo)), '· abierta', !!posts.find(x => /addroleassignment/.test(x.ruta)));
      await p.click('[data-acccreargrupo]'); await p.waitForTimeout(1000);
      console.log(tag, '| tras crear:', (await p.textContent('#vista .card')).replace(/\s+/g, ' ').slice(0, 260), '| errores:', errs);
      await b.close(); return;
    }
    console.log(tag, '| pestaña Accesos:', await p.textContent('#tabs a[data-v=accesos]'), '| pendiente:', (await p.textContent('[data-sol]')).replace(/\s+/g, ' ').slice(0, 150), '| grupo propuesto:', await p.$eval('.accGrupo', s => s.value));
    await p.click('[data-accdenegar]'); await p.waitForTimeout(150);
    console.log(tag, '| denegar sin motivo:', await p.textContent('.accMsg'));
    posts.length = 0; await p.click('[data-accaprobar]'); await p.waitForTimeout(1500);
    const m = correos().pop(), mg = posts.find(x => x.ruta.includes("SOLICITUDES DE ACCESO')/items(1)"));
    console.log(tag, '| aprobar:', JSON.stringify(anadidos), '|', mg && JSON.parse(mg.cuerpo).EstadoSolicitud, '| correo a:', m && m.To.results, m && m.Subject);
    console.log(tag, '| tras aprobar:', await p.$$eval('[data-sol]', n => n.length), 'pendientes ·', await p.$$eval('[data-accquitar]', n => n.length), 'miembros');
    p.once('dialog', dd => dd.accept());
    await p.click('[data-accquitar]'); await p.waitForTimeout(1200);
    console.log(tag, '| quitar:', await p.$$eval('[data-accquitar]', n => n.length), 'miembros · correo:', correos().pop().Subject, '| errores:', errs);
    if (!verbose) await p.screenshot({ path: new URL('accesos.png', import.meta.url).pathname, fullPage: true });
    await b.close(); return;
  }
  if (escenario === 'columna inexistente') { console.log(tag, '| carga:', await p.textContent('#estadoCarga'), '| aviso:', await p.textContent('#vista .aviso').catch(() => 'ninguno'), '| errores:', errs); await b.close(); return; }
  console.log(tag, '| pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')), '| filtro:', ultimoFiltro ? 'con filtro' : 'ninguno (ve todo)');
  console.log(tag, '| panel:', (await p.$$eval('.kpi', k => k.map(x => x.textContent.replace(/([\d,—]+)$/, ':$1')))).join(' · '));
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, '| pendientes:', (await p.$$eval('#vista .sec', s => s.map(x => x.textContent.replace(/(\d+)$/, ' = $1')))).join(' · '), '| ids:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).join(',')));
  if (escenario !== 'control total') {
    await p.click('#tabs a[data-v=consulta]'); await p.waitForTimeout(200);
    console.log(tag, '| ve:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).sort().join(',')), lecturaMinima ? '| lectura mínima: ' + lecturaMinima : '', '| errores:', errs);
    await b.close(); return;
  }
  // 1) SUIGE valora el 1: sin observaciones (error), en curso, después cerrado
  await p.click('#tabs a[data-v=consulta]'); await p.click('.inc[data-id="1"]'); await p.waitForTimeout(500);
  console.log(tag, '| ficha 1:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '), '| paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')), '| preguntas:', await p.$$eval('table.cuest tbody tr', r => r.length));
  await p.click('[data-acc=valorar]'); await p.waitForTimeout(150);
  console.log(tag, '| valorar sin observaciones:', await p.textContent('#accMsg'));
  await p.selectOption('#vSel', 'ELEVADO A DIACU'); await p.fill('#vTxt', 'Deficiencias en vehículos: se eleva.'); posts.length = 0;
  await p.click('[data-acc=valorar]'); await p.waitForTimeout(1300);
  let c = merge(1), m = correos().pop();
  console.log(tag, '| elevar:', JSON.stringify({ ESTADO: c.ESTADO, VS: c.VALORACIONSUIGE, NegSeg: c.NegSegId, Obs: (c.Observaciones || '').replace(/<[^>]+>/g, ' ').slice(-60) }), '| correo a:', m.To.results, 'cc', m.CC.results, '|', m.Subject);
  if (!verbose) fs.writeFileSync(new URL('correo.html', import.meta.url), m.Body);
  await p.click('#dlg [data-cerrar]');
  // 2) DIACU cierra el 2
  await p.click('#tabs a[data-v=pendientes]'); await p.click('.inc[data-id="2"]'); await p.waitForTimeout(500);
  await p.fill('#vTxt', 'Conforme. Se archiva.'); posts.length = 0; await p.click('[data-acc=cerrarDiacu]'); await p.waitForTimeout(1300);
  c = merge(2); m = correos().pop();
  console.log(tag, '| DIACU cierra:', JSON.stringify({ ESTADO: c.ESTADO }), '| correo a:', m.To.results, 'cc', m.CC.results, '|', m.Subject);
  await p.click('#dlg [data-cerrar]');
  // 3) SUIGE devuelve el 5 a la BAE (SUIGENOR) y rechaza el 6
  await p.click('#tabs a[data-v=consulta]'); await p.click('.inc[data-id="5"]'); await p.waitForTimeout(500);
  await p.fill('#vTxt', 'Falta la observación de la pregunta 3.'); posts.length = 0; await p.click('[data-acc=devolver]'); await p.waitForTimeout(1300);
  c = merge(5); console.log(tag, '| devolver:', JSON.stringify({ ESTADO: c.ESTADO, VS: c.VALORACIONSUIGE }), '| correo a:', correos().pop().To.results);
  await p.click('#dlg [data-cerrar]'); await p.click('.inc[data-id="6"]'); await p.waitForTimeout(500);
  await p.fill('#vTxt', 'Duplicado.'); await p.click('[data-acc=rechazar]'); await p.waitForTimeout(1300);
  c = merge(6); console.log(tag, '| rechazar:', JSON.stringify({ ESTADO: c.ESTADO, VS: c.VALORACIONSUIGE }));
  await p.click('#dlg [data-cerrar]');
  // 4) Conflicto
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(400);
  items.find(x => x.Id === 1).Modified = new Date(Date.now() + 99999).toISOString();
  await p.fill('#vNota', 'x'); await p.click('[data-acc=anotar]'); await p.waitForTimeout(700);
  console.log(tag, '| conflicto:', await p.textContent('#accMsg'));
  await p.click('#dlg [data-cerrar]');
  // 5) Estadísticas, CSV, impresión
  await p.click('#tabs a[data-v=estadisticas]'); await p.waitForTimeout(300);
  console.log(tag, '| estadísticas:', await p.$$eval('#vista .kpi', k => k.map(x => x.textContent).join(' | ')), '| peores:', (await p.textContent('#vista ol').catch(() => '')).slice(0, 120));
  if (!verbose) await p.screenshot({ path: new URL('estadisticas.png', import.meta.url).pathname, fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-csv]')]);
  const lineas = fs.readFileSync(await dl.path(), 'utf8').split('\r\n');
  console.log(tag, '| CSV:', dl.suggestedFilename(), lineas.length - 1, 'filas,', lineas[0].split(';').length, 'columnas');
  // 6) Nuevo cuestionario: enviar vacío, borrador, completar y enviar
  await p.click('#nuevo'); await p.waitForTimeout(800);
  console.log(tag, '| formulario:', await p.$$eval('#fParte .fsec', n => n.map(x => x.textContent).join(' | ')), '| preguntas:', (await p.$$('#fParte .preg')).length, '| gestor:', await p.textContent('#fGestor'));
  await p.click('#fRemitir'); await p.waitForTimeout(100);
  console.log(tag, '| enviar vacío:', (await p.textContent('#fError')).slice(0, 160));
  await p.selectOption('#fParte [name=novedades]', 'CON NOVEDAD'); await p.selectOption('#fParte [name=m2]', '1'); await p.selectOption('#fParte [name=m3]', '1');
  await p.selectOption('#fParte [name=empresa]', 'EULEN');
  console.log(tag, '| primer nivel:', await p.$eval('#fParte [name=m1]', s => s.options[s.selectedIndex].textContent + (s.disabled ? ' (bloqueado)' : '')), '| cadena:', await p.textContent('#fCadena'));
  for (let i = 0; i < 10; i++) await p.selectOption(`#fParte [name=r${i}]`, NOTAS[i % 2]);
  console.log(tag, '| resumen:', await p.textContent('#fResumen'));
  posts.length = 0; await p.click('#fBorrador'); await p.waitForTimeout(1300);
  const alta = JSON.parse(posts.find(x => x.ruta.endsWith('/items')).cuerpo);
  console.log(tag, '| borrador:', JSON.stringify({ ESTADO: alta.ESTADO, Title: alta.Title, Año: alta.A_x00f1_o, EMP: alta.EMPRESA0, M: [alta.MANDO1N, alta.MANDO2N, alta.MANDO3N], MN: [alta.M1N, alta.M2N, alta.M3N], suige: alta.suige, R1: alta.RESP_1, R9: alta.RES_9, R11: alta.RESP_11, Resp: alta.ResponsableDeLaInformacionId, Vis: alta.PersonalVisibilidadId }));
  await p.click('[data-editar]'); await p.waitForTimeout(800);
  await p.click('#fRemitir'); await p.waitForTimeout(150);
  console.log(tag, '| enviar incompleto:', (await p.textContent('#fError')).slice(0, 160));
  for (let i = 10; i < 24; i++) await p.selectOption(`#fParte [name=r${i}]`, NOTAS[i === 12 ? 2 : 1]);
  p.once('dialog', dd => { console.log(tag, '| aviso mejorables sin observación:', dd.message().slice(0, 90)); dd.accept(); });
  posts.length = 0; await p.click('#fRemitir'); await p.waitForTimeout(1500);
  const nid = items[items.length - 1].Id; c = merge(nid); m = correos().pop();
  console.log(tag, '| enviar:', JSON.stringify({ ESTADO: c.ESTADO, VS: c.VALORACIONSUIGE, R13: c.RESP_13 }), '| correo a:', m && m.To.results, '|', m && m.Subject);
  console.log(tag, '| ahora:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '));
  if (!verbose) await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
  const [fic] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-fichaimp]')]); await fic.waitForLoadState();
  console.log(tag, '| ficha impresa:', await fic.$$eval('h3', h => h.map(x => x.textContent).join(' | ')), (await fic.$$eval('table.r tr', r => r.length)) - 1, 'preguntas');
  await fic.close(); await p.click('#dlg [data-cerrar]');
  await p.click('#nuevo'); await p.waitForTimeout(700);
  if (!verbose) await p.screenshot({ path: new URL('formulario.png', import.meta.url).pathname, fullPage: true });
  console.log(tag, '| errores:', errs);
  await b.close();
}
misGrupos = ['SEGURIDAD_SUIGESUR', 'SEGURIDAD_SUIGENOR', 'SEGURIDAD_IGE']; admin = true; await prueba(false, 'control total'); await prueba(true, 'control total');
misGrupos = ['SEGURIDAD_SUIGESUR']; admin = false; await prueba(false, 'solo SUIGESUR');
sinSubstringof = true; await prueba(true, 'SUIGESUR sin substringof'); sinSubstringof = false;
misGrupos = ['SEGURIDAD_IGE']; await prueba(false, 'solo SEGURIDAD_IGE');
misGrupos = ['VSA_BAE']; await prueba(false, 'responsable de BAE');
misGrupos = []; await prueba(false, 'sin acceso'); await prueba(true, 'sin acceso');
accLista = false; await prueba(false, 'sin acceso y sin lista de solicitudes'); accLista = true;
accCerrada = true; await prueba(true, 'sin acceso, lista sin permiso'); accCerrada = false;
misGrupos = ['SEGURIDAD_IGE']; admin = true; await prueba(false, 'accesos'); await prueba(true, 'accesos');
seg = 0; await prueba(false, 'seguridad'); seg = 0; await prueba(true, 'seguridad'); seg = 2;
accAbierta = false; propios = false; await prueba(false, 'abrir'); accAbierta = false; propios = true; await prueba(true, 'abrir'); accAbierta = true;
accLista = false; grupoBae = false; await prueba(false, 'preparación'); accLista = true; grupoBae = true; admin = false;
faltaCampo = 'NegSeg'; await prueba(true, 'columna inexistente'); faltaCampo = null;
