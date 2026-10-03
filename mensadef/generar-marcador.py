#!/usr/bin/env python3
"""Genera los marcadores de MENSADEF a partir de sus páginas.

- marcador-mensadef.html       ← prueba-mensadef.html (diagnóstico)
- marcador-visor-mensadef.html ← visor-mensadef.html (visor de mensajes)

Cada marcador (favorito «javascript:») sustituye la página de MENSADEF que está abierta por la
página correspondiente, en el mismo servidor y con la misma sesión, así que no depende de que
MENSADEF ejecute archivos subidos. Volver a ejecutar este script cada vez que cambie una página.
"""
import html
import json
import pathlib
import urllib.parse

aqui = pathlib.Path(__file__).parent

PLANTILLA = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marcador {nombre}</title>
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
  <h1>{titulo}</h1>
  <p>{intro}</p>

  <div class="card">
    <p><b>1. Guarda este botón en tus favoritos</b></p>
    <p><a class="marcador" id="marcador" href="{marcador}">{nombre}</a></p>
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
{uso}
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
'''


def generar(fuente, salida, nombre, titulo, intro, pasos):
    pagina = (aqui / fuente).read_text(encoding='utf-8')
    codigo = '(function(){var h=' + json.dumps(pagina) + ';document.open();document.write(h);document.close();})()'
    marcador = 'javascript:' + urllib.parse.quote(codigo, safe='')
    uso = '\n'.join('      <li>' + p + '</li>' for p in pasos)
    (aqui / salida).write_text(PLANTILLA.format(nombre=nombre, titulo=titulo, intro=intro, uso=uso,
                                                marcador=html.escape(marcador, quote=True)), encoding='utf-8')
    print(salida + ':', len(marcador), 'caracteres de marcador')


generar('prueba-mensadef.html', 'marcador-mensadef.html', 'Prueba MENSADEF', 'Prueba de MENSADEF con un marcador',
        'MENSADEF descarga los archivos en vez de abrirlos, así que la prueba se lanza con un <b>favorito especial</b> '
        'sobre la propia página de MENSADEF. Solo <b>lee</b>, con tu sesión, cómo está organizado el sitio; no modifica '
        'nada ni envía nada fuera del servidor.',
        ['Abre MENSADEF (la portada de tu ámbito o una carpeta).',
         'Pulsa el favorito <b>Prueba MENSADEF</b>.',
         'La página se sustituye por la de diagnóstico. Para volver, recarga (F5).'])

generar('visor-mensadef.html', 'marcador-visor-mensadef.html', 'Mensajes MENSADEF', 'Visor de mensajes de MENSADEF',
        'Un <b>favorito especial</b> que convierte la página de MENSADEF en un visor de tus mensajes: búsqueda, filtros por '
        'tipo, estado, canal, órgano y autoridad, detalle con texto, adjuntos y documentos, y exportación a CSV. Solo '
        '<b>lee</b>, con tu sesión y tus permisos; no modifica nada ni envía nada fuera de MENSADEF.',
        ['Abre la portada de tu ámbito de MENSADEF (por ejemplo, Segunda SUIGE).',
         'Pulsa el favorito <b>Mensajes MENSADEF</b>.',
         'Elige el periodo (por defecto, los últimos 3 días) y usa la búsqueda y los filtros. Pulsa un mensaje para ver el detalle.',
         'Para volver a MENSADEF normal, recarga (F5).'])
