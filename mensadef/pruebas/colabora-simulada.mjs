// Colabora simulado para el control de acceso de SENDERO (15/11/2026): sitio /et/SUIGESUR/colaborativo con la página
// SENDERO-acceso.html y las listas «SENDERO Autorizados» y «SENDERO Solicitudes». Formato ligero o verbose (est.verbose:
// SharePoint 2013 contesta 406 a odata=nometadata). Datos ficticios (dominio pruebas.invalid).
import fs from 'fs';

export const O = 'https://colabora.mdef.es', WEB = '/et/SUIGESUR/colaborativo';
export const URL_PAGINA = O + WEB + '/Documentos%20compartidos/SENDERO-acceso.html';
const ROL = n => 1000 + n;
const TODOS = { Id: 9, Title: 'Usuarios del dominio', LoginName: 'c:0(.s|true' };
const SITIO = [
  { PrincipalId: 9, Member: TODOS, RoleDefinitionBindings: [{ RoleTypeKind: 3, Name: 'Colaborar' }] },
  { PrincipalId: 5, Member: { Id: 5, Title: 'Propietarios colaborativo', LoginName: 'Propietarios colaborativo' }, RoleDefinitionBindings: [{ RoleTypeKind: 5, Name: 'Control total' }] },
  { PrincipalId: 6, Member: { Id: 6, Title: 'Miembros colaborativo', LoginName: 'Miembros colaborativo' }, RoleDefinitionBindings: [{ RoleTypeKind: 3, Name: 'Colaborar' }] }];

export function nuevoEstado(opc = {}) {
  return { verbose: !!opc.verbose, xfo: !!opc.xfo, usuario: { Id: 11, Title: 'ADMIN PRUEBAS', Email: 'admin@pruebas.invalid' }, admin: true, gestores: [], listas: {}, grupos: {}, sigId: 100, escrituras: [] };
}
// Listas ya preparadas (para las pruebas de SENDERO)
export function listasPreparadas(est, reglas = []) {
  est.listas['SENDERO Autorizados'] = { Id: 'aaaaaaaa-0000-0000-0000-000000000001', items: [], campos: ['Tipo', 'Activo', 'Responsables', 'Hasta', 'Nota'], unique: true, asig: [], RS: 1, WS: 1 };
  est.listas['SENDERO Solicitudes'] = { Id: 'aaaaaaaa-0000-0000-0000-000000000002', items: [], campos: ['Correo', 'Ambito', 'Motivo', 'Estado', 'Respuesta', 'RespondidoPor', 'VersionSendero'], unique: true, asig: [], RS: 2, WS: 2 };
  reglas.forEach(r => est.listas['SENDERO Autorizados'].items.push(Object.assign({ Id: est.sigId++, Activo: true, Hasta: null, Nota: '', Responsables: '', AuthorId: 11, Created: new Date().toISOString() }, r)));
}

export async function simularColabora(ctx, est, archivo) {
  await ctx.route(O + '/**', async r => {
    const req = r.request(), u = new URL(req.url()), ruta = decodeURIComponent(u.pathname), q = Object.fromEntries(u.searchParams), met = req.method();
    const acc = req.headers().accept || '', verb = /verbose/.test(acc);
    if (ruta === decodeURIComponent(new URL(URL_PAGINA).pathname)) {
      return r.fulfill({ contentType: 'text/html; charset=utf-8', headers: est.xfo ? { 'X-Frame-Options': 'SAMEORIGIN' } : {}, body: fs.readFileSync(archivo, 'utf8') });
    }
    if (!ruta.includes('/_api/')) return r.fulfill({ contentType: 'text/html', body: '<html><body>Colabora</body></html>' });
    if (met === 'GET' && est.verbose && !verb) return r.fulfill({ status: 406, body: '' });
    const J = (obj, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status >= 400 ? { error: { message: { value: obj } } } : verb ? { d: Array.isArray(obj) ? { results: obj } : obj } : Array.isArray(obj) ? { value: obj } : obj) });
    const NO = () => J('Acceso denegado', 403);
    if (!ruta.startsWith(WEB + '/_api/')) return J('No existe', 404);
    const api = ruta.slice((WEB + '/_api/').length);
    const cuerpo = () => { try { return JSON.parse(req.postData() || '{}'); } catch { return {}; } };
    const yo = est.usuario, esGestor = est.gestores.includes(yo.Email);
    if (api === 'web' && met === 'GET') return J({ Url: O + WEB, Title: 'Colaborativo SUIGESUR' });
    if (api === 'contextinfo') return J({ GetContextWebInformation: { FormDigestValue: 'digest', FormDigestTimeoutSeconds: 1800 } });
    if (api === 'web/currentuser') return J({ Id: yo.Id, Title: yo.Title, Email: yo.Email, LoginName: 'i:0#.w|et\\' + yo.Email.split('@')[0] });
    if (api === 'web/EffectiveBasePermissions') return J({ High: '0', Low: String(est.admin ? 0x7fffffff : 0x20001) });
    if (api === 'web/roleassignments') return J(SITIO);
    let m;
    if ((m = /^web\/roledefinitions\/getbytype\((\d+)\)$/.exec(api))) return J({ Id: ROL(Number(m[1])) });
    if (api === 'web/ensureuser') return J({ Id: 9 });
    if ((m = /^web\/sitegroups\/getbyname\('(.*)'\)$/.exec(api))) return est.grupos[m[1]] ? J(est.grupos[m[1]]) : J('No se encuentra el grupo.', 500);  // como el real
    if (api === 'web/sitegroups' && met === 'POST') { if (!est.admin) return NO(); const t = cuerpo().Title; est.grupos[t] = { Id: 50, Title: t }; return J(est.grupos[t], 201); }
    if (api === 'web/lists' && met === 'POST') {
      if (!est.admin) return NO(); const t = cuerpo().Title;
      est.listas[t] = { Id: 'bbbbbbbb-0000-0000-0000-00000000000' + Object.keys(est.listas).length, items: [], campos: [], unique: false, asig: [], RS: 1, WS: 1 };
      return J({ Id: est.listas[t].Id, Title: t }, 201);
    }
    if (!(m = /^web\/lists\/getbytitle\('((?:[^']|'')*)'\)(.*)$/.exec(api))) return J('No existe', 404);
    const titulo = m[1].replace(/''/g, "'"), resto = m[2], L = est.listas[titulo];
    if (!L) return J('La lista no existe', 404);
    const esAut = titulo === 'SENDERO Autorizados';
    const puedeEditar = est.admin || esGestor;
    const asig = () => L.unique ? L.asig : SITIO;
    if (resto === '' && met === 'GET') return J({ Id: L.Id, Title: titulo, ListItemEntityTypeFullName: 'SP.Data.' + titulo.replace(/\W/g, '') + 'ListItem', HasUniqueRoleAssignments: L.unique, ReadSecurity: L.RS, WriteSecurity: L.WS });
    if (resto === '' && met === 'POST') { if (!est.admin) return NO(); const c = cuerpo(); if (c.ReadSecurity) L.RS = c.ReadSecurity; if (c.WriteSecurity) L.WS = c.WriteSecurity; return r.fulfill({ status: 204, body: '' }); }
    if (resto === '/EffectiveBasePermissions') return J({ High: '0', Low: String(puedeEditar ? 0x7fffffff : esAut ? 0x1 : 0x3) });
    if (resto.startsWith('/fields')) {
      if (met === 'GET') return J(['Title', 'Id', 'Created', 'Author'].concat(L.campos).map(n => ({ InternalName: n })));
      if (!est.admin) return NO(); L.campos.push(/Name="([^"]+)"/.exec(cuerpo().parameters.SchemaXml)[1]); return J({}, 201);
    }
    if (resto.startsWith('/breakroleinheritance')) { if (!est.admin) return NO(); L.asig = SITIO.map(a => JSON.parse(JSON.stringify(a))); L.unique = true; return J({}); }
    if (resto === '/roleassignments' && met === 'GET') return J(asig());
    if ((m = /^\/roleassignments\/addroleassignment\(principalid=(\d+),roledefid=(\d+)\)$/.exec(resto))) {
      if (!est.admin) return NO(); const id = Number(m[1]), tipo = Number(m[2]) - 1000;
      let a = L.asig.find(x => x.PrincipalId === id);
      if (!a) { a = { PrincipalId: id, Member: id === 9 ? TODOS : SITIO.find(x => x.PrincipalId === id) ? SITIO.find(x => x.PrincipalId === id).Member : id === 50 ? { Id: 50, Title: 'SENDERO Administradores', LoginName: 'SENDERO Administradores' } : { Id: id, Title: 'P' + id }, RoleDefinitionBindings: [] }; L.asig.push(a); }
      if (!a.RoleDefinitionBindings.some(b => b.RoleTypeKind === tipo)) a.RoleDefinitionBindings.push({ RoleTypeKind: tipo });
      return J({});
    }
    if ((m = /^\/roleassignments\/getbyprincipalid\((\d+)\)\/deleteobject\(\)$/.exec(resto))) { if (!est.admin) return NO(); L.asig = L.asig.filter(x => x.PrincipalId !== Number(m[1])); return J({}); }
    if (resto === '/items' && met === 'POST') {
      if (esAut && !puedeEditar) return NO();
      const c = cuerpo(); delete c.__metadata;
      const it = Object.assign({ Id: est.sigId++, Activo: esAut ? true : undefined, AuthorId: yo.Id, Created: new Date().toISOString() }, c);
      L.items.push(it); est.escrituras.push({ lista: titulo, alta: it }); return J(it, 201);
    }
    if ((m = /^\/items\((\d+)\)$/.exec(resto)) && met === 'POST') {
      if (!puedeEditar) return NO();
      const it = L.items.find(x => x.Id === Number(m[1])); if (!it) return J('No existe', 404);
      const c = cuerpo(); delete c.__metadata; Object.assign(it, c); est.escrituras.push({ lista: titulo, cambio: it.Id, datos: c }); return r.fulfill({ status: 204, body: '' });
    }
    if (resto === '/items' && met === 'GET') {
      let l = L.items.slice();
      if (L.RS === 2 && !puedeEditar && !esAut) l = l.filter(x => x.AuthorId === yo.Id);
      if (q.$filter) {
        const conds = [...q.$filter.matchAll(/(\w+) eq '((?:[^']|'')*)'/g)].map(x => [x[1], x[2].replace(/''/g, "'").toLowerCase()]);
        l = l.filter(it => conds.some(([c, v]) => String(it[c] == null ? '' : it[c]).toLowerCase() === v));
      }
      return J(l.map(x => Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'AuthorId'))));
    }
    return J('Ruta no simulada: ' + api, 400);
  });
}
