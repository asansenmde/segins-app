// Arranque del visor de MENSADEF (copia de pruebas). generar-marcador.py lo pone delante del visor: recibe en «h» la
// página del visor. El servicio de bandejas (mensadefapi) solo atiende las consultas que llevan las cabeceras «passcode»
// y «user» que pone la propia aplicación. Antes de sustituir la página, se esperan esas cabeceras en la siguiente consulta
// de la aplicación (basta con cambiar de célula) y se guardan solo en esta pestaña (sessionStorage), sin mostrarlas.
// Después se abre el visor, que las usa para pedir las bandejas. Si ya están guardadas (de hace menos de 8 horas), se abre
// directamente. Nada sale del navegador.
(function (h) {
  'use strict';
  var CLAVE = 'visorMensadefPruebas.cabecerasApi';
  var abierto = false;
  var abrir = function () { if (abierto) return; abierto = true; document.open(); document.write(h); document.close(); };
  var g = null; try { g = JSON.parse(sessionStorage.getItem(CLAVE)); } catch (e) { /* sin memoria */ }
  if ((g && g.passcode && Date.now() - g.momento < 8 * 3600e3) || location.hostname.toLowerCase().indexOf('mensadef.') !== 0) { abrir(); return; }

  var guardar = function (url, cab) {
    if (abierto || !/mensadefapi\./i.test(String(url || '')) || !cab.passcode) return;
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ passcode: cab.passcode, user: cab.user || '', momento: Date.now() })); } catch (e) { /* sin memoria */ }
    aviso.querySelector('p').textContent = 'Listo. Abriendo el visor…';
    setTimeout(abrir, 400);
  };
  var leerCab = function (hs) { var r = {}; try { new Headers(hs || {}).forEach(function (v, k) { r[k.toLowerCase()] = v; }); } catch (e) { /* sin cabeceras */ } return r; };
  var f0 = window.fetch;
  if (f0) window.fetch = function (input, init) {
    try { guardar(typeof input === 'string' ? input : input && input.url, leerCab((init && init.headers) || (input && input.headers))); } catch (e) { /* sigue */ }
    return f0.apply(this, arguments);
  };
  var open0 = XMLHttpRequest.prototype.open, cab0 = XMLHttpRequest.prototype.setRequestHeader, send0 = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__vis = { u: u, cab: {} }; return open0.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (this.__vis) this.__vis.cab[String(k).toLowerCase()] = v; return cab0.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () { if (this.__vis) guardar(this.__vis.u, this.__vis.cab); return send0.apply(this, arguments); };

  var aviso = document.createElement('div');
  aviso.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;width:560px;max-width:calc(100vw - 24px);background:#fff;color:#1f261f;border:3px solid #b71c1c;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.3);font:14px/1.45 system-ui,"Segoe UI",sans-serif;padding:12px 14px';
  aviso.innerHTML = '<b style="color:#b71c1c">Mensajes MENSADEF (pruebas)</b>' +
    '<p style="margin:6px 0">Para leer tus bandejas, el visor necesita que MENSADEF haga una consulta. <b>Cambia de célula</b> (o abre otra carpeta) aquí en MENSADEF y el visor se abrirá solo.</p>' +
    '<div style="display:flex;gap:8px"><button type="button" data-a="sin">Abrir sin bandejas</button><button type="button" data-a="cancelar">Cancelar</button></div>';
  aviso.addEventListener('click', function (e) {
    var a = e.target.getAttribute && e.target.getAttribute('data-a');
    if (a === 'sin') abrir();
    else if (a === 'cancelar') { abierto = true; aviso.remove(); }
  });
  document.body.appendChild(aviso);
})(h);
