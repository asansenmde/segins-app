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
