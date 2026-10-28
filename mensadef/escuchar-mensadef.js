// Escuchar MENSADEF (diagnóstico, solo lectura). Se lanza con el favorito «Escuchar MENSADEF» sobre la página de MENSADEF
// abierta, SIN sustituirla: anota cada consulta que hace la propia aplicación (fetch y XMLHttpRequest) mientras el usuario
// navega a su célula o bandeja, y resume su ESTRUCTURA: ruta, nombres de parámetros, de campos y de propiedades, y nº de
// elementos devueltos. Nunca guarda valores: los textos entre comillas y los valores de los parámetros se sustituyen por «…».
// No envía nada a ningún sitio: el resumen se copia a mano. Para quitarlo, recargar la página (F5).
(function () {
  'use strict';
  if (window.__escuchaMensadef) { window.__escuchaMensadef(); return; }
  var VERSION = 3; // se ve en el recuadro y en el resumen, para saber qué favorito se ha pulsado
  var reg = [], indice = {};
  try { performance.setResourceTimingBufferSize(5000); } catch (e) { /* sin registro de recursos */ }

  // Parámetros cuyo valor es estructura (nombres de campos u orden), no contenido
  var ESTRUCTURA = /^(\$select|\$expand|\$orderby|\$top|\$skip|selectproperties|sortlist|rowlimit|startrow|trimduplicates|enablequeryrules|clienttype|suxrid|count)$/i;
  // De una consulta del buscador o de un $filter solo se quedan los nombres de las propiedades
  var propiedades = function (v) {
    var ps = {}; String(v).replace(/([A-Za-z_][\w/]*)\s*(?::|=|<>|>=|<=|<|>|\s+(?:eq|ne|gt|ge|lt|le)\s)/g, function (m, p) { if (!/^(and|or|not|eq|ne|gt|ge|lt|le|https?)$/i.test(p)) ps[p] = 1; });
    var l = Object.keys(ps); return l.length ? '[propiedades: ' + l.join(', ') + ']' : '…';
  };
  // Valores que sí se muestran: los de tipo, página, tamaño, «solo…» y orden (cortos, sin @: categorías y números), y los
  // identificadores, como {id} (o {id de la célula} si es el de la dirección de la página)
  var GUID = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;
  var idPagina = ((/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(location.hash) || [])[0] || '').toLowerCase();
  var valorParam = function (k, v) {
    if (GUID.test(v)) return v.toLowerCase().replace(/[{}]/g, '') === idPagina ? '{id de la célula de la página}' : '{id}';
    if (/^(tipo\w*|tamano\w*|tamaño\w*|indice\w*|índice\w*|solo\w*|pagina\w*|página\w*|orden\w*|top|skip)$/i.test(k) && v.length <= 20 && !/@/.test(v)) return v;
    return v === '' ? '(vacío)' : '…';
  };
  var limpiarUrl = function (u) {
    var x; try { x = new URL(u, location.href); } catch (e) { return '(dirección no válida)'; }
    // Los nombres de lista (getbytitle) y las rutas de carpeta son estructura; los literales largos o raros, no
    var ruta = decodeURIComponent(x.pathname).replace(/\((@?\w+=)?'([^']*)'\)/g, function (m, a, v) { return '(' + (a || '') + "'" + (/^[\w .\-\/áéíóúñÁÉÍÓÚÑ]+$/.test(v) && v.length < 120 ? v : '…') + "')"; });
    var qs = [];
    x.searchParams.forEach(function (v, k) {
      qs.push(k + '=' + (ESTRUCTURA.test(k) ? v.slice(0, 300) : /filter|query|querytext|querytemplate|refinementfilters/i.test(k) ? propiedades(v) : valorParam(k, v)));
    });
    return (x.origin !== location.origin ? x.host : '') + ruta + (qs.length ? ' ?' + qs.join('&') : '');
  };
  // Estructura de una respuesta JSON: nº de elementos y nombres de sus campos (sin valores)
  var camposDe = function (o) { return Object.keys(o || {}).filter(function (k) { return k !== '__metadata' && k.indexOf('@odata') !== 0 && k.indexOf('odata.') !== 0; }); };
  // Estructura anidada (2 niveles) con el tipo de cada campo: texto, número, sí/no, fecha, id, lista[n]{…}
  var tipoDe = function (v) {
    if (v === null || v === undefined) return 'vacío';
    if (typeof v === 'number') return 'número';
    if (typeof v === 'boolean') return 'sí/no';
    if (typeof v === 'string') return GUID.test(v) ? 'id' : /^\d{4}-\d{2}-\d{2}T|^\/Date\(/.test(v) ? 'fecha' : 'texto';
    return 'objeto';
  };
  function describir(o, nivel) {
    if (Array.isArray(o)) {
      var cs = {}; o.slice(0, 20).forEach(function (x) { if (x && typeof x === 'object' && !Array.isArray(x)) camposDe(x).forEach(function (k) { if (!cs[k] || cs[k] === 'vacío') cs[k] = x[k]; }); });
      var ks = Object.keys(cs);
      return '[' + o.length + ']' + (ks.length ? '{' + (nivel > 1 ? ks.join(', ') : ks.map(function (k) { return k + ':' + (cs[k] && typeof cs[k] === 'object' ? describir(cs[k], nivel + 1) : tipoDe(cs[k])); }).join(', ')) + '}' : '');
    }
    if (o && typeof o === 'object') return '{' + camposDe(o).map(function (k) { return k + ':' + (o[k] && typeof o[k] === 'object' && nivel < 2 ? describir(o[k], nivel + 1) : tipoDe(o[k])); }).join(', ') + '}';
    return tipoDe(o);
  }
  function resumirJson(j) {
    var d = j && j.d ? j.d : j, out = [];
    if (!d || typeof d !== 'object') return '';
    var filas = Array.isArray(d) ? d : Array.isArray(d.value) ? d.value : Array.isArray(d.results) ? d.results : null;
    var pq = d.PrimaryQueryResult || (d.query && d.query.PrimaryQueryResult) || (d.postquery && d.postquery.PrimaryQueryResult);
    if (pq) {
      var rows = pq.RelevantResults && pq.RelevantResults.Table && pq.RelevantResults.Table.Rows;
      rows = rows && (rows.results || rows);
      var celdas = rows && rows[0] && rows[0].Cells; celdas = celdas && (celdas.results || celdas);
      return 'búsqueda: ' + (rows ? rows.length : 0) + ' resultados (total ' + (pq.RelevantResults && pq.RelevantResults.TotalRows) + '); propiedades: ' + (celdas || []).map(function (c) { return c.Key; }).join(', ');
    }
    if (filas) {
      return 'lista ' + describir(filas, 0);
    }
    out = camposDe(d);
    return out.length ? 'objeto ' + describir(d, 0) : '';
  }
  function resumirRespuesta(txt, tipo) {
    if (!txt) return '';
    if (/xml/.test(tipo || '') || /^\s*</.test(txt)) {
      var et = {}; String(txt).replace(/<([A-Za-z][\w:]*)/g, function (m, n) { et[n] = (et[n] || 0) + 1; });
      var ks = Object.keys(et); return 'XML; etiquetas: ' + ks.slice(0, 40).map(function (k) { return k + (et[k] > 1 ? '×' + et[k] : ''); }).join(', ');
    }
    try { return resumirJson(JSON.parse(txt)); } catch (e) { /* no es JSON entero */ }
    // Respuesta de $batch: varias respuestas JSON dentro de un multipart
    var partes = []; String(txt).split(/\r?\n/).forEach(function (l) { if (/^\s*\{/.test(l)) { try { var r = resumirJson(JSON.parse(l)); if (r) partes.push(r); } catch (e) { /* trozo */ } } });
    return partes.length ? 'lote: ' + partes.join(' | ') : '';
  }
  function resumirCuerpo(b) {
    if (!b || typeof b !== 'string') return '';
    var dentro = [];
    b.replace(/^(GET|POST|PATCH|MERGE|PUT|DELETE)\s+(\S.*?)\s+HTTP\/1\.1/gm, function (m, met, u) { dentro.push(met + ' ' + limpiarUrl(u)); });
    if (dentro.length) return 'lote con: ' + dentro.join(' · ');
    try {
      var j = JSON.parse(b), q = j.request || j;
      if (q.Querytext || q.QueryText || q.SelectProperties) {
        var sp = q.SelectProperties && (q.SelectProperties.results || q.SelectProperties);
        return 'búsqueda: texto ' + propiedades(q.Querytext || q.QueryText || '') + (q.QueryTemplate ? '; plantilla ' + propiedades(q.QueryTemplate) : '') + (sp ? '; pide: ' + [].concat(sp).join(', ') : '');
      }
      return 'cuerpo; campos: ' + camposDe(q).join(', ');
    } catch (e) { return 'cuerpo de ' + b.length + ' caracteres'; }
  }
 // Lo que ya había consultado la aplicación antes de pulsar el favorito (p. ej. la lista de células al entrar)
  var antes = [];
  try {
    var va = {};
    performance.getEntriesByType('resource').forEach(function (e) {
      var u = new URL(e.name, location.href);
      if (/\.(js|css|png|gif|jpe?g|svg|woff2?|ttf|ico|map|axd)$/i.test(u.pathname) || !(u.origin !== location.origin || /\/api\/|\.svc|\.asmx/i.test(u.pathname))) return;
      var k = limpiarUrl(e.name); va[k] = (va[k] || 0) + 1;
    });
    antes = Object.keys(va).map(function (k) { return k + (va[k] > 1 ? ' ×' + va[k] : ''); });
  } catch (e) { /* sin registro */ }
  var ESTATICO = /\.(js|css|png|gif|jpe?g|svg|woff2?|ttf|ico|map|axd)(\?|$)/i;
  function anotar(metodo, url, cuerpo, estado, txt, tipo, cab) {
    if (ESTATICO.test(String(url).split('#')[0])) return;
    var k = String(metodo || 'GET').toUpperCase() + ' ' + limpiarUrl(url);
    var r = indice[k];
    if (!r) { r = indice[k] = { k: k, n: 0, cuerpo: resumirCuerpo(cuerpo), resp: '', cab: cab || '' }; reg.push(r); }
    r.n++; r.estado = estado;
    var s = resumirRespuesta(txt, tipo); if (s) r.resp = s;
    pintar();
  }

  // Cabeceras: se anota el NOMBRE; el valor solo si no es secreto (formato pedido o enviado) y, si no, DE DÓNDE sale
  // (una clave de la memoria de la página o una cookie), nunca el valor
  var VISIBLES = /^(accept|content-type|x-requested-with|odata-version|odata-maxversion|cache-control|pragma|if-match)$/i;
  function origenValor(v) {
    v = String(v || ''); if (v.length < 8) return 'corto (' + v.length + ' caracteres)';
    var limpio = v.replace(/^(Bearer|Basic|Token)\s+/i, ''), pref = limpio !== v ? v.split(/\s/)[0] + ' + ' : '';
    var buscar = function (alm, nombre) {
      try { for (var i = 0; i < alm.length; i++) { var k = alm.key(i), x = alm.getItem(k) || ''; if (x === limpio || x === v) return nombre + ' «' + k + '»'; if (x.indexOf(limpio) >= 0) return 'dentro de ' + nombre + ' «' + k + '»'; } } catch (e) { /* sin acceso */ }
      return '';
    };
    var de = buscar(window.sessionStorage, 'sessionStorage') || buscar(window.localStorage, 'localStorage');
    if (!de) document.cookie.split(';').forEach(function (c) { var i = c.indexOf('='), k = c.slice(0, i).trim(), x = decodeURIComponent(c.slice(i + 1)); if (!de && x && (x === limpio || x.indexOf(limpio) >= 0)) de = 'cookie «' + k + '»'; });
    return pref + (de || 'no está en la memoria de la página') + ' (' + v.length + ' caracteres' + (/^eyJ/.test(limpio) ? ', parece un token JWT' : '') + ')';
  }
  var descCab = function (k, v) { return k + (VISIBLES.test(k) ? '=' + String(v).slice(0, 80) : ' [' + origenValor(v) + ']'); };

  var f0 = window.fetch;
  if (f0) window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url, met = (init && init.method) || (input && input.method) || 'GET', body = init && init.body;
    // Solo los NOMBRES de las cabeceras (p. ej. si lleva Authorization) y si envía la sesión
    var nombres = []; try { new Headers((init && init.headers) || (input && input.headers) || {}).forEach(function (v, k) { nombres.push(descCab(k, v)); }); } catch (e) { /* sin cabeceras */ }
    var cab = 'fetch' + ((init && init.credentials) || (input && input.credentials) ? ', credentials=' + ((init && init.credentials) || input.credentials) : '') + (nombres.length ? ', cabeceras: ' + nombres.join(', ') : '');
    return f0.apply(this, arguments).then(function (r) {
      try { r.clone().text().then(function (t) { anotar(met, url, body, r.status, t, r.headers.get('content-type'), cab); }, function () { anotar(met, url, body, r.status, '', '', cab); }); } catch (e) { /* sin copia */ }
      return r;
    });
  };
  var open0 = XMLHttpRequest.prototype.open, send0 = XMLHttpRequest.prototype.send;
  var cab0 = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (m, u) { this.__esc = { m: m, u: u, cab: [] }; return open0.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (this.__esc) this.__esc.cab.push(descCab(k, v)); return cab0.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (b) {
    var x = this, e = x.__esc;
    if (e) x.addEventListener('loadend', function () {
      var t = ''; try { t = !x.responseType || x.responseType === 'text' ? x.responseText : x.responseType === 'json' ? JSON.stringify(x.response) : ''; } catch (er) { /* sin texto */ }
      anotar(e.m, e.u, b, x.status, t, x.getResponseHeader && x.getResponseHeader('content-type'), 'XMLHttpRequest' + (x.withCredentials ? ', withCredentials' : '') + (e.cab.length ? ', cabeceras: ' + e.cab.join(', ') : ''));
    });
    return send0.apply(this, arguments);
  };

  // Recuadro en la esquina (no tapa la aplicación)
  var caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;width:420px;max-width:calc(100vw - 24px);background:#fff;color:#1f261f;border:3px solid #b71c1c;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.3);font:13px/1.4 system-ui,"Segoe UI",sans-serif;padding:10px 12px';
  document.body.appendChild(caja);
  var minimizado = false;
  function texto() {
    return ['ESCUCHA DE MENSADEF v' + VERSION + ' (sin contenido) · ' + new Date().toLocaleString('es-ES'), 'Página: ' + location.pathname + ' ' + decodeURIComponent(location.hash).replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, '{id}'), '']
      .concat(antes.length ? ['ANTES DE ESCUCHAR (solo rutas):'].concat(antes.map(function (x) { return '- ' + x; }), ['', 'MIENTRAS ESCUCHABA:']) : [])
      .concat(reg.map(function (r) { return '- ' + r.k + (r.n > 1 ? ' ×' + r.n : '') + ' → ' + (r.estado || '?') + (r.cab ? ' (' + r.cab + ')' : '') + (r.cuerpo ? '\n    envía: ' + r.cuerpo : '') + (r.resp ? '\n    recibe: ' + r.resp : ''); })).join('\n');
  }
  function pintar() {
    caja.innerHTML = '<b style="color:#b71c1c">● Escuchando MENSADEF · versión ' + VERSION + '</b> · ' + reg.length + ' consultas anotadas' +
      (minimizado ? ' <button type="button" data-a="ver">Ver</button>' :
        '<p style="margin:6px 0">1. Ve a tu célula y abre tu <b>bandeja de mensajes</b> (cambia de célula o de carpeta para que se vuelvan a cargar).<br>2. Cuando veas tus mensajes, pulsa <b>Copiar</b> y pégalo en la conversación. Solo lleva rutas y nombres de campos, sin valores.</p>' +
        '<textarea readonly style="width:100%;height:140px;font:11px monospace"></textarea>' +
        '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" data-a="copiar">Copiar</button><button type="button" data-a="min">Minimizar</button><button type="button" data-a="cerrar">Cerrar</button></div>');
    var ta = caja.querySelector('textarea'); if (ta) ta.value = texto();
  }
  caja.addEventListener('click', function (e) {
    var a = e.target.getAttribute && e.target.getAttribute('data-a');
    if (a === 'copiar') { var t = texto(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { e.target.textContent = 'Copiado ✓'; }, function () { var ta = caja.querySelector('textarea'); ta.focus(); ta.select(); }); }
    else if (a === 'min') { minimizado = true; pintar(); }
    else if (a === 'ver') { minimizado = false; pintar(); }
    else if (a === 'cerrar') { caja.style.display = 'none'; }
  });
  window.__escuchaMensadef = function () { caja.style.display = ''; minimizado = false; pintar(); };
  pintar();
})();
