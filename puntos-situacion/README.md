# Puntos de Situación de SUIGESUR · `[PUNTOS]`

> Proyecto independiente. Relación con [META / Tareas Colabora](../colabora/): los asuntos marcados **⭐ Tratar con el
> General** llegan como propuestas (y META puede incluirlos directamente, versión 2026-11-09 · 3 del Gestor).

Sustituye al Word de Colabora donde cada negociado aportaba su información para el punto de situación. Cada negociado da
de alta y edita sus entradas (texto con imágenes); a la hora de cierre el punto se bloquea; PROCOR genera el **informe
Word oficial**, lo archiva en la red y, pasado un mes, borra el contenido de Colabora (a la papelera).

- `puntos-situacion.html`: **original legible** (el que se edita). © 2026 Cte. Alfredo Sánchez Sender.
- `colabora/puntos-situacion.html`: **copia protegida (cifrada entera), la que se sube a Colabora** (sitio `/et/SUIGESUR/JSUIGE`, una
  biblioteca del sitio). Se regenera tras cada cambio con `cd puntos-situacion/proteger && npm install && node proteger.mjs`.
- `colabora/puntos-situacion-pruebas.html`: copia de pruebas (`node proteger.mjs --pruebas`): listas «PS … PRUEBAS»,
  banda roja y «[PRUEBAS]» en los correos. Nunca toca las listas reales.
- `img/puntos-situacion-minisdef.png` y `img/puntos-situacion-uso-oficial.png`: opcionales, **al lado de la página** (sin la
  carpeta `img`) para que los correos lleven el escudo y la marca; si no están, el correo pone el texto.
- `pruebas/simulacion.mjs`: prueba completa con Playwright contra un Colabora simulado (datos ficticios):
  `node puntos-situacion/pruebas/simulacion.mjs` (también `VERBOSE=1` y `PS_HTML=puntos-situacion/colabora/…`;
  `CAPTURAS=carpeta` guarda capturas, el Word y su PDF si hay LibreOffice).

## Versión 2026-11-25 · 3: aviso de cierre

- **«🔒 Cerrar ahora»** envía al momento el aviso **«CERRADO · PS-…»**: el punto queda cerrado a tal hora, ya no se admiten
  cambios, qué negociados no aportaron; a los convocados y, en copia, a la coordinación.
- **Al terminar el plazo**: Colabora no ejecuta nada a una hora sin la página abierta, así que el aviso de cierre lo envía
  automáticamente **la primera persona de coordinación que abre la página después del cierre**, una sola vez por punto
  (queda en el historial como «aviso de cierre por correo» y se relee justo antes para no repetirlo). Solo puntos cerrados
  en los últimos 7 días y todavía «Abierto». Si se cerró con «Cerrar ahora», no se repite al vencer.

## Versión 2026-11-25 · 2: aviso al cambiar la hora de cierre

Caso del usuario: cambió la hora de cierre y no le llegó ningún correo. «⏱ Cambiar hora de cierre» / «Reabrir» no avisaba
a nadie (solo avisaba «✎ Modificar punto» si se marcaba la casilla). Ahora el diálogo trae **«Avisar del cambio por
correo»** marcado por defecto: al guardar envía el aviso «CAMBIO · PS-…» a los negociados convocados y, en copia, a la
coordinación, y dice a cuántos llegó (o por qué no). Queda en el historial del punto. «Cerrar ahora» sigue sin avisar.

## Versión 2026-11-25 · 1: ocultar la biblioteca y las listas (como CECONSEG)

En *Accesos › Preparación* (solo Control total), copiado de CECONSEG (`vistaListasPropias` / `ocultarListasPropias`):
- **Biblioteca de esta página**: «Ocultar la biblioteca» / «Volver a mostrarla» (si es «Documentos compartidos», avisa de
  que es la general del sitio y pide confirmación).
- **Listas de la aplicación** («PS Puntos», «PS Negociados», «PS Aportaciones» y la común «SOLICITUDES ACCESO
  APLICACIONES»): cada una con «Ocultar» / «Mostrar» y su enlace «abrir», y «Ocultar todas» / «Mostrar todas»
  (`lists(guid)` MERGE `Hidden`).
- Solo las quita de «Contenido del sitio»: no cambia permisos ni datos, la aplicación sigue funcionando y cada lista se
  abre con su dirección directa. No es seguridad: protegen la copia cifrada y los permisos.

## Versión 2026-11-23 · 2: «Comprobar los avisos»

En *Ajustes*, **«📬 Comprobar los avisos»** repasa a todos los miembros de los negociados (también los de coordinación) y,
**sin enviar ningún correo**, dice de cada persona si le llegarían los avisos: «✔ Le llega» (cuenta en el sitio y correo),
«⚠ Va a su cuenta, sin correo en Colabora» (depende de que esa cuenta tenga buzón) o «✕ No le llega: su cuenta no está en el
sitio». Avisa también de los negociados sin miembros y explica cómo arreglarlo (quitar y volver a añadir con el buscador).

## Versión 2026-11-23 · 1: a quien coordina le llega el aviso del punto nuevo

Caso del usuario: se lanzó un punto y no le llegó el aviso. Causas encontradas y corregidas:
- El aviso de apertura (y el de cambio) iba solo a los miembros de los negociados convocados: la fila «Coordinación
  (control total)» no se convoca ni sale en el informe, y quien solo estaba allí no lo recibía. Ahora **la coordinación va
  siempre en copia** de esos avisos (el recordatorio sigue yendo solo a los negociados pendientes).
- Los miembros **sin correo** en la lista de usuarios del sitio se quedaban fuera sin decirlo. Ahora se les envía a su
  **cuenta** (`getuserbyid` → `LoginName`).
- En *Seguimiento*, la coordinación ve plegado el **«Historial del punto»**: creación, cambios y a quién se envió cada aviso
  (o «NO ENVIADO» con el motivo), para saber qué pasó.

## Versión 2026-11-17 · 3: descartar propuestas de META

Pedido por el usuario: no quería ver muchas propuestas de META que no le interesan, sin borrarlas en META.
- En *Seguimiento*, «⭐ Propuestas de META (Tratar con el General) · n» sale **plegado** (se abre al pulsar y se recuerda).
- Cada propuesta tiene **«✕ Descartar»**: deja de salir en todos los puntos. **En META no se toca nada.** Las descartadas
  quedan en «Descartadas (n)», plegado, con **«↺ Recuperar»**.
- Se guardan en «PS Negociados», columna nueva **«Propuestas de META descartadas»** (`MetaDescartadas`, Ids con «;»): las
  de un negociado en su fila (las descarta ese negociado o coordinación) y las que no tienen negociado en la fila de
  coordinación (solo coordinación). La columna la crea «Comprobar la instalación»; mientras falte, se guardan solo en ese
  navegador.

## Versión 2026-11-17 · 2: modelo común de las aplicaciones de Colabora

- **Firma:** «EL SECRETARIO TÉCNICO DE LA SUIGESUR» (corrige «EL SETC…» de la · 1).
- **Correo a la cuenta, no a la dirección** (comprobado en el Colabora real el 17/11: `SendEmail` rechaza las direcciones
  con HTTP 400 «Asegúrese de que tenga un destinatario válido», incluso la propia, y acepta las cuentas `i:0#.w|et\usuario`).
  `aCuentas` (con `cuentaCache`, copiado de Incidentes) cambia cada dirección por la cuenta: `loginDe`; si no está en el
  sitio, `ensureuser` con la dirección; si tampoco, deja la dirección y sigue el envío robusto. `enviarUno` aplica
  `aCuentas` a To, CC y BCC y llama a `enviarUnoDirecto`.
- **Control de acceso con solicitud** (como Incidentes): quien no está en ningún negociado ni tiene Control total ve
  «🔒 No tienes acceso · Solicitar acceso» (nombre y correo de su sesión, empleo y teléfono propuestos del perfil, negociado
  obligatorio y motivo) y el estado de sus solicitudes. Van a la lista común del sitio **«SOLICITUDES ACCESO
  APLICACIONES»** (nunca a la interna «Solicitudes de acceso»), con `Aplicacion` = PUNTOS (PUNTOS PRUEBAS en la copia de
  pruebas) y `Papel` = «Negociado: …». Cada solicitud nueva avisa a **asansen@et.mde.es**. La lista «PS Solicitudes» de
  versiones anteriores ya no se usa (se puede borrar a mano).
- **Pestaña Accesos** (solo Control total): Preparación (crear la lista común y sus columnas, «solo sus elementos»,
  «Permitir que cualquiera solicite acceso», abrir la lista, **«🔔 Avisarme»** con la alerta de SharePoint y **«Probar el
  aviso»**); solicitudes pendientes con el negociado propuesto, «Aprobar y dar de alta» (añade a la persona a los miembros
  de ese negociado) o «Denegar» (motivo obligatorio), correo al solicitante y solicitudes resueltas.
- **Ajustes y Accesos solo con Control total** (permiso «Administrar permisos» en «PS Puntos» o, sin instalar, en el sitio):
  a los demás ni les aparecen. Control total cuenta además como coordinación. La primera puesta en marcha también es solo
  para Control total; los demás ven «La aplicación aún no está preparada».
- Pruebas: `SOLO_CUENTAS=1` imita el Colabora real del correo (rechaza los envíos con «@»); `PROXY=1`, el filtro de la red.

## Versión 2026-11-17 · 1: firma del SETC, «Creado el» y «Página X de Y»

Pedido por el usuario:
- El informe lo firma **«EL SETC DE LA SUIGESUR»** (antes «EL JEFE DE LA SUIGESUR»), en la página, el PDF y el Word.
- En el subtítulo, **«Creado el …»** (fecha en que se creó el punto) en lugar de «Elaborado el …».
- **Paginado «Página X de Y»** en cada página: en el Word, en su propia línea del pie con campos completos (PAGE y
  NUMPAGES marcados para recalcular, Word pone el total real al abrirlo); en el PDF, al pie de cada página con
  `@page { @bottom-center }` (Edge y Chrome actuales; comprobado con Chromium 153).

## Versión 2026-11-16 · 6: copia cifrada entera (como las demás aplicaciones)

La copia que se sube a Colabora se genera ahora con `proteger/cifrado.mjs` (el mismo de Incidentes, Pérdidas, VSA,
Permisos y el Gestor desde el 13/11): todos los textos, nombres de campo y expresiones regulares van a la tabla cifrada,
con bloqueo al dominio `.mdef.es`, y el `<` de las etiquetas de página se escribe `\x3c` para el filtro de la red. En la
copia no se lee ningún nombre de lista, columna ni mensaje. Pasa de ~200 KB a ~345 KB. El programa no cambia.
Probada con la simulación completa (ligero y verbose) y con `PROXY=1`, que imita el filtro de la red.

## Versión 2026-11-16 · 5: «error de validación de datos de lista» con el punto abierto

Caso del usuario: un miembro, al **modificar** una entrada con el punto abierto, recibía «Error de validación de datos de
lista». Cada entrada guarda su copia de la hora de bloqueo («Cierre del punto») y la validación compara con ella; si esa
copia se había quedado atrasada (entrada creada desde una pantalla abierta antes de que PROCOR cambiara la hora, desde
META, al reabrir…), Colabora rechazaba el cambio aunque el punto siguiera abierto. Ahora:
- Antes de cada escritura (alta, modificar, ordenar, traer del punto anterior, «Sin novedad») se lee del servidor la hora
  de bloqueo vigente del punto; si ya pasó, se dice que está cerrado y no se escribe; si no, se guarda con esa hora y la
  copia atrasada de la entrada se corrige sola.
- Si Colabora aún rechaza por la validación (responda 400 o 500), el mensaje lo explica en lugar del texto técnico.

## Versión 2026-11-16 · 4: texto con formato

Barra de formato en el editor: **N** negrita, *K* cursiva, S subrayado, Resaltar (amarillo), • Viñetas y ✕ Quitar formato
(también Ctrl+B, Ctrl+I, Ctrl+U). Se ve igual en la página, el informe, el PDF y el Word (negrita, cursiva, subrayado,
resaltado amarillo y viñetas con sangría).
- Se guarda en la misma columna de texto `Situacion` con marcas: `[b]…[/b]`, `[i]…[/i]`, `[u]…[/u]`, `[r]…[/r]`; las
  viñetas son líneas que empiezan por «• ». Lo que se escribe a mano como «[b]» se guarda como «(b)» para que no se tome por
  formato. Lo que viene del servidor se sigue escapando: las marcas solo producen esas cuatro etiquetas.
- El resaltado usa su propio `<mark>` (seleccionar y pulsar; dentro de un resaltado, pulsar de nuevo lo quita o saca el
  cursor de él).
- Al pegar texto se pega sin formato (como antes); se le da formato después con la barra.
- En la lista de Colabora y en el recuadro «Actualizar la situación» de META se ven las marcas tal cual.

## Versión 2026-11-16 · 3: reparto de células con negociados que se llaman distinto

En el Colabora del usuario, PROCOR y PRL salían como «No existe el negociado» (allí tienen otro nombre). Ahora cada fila
de la tarjeta de células tiene un desplegable con los negociados: se propone el del mismo nombre o uno con un nombre
habitual (PROCOR: programación, coordinación; PRL: riesgos, prevención; Infraestructura: infra…) y, si no hay, «Elige».
Una fila está hecha cuando algún negociado ya tiene todas sus células («✔ Puestas en …»).

## Versión 2026-11-16 · 2: no confundir mensajes distintos de la misma célula

Fallo visto por el usuario: al llegar un mensaje de SENDERO decía «Este mensaje ya está incluido en PS-…» y no lo estaba.
Causa: para los mensajes leídos por la API de MENSADEF, SENDERO manda como enlace el **de la célula**, igual para todos sus
mensajes, y la página, si la entrada no tenía la clave del mensaje, comparaba por el enlace. Ahora:
- Los duplicados se detectan **solo por la clave del mensaje** (`id` de SENDERO), nunca por el enlace.
- La clave se guarda en `OrigenClave`; si esa columna aún no existe, en `OrigenLista` como «SENDERO|clave».
- Las entradas incluidas antes sin clave ya no bloquean a ningún mensaje.

## Versión 2026-11-16 · 1: células de SUIGESUR por negociado

En Ajustes, tarjeta **«Células de SUIGESUR (META y SENDERO)»** con el reparto confirmado por el usuario el 16/11/2026 y el
botón **«Poner las células de SUIGESUR»** (dos clics). En META el «Negociado asignado» es la célula de MENSADEF, así que se
ponen en las dos columnas de cada negociado: «Nombre en el Gestor de Tareas» (tareas de META) y «Célula de MENSADEF»
(mensajes de SENDERO). Solo añade; lo que ya hay se conserva.

| Negociado | Células de MENSADEF |
|---|---|
| PROCOR | ET 2SUIGE SETEC PROGCOORD |
| Infraestructura | ET 2SUIGE SETEC INFRAPROP, … INFRAPROP MAMBIENTAL, … INFRAPROP MANTO, … INFRAPROP OBRAS, … INFRAPROP PROPIEDADES |
| Seguridad | ET 2SUIGE SETEC SEGURIDAD |
| PRL | ET 2SUIGE SETEC PRL |
| Calidad de Vida | ET 2SUIGE SETEC CALIDAD VIDA |
| Acuartelamiento | ET 2SUIGE SETEC SVC ACTO |
| *Sin asignar* | ET 2SUIGE SETEC JEFATURA, ET 2SUIGE SETEC SECRETARIA |

JEFATURA y SECRETARIA quedan **sin asignar a propósito**: al llegar uno de sus mensajes, la página dice «no tiene negociado
fijo, decide tú dónde se incluye» y no ofrece guardar la célula, para que se pregunte siempre.

## Versión 2026-11-15 · 1: mensajes de SENDERO directos al Punto de Situación

SENDERO (visor de MENSADEF) puede mandar un mensaje al Punto de Situación sin pasar por META: abre esta página con
`#importar=<JSON>` (`v: 1`, `origen: "SENDERO"`, `destino: "psit"`, `id`, `asunto`, `fecha`, `de`, `firma`, `referencia`,
`suReferencia`, `expediente`, `enlace`, `texto`, `departamento` = célula de MENSADEF). El fragmento no se envía a ningún
servidor.
- Se lee también desde la página del portal que la contenga (`window.top`), se valida y se borra de la dirección.
- **Célula → negociado**: columna nueva **«Célula de MENSADEF»** (`CelulaMensadef`, varias con «;») en cada negociado
  (Ajustes). Se compara sin mayúsculas, tildes ni signos («Célula P.R.L.» = «CELULA PRL»). Si no casa, pregunta a qué
  negociado va (los del usuario) y la coordinación puede guardarla en ese negociado para la próxima vez.
- Abre «Mi negociado» con la **entrada nueva rellena** (asunto; en la situación, una línea con remitente, fecha,
  referencias y firma y el texto, hasta 3000 caracteres; expediente o referencia) y la marca «✉ Desde SENDERO». **No se
  crea nada hasta pulsar Guardar.** Sin permiso en ese negociado, o sin negociado, lo dice.
- Se guarda con `Origen` = SENDERO, `OrigenLista` = SENDERO, `OrigenUrl` = enlace del mensaje y la clave del mensaje en
  la columna nueva **`OrigenClave`** de «PS Aportaciones» (la clave de MENSADEF no es un número, así que no cabe en
  `OrigenId`). Si el mismo mensaje ya está en el punto abierto, lo dice y no lo duplica.
- Si no hay punto abierto (cerrado o aún sin abrir), lo dice claramente.
- **Las dos columnas nuevas** las crea «Comprobar la instalación» (Ajustes); mientras falten, Ajustes lo avisa y lo demás
  sigue funcionando.

## Versión 2026-11-12 · 6: todos los negociados descargan el informe completo en PDF

- En la pestaña «Informe», cada negociado puede descargar el informe completo en PDF, además de la parte de su
  negociado. El Word completo y «Marcar como entregado» siguen siendo solo de PROCOR. «Mi negociado» no cambia.

## Versión 2026-11-12 · 5: al incluir una propuesta en un negociado se abre ese negociado

- Tras guardar una propuesta incluida con «Incluir en…», la página pasa a «Mi negociado» con ese negociado
  elegido, para que se vea la entrada (antes se quedaba en Seguimiento y «Mi negociado» seguía en el anterior).

## Versión 2026-11-12 · 4: las propuestas de META sin negociado ya no se quedan en el limbo

- En «Seguimiento», las propuestas de META que no casan con ningún negociado dicen por qué:
  «sin negociado en META» (el expediente no tiene negociado asignado) o ««X» no está en Ajustes» (el negociado de
  META no figura en «Negociado en el Gestor»; al añadirlo, se reparten solas).
- PROCOR las incluye con «📋 Incluir en…», eligiendo el negociado convocado en el desplegable.

## Versión 2026-11-12 · 3: el asunto en su línea y el texto debajo en el informe

- En la vista previa, el PDF y el Word, cada asunto sale en negrita en su propia línea (con su viñeta) y lo que
  se escribe va debajo, con sus saltos de línea, en vez de salir pegado («RDO: SOLICITUD GAR. PARECER: …»).
- Ya no se añade un punto detrás del asunto.

## Versión 2026-11-12 · 2: sin la pantalla de identificarse al quitar

- **Caso real:** al pulsar quitar, al usuario le salía la pantalla para identificarse en Colabora. Así contesta Colabora
  cuando se intenta borrar **sin permiso de eliminar en ese elemento**, aunque la lista diga «Colaborar».
- Ahora, antes de quitar, se pregunta a Colabora qué puede hacer el usuario con esa entrada
  (`items(id)?$select=EffectiveBasePermissions`, solo lectura):
  - **eliminar** → a la papelera;
  - **solo editar** → se aparta del punto (`PuntoId = 0`);
  - **ninguna de las dos** → se le dice que pida a PROCOR que la quite o que le dé «Colaborar» en «PS Aportaciones».
  - En ningún caso se manda una orden sin permiso.
- **Para el administrador:** si a alguien con «Colaborar» le pasa, ese usuario no tiene «eliminar» en ese elemento.
  Puede ser por permisos propios del elemento, por otro grupo con menos permisos o por «Crear y editar: solo sus
  elementos» en la configuración avanzada de la lista.

## Versión 2026-11-12 · 1: quitar lo escrito

- **Problema:** un usuario con «Colaborar» marcaba «Sin novedad» (o escribía una entrada) y luego no podía quitarlo.
  La orden de mandar a la papelera (`recycle()`) iba **sin cuerpo** y con Content-Type JSON. El resto de aplicaciones
  la mandan con `{}` y ahí «Eliminar» funciona. Ahora va con `{}`.
- **Segunda vía:** si Colabora aun así no deja llevarlo a la papelera (por ejemplo, sin permiso de eliminar), la entrada
  o el «Sin novedad» se **aparta del punto** (`PuntoId = 0`). Eso solo necesita poder editar, como para escribirla.
  Desaparece del negociado, del seguimiento y del informe.
- Si no se puede de ninguna de las dos formas, se dice el porqué de cada una. Si al escribir una entrada no se puede
  quitar el «Sin novedad» anterior, ya no se calla: sale como aviso.
- Simulación: quitar «Sin novedad» y, con borrado denegado, apartarlo. El simulacro rechaza `recycle()` sin cuerpo.

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
