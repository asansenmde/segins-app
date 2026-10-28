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
