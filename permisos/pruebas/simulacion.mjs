// Prueba de permisos.html contra una lista «Solicitud de Permisos» simulada (datos inventados).
// Uso: node permisos/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.PERM_HTML ? process.env.PERM_HTML : new URL('../permisos.html', import.meta.url), 'utf8');
// PRUEBAS=1 con PERM_HTML=permisos/colabora/permisos-pruebas.html: las listas «… PRUEBAS» se sirven como las reales
const PRUEBAS = !!process.env.PRUEBAS;
let pruebasSinLista = false, camposPruebas = [], asuntos = [];  // PERM_HTML=permisos/colabora/permisos.html para probar la versión protegida
const WEB = '/et/SUIGESUR/colaborativo/CALIDAD-VIDA', O = 'https://colabora.mdef.es';
const U = { 279: { Id: 279, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, 11: { Id: 11, Title: 'APROBADOR UNO', EMail: 'aprob1@et.mde.es' },
  12: { Id: 12, Title: 'AUTORIZADOR UNO', EMail: 'autor1@et.mde.es' }, 13: { Id: 13, Title: 'SOLICITANTE DOS', EMail: 'sol2@et.mde.es' } };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x.toISOString(); };
let sinExpand = false, pets = [], asigs = [], grupoReg = [], anadidosReg = [], solLista = true, asigLista = true;
// Sustituciones de jefes: lista «SUSTITUCIONES JEFES UNIDAD» (ints), si existe (intLista), grupo «PERMISOS - MANDO» (grupoMando) y si soy de él (mando).
// sustYo: en la 2 el sustituto soy yo (y estoy de permiso esos días por la 3: no se puede autorizar)
let sustYo = false, ints = [], intLista = true, grupoMando = [{ Id: 90, Title: 'EL GENERAL' }], mando = false, intCampos = null;
const tramo = (id, sol, uni, tit, aIni, aFin, inter, des, has, tel, est, orden, tipo = 'Mando accidental') => ({ TipoSustitucion: tipo, Id: id, Title: uni, NumSolicitud: sol, UnidadNum: 1, Titular: tit.Title, TitularUid: tit.Id, AusenciaDesde: aIni, AusenciaHasta: aFin,
  Sustituto: inter.Title, SustitutoUid: inter.Id, Desde: des, Hasta: has, Telefono: tel, Correo: inter.EMail, Orden: orden, EstadoSustitucion: est });
let cuentaVieja = false;   // solicitud que nombra al autorizador con una cuenta antigua cuya dirección Colabora no acepta
let buzonMal = [], enviados = [], cuentasPedidas = [];   // direcciones que Colabora rechaza en SendEmail («destinatario válido») y las que sí acepta
let ultimoFiltro = '', items, gestor = false, registro = true, admin = false, otraCuenta = false, jefeOtraCuenta = false, sinSubstr = false, jefeNombre = false;
const nuevoStore = () => {
  // La 2 (de SOLICITANTE DOS, pendiente de que yo la autorice) y la 3 (mía, autorizada) son de jefes de unidad con sustitutos;
  // en la 6 (de SOLICITANTE DOS, autorizada) el sustituto soy yo del día +6 al +8
  ints = [tramo(501, 2, 'UNIDAD A', U[13], d(1), d(1), sustYo ? U[279] : U[11], d(1), d(1), '600111222', 'PREVISTA', 1),
    tramo(504, 6, 'UNIDAD B', U[13], d(6), d(8), U[279], d(6), d(8), '600777888', 'CONFIRMADA', 1, 'Encargado de despacho'),
    tramo(502, 3, 'UNIDAD A', U[279], d(0), d(2), U[12], d(0), d(1), '600333444', 'CONFIRMADA', 1), tramo(503, 3, 'UNIDAD A', U[279], d(0), d(2), U[13], d(2), d(2), '600555666', 'CONFIRMADA', 2)];
  items = [
    { Id: 1, Title: 'Vacaciones', Estado: '1-Pendiente de Aprobar', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(5), FechaDeFin: d(9), Solicitante: U[13], AprobadorDePermiso: U[279], CorreoDelSolicitante: 'sol2@et.mde.es', CorreoDeAPROBADOR: 'usuario@et.mde.es', AprobadorTexto: 'USUARIO DE PRUEBA', EstadoDeAprobacion: 'SIN APROBAR', Unidad0: { Id: 2, Title: 'UNIDAD B' }, Dependencia: 'SEGURIDAD' },
    { Id: 2, Title: 'Asuntos propios', Estado: '2-Aprobado', TipoDePermiso: 'Permiso por asuntos particulares (Art.6.a)', CupoDeA_x00f1_o: '2026', FechaInicio: d(1), FechaDeFin: d(1), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[279], CorreoDelSolicitante: 'sol2@et.mde.es', CorreoDeAPROBADOR: 'aprob1@et.mde.es', CorreoDeAUTORIZADOR: 'usuario@et.mde.es', AprobadorTexto: 'APROBADOR UNO', AutorizadorTexto: 'USUARIO DE PRUEBA', EstadoDeAprobacion: 'APROBADO', Unidad0: { Id: 1, Title: 'UNIDAD A' }, Dependencia: 'JEFATURA' },
    { Id: 3, Title: 'Compensa servicio', Estado: '3-Autorizado', TipoDePermiso: 'Permiso para compensar un servicio.', CupoDeA_x00f1_o: '2026', FechaInicio: d(0), FechaDeFin: d(2), Solicitante: U[279], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[12], EstadoDeRegistro: 'Pendiente de Registro', Unidad0: { Id: 1, Title: 'UNIDAD A' } },
    { Id: 6, Title: 'Otra unidad', Estado: '3-Autorizado', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(6), FechaDeFin: d(8), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: U[12], Empleo: 'Sargento', EstadoDeRegistro: 'Pendiente de Registro', Unidad0: { Id: 2, Title: 'UNIDAD B' } },
    { Id: 5, Title: 'Ajena', Estado: '1-Pendiente de Aprobar', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(3), FechaDeFin: d(4), Solicitante: U[13], AprobadorDePermiso: U[11], Unidad0: { Id: 2, Title: 'UNIDAD B' } },
    { Id: 4, Title: 'Viejo', Estado: '4-Registrado SIPERDEF', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2025', FechaInicio: d(-40), FechaDeFin: d(-30), Solicitante: U[279], Unidad0: { Id: 1, Title: 'UNIDAD A' } },
  ].concat(otraCuenta ? [{ Id: 9, Title: 'Antigua', Estado: '1-Pendiente de aprobar ', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(30), FechaDeFin: d(31), Solicitante: U[13], AprobadorDePermiso: { Id: 280, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' }, AprobadorTexto: 'USUARIO DE PRUEBA', Unidad0: { Id: 1, Title: 'UNIDAD A' } }] : [])
   .concat(jefeNombre ? [{ Id: 11, Title: 'Nombre al revés', Estado: '2-Aprobado', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(50), FechaDeFin: d(51), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: { Id: 888, Title: 'Prueba, Usuario de', EMail: '' }, AutorizadorTexto: 'Prueba, Usuario de', Unidad0: { Id: 1, Title: 'UNIDAD A' } }] : [])
   .concat(cuentaVieja ? [{ Id: 12, Title: 'Cuenta vieja', Estado: '2-Aprobado', AutorizarDirecto: true, TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(60), FechaDeFin: d(61), Solicitante: U[13], CorreoDelSolicitante: 'sol2@et.mde.es', AutorizadorDelPermiso: { Id: 777, Title: 'Prueba, Usuario de', EMail: '' }, CorreoDeAUTORIZADOR: 'viejo@et.mde.es', AutorizadorTexto: 'Prueba, Usuario de', Unidad0: { Id: 1, Title: 'UNIDAD A' } }] : [])
   .concat(jefeOtraCuenta ? [{ Id: 10, Title: 'Del jefe', Estado: '2-Aprobado', TipoDePermiso: 'Vacaciones (Art.5)', CupoDeA_x00f1_o: '2026', FechaInicio: d(40), FechaDeFin: d(41), Solicitante: U[13], AprobadorDePermiso: U[11], AutorizadorDelPermiso: { Id: 777, Title: 'Usuario De Prueba', EMail: '' }, CorreoDeAUTORIZADOR: 'USUARIO@et.mde.es', AutorizadorTexto: 'USUARIO DE PRUEBA', Unidad0: { Id: 1, Title: 'UNIDAD A' } }] : [])
   .map(x => ({ Created: d(-3), Modified: d(-2) + '', Author: { Id: x.Solicitante.Id, Title: x.Solicitante.Title }, Editor: { Title: 'X' }, NIF: '00000000T', RegistroDeBorrador: '', ...x }));
};
async function prueba(verbose, soloAlcance) {
  nuevoStore();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 800 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [], gets = [], alertas = [];
  p.on('dialog', dl => { alertas.push(dl.message()); dl.dismiss(); });
  await p.route(O + '/**', async r => {
    const req = r.request(); let u = decodeURIComponent(req.url());
    if (PRUEBAS && u.includes('/_api/')) {
      if (u.includes("getbytitle('Solicitud de Permisos')") && !u.includes('SchemaXml')) return r.fulfill({ status: 500, json: { error: { message: { value: 'LA COPIA DE PRUEBAS HA TOCADO LA LISTA REAL' } } } });
      if (u.includes("getbytitle('Solicitud de Permisos PRUEBAS')") && u.includes('createfieldasxml')) { camposPruebas.push(/Name="([^"]+)"/.exec(JSON.parse(req.postData()).parameters.SchemaXml)[1] + (/ ID="/.test(JSON.parse(req.postData()).parameters.SchemaXml) ? ' (CON ID)' : '')); return r.fulfill({ json: { d: {} } }); }
      if (pruebasSinLista && u.includes("getbytitle('Solicitud de Permisos PRUEBAS')")) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
      if (u.includes("getbytitle('Solicitud de Permisos')") && u.includes('SchemaXml')) return r.fulfill({ json: { value: [
        { InternalName: 'Title', SchemaXml: '<Field Name="Title"/>', FromBaseType: true }, { InternalName: 'Estado', SchemaXml: '<Field Type="Choice" ID="{11111111-1111-1111-1111-111111111111}" Name="Estado" StaticName="Estado" SourceID="{x}" Version="3"><CHOICES><CHOICE>1-Pendiente de Aprobar</CHOICE></CHOICES></Field>' },
        { InternalName: 'Unidad0', SchemaXml: '<Field Type="Lookup" ID="{22222222-2222-2222-2222-222222222222}" Name="Unidad0" StaticName="Unidad0" List="{ab12cd34-0000-0000-0000-000000000001}" ShowField="Title" />' },
        { InternalName: 'NIF', SchemaXml: '<Field Type="Text" ID="{33333333-3333-3333-3333-333333333333}" Name="NIF" StaticName="NIF" />' }, { InternalName: 'Oculto', SchemaXml: '<Field Name="Oculto"/>', Hidden: true }] } });
      u = u.replace(/ PRUEBAS'\)/g, "')");
    }
    if (!u.includes('/_api/')) return r.fulfill({ body: html, contentType: 'text/html' });
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'GET') gets.push(resto);
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = JSON.parse(req.postData()).properties, dest = [pr.To, pr.CC, pr.BCC].flatMap(x => x ? x.results : []);
        asuntos.push(pr.Subject);
        if (dest.some(x => buzonMal.includes(String(x).toLowerCase()))) return r.fulfill({ status: 400, json: { error: { message: { value: 'No se puede enviar el mensaje de correo electrónico. Asegúrese de que tenga un destinatario válido.' } } } });
        enviados.push(...dest); return r.fulfill({ json: { d: {} } });
      }
      if (resto.startsWith('SP.UI.ApplicationPages')) return r.fulfill({ json: { d: { ClientPeoplePickerSearchUser: '[]' } } });
      if (resto.startsWith("web/lists/getbytitle('SUSTITUCIONES JEFES UNIDAD')")) {
        if (resto.includes('createfieldasxml')) { (intCampos ||= []).push(/Name="([^"]+)"/.exec(JSON.parse(req.postData()).parameters.SchemaXml)[1]); return r.fulfill({ json: { d: {} } }); }
        const c3 = JSON.parse(req.postData() || '{}'); delete c3.__metadata; const m3 = resto.match(/items\((\d+)\)/);
        if (m3) { Object.assign(ints.find(x => x.Id === +m3[1]), c3); return r.fulfill({ status: 204, body: '' }); }
        if (resto.endsWith('/items')) { const it = { Id: 600 + ints.length, ...c3 }; ints.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } }); }
        return r.fulfill({ status: 204, body: '' });
      }
      if (resto === 'web/lists') { const c3 = JSON.parse(req.postData()); if (c3.Title === 'Solicitud de Permisos PRUEBAS') pruebasSinLista = false; if (/^SUSTITUCIONES JEFES UNIDAD/.test(c3.Title)) { intLista = true; intCampos = []; } return r.fulfill({ status: 201, json: { d: { Id: 'nueva' } } }); }
      if (resto === 'web/sitegroups') { if (JSON.parse(req.postData()).Title === 'PERMISOS - MANDO') grupoMando = []; return r.fulfill({ status: 201, json: { d: { Id: 95 } } }); }
      if (resto.startsWith("web/lists/getbytitle('SOLICITUDES ACCESO APLICACIONES')")) {
        const c2 = JSON.parse(req.postData() || '{}'); delete c2.__metadata; const ms = resto.match(/items\((\d+)\)/);
        if (ms) { Object.assign(pets.find(x => x.Id === +ms[1]), c2, c2.ResueltoPorId ? { ResueltoPor: U[c2.ResueltoPorId] || { Id: c2.ResueltoPorId, Title: 'X' } } : {}); return r.fulfill({ status: 204, body: '' }); }
        if (resto.endsWith('/items')) { const it = { Id: pets.length + 1, ...c2, Solicitante: U[c2.SolicitanteId], Created: new Date().toISOString() }; pets.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } }); }
        return r.fulfill({ status: 204, body: '' });
      }
      if (resto.startsWith("web/lists/getbytitle('ASIGNACIONES REGISTRO SIPERDEF')")) {
        const c2 = JSON.parse(req.postData() || '{}'); delete c2.__metadata; const ms = resto.match(/items\((\d+)\)/);
        if (ms) { if (req.headers()['x-http-method'] === 'DELETE') asigs = asigs.filter(x => x.Id !== +ms[1]); else Object.assign(asigs.find(x => x.Id === +ms[1]), c2); return r.fulfill({ status: 204, body: '' }); }
        if (resto.endsWith('/items')) { asigs.push({ Id: 100 + asigs.length, ...c2 }); return r.fulfill({ status: 201, json: { d: { Id: 100 } } }); }
        return r.fulfill({ status: 204, body: '' });
      }
      const gu = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users(\/removebyid\((\d+)\))?/);
      if (gu) { if (gu[3]) grupoReg = grupoReg.filter(x => x.Id !== +gu[3]); else anadidosReg.push(JSON.parse(req.postData()).LoginName); return r.fulfill({ status: 200, json: { d: {} } }); }
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
    if (resto.startsWith("web/lists/getbytitle('SUSTITUCIONES JEFES UNIDAD')")) {
      if (!intLista) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
      if (resto.includes('/fields')) return J({ value: (intCampos || ['Title', 'NumSolicitud', 'UnidadNum', 'Titular', 'TitularUid', 'AusenciaDesde', 'AusenciaHasta', 'TipoSustitucion', 'Sustituto', 'SustitutoUid', 'Desde', 'Hasta', 'Telefono', 'Correo', 'Orden', 'EstadoSustitucion']).map(n => ({ InternalName: n })) });
      if (!resto.includes('/items')) return J({ Id: 'int', Title: 'SUSTITUCIONES JEFES UNIDAD', ItemCount: ints.length, ListItemEntityTypeFullName: 'SP.Data.SUSTITUCIONESItem' });
      return J({ value: ints.filter(x => x.EstadoSustitucion !== 'ANULADA') });
    }
    if (resto.startsWith("web/sitegroups/getbyname('PERMISOS - MANDO')/users")) return grupoMando ? J({ value: grupoMando }) : r.fulfill({ status: 404, body: '' });
    if (resto.startsWith('web/currentuser/groups')) return J({ value: (registro ? [{ Title: 'Personal de Registro' }] : [{ Title: 'Integrantes cdv' }]).concat(mando ? [{ Title: 'PERMISOS - MANDO' }] : []) });
    if (resto.startsWith('SP.UserProfiles.PeopleManager')) return J({ Title: 'COMANDANTE', UserProfileProperties: verbose ? { results: [{ Key: 'Department', Value: 'UNIDAD B' }] } : [{ Key: 'Department', Value: 'UNIDAD B' }] });
    { const gid = resto.match(/web\/getuserbyid\((\d+)\)/); if (gid) { cuentasPedidas.push(+gid[1]); return J({ LoginName: 'i:0#.w|et\\u' + gid[1] }); } }
    if (resto.startsWith("web/sitegroups/getbyname('Personal de Registro')/users")) return J({ value: grupoReg });
    for (const [t, ok, rs, ws, lista_, campo] of [['SOLICITUDES ACCESO APLICACIONES', solLista, 2, 2, pets, 'SolicitanteId'], ['ASIGNACIONES REGISTRO SIPERDEF', asigLista, 1, 4, asigs, 'RegistradorId']]) {
      if (!resto.startsWith("web/lists/getbytitle('" + t + "')")) continue;
      if (!ok) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
      if (resto.includes('/fields')) return J({ value: ['Title', 'Solicitante', 'Correo', 'Empleo', 'Unidad', 'UnidadesIds', 'Cargo', 'DepartamentoPerfil', 'Telefono', 'Papel', 'Motivo', 'Aplicacion', 'EstadoSolicitud', 'GrupoAsignado', 'Resolucion', 'ResueltoPor', 'FechaResolucion', 'Registrador', 'UnidadesTexto'].map(n => ({ InternalName: n })) });
      if (!resto.includes('/items')) return J({ Id: t, Title: t, ListItemEntityTypeFullName: 'SP.Data.X', ReadSecurity: rs, WriteSecurity: ws });
      const fl = decodeURIComponent((u.match(/\$filter=([^&]*)/) || [])[1] || ''), me = fl.match(new RegExp(campo + ' eq (\\d+)')), app = fl.match(/Aplicacion eq '([^']+)'/);
      return J({ value: lista_.filter(x => (!me || (campo === 'SolicitanteId' ? x.Solicitante && x.Solicitante.Id : x.RegistradorId) === +me[1]) && (!app || x.Aplicacion === app[1])) });
    }
    if (resto.startsWith('web/currentuser')) return J({ Id: 279, Title: U[279].Title, Email: U[279].EMail, LoginName: 'i:0#.w|et\\usuario' });
    if (resto.startsWith('web/siteusers')) return J({ value: Object.values(U).map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail, LoginName: 'i:0#.w|et\\u' + x.Id })).concat(otraCuenta ? [{ Id: 280, Title: 'USUARIO DE PRUEBA', Email: 'usuario@et.mde.es', LoginName: 'et\\usuario' }, { Id: 281, Title: 'BUZON COMPARTIDO', Email: 'usuario@et.mde.es' }] : []) });
    if (resto.includes("getbytitle('empleos')")) return J({ value: [{ Title: 'Comandante' }, { Title: 'Sargento' }] });
    if (resto.includes("getbytitle('UNIDADES')")) return J({ value: [{ Id: 1, Title: 'UNIDAD A' }, { Id: 2, Title: 'UNIDAD B' }] });
    if (resto.includes('/fields')) return J({ value: [{ InternalName: 'Estado', Choices: ['0-Borrador de Solicitante', '1-Pendiente de Aprobar', '2-Aprobado', '3-Autorizado', '4-Registrado SIPERDEF', '5-Rechazado'] },
      { InternalName: 'TipoDePermiso', Choices: ['Vacaciones (Art.5)', 'Permiso por asuntos particulares (Art.6.a)', 'Permiso para compensar un servicio.'] }, { InternalName: 'CupoDeA_x00f1_o', Choices: ['2025', '2026'] },
      { InternalName: 'Dependencia', Choices: ['JEFATURA', 'SEGURIDAD'] }] });
    const mi = resto.match(/items\((\d+)\)/);
    if (mi) { const it = items.find(x => x.Id === +mi[1]); return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, ...it } } }); }
    if (sinExpand && resto.includes('siteuserinfolist')) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
    if (sinExpand && resto.includes("getbytitle('Solicitud de Permisos')/items") && /\$expand=[^&]*Unidad0/.test(u)) return r.fulfill({ status: 404, json: { error: { message: { value: 'List does not exist' } } } });
    if (sinExpand && resto.includes("fields/getbyinternalnameortitle('Unidad0')")) return J({ LookupList: '{ab12cd34-0000-0000-0000-000000000001}', LookupWebId: 'w' });
    if (sinExpand && resto.includes("lists(guid'ab12cd34")) return r.fulfill({ status: 404, body: '' });
    if (resto.includes('$select=Id,FechaInicio,FechaDeFin,Estado')) {
      const sid = +((u.match(/SolicitanteId eq (\d+)/) || [])[1] || 0);
      const propios = items.filter(x => x.Solicitante && x.Solicitante.Id === sid).map(x => ({ Id: x.Id, FechaInicio: x.FechaInicio, FechaDeFin: x.FechaDeFin, Estado: x.Estado }));
      return J({ value: sid === 12 ? propios.concat([{ Id: 80, FechaInicio: d(21), FechaDeFin: d(22), Estado: '3-Autorizado' }]) : propios });   // AUTORIZADOR UNO, de permiso los días +21 y +22
    }
    if (resto.includes('/items')) {
      const filtro = (u.match(/\$filter=([^&]*)/) || [])[1] || ''; if (u.includes('Title')) ultimoFiltro = filtro;
      if (!filtro) return J({ value: items });
      const ids = [...filtro.matchAll(/(\w+)Id eq (\d+)/g)], est = [...filtro.matchAll(/Estado eq '([^']+)'/g)].map(x => x[1]), txt = [...filtro.matchAll(/(\w+) eq '([^']+)'/g)].filter(([, k]) => k !== 'Estado');
      const sub = [...filtro.matchAll(/substringof\('([^']+)',([\w/]+)\)/g)];
      const val = (it, k) => { const [a, b] = k.split('/'); return b ? (it[a] && it[a][b]) || '' : it[a] || ''; };
      if (sub.length && sinSubstr) return r.fulfill({ status: 400, body: '' });
      const conIds = it => u.includes('$expand') ? it : ({ ...it, ...Object.fromEntries(['Solicitante', 'RepresentanteDelSolicitante', 'AprobadorDePermiso', 'AutorizadorDelPermiso', 'Registro_x0020_SIPERDEF', 'Author'].map(k => [k + 'Id', it[k] && it[k].Id])), Unidad0Id: it.Unidad0 && it.Unidad0.Id, Solicitante: undefined, Unidad0: undefined });
      return J({ value: items.map(conIds).filter((it0, i) => { const it = items[i]; return ids.some(([, k, v]) => it[k] && it[k].Id === +v) || est.includes(it.Estado) || txt.some(([, k, v]) => String(it[k] || '').toLowerCase() === v.toLowerCase()) ||
        sub.some(([, v, k]) => String(val(it, k)).toUpperCase().includes(v.toUpperCase())); }) });
    }
    if (resto.includes('sitegroups/getbyname')) return J({ value: [{ Title: 'REGISTRADOR UNO' }, { Title: U[279].Title }] });
    if (resto.includes('/roleassignments')) return J({ value: [{ Member: { Title: 'Integrantes CALIDAD-VIDA', PrincipalType: 8 }, RoleDefinitionBindings: [{ Name: 'Leer' }] },
      { Member: { Title: 'Personal de Registro', PrincipalType: 8 }, RoleDefinitionBindings: [{ Name: 'Colaborar' }, { Name: 'Acceso limitado' }] }] });
    if (resto.includes("getbytitle('Solicitud de Permisos')")) return J({ Id: 'g', Title: 'Solicitud de Permisos', ListItemEntityTypeFullName: 'SP.Data.Solicitud_x0020_de_x0020_PermisosListItem', EffectiveBasePermissions: { High: '0', Low: String((gestor ? 0x80F : 0x7) | (admin ? 0x2000000 : 0)) }, RootFolder: { ServerRelativeUrl: WEB + '/Lists/Solicitud de Permisos' } });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = verbose ? '[verbose]' : '[ligero]';
  await p.goto(O + WEB + '/Documentos%20compartidos/permisos.html' + (soloAlcance === 'enlace' ? '?id=1' : '')); await p.waitForTimeout(800);
  if (soloAlcance === 'solape en borrador') {
    const nueva = async (ini, fin, otro) => {
      await p.click('#tabs a[data-v=mias]'); await p.waitForTimeout(300); await p.click('[data-nueva]'); await p.waitForTimeout(400);
      if (otro) { await p.check('#nOtro'); await p.fill('#nSol input', otro); await p.waitForTimeout(300); await p.click('#nSol [data-sug="0"]'); await p.waitForTimeout(300); }
      await p.selectOption('#fSol [name=tipo]', 'Vacaciones (Art.5)'); await p.fill('#fSol [name=ini]', d(ini).slice(0, 10)); await p.fill('#fSol [name=fin]', d(fin).slice(0, 10));
      await p.selectOption('#fSol [name=empleo]', 'Comandante'); await p.selectOption('#fSol [name=unidad]', '1'); await p.fill('#fSol [name=nif]', '12345678Z');
      await p.fill('#nApr input', 'autoriz'); await p.waitForTimeout(200); await p.click('#nApr [data-sug="0"]'); await p.waitForTimeout(300);
    };
    const jefe = async (quien) => { await p.check('#nJefe'); await p.waitForTimeout(300); await p.fill('#nInt .intFila .iPer input', quien); await p.waitForTimeout(300); await p.click('#nInt .intFila [data-sug="0"]'); await p.waitForTimeout(300); await p.fill('#nInt .intFila [name=iTel]', '600000000'); };
    // 1) SOLICITANTE DOS tiene un borrador (hecho por mí como representante) del +30 al +32; yo, jefe, lo pongo de sustituto del +30 al +31
    await nueva(30, 32, 'solicitante'); await p.click('#fSol #nBorrador'); await p.waitForTimeout(1500); await p.click('#dlg [data-cerrar]').catch(() => {});
    await nueva(30, 31); await jefe('solicitante'); posts.length = 0; await p.click('#fSol #nEnviar'); await p.waitForTimeout(1200);
    console.log(tag, 'sustituto con borrador en esas fechas:', await p.textContent('#nError'), '| no guardado:', !posts.some(x => x.ruta.endsWith('/items')));
    await p.click('#dlg [data-cerrar]');
    // 2) Yo, jefe, dejo en borrador mi permiso del +40 al +41 con APROBADOR UNO de sustituto; luego pido permiso en su nombre el +40
    await nueva(40, 41); await jefe('aprob'); await p.click('#fSol #nBorrador'); await p.waitForTimeout(1500); await p.click('#dlg [data-cerrar]').catch(() => {});
    console.log(tag, 'designación en borrador guardada:', ints.filter(x => x.Desde && x.Desde.slice(0, 10) === d(40).slice(0, 10)).map(x => x.Sustituto + ':' + x.EstadoSustitucion).join(','));
    await nueva(40, 40, 'aprob'); posts.length = 0; await p.click('#fSol #nEnviar'); await p.waitForTimeout(800);
    console.log(tag, 'pedir permiso siendo sustituto (designación en borrador):', await p.textContent('#nError'), '| no guardado:', !posts.some(x => x.ruta.endsWith('/items')), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'crear lista de pruebas') {
    console.log(tag, 'banda:', await p.textContent('.bandaPruebas').catch(() => 'NINGUNA'), '| título:', await p.title());
    console.log(tag, 'sin lista:', (await p.textContent('#vista')).replace(/\s+/g, ' ').slice(0, 200));
    await p.click('[data-crearpruebas]'); await p.waitForTimeout(2500);
    console.log(tag, 'columnas copiadas:', camposPruebas.join(', '), '| ahora:', await p.textContent('#estadoCarga'), '| pestañas:', await p.$$eval('#tabs a', a => a.length), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'jefaturas') {
    console.log(tag, 'pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
    await p.click('#tabs a[data-v=jefaturas]'); await p.waitForTimeout(400);
    console.log(tag, 'hoy:', (await p.textContent('#vista .card table.t')).replace(/\s+/g, ' ').slice(0, 260));
    console.log(tag, 'cuadro:', await p.$$eval('.gantt .gfila:not(.gcab) .get b', n => n.map(x => x.textContent).join(',')), '| tramos:', await p.$$eval('.gseg', n => n.map(x => x.textContent + (x.classList.contains('prev') ? ' (rayado)' : '')).join(', ')),
      '| colores:', await p.$$eval('.gseg', n => [...new Set(n.map(x => x.style.backgroundColor))].length), '| línea de hoy:', await p.$$eval('.lhoy', n => n.length));
    if (!verbose) await p.screenshot({ path: new URL('jefaturas.png', import.meta.url).pathname, fullPage: true });
    await p.uncheck('#jefPend'); await p.waitForTimeout(200);
    console.log(tag, 'sin pendientes:', await p.$$eval('.gseg', n => n.map(x => x.textContent).join(', ')));
    await p.check('#jefPend'); await p.check('#jefTri'); await p.waitForTimeout(200);
    console.log(tag, 'tres meses: días en la cabecera:', await p.$$eval('.gdias span', n => n.length));
    const [imp] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-jefimp]')]); await imp.waitForLoadState();
    console.log(tag, 'impreso:', await imp.title(), '| secciones:', await imp.$$eval('h3', h => h.map(x => x.textContent).join(' | ')), '| tramos:', await imp.$$eval('.gseg', n => n.length));
    await imp.close();
    // Cambiar los sustitutos de mi permiso ya autorizado (la 3): se anulan los anteriores y se avisa a sustitutos y autorizador
    await p.evaluate(() => { const a = document.createElement('a'); a.dataset.id = '3'; document.body.append(a); a.click(); a.remove(); }); await p.waitForTimeout(600);
    console.log(tag, 'ficha 3:', (await p.textContent('#dlg .jefpanel')).replace(/\s+/g, ' ').slice(0, 260));
    await p.click('[data-intedit]'); await p.waitForTimeout(500);
    await p.fill('#intEdit .intFila:nth-child(1) [name=iTel]', '699999999'); posts.length = 0;
    await p.click('#intEdit .intGuardar'); await p.waitForTimeout(1800);
    const avisos = posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties);
    console.log(tag, 'cambiar sustitutos:', (await p.textContent('#dlg .okmsg, #dlg .aviso')).replace(/\s+/g, ' ').slice(0, 200), '| tramos de la 3:', ints.filter(x => x.NumSolicitud === 3).map(x => x.Sustituto + ':' + x.Telefono + ':' + x.EstadoSustitucion).join(', '),
      '| avisos:', avisos.map(x => x.To.results.join() + ' «' + x.Subject.slice(0, 40) + '»').join(' / '), '| errores:', errs);
    await p.click('#dlg [data-cerrar]');
    // Soy el sustituto de la 2 y estoy de permiso ese día (la 3): no se puede autorizar
    await p.evaluate(() => { const a = document.createElement('a'); a.dataset.id = '2'; document.body.append(a); a.click(); a.remove(); }); await p.waitForTimeout(600);
    posts.length = 0; await p.click('[data-acc=autorizar]'); await p.waitForTimeout(1200);
    console.log(tag, 'autorizar con el sustituto de permiso:', (await p.textContent('#accMsg')).slice(0, 220), '| no guardado:', !posts.some(x => /items\(2\)/.test(x.ruta) && x.cab['x-http-method']));
    await p.click('#dlg [data-cerrar]');
    // Soy sustituto (encargado de despacho) de la 6 los días +6 a +8: no puedo pedir permiso esos días
    await p.click('#tabs a[data-v=mias]'); await p.waitForTimeout(300); await p.click('[data-nueva]'); await p.waitForTimeout(400);
    await p.selectOption('#fSol [name=tipo]', 'Vacaciones (Art.5)'); await p.fill('#fSol [name=ini]', d(7).slice(0, 10)); await p.fill('#fSol [name=fin]', d(7).slice(0, 10));
    await p.selectOption('#fSol [name=empleo]', 'Comandante'); await p.selectOption('#fSol [name=unidad]', '1'); await p.fill('#fSol [name=nif]', '12345678Z');
    await p.fill('#nApr input', 'aprob'); await p.waitForTimeout(200); await p.click('#nApr [data-sug="0"]'); await p.waitForTimeout(300);
    posts.length = 0; await p.click('#fSol #nEnviar'); await p.waitForTimeout(500);
    console.log(tag, 'pedir permiso siendo sustituto:', await p.textContent('#nError'), '| no guardado:', !posts.some(x => x.ruta.endsWith('/items')), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'preparar jefaturas') {
    await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(600);
    console.log(tag, 'antes:', (await p.textContent('#jefPrep')).replace(/\s+/g, ' ').slice(0, 220), '| pestaña Jefaturas:', await p.$$eval('#tabs a[data-v=jefaturas]', n => n.length));
    await p.click('[data-jefcrear]'); await p.waitForTimeout(1500); await p.click('[data-jefgrupo]'); await p.waitForTimeout(800);
    await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(600);
    console.log(tag, 'después:', (await p.textContent('#jefPrep')).replace(/\s+/g, ' ').slice(0, 220), '| columnas creadas:', (intCampos || []).length, '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'cuenta vieja') {
    await p.evaluate(() => { const a = document.createElement('a'); a.dataset.id = '12'; document.body.append(a); a.click(); a.remove(); }); await p.waitForTimeout(700);
    console.log(tag, 'cuenta vieja, recuadro:', (await p.textContent('#dlg .panel:has([data-reaviso])').catch(() => 'NO HAY')).replace(/\s+/g, ' ').slice(0, 420));
    enviados = []; await p.click('[data-reaviso]:not([data-ami])'); await p.waitForTimeout(1500);
    console.log(tag, 'cuenta vieja, reenviar:', (await p.textContent('#reavisoMsg')).replace(/\s+/g, ' ').slice(0, 330), '| llegó a:', enviados.join(', '));
    posts.length = 0; await p.click('[data-acc=autorizar]'); await p.waitForTimeout(1500);
    console.log(tag, 'autorizar justo después de reenviar:', (await p.textContent('#accMsg, #dlg .okmsg, #dlg .aviso').catch(() => '')).replace(/\s+/g, ' ').slice(0, 120), '| estado:', items.find(x => x.Id === 12).Estado);
    console.log(tag, 'cuenta vieja, historial:', items.find(x => x.Id === 12).RegistroDeBorrador.split(' / ').filter(x => x.includes('AVISO')).join(' | '), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'registro por unidad' || soloAlcance === 'registro sin unidad' || soloAlcance === 'propietario') {
    await p.click('#tabs a[data-v=registro]'); await p.waitForTimeout(300);
    console.log(tag, soloAlcance, '| pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
    console.log(tag, soloAlcance, '| aviso:', (await p.textContent('#vista .okmsg, #vista .aviso').catch(() => '')).replace(/\s+/g, ' ').slice(0, 110), '| pendientes de registrar:', await p.$$eval('[data-regok]', n => n.map(x => x.dataset.regok).join(',')), '| unidades en el filtro:', await p.$$eval('#rUni option', o => o.map(x => x.textContent).join(' / ')), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'sin expand') {
    console.log(tag, 'aviso:', (await p.textContent('#vista .aviso').catch(() => 'NINGUNO')).replace(/\s+/g, ' ').slice(0, 230));
    console.log(tag, 'mis solicitudes:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id + ':' + x.querySelector('.tit, b, strong')?.textContent.slice(0, 25)).join(' | ')), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'pedir acceso registro') {
    console.log(tag, 'pestañas:', await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | ')));
    await p.click('#tabs a[data-v=accesoreg]'); await p.waitForTimeout(800);
    console.log(tag, 'alerta:', (await p.textContent('#vista .error')).slice(0, 90));
    await p.selectOption('#fReg [name=empleo]', { index: 1 }); await p.selectOption('#fReg [name=unis]', ['1']); await p.fill('#fReg [name=cargo]', 'Auxiliar de personal'); await p.fill('#fReg [name=tel]', '912345678');
    await p.click('[data-regpedir]'); await p.waitForTimeout(200);
    console.log(tag, 'sin declaración:', await p.textContent('#regErr'));
    await p.check('#fReg [name=decl]'); posts.length = 0; await p.click('[data-regpedir]'); await p.waitForTimeout(1500);
    const al = posts.find(x => x.ruta.includes("SOLICITUDES ACCESO APLICACIONES')/items")), m = posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties).pop();
    console.log(tag, 'solicitud:', al && JSON.stringify((({ Unidad, UnidadesIds, Cargo, DepartamentoPerfil, Aplicacion, EstadoSolicitud }) => ({ Unidad, UnidadesIds, Cargo, DepartamentoPerfil, Aplicacion, EstadoSolicitud }))(JSON.parse(al.cuerpo))), '| aviso a:', m && m.To.results, '|', m && m.Subject);
    console.log(tag, 'después:', (await p.$$eval('#vista .okmsg, #vista .aviso', n => n.map(x => x.textContent).join(' / '))).replace(/\s+/g, ' ').slice(0, 400), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'accesos de registro') {
    await p.click('#tabs a[data-v=accesos]'); await p.waitForTimeout(1200);
    console.log(tag, 'pestaña:', await p.textContent('#tabs a[data-v=accesos]'), '| preparación:', (await p.textContent('#vista .card')).replace(/\s+/g, ' ').slice(0, 200));
    console.log(tag, 'pendiente:', (await p.textContent('[data-pet]')).replace(/\s+/g, ' ').slice(0, 220));
    posts.length = 0; await p.click('[data-araprobar]'); await p.waitForTimeout(1800);
    const m = posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties).pop();
    console.log(tag, 'aprobar:', JSON.stringify(anadidosReg), '| asignaciones:', JSON.stringify(asigs.map(a => [a.RegistradorId, a.UnidadesIds])), '| solicitud:', pets[0].EstadoSolicitud, '| correo:', m && m.To.results, m && m.Subject);
    await p.selectOption('[data-miem="11"] .arUnis', ['1', '2']); await p.click('[data-arguardar="11"]'); await p.waitForTimeout(1200);
    console.log(tag, 'asignar al actual:', JSON.stringify(asigs.map(a => [a.RegistradorId, a.UnidadesIds])), '|', (await p.textContent('[data-miem="11"] td:nth-child(2)')).trim());
    p.removeAllListeners('dialog'); p.on('dialog', dl => dl.accept());
    await p.click('[data-arretirar="11"]'); await p.waitForTimeout(1200);
    console.log(tag, 'retirar:', JSON.stringify(grupoReg.map(x => x.Id)), '| asignaciones:', JSON.stringify(asigs.map(a => a.RegistradorId)), '| errores:', errs);
    if (!verbose) await p.screenshot({ path: new URL('accesos-registro.png', import.meta.url).pathname, fullPage: true });
    await b.close(); return;
  }
  if (soloAlcance === 'enlace') {
    console.log(tag, 'enlace del correo abre:', await p.textContent('#dlg h2').catch(() => 'nada'), '| URL limpia:', p.url().endsWith('permisos.html'));
    await b.close(); return;
  }
  if (soloAlcance === 'jefe por nombre') {
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
    console.log(tag, 'jefe por nombre: pendientes de autorizar:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id)), '| filtro con apellido:', /substringof/.test(ultimoFiltro));
    console.log(tag, 'errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'jefe por correo') {
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
    console.log(tag, 'jefe por correo: pendientes de autorizar:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id)), '| filtro con correo:', /CorreoDeAUTORIZADOR/.test(ultimoFiltro));
    await p.click('.sol[data-id="10"]'); await p.waitForTimeout(500);
    console.log(tag, 'puede autorizar:', !!(await p.$('[data-acc=autorizar]')), '| errores:', errs);
    await b.close(); return;
  }
  if (soloAlcance === 'cuentas') {
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
    console.log(tag, 'otra cuenta: pendientes de aprobar:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id)), '| filtro con 280:', ultimoFiltro.includes('280'), '| buzón compartido (281) fuera:', !ultimoFiltro.includes('281'));
    console.log(tag, 'estado reconocido:', await p.textContent('.sol[data-id="9"] .badge'));
    console.log(tag, 'sin recuadro «¿Echas en falta…?»:', !(await p.$('[data-comprobar]')), '| errores:', errs);
    await p.click('.sol[data-id="9"]'); await p.waitForTimeout(600);
    console.log(tag, 'aviso por correo (otra cuenta):', (await p.textContent('#dlg .panel:has([data-reaviso])')).replace(/\s+/g, ' ').slice(0, 330));
    posts.length = 0; await p.click('[data-reaviso][data-ami]'); await p.waitForTimeout(800);
    const ra = posts.find(x => x.ruta.startsWith('SP.Utilities')); console.log(tag, 'enviármelo a mí:', ra && JSON.parse(ra.cuerpo).properties.To.results, '|', (await p.textContent('#reavisoMsg')).slice(0, 120));
    await p.click('#dlg [data-cerrar]');
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
    console.log(tag, 'sin control total, pestaña Ajustes:', await p.$$eval('#tabs a[data-v=ajustes]', a => a.length));
    admin = true; await p.click('#recargar'); await p.waitForTimeout(600);
    console.log(tag, 'con control total, pestaña Ajustes:', await p.$$eval('#tabs a[data-v=ajustes]', a => a.length));
    await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(200); await p.click('[data-seguridad]'); await p.waitForTimeout(600);
    console.log(tag, 'accesos:', (await p.textContent('#segRes')).replace(/\s+/g, ' ').slice(0, 520));
    await p.screenshot({ path: new URL('seguridad.png', import.meta.url).pathname, fullPage: true });
    console.log(tag, 'errores:', errs); admin = false;
    await b.close(); return;
  }
  if (soloAlcance && soloAlcance !== 'correo rechazado' && soloAlcance !== 'jefaturas' && soloAlcance !== 'preparar jefaturas' && soloAlcance !== 'crear lista de pruebas' && soloAlcance !== 'solape en borrador') {
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
  if (!soloAlcance) {
    // Soy jefe de unidad: sustitutos obligatorios, sin huecos, con teléfono y correo
    await p.check('#nJefe'); await p.waitForTimeout(300);
    await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
    console.log(tag, 'jefe sin sustituto:', await p.textContent('#nError'));
    const fila = n => '#nInt .intFila:nth-child(' + n + ') ';
    await p.fill(fila(1) + '.iPer input', 'autoriz'); await p.waitForTimeout(300); await p.click(fila(1) + '[data-sug="0"]'); await p.waitForTimeout(300);
    console.log(tag, 'correo del sustituto rellenado:', await p.inputValue(fila(1) + '[name=iCorreo]'), '| fechas propuestas:', await p.inputValue(fila(1) + '[name=iDesde]'), await p.inputValue(fila(1) + '[name=iHasta]'));
    await p.fill(fila(1) + '[name=iHasta]', d(21).slice(0, 10)); await p.fill(fila(1) + '[name=iTel]', '611000111');
    await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
    console.log(tag, 'sustitutos con hueco:', await p.textContent('#nError'));
    await p.click('#nIntMas'); await p.waitForTimeout(300);
    console.log(tag, 'segundo tramo propuesto desde:', await p.inputValue(fila(2) + '[name=iDesde]'), 'hasta', await p.inputValue(fila(2) + '[name=iHasta]'));
    await p.fill(fila(2) + '.iPer input', 'usuario de'); await p.waitForTimeout(300); await p.click(fila(2) + '[data-sug="0"]'); await p.waitForTimeout(300);
    await p.fill(fila(2) + '[name=iTel]', '622000222');
    await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
    console.log(tag, 'yo como mi propio sustituto:', await p.textContent('#nError'));
    await p.click(fila(2) + '[data-quitar]').catch(() => {}); await p.fill(fila(2) + '.iPer input', 'solicitante'); await p.waitForTimeout(300); await p.click(fila(2) + '[data-sug="0"]'); await p.waitForTimeout(300);
    await p.fill(fila(2) + '[name=iDesde]', d(21).slice(0, 10));
    await p.click('#fSol #nEnviar'); await p.waitForTimeout(200);
    console.log(tag, 'tramos solapados:', await p.textContent('#nError'));
    await p.fill(fila(2) + '[name=iDesde]', d(22).slice(0, 10)); await p.selectOption(fila(2) + '[name=iTipo]', 'Encargado de despacho');
    console.log(tag, 'explicación del tipo:', (await p.textContent(fila(2) + '.iDesc')).slice(0, 80));
    await p.click('#fSol #nEnviar'); await p.waitForTimeout(800);
    console.log(tag, 'sustituto de permiso:', await p.textContent('#nError'), '| no guardado:', !posts.some(x => x.ruta.endsWith('/items')));
    await p.click(fila(1) + '[data-quitar]'); await p.fill(fila(1) + '.iPer input', 'aprob'); await p.waitForTimeout(300); await p.click(fila(1) + '[data-sug="0"]'); await p.waitForTimeout(300);
  }
  posts.length = 0;
  await p.click('#fSol #nEnviar'); await p.waitForTimeout(1500);
  if (!soloAlcance) console.log(tag, 'sustitutos guardados:', JSON.stringify(ints.filter(x => x.NumSolicitud === 7).map(x => [x.TipoSustitucion, x.Sustituto, x.Desde.slice(0, 10), x.Hasta.slice(0, 10), x.Telefono, x.Correo, x.EstadoSustitucion, x.Titular, x.Title])),
    '| marca en la ficha:', (await p.textContent('#dlg .jefpanel h3').catch(() => 'NO')).trim());
  const alta = posts.find(x => x.ruta.endsWith('/items')), cAlta = JSON.parse(alta.cuerpo);
  console.log(tag, 'alta:', JSON.stringify({ Estado: cAlta.Estado, Sol: cAlta.SolicitanteId, Apr: cAlta.AprobadorDePermisoId, AprT: cAlta.AprobadorTexto, Cor: cAlta.CorreoDeAPROBADOR, Uni: cAlta.Unidad0Id, mas1: cAlta.dia_x0020_mas_x0020_uno, Motivo: cAlta.MotivoSeleccionado, Reg: cAlta.RegistroDeBorrador.slice(0, 50), Titulo: cAlta.Title }));
  const m1 = JSON.parse(posts.find(x => x.ruta.startsWith('SP.Utilities')).cuerpo).properties;
  console.log(tag, 'correo alta:', m1.To.results, m1.CC.results, '|', m1.Subject, '| enlace:', (m1.Body.match(/href="([^"]+)"/) || [])[1]);
  console.log(tag, 'mensaje:', await p.textContent('#dlg .okmsg, #dlg .aviso'));
  console.log(tag, 'historial tras enviar:', (items.find(x => x.Id === 7) || {}).RegistroDeBorrador?.split(' / ').filter(x => x.includes('AVISO')).join(' | '));
  if (!soloAlcance) {
    await p.click('#dlg [data-cerrar]'); await p.click('#tabs a[data-v=todas]').catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(() => { const a = document.createElement('a'); a.className = 'sol'; a.dataset.id = '2'; document.body.append(a); a.click(); a.remove(); }); await p.waitForTimeout(600);
    console.log(tag, 'aviso por correo (mi cuenta):', (await p.textContent('#dlg .panel:has([data-reaviso])').catch(() => 'NO HAY')).replace(/\s+/g, ' ').slice(0, 300));
    buzonMal = ['sol2@et.mde.es']; enviados = []; posts.length = 0; await p.click('[data-reaviso]:not([data-ami])'); await p.waitForTimeout(1200); buzonMal = [];
    console.log(tag, 'reenviar con el solicitante rechazado:', (await p.textContent('#reavisoMsg')).slice(0, 260), '| llegó a:', enviados.join(', '));
    await p.click('#dlg [data-cerrar]'); await p.click('#tabs a[data-v=mias]').catch(() => {}); await p.waitForTimeout(300);
    await p.click('.sol[data-id="7"]'); await p.waitForTimeout(400);
  }
  if (soloAlcance === 'correo rechazado') {
    console.log(tag, 'rechaza:', buzonMal.join(', '), '| llegó a:', enviados.join(', '), '| cuentas buscadas por Id:', cuentasPedidas.join(','));
    await b.close(); return;
  }
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
  console.log(tag, 'aviso «aún no concedido» en el correo de aprobación:', m2.Body.includes('AÚN NO ESTÁ CONCEDIDO'));
  if (!verbose) fs.writeFileSync(new URL('correo.html', import.meta.url), m2.Body);
  console.log(tag, 'correo aprobado:', m2.To.results, m2.CC.results, m2.BCC.results, '|', m2.Subject);
  await p.click('#dlg [data-cerrar]');
  // Autorizar la 2
  await p.click('.sol[data-id="2"]'); await p.waitForTimeout(500);
  console.log(tag, 'pasos de la 2 (aprobada):', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '), '| estado:', await p.textContent('#dlg .campo div'));
  if (!verbose) await p.screenshot({ path: new URL('pasos.png', import.meta.url).pathname });
  posts.length = 0; await p.click('[data-acc=autorizar]'); await p.waitForTimeout(1500);
  const cAu = JSON.parse(posts.find(x => /items\(2\)/.test(x.ruta)).cuerpo);
  console.log(tag, 'autorizar:', JSON.stringify({ Estado: cAu.Estado, EAu: cAu.EstadoDeAutorizacion, ER: cAu.EstadoDeRegistro }));
  const mInt = posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties).filter(x => /MANDO ACCIDENTAL|ENCARGADO DE DESPACHO|MÁS CARACTERIZADO/.test(x.Subject));
  console.log(tag, 'sustitutos de la 2 tras autorizar:', ints.filter(x => x.NumSolicitud === 2).map(x => x.EstadoSustitucion).join(','), '| aviso a sustitutos:', mInt.map(x => x.To.results.join() + ' «' + x.Subject + '»').join(' / '),
    '| mensaje:', (await p.textContent('#dlg .okmsg, #dlg .aviso')).replace(/\s+/g, ' ').slice(0, 200));
  await p.click('#dlg [data-cerrar]');
  // Ya tramitadas por mí: la 1 (aprobada) y la 2 (autorizada) dejan de estar pendientes pero se siguen viendo
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, 'conmutador:', await p.$$eval('[data-pv]', n => n.map(x => x.textContent)));
  await p.click('[data-pv=tramitadas]'); await p.waitForTimeout(200);
  console.log(tag, 'ya tramitadas:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id + ' ' + x.querySelector('.badge[style]').textContent + ' [' + x.querySelector('.badge').textContent + ']')));
  console.log(tag, 'expedientes:', await p.$$eval('#vista details.expediente summary', n => n.map(x => x.textContent.replace(/\s+/g, ' '))));
  await p.fill('#tBusca', 'nadie'); await p.waitForTimeout(200);
  console.log(tag, 'buscar «nadie»:', await p.textContent('#vista .vacio'), '| foco:', await p.evaluate(() => document.activeElement.id));
  await p.fill('#tBusca', 'dos'); await p.waitForTimeout(200);
  console.log(tag, 'buscar «dos»:', await p.$$eval('#vista details.expediente', n => n.length), 'expediente(s)');
  await p.selectOption('#tTipo', 'autorizada'); await p.waitForTimeout(200);
  console.log(tag, 'solo autorizadas por mí:', await p.$$eval('#vista .sol', n => n.map(x => x.dataset.id)));
  if (!verbose) await p.screenshot({ path: new URL('tramitadas.png', import.meta.url).pathname, fullPage: true });
  await p.selectOption('#tTipo', ''); await p.click('[data-pv=pendientes]'); await p.waitForTimeout(200);
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
  await p.waitForTimeout(2800);
  console.log(tag, 'después: filas pendientes', await p.$$eval('#vista [data-regok]', n => n.map(x => x.dataset.regok)), '| verde aún:', await p.$$eval('#vista .regok', n => n.length), '|', await p.textContent('#vista .okmsg').catch(() => ''));
  await p.click('[data-regv=hechos]'); await p.waitForTimeout(200);
  console.log(tag, 'en «Ya registrados»:', await p.$$eval('#vista table.t tr td:first-child a', n => n.map(x => x.dataset.ver)));
  await p.click('[data-regv=pendientes]'); await p.waitForTimeout(200);
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
// Registro por unidad
registro = true; asigs = [{ Id: 100, RegistradorId: 279, UnidadesIds: '2' }]; await prueba(false, 'registro por unidad'); await prueba(true, 'registro por unidad');
asigs = []; await prueba(false, 'registro sin unidad');
registro = false; admin = true; await prueba(false, 'propietario'); admin = false;
registro = false; pets = []; await prueba(false, 'pedir acceso registro'); pets = []; await prueba(true, 'pedir acceso registro');
// Colabora rechaza una dirección: el aviso sale igualmente al resto (y a uno mismo por su cuenta de inicio de sesión)
buzonMal = ['asansen@et.mde.es']; enviados = []; pets = []; await prueba(false, 'pedir acceso registro');
buzonMal = ['usuario@et.mde.es', 'aprob1@et.mde.es']; enviados = []; await prueba(false, 'correo rechazado');
buzonMal = ['usuario@et.mde.es', 'aprob1@et.mde.es', 'i:0#.w|et\\u11']; enviados = []; await prueba(true, 'correo rechazado'); buzonMal = [];
admin = true; asigs = []; grupoReg = [{ Id: 11, Title: 'APROBADOR UNO', Email: 'aprob1@et.mde.es', LoginName: 'i:0#.w|et\\a1' }]; anadidosReg = [];
pets = [{ Id: 1, Title: 'SOLICITANTE DOS', Solicitante: U[13], Correo: U[13].EMail, Empleo: 'Sargento', Unidad: 'UNIDAD B', UnidadesIds: '2', Cargo: 'Auxiliar', DepartamentoPerfil: 'UNIDAD A', Telefono: '600', Aplicacion: 'REGISTRO SIPERDEF', EstadoSolicitud: 'PENDIENTE', Created: d(-1) }];
await prueba(false, 'accesos de registro'); admin = false; asigs = []; grupoReg = []; registro = true;
registro = false; await prueba(false, 'usuario normal');
registro = true; await prueba(false, 'registro');
gestor = true; await prueba(true, 'gestor');
gestor = false; await prueba(false, 'enlace');
registro = false; sinExpand = true; await prueba(false, 'sin expand'); admin = true; await prueba(true, 'sin expand'); admin = false; sinExpand = false; registro = true;
registro = true; await prueba(false, 'seguridad'); await prueba(true, 'seguridad');
otraCuenta = true; await prueba(false, 'cuentas'); await prueba(true, 'cuentas'); otraCuenta = false;
jefeNombre = true; registro = false; await prueba(false, 'jefe por nombre'); sinSubstr = true; await prueba(true, 'jefe por nombre'); sinSubstr = false; jefeNombre = false; registro = true;
registro = false; await prueba(false, 'solape en borrador'); await prueba(true, 'solape en borrador'); registro = true;
mando = true; registro = false; sustYo = true; await prueba(false, 'jefaturas'); await prueba(true, 'jefaturas'); mando = false; sustYo = false;
admin = true; intLista = false; grupoMando = null; await prueba(false, 'preparar jefaturas'); intLista = true; grupoMando = [{ Id: 90, Title: 'EL GENERAL' }]; intCampos = null; admin = false; registro = true;
cuentaVieja = true; registro = false; buzonMal = ['viejo@et.mde.es', 'i:0#.w|et\\u777']; await prueba(false, 'cuenta vieja'); await prueba(true, 'cuenta vieja'); buzonMal = []; cuentaVieja = false; registro = true;
jefeOtraCuenta = true; registro = false; await prueba(false, 'jefe por correo'); await prueba(true, 'jefe por correo'); jefeOtraCuenta = false; registro = true;
if (PRUEBAS) {
  pruebasSinLista = true; admin = true; await prueba(false, 'crear lista de pruebas'); admin = false;
  console.log('[pruebas] correos enviados:', asuntos.length, '| todos con «[PRUEBAS]» en el asunto:', asuntos.every(a => a.startsWith('[PRUEBAS] ')));
}
