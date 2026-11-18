// Prueba de cuadrante.html contra un SharePoint simulado (datos inventados), en formato ligero y verbose.
// Uso: node cuadrante/pruebas/simulacion.mjs
//      CUAD_HTML=cuadrante/colabora/cuadrante.html → la copia protegida · PROXY=1 → filtro de la red de Defensa
// El Colabora simulado solo acepta correos a CUENTAS (como el real desde el 17/11/2026): rechaza las direcciones.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const html = fs.readFileSync(process.env.CUAD_HTML || new URL('../cuadrante.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/SUIGESUR/JSUIGE', PAGINA = O + WEB + '/aplicaciones/cuadrante.html';
let fallos = 0;
const comprueba = (txt, ok, extra) => { console.log((ok ? '✔ ' : '✘ ') + txt + (extra && !ok ? ' → ' + extra : '')); if (!ok) fallos++; };

// ---------- Personas ----------
const persona = (Id, Title, c) => ({ Id, Title, EMail: c + '@et.mde.es', Name: 'i:0#.w|et\\' + c });
const GENTE = [persona(7, 'ADMINISTRADOR DEL CUADRANTE', 'asansen'), persona(8, 'GESTORA DEL CUADRANTE', 'gestora'),
  ...[1, 2, 3, 4, 5, 6].map(i => persona(10 + i, 'OFICIAL NUMERO ' + i, 'of' + i)), ...[1, 2, 3, 4, 5, 6].map(i => persona(20 + i, 'SUBOFICIAL NUMERO ' + i, 'sub' + i)),
  persona(40, 'PERSONA SIN ACCESO', 'nuevo'), persona(41, 'COMPONENTE DESDE EL FORMULARIO', 'alta')];
const quien = id => GENTE.find(p => p.Id === Number(id)) || null;

// ---------- Estado del Colabora simulado ----------
let listas, grupos, correos, posts, yoId, admin;
const reiniciar = () => {
  listas = {}; correos = []; posts = [];
  grupos = { 'Propietarios de JSUIGE': [7] };
  crearLista('SOLICITUDES ACCESO APLICACIONES', ['Solicitante', 'Correo', 'Empleo', 'MandoSegundo', 'Unidad', 'Telefono', 'Papel', 'Motivo', 'Aplicacion', 'EstadoSolicitud', 'GrupoAsignado', 'Resolucion', 'ResueltoPor', 'FechaResolucion'], { ReadSecurity: 2, WriteSecurity: 2, Description: 'Lista común' });
};
const crearLista = (t, campos, extra) => { listas[t.toUpperCase()] = { info: { Id: '{' + (Object.keys(listas).length + 1) + 'a}', Title: t, ListItemEntityTypeFullName: 'SP.Data.L' + Object.keys(listas).length + 'ListItem', HasUniqueRoleAssignments: false, ...extra }, campos: campos || [], items: [], n: 0 }; };
const PERSONAS = ['Persona', 'Solicitante', 'ResueltoPor'];
const conPersonas = it => { const x = { ...it }; PERSONAS.forEach(p => { if (x[p + 'Id'] !== undefined) x[p] = quien(x[p + 'Id']); }); return x; };

const verboso = v => {
  if (Array.isArray(v)) return { results: v.map(verboso) };
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = verboso(v[k]); return o; }
  return v;
};

async function abrir(id, esAdmin, verbose, url) {
  yoId = id; admin = esAdmin;
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await ctx.route('**/*', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    const am = u.match(/\/att\/([^/]+)\/(\d+)\/(.+)$/);
    if (am) { const it = listas[am[1]].items.find(x => x.Id === +am[2]); const buf = it && it.__adj && it.__adj[am[3]]; return buf ? r.fulfill({ body: buf, contentType: 'application/pdf' }) : r.fulfill({ status: 404, body: '' }); }
    const J = (obj, st) => r.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(verbose ? { d: verboso(obj.value ? { results: obj.value } : obj) } : obj) });
    if (!u.includes('/_api/')) return r.fulfill({ body: process.env.PROXY ? html.replace(/<\/head>/gi, '<script>/*filtro*/</script></head>') : html, contentType: 'text/html' });
    if (verbose && req.method() === 'GET' && /nometadata/.test(req.headers().accept || '')) return r.fulfill({ status: 406, body: '' });
    const resto = u.split('/_api/')[1], lm = resto.match(/getbytitle\('([^']+)'\)/), L = lm && listas[lm[1].toUpperCase()];
    const NO = () => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { message: { value: 'List does not exist' } } }) });
    if (req.method() === 'POST') {
      let c = {}; try { c = JSON.parse(req.postData() || '{}'); } catch (e) { c = {}; } posts.push({ ruta: resto, cuerpo: c, cab: req.headers() });
      if (resto === 'contextinfo') return J({ GetContextWebInformation: { FormDigestValue: 'D', FormDigestTimeoutSeconds: 1800 } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = c.properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
        if (dest.some(x => /@/.test(x))) return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: { value: 'No se puede enviar el correo electrónico. Asegúrese de que tenga un destinatario válido.' } } }) });
        correos.push({ to: dest, asunto: pr.Subject, cuerpo: pr.Body }); return J({});
      }
      if (resto === 'web/ensureuser') { const v = String(c.logonName).toLowerCase(); const pe = GENTE.find(x => x.EMail === v || x.Name.toLowerCase() === v || x.Name.toLowerCase().endsWith('|' + v)); return pe ? J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }) : r.fulfill({ status: 404, body: '{}' }); }
      if (resto === 'web/lists') { crearLista(c.Title, [], { Description: c.Description }); return J({ Id: 'x' }, 201); }
      if (resto === 'web/sitegroups') { grupos[c.Title] = []; return J({ Id: 900 + Object.keys(grupos).length, Title: c.Title, OnlyAllowMembersViewMembership: c.OnlyAllowMembersViewMembership }, 201); }
      const gm = resto.match(/^web\/sitegroups\/getbyname\('([^']+)'\)\/users(\/removebyid\((\d+)\))?$/);
      if (gm) { const g = grupos[gm[1]]; if (!g) return NO(); if (gm[3]) grupos[gm[1]] = g.filter(x => x !== Number(gm[3])); else { const pe = GENTE.find(x => x.Name === c.LoginName); if (pe && !g.includes(pe.Id)) g.push(pe.Id); } return J({}); }
      if (L) {
        if (/fields\/createfieldasxml/.test(resto)) { L.campos.push(/Name="([^"]+)"/.exec(c.parameters.SchemaXml)[1]); return J({}); }
        if (/breakroleinheritance|addroleassignment/.test(resto)) { if (/breakrole/.test(resto)) L.info.HasUniqueRoleAssignments = true; return J({}); }
        if (/AttachmentFiles\/add/.test(resto)) {
          const m = resto.match(/items\((\d+)\)/), fn = resto.match(/FileName='([^']+)'/)[1], it = L.items.find(x => x.Id === +m[1]);
          if (it) { it.Attachments = true; (it.__adj = it.__adj || {})[fn] = req.postDataBuffer(); } return J({});
        }
        const rc = resto.match(/items\((\d+)\)\/recycle\(\)/);
        if (rc) { L.items = L.items.filter(x => x.Id !== +rc[1]); return J({ Recycle: 'g' }); }
        const mi = resto.match(/items\((\d+)\)$/);
        delete c.__metadata;
        if (mi) { const it = L.items.find(x => x.Id === +mi[1]); Object.assign(it, c, { Modified: new Date().toISOString() }); return r.fulfill({ status: 204, body: '' }); }
        if (/\/items$/.test(resto)) { const it = { Id: ++L.n, ...c, Created: new Date().toISOString(), Modified: new Date().toISOString() }; L.items.push(it); return J(it, 201); }
        if (/getbytitle\('[^']+'\)$/.test(resto)) { Object.assign(L.info, c); return r.fulfill({ status: 204, body: '' }); }
      }
      return r.fulfill({ status: 400, body: '{}' });
    }
    // GET
    if (resto.startsWith('web/currentuser/groups')) return J({ value: Object.keys(grupos).filter(g => grupos[g].includes(yoId)).map((g, i) => ({ Id: 900 + i, Title: g })) });
    if (resto.startsWith('web/currentuser')) { const pe = quien(yoId); return J({ Id: pe.Id, Title: pe.Title, Email: pe.EMail, LoginName: pe.Name }); }
    if (resto.startsWith('web?$select=EffectiveBasePermissions')) return J({ EffectiveBasePermissions: { Low: String(admin ? 0x2000000 | 0xffff : 0x1), High: '0' } });
    if (resto.startsWith('web/roleassignments')) return J({ value: [{ PrincipalId: 99, Member: { Id: 99, Title: 'MDEF\\usuarios del dominio', LoginName: 'c:0-.f|rolemanager|usuarios del dominio' }, RoleDefinitionBindings: [] }] });
    if (resto.startsWith('web/roledefinitions/getbytype')) return J({ Id: resto.includes('(2)') ? 1073741826 : 1073741827 });
    const gu = resto.match(/^web\/sitegroups\/getbyname\('([^']+)'\)(\/users)?/);
    if (gu) { const g = grupos[gu[1]]; if (!g) return NO(); return gu[2] ? J({ value: g.map(quien).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail, LoginName: x.Name })) }) : J({ Id: 900 + Object.keys(grupos).indexOf(gu[1]) }); }
    if (resto.startsWith('web/sitegroups')) return J({ value: Object.keys(grupos).map((g, i) => ({ Id: 900 + i, Title: g })) });
    const gb = resto.match(/^web\/getuserbyid\((\d+)\)/); if (gb) { const pe = quien(gb[1]); return J({ LoginName: pe.Name }); }
    if (resto.startsWith('web/siteusers')) { const f = (u.match(/Email eq '([^']+)'/) || [])[1]; return J({ value: GENTE.filter(x => !f || x.EMail === f).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail, LoginName: x.Name })) }); }
    if (lm) {
      if (!L) return NO();
      // Sin permiso en el sitio (no está en los grupos ni es administrador): no ve las listas del cuadrante
      if (lm[1].startsWith('CUADRANTE') && !admin && !Object.keys(grupos).some(g => g.startsWith('CUADRANTE') && grupos[g].includes(yoId))) return NO();
      if (/\/fields/.test(resto)) return J({ value: L.campos.map(n => ({ InternalName: n })) });
      if (/\/roleassignments/.test(resto)) return J({ value: [] });
      const ad = resto.match(/items\((\d+)\)\/AttachmentFiles/);
      if (ad) { const it = L.items.find(x => x.Id === +ad[1]); return J({ value: Object.keys((it && it.__adj) || {}).map(n => ({ FileName: n, ServerRelativeUrl: '/att/' + lm[1].toUpperCase() + '/' + it.Id + '/' + n })) }); }
      if (/\/items/.test(resto)) {
        const fl = (u.match(/\$filter=([^&]*)/) || [])[1] || '', me = fl.match(/SolicitanteId eq (\d+)/), app = fl.match(/Aplicacion eq '([^']+)'/);
        return J({ value: L.items.filter(x => (!me || x.SolicitanteId === +me[1]) && (!app || x.Aplicacion === app[1])).map(conPersonas) });
      }
      return J(L.info);
    }
    return r.fulfill({ status: 404, body: '{}' });
  });
  await p.goto(url || PAGINA); await p.waitForTimeout(1200);
  // AutoFirma simulado: añade una «firma» (un /ByteRange) al final del PDF que recibe
  await p.evaluate(() => {
    window.__firmas = [];
    if (typeof AutoScript === 'undefined') return;
    AutoScript.cargarAppAfirma = function () {};
    AutoScript.sign = (datos, alg, fmt, prm, ok) => { window.__firmas.push({ alg, fmt, prm }); setTimeout(() => ok(btoa(atob(datos) + '\n%firma\n/ByteRange [0 10 20 30]\n')), 30); };
  });
  return { b, p, errs };
}
const texto = async p => (await p.textContent('#vista')).replace(/\s+/g, ' ');
const tab = async (p, v) => { await p.click('#tabs a[data-v="' + v + '"]'); await p.waitForTimeout(500); };
const items = t => listas[t].items;

async function prueba(verbose) {
  const tag = verbose ? '[verbose] ' : '[ligero] ';
  console.log('\n===== ' + tag + '=====');
  reiniciar();
  // 1. El administrador prepara la aplicación: listas, grupos, gestores y permisos
  let { b, p, errs } = await abrir(7, true, verbose);
  comprueba(tag + 'sin listas, el administrador va a Ajustes', /Falta «CUADRANTE COMPONENTES»/.test(await texto(p)), (await texto(p)).slice(0, 200));
  await p.click('[data-ajlistas]'); await p.waitForTimeout(2500);
  comprueba(tag + 'crea las 5 listas con sus columnas', ['CUADRANTE COMPONENTES', 'CUADRANTE TURNOS', 'CUADRANTE AUSENCIAS', 'CUADRANTE FESTIVOS', 'CUADRANTE CAMBIOS'].every(t => listas[t] && listas[t].campos.length >= 2) && listas['CUADRANTE TURNOS'].campos.includes('EstadoTurno'));
  await tab(p, 'ajustes');
  await p.click('[data-ajgrupo="CUADRANTE_GESTORES"]'); await p.waitForTimeout(800);
  await p.click('[data-ajgrupo="CUADRANTE_USUARIOS"]'); await p.waitForTimeout(800);
  const gp = posts.filter(x => x.ruta === 'web/sitegroups');
  comprueba(tag + 'crea los dos grupos con los integrantes visibles para todos', gp.length === 2 && gp.every(x => x.cuerpo.OnlyAllowMembersViewMembership === false));
  await p.fill('#ajGestor', 'gestora@et.mde.es'); await p.click('[data-ajanadir]'); await p.waitForTimeout(800);
  comprueba(tag + 'añade a la gestora al grupo de gestores', grupos.CUADRANTE_GESTORES.includes(8));
  await p.click('[data-ajpermisos]'); await p.waitForTimeout(1500);
  const asig = posts.filter(x => /addroleassignment/.test(x.ruta));
  comprueba(tag + 'da permisos: lectura a usuarios (colaborar en ausencias) y colaborar a gestores', asig.length === 10 && asig.some(x => /AUSENCIAS'\)\/roleassignments\/addroleassignment\(principalid=\d+,roledefid=1073741827/.test(x.ruta)) && posts.filter(x => /breakroleinheritance/.test(x.ruta)).length === 5 && asig.some(x => /CAMBIOS'\)\/roleassignments\/addroleassignment\(principalid=\d+,roledefid=1073741827/.test(x.ruta)), asig.length);
  // el administrador deja su cuenta para el aviso directo de las solicitudes de acceso
  comprueba(tag + 'el administrador deja su cuenta en la descripción de la lista común', /asansen@et\.mde\.es=i:0#\.w\|et\\asansen/.test(listas['SOLICITUDES ACCESO APLICACIONES'].info.Description));
  // alta de un componente desde el formulario
  await tab(p, 'componentes'); await p.click('[data-compnuevo]'); await p.waitForTimeout(300);
  await p.fill('#fComp [name=cuenta]', 'alta@et.mde.es'); await p.selectOption('#fComp [name=cuadrante]', 'SUBOFICIALES'); await p.selectOption('#fComp [name=empleo]', 'SARGENTO');
  await p.fill('#fComp [name=antig]', '2024-06-01'); await p.fill('#fComp [name=tel]', '600000041'); await p.click('[data-compguardar]'); await p.waitForTimeout(900);
  const al = items('CUADRANTE COMPONENTES')[0];
  comprueba(tag + 'alta de componente con su cuenta (ensureuser)', al && al.PersonaId === 41 && al.Cuadrante === 'SUBOFICIALES' && al.Empleo === 'SARGENTO' && al.Title === 'COMPONENTE DESDE EL FORMULARIO', JSON.stringify(al));
  // festivos fijos de 2027
  await tab(p, 'festivos');
  await p.evaluate(() => { document.querySelector('[data-anio="1"]') && 0; });
  while (!/Festivos de 2027/.test(await texto(p))) { await p.click('[data-anio="' + (/Festivos de 20(2[0-6])/.test(await texto(p)) ? 1 : -1) + '"]'); await p.waitForTimeout(150); }
  await p.click('[data-festfijos]'); await p.waitForTimeout(2000);
  const fes = items('CUADRANTE FESTIVOS');
  comprueba(tag + 'añade los festivos nacionales y de Andalucía de 2027 (con Jueves y Viernes Santo)', fes.length === 12 && fes.some(f => f.Fecha.startsWith('2027-03-25') && f.Ambito === 'ANDALUCIA') && fes.some(f => f.Fecha.startsWith('2027-03-26')), fes.map(f => f.Fecha.slice(0, 10)).join(','));
  comprueba(tag + 'sin errores de página (preparación)', errs.length === 0, errs.join(' | '));
  await b.close();

  // 2. Datos del cuadrante: 6 oficiales y 6 suboficiales; una comisión y unas vacaciones cortas aprobadas
  const LC = listas['CUADRANTE COMPONENTES'];
  const comp = (pid, q, empleo, antig, esc) => { const pe = quien(pid); LC.items.push({ Id: ++LC.n, Title: pe.Title, PersonaId: pid, Cuadrante: q, Empleo: empleo, Antiguedad: antig + 'T12:00:00Z', Escalafon: esc, Telefono: '6000000' + pid, Negociado: 'NEG ' + pid, FechaAlta: '2026-01-01T12:00:00Z' }); return LC.n; };
  // Orden esperado (del más antiguo al más moderno): OF1, OF2 (tenientes coroneles), OF3, OF4, OF5 (comandantes), OF6 (capitán)
  const id = {};
  [[11, 'TENIENTE CORONEL', '2015-01-01'], [12, 'TENIENTE CORONEL', '2018-01-01'], [16, 'CAPITAN', '2010-01-01'], [13, 'COMANDANTE', '2016-01-01'], [15, 'COMANDANTE', '2021-01-01'], [14, 'COMANDANTE', '2019-01-01']]
    .forEach(([pid, e, a], i) => { id[pid] = comp(pid, 'OFICIALES', e, a, 100 + i); });
  [[21, 'SUBTENIENTE', '2014-01-01'], [22, 'SUBTENIENTE', '2016-01-01'], [23, 'BRIGADA', '2015-01-01'], [24, 'BRIGADA', '2017-01-01'], [25, 'SARGENTO PRIMERO', '2018-01-01'], [26, 'SARGENTO PRIMERO', '2019-01-01']]
    .forEach(([pid, e, a], i) => { id[pid] = comp(pid, 'SUBOFICIALES', e, a, 200 + i); });
  grupos.CUADRANTE_USUARIOS.push(11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26, 41);
  const LA = listas['CUADRANTE AUSENCIAS'];
  const aus = (pid, tipo, d, h, est) => LA.items.push({ Id: ++LA.n, PersonaId: pid, Componente: id[pid], TipoAusencia: tipo, Desde: d + 'T12:00:00Z', Hasta: h + 'T12:00:00Z', EstadoAusencia: est || 'APROBADA', Created: new Date().toISOString() });
  aus(13, 'COMISION DE SERVICIO', '2027-01-06', '2027-01-12');          // OF3: salta lo que le toque del 6 al 12
  aus(23, 'VACACIONES', '2027-01-11', '2027-01-13');                    // SUB3: 3 laborables → no salta, debe hacer un cambio
  aus(24, 'ASUNTOS PROPIOS', '2027-01-13', '2027-01-13');               // SUB4: asuntos propios → no salta, debe hacer un cambio
  aus(25, 'PERMISO', '2027-01-18', '2027-01-26');                       // SUB5: permiso de 7 laborables → salta

  // 3. La gestora propone, revisa y publica enero de 2027
  ({ b, p, errs } = await abrir(8, false, verbose, PAGINA + '?mes=2027-01'));
  let t = await texto(p);
  comprueba(tag + 'la gestora ve las pestañas de gestión, sin Ajustes ni Accesos', await p.$$eval('#tabs a', a => a.map(x => x.dataset.v).join(',')) === 'mes,mios,cambios,anio,ausencias,componentes,festivos');
  comprueba(tag + 'enero de 2027 sale como propuesta sin guardar', /enero de 2027/.test(t) && /PROPUESTA SIN GUARDAR/.test(t));
  const rot = await p.$$eval('details.rotacion table.rot', ts => ts.map(x => [...x.rows].slice(1).map(r => r.cells[0].textContent + ' ' + r.cells[1].textContent.replace(/\s+/g, ' ').trim())));
  comprueba(tag + 'el gestor ve el orden de la rotación de los dos cuadrantes y quién empieza', rot.length === 2 && /^1º TENIENTE CORONEL OFICIAL NUMERO 1 ▶ empieza diario ▶ empieza fin de semana/.test(rot[0][0]) && /^6º CAPITAN OFICIAL NUMERO 6/.test(rot[0][5]) && rot[1].length === 7, JSON.stringify(rot));
  comprueba(tag + 'y las ausencias del mes de cada uno', /Comisión de servicio 6-12\/1 · salta/.test(await p.textContent('details.rotacion')) && /Asuntos propios 13-13\/1 · cambio/.test(await p.textContent('details.rotacion')));
  comprueba(tag + 'en cada turno, las personas salen con su número de orden', /^1º · TENIENTE CORONEL/.test(await p.$eval('table.cuad select', s => s.options[s.selectedIndex].text)));
  const filas = await p.$$eval('table.cuad tbody tr', trs => trs.map(tr => [tr.cells[0].querySelector('b').textContent, tr.cells[1].textContent, ...[2, 3].map(i => { const s = tr.cells[i].querySelector('select'); return s.options[s.selectedIndex].text; })]));
  const fila = r => filas.find(f => f[0] === r) || [];
  comprueba(tag + 'turnos: Vie 1–Dom 3 (festivo dentro) es un fin de semana', fila('Vie 1 – Dom 3 ene')[1] === 'Fin de semana', JSON.stringify(filas.slice(0, 4)));
  comprueba(tag + 'turnos: lunes-martes de diario, miércoles 6 festivo suelto, jueves 7 diario de un día', fila('Lun 4 – Mar 5 ene')[1] === 'Diario' && fila('Mié 6 ene')[1] === 'Festivo' && fila('Jue 7 ene')[1] === 'Diario' && fila('Mié 13 – Jue 14 ene')[1] === 'Diario');
  comprueba(tag + 'el turno que empieza el 29 de enero cuenta en enero y acaba el 31', !!filas.find(f => f[0] === 'Vie 29 – Dom 31 ene'));
  comprueba(tag + 'diario empieza por el más antiguo: OF1 el 4-5 y OF2 el 7', /OFICIAL NUMERO 1/.test(fila('Lun 4 – Mar 5 ene')[2]) && /OFICIAL NUMERO 2/.test(fila('Jue 7 ene')[2]), fila('Lun 4 – Mar 5 ene')[2] + ' / ' + fila('Jue 7 ene')[2]);
  comprueba(tag + 'OF3 en comisión pierde su turno del 11-12 y lo hace OF4 (comandante más antiguo después)', /OFICIAL NUMERO 4/.test(fila('Lun 11 – Mar 12 ene')[2]) && /Salta OFICIAL NUMERO 3/.test(t), fila('Lun 11 – Mar 12 ene')[2]);
  comprueba(tag + 'fin de semana: OF1 el 1-3, OF2 el festivo del 6 y OF3 salta el 8-10 (lo hace OF4)', /NUMERO 1/.test(fila('Vie 1 – Dom 3 ene')[2]) && /NUMERO 2/.test(fila('Mié 6 ene')[2]) && /NUMERO 4/.test(fila('Vie 8 – Dom 10 ene')[2]));
  const secD = filas.filter(f => f[1] === 'Diario').map(f => f[2].slice(-1)).join('');
  comprueba(tag + 'rotación de diario 1-2-(3 salta)-4-5-6 (el capitán, el último) y vuelta a empezar', secD.startsWith('1245612'), secD);
  comprueba(tag + 'SUB3 con vacaciones cortas no salta: queda puesto y se avisa de que debe hacer un cambio', /SUBOFICIAL NUMERO 3/.test(fila('Lun 11 – Mar 12 ene')[3]) && /debe hacer un cambio de servicio/.test(t), fila('Lun 11 – Mar 12 ene')[3]);
  comprueba(tag + 'asuntos propios no saltan: SUB4 sigue el 13-14 con aviso de cambio', /SUBOFICIAL NUMERO 4/.test(fila('Mié 13 – Jue 14 ene')[3]) && /Asuntos propios \(1 días laborables\): no salta/.test(t), fila('Mié 13 – Jue 14 ene')[3]);
  comprueba(tag + 'un permiso de más de 5 días laborables salta: SUB5 no tiene turnos del 18 al 26', !filas.some(f => f[0] >= 'Lun 18' && /SUBOFICIAL NUMERO 5/.test(f[3]) && ['Lun 18 – Mar 19 ene', 'Mié 20 – Jue 21 ene', 'Vie 22 – Dom 24 ene', 'Lun 25 – Mar 26 ene'].includes(f[0])) && /Salta SUBOFICIAL NUMERO 5 \(permiso\)/.test(t));
  await p.click('[data-guardarmes="1"]'); await p.waitForTimeout(4000);
  const LT = listas['CUADRANTE TURNOS'];
  comprueba(tag + 'publica: 2 turnos por fila, todos PUBLICADO, con el mes y el componente', LT.items.length === filas.length * 2 && LT.items.every(x => x.EstadoTurno === 'PUBLICADO' && x.Mes === '2027-01') && LT.items.every(x => x.Componente), LT.items.length + ' / ' + filas.length);
  const avisados = new Set(correos.filter(c => /SUS SERVICIOS/.test(c.asunto)).flatMap(c => c.to));
  comprueba(tag + 'avisa a cada uno de sus servicios, a su CUENTA', avisados.size === 12 && !avisados.has('i:0#.w|et\\sub5') && [...avisados].every(x => /^i:0#\.w\|et\\/.test(x)), [...avisados].join(','));
  t = await texto(p);
  comprueba(tag + 'resultado: publicado y avisados 12 de 12 (SUB5 no tiene turnos por su permiso)', /publicado\. Avisados por correo: 12 de 12/.test(t), t.slice(0, 200));
  if (process.env.FOTOS && !verbose) { await p.setViewportSize({ width: 1300, height: 900 }); await p.screenshot({ path: process.env.FOTOS + '/mes-gestor.png', fullPage: false }); }
  // Imprimir
  const [imp] = await Promise.all([p.context().waitForEvent('page'), p.click('[data-imprimir]')]); await imp.waitForLoadState(); await imp.waitForTimeout(300);
  const ti = (await imp.textContent('body')).replace(/\s+/g, ' ');
  comprueba(tag + 'imprime los dos cuadrantes juntos por días', /CUADRANTE DE SERVICIOS · JSUIGE/.test(ti) && /enero de 2027/.test(ti) && /Jefe de servicio/.test(ti) && /Auxiliar de servicio/.test(ti) && /Año Nuevo/.test(ti), ti.slice(0, 200));
  await imp.close();
  comprueba(tag + 'sin errores de página (gestora)', errs.length === 0, errs.join(' | '));
  await b.close();

  // 4. Un oficial ve el cuadrante publicado y comunica unas vacaciones largas
  ({ b, p, errs } = await abrir(12, false, verbose, PAGINA + '?mes=2027-01'));
  comprueba(tag + 'el componente solo ve el mes y sus servicios', await p.$$eval('#tabs a', a => a.map(x => x.dataset.v).join(',')) === 'mes,mios');
  comprueba(tag + 've el cuadrante publicado con sus servicios resaltados y teléfonos', (await p.$$('table.cuad tr.mio')).length >= 2 && /☎ 6000000/.test(await texto(p)));
  await tab(p, 'mios');
  t = await texto(p);
  comprueba(tag + '«Mis servicios» lista sus servicios publicados', /Mis próximos servicios/.test(t) && /Jue 7 ene/.test(t), t.slice(0, 300));
  const misTurnos = LT.items.filter(x => x.Componente === id[12] && x.Inicio >= '2027-01-15');
  await p.selectOption('#fAus [name=tipo]', 'VACACIONES'); await p.fill('#fAus [name=desde]', '2027-01-15'); await p.fill('#fAus [name=hasta]', '2027-01-29');
  correos.length = 0; await p.click('[data-ausguardar="0"]'); await p.waitForTimeout(1500);
  const nueva = LA.items[LA.items.length - 1];
  comprueba(tag + 'la ausencia queda PENDIENTE y enlazada al componente', nueva.EstadoAusencia === 'PENDIENTE' && nueva.Componente === id[12] && nueva.TipoAusencia === 'VACACIONES');
  comprueba(tag + 'avisa a los gestores (a su cuenta, por el grupo)', correos.some(c => /AUSENCIA DE OFICIAL NUMERO 2/.test(c.asunto) && c.to.includes('i:0#.w|et\\gestora')), JSON.stringify(correos.map(c => c.to)));
  t = await texto(p);
  comprueba(tag + 'le dice que coincide con su servicio y que el gestor buscará sustituto', misTurnos.length ? /el gestor buscará sustituto/.test(t) : true, t.slice(0, 300));
  if (process.env.FOTOS && !verbose) { await tab(p, 'mes'); await p.setViewportSize({ width: 1300, height: 900 }); await p.screenshot({ path: process.env.FOTOS + '/mes-componente.png' }); await tab(p, 'mios'); await p.screenshot({ path: process.env.FOTOS + '/mios.png', fullPage: true }); }
  // un mes sin publicar
  await tab(p, 'mes'); await p.click('[data-mes="1"]'); await p.waitForTimeout(300);
  comprueba(tag + 'un mes sin publicar no se le enseña', /aún no está publicado/.test(await texto(p)));
  comprueba(tag + 'sin errores de página (componente)', errs.length === 0, errs.join(' | '));
  await b.close();

  // 5. La gestora aprueba las vacaciones: el cuadrante le avisa del choque y propone al siguiente
  ({ b, p, errs } = await abrir(8, false, verbose, PAGINA + '?mes=2027-01'));
  await tab(p, 'ausencias');
  comprueba(tag + 'la pestaña Ausencias marca 1 pendiente', /1/.test(await p.textContent('#tabs a[data-v="ausencias"] i')));
  correos.length = 0; await p.click('[data-ausaprobar="' + nueva.Id + '"]'); await p.waitForTimeout(1200);
  comprueba(tag + 'aprobada, con aviso al interesado y al gestor del choque', nueva.EstadoAusencia === 'APROBADA' && nueva.ResueltoPorId === 8 && correos.some(c => /AUSENCIA APROBADA/.test(c.asunto) && c.to.includes('i:0#.w|et\\of2')) && (!misTurnos.length || /Coincide con/.test(await texto(p))));
  await tab(p, 'mes');
  t = await texto(p);
  comprueba(tag + 'el mes avisa: hay que sustituirle, con el botón del siguiente disponible', !misTurnos.length || (/hay que sustituirle/.test(t) && !!(await p.$('[data-sustituir]'))), t.slice(0, 400));
  if (misTurnos.length) {
    await p.click('[data-sustituir]'); await p.waitForTimeout(300);
    await p.fill('#motivoCambio', 'Vacaciones aprobadas'); correos.length = 0;
    await p.click('[data-guardarmes="0"]'); await p.waitForTimeout(2500);
    const cambiado = LT.items.find(x => x.Id === LT.items.find(y => y.Componente !== id[12] && y.Inicio === misTurnos[0].Inicio && y.Cuadrante === 'OFICIALES')?.Id);
    comprueba(tag + 'guarda el cambio con historial y avisa a los dos afectados', !!cambiado && /Cambio: OFICIAL NUMERO 2 → /.test(cambiado.Historial) && /Vacaciones aprobadas/.test(cambiado.Historial) && correos.some(c => /CAMBIO EN EL CUADRANTE/.test(c.asunto) && c.to.includes('i:0#.w|et\\of2') && c.to.length === 2), JSON.stringify(correos.map(c => [c.asunto, c.to])));
  }
  // Imprevisto el mismo día
  await p.click('[data-imprevisto="0|SUBOFICIALES"]'); await p.waitForTimeout(300);
  await p.fill('#motivoCambio', 'Enfermedad repentina'); correos.length = 0;
  await p.click('[data-guardarmes="0"]'); await p.waitForTimeout(2000);
  comprueba(tag + 'imprevisto: pone al siguiente disponible y avisa a los dos', correos.some(c => /CAMBIO EN EL CUADRANTE/.test(c.asunto) && /Enfermedad repentina/.test(c.cuerpo)), JSON.stringify(correos.map(c => c.asunto)));
  // Vista anual
  await tab(p, 'anio');
  while (!/Año 2027/.test(await texto(p))) { await p.click('[data-anio="1"]'); await p.waitForTimeout(150); }
  const xs = await p.$$eval('table.anio td', tds => tds.filter(x => x.textContent === 'X').length);
  comprueba(tag + 'vista anual con una X por servicio y la cuenta por persona', xs === LT.items.length && /Diario/.test(await texto(p)), xs + ' / ' + LT.items.length);
  if (process.env.FOTOS && !verbose) { await p.setViewportSize({ width: 1300, height: 900 }); await p.screenshot({ path: process.env.FOTOS + '/anio.png' }); }
  comprueba(tag + 'la comisión sale con su color en la vista anual', (await p.$$eval('table.anio td', tds => tds.filter(x => /0, 176, 80/.test(x.style.background)).length)) > 0);
  comprueba(tag + 'sin errores de página (gestión)', errs.length === 0, errs.join(' | '));
  await b.close();

  // 5b. Cambio de servicio con tres firmas: SUB3 (vacaciones cortas el 11-12) pide una permuta a SUB4
  const LT2 = listas['CUADRANTE TURNOS'], LCB = listas['CUADRANTE CAMBIOS'];
  const tA = LT2.items.find(x => x.Cuadrante === 'SUBOFICIALES' && x.Componente === id[23] && x.Inicio.startsWith('2027-01-11'));
  ({ b, p, errs } = await abrir(23, false, verbose));
  await tab(p, 'mios');
  comprueba(tag + 'el servicio con vacaciones cortas ofrece «Pedir cambio» destacado', !!tA && await p.$eval('[data-cambiopedir="' + tA.Id + '"]', x => x.classList.contains('prim')).catch(() => false));
  await p.click('[data-cambiopedir="' + tA.Id + '"]'); await p.waitForTimeout(300);
  const compas = await p.$$eval('#fCambio [name=comp] option', o => o.map(x => x.textContent).filter(Boolean));
  comprueba(tag + 'solo ofrece compañeros de su cuadrante', compas.length > 1 && compas.slice(1).every(x => /SUBOFICIAL|SARGENTO/.test(x)) && !compas.some(x => /SUBOFICIAL NUMERO 3/.test(x)), compas.join(' | '));
  await p.selectOption('#fCambio [name=comp]', String(id[24])); await p.waitForTimeout(300);
  const opsB = await p.$$eval('#fCambio [name=turnoB] option', o => o.map(x => [x.value, x.textContent]).filter(x => x[0]));
  comprueba(tag + 'en la permuta solo salen servicios de diario del compañero', opsB.length > 0 && opsB.every(x => /diario/.test(x[1])), JSON.stringify(opsB));
  const tB = LT2.items.find(x => x.Id === Number(opsB[opsB.length - 1][0]));
  await p.selectOption('#fCambio [name=turnoB]', opsB[opsB.length - 1][0]); await p.waitForTimeout(300);
  comprueba(tag + 'avisa si el servicio que recibe choca con sus propias vacaciones', /el servicio que recibes \(Mié 13 – Jue 14 ene/.test(await p.textContent('#fCambio')));
  await p.fill('#fCambio [name=motivo]', 'Vacaciones del 11 al 13');
  correos.length = 0; await p.click('[data-cambiofirmar]'); await p.waitForTimeout(1500);
  const cb = LCB.items[0], f1 = await p.evaluate(() => window.__firmas.map(f => f.prm));
  const pdf1 = cb && cb.__adj && cb.__adj['CAMBIO-' + cb.Id + '-1-solicitante.pdf'];
  comprueba(tag + 'paso 1: firma con AutoFirma (PAdES, recuadro del solicitante) y guarda la solicitud', f1.length === 1 && /signaturePositionOnPageLowerLeftX=54/.test(f1[0]) && cb && cb.EstadoCambio === 'PENDIENTE DEL COMPAÑERO' && cb.TurnoA === tA.Id && cb.TurnoB === tB.Id && cb.TipoCambio === 'PERMUTA' && cb.Firmas === '1', JSON.stringify(cb && { ...cb, __adj: 0 }));
  comprueba(tag + 'el PDF firmado queda adjunto', !!pdf1 && pdf1.toString('latin1').startsWith('%PDF-1.4') && /SOLICITUD DE CAMBIO DE SERVICIO/.test(pdf1.toString('latin1')) && (pdf1.toString('latin1').match(/\/ByteRange/g) || []).length === 1);
  comprueba(tag + 'avisa al compañero a su cuenta', correos.some(c => /SOLICITUD DE CAMBIO/.test(c.asunto) && c.to.includes('i:0#.w|et\\sub4')));
  comprueba(tag + 'el servicio queda «cambio en trámite»', /Cambio nº 1 en trámite/.test(await texto(p)));
  comprueba(tag + 'sin errores de página (solicitante)', errs.length === 0, errs.join(' | '));
  await b.close();
  // paso 2: el compañero acepta y firma
  ({ b, p, errs } = await abrir(24, false, verbose));
  comprueba(tag + 'el compañero entra directamente en «Mis servicios» con el cambio que le piden', /Cambios que te piden/.test(await texto(p)) && !!(await p.$('[data-cambioaceptar="1"]')));
  correos.length = 0; await p.click('[data-cambioaceptar="1"]'); await p.waitForTimeout(1500);
  const pdf2 = cb.__adj['CAMBIO-1-2-companero.pdf'];
  comprueba(tag + 'paso 2: firma sobre el mismo PDF (dos firmas) y pasa al gestor', cb.EstadoCambio === 'PENDIENTE DEL GESTOR' && cb.Firmas === '1,2' && !!pdf2 && (pdf2.toString('latin1').match(/\/ByteRange/g) || []).length === 2 && pdf2.toString('latin1').startsWith(pdf1.toString('latin1')) &&
    /signaturePositionOnPageLowerLeftX=22\d/.test((await p.evaluate(() => window.__firmas.map(f => f.prm)))[0] || ''));
  comprueba(tag + 'avisa a los gestores', correos.some(c => /PENDIENTE DE VALIDAR/.test(c.asunto) && c.to.includes('i:0#.w|et\\gestora')));
  comprueba(tag + 'sin errores de página (compañero)', errs.length === 0, errs.join(' | '));
  await b.close();
  // paso 3: la gestora valida y firma; el cuadrante cambia solo
  ({ b, p, errs } = await abrir(8, false, verbose, PAGINA + '?mes=2027-01'));
  comprueba(tag + 'la pestaña Cambios marca 1 pendiente', /1/.test(await p.textContent('#tabs a[data-v="cambios"] i')));
  await tab(p, 'cambios');
  correos.length = 0; await p.click('[data-cambiovalidar="1"]:not([data-sinfirma])'); await p.waitForTimeout(2000);
  const pdf3 = cb.__adj['CAMBIO-1-3-validado.pdf']; if (process.env.FOTOS && !verbose) fs.writeFileSync(process.env.FOTOS + '/cambio.pdf', pdf3);
  comprueba(tag + 'paso 3: tres firmas, VALIDADO y permuta aplicada en el cuadrante', cb.EstadoCambio === 'VALIDADO' && cb.Firmas === '1,2,3' && !!pdf3 && (pdf3.toString('latin1').match(/\/ByteRange/g) || []).length === 3 &&
    tA.Componente === id[24] && tB.Componente === id[23] && /Cambio de servicio nº 1 \(permuta\) validado/.test(tA.Historial), JSON.stringify([tA.Componente, tB.Componente, cb.EstadoCambio]));
  comprueba(tag + 'avisa a los dos interesados', correos.some(c => /VALIDADO/.test(c.asunto) && c.to.includes('i:0#.w|et\\sub3') && c.to.includes('i:0#.w|et\\sub4')));
  await tab(p, 'mes');
  { const tm = await texto(p); comprueba(tag + 'el mes ya no avisa de que SUB3 debe hacer un cambio el 11-12', !/Lun 11 – Mar 12 ene · Auxiliar de servicio · BRIGADA SUBOFICIAL NUMERO 3/.test(tm), (tm.match(/Revisar.{200}/) || [''])[0]); }
  comprueba(tag + 'sin errores de página (gestora, cambios)', errs.length === 0, errs.join(' | '));
  await b.close();
  // Cesión rechazada por el compañero
  const tC = LT2.items.filter(x => x.Cuadrante === 'SUBOFICIALES' && x.Componente === id[21]).sort((a, b) => a.Inicio.localeCompare(b.Inicio)).pop();
  ({ b, p, errs } = await abrir(21, false, verbose));
  await tab(p, 'mios'); await p.click('[data-cambiopedir="' + tC.Id + '"]'); await p.waitForTimeout(300);
  await p.selectOption('#fCambio [name=tipo]', 'CESION'); await p.waitForTimeout(200);
  comprueba(tag + 'en la cesión no se pide servicio a cambio', !(await p.$('#fCambio [name=turnoB]')));
  await p.selectOption('#fCambio [name=comp]', String(id[22])); await p.waitForTimeout(200); await p.fill('#fCambio [name=motivo]', 'Curso');
  await p.click('[data-cambiofirmar]'); await p.waitForTimeout(1200); await b.close();
  ({ b, p, errs } = await abrir(22, false, verbose));
  await p.fill('[data-cambio="2"] .cambioResp', 'Estoy de guardia ese día'); correos.length = 0;
  await p.click('[data-cambiorechazar="2"]'); await p.waitForTimeout(1200);
  const cb2 = LCB.items[1];
  comprueba(tag + 'cesión rechazada por el compañero con motivo y aviso a los dos', cb2.TipoCambio === 'CESION' && cb2.EstadoCambio === 'RECHAZADO' && cb2.Respuesta === 'Estoy de guardia ese día' && tC.Componente === id[21] &&
    correos.some(c => /RECHAZADO/.test(c.asunto) && c.to.includes('i:0#.w|et\\sub1')));
  comprueba(tag + 'sin errores de página (cesión)', errs.length === 0, errs.join(' | '));
  await b.close();

  // 6. Alguien sin acceso lo solicita: el aviso va a la cuenta del administrador
  ({ b, p, errs } = await abrir(40, false, verbose));
  comprueba(tag + 'sin acceso: formulario de solicitud', /No tienes acceso al «Cuadrante de servicios»/.test(await texto(p)) && !!(await p.$('[data-accsolicitar]')));
  await p.selectOption('#fAcceso [name=empleo]', 'BRIGADA'); await p.fill('#fAcceso [name=unidad]', 'NEGOCIADO DE SEGURIDAD'); await p.selectOption('#fAcceso [name=papel]', { index: 2 });
  correos.length = 0; await p.click('[data-accsolicitar]'); await p.waitForTimeout(1500);
  const sol = items('SOLICITUDES ACCESO APLICACIONES').slice(-1)[0];
  comprueba(tag + 'guarda la solicitud en la lista común', sol && sol.Aplicacion === 'CUADRANTE' && sol.EstadoSolicitud === 'PENDIENTE' && sol.SolicitanteId === 40);
  comprueba(tag + 'el aviso llega a la CUENTA del administrador', correos.some(c => /SOLICITUD DE ACCESO · CUADRANTE/.test(c.asunto) && c.to.includes('i:0#.w|et\\asansen')), JSON.stringify(correos.map(c => c.to)));
  comprueba(tag + 'luego ve su solicitud pendiente', /PENDIENTE de revisión/.test(await texto(p)));
  await b.close();

  // 7. El administrador la aprueba como suboficial: entra en el grupo y queda de alta en el cuadrante
  ({ b, p, errs } = await abrir(7, true, verbose));
  await p.waitForTimeout(600); await tab(p, 'accesos'); await p.waitForTimeout(500);
  comprueba(tag + 'Accesos: la solicitud pendiente sugiere suboficiales', await p.$eval('[data-sol] .accPapel', s => s.value) === 'SUBOFICIALES');
  correos.length = 0; await p.click('[data-accaprobar]'); await p.waitForTimeout(1500);
  comprueba(tag + 'aprobada: al grupo de usuarios, alta en el cuadrante y correo a su cuenta', grupos.CUADRANTE_USUARIOS.includes(40) && LC.items.some(c => c.PersonaId === 40 && c.Cuadrante === 'SUBOFICIALES' && c.Empleo === 'BRIGADA') &&
    sol.EstadoSolicitud === 'APROBADA' && correos.some(c => /ACCESO CONCEDIDO/.test(c.asunto) && c.to.includes('i:0#.w|et\\nuevo')));
  comprueba(tag + 'sin errores de página (administrador)', errs.length === 0, errs.join(' | '));
  await b.close();
}

await prueba(false);
await prueba(true);
console.log(fallos ? 'HAY FALLOS (' + fallos + ')' : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
