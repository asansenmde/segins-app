# Instrucciones para Claude

Este repositorio contiene **proyectos independientes**, cada uno en su carpeta. No se comparten código ni datos
entre ellos (salvo la librería de Word de SEGINS, que Tareas NLT carga desde `../js/lib/` en GitHub Pages).

| Etiqueta | Carpeta | Proyecto | Dónde se usa |
|---|---|---|---|
| `[SEGINS]` | raíz (`index.html`, `js/`, `css/`…) | Evaluación de seguridad de instalaciones (PWA) | GitHub Pages / móvil |
| `[NLT]` | `tareas/` | Tareas NLT, gestor personal de tareas con fecha límite | claude.ai (artefacto) y GitHub Pages |
| `[COLABORA]` | `colabora/` | Tareas Colabora, lista «Gestor de Tareas» del SharePoint interno | Se sube a Colabora y se abre allí |
| `[MENSADEF]` | `mensadef/` | Visor de mensajes de MENSADEF | Marcador del navegador en `mensadef.mdef.es` |
| `[PERMISOS]` | `permisos/` | Solicitud, aprobación y autorización de permisos (lista «Solicitud de Permisos», CALIDAD-VIDA) | Se sube a Colabora y se abre allí |
| `[INCIDENTES]` | `incidentes/` | Incidentes de seguridad (sitio `/et/jige/colaborativo`, página «INCIDENTES DE SEGURIDAD») | Se sube a Colabora y se abre allí |
| `[VSA]` | `vsa/` | Cuestionario de calidad VSA (lista «CUESTIONARIO DE CALIDAD VSA», mismo sitio que Incidentes) | Se sube a Colabora y se abre allí |
| `[PERDIDAS]` | `perdidas/` | Pérdida de documentación (lista «PERDIDA DOCUMENTACION», mismo sitio que Incidentes) | Se sube a Colabora y se abre allí |
| `[CUADRANTE]` | `cuadrante/` | Cuadrante de servicios de oficiales y suboficiales (sitio JSUIGE; en diseño) | Se sube a Colabora y se abre allí |
| `[SUIGESUR]` | `suigesur/` | Centro de Control NLT: obligaciones, entregas y cumplimiento de las unidades (sitio JSUIGE) | Se sube a Colabora y se abre allí |
| `[CECONSEG]` | `ceconseg/` | Partes de operadores CECONSEG: HPS, certificados y compromisos (sitio de IGE, como Incidentes) | Se sube a Colabora y se abre allí |

Las páginas nuevas de SharePoint van en **su propia carpeta** (por ejemplo `incidentes/`), con su README y su
etiqueta añadida a esta tabla y a `PROYECTOS.md`.

## Reglas

- **Toca solo la carpeta del proyecto que indique el usuario** (por la etiqueta, el nombre o el archivo). Si no
  queda claro a qué proyecto se refiere, pregunta antes de cambiar nada.
- Un cambio en un proyecto no arrastra cambios en otro. Si algo se reutiliza (p. ej. `fechas.js`), se copia.
- El usuario escribe en español; responde, comenta el código y escribe los commits en español.
- Commits con prefijo de proyecto: `NLT: …`, `Colabora: …`, `MENSADEF: …`, `SEGINS: …`, `PERMISOS: …`, `INCIDENTES: …`, `VSA: …`, `PERDIDAS: …`, `CUADRANTE: …`, `SUIGESUR: …`, `CECONSEG: …`.

## Páginas para SharePoint (COLABORA, MENSADEF y las nuevas)

### Lista de comprobación antes de entregar una página nueva o copiada de otra (lecciones, 25/11/2026)

El usuario no quiere repetir errores ya resueltos. Antes de dar por buena una página, comprobar **todo** esto sin que lo pida:

1. **Al copiar de otra aplicación (p. ej. Incidentes):** buscar con `grep -i` el nombre de la aplicación de origen en todo el
   HTML (cabeceras y asuntos de correo, títulos de impresión, textos de ayuda, descripciones de listas) y cambiarlo. La
   prueba simulada comprueba que ningún correo ni informe lleva el nombre de la otra aplicación.
2. **Nombres internos de columnas:** nunca con forma de celda de Excel (`MN1`, `AB12`: letras + números al final).
   SharePoint los guarda como `_x004d_N1` y la página «no encuentra» la columna. Usar p. ej. `NOMBRE1N`. El simulador
   codifica esos nombres como SharePoint.
3. **Columnas nuevas:** crearlas con `Options: 24` (añadir a la vista predeterminada) y con «Crearlas» que **solo añade las
   que faltan** si la lista ya existe (nunca «Falta la lista» cuando lo que falla es una columna). Probar el paso de la
   versión anterior a la nueva en la simulación.
4. **Usar lo que ya existe en el sitio** antes de crear nada: listas M1N/M2N/M3N, grupos `SEGURIDAD_…`, responsables de
   Incidentes (con los propios de la aplicación por encima), lista común de solicitudes de acceso. Explicar al usuario qué
   lista nueva hace falta y por qué.
5. **Unidades obligadas:** si una aplicación marca unidades obligadas, el formulario solo ofrece esas (y sus mandos).
6. **Paridad con Incidentes** en toda página de partes: correos con envío robusto a cuentas, control de acceso con
   solicitud, ficha e informe detallado imprimibles / PDF con gráficos, CSV, estadísticas, control de entregas.
7. **Variables usadas al cargar:** no usar en la inicialización constantes declaradas más abajo (`var` aún sin valor).
8. **Ocultar biblioteca y listas** (probado en Colabora, 25/11/2026): toda aplicación nueva trae en Accesos › Preparación
   «Ocultar la biblioteca» y «📋 Listas de la aplicación» con Ocultar / Mostrar (cada una y todas) y enlace «abrir»
   (bloque `vistaListasPropias` / `ocultarListasPropias`, copiarlo de `ceconseg/ceconseg.html`; receta en `SHAREPOINT.md`).
9. **DIACU propio de cada aplicación** (25/11/2026): grupo `DIACU_<APLICACIÓN>` (DIACU_INCIDENTES, DIACU_VSA, DIACU_PERDIDAS,
   DIACU_CECONSEG…). Si existe, solo sus miembros son DIACU en esa aplicación y reciben sus avisos; si no, DIACU es
   SEGURIDAD_IGE. Se crea desde Accesos › Preparación (con «Colaborar» en la lista) y la solicitud tiene el papel «DIACU»
   aparte de «IGE». Bloque `leerGrupoDiacu` / `lineaDiacu` / `crearGrupoDiacu`, copiarlo de `ceconseg/ceconseg.html`.
10. Entregar siempre: simulación ligero + *verbose* + copia cifrada con `PROXY=1`, README, PENDIENTES, commit, push y la
   copia cifrada al usuario. Respuestas breves.

Antes de hacer una nueva, lee **`SHAREPOINT.md`**: recetas probadas (lectura, alta, modificar sin pisar cambios,
buscar personas en el directorio, correo desde el servidor, comentarios con historial) y las pruebas simuladas
de cada proyecto (`*/pruebas/`).


- **Control de acceso con solicitud en toda página nueva** (Permisos, registros, SIPERDEF…): copiar el de VSA
  (receta en `SHAREPOINT.md`, «Control de acceso con solicitud»).
- **Firma electrónica con AutoFirma** cuando una página tenga que firmar documentos: copiar la de VSA (receta en
  `SHAREPOINT.md`, «Firma electrónica con AutoFirma»; la librería oficial va pegada en el HTML).
- **Autoría y copia protegida** en todas las páginas de Colabora (© 2026 Cte. Alfredo Sánchez Sender; original legible
  en el repositorio y copia ofuscada con bloqueo de dominio para subir; receta en `SHAREPOINT.md`). Entregar siempre los
  dos archivos, indicando cuál se sube a Colabora.
- **La copia que se sube va cifrada entera** (petición del usuario, 13/11/2026): textos, nombres de campos y expresiones
  regulares incluidos (`stringArrayThreshold: 1`, claves de objeto y `/…/` pasados a texto antes de ofuscar), y con las
  etiquetas `</head>`… escritas `\x3c` para que el filtro de la red no parta el programa. Receta en `incidentes/proteger/proteger.mjs`.
  Comprobar antes de entregar que no se lee ningún nombre de lista, grupo ni mensaje, y probar con `PROXY=1`.
- **Modelo obligatorio en TODAS las aplicaciones de Colabora** (petición del usuario, 17/11/2026): control de acceso con
  solicitud (lista común «SOLICITUDES ACCESO APLICACIONES», nunca la interna «Solicitudes de acceso»; aviso a la dirección
  fija `asansen@et.mde.es` y enlace a la alerta de SharePoint), Ajustes y Accesos solo con Control total, copia cifrada
  entera y **correo a la CUENTA de cada persona, no a su dirección** (Colabora rechaza las direcciones; `aCuentas` en
  `SHAREPOINT.md`, «Envío robusto»). Modelo actual: `incidentes/incidentes.html` y `colabora/tareas-nlt-colabora.html`.
- **Correo con envío robusto** en toda página que avise por correo: copiar el de Permisos (receta en `SHAREPOINT.md`,
  «Envío robusto»). Colabora rechaza el correo entero si falla una dirección y la gente tiene cuentas antiguas sin buzón;
  hay que reintentar uno a uno, por su cuenta y por su nombre, decir a quién no llegó y anotarlo en el historial.
- **Pendientes del usuario en `PENDIENTES.md`**: revisarlo al empezar y actualizarlo al terminar cada punto.
- HTML en un solo archivo, sin librerías ni recursos de internet: los datos no salen del servidor.
- REST de SharePoint con `credentials: 'same-origin'`; primero `odata=nometadata` y, si responde 400/406/415,
  `odata=verbose` (SharePoint 2013). Seguir la paginación (`odata.nextLink` / `__next`).
- **Solo GET** salvo que el usuario pida escribir; si escribe, FormDigest de `/_api/contextinfo` y respetar
  permisos (403 = sin permiso).
- Colabora ejecuta páginas `.html` subidas a una biblioteca. MENSADEF no (las descarga): allí se usan
  marcadores generados con `mensadef/generar-marcador.py`, que hay que regenerar si cambia la página.
- **Los campos «Buscar» buscan en todos los campos** de cada elemento (los que se muestran y los de la ficha), sin
  tildes ni mayúsculas. Los datos personales que no se descargan (NIF, nombres) se buscan preguntando al servidor solo
  por los números de los elementos (`$select=Id&$filter=substringof(…)`), como en Pérdidas. Petición del usuario, 05/11/2026.
- Escapar siempre lo que viene del servidor; los campos de texto enriquecido se muestran como texto.
- Requiere Edge o Chrome; avisar si se abre en modo Internet Explorer.
- Probar con Playwright contra un SharePoint simulado (formato ligero y *verbose*) antes de entregar.
- **Nunca pedir al usuario que pegue contenido** (asuntos, textos, nombres de personas): solo estructura
  (nombres de listas y columnas, recuentos). Para descubrir la estructura están las páginas de diagnóstico
  `colabora/prueba-sharepoint.html` y `mensadef/prueba-mensadef.html` (marcador «Prueba MENSADEF»).
