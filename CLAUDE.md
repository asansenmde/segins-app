# Instrucciones para Claude

Este repositorio contiene **proyectos independientes**, cada uno en su carpeta. No se comparten código ni datos
entre ellos (salvo la librería de Word de SEGINS, que Tareas NLT carga desde `../js/lib/` en GitHub Pages).

| Etiqueta | Carpeta | Proyecto | Dónde se usa |
|---|---|---|---|
| `[SEGINS]` | raíz (`index.html`, `js/`, `css/`…) | Evaluación de seguridad de instalaciones (PWA) | GitHub Pages / móvil |
| `[NLT]` | `tareas/` | Tareas NLT, gestor personal de tareas con fecha límite | claude.ai (artefacto) y GitHub Pages |
| `[COLABORA]` | `colabora/` | Tareas Colabora, lista «Gestor de Tareas» del SharePoint interno | Se sube a Colabora y se abre allí |
| `[MENSADEF]` | `mensadef/` | Visor de mensajes de MENSADEF | Marcador del navegador en `mensadef.mdef.es` |

Las páginas nuevas de SharePoint van en **su propia carpeta** (por ejemplo `incidentes/`), con su README y su
etiqueta añadida a esta tabla y a `PROYECTOS.md`.

## Reglas

- **Toca solo la carpeta del proyecto que indique el usuario** (por la etiqueta, el nombre o el archivo). Si no
  queda claro a qué proyecto se refiere, pregunta antes de cambiar nada.
- Un cambio en un proyecto no arrastra cambios en otro. Si algo se reutiliza (p. ej. `fechas.js`), se copia.
- El usuario escribe en español; responde, comenta el código y escribe los commits en español.
- Commits con prefijo de proyecto: `NLT: …`, `Colabora: …`, `MENSADEF: …`, `SEGINS: …`.

## Páginas para SharePoint (COLABORA, MENSADEF y las nuevas)

- HTML en un solo archivo, sin librerías ni recursos de internet: los datos no salen del servidor.
- REST de SharePoint con `credentials: 'same-origin'`; primero `odata=nometadata` y, si responde 400/406/415,
  `odata=verbose` (SharePoint 2013). Seguir la paginación (`odata.nextLink` / `__next`).
- **Solo GET** salvo que el usuario pida escribir; si escribe, FormDigest de `/_api/contextinfo` y respetar
  permisos (403 = sin permiso).
- Colabora ejecuta páginas `.html` subidas a una biblioteca. MENSADEF no (las descarga): allí se usan
  marcadores generados con `mensadef/generar-marcador.py`, que hay que regenerar si cambia la página.
- Escapar siempre lo que viene del servidor; los campos de texto enriquecido se muestran como texto.
- Requiere Edge o Chrome; avisar si se abre en modo Internet Explorer.
- Probar con Playwright contra un SharePoint simulado (formato ligero y *verbose*) antes de entregar.
- **Nunca pedir al usuario que pegue contenido** (asuntos, textos, nombres de personas): solo estructura
  (nombres de listas y columnas, recuentos). Para descubrir la estructura están las páginas de diagnóstico
  `colabora/prueba-sharepoint.html` y `mensadef/prueba-mensadef.html` (marcador «Prueba MENSADEF»).
