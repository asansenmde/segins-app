# Puntos de Situación de SUIGESUR · `[PUNTOS]`

> Proyecto independiente. Relación con [META / Tareas Colabora](../colabora/): los asuntos marcados **⭐ Tratar con el
> General** llegan como propuestas (y META puede incluirlos directamente, versión 2026-11-09 · 3 del Gestor).

Sustituye al Word de Colabora donde cada negociado aportaba su información para el punto de situación. Cada negociado da
de alta y edita sus entradas (texto con imágenes); a la hora de cierre el punto se bloquea; PROCOR genera el **informe
Word oficial**, lo archiva en la red y, pasado un mes, borra el contenido de Colabora (a la papelera).

- `puntos-situacion.html`: **original legible** (el que se edita). © 2026 Cte. Alfredo Sánchez Sender.
- `colabora/puntos-situacion.html`: **copia protegida, la que se sube a Colabora** (sitio `/et/SUIGESUR/JSUIGE`, una
  biblioteca del sitio). Se regenera tras cada cambio con `cd puntos-situacion/proteger && npm install && node proteger.mjs`.
- `colabora/puntos-situacion-pruebas.html`: copia de pruebas (`node proteger.mjs --pruebas`): listas «PS … PRUEBAS»,
  banda roja y «[PRUEBAS]» en los correos. Nunca toca las listas reales.
- `img/puntos-situacion-minisdef.png` y `img/puntos-situacion-uso-oficial.png`: opcionales, **al lado de la página** (sin la
  carpeta `img`) para que los correos lleven el escudo y la marca; si no están, el correo pone el texto.
- `pruebas/simulacion.mjs`: prueba completa con Playwright contra un Colabora simulado (datos ficticios):
  `node puntos-situacion/pruebas/simulacion.mjs` (también `VERBOSE=1` y `PS_HTML=puntos-situacion/colabora/…`;
  `CAPTURAS=carpeta` guarda capturas, el Word y su PDF si hay LibreOffice).

## Versión 2026-11-10 · 2: editor ampliable y la parte de cada negociado en Word o PDF

- **Editor**: botón «⛶ Ampliar» (pantalla completa, se recuerda en el navegador; «🗗 Reducir» para volver) y el recuadro
  de la situación se puede estirar desde su esquina inferior derecha.
- **Parte de cada negociado**: en «Mi negociado», «Descargar la parte de PRL: 📄 Word · 🖨 PDF» (siempre, también con el
  punto cerrado); en *Informe*, «Parte de [negociado]» con Word y PDF. Cada uno solo puede sacar la de sus negociados
  (coordinación, la de todos). La parte lleva el mismo membrete, «APORTACIÓN DE [NEGOCIADO]» en la banda, solo ese
  negociado y sin firma. Archivo `PS-2026-045 PRL Punto de Situacion 2026-11-10.docx`.
- **PDF**: la hoja del informe se prepara en un marco oculto y se abre «Imprimir» del navegador: elegir «Guardar como
  PDF». En *Informe*, la coordinación tiene también «🖨 Informe completo en PDF». Si el punto sigue abierto, el
  subtítulo dice «BORRADOR (punto abierto)».

## Versión 2026-11-10 · 1: modificar y eliminar un punto

Para corregir un punto creado con la fecha u otro dato equivocado (petición del usuario). Solo coordinación (PROCOR y
Control total), en *Seguimiento*:
- **✎ Modificar punto**: el mismo formulario del alta, relleno: fecha del punto, apertura, bloqueo, negociados
  convocados, repetición y recordatorio. Si cambia el bloqueo, se copia en todas sus entradas (para cerrarlo ya sigue
  «Cerrar ahora»). La referencia se mantiene; si cambia el año y el punto aún no tiene entradas, toma el siguiente número
  del año nuevo. Opcional: avisar del cambio por correo («CAMBIO · PS-…»). Queda en el historial del punto.
- **🗑 Eliminar punto**: dos clics y confirmación; el punto y sus entradas (con sus imágenes) van a la **papelera** de
  Colabora, de donde se pueden recuperar. Si alguna entrada no se puede quitar, el punto no se elimina.

## Versión 2026-11-09 · 1

**Primera puesta en marcha** (la primera vez que se abre; hace falta «Administrar listas»): crea las listas y columnas
(solo lo que falte), activa el historial de versiones, pone la **validación** de «PS Aportaciones»
(`=[Cierre del punto]>NOW()`: Colabora no guarda cambios después del cierre, tampoco desde la lista) y da de alta los
negociados en el orden del informe (PROCOR, Infraestructura, Seguridad, PRL, Calidad de Vida, Acuartelamiento),
emparejados con los valores de «Negociado asignado» del Gestor de Tareas (se revisan en pantalla). Quien instala queda en
«Coordinación (control total)». Si Colabora no admite la fórmula, lo dice y el bloqueo queda solo en la página.

**Quién hace qué**
- Miembros de cada negociado: dan de alta, modifican, ordenan y quitan las entradas de su negociado.
- PROCOR y Coordinación (filas con «Coordina»): todo lo anterior en cualquier negociado, crear puntos, cambiar el cierre
  o reabrir, recordatorios, informe Word, entregado, archivar y borrar; en Ajustes, miembros (buscador de personas del
  sitio y del directorio), orden de los negociados y solicitudes.
- Quien no está en ningún negociado ve «🔒 No estás en ningún negociado» y puede **solicitar el alta** (lista
  «PS Solicitudes» y correo a coordinación); se aprueba o deniega en Ajustes y se le avisa por correo.

**Pestañas**
- *Seguimiento*: punto elegido con cuenta atrás hasta el bloqueo, barra de avance, recuentos (entradas, han aportado,
  «Sin novedad», faltan), estado por negociado, propuestas de META, «Recordar a los pendientes», «Cerrar ahora» (bloquea
  en un minuto: Colabora necesita una hora futura), «Cambiar hora de cierre / Reabrir» (se copia en todas las entradas),
  «Generar informe Word», «Crear el siguiente punto» (si se repite) y últimos puntos.
- *Mi negociado*: entradas con asunto, situación, prioridad (Normal / Alta), expediente y «pasar al siguiente punto»;
  ordenar arrastrando ⠿ o con ↑ ↓; «Sin novedad»; «Traer del punto anterior» (copia las entradas marcadas, con sus
  imágenes); propuestas de META del negociado («📋 Incluir» abre la entrada rellena, con origen y enlace a la tarea).
- *Informe*: vista previa igual que el Word; PROCOR lo descarga y lo marca como entregado.
- *Histórico*: todos los puntos, ocupación en Colabora (texto e imágenes), «🗄 Archivar en…» y «🗑 Borrar contenido».
- *Ajustes*: negociados, miembros, solicitudes, «Comprobar la instalación» y correo de prueba.

**Imágenes dentro del texto**: «🖼 Insertar imagen», pegar (Ctrl+V) o arrastrar al texto. Se reducen a 1600 px de ancho en
JPEG, llevan pie y tamaño (100 / 75 / 50 %) y se guardan como **adjuntos** del elemento. En la columna `Situacion` (texto
sin formato) van como `[[imagen:archivo|pie|ancho|bytes]]` en su línea. Al quitar una imagen se borra su adjunto.

**Informe Word (.docx real, generado en la página sin librerías)**: cabecera con el escudo, «USO OFICIAL» y la referencia en
todas las páginas; banda azul y oro «EJÉRCITO DE TIERRA · INSPECCIÓN GENERAL DEL EJÉRCITO · SUIGESUR» con «PUNTO DE
SITUACIÓN DE SUIGESUR» y la fecha; referencia, fecha de elaboración, hora de cierre y recuentos; todos los negociados en su
orden con sus entradas (viñetas, «PRIORIDAD ALTA», imágenes con «Figura n») o «Sin novedad.» / «No ha aportado
información.»; firma «EL JEFE DE LA SUIGESUR»; pie con quién lo emite, cuándo y «Página n de m». Archivo
`PS-2026-045 Punto de Situacion 2026-11-10.docx` (sin tildes en el nombre: algunos navegadores descargan entonces como
«download»).

**Puntos**: referencia **PS-año-número** (correlativo por año, se relee antes de crear), fecha, apertura, bloqueo,
negociados convocados, repetición (cada día / semana / dos / cuatro semanas) y recordatorio (horas antes). Aviso por
correo al crearlo a los miembros de los convocados. El recordatorio **no sale solo** (nada se ejecuta en Colabora sin la
página abierta): cuando faltan esas horas, la página se lo ofrece a la coordinación. Todo queda en el `Historial` del punto.

**Archivo y borrado**: «Archivar en…» descarga el Word y un .zip con las imágenes, pide la ruta de red (recuerda la última
carpeta) y la confirmación de que está guardado (el navegador no puede comprobar la carpeta de red); anota quién y
cuándo. A los 30 días del archivo, «Borrar contenido» (dos clics y confirmación) manda las entradas y sus imágenes a la
**papelera** de Colabora (se pueden recuperar; el espacio se libera al vaciarse) y deja la ficha del punto con la ruta.

**Correo**: `SP.Utilities.Utility.SendEmail` con el **envío robusto** de Permisos (uno a uno si Colabora rechaza una
dirección, por su cuenta o por otra cuenta de la misma persona; dice a quién no llegó y ofrece Outlook).

## Listas (las crea la página)

| Lista | Columnas (nombre interno) |
|---|---|
| PS Puntos | `Referencia`, `Anio`, `Numero`, `FechaPunto`, `Apertura`, `Cierre`, `EstadoPunto` (Abierto, Entregado, Archivado, Contenido borrado), `Convocados` (nombres separados por «;»), `Repetir`, `RecordarHoras`, `RecordatorioEnviado`, `RutaArchivo`, `ArchivadoPor`, `FechaArchivo`, `FechaBorrado`, `Historial` |
| PS Negociados | `Title`, `Orden`, `NombreGestor` (valores de NegociadoAsignado, varios con «;»), `Miembros` (personas), `Coordina`, `EnInforme` |
| PS Aportaciones | `Title`, `PuntoId`, `Referencia`, `Negociado`, `Tipo` (Entrada, Sin novedad), `Situacion`, `Prioridad`, `Orden`, `Expediente`, `PasarSiguiente`, `CierrePunto` (validación), `Origen` (Página, Punto anterior, META), `OrigenLista`, `OrigenId`, `OrigenUrl`; imágenes como adjuntos |
| PS Solicitudes | `Title`, `Negociado`, `Motivo`, `Solicitante`, `EstadoSolicitud`, `Resolucion` |

Funciona con JSON ligero y, si el servidor no lo admite, con el formato *verbose* de SharePoint 2013. Requiere Edge o
Chrome (no modo Internet Explorer).

## Pendiente de comprobar en Colabora

- Que la validación con `NOW()` se guarda y bloquea de verdad (la página lo comprueba al instalar).
- Que adjuntar imágenes a una entrada después del cierre también lo rechaza Colabora (la página ya no lo deja).
- La seguridad real por negociado la pone la página; quien entre a la lista directamente podría tocar otro negociado
  (queda en el historial de versiones).
