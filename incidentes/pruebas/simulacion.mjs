// Prueba de incidentes.html contra una lista «INCIDENTES DE SEGURIDAD» simulada (datos inventados).
// Uso: node incidentes/pruebas/simulacion.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(process.env.INC_HTML ? process.env.INC_HTML : new URL('../incidentes.html', import.meta.url), 'utf8');  // INC_HTML=incidentes/colabora/incidentes.html para probar la versión protegida
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const YO = { Id: 50, Title: 'USUARIO DE PRUEBA', EMail: 'usuario@et.mde.es' };
const P = { 61: { Id: 61, Title: 'JEFE UNIDAD A', EMail: 'jefea@et.mde.es' }, 62: { Id: 62, Title: 'JEFE UNIDAD B', EMail: 'jefeb@et.mde.es' } };
const GRUPOS = { SEGURIDAD_SUIGESUR: 101, SEGURIDAD_SUIGENOR: 102, SEGURIDAD_SUIGECAN: 103, SEGURIDAD_DIAPER: 104, SEGURIDAD_IGE: 105, 'Integrantes de la Colaborativo': 106 };
const MIEMBROS = { SEGURIDAD_SUIGESUR: ['sur1@et.mde.es', 'sur2@et.mde.es'], SEGURIDAD_SUIGENOR: ['nor1@et.mde.es'], SEGURIDAD_SUIGECAN: ['can1@et.mde.es'], SEGURIDAD_DIAPER: ['diacu1@et.mde.es'], SEGURIDAD_IGE: ['ige1@et.mde.es'] };
const d = n => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(9, 0, 0, 0); return x.toISOString(); };
let expandRoto = false, faltaCampo = null, items, misGrupos = [], admin = false, sinSubstringof = false, ultimoFiltro = '', lecturaMinima = '';
const base = { A_x00f1_o: '2026', Provincia: 'SEVILLA', Empleo: 'SARGENTO', ZONASE_x00d1_ALIZADA: true, Reiterada: 'NO', Denuncia: false, ValoradoPorSUIGE: false, ValoradoPorDIACU: false, ValoradoPorIGE: false,
  OBSERVACION: '<p>TEXTO RESERVADO DEL PARTE</p>', ANALISIS: '<div>Análisis</div>', MEDIDAS: 'Medidas', CONTROLMEDIDASADOPTADAS: 'Control', CONCLUSION: 'Conclusión', ObservacionesDelExpediente: '',
  ResponsableDeLaInformacion: P[61], correosPersonasInfo: 'info1@et.mde.es; info2@et.mde.es', MANDO1N: '1', MANDO2N: '', MANDO3N: '', OData__x004d_N1: 'IGE', OData__x004d_N2: '', OData__x004d_N3: '', OData__x004d_N4: '',
  Title: '', ESTADO: '', REGISTRODEACTIVIDAD: '', ModificadoPorTEXTO: '', SUIGES: null, Unidad: null, OTRO: '', NDenuncia: '', PROBABILIDADES: '', ACEPTACION: true, TipoDeIncidente: '', ResponsableDelParte: '', DIACU: null, VALORACIONSUIGES: '', VALORACIONDIACU: '', valoracionIGE: '', Usuario: null, grupo: [] };
// Listas auxiliares del formulario: M2N apunta a M1N (ID_M1N) y M3N a M2N; «OFICINA X» no tiene SUIGE
const AUXL = {
  M1N: [{ Id: 1, Title: 'IGE' }, { Id: 2, Title: 'MCANA' }],
  M2N: [{ Id: 1, Title: 'SUIGESUR', ID_M1NId: 1 }, { Id: 2, Title: 'SUIGENOR', ID_M1NId: 1 }, { Id: 3, Title: 'SUIGECAN', ID_M1NId: 2 }, { Id: 4, Title: 'OFICINA X', ID_M1NId: 1 }],
  M3N: [{ Id: 1, Title: 'ACUARTELAMIENTO X', M1NId: 1, M2NId: 1 }, { Id: 2, Title: 'BASE NORTE', M1NId: 1, M2NId: 2 }, { Id: 3, Title: 'BASE CANARIAS', M1NId: 2, M2NId: 3 }, { Id: 4, Title: 'UNIDAD SIN SUIGE', M1NId: 1, M2NId: 4 }],
  PROVINCIAS: [{ Id: 1, Title: 'SEVILLA' }, { Id: 2, Title: 'LEÓN' }, { Id: 3, Title: 'BURGOS' }],
  empleos: [{ Id: 1, Title: 'CORONEL' }, { Id: 2, Title: 'COMANDANTE' }, { Id: 3, Title: 'SARGENTO' }]
};
let sinEmpleos = false, rechazaFrom = false, grupoUnico = false;
const sur = { MANDO2N: '1', MANDO3N: '1', OData__x004d_N2: 'SUIGESUR', OData__x004d_N3: 'ACUARTELAMIENTO X' };
const nor = { MANDO2N: '2', MANDO3N: '2', OData__x004d_N2: 'SUIGENOR', OData__x004d_N3: 'BASE NORTE' };
const nuevoStore = () => {
  items = [
    { Id: 1, ESTADO: 'REMITIDO A SUIGE', TipoDeIncidente: 'Intrusión no autorizada', ...sur, PROBABILIDADES: 'MUY ALTO', FechaNotificacion: d(-10), Created: d(-9), Author: P[61] },
    { Id: 2, ESTADO: 'REMITIDO A DIACU', TipoDeIncidente: 'Robo o sustracción', ...nor, ValoradoPorSUIGE: true, PROBABILIDADES: 'MEDIO', FechaNotificacion: d(-20), Created: d(-19), Author: P[62], Provincia: 'LEÓN', VALORACIONSUIGES: 'Valorado NOR' },
    { Id: 3, ESTADO: 'REMITIDO A M1', TipoDeIncidente: 'Incidentes con UAS', MANDO1N: '2', MANDO2N: '3', OData__x004d_N1: 'MCANA', OData__x004d_N2: 'SUIGECAN', SUIGES: 'SUIGECAN', ValoradoPorSUIGE: true, DIACU: 'ELEVADO POR DIACU', ValoradoPorDIACU: true, PROBABILIDADES: 'ALTO', FechaNotificacion: d(-40), Created: d(-39), Author: P[62], Provincia: 'LAS PALMAS' },
    // Parte antiguo: la cadena de mando está escrita en MANDOxN y no hay MNx
    { Id: 4, ESTADO: 'VALORADO INCIDENTE POR JIGE', TipoDeIncidente: 'Pintadas', MANDO1N: 'FUTER', MANDO2N: 'SUIGESUR', OData__x004d_N1: '', ValoradoPorSUIGE: true, ValoradoPorIGE: true, PROBABILIDADES: 'BAJO', FechaNotificacion: d(-60), Created: d(-59), Author: P[61] },
    { Id: 5, ESTADO: 'EXP CERRADO', TipoDeIncidente: 'Otro', ...sur, ValoradoPorSUIGE: true, PROBABILIDADES: 'MUY BAJO', FechaNotificacion: d(-90), Created: d(-89), Author: P[61], Denuncia: true, NDenuncia: '123/26' },
    { Id: 6, ESTADO: 'BORRADOR', TipoDeIncidente: 'Sabotaje', ...sur, PROBABILIDADES: 'MEDIO', FechaNotificacion: d(-1), Created: d(-1), Author: YO },
    { Id: 7, ESTADO: 'REMITIDO A SUIGE', TipoDeIncidente: 'Intrusión no autorizada', ...nor, grupo: [P[62]], PROBABILIDADES: 'ALTO', FechaNotificacion: d(-3), Created: d(-3), Author: P[62], Provincia: 'BURGOS' },
    { Id: 8, ESTADO: 'REMITIDO A SUIGE', TipoDeIncidente: 'Intrusión no autorizada', ...sur, Reiterada: 'SI', PROBABILIDADES: 'ALTO', FechaNotificacion: d(-2), Created: d(-2), Author: P[61] },
    // De otra SUIGE, pero el usuario figura entre el «personal que puede visualizar la información»
    { Id: 9, ESTADO: 'REMITIDO A SUIGE', TipoDeIncidente: 'Pintadas', ...nor, grupo: [P[62], YO], PROBABILIDADES: 'BAJO', FechaNotificacion: d(-4), Created: d(-4), Author: P[62] },
    // MADOC: el InfoPath lo envía a la SUIGESUR
    { Id: 10, ESTADO: 'REMITIDO A SUIGE', TipoDeIncidente: 'Otro', MANDO2N: '9', OData__x004d_N2: 'MADOC', OData__x004d_N3: 'ACADEMIA', PROBABILIDADES: 'MEDIO', FechaNotificacion: d(-5), Created: d(-5), Author: P[62] },
  ].map(x => ({ ...base, Title: '2026-01-01', Modified: d(-1), Editor: { Id: 61, Title: 'JEFE UNIDAD A' }, Attachments: x.Id === 1, ...x }));
};
// Evalúa el $filter de alcance (or de igualdades de persona, SUIGES y substringof)
// Al escribir, las personas llegan por su número (XId); se guardan como objetos para leerlas después
const quien = id => id === YO.Id ? YO : P[id] || { Id: id, Title: 'Usuario ' + id };
const personasDe = c => {
  if ('ResponsableDeLaInformacionId' in c) c.ResponsableDeLaInformacion = c.ResponsableDeLaInformacionId ? quien(c.ResponsableDeLaInformacionId) : null;
  if ('grupoId' in c) c.grupo = (c.grupoId && c.grupoId.results ? c.grupoId.results : c.grupoId ? [c.grupoId] : []).map(quien);
  return c;
};
const cumple = (it, filtro) => filtro.split(' or ').some(c => {
  let m;
  if ((m = c.match(/\(grupo\/Id eq (\d+)\)/))) return (it.grupo || []).some(g => g.Id === +m[1]);
  if ((m = c.match(/\((\w+)Id eq (\d+)\)/))) return it[m[1]] && it[m[1]].Id === +m[2];
  if ((m = c.match(/\(SUIGES eq '([^']+)'\)/))) return it.SUIGES === m[1];
  if ((m = c.match(/substringof\('([^']+)',(\w+)\)/))) return String(it[m[2]] || '').includes(m[1]);
  if ((m = c.match(/\(Id eq (\d+)\)/))) return it.Id === +m[1];
  return false;
});
async function prueba(verbose, escenario) {
  nuevoStore();
  if (escenario === 'plazo DIACU') {
    const h = n => { const x = new Date(); x.setDate(x.getDate() - n); x.setHours(10, 5, 0, 0); return x.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
    const plantilla = items.find(x => x.Id === 2);
    items.push({ ...plantilla, ...sur, Id: 11, Modified: d(-10), ObservacionesDelExpediente: h(12) + ' · JEFE · Alta\n' + h(10) + ' · SUR1 · Valoración SUIGESUR · INFORMADO A DIACU' });
    items.push({ ...plantilla, ...sur, Id: 12, Modified: d(-10), ObservacionesDelExpediente: h(0) + ' · SUR1 · Valoración SUIGESUR · INFORMADO A DIACU' });
  }
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true }); if (escenario !== 'Control total y solo SUIGESUR') await ctx.addInitScript(() => { try { localStorage.setItem('incidentes-seguridad-ige', JSON.stringify({ agrupar: '' })); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const posts = [], gets = [];
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) {
      if (/\.png$/.test(u)) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ body: html, contentType: 'text/html' });
    }
    if (verbose && req.method() === 'GET' && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = x => r.fulfill({ json: verbose ? { d: Array.isArray(x.value) ? { results: x.value, __next: x['odata.nextLink'] } : x } : x });
    const resto = u.split('/_api/')[1];
    if (req.method() === 'POST') {
      posts.push({ ruta: resto, cab: req.headers(), cuerpo: req.postData() });
      if (resto === 'contextinfo') return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'DG' } } } });
      if (resto.startsWith('SP.Utilities.Utility.SendEmail')) {
        const pr = JSON.parse(req.postData()).properties, dest = [].concat(pr.To.results, pr.CC.results, pr.BCC ? pr.BCC.results : []);
        if (dest.some(x => /malo@/.test(x))) return r.fulfill({ status: 500, json: { error: { message: { value: 'No se puede enviar el correo electrónico. Asegúrese de que tenga un destinatario válido.' } } } });
        return rechazaFrom && pr.From ? r.fulfill({ status: 400, json: { error: { message: { value: 'From no válido' } } } }) : r.fulfill({ json: { d: {} } });
      }
      const ad = resto.match(/items\((\d+)\)\/AttachmentFiles\/add\(FileName='([^']+)'\)/);
      if (ad) { items.find(x => x.Id === +ad[1]).Attachments = true; return r.fulfill({ json: { d: { FileName: ad[2] } } }); }
      const mi = resto.match(/items\((\d+)\)/);
      if (mi) {
        const it = items.find(x => x.Id === +mi[1]);
        if (req.headers()['if-match'] !== '"' + it.Modified + '"') return r.fulfill({ status: 412, json: { error: { message: { value: 'conflict' } } } });
        if (typeof JSON.parse(req.postData()).DIACU === 'string') return r.fulfill({ status: 400, json: { error: { message: { value: "Se encontró un nodo 'PrimitiveValue' inesperado. Se esperaba un nodo 'StartObject'." } } } });
        const c = personasDe(JSON.parse(req.postData())); delete c.__metadata; Object.assign(it, c, { Modified: new Date().toISOString(), Editor: { Id: YO.Id, Title: YO.Title } });
        return r.fulfill({ status: 204, body: '' });
      }
      // Lista con «grupo» de una sola persona: rechaza la forma {results: […]} como Colabora
      if (grupoUnico && /items/.test(resto) && (JSON.parse(req.postData() || '{}').grupoId || 0).results) return r.fulfill({ status: 400, json: { error: { message: { value: "Se encontró un nodo 'StartObject' inesperado al leer del lector JSON. Se esperaba un nodo 'PrimitiveValue'." } } } });
      if (resto.endsWith('/items')) {
        const c = personasDe(JSON.parse(req.postData())); delete c.__metadata;
        const it = { ...base, Id: Math.max(...items.map(x => x.Id)) + 1, Created: new Date().toISOString(), Modified: new Date().toISOString(), Author: { Id: YO.Id, Title: YO.Title, EMail: YO.EMail }, Editor: { Id: YO.Id, Title: YO.Title }, Attachments: false, ...c };
        items.push(it); return r.fulfill({ status: 201, json: { d: { Id: it.Id } } });
      }
      return r.fulfill({ status: 400, body: '' });
    }
    gets.push(resto);
    if (resto.startsWith('web/currentuser/groups')) return J({ value: misGrupos.map(n => ({ Id: GRUPOS[n], Title: n })) });
    if (resto.startsWith('web/currentuser')) return J({ Id: YO.Id, Title: YO.Title, Email: YO.EMail, LoginName: 'i:0#.w|et\\usuario' });
    const g = resto.match(/sitegroups\/getbyname\('([^']+)'\)\/users/);
    if (g) return MIEMBROS[g[1]] ? J({ value: MIEMBROS[g[1]].map(e => ({ Email: e })) }) : r.fulfill({ status: 404, body: '' });
    const mi = resto.match(/items\((\d+)\)/);
    if (mi) { const it = items.find(x => x.Id === +mi[1]); return r.fulfill({ json: { d: { __metadata: { etag: '"' + it.Modified + '"' }, ...it } } }); }
    const aux = resto.match(/getbytitle\('(PROVINCIAS|M1N|M2N|M3N|empleos)'\)\/items/);
    if (aux) {
      if (aux[1] === 'empleos' && (sinEmpleos || !u.includes('/et/SUIGESUR/colaborativo/CALIDAD-VIDA/_api/'))) return r.fulfill({ status: 404, body: '' });
      return J({ value: AUXL[aux[1]].slice().reverse() });
    }
    if (resto.startsWith('web/siteusers')) return J({ value: [YO, ...Object.values(P)].map(x => ({ Id: x.Id, Title: x.Title, Email: x.EMail })) });
    if (resto.includes("getbytitle('INCIDENTES DE SEGURIDAD')/fields")) { const ch = a => verbose ? { results: a } : a; return J({ value: [
      { InternalName: 'TipoDeIncidente', Choices: ch(['Intrusión no autorizada', 'Robo o sustracción', 'Pintadas', 'Otro']) }, { InternalName: 'Reiterada', Choices: ch(['SI', 'NO', 'ES LA PRIMERA VEZ']) },
      { InternalName: 'PROBABILIDADES', Choices: ch(['MUY BAJO', 'BAJO', 'MEDIO', 'ALTO', 'MUY ALTO']) }, { InternalName: 'SUIGES', Choices: ch(['JEFATURA DE IGE', 'SECOORCEN', 'SUIGESUR', 'SUIGEPIR', 'SUIGENOR', 'SUIGECAN', 'DIIN']) },
      { InternalName: 'A_x00f1_o', Choices: ch(['2025', '2026', '2027']) }].concat(grupoUnico ? [] : [{ InternalName: 'grupo', TypeAsString: 'UserMulti' }], [{ InternalName: 'DIACU', TypeAsString: 'MultiChoice' }]) }); }
    if (resto.includes('/items') && expandRoto && u.includes('$expand')) return r.fulfill({ status: 400, body: '' });
    if (resto.includes('/items')) {
      const selRaw = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',').filter(Boolean);
      const exp = ((u.match(/\$expand=([^&]*)/) || [])[1] || '').split(',');
      const malo = selRaw.find(f => { const [a, b] = f.split('/'); if (a === faltaCampo) return true; if (b) return !exp.includes(a); if (/Id$/.test(a) && (a.slice(0, -2) in base || ['Author', 'Editor'].includes(a.slice(0, -2)))) return false; return !(a in base) && !['Id', 'Created', 'Modified', 'Attachments', 'Author', 'Editor', 'ValoradoPorSUIGE', 'ValoradoPorDIACU', 'ValoradoPorIGE', 'FechaNotificacion', 'Reiterada', 'ZONASE_x00d1_ALIZADA', 'Denuncia', 'A_x00f1_o', 'Provincia', 'Empleo', 'correosPersonasInfo', 'ResponsableDeLaInformacion'].includes(a); });
      if (malo) return r.fulfill({ status: 400, json: { 'odata.error': { message: { value: "The field or property '" + malo.split('/')[0] + "' does not exist." } } } });
      const filtro = (u.match(/\$filter=([^&]*)/) || [])[1] || '';
      ultimoFiltro = filtro;
      if (filtro.includes('substringof') && sinSubstringof) return r.fulfill({ status: 400, body: '' });
      const lista = filtro ? items.filter(it => cumple(it, filtro)) : items;
      // Lectura mínima de la vía alternativa: solo las columnas pedidas en $select
      const campos = ((u.match(/\$select=([^&]*)/) || [])[1] || '').split(',');
      if (!campos.includes('Title')) {
        lecturaMinima = campos.join(',');
        return J({ value: lista.map(it => { const o = {}; campos.forEach(k => { if (k === 'grupo/Id') o.grupo = verbose ? { results: it.grupo.map(g => ({ Id: g.Id })) } : it.grupo.map(g => ({ Id: g.Id })); else if (/Id$/.test(k) && k !== 'Id') o[k] = it[k.slice(0, -2)] ? it[k.slice(0, -2)].Id : null; else o[k] = it[k]; }); return o; }) });
      }
      return J({ value: verbose ? lista.map(it => ({ ...it, grupo: { results: it.grupo } })) : lista });
    }
    if (resto.includes("getbytitle('INCIDENTES DE SEGURIDAD')")) return J({ Id: 'g', Title: 'INCIDENTES DE SEGURIDAD', ListItemEntityTypeFullName: 'SP.Data.INTRUSIONESListItem',
      EffectiveBasePermissions: { High: '0', Low: String(admin ? 0x2000BFF : 0x7) }, DefaultNewFormUrl: WEB + '/Lists/INTRUSIONES/NewForm.aspx', DefaultEditFormUrl: WEB + '/Lists/INTRUSIONES/EditForm.aspx', DefaultDisplayFormUrl: WEB + '/Lists/INTRUSIONES/DispForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = (verbose ? '[verbose] ' : '[ligero] ') + escenario;
  const correos = () => posts.filter(x => x.ruta.startsWith('SP.Utilities')).map(x => JSON.parse(x.cuerpo).properties);
  const merge = id => { const m = posts.filter(x => new RegExp('items\\(' + id + '\\)').test(x.ruta) && x.cab['x-http-method'] === 'MERGE').pop(); return m && JSON.parse(m.cuerpo); };
  await p.goto(O + '/et/SUIGESUR/JSUIGE/Documentos%20compartidos/incidentes.html' + (escenario === 'enlace' ? '?id=3' : '')); await p.waitForTimeout(900);
  const pestañas = await p.$$eval('#tabs a', a => a.map(x => x.textContent).join(' | '));
  if (escenario === 'informe') {
    await p.click('#tabs a[data-v=informe]'); await p.waitForTimeout(300);
    const t = async s => (await p.$$eval(s, n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim())));
    console.log(tag, '| apartados:', (await t('#vista .inf h3')).join(' | '));
    console.log(tag, '| resumen:', (await t('#vista .inf .kp div')).join(' · '));
    await p.selectOption('#iAgr', 'suige'); await p.waitForTimeout(200);
    console.log(tag, '| comparativa SUIGE:', (await t('#vista .inf h3 + table tr')).slice(0, 4).join(' / '));
    await p.check('[data-isec=detalle]'); await p.check('[data-isec=valoraciones]'); await p.waitForTimeout(200);
    const [pop] = await Promise.all([p.waitForEvent('popup'), p.click('[data-iimp]')]);
    await pop.waitForLoadState(); const imp = await pop.evaluate(() => document.body.innerText);
    console.log(tag, '| impreso:', (imp.match(/^\d+\. [A-ZÁÉÍÓÚ][^\n]*$/gm) || []).join(' | '), '| texto del parte leído:', /TEXTO RESERVADO DEL PARTE/.test(imp), '| valoración SUIGE:', /Valorado NOR/.test(imp));
    if (!verbose) await pop.screenshot({ path: new URL('informe.png', import.meta.url).pathname, fullPage: true });
    await pop.close();
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-icsv]')]);
    const csvT = fs.readFileSync(await dl.path(), 'utf8');
    console.log(tag, '| CSV:', dl.suggestedFilename(), csvT.split('\r\n').length, 'filas ·', csvT.split('\r\n')[3], '| errores:', errs);
    await b.close(); return;
  }
  if (escenario === 'plazo DIACU') {
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(300);
    console.log(tag, '| pendientes:', (await p.$$eval('#vista .sec', s => s.map(x => x.textContent.replace(/(\d+)$/, ' = $1')))).join(' · '));
    await p.click('#tabs a[data-v=consulta]'); await p.click('.inc[data-id="1"]'); await p.waitForTimeout(600);
    console.log(tag, '| SUIGE (parte 1, de la BAE):', await p.$$eval('#detAcc button[data-acc]', b => b.map(x => x.textContent).join(' | ')));
    await p.click('#dlg [data-cerrar]'); await p.click('.inc[data-id="12"]'); await p.waitForTimeout(800);
    console.log(tag, '| informado hoy:', (await p.textContent('#detAcc .panel')).replace(/\s+/g, ' ').slice(0, 170), '| botón IGE:', !!(await p.$('[data-acc=suigeIgeSD]')));
    await p.click('#dlg [data-cerrar]'); await p.click('.inc[data-id="11"]'); await p.waitForTimeout(800);
    console.log(tag, '| hace 10 días:', (await p.textContent('#detAcc .panel')).replace(/\s+/g, ' ').slice(0, 140));
    posts.length = 0; await p.click('[data-acc=suigeIgeSD]'); await p.waitForTimeout(1400);
    const c = merge(11), m = correos().pop();
    console.log(tag, '| eleva a IGE:', JSON.stringify({ ESTADO: c.ESTADO, Hist: (c.ObservacionesDelExpediente || '').split('\n').pop().replace(/^.*? · .*? · /, '') }), '| correo a:', m && m.To.results, 'cc:', m && m.CC.results, '|', m && m.Subject, '| errores:', errs);
    await b.close(); return;
  }
  if (escenario === 'columna inexistente') { console.log(tag, '| carga:', await p.textContent('#estadoCarga'), '| aviso:', await p.textContent('#vista .aviso').catch(() => 'ninguno'), '| errores:', errs); await b.close(); return; }
  if (escenario === 'enlace') { console.log(tag, '| ficha abierta:', await p.textContent('#dlg h2').catch(() => 'nada'), '| URL limpia:', p.url().endsWith('incidentes.html')); await b.close(); return; }
  console.log(tag, '| pestañas:', pestañas, '| filtro:', ultimoFiltro ? (ultimoFiltro.includes('substringof') ? 'con cadena de mando' : 'sin cadena de mando') : 'ninguno (ve todo)');
  console.log(tag, '| panel:', (await p.$$eval('.mini > div', k => k.map(x => x.textContent.replace(/^\D*?(\d+)/, '$1 ')))).join(' · '), '| circuito:', (await p.$$eval('.flujo .fp', k => k.map(x => x.textContent.replace(/^\S+/, '').replace(/(\d+)$/, ':$1')))).join(' › '));
  if (!verbose && escenario === 'control total') await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: true });
  if (escenario === 'solo SEGURIDAD_IGE') { await p.click('#tabs a[data-v=panel]'); await p.waitForTimeout(200); }
  await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200);
  console.log(tag, '| pendientes:', (await p.$$eval('#vista .sec', s => s.map(x => x.textContent.replace(/(\d+)$/, ' = $1')))).join(' · '), '| ids:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).join(',')));
  if (escenario === 'solo SEGURIDAD_IGE') { console.log(tag, '| papeles:', await p.$$eval('#vista .badge.rol', n => n.map(x => x.textContent).join(', ')).catch(() => ''), '| errores:', errs); await b.close(); return; }
  if (escenario === 'Control total y solo SUIGESUR') {
    await p.click('#tabs a[data-v=consulta]'); await p.waitForTimeout(200);
    await p.selectOption('#fAgrupar', 'suige'); await p.waitForTimeout(200);
    console.log(tag, '| grupos:', await p.$$eval('#vista details summary', n => n.map(x => x.textContent.replace(/\s+/g, ' ')).join(' / ')));
    console.log(tag, '| ve:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).sort().join(',')), '|', await p.textContent('#vista > p.muted.small:last-child'));
    await p.selectOption('#fAgrupar', 'prob'); await p.waitForTimeout(200);
    console.log(tag, '| por probabilidad:', await p.$$eval('#vista details summary b', n => n.map(x => x.textContent).join(' / ')), '| errores:', errs);
    if (!verbose) await p.screenshot({ path: new URL('consulta.png', import.meta.url).pathname, fullPage: true });
    await b.close(); return;
  }
  if (escenario === 'solo SUIGESUR' || escenario === 'SUIGESUR sin substringof') {
    await p.click('#tabs a[data-v=consulta]'); await p.waitForTimeout(200);
    console.log(tag, '| ve:', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).sort((a, b) => a - b).join(',')), lecturaMinima ? '| lectura mínima: ' + lecturaMinima : '');
    await p.click('.inc[data-id="9"]'); await p.waitForTimeout(500);
    console.log(tag, '| ficha 9 (figuro en «grupo», SUIGENOR): paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
    await p.click('#dlg [data-cerrar]');
    await p.click('.inc[data-id="10"]'); await p.waitForTimeout(500);
    console.log(tag, '| ficha 10 (MADOC): paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
    await p.click('#dlg [data-cerrar]');
    await p.click('#tabs a[data-v=pendientes]'); await p.waitForTimeout(200); await p.click('.inc[data-id="6"]'); await p.waitForTimeout(400);
    console.log(tag, '| borrador propio 6:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')), '| InfoPath:', !!(await p.$('#dlg a[href*="EditForm"]')), '| errores:', errs);
    await b.close(); return;
  }
  // 1) SUIGE valora el 1 (sin texto, error; con texto, informa a DIACU)
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(600);
  console.log(tag, '| pasos 1:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '), '| aviso reiterado:', (await p.textContent('#dlg .aviso').catch(() => '')).slice(0, 40));
  console.log(tag, '| textos leídos:', (await p.textContent('#detTextos')).includes('TEXTO RESERVADO DEL PARTE'), '| botones:', await p.$$eval('#detAcc [data-acc]', n => n.map(x => x.textContent).join(' | ')));
  await p.fill('#vSuige', ''); await p.click('[data-acc=suigeDiacu]'); await p.waitForTimeout(150);
  console.log(tag, '| informar sin valoración:', await p.textContent('#accMsg'));
  await p.fill('#vSuige', 'Riesgo alto: reforzar el vallado.\nRevisar cámaras.'); posts.length = 0;
  await p.click('[data-acc=suigeDiacu]'); await p.waitForTimeout(1400);
  let c = merge(1), m = correos().pop();
  console.log(tag, '| SUIGE › DIACU:', JSON.stringify({ ESTADO: c.ESTADO, ValoradoPorSUIGE: c.ValoradoPorSUIGE, VALORACIONSUIGES: c.VALORACIONSUIGES, Obs: (c.ObservacionesDelExpediente || '').slice(-50), Mod: c.ModificadoPorTEXTO }));
  console.log(tag, '| correo:', m.To.results, 'cc', m.CC.results, 'cco', (m.BCC ? m.BCC.results : []), '|', m.Subject, '| sin texto del parte:', !m.Body.includes('TEXTO RESERVADO'), '| enlace:', (m.Body.match(/href="([^"]+)"/) || [])[1]);
  if (!verbose) fs.writeFileSync(new URL('correo.html', import.meta.url), m.Body);
  console.log(tag, '| mensaje:', (await p.textContent('#dlg .okmsg, #dlg .aviso')).slice(0, 90), '| pasos:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '));
  await p.click('#dlg [data-cerrar]');
  // 2) DIACU informa a IGE el 2 (sin texto, error)
  await p.click('#tabs a[data-v=pendientes]'); await p.click('.inc[data-id="2"]'); await p.waitForTimeout(600);
  console.log(tag, '| ficha 2, paneles:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
  await p.click('[data-acc=diacuIge]'); await p.waitForTimeout(150);
  console.log(tag, '| informar a IGE sin texto:', await p.textContent('#accMsg'));
  await p.fill('#vDiacu', 'Se informa a IGE por reincidencia.'); posts.length = 0; await p.click('[data-acc=diacuIge]'); await p.waitForTimeout(1400);
  c = merge(2); m = correos().pop();
  console.log(tag, '| DIACU › IGE:', JSON.stringify({ ESTADO: c.ESTADO, DIACU: c.DIACU, ValoradoPorDIACU: c.ValoradoPorDIACU, VALORACIONDIACU: c.VALORACIONDIACU }), '| correo a:', m.To.results, 'cc:', m.CC.results, '|', m.Subject);
  await p.click('#dlg [data-cerrar]');
  // 3) IGE valora el 3
  await p.click('#tabs a[data-v=pendientes]'); await p.click('.inc[data-id="3"]'); await p.waitForTimeout(600);
  await p.fill('#vIge', 'Conforme con las medidas.'); posts.length = 0; await p.click('[data-acc=valIge]'); await p.waitForTimeout(1400);
  c = merge(3); m = correos().pop();
  console.log(tag, '| IGE:', JSON.stringify({ ESTADO: c.ESTADO, ValoradoPorIGE: c.ValoradoPorIGE, valoracionIGE: c.valoracionIGE }), '| correo a:', m.To.results, 'cc:', m.CC.results, '|', m.Subject, '| ahora:', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
  // 4) Cierre del 3
  await p.fill('#vCierre', 'Medidas implantadas.'); posts.length = 0; await p.click('[data-acc=cerrar]'); await p.waitForTimeout(1400);
  c = merge(3); m = correos().pop();
  console.log(tag, '| cerrar:', JSON.stringify({ ESTADO: c.ESTADO, Obs: (c.ObservacionesDelExpediente || '').split('\n').length + ' líneas' }), '| correo a:', m.To.results, 'cc:', m.CC.results);
  if (!verbose) await p.screenshot({ path: new URL('ficha.png', import.meta.url).pathname });
  // 5) Reabrir exige motivo; anotar; recordatorio
  await p.click('[data-acc=reabrir]'); await p.waitForTimeout(150);
  console.log(tag, '| reabrir sin motivo:', await p.textContent('#accMsg'));
  await p.fill('#vNota', 'Pendiente informe de la Guardia Civil.'); posts.length = 0; await p.click('[data-acc=anotar]'); await p.waitForTimeout(1200);
  c = merge(3);
  console.log(tag, '| anotar:', (c.ObservacionesDelExpediente || '').split('\n').pop().replace(/^.*? · /, '… · '), '| sin correo:', !correos().length);
  await p.click('#dlg [data-cerrar]');
  await p.click('#tabs a[data-v=consulta]'); await p.click('.inc[data-id="7"]'); await p.waitForTimeout(500);
  posts.length = 0; await p.click('[data-acc=recordar]'); await p.waitForTimeout(800);
  m = correos().pop(); console.log(tag, '| recordatorio:', m && m.To.results, m && m.Subject);
  // 6) Conflicto: otro cambia el 8 mientras está abierto
  await p.click('#dlg [data-cerrar]'); await p.click('.inc[data-id="8"]'); await p.waitForTimeout(500);
  items.find(x => x.Id === 8).Modified = new Date(Date.now() + 99999).toISOString();
  await p.fill('#vSuige', 'x'); await p.click('[data-acc=suigeDiacu]'); await p.waitForTimeout(800);
  console.log(tag, '| conflicto:', await p.textContent('#accMsg'));
  await p.click('#dlg [data-cerrar]');
  // 6b) Correo de prueba desde Ajustes
  await p.click('#tabs a[data-v=ajustes]'); await p.waitForTimeout(200);
  await p.fill('#aPruebaA', 'yo@et.mde.es; otro@et.mde.es'); posts.length = 0; await p.click('[data-correoprueba]'); await p.waitForTimeout(800);
  { const m = correos().pop(); console.log(tag, '| correo de prueba:', m && m.To.results.join(','), '|', m && m.Subject, '| formato nuevo:', !!(m && /USO OFICIAL/.test(m.Body) && /<table/.test(m.Body)), '|', (await p.textContent('#aPrueba')).slice(0, 70)); }
  await p.fill('#aPruebaA', 'yo@et.mde.es; malo@et.mde.es'); posts.length = 0; await p.click('[data-correoprueba]'); await p.waitForTimeout(1200);
  console.log(tag, '| prueba con una dirección mala:', correos().map(m => m.To.results.join(',')).join(' / '), '|', (await p.textContent('#aPrueba')).replace(/\s+/g, ' ').slice(0, 220));
  await p.fill('#aPruebaA', 'malo@et.mde.es'); await p.click('[data-correoprueba]'); await p.waitForTimeout(1000);
  console.log(tag, '| solo dirección mala:', (await p.textContent('#aPrueba')).replace(/\s+/g, ' ').slice(0, 200));
  // 7) Consulta, filtros, impresión, CSV y estadísticas
  await p.click('#tabs a[data-v=estadisticas]'); await p.waitForTimeout(200);
  console.log(tag, '| estadísticas:', (await p.$$eval('.mini > div', k => k.map(x => x.textContent.replace(/^\D*?(\d+)/, '$1 ')))).join(' · '));
  if (!verbose) await p.screenshot({ path: new URL('estadisticas.png', import.meta.url).pathname, fullPage: true });
  await p.click('.mini [data-ir="prob:alta"]'); await p.waitForTimeout(200);
  console.log(tag, '| prob. alta abiertos →', await p.$$eval('#vista .inc', n => n.map(x => x.dataset.id).join(',')));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-csv]')]);
  console.log(tag, '| CSV:', dl.suggestedFilename(), fs.readFileSync(await dl.path(), 'utf8').split('\r\n').length - 1, 'filas');
  const [rel] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-relimp]')]); await rel.waitForLoadState();
  console.log(tag, '| relación:', await rel.title(), (await rel.$$eval('table.r tr', r => r.length)) - 1, 'filas');
  if (!verbose) { await rel.setViewportSize({ width: 1123, height: 794 }); await rel.screenshot({ path: new URL('relacion.png', import.meta.url).pathname }); }
  await rel.close();
  await p.click('.inc[data-id="1"]'); await p.waitForTimeout(600);
  const [fic] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-fichaimp]')]); await fic.waitForLoadState();
  console.log(tag, '| ficha impresa:', await fic.$$eval('h3', h => h.map(x => x.textContent).join(' | ')), '| con descripción:', (await fic.content()).includes('TEXTO RESERVADO'));
  if (!verbose) { await fic.setViewportSize({ width: 794, height: 1123 }); await fic.screenshot({ path: new URL('ficha-impresa.png', import.meta.url).pathname, fullPage: true }); }
  await fic.close(); await p.click('#dlg [data-cerrar]');
  await p.click('[data-limpiar]'); await p.click('#tabs a[data-v=estadisticas]'); await p.waitForTimeout(300);
  console.log(tag, '| estadísticas:', await p.$$eval('.estadis h3', h => h.map(x => x.textContent).join(' | ')));
  console.log(tag, '| por fase:', await p.$$eval('.estadis .card:nth-child(5) .barras .n', n => n.map(x => x.textContent).join(' / ')));
  if (!verbose) await p.screenshot({ path: new URL('estadisticas.png', import.meta.url).pathname, fullPage: true });
  // 8) Nuevo parte con el formulario de la página (el del InfoPath)
  await p.click('#nuevo'); await p.waitForTimeout(900);
  console.log(tag, '| formulario:', await p.$$eval('#fParte .fsec', n => n.map(x => x.textContent).join(' | ')), '| empleos:', await p.$$eval('#fParte [name=empleo] option', o => o.length - 1));
  console.log(tag, '| gestor:', await p.textContent('#fGestor'), '| azul activo:', !(await p.$eval('#fRemitir', b => b.disabled)));
  await p.click('#fRemitir'); await p.waitForTimeout(100);
  console.log(tag, '| informar vacío:', (await p.textContent('#fError')).slice(0, 90));
  await p.fill('#fParte [name=fecha]', new Date(Date.now() - 864e5).toISOString().slice(0, 10)); await p.fill('#fParte [name=hora]', '10:30');
  await p.selectOption('#fParte [name=empleo]', 'SARGENTO');
  console.log(tag, '| m2 antes de m1:', await p.$eval('#fParte [name=m2]', s => s.disabled));
  console.log(tag, '| primer nivel:', await p.$eval('#fParte [name=m1]', s => s.options[s.selectedIndex].textContent + (s.disabled ? ' (bloqueado)' : ' (editable)')), '| sección:', await p.textContent('#fParte .fsec:nth-of-type(2)').catch(() => ''));
  console.log(tag, '| m2 de IGE:', await p.$$eval('#fParte [name=m2] option', o => o.slice(1).map(x => x.textContent).join(', ')), '| m3:', await p.$eval('#fParte [name=m3]', s => s.disabled ? 'vacío' : 'activo'));
  await p.selectOption('#fParte [name=m2]', '4'); await p.selectOption('#fParte [name=m3]', '4');
  console.log(tag, '| cadena sin SUIGE:', await p.textContent('#fCadena'));
  await p.selectOption('#fParte [name=m2]', '1');
  console.log(tag, '| m3 al cambiar m2:', await p.$eval('#fParte [name=m3]', s => s.value || 'vacío'), await p.$$eval('#fParte [name=m3] option', o => o.slice(1).map(x => x.textContent).join(', ')));
  await p.selectOption('#fParte [name=m3]', '1');
  console.log(tag, '| cadena:', await p.textContent('#fCadena'));
  await p.selectOption('#fParte [name=tipo]', 'Pintadas'); await p.selectOption('#fParte [name=provincia]', 'SEVILLA');
  await p.selectOption('#fParte [name=zona]', 'true'); await p.selectOption('#fParte [name=reiterada]', 'NO'); await p.selectOption('#fParte [name=prob]', 'MEDIO');
  await p.selectOption('#fParte [name=denuncia]', 'true'); await p.fill('#fParte [name=ndenuncia]', '45/26');
  await p.fill('#fGrupo input', 'JEFE UNIDAD A'); await p.waitForTimeout(600); await p.click('#fGrupo .sugs button'); await p.waitForTimeout(200);
  console.log(tag, '| personas que pueden verlo:', await p.textContent('#fGrupo .personas'));
  await p.setInputFiles('#fParte [name=adjuntos]', { name: 'foto vallado.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('JPEGFALSO') });
  if (!verbose) await p.screenshot({ path: new URL('nuevo-parte.png', import.meta.url).pathname, fullPage: true });
  posts.length = 0; await p.click('#fBorrador'); await p.waitForTimeout(1500);
  const altas = posts.filter(x => x.ruta.endsWith('/items')), alta = altas[altas.length - 1]; if (altas.length > 1) console.log(tag, '| alta repetida:', altas.length, 'intentos'); const ca = alta && JSON.parse(alta.cuerpo);
  console.log(tag, '| borrador:', ca && JSON.stringify({ ESTADO: ca.ESTADO, Title: ca.Title, Año: ca.A_x00f1_o, Empleo: ca.Empleo, M: [ca.MANDO1N, ca.MANDO2N, ca.MANDO3N], MN: [ca.OData__x004d_N1, ca.OData__x004d_N2, ca.OData__x004d_N3], grupo: ca.grupoId, correos: ca.correosPersonasInfo, Resp: ca.ResponsableDeLaInformacionId, RespParte: ca.ResponsableDelParte, Zona: ca.ZONASE_x00d1_ALIZADA, Den: [ca.Denuncia, ca.NDenuncia], hora: new Date(ca.FechaNotificacion).getHours() + ':' + new Date(ca.FechaNotificacion).getMinutes() }));
  console.log(tag, '| adjunto subido:', posts.filter(x => x.ruta.includes('AttachmentFiles/add')).map(x => x.ruta.replace(/.*FileName=/, '')).join(', '), '| sin correo:', !correos().length);
  console.log(tag, '| ficha del borrador:', await p.textContent('#dlg h2'), '|', await p.$$eval('#detAcc h3', h => h.map(x => x.textContent).join(' | ')));
  await p.click('[data-editar]'); await p.waitForTimeout(900);
  console.log(tag, '| formulario relleno:', await p.$eval('#fParte [name=m2]', i => i.value), await p.$eval('#fParte [name=m3]', i => i.value), await p.$eval('#fParte [name=ndenuncia]', i => i.value), await p.$eval('#fParte [name=hora]', i => i.value), '|', await p.textContent('#fGrupo .personas'));
  await p.click('#fRemitir'); await p.waitForTimeout(150);
  console.log(tag, '| informar sin descripción:', (await p.textContent('#fError')).slice(0, 140));
  for (const k of ['OBSERVACION', 'ANALISIS', 'MEDIDAS', 'CONTROLMEDIDASADOPTADAS', 'CONCLUSION']) await p.fill('#fParte [name=' + k + ']', 'Texto de ' + k + '\nsegunda línea');
  await p.check('#fParte [name=aceptacion]');
  posts.length = 0; await p.click('#fRemitir'); await p.waitForTimeout(1600);
  const nid = items[items.length - 1].Id; const cr = merge(nid); m = correos().pop();
  console.log(tag, '| remitente:', m && (m.From || '(el de Colabora)'), '| mensaje:', (await p.textContent('#dlg .okmsg, #dlg .aviso')).slice(0, 160));
  console.log(tag, '| informar a SUIGE:', JSON.stringify({ ESTADO: cr.ESTADO, SUIGES: cr.SUIGES, ACEPTACION: cr.ACEPTACION, OBS: cr.OBSERVACION, Hist: (cr.ObservacionesDelExpediente || '').split('\n').length + ' líneas' }), '| correo a:', m && m.To.results, 'cc:', m && m.CC.results, '|', m && m.Subject);
  console.log(tag, '| ahora:', (await p.textContent('#dlg .pasos')).replace(/\s+/g, ' '));
  await p.click('#dlg [data-cerrar]');
  // 9) Responsable distinto: el botón azul no se activa (solo puede enviarlo el responsable)
  await p.click('#nuevo'); await p.waitForTimeout(700);
  await p.click('#fResp [data-quitar]'); await p.fill('#fResp input', 'JEFE UNIDAD B'); await p.waitForTimeout(600); await p.click('#fResp .sugs button'); await p.waitForTimeout(200);
  console.log(tag, '| otro responsable: azul activo:', !(await p.$eval('#fRemitir', b => b.disabled)), '|', await p.textContent('#fSoloResp'));
  await p.click('#dlg [data-cerrar]');
  await p.click('#tabs a[data-v=panel]'); await p.waitForTimeout(200);
  if (!verbose) await p.screenshot({ path: new URL('panel.png', import.meta.url).pathname, fullPage: true });
  console.log(tag, '| errores:', errs);
  await b.close();
}
const TODOS = ['SEGURIDAD_SUIGESUR', 'SEGURIDAD_SUIGENOR', 'SEGURIDAD_SUIGECAN', 'SEGURIDAD_DIAPER', 'SEGURIDAD_IGE', 'Integrantes de la Colaborativo'];
misGrupos = TODOS; admin = true; await prueba(false, 'control total'); sinEmpleos = true; rechazaFrom = true; grupoUnico = true; await prueba(true, 'control total'); sinEmpleos = false; rechazaFrom = false; grupoUnico = false;
misGrupos = ['SEGURIDAD_SUIGESUR', 'Integrantes de la Colaborativo']; admin = false; await prueba(false, 'solo SUIGESUR'); await prueba(true, 'plazo DIACU');
sinSubstringof = true; await prueba(true, 'SUIGESUR sin substringof'); sinSubstringof = false;
misGrupos = ['SEGURIDAD_IGE']; admin = false; await prueba(false, 'solo SEGURIDAD_IGE'); await prueba(false, 'informe'); await prueba(true, 'informe');
misGrupos = ['SEGURIDAD_SUIGESUR']; admin = true; await prueba(false, 'Control total y solo SUIGESUR'); admin = false;
misGrupos = TODOS; admin = true; await prueba(false, 'enlace');
faltaCampo = 'ResponsableDelParte'; await prueba(true, 'columna inexistente'); faltaCampo = null;
expandRoto = true; await prueba(false, 'columna inexistente'); expandRoto = false;
