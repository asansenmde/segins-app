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
- `prueba-mensadef.html` (marcador: `marcador-mensadef.html`, favorito «Prueba MENSADEF»): diagnóstico. Indica
  dónde se ejecuta, lista las listas y bibliotecas del sitio (nombre, tipo, recuento) y analiza la que se elija:
  columnas, tipos de contenido, archivos por tipo, meses y columnas rellenas. El resumen para copiar no incluye
  asuntos, nombres de archivo ni contenido. `prueba-mensadef.aspx` es la misma página con otra extensión.

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
