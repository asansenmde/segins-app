#!/usr/bin/env python3
"""Genera marcador-mensadef.html a partir de prueba-mensadef.html.

El marcador (favorito «javascript:») sustituye la página de MENSADEF que está abierta por la de
diagnóstico, en el mismo servidor y con la misma sesión, así que no depende de que MENSADEF
ejecute archivos subidos. Volver a ejecutar este script cada vez que cambie prueba-mensadef.html.
"""
import html
import json
import pathlib
import urllib.parse

aqui = pathlib.Path(__file__).parent
pagina = (aqui / 'prueba-mensadef.html').read_text(encoding='utf-8')
codigo = '(function(){var h=' + json.dumps(pagina) + ';document.open();document.write(h);document.close();})()'
marcador = 'javascript:' + urllib.parse.quote(codigo, safe='')

(aqui / 'marcador-mensadef.html').write_text(f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marcador MENSADEF</title>
<style>
  body {{ font-family: system-ui, "Segoe UI", sans-serif; background: #f5f6f2; color: #1f2a1c; margin: 0; }}
  main {{ max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.5; }}
  .card {{ background: #fff; border: 1px solid #d9ddd2; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .marcador {{ display: inline-block; background: #3a4a2c; color: #fff; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; cursor: grab; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #3a4a2c; background: #fff; cursor: pointer; }}
  ol li {{ margin: 6px 0; }}
  .muted {{ color: #5b6655; font-size: .92em; }}
</style>
</head>
<body>
<main>
  <h1>Prueba de MENSADEF con un marcador</h1>
  <p>MENSADEF descarga los archivos en vez de abrirlos, así que la prueba se lanza con un <b>favorito especial</b>
  sobre la propia página de MENSADEF. Solo <b>lee</b>, con tu sesión, cómo está organizada tu carpeta; no modifica nada
  ni envía nada fuera del servidor.</p>

  <div class="card">
    <p><b>1. Guarda este botón en tus favoritos</b></p>
    <p><a class="marcador" id="marcador" href="{html.escape(marcador, quote=True)}">Prueba MENSADEF</a></p>
    <ul>
      <li>Muestra la barra de favoritos con <b>Ctrl + Mayús + B</b> y <b>arrastra</b> el botón verde hasta ella.</li>
      <li>Si no te deja arrastrarlo: pulsa <button id="copiar" type="button">Copiar marcador</button>, crea un favorito
        cualquiera (Ctrl + D), edítalo y pega lo copiado en el campo <b>Dirección (URL)</b>.</li>
    </ul>
    <p class="muted">Al pulsarlo aquí no pasa nada útil: hay que pulsarlo estando en MENSADEF.</p>
  </div>

  <div class="card">
    <p><b>2. Úsalo en MENSADEF</b></p>
    <ol>
      <li>Abre tu carpeta de mensajes en MENSADEF, como siempre.</li>
      <li>Con la carpeta en pantalla, pulsa el favorito <b>Prueba MENSADEF</b>.</li>
      <li>La página se sustituye por la de diagnóstico, que analiza esa carpeta. Para volver, recarga (F5).</li>
    </ol>
  </div>
</main>
<script>
  document.getElementById('marcador').addEventListener('click', function (e) {{
    if (location.hostname !== 'mensadef.mdef.es') {{ e.preventDefault(); alert('Arrástralo a la barra de favoritos y púlsalo estando en MENSADEF.'); }}
  }});
  document.getElementById('copiar').addEventListener('click', function () {{
    var b = this, t = document.getElementById('marcador').getAttribute('href');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {{ b.textContent = 'Copiado ✓'; }},
      function () {{ prompt('Copia este texto (Ctrl + C):', t); }});
  }});
</script>
</body>
</html>
''', encoding='utf-8')
print('marcador-mensadef.html:', len(marcador), 'caracteres de marcador')
