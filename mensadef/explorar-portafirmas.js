/* Explorar Portafirmas (13/11/2026) · © 2026 Cte. Alfredo Sánchez Sender
   Favorito de diagnóstico para portafirmas.mdef.es: anota CÓMO está hecha la página (rutas, nombres de parámetros,
   formularios, botones, cabeceras de tablas, cómo se llama a AutoFirma), NUNCA su contenido: ni asuntos, ni nombres,
   ni números (se tapan), ni valores de campos. Sirve para que SENDERO pueda llevarte a la petición y dejarla lista
   para firmar. No envía nada a ningún sitio; se quita recargando (F5). */
(function () {
  'use strict';
  if (window.__explorarPF) { window.__explorarPF.mostrar(); return; }
  var VERSION = '2';
  // Lo anotado se guarda en esta pestaña (sessionStorage): si la página cambia al pulsar, se vuelve a pulsar el favorito
  var acciones = []; try { acciones = JSON.parse(sessionStorage.getItem('explorarPF') || '[]'); } catch (e) { acciones = []; }
  // Tapa números, identificadores y textos largos de una dirección: deja la ruta y los nombres de los parámetros
  var tapar = function (s) { return String(s || '').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'GUID').replace(/\d+/g, 'N'); };
  var ruta = function (u) {
    var x; try { x = new URL(u, location.href); } catch (e) { return '(dirección no válida)'; }
    if (/^(afirma|autofirma|miniapplet|clienteafirma):/i.test(x.protocol)) return x.protocol + ' (AutoFirma por protocolo)';
    if (x.protocol === 'javascript:') return 'javascript: ' + (String(u).match(/[A-Za-z_$][\w$.]*\s*\(/g) || []).slice(0, 4).join(' ').replace(/\s*\(/g, '()');
    var qs = []; x.searchParams.forEach(function (v, k) { if (qs.indexOf(k) < 0) qs.push(k); });
    return (x.origin !== location.origin ? x.host : '') + tapar(x.pathname) + (qs.length ? ' ?' + qs.join('&') : '') + (x.hash ? ' #' + tapar(x.hash.slice(0, 40)) : '');
  };
  var unico = function (l) { return l.filter(function (x, i) { return x && l.indexOf(x) === i; }); };
  var etq = function (el) { return String(el.value && /^(button|submit|reset)$/i.test(el.type) ? el.value : el.textContent || el.title || el.getAttribute('aria-label') || el.alt || '').replace(/\s+/g, ' ').trim().slice(0, 40); };
  var esControl = function (t) { return t && t.length <= 40 && !/\d{3,}/.test(t); };
  function estructura(doc, donde) {
    var r = [];
    try { r.push('== ' + donde + ': ' + ruta(doc.location.href) + ' · título: ' + (esControl(doc.title) ? doc.title : '(…)')); } catch (e) { r.push('== ' + donde + ': (otro servidor, no se puede leer)'); return r; }
    var fs = doc.forms;
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i], campos = unico(Array.prototype.map.call(f.elements, function (c) { return tapar(c.name || c.id || '?') + ':' + (c.type || c.tagName.toLowerCase()); }));
      r.push('Formulario ' + (f.name || f.id || i) + ' → ' + (f.method || 'get').toUpperCase() + ' ' + ruta(f.getAttribute('action') || location.href) + ' · campos: ' + campos.slice(0, 40).join(', ') + (campos.length > 40 ? '…' : ''));
    }
    var bs = doc.querySelectorAll('button, input[type=button], input[type=submit], a[onclick], [role=button], img[onclick], span[onclick]');
    bs = Array.prototype.filter.call(bs, function (b) { return !(b.closest && b.closest('#explorarPF')); });
    var bt = unico(Array.prototype.map.call(bs, function (b) {
      var t = etq(b), on = (b.getAttribute('onclick') || '').match(/[A-Za-z_$][\w$.]*\s*\(/g);
      return (esControl(t) ? '«' + t + '»' : '(icono)') + (b.id ? ' #' + tapar(b.id) : '') + (on ? ' onclick: ' + on.slice(0, 3).join(' ').replace(/\s*\(/g, '()') : '');
    }));
    if (bt.length) r.push('Botones (' + bt.length + '): ' + bt.slice(0, 60).join(' | '));
    var ts = doc.querySelectorAll('table');
    for (var j = 0; j < ts.length; j++) {
      var t = ts[j], filas = t.querySelectorAll('tbody tr, tr').length; if (filas < 2) continue;
      var cab = Array.prototype.map.call(t.querySelectorAll('th'), function (h) { var x = etq(h); return esControl(x) ? x : '(…)'; });
      var f1 = t.querySelector('tbody tr:nth-child(1)') || t.rows[1];
      var tipos = f1 ? Array.prototype.map.call(f1.cells, function (c) { var e = c.querySelector('input,a,img,button'); return e ? e.tagName.toLowerCase() + (e.type ? ':' + e.type : '') + (e.tagName === 'A' ? '→' + ruta(e.getAttribute('href') || '') : '') : 'texto'; }) : [];
      r.push('Tabla ' + (t.id || t.className || j) + ': ' + filas + ' filas · cabeceras: ' + (cab.join(' | ') || '(sin th)') + (tipos.length ? ' · 1.ª fila: ' + tipos.join(' | ') : ''));
    }
    var ls = unico(Array.prototype.map.call(doc.querySelectorAll('a[href]'), function (a) { return ruta(a.getAttribute('href')); }));
    if (ls.length) r.push('Enlaces (formas, ' + ls.length + '): ' + ls.slice(0, 50).join(' | '));
    var scr = unico(Array.prototype.map.call(doc.querySelectorAll('script[src]'), function (s) { return ruta(s.getAttribute('src')).split(' ?')[0].split('/').pop(); }));
    if (scr.length) r.push('Scripts: ' + scr.slice(0, 30).join(', '));
    // v2: casillas en cualquier sitio (dentro o fuera de tablas): nombre o id (números tapados), cuántas y dónde están
    var cbs = Array.prototype.filter.call(doc.querySelectorAll('input[type=checkbox], input[type=radio]'), function (c) { return !(c.closest && c.closest('#explorarPF')); });
    if (cbs.length) {
      var grupos = {};
      cbs.forEach(function (c) {
        var cont = c.closest('tr, li, [role=row], .card, .list-group-item, .row, div') || c.parentNode;
        var k = c.type + ' ' + tapar(c.name || c.id || '?') + ' en ' + cont.tagName.toLowerCase() + (cont.className ? '.' + tapar(String(cont.className).split(/\s+/).slice(0, 3).join('.')) : '') + (c.form ? ' (form ' + (c.form.name || c.form.id || '?') + ')' : ' (fuera de formulario)');
        grupos[k] = grupos[k] || { n: 0, marc: 0, attrs: [] }; grupos[k].n++; if (c.checked) grupos[k].marc++;
        Array.prototype.forEach.call(c.attributes, function (a) { if (!/^(type|name|id|class|style|checked|value)$/i.test(a.name) && grupos[k].attrs.indexOf(a.name) < 0) grupos[k].attrs.push(a.name); });
      });
      Object.keys(grupos).forEach(function (k) { r.push('Casillas: ' + k + ' · ' + grupos[k].n + ' (' + grupos[k].marc + ' marcadas)' + (grupos[k].attrs.length ? ' · atributos: ' + grupos[k].attrs.join(', ') : '')); });
    }
    // Listas que no son tablas (filas repetidas de la misma clase)
    var clases = {};
    Array.prototype.forEach.call(doc.querySelectorAll('li, div[class], tr[class]'), function (e) { if (e.closest && e.closest('#explorarPF')) return; var c = String(e.className || '').trim(); if (!c || c.length > 80) return; clases[e.tagName.toLowerCase() + '.' + c] = (clases[e.tagName.toLowerCase() + '.' + c] || 0) + 1; });
    var rep = Object.keys(clases).filter(function (k) { return clases[k] >= 3 && clases[k] <= 500; }).sort(function (a, b) { return clases[b] - clases[a]; }).slice(0, 12);
    if (rep.length) r.push('Elementos repetidos: ' + rep.map(function (k) { return tapar(k) + ' ×' + clases[k]; }).join(' | '));
    var fr = doc.querySelectorAll('iframe, frame');
    for (var k = 0; k < fr.length; k++) { try { r = r.concat(estructura(fr[k].contentDocument, 'marco ' + (fr[k].name || fr[k].id || k))); } catch (e) { r.push('marco ' + k + ': otro servidor'); } }
    return r;
  }
  // Lo que pasa al pulsar (seleccionar, firmar): envíos de formularios, peticiones, ventanas y llamadas a AutoFirma
  var anotar = function (t) { acciones.push(new Date().toLocaleTimeString('es-ES') + ' ' + t); try { sessionStorage.setItem('explorarPF', JSON.stringify(acciones.slice(-200))); } catch (e) { /* sin memoria */ } pintar(); };
  var X = XMLHttpRequest.prototype, xo = X.open;
  X.open = function (m, u) { try { anotar('PETICIÓN ' + m + ' ' + ruta(u)); } catch (e) { /* nada */ } return xo.apply(this, arguments); };
  var fo = window.fetch; if (fo) window.fetch = function (u, o) { try { anotar('FETCH ' + ((o && o.method) || 'GET') + ' ' + ruta(typeof u === 'string' ? u : u.url)); } catch (e) { /* nada */ } return fo.apply(this, arguments); };
  var wo = window.open; window.open = function (u) { anotar('VENTANA NUEVA → ' + ruta(u)); return wo.apply(this, arguments); };
  var WS = window.WebSocket; if (WS) window.WebSocket = function (u, p) { anotar('WEBSOCKET → ' + tapar(String(u)).replace(/\?.*/, '') + ' (AutoFirma por conexión local)'); return p ? new WS(u, p) : new WS(u); };
  // Al salir de la página (envío, enlace o llamada a AutoFirma por dirección) se anota, aunque no se sepa adónde
  window.addEventListener('pagehide', function () { anotar('LA PÁGINA SE VA (cambio de página o AutoFirma)'); });
  document.addEventListener('submit', function (e) { var f = e.target; anotar('ENVÍO DE FORMULARIO ' + (f.name || f.id || '') + ' → ' + (f.method || 'get').toUpperCase() + ' ' + ruta(f.getAttribute('action') || location.href)); }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, input[type=button], input[type=submit], a, [onclick], input[type=checkbox]'); if (!b || b.closest('#explorarPF')) return;
    var t = etq(b); anotar('CLIC en ' + b.tagName.toLowerCase() + (b.type ? ':' + b.type : '') + ' ' + (esControl(t) ? '«' + t + '»' : '(…)') + (b.tagName === 'A' && b.getAttribute('href') ? ' → ' + ruta(b.getAttribute('href')) : ''));
  }, true);
  var caja = document.createElement('div'); caja.id = 'explorarPF';
  caja.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;width:440px;max-height:60vh;overflow:auto;background:#fff;border:3px solid #a01919;border-radius:10px;font:12px/1.35 system-ui,Segoe UI,sans-serif;color:#111;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:10px';
  document.body.appendChild(caja);
  // v2: el código de las funciones de los botones (es código de la aplicación, no datos): qué campos leen y qué envían
  function funciones() {
    var nombres = [];
    Array.prototype.forEach.call(document.querySelectorAll('[onclick], [onchange]'), function (e) {
      if (e.closest && e.closest('#explorarPF')) return;
      ((e.getAttribute('onclick') || '') + ' ' + (e.getAttribute('onchange') || '')).replace(/([A-Za-z_$][\w$]*)\s*\(/g, function (x, n) { if (nombres.indexOf(n) < 0 && !/^(if|return|function|confirm|alert|this)$/.test(n)) nombres.push(n); return x; });
    });
    ['firmaAutofirma', 'firmar', 'seleccionarTodos', 'marcarTodos', 'obtenerDocsSeleccionados'].forEach(function (n) { if (nombres.indexOf(n) < 0 && typeof window[n] === 'function') nombres.push(n); });
    return nombres.filter(function (n) { return typeof window[n] === 'function'; }).slice(0, 8).map(function (n) {
      // Los textos del código se tapan salvo los que son selectores o nombres de campo (sin espacios, o con . # [ : > =)
      var c = String(window[n]).replace(/(["'])((?:(?!\1)[^\\\n]|\\.)*)\1/g, function (x, q, t) {
        return (t.length <= 60 && (/^[\w$.#\[\]=:>~*^|() -]*$/.test(t) && (!/ /.test(t) || /[.#\[:>=]/.test(t))) && !/[A-ZÁÉÍÓÚÑ]{3,}\s+[A-ZÁÉÍÓÚÑ]/.test(t)) ? x : q + '…' + q;
      }).replace(/\d{3,}/g, 'N');
      return '--- función ' + n + ' (' + c.length + ' caracteres):\n' + c.slice(0, 1800) + (c.length > 1800 ? '\n…' : '');
    });
  }
  function texto() {
    return ['EXPLORAR PORTAFIRMAS v' + VERSION + ' (sin contenido) · ' + new Date().toLocaleString('es-ES')].concat(estructura(document, 'Página'), ['', 'Código de los botones:'], funciones(), ['', 'Al pulsar:'], acciones.length ? acciones : ['(nada todavía)']).join('\n');
  }
  function pintar() {
    caja.innerHTML = '<b style="color:#a01919">🔍 Explorar Portafirmas</b> <span style="color:#666">— solo estructura, nunca contenido</span>' +
      '<ol style="margin:6px 0 6px 18px;padding:0"><li>Entra como <b>Firmante</b> y espera a que salga la lista de documentos <b>pendientes</b> (con alguno en ella).</li><li>Pulsa otra vez este favorito, marca un documento y pulsa <b>Firmar</b>; cuando salga AutoFirma, <b>cancela</b>.</li><li>Si la página cambia, pulsa otra vez el favorito: conserva lo anotado.</li><li>Pulsa <b>Copiar</b> y pégalo en la conversación.</li></ol>' +
      '<button id="pfCopiar" style="font-weight:700">Copiar</button> <button id="pfCerrar">Cerrar</button> <button id="pfBorrar">Empezar de nuevo</button> <span id="pfMsg" style="color:#2e7d32"></span>' +
      '<pre style="white-space:pre-wrap;background:#f6f6f6;padding:6px;border-radius:6px;margin:6px 0 0;max-height:30vh;overflow:auto"></pre>';
    caja.querySelector('pre').textContent = texto();
    caja.querySelector('#pfCopiar').onclick = function () { var t = texto(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { caja.querySelector('#pfMsg').textContent = 'Copiado ✓'; }, function () { prompt('Copia este texto:', t); }); };
    caja.querySelector('#pfCerrar').onclick = function () { caja.style.display = 'none'; };
    caja.querySelector('#pfBorrar').onclick = function () { acciones = []; try { sessionStorage.removeItem('explorarPF'); } catch (e) { /* nada */ } pintar(); };
  }
  window.__explorarPF = { mostrar: function () { caja.style.display = ''; pintar(); } };
  pintar();
})();
