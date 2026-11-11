# MENSADEF · Visor de mensajes

> Proyecto independiente de SEGINS (raíz del repositorio), de la app personal [Tareas NLT](../tareas/) y de
> [Tareas Colabora](../colabora/).

Herramientas para consultar los mensajes de **MENSADEF** (`mensadef.mdef.es/ambito/2SUIGE`) desde el propio
navegador, con la sesión y los permisos del usuario. Solo leen (peticiones GET): no modifican nada ni envían
nada fuera de MENSADEF.

## Cómo se usan: marcadores

MENSADEF descarga los archivos subidos (`.html`, `.aspx`) en vez de abrirlos, así que las páginas se lanzan con
un **marcador** (favorito `javascript:`) que sustituye la página de MENSADEF abierta por la de la herramienta,
en el mismo servidor. Para instalarlo se abre el `marcador-….html` correspondiente en el ordenador y se arrastra
su botón a la barra de favoritos.

`generar-marcador.py` genera los marcadores a partir de las páginas. **Hay que volver a ejecutarlo cada vez
que cambie una página** (y el usuario tiene que volver a arrastrar el favorito).

## Archivos

- `visor-mensadef.html` (marcador: `marcador-visor-mensadef.html`, favorito «Mensajes MENSADEF»): visor de
  mensajes. Lee las listas diarias `SMDMDMensajes_AAAAMMDD` del periodo elegido (y, opcionalmente, las históricas
  `SMDMDMensajes2026…`), con búsqueda, filtros (tipo, estado, canal, órgano, autoridad, con adjuntos), orden por
  columnas, detalle con el texto (se pide al abrir cada mensaje), adjuntos, documentos de `MensajeUrlCarpeta`,
  enlace a la ficha en MENSADEF, «Copiar para Gestor de Tareas» y exportación a CSV.
  **«➜ Crear tarea en Colabora»** abre Tareas Colabora con el alta rellena (asunto, expediente, referencias,
  autoridad, enlace y texto del mensaje). Los datos van en el fragmento de la dirección (`#importar=…`), que no se
  envía a ningún servidor. La primera vez pide la dirección de la página de Colabora. Los mensajes ya pasados se
  marcan con «➜ Tarea». Ver [`SINCRONIZACION.md`](../SINCRONIZACION.md).
  **De momento solo en la copia de pruebas**: `marcador-visor-mensadef-pruebas.html` (favorito «Mensajes MENSADEF
  (pruebas)», `python3 generar-marcador.py --pruebas`), con banda roja, memoria aparte y que solo admite la página de
  Tareas de pruebas. El favorito bueno (`marcador-visor-mensadef.html`) no cambia hasta que se dé por buena.
  La copia de pruebas también **busca las listas de mensajes fuera de la página** desde la que se pulsa (p. ej.
  `SitePages/ambito.aspx#/celula/…`): en el sitio (incluidas las listas ocultas) y, si no hay, en el del ámbito, el raíz y
  sus subsitios (2 niveles, hasta 60). Si no las encuentra, dice qué sitios ha revisado (rutas y nº de listas).
  Pruebas: `CELULA=1` (mensajes en un subsitio) y `NADA=1` (sin mensajes) en `pruebas/visor.mjs`.
  Además (28/10/2026, solo pruebas): lee **todos los sitios con mensajes a los que tiene acceso el usuario** (no se para en
  el primero; también los de otras colecciones con la búsqueda de SharePoint), con filtro «Negociado / sitio»; lee **todas
  las columnas propias de MENSADEF** de cada lista (no solo las conocidas), las muestra en el detalle y el CSV y pone un
  filtro por cada una con 2 a 80 valores; «Ocultar borradores» (marcado por defecto); y «Ver estructura» da un resumen sin
  contenido (sitios, listas, columnas y nº de valores distintos) para ajustar el visor.
- `prueba-mensadef.html` (marcador: `marcador-mensadef.html`, favorito «Prueba MENSADEF»): diagnóstico. Indica
  dónde se ejecuta, lista las listas y bibliotecas del sitio (nombre, tipo, recuento) y analiza la que se elija:
  columnas, tipos de contenido, archivos por tipo, meses y columnas rellenas. El resumen para copiar no incluye
  asuntos, nombres de archivo ni contenido. `prueba-mensadef.aspx` es la misma página con otra extensión.

- `escuchar-mensadef.js` (marcador: `marcador-escuchar-mensadef.html`, favorito «Escuchar MENSADEF»): diagnóstico que **no
  sustituye la página**. Anota las consultas que hace la aplicación de MENSADEF (fetch, XMLHttpRequest, `$batch`, búsqueda)
  mientras el usuario abre su célula y su bandeja, y resume su estructura: ruta, nombres de parámetros, campos y
  propiedades, nº de elementos. Nunca guarda valores. Prueba: `node pruebas/escuchar.mjs`.
  (28/10/2026: las listas diarias `SMDMDMensajes_AAAAMMDD` del ámbito solo devuelven borradores con las columnas habituales
  vacías; hay que averiguar de dónde saca la aplicación los mensajes de cada célula.)
  **Hallazgo (28/10/2026):** la bandeja de cada célula la sirve un servicio propio, **`mensadefapi.mdef.es`**:
  `GET /api/buzon/ObtenerBuzonCelula?idCelula&emailUsuario&urlColeccionSitio&indicePagina&tamanoPagina&tipoES&criterioBusqueda&soloPendientes[&filtroEtiquetas]`
  → `{ ListaElementos, ListaAgrupaciones, IndicePagina, TamanoPagina, TotalRegistros }`, y
  `GET /api/usuariovista/UsuarioVistaObtener` (vista del usuario). La escucha ampliada da además los campos de cada
  mensaje, los valores de tipo/página, la consulta de células anterior a la escucha y cómo se identifica el usuario.
  **Visor de pruebas con bandejas** (28/10/2026): si `mensadefapi` responde, el visor lee con la sesión del usuario
  (`credentials: 'include'`, solo GET) `usuario/ConsultaUsuarioDicodefPorCorreo` (correo → idUsuario), `ambito/UsuarioCelulas`
  (`tipoCelula=-1`, más la célula de la dirección) y `buzon/ObtenerBuzonCelula` de cada célula con `tipoES` 1 y 2, en páginas
  de 100 hasta pasar de «Desde» (máx. 20). Los campos se reconocen por su nombre (asunto, fecha, remitente, estado, tipo,
  referencia, adjuntos); el resto se muestran y filtran tal cual. Filtro «Célula / negociado». Si no responde, vuelve a las
  listas. Prueba: `node pruebas/bandejas.mjs` (y `VERBOSE=1`).
  **Células que se cargan**: se piden `tipoCelula=-1` (todas a las que tiene acceso) y `tipoCelula=4` (marcadas ★). Por
  defecto se cargan la célula de la página (`#/celula/…/{id}`), si no las ★, si no todas; el selector «Células que se
  cargan…» permite elegir y se recuerda. El correo y el número de usuario se toman de las consultas que ya hizo la
  aplicación en la página (SharePoint no tiene el correo del usuario), o del contexto, la ficha o el perfil.
  El selector agrupa las células como el perfil de MENSADEF: **OAM**, **Registro** (nombre con «REGISTRO») y **En revisión**
  (nombre con «PORTAFIRMAS»), con un botón por grupo; sin célula en la dirección ni elección guardada se cargan las OAM.
  Ejemplo de célula: `…/SitePages/ambito.aspx#/celula/SETEC%20SEGURIDAD/{id}`.
  **Cabeceras del servicio** (escucha del 28/10/2026): la aplicación llama a `mensadefapi` con `Content-Type: application/json`,
  `passcode` (32 caracteres, no está en la memoria de la página) y `user` (36, dentro de sessionStorage
  `rolesUsuario<ámbito>`); sin ellas, 406. **La clave la da el propio servicio** (análisis del código de la aplicación,
  28/10/2026): una consulta sin clave devuelve en las cabeceras de la respuesta `IdUsuario` (el passcode) y
  `User`. En el real, `MensadefActivo` responde sin clave; se usa `usuario/ValidateUser` tal como la hizo la aplicación en la
  página (del registro del navegador) o, si no está, con la cuenta del usuario (`idUsuario`=cuenta, `useUid` true/false). El visor la pide igual al empezar, la guarda solo en la pestaña (sessionStorage) y,
  si el servicio contesta 406 (caducada), pide otra y repite. Ya no hay que tomarla de la página ni cambiar de célula. Campos reales de la bandeja: `Asunto`, `Cuerpo`, `Fecha`,
  `EstadoMensaje`, `EstadoParaUsuario`, `TipoES` (E/S → Entrada/Salida), `TipoMensaje`, `CodigoPrioridad`, `CelulaRemitente`,
  `CelulaDestinataria`, `NumeroRegistroEntrada/Salida`, `Sref`, `ContieneAnexos`, `Leido`, `Actuacion`…
  **Versión 2026-10-28 · 1 (pruebas)**: autoría (© 2026 Cte. Alfredo Sánchez Sender: aviso en el HTML, meta y pie con la
  versión) y diseño como el Gestor de Tareas: cabecera con el usuario y sus células, tarjetas (mensajes, no leídos,
  entrada, salida, sin revisar, pasados a tarea) que filtran al pulsarlas, píldoras para cambiar de célula, no leídos en
  negrita. Cada usuario ve **sus** células (el servicio las da según su sesión); por defecto se cargan todas las suyas (★,
  si no OAM) y se elige en «Células que se cargan…». **✓ Visto** por mensaje (casilla en la tabla y botón en el detalle),
  «Ocultar vistos», y la marca «➜ Tarea» de lo pasado a Tareas Colabora; ambas se guardan en el navegador de cada uno.
  **Versión 2026-10-29 · 1 (pruebas)**: con las bandejas solo hay filtros de búsqueda, célula, tipo, estado, remitente, prioridad
  y leído (el resto de campos, en el detalle). Tabla por días (Hoy, Ayer…), 📥/📤 entrada y salida, punto y barra azul en los
  no leídos, prioridad urgente en rojo, remitente y nº de registro bajo el asunto, estado y tipo con colores, célula en
  etiqueta; cabecera de color en el detalle con bandeja, tipo, estado y prioridad.
  **Versión 2026-10-29 · 2 (pruebas)**: «📄 Informe» con lo filtrado (periodo, filtros aplicados, resumen por célula, bandeja,
  tipo, estado y prioridad, y relación), para imprimir/PDF, Word (.doc) o copiar como texto. Ficha del mensaje con
  «⛶ Ampliar» (a toda la pantalla) y solo los campos pedidos: Fecha, Nombre autoridad, N.º referencia, Su referencia, Asunto,
  Enviable a rúbrica, Fechas de registro de entrada y salida, Firma, Leído, Prioridad, Tipo de mensaje, Último comentario,
  Usuario remitente y Célula; el resto, plegado en «Otros campos».
  **Versión 2026-10-29 · 3 (pruebas)**: informe como los de Permisos y el Gestor de Tareas: encabezado configurable (título,
  unidad, a la atención de y marca, p. ej. USO OFICIAL; se recuerda), cifras, resumen, relación con un extracto de qué trata
  cada mensaje, detalle de cada uno con sus datos y el texto completo, agrupado por célula, bandeja, tipo, estado,
  prioridad, remitente o día; vista previa al momento y salida a PDF, Word, texto o CSV. Autoría bien visible: cabecera
  con franja dorada y «Desarrollado por el Cte. Alfredo Sánchez Sender», panel de bienvenida, pie, cada informe (también
  el pie del Word) y la página de instalación del favorito.
  **Versión 2026-10-29 · 4 (pruebas)**: banderas de MENSADEF (Urgente, Finalizado…). Cada mensaje trae `IdEtiqueta` y el
  catálogo sale de `GET api/etiqueta/EtiquetasObtener?emailUsuario&urlColeccionSitio` (`[{IdEtiqueta, Nombre, Color}]`).
  Se ven con su color delante del asunto y en la ficha, con filtro «Bandera», y en el informe (columna, resumen y agrupar).
  **Versión 2026-10-29 · 5 (pruebas)**: «Abrir en MENSADEF» abre la célula en otra pestaña y localiza el mensaje: espera a
  que la aplicación pinte la bandeja, busca la fila por su n.º de registro (o el asunto), y si no está a la vista pasa a
  «Salida» si hace falta y usa el buscador de la bandeja; al encontrarla la resalta y la abre. Si no la encuentra, avisa
  con lo que hay que buscar (copiado al portapapeles). Probado con una bandeja simulada; la de verdad puede necesitar ajuste.
  **Versión 2026-10-29 · 6 (pruebas)**: quién firma (`Firma`) y el motivo (`MotivoDistribucion`), las columnas «Firma» y
  «Motivo» de la bandeja de MENSADEF: destacados en la cabecera de la ficha, bajo el asunto en la tabla, en la búsqueda y
  en el informe (columnas, detalle, resumen y agrupar por firma o motivo).
  **Versión 2026-10-29 · 7 (pruebas)**: el informe se imprime en A4 apaisado, a todo el ancho, con letra ajustada, la
  cabecera de la tabla repetida en cada hoja y sin partir filas entre hojas (la prueba deja `pruebas/informe.pdf`).

## Estructura de MENSADEF (ámbito 2SUIGE)

| Qué | Dónde |
|---|---|
| Mensajes del día | Lista `SMDMDMensajes_AAAAMMDD` (tipo de contenido `SMDMDMensajeMetadatos`) |
| Documentos del día | Biblioteca `SMDMDMensajesDocumentos_AAAAMMDD` (carpeta en `MensajeUrlCarpeta`) |
| Históricos | Listas `SMDMDMensajes2026x[_n]` y bibliotecas `SMDMDMensajesDocumentos2026x[_n]` |
| Documentos personales | Bibliotecas `SMDMDDocumentosParticulares_A_C`… (no contienen mensajes) |

Columnas de los mensajes: `MensajeId`, `MensajeFecha`, `MensajeAsunto`, `MensajeCuerpo`, `MensajeTipo_es`,
`MensajeEstado`, `MensajeCanal`, `MensajeAutoridad`, `MensajeNombre_Autoridad`, `MensajeNivel_1_Organico` a
`MensajeNivel_4_Organico`, `MensajeNum_referencia`, `MensajeSu_referencia`, `MensajeNum_expediente`,
`MensajeUrlCarpeta`, `MensajeDireccion`, `MensajeCorreoElectronico`, `MensajeCSV` y adjuntos.

Requiere Edge o Chrome (no modo Internet Explorer). Funciona con JSON ligero y, si el servidor no lo admite,
con el formato *verbose* de SharePoint 2013.

## Versión para instalar (2026-11-04 · 1)

- **Favorito definitivo:** `marcador-visor-mensadef.html` («Mensajes MENSADEF»). Es la página que se reparte a toda la
  estructura SUIGE: cada uno arrastra el botón a su barra de favoritos. Cada persona ve las células de su propia sesión de
  MENSADEF; no hay nada fijo de ningún usuario. La copia de pruebas (`marcador-visor-mensadef-pruebas.html`) sigue aparte.
- **Varios Gestores de Tareas:** la primera vez que se pulsa «➜ Crear tarea en Colabora», el visor pide la dirección y un
  nombre del Gestor: el común de la unidad (`tareas-nlt-colabora.html`, lista «Gestor de Tareas»), el propio (por ejemplo
  `tareas-nlt-colabora-pruebas.html`, lista «Gestor de Tareas PRUEBAS») o el de cualquier unidad. Se guardan varios y se
  elige en cada mensaje («Crear la tarea en…»). Con «gestionar gestores» se añaden o se quitan. La ficha dice a cuál se
  pasó. Todo se guarda en ese navegador.
- Pruebas: `FINAL=1 node mensadef/pruebas/bandejas.mjs` (favorito definitivo, dos gestores) y
  `node mensadef/pruebas/bandejas.mjs` (favorito de pruebas).
- **2026-11-04 · 2:** con la ficha ampliada («⛶ Ampliar»), los botones «◀ Anterior» y «Siguiente ▶» y las teclas ← y →
  pasan al mensaje anterior o siguiente de la lista, en el orden y con los filtros de la tabla («n de N»).
- **2026-11-05 · 1 (diseño):** tema verde bosque, azul marino y oro. Cabecera con franja institucional (Ministerio de
  Defensa · Ejército de Tierra · IGE), emblema con aro dorado y fichas de usuario y versión. Tarjetas con sombra suave,
  recuadros con su color a la izquierda, pestañas de célula en azul, tabla con cabecera azul, fila elegida con barra
  dorada, y ficha e informe en los mismos colores. En el móvil se quita la franja.
- **2026-11-05 · 2:** fuera «Ver estructura (para soporte)» de la versión definitiva; sigue en la de pruebas y, si hace
  falta para soporte, en la definitiva se saca con **Ctrl + Alt + E**.
- **Favorito protegido (05/11/2026):** `generar-marcador.py` protege el visor con `proteger/proteger.mjs` antes de meterlo
  en el favorito. Lo compacta (nombres internos cambiados, sin espacios ni comentarios), lo bloquea a `*.mdef.es` y no
  deja etiquetas de página dentro del código. La primera vez hace falta `cd mensadef/proteger && npm install`. El
  original legible es `visor-mensadef.html`.
- **Escucha versión 6 (05/11/2026):** además de las consultas, anota cómo se abren los anexos: ventanas nuevas, enlaces
  pulsados (o abiertos por código, con descarga o no), archivos creados en la página (`blob`, solo el tipo) y respuestas
  que son archivos (solo el tipo, p. ej. `application/pdf`). Siempre solo la ruta y los nombres de los parámetros, nunca
  los valores, nombres de archivo ni contenido. Es para el punto 1: ver los anexos en el visor.
- **2026-11-06 · 1: anexos en el visor.** Si el mensaje tiene anexos, la ficha los lista: título, archivo, tipo, tamaño,
  firma y si está cifrado. Hay «Abrir» (pestaña nueva, como MENSADEF) y «⬇ Descargar» (con la sesión; los cifrados `.cif`
  solo se descargan), y se indica cuántos anexos hay en papel. Sale de `GET mensaje/ObtenerCuerpo?id&modoVer` (campos
  `AnexosDigitales` y `AnexosFisicos`, vistos con la escucha v6). El valor de `modoVer` se prueba (`true`, `1`, `false`,
  `0`) y se recuerda el que funciona. **Solo se lee:** el visor no llama a `buzon/BuzonCelulaMensajeLeido`, la función con
  la que MENSADEF marca el mensaje como leído al abrirlo.
- **Escucha v7:** tapa los nombres de archivo en las rutas (solo deja la extensión). La v6 los dejaba ver: corregido.
  Enseña los valores cortos de modo o estado (`true`, `false` o un número de 1 o 2 cifras).
- **2026-11-06 · 2:**
  - Los anexos se piden siempre al abrir un mensaje, sin depender de la marca `ContieneAnexos` de la bandeja.
  - Si `ObtenerCuerpo` no da la lista, se prueba `ObtenerCuerpoValidadoCelula` (con `idBuzonCelula`).
  - Si nada funciona, el aviso dice qué respondió cada intento (ruta, `modoVer` y código o campos, sin contenido).
- **2026-11-06 · 3: «✉ Enviar por correo».** Prepara en Outlook un correo nuevo con los datos del mensaje, su texto y sus
  anexos. Es un `.eml` con `X-Unsent: 1`, que Outlook abre como borrador: se ponen los destinatarios y se envía. Se monta
  en el navegador, con los anexos leídos con la sesión. Avisa si pasa de 15 MB. Hay también «Solo texto» (`mailto:`). No
  usa ningún servidor ni cambia nada en MENSADEF. Pendiente, si el usuario lo pide: el envío propio de MENSADEF (hace
  falta escucharlo antes).
- **2026-11-07 · 1: correo rediseñado y sin adjuntos** (así lo quiere el usuario).
  - **Diseño:** tablas y estilos en línea, para Outlook. Cabecera azul con «USO OFICIAL», asunto, fecha y bandeja, y una
    nota opcional del remitente.
  - **Contenido:** etiquetas de prioridad, tipo, bandera y nº de anexos; los datos clave (remitente, nº de registro, su
    referencia, firma, motivo y célula); el texto (hasta 3000 caracteres) y solo los nombres de los anexos.
  - **Botones:** «📂 Abrir los documentos en MENSADEF» lleva a la carpeta del mensaje (`UrlCarpeta` de `ObtenerCuerpo`),
    y «✉ Abrir MENSADEF» a la célula.
  - **Pie:** autoría y aviso de uso oficial.
  - **Versión sin formato:** el `.eml` lleva también el texto plano, y se mantiene «Correo sencillo» (`mailto:`).
- **2026-11-07 · 2:** se quita «✉ Enviar por correo» a petición del usuario. Se queda todo lo demás, también los anexos.
  El código del correo sigue en el historial de git (versiones 2026-11-06 · 3 y 2026-11-07 · 1) por si se recupera.
- **2026-11-07 · 3: SENDERO.** La aplicación pasa a llamarse **SENDERO** («El camino de cada mensaje»).
  - **Cabecera:** emblema con la «S» dorada, «SENDERO» en letra clásica espaciada, el lema en dorado y el subtítulo
    «Visor de mensajes MENSADEF … desarrollado por el Cte. Alfredo Sánchez Sender».
  - **Otros sitios con el nombre:** la bienvenida, la pestaña, el pie, los informes y los favoritos («SENDERO» y
    «SENDERO (pruebas)»).
  - **Autoría:** sin cambios.
- **Cifrado fuerte del favorito.** Textos cifrados en base64, nombres cambiados, *self-defending* y bloqueo a `*.mdef.es`.
  Aquí sí se puede usar: el favorito no pasa por el filtro de la red que partía las páginas de Colabora, y las etiquetas
  de página se escriben igualmente con `\x3c`. `LIGERO=1` vuelve al compactado. El favorito pasa a unos 314 000
  caracteres.
- **Disuasorio:** sin menú del botón derecho (salvo en los campos de texto o con texto seleccionado) y sin F12, Ctrl+U ni
  Ctrl+Mayús+I/J/C. «Ver código fuente» enseña la página de MENSADEF, no la de SENDERO.
- **2026-11-08 · 1: ficha y barra.**
  - **Campos de la ficha:** solo los que pidió el usuario: fecha, nombre de autoridad, nº de referencia, asunto, fechas de
    registro de entrada y salida, firma, leído, último comentario, célula, destinatarios, estado del envío
    (`NombreEstadoUltimaDistribucionSalida`) y nº de registro de salida. Después, los anexos y el texto. Se quita «Otros
    campos».
  - **Barra con la ficha ampliada:** fija bajo la cabecera al desplazarse, con botones redondeados en una línea.
    ◀ «n de N» ▶ va en un bloque azul; «Crear tarea», «Copiar para Gestor», «Visto» y «Abrir en MENSADEF» en medio, y
    «Reducir» y «Cerrar» a la derecha.
- **2026-11-08 · 2:** «↗ Abrir en MENSADEF» destacado (azul marino con filo dorado y sombra) en la ficha normal y en la ampliada.
- **2026-11-08 · 3: destinatarios.** La bandeja trae vacío el campo en los mensajes de entrada. Ahora la lista completa
  sale de `ObtenerCuerpo` (`Destinatarios` y `DestinatariosCopia`), la misma consulta de los anexos: se ve el número, los 6
  primeros, «y N más» desplegable y los «Con copia».
- **2026-11-09 · 1: mejoras de uso.**
  - **Ficha visible siempre:** junto a la tabla se queda bajo la cabecera al bajar, con su barra de botones fija arriba (antes había que volver
    al principio para ver Ampliar, Cerrar, Abrir en MENSADEF…).
  - **«➜ Añadir tarea en META»** en lugar de «Crear tarea en Colabora».
  - **«✉ Enviar por correo»** (botón naranja): correo de Outlook (`mailto:`) con asunto, fecha, autoridad, nº de
    referencia, firma, prioridad, bandera, célula, destinatarios y anexos, el texto (recortado si no cabe) y los enlaces a
    la carpeta de documentos y a MENSADEF. Sin adjuntos.
  - **«✓ Visto»** se pone en verde. Con «Ocultar vistos», el mensaje desaparece de la tabla al momento, también al
    marcarlo en su casilla; con la ficha ampliada se pasa al siguiente.
  - **Tecla V** con la ficha ampliada: marca o quita el visto.
- **2026-11-09 · 2: comentarios en MENSADEF (solo en el favorito de pruebas).**
  - Es lo único que SENDERO escribe en MENSADEF. Lo hace igual que la aplicación (escucha v7):
    `POST mensaje/ComentarioCrear?emailUsuario&urlColeccionSitio` (los dos parámetros repetidos, como ella), cuerpo
    `{ Comentario, IdMensaje, CreadoPor }` y las cabeceras `passcode`/`user`. `CreadoPor` lleva el número de usuario
    (supuesto: la escucha solo da los nombres de los campos).
  - **Caja «💬 Añadir comentario en MENSADEF»** al final de la ficha, después del texto (2026-11-09 · 3). Hay que pulsar dos veces (la segunda
    confirma). Al guardarse, se actualiza «Último comentario» en la ficha.
  - **Al «Añadir tarea en META»** deja el comentario «Añadido como tarea en META (gestor) el fecha · SENDERO», si está
    marcada la casilla (marcada por defecto, se recuerda).
  - En el favorito definitivo no aparece (`ESCRIBIR = PRUEBAS`) hasta que el usuario lo dé por bueno.
- **2026-11-09 · 4:**
  - **Barra de la ficha ampliada siempre a la vista.** En el equipo del usuario el «sticky» no actuaba y había que subir
    para ver los botones. Ahora, al bajar, la barra se fija por código bajo la cabecera, con un hueco que ocupa su sitio.
    Se ha probado también con el «sticky» anulado.
  - **«Ver estructura» oculto en las dos copias** (también en la de pruebas). Para soporte: Ctrl + Alt + E.
  - Los dos favoritos van cifrados y protegidos como siempre.
- **2026-11-09 · 5: cambiar la bandera (solo en el favorito de pruebas).**
  - Desplegable «⚑ Bandera» en la barra de la ficha, con el color de la bandera puesta y las del catálogo
    (`etiqueta/EtiquetasObtener`). Al elegir una se guarda en MENSADEF y se ve al momento en la ficha y en la tabla.
  - Igual que la aplicación (escucha v7 del 09/11): `POST etiqueta/EtiquetaMensajeGuardar?idBuzonCelula&idEtiqueta&emailUsuario&urlColeccionSitio`,
    sin cuerpo, con las cabeceras `passcode`/`user`.
  - «Quitar bandera» manda `idEtiqueta=0`. Es un supuesto, porque la escucha solo recogió el poner una.
  - El comentario y la bandera comparten la misma función de escritura (`escribirApi`).
- **2026-11-09 · 6: comentario y bandera en el favorito definitivo.** El usuario los ha probado y funcionan, así que
  pasan a `ESCRIBIR = true` en las dos copias. El autor del comentario no sale con su nombre; lo deja así.
- **2026-11-09 · 7: rúbrica (solo en el favorito de pruebas).**
  - **«✍ Pasar a rúbrica»** en los mensajes que MENSADEF marca como «Enviable a rúbrica» o que están en validación. Hay
    que pulsar dos veces para confirmar. Lo hace igual que la aplicación (escucha v7 del 09/11):
    `POST mensaje/EnvioAPortafirmas?idMensaje&emailUsuario&buzonPersonal&urlColeccionSitio`, sin cuerpo.
  - Si MENSADEF contesta `Correcto: false`, se muestra su `MensajeInformativo` como texto. Si lo acepta, la tabla marca el
    mensaje con «✍ Rúbrica».
  - Solo se usa ese paso. La aplicación, al validar desde su editor, guardó antes el mensaje (`PUT mensaje/Guardar`) y
    creó la distribución (`mensajeDistribucionInternaSalida/Crear`); SENDERO no edita mensajes.
  - **Filtro «Enviable a rúbrica»** entre los filtros extra.
  - 2026-11-09 · 8: se quita «Firmar en Rúbrica» (abría el portafirmas). No funcionaba y el usuario prefirió quitarlo.
    En su lugar va **«🖋 Ir a Rúbrica»**, un enlace fijo al portafirmas
    (`https://portafirmas.mdef.es/ePortafirmas/Inicio.do?cr=&btnLogout=Entrar`, dado por el usuario). Sale en los mensajes
    enviables a rúbrica, en validación, pendientes de firma o recién pasados.
- **2026-11-09 · 9: versión final con rúbrica y «Actualizar».**
  - El usuario ha probado «Pasar a rúbrica» y funciona. Pasa al favorito definitivo (`RUBRICA = true`) junto con el
    enlace «🖋 Ir a Rúbrica».
  - Si el estado es «Enviado», no sale «Pasar a rúbrica», aunque MENSADEF lo siga marcando como enviable.
  - **«⟳ Actualizar»** junto a «Cargar»: vuelve a leer MENSADEF con las mismas fechas y células y deja abierta la ficha
    que se estaba viendo. Si «Hasta» era el día de la última carga y ya es otro día, pasa a hoy.
  - **Hora de la última actualización** junto a los botones: «Última actualización: HH:MM:SS (hace N min)». Se pone en
    naranja pasada media hora.
- **2026-11-09 · 10: barra de la ficha ampliada en dos pisos** (propuesta B, elegida por el usuario; probada y pasada al definitivo).
  - **Arriba, en azul marino con filo dorado:** ◀ n de N ▶, el asunto del mensaje abierto (con entrada o salida, fecha
    y célula), «Abrir en MENSADEF», «Reducir» y «Cerrar».
  - **Abajo, las acciones:** «Añadir tarea en META», «Pasar a rúbrica» e «Ir a Rúbrica» (cuando proceden); Correo,
    Copiar y Visto juntos en un bloque; la bandera.
  - Sigue fija al bajar. Con la ficha sin ampliar, todo queda como antes.
  - El filtro se llama «Enviable a rúbrica».
- **2026-11-09 · 11:** «Pasar a rúbrica» tampoco sale si el estado es «Pendiente de firma». Lo mismo con «en firma»,
  «firmado», «en rúbrica» o «portafirmas», como ya pasaba con «Enviado». «Ir a Rúbrica» sí sale en esos casos.
- **2026-11-10 · 1: portal de inicio.** SENDERO se puede pulsar en la portada (`/SitePages/Landing.aspx`) o en cualquier
  página de MENSADEF fuera de un ámbito.
  - Comprueba si ya hay sesión en el ámbito (el último usado; la primera vez, 2SUIGE) leyendo `/ambito/X/_api/web`. Si
    la hay, arranca directamente.
  - Si no, muestra «Bienvenido a SENDERO» con el ámbito (se puede cambiar) y el botón «🔑 Entrar en mi ámbito». Abre en
    una ventana pequeña el inicio de sesión de MENSADEF
    (`/_layouts/15/Defensa/Default.aspx?ReturnUrl=/ambito/X/_layouts/15/Authenticate.aspx?Source=/ambito/X&Source=/ambito/X`).
    En cuanto la sesión está abierta, cierra la ventana y carga las bandejas, sin pasar por la página de la célula.
  - Si el navegador bloquea la ventana, el inicio de sesión se abre en la misma pestaña y luego hay que pulsar SENDERO
    otra vez. Si no se abre la sesión en 5 minutos, o se cierra la ventana, se puede reintentar.
  - Dentro de un ámbito arranca como siempre y recuerda ese ámbito. «Abrir en MENSADEF» lleva a la página del ámbito.
  - La clave del servicio se pide con la cuenta del usuario (`ValidateUser`), porque en la portada no hay consultas
    previas de la aplicación.
  - Prueba: `PORTAL=1 node pruebas/bandejas.mjs` (sin sesión) y `PORTAL=1 SESION=1` (con sesión ya abierta).
- **2026-11-10 · 2: versión definitiva con el portal, rediseñado.**
  - **Diseño:** tarjeta grande en azul marino y verde con brillo dorado; escudo grande con la «S»; el nombre una sola
    vez (en el portal se ocultan la cabecera y el pie de la página); lema; texto breve; caja «Tu ámbito» con el botón
    dorado «🔑 Entrar en mi ámbito» y los 3 pasos; recuadro «Así trabaja» (el camino del mensaje, se oculta en pantallas
    estrechas); chips de lo que hace; pie con la autoría y la versión.
  - A petición del usuario, el portal no dice nada de dónde quedan los datos.
  - **Seguridad, igual que antes:** ofuscación fuerte con bloqueo a *.mdef.es y «self-defending»; botón derecho, F12 y
    Ctrl+U/Ctrl+Mayús+I/J/C bloqueados; «Ver estructura» oculto (Ctrl+Alt+E); nunca marca como leído. Las escrituras
    (comentario, bandera, rúbrica) piden confirmación.
- **2026-11-10 · 3: corrección del portal («me sale todo borrador»).**
  - **Causa:** entrando desde la portada no había consultas previas de la aplicación. SENDERO tomaba el número de
    usuario de `ConsultaUsuarioDicodefPorCorreo`, que no es el que sirve para pedir las células. No salían células, el
    servicio de bandejas fallaba y se caía en silencio a las listas del sitio (los borradores).
  - **Arreglo:** al entrar por el portal, SENDERO abre la página del ámbito en un marco oculto. Espera a que la
    aplicación de MENSADEF haga sus consultas (como mucho 15 s) y toma de ellas el número de usuario, la consulta de la
    clave y la colección, igual que dentro de la célula.
  - Entrando por el portal ya no se cae a los borradores. Si algo falla, sale un aviso con la línea «Detalle», sin
    valores.
  - La simulación (`PORTAL=1`) reproduce el fallo: `ConsultaUsuarioDicodef` devuelve un número que no sirve y la página
    del ámbito hace sus consultas al cargar.
- **2026-11-10 · 4 (pruebas): leído en MENSADEF.** A petición del usuario se deja la regla anterior («nunca marcar como
  leído»).
  - Al abrir en SENDERO un mensaje no leído, se marca leído también en MENSADEF, como hace la aplicación (escucha):
    `PUT buzon/BuzonCelulaMensajeLeido?emailUsuario&urlColeccionSitio&idBuzonCelula&estado=true`, sin cuerpo. Desaparece
    la negrita en SENDERO y en MENSADEF.
  - Botón **«📩 Marcar no leído» / «📖 Marcar leído»** en la ficha (`estado=false/true`).
  - «✓ Visto» sigue siendo una marca propia de SENDERO, aparte.
  - `escribirApi` admite el método (POST por defecto; aquí PUT). Abrir o descargar anexos no marca nada.
- **2026-11-10 · 5:**
  - **Leído en el definitivo** (`LEIDO = true`): el usuario lo ha probado y funciona.
  - **Entrada automática (solo pruebas, `AUTOENTRADA = PRUEBAS`).** Desde la portada, si no hay sesión, SENDERO carga el
    inicio de sesión de MENSADEF en un marco oculto y aislado (`sandbox` sin permiso para cambiar la página). Allí pulsa
    el botón de entrar (texto con iniciar, entrar, acceder, aceptar o login) y, en cuanto hay sesión, carga las bandejas.
    Sin ventanas y sin pulsar nada; mientras, el portal dice «Entrando en tu ámbito…». Si en 25 s no lo consigue, queda
    el portal con «Entrar en mi ámbito» (ventana pequeña), como antes.
  - Un favorito no puede arrancar solo: el navegador solo lo ejecuta al pulsarlo, sobre la página abierta. Para un solo
    clic, se pone la portada de MENSADEF como página de inicio de Edge.
- **2026-11-10 · 5 (marcadores regenerados): pulsado fuera de MENSADEF.** Si el favorito se pulsa en otra web (Colabora,
  Outlook en el navegador…), lleva a la portada de MENSADEF (`/SitePages/Landing.aspx#/`); allí se pulsa otra vez. Lo
  hace un `if` al principio del marcador (`generar-marcador.py`), antes del código protegido.
- **2026-11-10 · 6:**
  - **Estado de las salidas como en MENSADEF:** en la tabla, los chips, los filtros y el informe se muestra el estado del
    último envío (`NombreEstadoUltimaDistribucionSalida`, p. ej. «Pendiente de Validar») si lo hay. Antes se veía
    `EstadoMensaje`, que sigue en «Borrador» mientras no sale. Así esos mensajes ya no se ocultan como borradores.
  - **Portal más paciente:** espera hasta 45 s a que la aplicación del ámbito pida sus datos (antes 15 s; con 15 s salía
    «UsuarioCelulas: HTTP 500»). Si aun así falla, vuelve a preparar y lo intenta otra vez. En la entrada automática,
    toma ya esos datos del marco del inicio de sesión.
- **2026-11-10 · 7: «UsuarioCelulas / EtiquetasObtener → 500» entrando por la portada.**
  - **Causa:** la propia portada consulta el servicio con la colección raíz (`urlColeccionSitio=https://mensadef.mdef.es`).
    SENDERO tomaba esas consultas como «datos de la aplicación» y no los sustituía por los del ámbito, así que todo lo
    del ámbito contestaba 500.
  - **Arreglo:** fuera de un ámbito no se toman las consultas de la página. `prepararApp` borra lo que hubiera y lo toma
    todo de la página del ámbito. La colección solo se acepta si es de `/ambito/`.
  - La simulación (`PORTAL=1`) lo reproduce: la portada hace sus consultas con la colección raíz, y el servicio contesta
    500 a lo del ámbito con esa colección. Comprobado que la versión anterior falla y esta no.
- **2026-11-10 · 8:**
  - **Entrada automática en el definitivo** (`AUTOENTRADA = true`), probada por el usuario. Si se quiere la ventana
    pequeña de antes, se puede guardar `sinAutoentrada` (la simulación lo usa con `VENTANA=1`).
  - **«Visto» con «Ocultar vistos» y una tarjeta elegida.** Con una tarjeta elegida («No leídos», «Entrada»…) el mensaje
    marcado no se quitaba de la lista: el filtro solo actuaba sin tarjeta. Al entrar ahora con «No leídos» (porque
    SENDERO ya marca leído), se notaba. Ahora se quita siempre que esté marcado «Ocultar vistos». En la tarjeta «Sin
    revisar» se quita aunque no lo esté.
  - **Batería completa:** `sh mensadef/pruebas/todas.sh` pasa `bandejas.mjs` por las seis formas de entrar (dentro de
    la célula con los dos favoritos; portada con entrada automática, con ventana, con MENSADEF lento y con sesión ya
    abierta). Incluye los casos reales de «Visto». Hay que pasarla antes de entregar cualquier cambio de SENDERO.
- **2026-11-11 · 1: negociado y responsable a META.** En el panel de META de la ficha hay dos campos:
  - **Negociado**: el último usado con esa célula o, la primera vez, el de su nombre («SETEC SEGURIDAD» → «Seguridad»).
  - **Responsable**: el último usado con ese negociado.
  - Los dos tienen lista de los ya usados y se mandan en `#importar` (`negociado`, `responsable`). Se recuerdan por
    célula y por negociado.
- **2026-11-11 · 2: departamento = célula de MENSADEF.** Lo pide el usuario, pensando en llevarlo a todo el Ejército.
  - Se quitan los campos «Negociado» y «Responsable» del panel de META.
  - SENDERO manda la **célula del mensaje** como `departamento` (p. ej. «ET 2SUIGE SEGURIDAD») y lo dice en la ficha
    («Departamento en META: …»).
  - El responsable ya no se manda: en META es quien crea la tarea, y se puede cambiar allí.
- **2026-11-11 · 3:** con cada paso a META, SENDERO manda también todas las células del usuario (`departamentos`), para
  que META las ofrezca como departamentos.

