// Prueba de prueba-incidentes.html contra un sitio /et/jige/colaborativo simulado (datos inventados).
// Uso: node incidentes/pruebas/diagnostico.mjs   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../prueba-incidentes.html', import.meta.url), 'utf8');
const O = 'https://colabora.mdef.es', WEB = '/et/jige/colaborativo';
const GUID = '3f2a1b4c-1111-2222-3333-444455556666';
const GRAV = ['Leve', 'Grave', 'Muy grave'], EST = ['Abierto', 'En investigación', 'Cerrado'];
const items = Array.from({ length: 1310 }, (_, i) => ({
  Id: i + 1, Created: `202${4 + (i % 3)}-0${1 + (i % 9)}-05T08:00:00Z`, Modified: '2026-10-01T08:00:00Z', AuthorId: 10 + (i % 7), EditorId: 3, Attachments: i % 4 === 0,
  Gravedad: GRAV[i % 3], Estado: EST[i % 3], Categoria: i % 50 === 0 ? 'Caso único ' + i : ['Acceso', 'Información', 'Material'][i % 3],
  JefeInstructor: 'TCOL NOMBRE ' + (i % 4), FechaIncidente: `202${4 + (i % 3)}-03-0${1 + (i % 8)}T00:00:00Z`, FechaLimite: i % 2 ? '2027-01-01T00:00:00Z' : '2025-01-01T00:00:00Z',
  Clasificada: i % 5 === 0, ResponsableId: 20 + (i % 9), Unidad0Id: 1 + (i % 12),
  Title: 'TEXTO SECRETO ' + i, Descripcion: 'DESCRIPCION SECRETA ' + i,
}));
async function prueba(verbose) {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const metodos = new Set(); let selItems = '';
  await p.route(O + '/**', async r => {
    const req = r.request(), u = decodeURIComponent(req.url());
    if (!u.includes('/_api/')) {
      if (u.includes('SitePages/INCIDENTES')) return r.fulfill({ contentType: 'text/html', body: `<html><body><div>TEXTO DE LA PAGINA</div><script>var ctx={listName:"{${GUID.toUpperCase()}}",ListUrl:"\\u002fet\\u002fjige\\u002fcolaborativo\\u002fLists\\u002fIncidentes"}</script><a href="${WEB}/Lists/Unidades/AllItems.aspx">u</a></body></html>` });
      return r.fulfill({ body: html, contentType: 'text/html' });
    }
    metodos.add(req.method());
    if (verbose && (req.headers()['accept'] || '').includes('nometadata')) return r.fulfill({ status: 415, body: '' });
    const J = d => r.fulfill({ json: verbose ? { d: Array.isArray(d.value) ? { results: d.value, __next: d['odata.nextLink'] } : d } : d });
    if (u.endsWith('/_api/contextinfo')) return r.fulfill({ json: { d: { GetContextWebInformation: { FormDigestValue: 'X' } } } });
    if (u.includes('EnumerateSubscriptionsByList')) return r.fulfill({ json: { d: { results: [{ Name: 'Aviso al jefe', EventTypes: { results: ['ItemAdded'] } }] } } });
    if (u.includes('getlimitedwebpartmanager')) return J({ value: [{ WebPart: { Title: 'Incidentes' } }, { WebPart: { Title: 'Unidades' } }] });
    if (u.includes('currentuser/groups')) return J({ value: [{ Title: 'Seguridad JIGE' }] });
    if (u.includes('currentuser')) return J({ Id: 20, Title: 'USUARIO' });
    if (u.includes('sitegroups')) return J({ value: [{ Title: 'Seguridad JIGE' }, { Title: 'colaborativo Miembros' }] });
    if (/\/_api\/web\/lists\?/.test(u)) return J({ value: [
      { Id: GUID, Title: 'Incidentes', ItemCount: items.length, BaseTemplate: 100, Hidden: false, LastItemModifiedDate: '2026-10-01T00:00:00Z', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Incidentes' } },
      { Id: 'aaaa1111-0000-0000-0000-000000000000', Title: 'Unidades', ItemCount: 12, BaseTemplate: 100, Hidden: false, LastItemModifiedDate: '2025-02-01T00:00:00Z', RootFolder: { ServerRelativeUrl: WEB + '/Lists/Unidades' } },
      { Id: 'bbbb2222-0000-0000-0000-000000000000', Title: 'Documentos compartidos', ItemCount: 40, BaseTemplate: 101, Hidden: false, LastItemModifiedDate: '2026-01-01T00:00:00Z', RootFolder: { ServerRelativeUrl: WEB + '/Shared Documents' } }] });
    if (u.includes('/WorkflowAssociations')) return J({ value: [{ Name: 'Aprobación', Enabled: true, AutoStartCreate: true, AutoStartChange: false, AllowManual: true }] });
    if (u.includes('/contenttypes')) return J({ value: [{ Name: 'Elemento' }, { Name: 'Carpeta' }] });
    if (u.includes('/views')) return J({ value: [{ Title: 'Todos los elementos', DefaultView: true }, { Title: 'Abiertos' }] });
    if (u.includes('/fields')) {
      const ch = a => verbose ? { results: a } : a;
      return J({ value: [
        { Title: 'Asunto', InternalName: 'Title', TypeAsString: 'Text', Required: true },
        { Title: 'Descripción', InternalName: 'Descripcion', TypeAsString: 'Note', RichText: true },
        { Title: 'Gravedad', InternalName: 'Gravedad', TypeAsString: 'Choice', Choices: ch(GRAV), Required: true, DefaultValue: 'Leve' },
        { Title: 'Estado', InternalName: 'Estado', TypeAsString: 'Choice', Choices: ch(EST) },
        { Title: 'Categoría', InternalName: 'Categoria', TypeAsString: 'Choice', Choices: ch(['Acceso', 'Información', 'Material']), FillInChoice: true },
        { Title: 'Jefe instructor', InternalName: 'JefeInstructor', TypeAsString: 'Choice', Choices: ch(['TCOL NOMBRE 0', 'TCOL NOMBRE 1']) },
        { Title: 'Fecha del incidente', InternalName: 'FechaIncidente', TypeAsString: 'DateTime' },
        { Title: 'Fecha límite', InternalName: 'FechaLimite', TypeAsString: 'DateTime' },
        { Title: 'Clasificada', InternalName: 'Clasificada', TypeAsString: 'Boolean' },
        { Title: 'Responsable', InternalName: 'Responsable', TypeAsString: 'User' },
        { Title: 'Unidad', InternalName: 'Unidad0', TypeAsString: 'Lookup', LookupList: '{AAAA1111-0000-0000-0000-000000000000}' },
        { Title: 'Creado', InternalName: 'Created', TypeAsString: 'DateTime', ReadOnlyField: true }] });
    }
    if (u.includes('/items')) {
      selItems = (u.match(/\$select=([^&]*)/) || [])[1] || selItems;
      const skip = Number((u.match(/skip=(\d+)/) || [0, 0])[1]);
      const next = skip + 1000 < items.length ? `${O}${WEB}/_api/web/lists/getbytitle('Incidentes')/items?skip=${skip + 1000}` : undefined;
      // Devuelve solo lo pedido en $select (como SharePoint)
      const campos = selItems.split(',');
      return J({ value: items.slice(skip, skip + 1000).map(it => Object.fromEntries(campos.filter(c => c in it).map(c => [c, it[c]]))), 'odata.nextLink': next });
    }
    if (u.includes("getbytitle('Incidentes')")) return J({ Id: GUID, ItemCount: items.length, EnableVersioning: true, EnableModeration: false, EnableAttachments: true, ContentTypesEnabled: false,
      HasUniqueRoleAssignments: true, EffectiveBasePermissions: { High: '0', Low: '7' }, DefaultNewFormUrl: WEB + '/Lists/Incidentes/NewForm.aspx' });
    return r.fulfill({ status: 404, body: '' });
  });
  const tag = verbose ? '[verbose]' : '[ligero]';
  await p.goto(O + '/et/SUIGESUR/JSUIGE/Documentos%20compartidos/prueba-incidentes.html');
  await p.click('#buscar'); await p.waitForTimeout(800);
  console.log(tag, 'estado:', await p.textContent('#estado'));
  console.log(tag, 'listas:', await p.$$eval('#listas tr', r => r.slice(1).map(x => x.cells[0].textContent + (x.className ? ' [pág]' : ''))));
  await p.click('#listas button[data-i="0"]'); await p.waitForTimeout(1500);
  const res = await p.textContent('#resumen'), R = JSON.parse(res), A = R.analisis.Incidentes;
  console.log(tag, 'listas en la página:', R.listas_en_la_pagina, '| elementos web:', R.elementos_web_de_la_pagina);
  console.log(tag, 'columnas:', A.columnas.map(c => c.interno + ':' + c.tipo).join(', '));
  console.log(tag, 'opciones JefeInstructor:', A.columnas.find(c => c.interno === 'JefeInstructor').opciones, '| Unidad busca en:', A.columnas.find(c => c.interno === 'Unidad0').busca_en_lista);
  console.log(tag, 'total:', A.elementos.total, '| por año:', JSON.stringify(A.elementos.creados_por_año), '| Gravedad:', JSON.stringify(A.elementos.columnas.Gravedad), '| Categoria:', JSON.stringify(A.elementos.columnas.Categoria));
  console.log(tag, 'Jefe:', JSON.stringify(A.elementos.columnas.JefeInstructor), '| FechaLimite:', JSON.stringify(A.elementos.columnas.FechaLimite), '| Responsable:', JSON.stringify(A.elementos.columnas.Responsable), '| Unidad:', JSON.stringify(A.elementos.columnas.Unidad0));
  console.log(tag, 'flujos:', JSON.stringify(A.flujos_2010), JSON.stringify(A.flujos_2013), '| vistas:', A.vistas, '| permisos propios:', A.lista_info.permisos_propios_no_heredados);
  console.log(tag, 'privacidad: textos', !/SECRET|TEXTO DE LA PAGINA|NOMBRE \d|Caso único/.test(res) ? 'no aparecen ✓' : 'APARECEN ✗', '| Title/Descripcion pedidos:', /Title|Descripcion/.test(selItems) ? 'sí ✗' : 'no ✓', '| métodos:', [...metodos].join(','), '| errores:', R.errores, errs);
  if (!verbose) await p.screenshot({ path: new URL('diagnostico.png', import.meta.url).pathname, fullPage: true });
  await b.close();
}
await prueba(false); await prueba(true);
