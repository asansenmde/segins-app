<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prueba MENSADEF</title>
<style>
  :root { --bg: #f4f5f0; --card: #fff; --text: #1f261f; --muted: #5f685f; --line: #d9ddd3; --brand: #3b4a2f; --ok: #2e7d32; --okbg: #dcefdc; --bad: #b71c1c; --badbg: #fbdada; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 20px 16px 40px; }
  h1 { font-size: 1.3rem; margin: 0 0 4px; color: var(--brand); }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; margin: 12px 0; }
  .ok { background: var(--okbg); color: var(--ok); font-weight: 700; }
  .bad { background: var(--badbg); color: var(--bad); font-weight: 700; }
  .muted { color: var(--muted); font-size: .9rem; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  th, td { text-align: left; padding: 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { background: var(--brand); color: #fff; }
  button { font: inherit; font-weight: 600; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
  button.prim { background: var(--brand); color: #fff; border-color: var(--brand); }
  input { width: 100%; font: inherit; padding: 10px; border: 1px solid var(--line); border-radius: 10px; }
  .tag { display: inline-block; font-size: .75rem; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: #dde8f7; color: #1d4f91; }
  code { background: #eef1ea; padding: 1px 5px; border-radius: 4px; }
  pre { white-space: pre-wrap; background: #eef1ea; padding: 10px; border-radius: 8px; font-size: .8rem; }
</style>
</head>
<body>
<main>
  <h1>Prueba de MENSADEF</h1>
  <p class="muted">Esta página solo <b>lee</b>, con tu sesión, cómo está organizada la biblioteca de mensajes (columnas, tipos de archivo, número de elementos) y lo muestra aquí. No modifica nada ni envía nada fuera del servidor.</p>

  <noscript><div class="card bad">❌ El servidor no ejecuta el código de esta página.</div></noscript>
  <div class="card bad" id="sinjs">❌ Si ves este mensaje, el servidor no ejecuta el código de esta página (o la ha descargado en vez de abrirla): la versión para MENSADEF no es posible sin un administrador.</div>

  <div id="app" hidden>
    <div class="card ok">✅ Funciona: el servidor ejecuta esta página.</div>
    <div class="card" id="sitio"><p class="muted">Localizando el sitio donde está este archivo…</p></div>
    <div class="card">
      <p><b>¿Dónde están tus mensajes?</b> Si esta página está en tu carpeta de mensajes, se analiza sola. Si no, abre la carpeta en otra pestaña, copia la dirección y pégala aquí.</p>
      <input id="urlCarpeta" type="url" value="https://mensadef.mdef.es/ambito/2SUIGE/SMDMDDocumentosParticulares_A_C/Forms/AllItems.aspx?RootFolder=%2fambito%2f2SUIGE%2fSMDMDDocumentosParticulares%5fA%5fC%2fasansen" placeholder="https://…/Forms/AllItems.aspx?RootFolder=…">
      <p style="margin-top:8px"><button class="prim" id="analizar">Analizar</button></p>
      <p class="muted" id="aviso"></p>
    </div>
    <div class="card" id="biblioteca" hidden></div>
    <div class="card" id="columnas" hidden></div>
    <div class="card" id="carpeta" hidden></div>
    <div class="card" id="muestra" hidden></div>
    <div class="card">
      <p><b>Para enviar a Claude</b> (con permiso de tu responsable de seguridad): este resumen solo contiene nombres de columnas, tipos de archivo y recuentos. <b>No incluye asuntos, nombres de archivo ni contenido de mensajes.</b></p>
      <button class="prim" id="copiar">Copiar resumen</button>
      <pre id="resumen"></pre>
    </div>
  </div>
</main>
<script>
(function () {
  var sinjs = document.getElementById('sinjs');
  if (document.documentMode || !window.fetch || !window.Promise || !window.URL || !Element.prototype.closest) {
    sinjs.innerHTML = '⚠️ El servidor sí ejecuta esta página, pero se está abriendo en <b>modo Internet Explorer</b> (o un navegador muy antiguo). ' +
      'Ábrela en Microsoft Edge o Chrome normal. Si MENSADEF solo funciona en modo Internet Explorer, dímelo: la app necesitaría adaptarse.';
    return;
  }
  sinjs.style.display = 'none';
  document.getElementById('app').hidden = false;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var resumen = { servidor: location.hostname, sitio: '', usuario: '', biblioteca: null, columnas: [], tiposDeContenido: [], carpeta: null, camposRellenos: null, errores: [] };
  var pintarResumen = function () { $('resumen').textContent = JSON.stringify(resumen, null, 1); };
  var anotarError = function (e) { resumen.errores.push(String(e && e.message || e)); pintarResumen(); };
  var fallo = function (id, txt, e) { anotarError(e); $(id).hidden = false; $(id).innerHTML = '<p class="bad" style="padding:8px;border-radius:8px">' + esc(txt) + ': ' + esc(e && e.message || e) + '</p>'; };
  var lista = function (x) { return !x ? [] : Array.isArray(x) ? x : (x.results || x.value || []); };
  var q = function (ruta) { return encodeURIComponent("'" + ruta.replace(/'/g, "''") + "'"); };

  // REST de SharePoint. Primero JSON ligero (2013 SP1 en adelante); si el servidor no lo admite, formato «verbose».
  function api(ruta, base) {
    var url = base + '/_api/' + ruta;
    var pedir = function (accept) {
      return fetch(url, { credentials: 'same-origin', headers: { Accept: accept } }).then(function (r) {
        if (!r.ok) { var err = new Error('HTTP ' + r.status + ' en ' + ruta); err.status = r.status; throw err; }
        return r.json();
      });
    };
    return pedir('application/json;odata=nometadata').catch(function (e) {
      if ([400, 406, 415].indexOf(e.status) < 0) throw e;
      return pedir('application/json;odata=verbose').then(function (d) {
        d = d.d || d;
        return d.results ? { value: d.results } : d;
      });
    });
  }

  // El sitio (web) de una ruta: se prueba de la ruta más larga a la más corta hasta que SharePoint responde
  function webDe(ruta) {
    var partes = ruta.split('/').filter(Boolean);
    var candidatas = [];
    for (var i = partes.length; i >= 0; i--) candidatas.push(location.origin + (i ? '/' + partes.slice(0, i).join('/') : ''));
    var probar = function (n) {
      if (n >= candidatas.length) return Promise.reject(new Error('No se encontró el sitio de SharePoint'));
      return api('web?$select=Url,Title', candidatas[n]).then(function (w) { return { url: w.Url || candidatas[n], titulo: w.Title }; })
        .catch(function () { return probar(n + 1); });
    };
    return probar(0);
  }

  // La biblioteca de una ruta de carpeta: se prueba de la más larga a la más corta con GetList
  function bibliotecaDe(web, ruta) {
    var partes = ruta.split('/').filter(Boolean);
    var candidatas = [];
    for (var i = partes.length; i > 0; i--) candidatas.push('/' + partes.slice(0, i).join('/'));
    candidatas = candidatas.filter(function (c) { return c.length > (new URL(web.url).pathname.replace(/\/$/, '')).length; });
    var probar = function (n) {
      if (n >= candidatas.length) return Promise.reject(new Error('No encuentro la biblioteca de ' + ruta));
      return api('web/GetList(@u)?@u=' + q(candidatas[n]) + '&$select=Id,Title,ItemCount,BaseTemplate,EnableVersioning,RootFolder/ServerRelativeUrl&$expand=RootFolder', web.url)
        .then(function (l) { return l; }).catch(function () { return probar(n + 1); });
    };
    return probar(0);
  }

  var extension = function (n) { var m = /\.([a-z0-9]{1,6})$/i.exec(n || ''); return m ? m[1].toLowerCase() : '(sin extensión)'; };
  var mes = function (s) { return s ? String(s).slice(0, 7) : ''; };
  var vacio = function (v) { return v == null || v === '' || (typeof v === 'object' && (v.__deferred || (Array.isArray(v.results) && !v.results.length))); };

  function analizar(web, rutaCarpeta) {
    ['biblioteca', 'columnas', 'carpeta', 'muestra'].forEach(function (id) { $(id).hidden = true; });
    $('aviso').textContent = 'Buscando la biblioteca…';
    return bibliotecaDe(web, rutaCarpeta).then(function (l) {
      var raiz = l.RootFolder && l.RootFolder.ServerRelativeUrl;
      resumen.biblioteca = { titulo: l.Title, plantilla: l.BaseTemplate, elementos: l.ItemCount, versiones: l.EnableVersioning, raiz: raiz };
      pintarResumen();
      $('aviso').textContent = '';
      $('biblioteca').hidden = false;
      $('biblioteca').innerHTML = '<b>Biblioteca:</b> ' + esc(l.Title) + ' <span class="muted">(' + l.ItemCount + ' elementos en total · ' + esc(raiz) + ')</span>';
      var base = 'web/lists(guid\'' + l.Id + '\')';
      var pCols = api(base + '/fields?$select=Title,InternalName,TypeAsString,Hidden,ReadOnlyField&$filter=Hidden eq false', web.url).then(function (d) {
        var cs = lista(d.value);
        resumen.columnas = cs.map(function (c) { return c.Title + ' = ' + c.InternalName + ' (' + c.TypeAsString + (c.ReadOnlyField ? ', solo lectura' : '') + ')'; });
        pintarResumen();
        $('columnas').hidden = false;
        $('columnas').innerHTML = '<p><b>Columnas de la biblioteca</b></p><table><thead><tr><th>Nombre</th><th>Nombre interno</th><th>Tipo</th></tr></thead><tbody>' +
          cs.map(function (c) { return '<tr><td>' + esc(c.Title) + '</td><td><code>' + esc(c.InternalName) + '</code></td><td>' + esc(c.TypeAsString) + '</td></tr>'; }).join('') + '</tbody></table>';
      }).catch(function (e) { fallo('columnas', 'No se pudieron leer las columnas', e); });
      var pTipos = api(base + '/contenttypes?$select=Name', web.url).then(function (d) {
        resumen.tiposDeContenido = lista(d.value).map(function (t) { return t.Name; }); pintarResumen();
      }).catch(anotarError);
      var carpeta = 'web/GetFolderByServerRelativeUrl(@f)';
      var pCarpeta = Promise.all([
        api(carpeta + '/Files?@f=' + q(rutaCarpeta) + '&$select=Name,TimeCreated,TimeLastModified,Length&$expand=ListItemAllFields', web.url),
        api(carpeta + '/Folders?@f=' + q(rutaCarpeta) + '&$select=Name,ItemCount', web.url)
      ]).then(function (r) {
        var fs = lista(r[0].value), ds = lista(r[1].value).filter(function (d) { return d.Name !== 'Forms'; });
        var ext = {}, meses = {};
        fs.forEach(function (f) { var e = extension(f.Name); ext[e] = (ext[e] || 0) + 1; var m = mes(f.TimeCreated); if (m) meses[m] = (meses[m] || 0) + 1; });
        var ms = Object.keys(meses).sort();
        var tam = fs.reduce(function (a, f) { return a + Number(f.Length || 0); }, 0);
        resumen.carpeta = { archivos: fs.length, subcarpetas: ds.length, elementosEnSubcarpetas: ds.reduce(function (a, d) { return a + (d.ItemCount || 0); }, 0),
          tipos: ext, desde: ms[0] || '', hasta: ms[ms.length - 1] || '', tamanoMedioKB: fs.length ? Math.round(tam / fs.length / 1024) : 0 };
        // Qué columnas vienen rellenas en los archivos (solo el nombre de la columna y cuántas veces, nunca el valor)
        var rellenos = {};
        fs.slice(0, 200).forEach(function (f) {
          var it = f.ListItemAllFields || {};
          Object.keys(it).forEach(function (k) { if (k.indexOf('__') !== 0 && k.indexOf('odata') !== 0 && !vacio(it[k])) rellenos[k] = (rellenos[k] || 0) + 1; });
        });
        resumen.camposRellenos = { revisados: Math.min(fs.length, 200), campos: rellenos };
        pintarResumen();
        $('carpeta').hidden = false;
        $('carpeta').innerHTML = '<p><b>Carpeta analizada:</b> <code>' + esc(rutaCarpeta) + '</code></p><p>' + fs.length + ' archivos · ' + ds.length + ' subcarpetas' +
          (ms.length ? ' · del ' + esc(ms[0]) + ' al ' + esc(ms[ms.length - 1]) : '') + '</p><p>Tipos: ' +
          Object.keys(ext).map(function (e) { return '<span class="tag">' + esc(e) + ' · ' + ext[e] + '</span>'; }).join(' ') + '</p>';
        // Vista local de comprobación: solo en tu pantalla, no entra en el resumen
        var ult = fs.slice().sort(function (a, b) { return String(b.TimeCreated).localeCompare(String(a.TimeCreated)); }).slice(0, 5);
        if (ult.length) {
          $('muestra').hidden = false;
          $('muestra').innerHTML = '<p><b>Últimos archivos</b> <span class="muted">(solo para que compruebes que lee bien; no se incluye en el resumen)</span></p><table><tbody>' +
            ult.map(function (f) { return '<tr><td>' + esc(f.Name) + '</td><td>' + esc(String(f.TimeCreated).slice(0, 10)) + '</td></tr>'; }).join('') + '</tbody></table>';
        }
      }).catch(function (e) { fallo('carpeta', 'No se pudo leer la carpeta', e); });
      return Promise.all([pCols, pTipos, pCarpeta]);
    }).catch(function (e) { anotarError(e); $('aviso').textContent = 'No se pudo abrir: ' + (e.message || e) + '. ¿Tienes permiso para verla?'; });
  }

  // Ruta de carpeta de una dirección de SharePoint: parámetro RootFolder o la propia ruta (quitando Forms/…aspx)
  function carpetaDe(u) {
    var rf = u.searchParams.get('RootFolder') || u.searchParams.get('id');
    if (rf) return rf;
    return decodeURIComponent(u.pathname).replace(/\/Forms\/[^/]*$/i, '').replace(/\/[^/]*\.(aspx|html?)$/i, '');
  }

  var web = null;
  var carpetaPropia = decodeURIComponent(location.pathname).replace(/\/[^/]*$/, '');
  webDe(carpetaPropia).then(function (w) {
    web = w;
    resumen.sitio = w.url; pintarResumen();
    $('sitio').innerHTML = '<b>Este archivo está en el sitio:</b> ' + esc(w.titulo || '') + ' <span class="muted">(' + esc(w.url) + ')</span><div id="usuario"></div>';
    api('web/currentuser?$select=Title', w.url).then(function (u) { resumen.usuario = u.Title; pintarResumen(); $('usuario').innerHTML = '<b>Tu usuario:</b> ' + esc(u.Title); })
      .catch(anotarError);
    return analizar(w, carpetaPropia);
  }).catch(function (e) {
    anotarError(e);
    $('sitio').innerHTML = '<p class="bad" style="padding:8px;border-radius:8px">El código se ejecuta, pero no he podido hablar con SharePoint desde aquí (' + esc(e.message || e) + ').</p>';
  });

  $('analizar').addEventListener('click', function () {
    var u;
    try { u = new URL($('urlCarpeta').value.trim()); } catch (e) { $('aviso').textContent = 'Esa dirección no es válida.'; return; }
    if (u.origin !== location.origin) { $('aviso').textContent = 'Esa dirección es de otro servidor (' + u.hostname + '). Sube este archivo a ' + u.hostname + '.'; return; }
    var ruta = carpetaDe(u);
    webDe(ruta).then(function (w) { web = w; resumen.sitio = w.url; pintarResumen(); return analizar(w, ruta); })
      .catch(function (e) { anotarError(e); $('aviso').textContent = 'No se pudo abrir: ' + (e.message || e); });
  });
  $('urlCarpeta').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('analizar').click(); });

  $('copiar').addEventListener('click', function () {
    var txt = $('resumen').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { $('copiar').textContent = 'Copiado ✓'; })
      .catch(function () { var r = document.createRange(); r.selectNodeContents($('resumen')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); $('copiar').textContent = 'Seleccionado: cópialo'; });
  });
  pintarResumen();
})();
</script>
</body>
</html>
