// «Firmar con SENDERO» (19/11/2026): lo que hace el favorito SENDERO cuando se pulsa en portafirmas.mdef.es (va dentro de él). SENDERO abre el Portafirmas con «✍ Firmar en
// Rúbrica» en una pestaña llamada «SENDEROFIRMA_<asunto>» (window.name se conserva aunque haya que identificarse). Este
// favorito busca esa petición en la lista de pendientes, la deja como la única marcada y ofrece: «📄 Abrir el documento» (el
// visor del Portafirmas, donde el usuario lo lee y pulsa «He leído el documento») y «✍ Firmar» (el botón Firmar del
// Portafirmas, que lanza AutoFirma: certificado y PIN los pone el usuario). No se salta la lectura ni toca nada sin pulsar.
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
(function () {
  'use strict';
  var VERSION = '2';
  if (!/portafirmas\.mdef\.es$/i.test(location.hostname)) { alert('Este favorito se usa en el Portafirmas (portafirmas.mdef.es), después de pulsar «✍ Firmar en Rúbrica» en SENDERO.'); return; }
  var viejo = document.getElementById('senderoFirma'); if (viejo) viejo.parentNode.removeChild(viejo);
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^\s*((re|rv|fw|fwd|sdo|ref)\s*[:.]\s*)+/i, '').replace(/[^a-z0-9ñ]+/g, ' ').trim(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // Asunto buscado: el que dejó SENDERO en el nombre de la pestaña o, si no, el filtro «Título» de la lista
  var asunto = '';
  if (/^SENDEROFIRMA_/.test(window.name)) { try { asunto = decodeURIComponent(window.name.slice(13)); } catch (e) { asunto = ''; } }
  var filtro = document.querySelector('form[name="formDocumentos"] input[name="titulo"]');
  if (!asunto && filtro) asunto = filtro.value || '';
  // Panel
  var panel = document.createElement('div'); panel.id = 'senderoFirma';
  panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000;width:420px;max-width:calc(100vw - 32px);background:#fff;border:2px solid #12315a;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3);font:14px/1.45 system-ui,"Segoe UI",sans-serif;color:#1c2a3a';
  var poner = function (html) {
    panel.innerHTML = '<div style="background:#12315a;color:#fff;padding:8px 12px;border-radius:9px 9px 0 0;display:flex;align-items:center"><b>✍ Firmar con SENDERO</b><span style="margin-left:auto;font-size:11px;opacity:.8">v' + VERSION + '</span><button type="button" id="sfCerrar" style="margin-left:8px;background:none;border:0;color:#fff;font-size:18px;cursor:pointer">×</button></div><div style="padding:10px 12px">' + html + '</div>';
    document.getElementById('sfCerrar').onclick = function () { panel.parentNode.removeChild(panel); };
  };
  document.body.appendChild(panel);
  var form = document.forms.formDocumentos;
  // Fuera de la lista de pendientes (inicio, elegir perfil…): se va a la lista filtrada por el asunto
  if (!form || !document.getElementById('botPtfrFirmar')) {
    if (document.querySelector('input[type="password"]')) { poner('<p>Identifícate en el Portafirmas y, cuando estés dentro, pulsa otra vez el favorito.</p>'); return; }
    if (asunto && /\/ePortafirmas\//i.test(location.pathname)) {
      poner('<p>Voy a tu lista de pendientes filtrada por el asunto. <b>Cuando cargue, pulsa otra vez el favorito.</b></p><p style="font-size:12px;color:#5a6676">Si te pide elegir perfil, entra como <b>Firmante</b>.</p>');
      setTimeout(function () { location.href = '/ePortafirmas/Firmantes.do?operacion=ListaPendientes&titulo=' + encodeURIComponent(asunto.slice(0, 60)); }, 1200);
      return;
    }
    poner('<p>Entra en el Portafirmas como <b>Firmante</b> (lista de documentos pendientes) y pulsa otra vez el favorito.</p>');
    return;
  }
  // Filas de la lista de pendientes: casilla chkDoc y título (enlace a DetalleDocumento)
  var filas = Array.prototype.filter.call(document.querySelectorAll('tr'), function (tr) { return tr.querySelector('input[type="checkbox"][name="chkDoc"]'); }).map(function (tr) {
    var t = tr.querySelector('a[href*="DetalleDocumento"]');
    return { tr: tr, chk: tr.querySelector('input[type="checkbox"][name="chkDoc"]'), titulo: t ? t.textContent.replace(/\s+/g, ' ').trim() : tr.textContent.replace(/\s+/g, ' ').trim().slice(0, 120),
      ver: tr.querySelector('a[href*="showPFViewer"], a[onclick*="showPFViewer"], a[href*="Visualizar"], a[onclick*="Visualizar"]') };
  });
  if (!filas.length) { poner('<p>No hay documentos pendientes en esta lista. Si estabas filtrando, pulsa «Sin filtro» o «Filtrar» y vuelve a pulsar el favorito.</p>'); return; }
  // 26/11/2026 (pedido por el usuario): marcar todas (o varias) y firmarlas de una vez con un solo PIN, si el Portafirmas lo
  // permite. SENDERO no marca «He leído» por nadie: si el Portafirmas exige leer alguna, lo dice él y se abre esa.
  var marcadas = function () { return filas.filter(function (f) { return f.chk.checked; }); };
  var barraVarias = function () {
    return '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #d6dbe3"><b>Varias a la vez</b> <span style="font-size:12px;color:#5a6676">(' + filas.length + ' pendientes en esta página)</span><br>' +
      '<button type="button" id="sfTodas">☑ Marcar todas</button> <button type="button" id="sfNinguna">Desmarcar</button> ' +
      '<button type="button" id="sfVarias" style="background:#4a2a78;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer">✍ Firmar las marcadas (<span id="sfN">' + marcadas().length + '</span>)</button>' +
      '<p style="margin:6px 0 0;font-size:12px;color:#5a6676">AutoFirma pide el certificado y el PIN. Si el Portafirmas exige leer alguna, ábrela y pulsa «He leído».</p></div>';
  };
  var contar = function () { var n = document.getElementById('sfN'); if (n) n.textContent = marcadas().length; };
  filas.forEach(function (f) { f.chk.addEventListener('change', contar); });
  var conVarias = function () {
    var b = document.getElementById('sfTodas'); if (!b) return;
    b.onclick = function () { filas.forEach(function (f) { if (!f.chk.checked) f.chk.click(); }); contar(); };
    document.getElementById('sfNinguna').onclick = function () { filas.forEach(function (f) { if (f.chk.checked) f.chk.click(); }); contar(); };
    document.getElementById('sfVarias').onclick = function () {
      var n = marcadas().length;
      if (!n) { alert('Marca al menos una petición.'); return; }
      if (!confirm('¿Firmar ' + (n === 1 ? 'la petición marcada' : 'las ' + n + ' peticiones marcadas') + '?\n\nAutoFirma te pedirá el certificado y el PIN.')) return;
      window.name = '';
      document.getElementById('botPtfrFirmar').click();
    };
  };
  var objetivo = norm(asunto).slice(0, 50);
  var casan = objetivo ? filas.filter(function (f) { var n = norm(f.titulo); return n.indexOf(objetivo) >= 0 || (n.length >= 12 && objetivo.indexOf(n.slice(0, 50)) >= 0); }) : [];
  var elegir = function (l, texto) {
    poner('<p>' + texto + '</p>' + l.slice(0, 15).map(function (f, i) { return '<p style="margin:4px 0"><a href="#" data-sf="' + i + '">' + esc(f.titulo) + '</a></p>'; }).join('') + barraVarias());
    conVarias();
    Array.prototype.forEach.call(panel.querySelectorAll('[data-sf]'), function (a) { a.onclick = function (e) { e.preventDefault(); preparar(l[Number(a.getAttribute('data-sf'))]); }; });
  };
  function preparar(f) {
    // Solo esa marcada (como haría el usuario, pulsando las casillas para que el Portafirmas lo registre)
    filas.forEach(function (g) { if (g !== f && g.chk.checked) g.chk.click(); });
    if (!f.chk.checked) f.chk.click();
    filas.forEach(function (g) { g.tr.style.outline = ''; });
    f.tr.style.outline = '3px solid #efc000'; f.tr.scrollIntoView({ block: 'center' });
    poner('<p style="margin:0 0 6px"><b>' + esc(f.titulo) + '</b></p>' +
      '<p style="margin:0 0 8px">Marcada, y es la única marcada.</p>' +
      '<p style="margin:0 0 4px"><b>1.</b> ' + (f.ver ? '<button type="button" id="sfVer">📄 Abrir el documento</button> léelo y pulsa <b>«He leído el documento»</b> en el visor.' : 'Abre el documento en su fila, léelo y pulsa <b>«He leído el documento»</b>.') + '</p>' +
      '<p style="margin:0 0 4px"><b>2.</b> <button type="button" id="sfFirmar" style="background:#4a2a78;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer">✍ Firmar</button> y en AutoFirma elige tu certificado y pon el PIN.</p>' +
      '<p style="margin:8px 0 0;font-size:12px;color:#5a6676">Si el Portafirmas dice que no has leído el documento, ábrelo y pulsa «He leído» antes de firmar.</p>' + barraVarias());
    conVarias();
    if (document.getElementById('sfVer')) document.getElementById('sfVer').onclick = function () { f.ver.click(); };
    document.getElementById('sfFirmar').onclick = function () {
      if (!f.chk.checked) f.chk.click();
      window.name = '';   // ya no hace falta recordar el asunto
      document.getElementById('botPtfrFirmar').click();
    };
  }
  if (casan.length === 1) return preparar(casan[0]);
  if (casan.length > 1) return elegir(casan, 'Hay <b>' + casan.length + '</b> peticiones con ese asunto. Elige cuál vas a firmar:');
  elegir(filas, (asunto ? 'No encuentro «' + esc(asunto.slice(0, 80)) + '» en tus pendientes. ' : '') + 'Elige la petición que vas a firmar, o márcalas todas abajo:');
})();
