// Prueba de la página de control de acceso de SENDERO en Colabora (acceso/SENDERO-acceso.html), con Colabora simulado.
// VERBOSE=1: SharePoint 2013 (odata=verbose). PROTEGIDA=1: la copia que se sube (acceso/subir/SENDERO-acceso.html).
import { createRequire } from 'module';
import { simularColabora, nuevoEstado, URL_PAGINA } from './colabora-simulada.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const archivo = new URL(process.env.PROTEGIDA ? '../acceso/subir/SENDERO-acceso.html' : '../acceso/SENDERO-acceso.html', import.meta.url).pathname;
const est = nuevoEstado({ verbose: !!process.env.VERBOSE });
// Correo: el responsable figura con una cuenta antigua sin buzón; tiene otra cuenta buena con su mismo nombre
est.buzonMal = ['gestor@pruebas.invalid', 'i:0#.w|et\\gestor-antiguo'];
est.siteusers = [{ Id: 70, Title: 'GESTOR PRUEBAS', Email: 'gestor@pruebas.invalid', LoginName: 'i:0#.w|et\\gestor-antiguo', PrincipalType: 1 },
  { Id: 71, Title: 'Pruebas Gestor', Email: 'gestor.nuevo@pruebas.invalid', LoginName: 'i:0#.w|et\\gestor.nuevo', PrincipalType: 1 }];
const b = await chromium.launch(), ctx = await b.newContext(), errs = [];
await simularColabora(ctx, est, archivo);
// SENDERO simulado en MENSADEF: pregunta a la página de Colabora en un marco y anota la respuesta
await ctx.route('https://mensadef.mdef.es/**', r => r.fulfill({ contentType: 'text/html', body: '<html><body>SENDERO simulado</body></html>' }));
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Sin destino en la unidad' : undefined));
const error = t => console.log('Error: ' + t);
const abrir = async (hash = '') => { await p.goto('about:blank'); await p.goto(URL_PAGINA + hash); await p.waitForFunction(() => !/Cargando/.test(document.getElementById('app').textContent) && !/Cargando/.test((document.getElementById('cont') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => 0); };
const pulsar = async sel => { await p.click(sel); await p.waitForTimeout(500); await p.waitForFunction(() => !/Cargando/.test((document.getElementById('cont') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => 0); };
const como = (email, nombre, admin = false) => { est.usuario = { Id: email.length * 7, Title: nombre, Email: email }; est.admin = admin; };
async function preguntar(ambito) {
  const mp = await ctx.newPage(); mp.on('pageerror', e => errs.push('SENDERO: ' + e.message));
  await mp.goto('https://mensadef.mdef.es/ambito/X/SitePages/ambito.aspx');
  const r = await mp.evaluate(([u, a]) => new Promise(res => {
    const n = 'n' + Math.random(); window.addEventListener('message', e => { if (e.origin === 'https://colabora.mdef.es' && e.data && e.data.n === n) res(e.data); });
    const f = document.createElement('iframe'); f.src = u + '#comprobar=' + encodeURIComponent(JSON.stringify({ n, a, v: '2026-11-15 · 1' })); document.body.appendChild(f);
    setTimeout(() => res(null), 12000);
  }), [URL_PAGINA, ambito]);
  await mp.close(); return r;
}

// 1. Antes de preparar: SENDERO recibe «falta preparar»
{ const r = await preguntar('2SUIGE'); console.log('sin listas → SENDERO:', r && (r.ok ? 'ok' : r.error)); if (!r || r.ok || !/preparar/.test(r.error || '')) error('sin listas'); }

// 2. Preparación (Control total)
await abrir();
console.log('admin sin listas: pestaña', await p.$eval('.pestanas .on', e => e.textContent), '| ✕:', await p.$$eval('#cont .mal', l => l.length));
for (const paso of ['crearA', 'crearS', 'grupo']) await pulsar(`[data-p="${paso}"]`);
{ const t = await p.$eval('[data-p="protA"]', b => b.parentNode.textContent.replace(/\s+/g, ' '));
  console.log('antes de ajustar:', t.slice(0, 300)); if (!/Falta: todavía hereda.*Miembros colaborativo.*Permisos ahora: .*Colaborar/.test(t)) console.log('Error: explicación de lo que falta'); }
for (const paso of ['protA', 'abrirS']) await pulsar(`[data-p="${paso}"]`);
const foto = async n => { if (process.env.CAPTURAS) { await p.setViewportSize({ width: 1150, height: 560 }); await p.screenshot({ path: process.env.CAPTURAS + '/acceso-' + n + '.png' }); } };
await foto('preparacion');
{ const oks = await p.$$eval('#cont .fila-prep .bien', l => l.length), mal = await p.$$eval('#cont .fila-prep .mal', l => l.length);
  const A = est.listas['SENDERO Autorizados'], S = est.listas['SENDERO Solicitudes'];
  const rolesA = Object.fromEntries(A.asig.map(a => [a.Member.Title, a.RoleDefinitionBindings.map(x => x.RoleTypeKind).join('+')]));
  const rolesS = Object.fromEntries(S.asig.map(a => [a.Member.Title, a.RoleDefinitionBindings.map(x => x.RoleTypeKind).join('+')]));
  console.log('preparación: ✔', oks, '✕', mal, '| columnas', A.campos.join(','), '/', S.campos.join(','));
  console.log('permisos Autorizados:', JSON.stringify(rolesA), '| Solicitudes:', JSON.stringify(rolesS), 'leer/editar solo suyos', S.RS, S.WS);
  if (mal || oks < 5 || rolesA['Usuarios del dominio'] !== '2' || rolesA['Miembros colaborativo'] !== '2' || rolesA['Propietarios colaborativo'] !== '5' || rolesA['SENDERO Administradores'] !== '3' ||
    !/3/.test(rolesS['Usuarios del dominio']) || rolesS['SENDERO Administradores'] !== '4' || S.RS !== 2 || S.WS !== 2) error('preparación'); }

// 3. Reglas: ámbito 2SUIGE (responsable gestor), 3SUIGE desactivado (responsable gestor) y versión vigente
await pulsar('[data-pest="reglas"]');
const anadir = async (tipo, valor, resp = '', meta = '', psit = '') => { await p.selectOption('#rTipo', tipo); await p.fill('#rValor', valor); if (resp) await p.fill('#rResp', resp); if (meta) await p.fill('#rMeta', meta); if (psit) await p.fill('#rPsit', psit); await pulsar('#rAnadir'); };
await anadir('Ámbito', '2suige', 'gestor@pruebas.invalid', 'https://colabora.mdef.es/et/ORG/META.html', 'https://colabora.mdef.es/et/ORG/puntos-situacion.html'); await anadir('Ámbito', '3SUIGE', 'gestor@pruebas.invalid');
await p.click('#rCuerpo tr:has-text("3SUIGE") [data-act]'); await p.waitForTimeout(600);
console.log('reglas:', est.listas['SENDERO Autorizados'].items.map(x => x.Tipo + ' ' + x.Title + (x.Activo ? '' : ' (inactiva)') + (x.Responsables ? ' resp ' + x.Responsables : '')).join(' | '));
await pulsar('[data-pest="version"]'); await p.fill('#vVer', '2026-12-01 · 1'); await pulsar('#vGuardar');
console.log('versión vigente:', await p.textContent('#cont p'));
{ const antes = await p.inputValue('#vCad'); await p.selectOption('#vCad', '60'); await pulsar('#vCadGuardar');
  const r = await preguntar('2SUIGE'); await p.selectOption('#vCad', '0'); await pulsar('#vCadGuardar'); const r2 = await preguntar('2SUIGE');
  console.log('caducidad: por defecto', antes, '→ 60 → SENDERO recibe', r.caducidad, '| indefinida → recibe', r2.caducidad, '| elementos «Caducidad»:', est.listas['SENDERO Autorizados'].items.filter(x => x.Title === 'Caducidad').length);
  if (antes !== '30' || r.caducidad !== 60 || r2.caducidad !== 0 || est.listas['SENDERO Autorizados'].items.filter(x => x.Title === 'Caducidad').length !== 1) console.log('Error: caducidad'); }

// 4. Respuesta a SENDERO: 2SUIGE autorizado; 3SUIGE no
{ const r = await preguntar('2SUIGE'); console.log('SENDERO 2SUIGE →', JSON.stringify({ ok: r.ok, regla: r.regla, vigente: r.vigente && r.vigente.version, email: r.email }));
  if (!r.ok || r.regla !== 'ámbito 2SUIGE' || r.vigente.version !== '2026-12-01 · 1') error('autorizado por ámbito');
  console.log('SENDERO recibe las direcciones de su organización:', JSON.stringify(r.gestores).replace(/https:\/\/[^/]+/g, ''));
  if (!r.gestores || !/META\.html$/.test(r.gestores.meta || '') || !/puntos-situacion\.html$/.test(r.gestores.psit || '')) error('direcciones de la organización'); }
{ const r = await preguntar('3SUIGE'); console.log('ámbito sin direcciones →', JSON.stringify(r.gestores)); if (r.gestores.meta || r.gestores.psit) error('ámbito sin direcciones'); }
{ await pulsar('[data-pest="reglas"]'); const t = await p.textContent('#rCuerpo'); console.log('reglas: META y PSIT en la tabla:', /META · PSIT/.test(t), '| «sin dar de alta»:', /sin dar de alta/.test(t)); if (!/META · PSIT/.test(t) || !/sin dar de alta/.test(t)) error('tabla de direcciones'); }

// 5. Otra persona del ámbito 3SUIGE: no autorizada → solicita
como('otra@pruebas.invalid', 'OTRA PERSONA');
{ const r = await preguntar('3SUIGE'); console.log('SENDERO 3SUIGE →', r.ok, r.motivo); if (r.ok || r.motivo !== 'sin_regla') error('no autorizado'); }
await abrir('#solicitar=' + encodeURIComponent(JSON.stringify({ a: '3SUIGE', v: '2026-11-15 · 1' })));
await p.fill('#solMotivo', 'Gestión de mensajes de la sección'); await p.click('#solEnviar'); await p.waitForTimeout(600);
console.log('solicitud:', (await p.textContent('#app h2')).trim(), '|', JSON.stringify(est.listas['SENDERO Solicitudes'].items.map(x => [x.Title, x.Correo, x.Ambito, x.Estado, x.VersionSendero])));
{ const av = await p.textContent('#solAviso'), avisos = (est.listas['SENDERO Solicitudes'].items[0] || {}).Avisos || '';
  console.log('aviso de solicitud:', av.trim().slice(0, 140), '| correos:', est.correos.map(c => c.to.join('+')).join(' / '));
  console.log('anotado en la solicitud:', avisos.replace(/^[^·]*· /, ''));
  if (!est.correos.some(x => x.to.includes('asansen@et.mde.es')) || !est.correos.some(x => x.to.includes('gestor.nuevo@pruebas.invalid')) || !/gestor@pruebas\.invalid → gestor\.nuevo@pruebas\.invalid/.test(avisos)) console.log('Error: aviso de solicitud'); }
await abrir('#solicitar=' + encodeURIComponent(JSON.stringify({ a: '3SUIGE' })));
console.log('segunda vez:', (await p.textContent('#app')).replace(/\s+/g, ' ').match(/Ya tienes una solicitud[^.]*/)?.[0]);
{ const r = await preguntar('3SUIGE'); console.log('SENDERO ve su solicitud:', r.solicitud && r.solicitud.estado); if (!r.solicitud || r.solicitud.estado !== 'Pendiente') error('solicitud pendiente'); }
// Página sin permisos: solo su estado y el formulario (no las pestañas)
await abrir(); console.log('usuario normal: pestañas', !!(await p.$('.pestanas')));

// 6. El responsable del ámbito la aprueba
est.gestores = ['gestor@pruebas.invalid']; como('gestor@pruebas.invalid', 'GESTOR PRUEBAS');
await abrir();
console.log('gestor:', (await p.textContent('#app .muted')).trim().slice(0, 80), '| filas:', await p.$$eval('#cont tbody tr', l => l.length), '| «todo su ámbito»:', !!(await p.$('[data-apramb]')));
await foto('solicitudes');
await pulsar('[data-apr]');
console.log('aprobada:', JSON.stringify(est.listas['SENDERO Solicitudes'].items.map(x => [x.Estado, x.RespondidoPor])), '| regla:', est.listas['SENDERO Autorizados'].items.filter(x => x.Tipo === 'Persona').map(x => x.Title + ' · ' + x.Nota.replace(/\d+\/\d+\/\d+/, 'FECHA')).join());
{ const c = est.correos[est.correos.length - 1] || {}, msg = await p.textContent('#app p.card').catch(() => '');
  console.log('aviso de aprobación:', (c.to || []).join(','), '|', c.asunto, '|', /APROBADA/.test(c.cuerpo || ''), '| en pantalla:', msg.trim().slice(0, 80));
  if (!(c.to || []).includes('otra@pruebas.invalid') || !/aprobada/.test(c.asunto || '') || !/Aviso enviado/.test(msg)) console.log('Error: aviso de aprobación'); }
como('otra@pruebas.invalid', 'OTRA PERSONA');
{ const r = await preguntar('3SUIGE'); console.log('SENDERO tras aprobar →', r.ok, r.regla); if (!r.ok || r.regla !== 'persona') error('aprobación'); }

// 7. Bloqueo (lo pone el administrador): aunque su ámbito esté autorizado
como('admin@pruebas.invalid', 'ADMIN PRUEBAS', true); await abrir(); await pulsar('[data-pest="reglas"]');
await anadir('Bloqueo', 'OTRA@pruebas.invalid');
como('otra@pruebas.invalid', 'OTRA PERSONA');
{ const r = await preguntar('2SUIGE'); console.log('SENDERO con bloqueo →', r.ok, r.motivo); if (r.ok || r.motivo !== 'bloqueado') error('bloqueo'); }

// 8. No contesta a otras webs
{ const mp = await ctx.newPage(); await ctx.route('https://otra.web.invalid/**', r => r.fulfill({ contentType: 'text/html', body: '<html><body>x</body></html>' }));
  await mp.goto('https://otra.web.invalid/');
  const r = await mp.evaluate(u => new Promise(res => { window.addEventListener('message', e => res(e.data)); const f = document.createElement('iframe'); f.src = u + '#comprobar=' + encodeURIComponent('{"n":"x","a":"2SUIGE"}'); document.body.appendChild(f); setTimeout(() => res(null), 6000); }), URL_PAGINA);
  console.log('otra web recibe respuesta:', !!r); if (r) error('contesta a otra web'); await mp.close(); }

console.log('errores:', JSON.stringify(errs));
await b.close();
