// Prueba del paso 2 de prueba-incidentes.html («Analizar el formulario») con un sitio simulado (datos inventados).
// Uso: node incidentes/pruebas/diagnostico-formulario.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../prueba-incidentes.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const M1 = ['FUTER', 'MCANA', 'FUTER BALEARES'], M2 = ['SUIGESUR', 'SUIGENOR', 'SUIGECAN'], M3 = Array.from({ length: 30 }, (_, i) => 'ACUARTELAMIENTO ' + i), PROV = ['SEVILLA', 'LEÓN', 'BURGOS'];
const AUXI = { M1N: M1.map((t, i) => ({ Id: i + 1, Title: t })), M2N: M2.map((t, i) => ({ Id: i + 1, Title: t, CORREO: 'seg' + i + '@et.mde.es' })), M3N: M3.map((t, i) => ({ Id: i + 1, Title: t, M2: M2[i % 3] })),
  M4N: [{ Id: 1, Title: 'UCO' }], 'UNIDADES IGE': M3.map((t, i) => ({ Id: i + 1, Title: 'UNIDAD ' + i })), PROVINCIAS: PROV.map((t, i) => ({ Id: i + 1, Title: t })), UGE: [{ Id: 1, Title: 'UGE 1' }] };
const items = Array.from({ length: 40 }, (_, i) => ({ Id: i + 1, AuthorId: 10 + (i % 5), ResponsableDeLaInformacionId: i % 2 ? 10 + (i % 5) : 99, grupoId: i % 4 ? 501 + (i % 3) : 77, SUIGES: null,
  MANDO1N: M1[i % 3], MANDO2N: M2[i % 3], MANDO3N: M3[i % 30], OData__x004d_N1: 'jefe' + i + '@et.mde.es', OData__x004d_N2: 'a@et.mde.es;b@et.mde.es', OData__x004d_N3: '', OData__x004d_N4: '',
  Provincia: PROV[i % 3], Empleo: 'Sargento', OTRO: '', ResponsableDelParte: 'NOMBRE APELLIDO ' + i, correosPersonasInfo: 'x' + i + '@et.mde.es', Title: '0' + (i % 9 + 1) + '/10/2026' }));
async function prueba(verbose) {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const metodos = new Set();
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) {
      if (u.includes('NewForm.aspx')) return r.fulfill({ contentType: 'text/html', body: `<html><body>FORMULARIO<script src="${WEB}/SiteAssets/parte.js"></script><script>var x = "MANDO1N";</script></body></html>` });
      if (u.includes('EditForm.aspx')) return r.fulfill({ contentType: 'text/html', body: '<html><body>EDITAR</body></html>' });
      if (u.includes('parte.js')) return r.fulfill({ contentType: 'text/javascript', body: `ctx.get_web().get_lists().getByTitle('M2N'); fetch("/_api/web/lists/getbytitle('M3N')/items"); item.set_item('_x004d_N1', jefe); item.set_item("grupo", g); item.set_item('correosPersonasInfo', c); SP.ClientContext; clientPeoplePicker; var secreto = 'jefe0@et.mde.es';` });
      if (u.includes('SitePages/INCIDENTES')) return r.fulfill({ contentType: 'text/html', body: '<html><body>PORTADA</body></html>' });
      return r.fulfill({ body: html, contentType: 'text/html' });
    }
    metodos.add(req.method());
    if (verbose && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = d => r.fulfill({ json: verbose ? { d: Array.isArray(d.value) ? { results: d.value } : d } : d });
    if (u.includes('/sitegroups')) return J({ value: [{ Id: 501, Title: 'SEGURIDAD_SUIGESUR' }, { Id: 502, Title: 'SEGURIDAD_SUIGENOR' }, { Id: 503, Title: 'SEGURIDAD_SUIGECAN' }] });
    const m = u.match(/getbytitle\('([^']+)'\)/); const t = m && m[1];
    if (u.includes('/fields')) return J({ value: t === 'M3N' ? [{ InternalName: 'Title', TypeAsString: 'Text' }, { InternalName: 'M2', TypeAsString: 'Text' }] : t === 'M2N' ? [{ InternalName: 'Title', TypeAsString: 'Text' }, { InternalName: 'CORREO', TypeAsString: 'Text' }] : [{ InternalName: 'Title', TypeAsString: 'Text' }] });
    if (u.includes('/items') && t === 'INCIDENTES DE SEGURIDAD') return J({ value: items });
    if (u.includes('/items') && AUXI[t]) return J({ value: AUXI[t] });
    if (t === 'INCIDENTES DE SEGURIDAD') return J({ DefaultNewFormUrl: WEB + '/Lists/INTRUSIONES/NewForm.aspx', DefaultEditFormUrl: WEB + '/Lists/INTRUSIONES/EditForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = verbose ? '[verbose]' : '[ligero]';
  await p.goto(O + '/et/SUIGESUR/JSUIGE/Documentos%20compartidos/prueba-incidentes.html');
  await p.click('#relaciones'); await p.waitForTimeout(1500);
  const res = await p.textContent('#resumen'), R = JSON.parse(res);
  console.log(tag, 'estado:', await p.textContent('#estado3'), '| auxiliares:', Object.entries(R.listas_auxiliares).map(([k, v]) => k + ':' + v.elementos).join(' '));
  for (const k of ['MANDO1N', 'MANDO2N', 'MANDO3N', 'MN1', 'MN2', 'Provincia', 'ResponsableDelParte']) console.log(tag, k, JSON.stringify(R.columnas_del_parte[k]));
  console.log(tag, 'grupo:', JSON.stringify(R.grupo), '| responsable = quien crea:', R.responsable_es_quien_crea);
  console.log(tag, 'formulario nuevo:', JSON.stringify(R.formularios.nuevo));
  console.log(tag, 'privacidad:', /FUTER|SUIGESUR"|ACUARTELAMIENTO|@et\.mde|NOMBRE APELLIDO|SEVILLA|FORMULARIO|secreto/.test(res.replace(/"SEGURIDAD_SUIGE\w+"/g, '')) ? 'APARECEN VALORES ✗' : 'sin valores ✓', '| métodos:', [...metodos].join(','), '| errores:', R.errores, errs);
  await b.close();
}
await prueba(false); await prueba(true);
