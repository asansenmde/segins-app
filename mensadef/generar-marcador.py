#!/usr/bin/env python3
"""Genera los marcadores de MENSADEF a partir de sus páginas.

- marcador-mensadef.html       ← prueba-mensadef.html (diagnóstico)
- marcador-visor-mensadef.html ← visor-mensadef.html (visor de mensajes)

Cada marcador (favorito «javascript:») sustituye la página de MENSADEF que está abierta por la
página correspondiente, en el mismo servidor y con la misma sesión, así que no depende de que
MENSADEF ejecute archivos subidos. Volver a ejecutar este script cada vez que cambie una página.

Con --pruebas solo genera la copia de pruebas del visor (marcador-visor-mensadef-pruebas.html, favorito
«SENDERO (pruebas)», con PRUEBAS = true) y no toca los marcadores buenos.
"""
import datetime
import html
import json
import pathlib
import sys
import urllib.parse

aqui = pathlib.Path(__file__).parent

# 15/11/2026: control de distribución de SENDERO. Quién puede usarlo lo dice la lista «SENDERO Autorizados» de Colabora, que
# lee la página acceso/SENDERO-acceso.html subida a URL_ACCESO (la copia protegida acceso/subir/SENDERO-acceso.html).
# La caducidad de cada versión (30, 60, 90 días o indefinida) la elige el Cte. en esa página (pestaña «Versión vigente»).
# 16/11/2026: en JSUIGE, junto a META y SENDERO (en colaborativo no entra todo el mundo)
URL_ACCESO = 'https://colabora.mdef.es/et/SUIGESUR/JSUIGE/aplicaciones/SENDERO-acceso.html'


def proteger(entrada, salida, ligero=False, mensaje=''):
    import os, subprocess
    env = dict(os.environ)
    if ligero:
        env['LIGERO'] = '1'
    if mensaje:
        env['MENSAJE'] = mensaje
    r = subprocess.run(['node', str(aqui / 'proteger' / 'proteger.mjs'), str(entrada), str(salida)], capture_output=True, text=True, env=env)
    if r.returncode:
        sys.exit('No se pudo proteger ' + str(entrada) + ' (¿falta «cd mensadef/proteger && npm install»?):\n' + r.stderr[-800:])


def generar_acceso():
    sal = aqui / 'acceso' / 'subir'
    sal.mkdir(exist_ok=True)
    proteger(aqui / 'acceso' / 'SENDERO-acceso.html', sal / 'SENDERO-acceso.html', ligero=True,
             mensaje='Esta página solo funciona en Colabora (mdef.es).')
    print('acceso/subir/SENDERO-acceso.html: copia protegida para subir a Colabora')


PLANTILLA = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="Cte. Alfredo Sánchez Sender">
<meta name="copyright" content="© 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.">
<title>Marcador {nombre}</title>
<style>
  body {{ font-family: system-ui, "Segoe UI", sans-serif; background: #f5f6f2; color: #1f2a1c; margin: 0; }}
  main {{ max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.5; }}
  .card {{ background: #fff; border: 1px solid #d9ddd2; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .marcador {{ display: inline-block; background: #3a4a2c; color: #fff; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; cursor: grab; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #3a4a2c; background: #fff; cursor: pointer; }}
  ol li {{ margin: 6px 0; }}
  .muted {{ color: #5b6655; font-size: .92em; }}
  .cab {{ background: linear-gradient(90deg, #1c2615, #3a4a2c 55%, #56693f); color: #fff; border-bottom: 4px solid #c9a84c; padding: 12px 16px; }}
  .cab div {{ max-width: 720px; margin: 0 auto; }}
  .cab b {{ font-size: 1.1rem; letter-spacing: .05em; }}
  .cab span {{ display: block; font-size: .74rem; letter-spacing: .12em; text-transform: uppercase; color: #e6d9a8; }}
  .ver {{ display: inline-block; margin-left: 10px; background: #efc000; color: #12315a; font-weight: 800; padding: 2px 10px; border-radius: 999px; font-size: .85rem; }}
  .vercaja {{ background: #fff8d6; border: 1px solid #e3c766; border-radius: 10px; padding: 10px 14px; font-size: 1.05rem; }}
  .autor {{ text-align: center; font-size: .8rem; color: #5b6655; border-top: 1px solid #d9ddd2; padding: 12px 16px 24px; }}
</style>
</head>
<body>
<div class="cab"><div><b>{nombre}</b>{version_cab}<span>Desarrollado por el Cte. Alfredo Sánchez Sender</span></div></div>
<main>
  <h1>{titulo}</h1>
  {version_txt}
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
<footer class="autor">© 2026 · Diseñado y desarrollado por el <b>Cte. Alfredo Sánchez Sender</b> · Todos los derechos reservados</footer>
<script>
  document.getElementById('marcador').addEventListener('click', function (e) {{
    if (location.hostname !== 'mensadef.mdef.es') {{ e.preventDefault(); alert('Arrástralo a la barra de favoritos y púlsalo en la página donde se usa (MENSADEF o el Portafirmas).'); }}
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


def version_de(pagina):
    import re
    m = re.search(r"var VERSION = '([^']+)';", pagina)
    return m.group(1) if m else ''


def textos_version(v):
    # 16/11/2026: la versión, bien visible en las instrucciones (es la que se anota en «Versión vigente» de la página de acceso)
    if not v:
        return {'version_cab': '', 'version_txt': ''}
    return {'version_cab': '<em class="ver">Versión ' + html.escape(v) + '</em>',
            'version_txt': '<p class="vercaja">Versión de este favorito: <b>' + html.escape(v) + '</b></p>'}


def generar(fuente, salida, nombre, titulo, intro, pasos, pruebas=False):
    pagina = (aqui / fuente).read_text(encoding='utf-8')
    tv = textos_version(version_de(pagina))
    if fuente.endswith('.js'):
        # Marcador que actúa sobre la página abierta sin sustituirla (p. ej. escuchar-mensadef.js)
        codigo = pagina
        marcador = 'javascript:' + urllib.parse.quote(codigo, safe='')
        uso = '\n'.join('      <li>' + p + '</li>' for p in pasos)
        (aqui / salida).write_text(PLANTILLA.format(nombre=nombre, titulo=titulo, intro=intro, uso=uso, **tv,
                                                    marcador=html.escape(marcador, quote=True)), encoding='utf-8')
        print(salida + ':', len(marcador), 'caracteres de marcador')
        return
    if pruebas:
        assert 'var PRUEBAS = false;' in pagina, 'No encuentro «var PRUEBAS = false;» en ' + fuente
        pagina = pagina.replace('var PRUEBAS = false;', 'var PRUEBAS = true;')
    if fuente == 'visor-mensadef.html':
        # Control de acceso en Colabora y caducidad (15/11/2026)
        # (16/11/2026) la caducidad (30, 60, 90 días o indefinida) la elige el Cte. en Colabora; cuenta desde hoy
        assert 'var URL_ACCESO = null;' in pagina and 'var GENERADO = null;' in pagina
        hoy = datetime.date.today().isoformat()
        pagina = pagina.replace('var URL_ACCESO = null;', 'var URL_ACCESO = ' + json.dumps(URL_ACCESO) + ';')
        pagina = pagina.replace('var GENERADO = null;', 'var GENERADO = ' + json.dumps(hoy) + ';')
        print(salida + ': acceso en ' + URL_ACCESO + ', generado el ' + hoy)
        # El visor va protegido (compactado, con bloqueo a *.mdef.es): proteger/proteger.mjs (npm install la primera vez)
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            ent, sal = pathlib.Path(d) / 'entrada.html', pathlib.Path(d) / 'salida.html'
            ent.write_text(pagina, encoding='utf-8')
            proteger(ent, sal)
            pagina = sal.read_text(encoding='utf-8')
    # Fuera de MENSADEF (otra web, Colabora, Outlook…) el favorito no puede leer nada: lleva a la portada de MENSADEF, donde
    # basta con pulsarlo otra vez (10/11/2026)
    # 19/11/2026: en el Portafirmas el mismo favorito SENDERO hace lo de «Firmar con SENDERO» (un solo favorito, a petición del usuario)
    firmar = (aqui / 'firmar-portafirmas.js').read_text(encoding='utf-8')
    ir = "if(/(^|\\.)portafirmas\\.mdef\\.es$/i.test(location.hostname)){" + firmar + "return;}" + \
         "if(!/^mensadef\\.mdef\\.es$/i.test(location.hostname)){location.href='https://mensadef.mdef.es/SitePages/Landing.aspx#/';return;}"
    codigo = '(function(){' + (ir if fuente == 'visor-mensadef.html' else '') + 'var h=' + json.dumps(pagina) + ';document.open();document.write(h);document.close();})()'
    marcador = 'javascript:' + urllib.parse.quote(codigo, safe='')
    uso = '\n'.join('      <li>' + p + '</li>' for p in pasos)
    (aqui / salida).write_text(PLANTILLA.format(nombre=nombre, titulo=titulo, intro=intro, uso=uso, **tv,
                                                marcador=html.escape(marcador, quote=True)), encoding='utf-8')
    print(salida + ':', len(marcador), 'caracteres de marcador')


ESCUCHAR = ('escuchar-mensadef.js', 'marcador-escuchar-mensadef.html', 'Escuchar MENSADEF', 'Escuchar MENSADEF (diagnóstico)',
            'Un <b>favorito de diagnóstico</b> que, sin cambiar la página de MENSADEF, anota qué consultas hace la aplicación al '
            'enseñarte tu célula y tu bandeja: rutas, nombres de campos y número de elementos, <b>nunca sus valores</b>. Sirve '
            'para saber de dónde saca MENSADEF tus mensajes y adaptar el visor. No envía nada a ningún sitio.',
            ['Abre MENSADEF (la portada de tu ámbito) y espera a que cargue.',
             'Pulsa el favorito <b>Escuchar MENSADEF</b>: sale un recuadro con borde rojo abajo a la derecha.',
             'Ahora, sin recargar, entra en tu célula y abre tu <b>bandeja de mensajes</b>; cambia de célula o de carpeta para '
             'que se vuelvan a cargar.',
             'Para los <b>anexos</b> (versión 6): abre un mensaje que tenga anexo (📎) y pulsa el anexo para verlo o '
             'descargarlo, como haces normalmente. Se anota solo cómo lo pide (ruta, nombres de los campos, tipo de archivo), nunca '
             'el nombre ni el contenido del anexo.',
             'Cuando hayas terminado, pulsa <b>Copiar</b> en el recuadro y pégalo en la conversación.',
             'Para quitarlo, recarga la página (F5).'])

EXPLORAR_PF = ('explorar-portafirmas.js', 'marcador-explorar-portafirmas.html', 'Explorar Portafirmas', 'Explorar Portafirmas (diagnóstico)',
               'Un <b>favorito de diagnóstico</b> para <b>portafirmas.mdef.es</b>: anota cómo está hecha la página (rutas, nombres de '
               'parámetros, formularios, botones, cabeceras de tablas y cómo se llama a AutoFirma), <b>nunca su contenido</b>: ni asuntos, '
               'ni nombres, ni números. Sirve para que SENDERO pueda llevarte a la petición lista para firmar. No envía nada a ningún sitio.',
               ['Entra en el Portafirmas e identifícate como siempre.',
                'Ve a la lista de peticiones <b>pendientes</b> y pulsa el favorito <b>Explorar Portafirmas</b>: sale un recuadro con borde rojo abajo a la derecha.',
                'Abre una petición, márcala y pulsa <b>Firmar</b>. Cuando salga AutoFirma, <b>cancela</b> (no hace falta firmar).',
                'Si la página cambia, pulsa otra vez el favorito: conserva lo anotado.',
                'Pulsa <b>Copiar</b> en el recuadro y pégalo en la conversación. Para quitarlo, recarga (F5).'])

generar_acceso()

# 19/11/2026: «Firmar con SENDERO» va dentro del favorito SENDERO (en el Portafirmas); ya no hay favorito aparte

if '--pruebas' in sys.argv:
    generar(*ESCUCHAR)
    generar(*EXPLORAR_PF)
    generar('visor-mensadef.html', 'marcador-visor-mensadef-pruebas.html', 'SENDERO (pruebas)',
            'SENDERO · Visor de mensajes de MENSADEF · VERSIÓN DE PRUEBAS',
            'Copia de pruebas de SENDERO, para probar las novedades sin tocar el favorito bueno. Lleva una banda roja, '
            'guarda su memoria aparte y solo admite la página de Tareas de pruebas (<i>tareas-nlt-colabora-pruebas.html</i>).',
            ['Pulsa el favorito <b>SENDERO (pruebas)</b>. Si no estás en MENSADEF, te lleva a su portada: pulsa el favorito otra vez.',
             'Entra solo en tu ámbito y carga tus bandejas (si no puede, pulsa <b>🔑 Entrar en mi ámbito</b>).',
             'Abre un mensaje y pulsa <b>➜ Añadir tarea en META</b>. La primera vez pega la dirección de '
             '<i>tareas-nlt-colabora-pruebas.html</i> en Colabora.',
             'Para volver a MENSADEF normal, recarga (F5).'], pruebas=True)
    sys.exit()

generar('prueba-mensadef.html', 'marcador-mensadef.html', 'Prueba MENSADEF', 'Prueba de MENSADEF con un marcador',
        'MENSADEF descarga los archivos en vez de abrirlos, así que la prueba se lanza con un <b>favorito especial</b> '
        'sobre la propia página de MENSADEF. Solo <b>lee</b>, con tu sesión, cómo está organizado el sitio; no modifica '
        'nada ni envía nada fuera del servidor.',
        ['Abre MENSADEF (la portada de tu ámbito o una carpeta).',
         'Pulsa el favorito <b>Prueba MENSADEF</b>.',
         'La página se sustituye por la de diagnóstico. Para volver, recarga (F5).'])

generar('visor-mensadef.html', 'marcador-visor-mensadef.html', 'SENDERO', 'SENDERO · Visor de mensajes de MENSADEF',
        'Un <b>favorito</b> que abre tus bandejas de MENSADEF en una sola pantalla (cada uno ve las de <b>sus células</b>, '
        'con su propia sesión): entrada y salida, búsqueda y filtros, ficha con los datos, destinatarios, anexos y el texto, '
        'banderas y comentarios, leído y «visto», paso a rúbrica, informes para imprimir, PDF o Word y '
        '<b>➜ Añadir tarea en META</b> con el negociado y el responsable. Entra solo en tu ámbito desde la portada de MENSADEF.',
        ['Pulsa el favorito <b>SENDERO</b>. Si no estás en MENSADEF, te lleva a su portada: pulsa <b>SENDERO</b> otra vez. '
         '(Para ahorrarte este paso, pon la portada de MENSADEF como página de inicio de Edge.)',
         'SENDERO entra solo en tu ámbito, sin que tengas que pulsar «Iniciar sesión», y carga tus bandejas. Si no lo '
         'consigue, pulsa <b>🔑 Entrar en mi ámbito</b> e inicia sesión en la ventana pequeña: se cierra sola.',
         'La primera vez puedes elegir qué células se cargan (<b>Células que se cargan…</b>). Con <b>⟳ Actualizar</b> vuelves a '
         'leer MENSADEF sin perder la ficha abierta.',
         'Pulsa un mensaje para ver su ficha (al abrirlo queda leído también en MENSADEF). Con <b>➜ Añadir tarea en META</b> se '
         'abre el Gestor de Tareas con el alta rellena, el negociado y el responsable: la primera vez te pide la dirección '
         'del Gestor y un nombre; puedes guardar varios y elegir en cada mensaje.',
         '<b>✉ Correo</b> (en la ficha): se abre una ventana de Colabora; eliges a quién (Para y CC, buscando por nombre), '
         'añades un comentario si quieres, ves cómo quedará y pulsas <b>Enviar</b>. Lleva el texto completo, los datos, '
         '«Abrir en MENSADEF» y el enlace de cada documento.',
         '<b>✍ Firmar en Rúbrica</b> (en un mensaje ya pasado a rúbrica, pendiente de firma): se abre el Portafirmas en otra '
         'pestaña. Identifícate si te lo pide (perfil <b>Firmante</b>) y, <b>estando en el Portafirmas, pulsa este mismo '
         'favorito SENDERO</b>: abajo a la derecha sale «Firmar con SENDERO» con la petición ya marcada. Pulsa <b>📄 Abrir el '
         'documento</b>, léelo y pulsa «He leído el documento»; después <b>✍ Firmar</b> y, en AutoFirma, tu certificado y PIN.',
         'Para volver a MENSADEF normal, recarga la página (F5).',
         '<b>Para firmar en Rúbrica</b>: en un mensaje pendiente de firma pulsa <b>✍ Firmar en Rúbrica</b>; en el Portafirmas (identificado '
         'como Firmante) pulsa <b>este mismo favorito SENDERO</b>: marca la petición, abres el documento, pulsas «He leído» y '
         '<b>✍ Firmar</b> (AutoFirma te pide el certificado y el PIN).'])

generar(*ESCUCHAR)
