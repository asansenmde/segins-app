# Tareas Colabora · Gestor de Tareas en SharePoint interno

> Proyecto independiente de SEGINS (raíz del repositorio), de la app personal [Tareas NLT](../tareas/) y del
> [visor de MENSADEF](../mensadef/).

Versión de Tareas NLT que se ejecuta **dentro de Colabora** (SharePoint interno del Ministerio) y trabaja
sobre la lista **«Gestor de Tareas»** del sitio `/et/SUIGESUR/JSUIGE`, con la sesión del usuario.
Los datos no salen del servidor: la página no carga nada de internet ni envía nada fuera.

- `tareas-nlt-colabora.html`: **original legible** (el que se edita). © 2026 Cte. Alfredo Sánchez Sender.
- `colabora/tareas-nlt-colabora.html`: **copia protegida, la que se sube a Colabora** (código ofuscado y bloqueado al
  dominio `.mdef.es`). Se regenera tras cada cambio con `cd colabora/proteger && npm install && node proteger.mjs`.
  La app se sube a una biblioteca del sitio y se abre desde allí (o dentro de una página del portal).
  Lee la lista con la API REST y escribe solo para **dar de alta, modificar y comentar** asuntos, con los
  permisos del usuario (403 = sin permiso). **Nunca borra.**
- **Pestaña Tareas** (versión 2026-10-22): cabecera con el usuario y sus asuntos; cinco tarjetas de resumen que filtran
  al pulsarlas (fuera de plazo, vencen hoy, próximos 7 días, en curso, terminados este mes); grupos plegables con
  contador (se recuerda cuáles están abiertos); colores por estado, prioridad y plazo («Retraso de 5 días», «Faltan
  3 días»); botón **Tarjetas / Tabla** compacta; filtros de búsqueda, negociado, responsable, estado y prioridad con
  «Limpiar filtros». Pie de autoría con la versión.
- **Recorrido de estados** (pestaña Tareas): pendientes › en curso › en espera › terminados, con su número; al pulsar uno se
  ven solo esos. La ficha de cada asunto marca su fase. Qué valor de ESTADO cae en cada fase se ajusta en *Ajustes*.
- **Estadísticas** (pestaña propia, con los filtros de la barra): periodo (este mes, trimestre, año, últimos 12 meses o
  todo); abiertos y fuera de plazo hoy, creados y terminados en el periodo, % de NLT cumplida, retraso medio (al terminar
  y de los vencidos) y tiempo medio de resolución; evolución mensual (creados y terminados, también en tabla); abiertos
  por negociado, responsable y prioridad (fuera de plazo / en plazo / sin NLT) con terminados y % en plazo.
  Imprimir / PDF y CSV.
- **Calendario con colores**: fuera de plazo, prioridad crítica o alta y en espera; punto rojo en los días con
  vencidos, número de asuntos por día, fines de semana sombreados, botón «Hoy» y leyenda.
- **Los enlaces de los correos llevan al asunto dentro de la página** (versión 2026-10-23 · 2): el correo de asignación,
  «Recordar por correo», los avisos y las citas de Outlook abren `tareas-nlt-colabora.html?id=N`, que entra directamente en la
  ficha. Se mantienen, como alternativa, «Ver en Colabora» en la ficha y «Prefiero el formulario de Colabora» en el formulario.
- **Expediente = nº de Colabora y estado ⇔ fecha de fin** (versión 2026-10-23 · 3): el expediente es el Id del elemento
  («Exp. N»); al crear se escribe también en `ControlExpediente`, y al modificar uno antiguo se sustituye su texto (que se
  sigue viendo en la ficha y en la búsqueda). Si el estado es de terminado hay que poner la fecha de finalización, y si se
  pone la fecha el estado tiene que ser de terminado. La situación la manda solo el estado: los asuntos antiguos con fecha
  de fin pero estado abierto (o terminados sin fecha) salen como abiertos (o terminados) con un aviso ⚠ hasta corregirlos.
- **Versión 2026-11-11 · 8:** la copia protegida de META se llama **`colabora/colabora/META.html`** (antes
  `tareas-nlt-colabora-mensadef.html`) y se sube a `…/JSUIGE/aplicaciones/META.html`, la dirección que SENDERO trae por
  defecto. El alta desde SENDERO para el PSIT se titula «Pasar directamente al PSIT (queda registrado en META)».
- **Versión 2026-11-11 · 7: Punto de Situación desde SENDERO.** Si `#importar` trae `punto: true`:
  - el alta se titula «📋 Nuevo asunto para el Punto de Situación»;
  - el asunto se crea con `TratarEn = TRATAR CON EL GENERAL` (si la lista tiene la columna);
  - al abrirse la ficha se pulsa solo «📋 Incluir en …» (`psAbrirAlCrear`).

  Si no hay punto abierto o la aplicación no está instalada, lo avisa y el asunto queda marcado como propuesta.
  Prueba: escenario 6b de `punto-situacion.mjs`.
- **Versión 2026-11-11 · 6: departamentos solo en META.** El Gestor común es para otros asuntos y vuelve a sus
  negociados de siempre: «Negociado asignado» (desplegable con las opciones de la lista), «Negociados implicados»,
  filtros con todos los negociados y sin el catálogo de Ajustes. Lo de SENDERO le llega sin departamento. Todo lo de
  departamentos depende de `DEP = PROPIO`; los textos pasan por `tx()`. Del cambio solo le queda el orden nuevo del
  alta (asunto; negociado y responsable con «✎ Cambiar»; lo demás).
- **Versión 2026-11-11 · 5: catálogo de departamentos.**
  - Las opciones de las columnas «Negociado asignado» e «implicados» son el **catálogo de departamentos**, el mismo
    para todos.
  - Se gestiona en Ajustes (Control total) › «🏢 Departamentos (células de MENSADEF)»:
    - «Poner las 12 células de SUIGESUR» (lista dada por el usuario, `CELULAS_SUIGESUR`). Pide confirmar y quita las
      opciones antiguas de la columna.
    - «＋ Dar de alta» otra célula, escrita como en MENSADEF.
    - ✕ para quitar una.
  - Se guarda con MERGE en las dos columnas (`Choices` + `FillInChoice=true`). Para instalarlo en otro sitio, se ponen
    allí sus células.
  - Los filtros (pantalla e informes) muestran el catálogo, más las células que manda SENDERO y las que hay en los
    expedientes. Los negociados antiguos que aún tienen expedientes salen aparte («Antiguos (en expedientes
    anteriores)»).
- **Versión 2026-11-11 · 4:**
  - **Fuera lo antiguo:** solo se ofrecen células de MENSADEF, también en «Quién ve los expedientes». Al modificar a
    alguien, sus departamentos actuales siguen saliendo, para no perderlos.
  - **Alta más clara:** asunto; después, en su propio recuadro, «Departamento asignado» y «Responsable de la
    información», con la ayuda debajo (ya no se solapan); después las fechas, el estado y lo demás. El responsable
    tiene «✎ Cambiar» para poner a otra persona (búsqueda con la cuenta del dominio).
  - **Células automáticas:** SENDERO manda, con cada mensaje, todas las células del usuario (`departamentos`). META
    las guarda en el navegador y las ofrece al elegir el departamento, sin escribirlas.
- **Versión 2026-11-11 · 3: todo junto.** Se juntan dos líneas de trabajo que iban por separado:
  - la de la rama `claude/task-manager-web-nlt-n7elx4` (2026-11-10 · 2): en META cada uno ve sus expedientes y los de
    su negociado (lista «META MIEMBROS», Ajustes › «Quién ve los expedientes de META») e «Incluir en el Punto de
    Situación»;
  - la de esta rama: negociado/responsable desde SENDERO y departamentos = células de MENSADEF.

  Fusión a tres bandas desde la base común (2026-11-09 · 2). En «Quién ve los expedientes», los negociados pasan a
  ser **departamentos**: primero las células de MENSADEF, después los negociados antiguos, y un campo para añadir otra
  célula. El control de acceso compara el nombre tal cual, así que una persona dada de alta en «ET 2SUIGE SEGURIDAD» ve
  los expedientes con ese departamento.
  **Batería:** `sh colabora/pruebas/todas.sh` (simulación, importar, quién ve, punto de situación; original, verbose y
  protegidas). Hay que pasarla antes de entregar.
- **Versión 2026-11-11 · 2: departamentos = células de MENSADEF.**
  - En pantalla, «Negociado asignado / implicados» pasa a **«Departamento asignado / implicados»**. Las columnas de la
    lista son las mismas (`NegociadoAsignado`, `NegociadosImplicados`).
  - **Se ofrecen solo células de MENSADEF:** las que ya están en los asuntos (las que no son opciones antiguas de la
    columna) y las que han llegado desde SENDERO a este navegador. El asignado se escribe o se elige (lista
    desplegable); para los implicados hay casillas y «Añadir otra célula de MENSADEF». Los asuntos antiguos conservan su
    negociado (PROCOR, SEGURIDAD…) y se siguen viendo y filtrando.
  - **Activar una vez (Control total):** Ajustes → «Departamentos de MENSADEF» → «Admitir las células de MENSADEF». Pone
    `FillInChoice=true` en las dos columnas (MERGE en `/fields/getbyinternalnameortitle`). No borra ni cambia nada.
    Mientras no esté activado, al guardar una célula se avisa de que hay que activarlo.
  - **Desde SENDERO:** llega `departamento` (la célula del mensaje) y queda puesto como asignado.
  - **Responsable:** siempre quien crea la tarea (también desde SENDERO). Se cambia buscando en el directorio; las
    sugerencias muestran la cuenta del dominio (`et\usuario`) además del correo.
- **Versión 2026-11-10 · 2: en META, cada uno ve solo lo suyo** (solo META; el Gestor común no cambia salvo el número).
  - Ve un expediente quien lo creó, su responsable, el personal implicado y los miembros de **su negociado** (asignado o
    implicado). Lo ven todos quien tiene Control total y quien se marque «Lo ve todo».
  - Los negociados de cada persona se dan de alta en *Ajustes › Quién ve los expedientes de META* (lista **«META MIEMBROS»**:
    `Persona`, `Negociados` separados por «;», `VeTodo`; la página la crea con «Crear la lista»). Alta buscando en el sitio o
    en el directorio, modificar y quitar (a la papelera). Sin la lista, cada uno ve solo lo que creó, lleva o en lo que interviene.
  - La cabecera dice «3 de 6 asuntos» y la bienvenida qué ve cada uno. Es un **filtro de la página**: quien abra la lista
    directamente en Colabora la ve entera (para eso, permisos de la lista en Colabora).
  - Prueba: `node colabora/pruebas/meta-acceso.mjs` (también `VERBOSE=1` y `TAREAS_HTML=colabora/colabora/META.html`).
- **Versión 2026-11-10 · 1: se juntan la · 2 y la · 3**, que se hicieron por separado en dos sesiones: Ajustes solo con
  Control total (· 2) y «📋 Incluir en el Punto de Situación» solo para los asuntos ⭐ Tratar con el General (· 3).
- **Versión 2026-11-09 · 2: Ajustes solo con Control total**, en el Gestor común y en META.
  - La pestaña Ajustes sale solo a quien tiene «Control total» (permiso «Administrar permisos») en la lista o, si la
    lista no se puede leer, en el sitio. A los demás no les aparece y, si la tenían abierta, vuelven a «Tareas».
  - Esto se hizo la mañana del 09/11 en otra rama (`claude/task-manager-web-nlt-n7elx4`, commit 8fca758), pero sobre
    la versión 2026-10-23 · 3. La copia que salió de allí no tenía Finalizar, Eliminar, Tratar en, etc. Ahora está
    portado a la versión buena.
- **Versión 2026-11-09 · 3:** pasan al punto de situación los asuntos marcados **⭐ Tratar con el General** (decisión del
  usuario): sin esa marca la ficha lo explica y no ofrece incluirlo; incluir no cambia las marcas del asunto. Las
  propuestas para PROCOR serán los asuntos ⭐ que aún no estén en el punto abierto.
- **Versión 2026-11-09 · 2: «📋 Incluir en el Punto de Situación».** Un asunto importante (llegado de SENDERO y dado de
  alta en META) se incluye desde su ficha en el punto de situación abierto de la aplicación **Puntos de Situación de
  SUIGESUR** (proyecto aparte, mismo sitio; ver `PENDIENTES.md`).
  - Recuadro azul en la ficha, bajo «Para tratar en». Si la aplicación aún no está instalada (faltan sus listas), lo dice y
    no hace nada más: **queda preparado** para cuando se instale.
  - «📋 Incluir en PS-año-número» abre un formulario: punto abierto, negociado (el del asunto según «PS Negociados»), asunto
    y situación (de la descripción y el último comentario, corregibles) y prioridad (Alta si el asunto es alta o crítica).
  - Solo deja escribir en los negociados de los que el usuario es miembro; los de PROCOR (coordinación) en todos. Si no
    puede, PROCOR lo verá como propuesta.
  - Crea la entrada en «PS Aportaciones» con `Origen` META, `OrigenLista`, `OrigenId` y `OrigenUrl` (enlace a la ficha), al
    final de su negociado, sin duplicar (en la · 2 ponía además la marca 📋; desde la · 3, no).
  - Después la ficha muestra «✓ Incluido en PS-2026-045 · PRL» y, mientras el punto esté abierto, «✎ Actualizar la situación»
    (relee la entrada y la modifica con `MERGE` + `IF-MATCH`). Tras la hora de cierre no deja tocarla, y si Colabora la
    rechaza por la validación de la lista lo explica.
  - Contrato con la aplicación (sus listas las crea ella al instalarse): «PS Puntos» (`Referencia`, `FechaPunto`,
    `Apertura`, `Cierre`, `EstadoPunto`); «PS Negociados» (`Title`, `Orden`, `NombreGestor` con los valores de
    NegociadoAsignado separados por «;», `Miembros`, `Coordina`, `EnInforme`); «PS Aportaciones» (`Title`, `PuntoId`,
    `Referencia`, `Negociado`, `Situacion`, `Prioridad` Normal/Alta, `Orden`, `CierrePunto`, `Origen`, `OrigenLista`,
    `OrigenId`, `OrigenUrl`).
  - La copia de pruebas usa las listas «PS … PRUEBAS». Prueba: `node colabora/pruebas/punto-situacion.mjs` (también
    `VERBOSE=1` y `TAREAS_HTML=colabora/colabora/…` con las copias protegidas).
- **Versión 2026-11-09 · 1: la copia `--propio` se llama META** («Del mensaje a la tarea»), hermana de SENDERO.
  - Cabecera con un escudo azul marino de filo dorado y la «M» dorada, el nombre en letras espaciadas, el lema y debajo
    «Gestión de expedientes MENSADEF — Cte. Alfredo Sánchez Sender».
  - META sale también en el título de la pestaña, la bienvenida, el pie de autoría y el pie de los informes, y en
    «Preparar META» cuando falta la lista.
  - La lista sigue siendo «Gestor de Tareas MENSADEF» y la memoria la misma: no cambia nada de los datos.
  - El Gestor común y la copia de pruebas solo cambian de número de versión.
- **Versión 2026-11-05 · 2:** la copia `--propio` se presenta como **«GESTIÓN DE EXPEDIENTES MENSADEF»**, en azul marino y
  oro (cabecera con emblema y subtítulo, bienvenida, pestañas y botones), para no confundirla con el Gestor común, que es
  verde. Pendiente, aparcado por el usuario: control de acceso por perfil y negociado (análisis hecho el 05/11/2026).
- **Versión 2026-11-05 · 1: estado del asunto.**
  - **En la ficha:** «✅ Finalizar» (o «↺ Reabrir» si ya está terminado), «Cambiar estado» a cualquiera de los de la
    lista y «🗑 Eliminar».
  - **Finalizar** pone el primer estado de terminado (FINALIZADO) y, si no la tenía, la fecha de fin de hoy.
  - **Reabrir** pone el primer estado «en curso» y quita la fecha de fin. Al cambiar a mano, la fecha se ajusta igual.
  - **Eliminar** pide un segundo clic y manda el asunto a la papelera de reciclaje de Colabora (`recycle()`), de donde se
    puede recuperar.
  - **En la pantalla principal**, cada asunto abierto tiene «✔ Finalizar», que pide un segundo clic para confirmar.
- **Versión 2026-11-04 · 3: marcas «para tratar».** En la ficha, «📋 Punto de situación» y «⭐ Tratar con el General»
  marcan o quitan la marca, y se guarda en Colabora: lo ve todo el que use la lista. La tarjeta lleva la marca, y la pantalla
  inicial tiene un recuadro para cada una, con su lista y «🖨 Imprimir relación» (asunto, estado, prioridad, NLT,
  responsable y último comentario). Usa la columna de opción múltiple `TratarEn`; si falta, en Ajustes la crea con «Crear
  la columna» quien pueda administrar la lista. Hay que crearla en cada lista: común, MENSADEF y pruebas.
- **Versión 2026-11-04 · 2:** en la pantalla inicial se ven todos los terminados (antes solo los 200 últimos), de 200 en 200
  con «Mostrar más», y hay filtro «Terminados desde / hasta» (por la fecha de fin). Nueva copia **Gestor propio de
  MENSADEF** (`node proteger.mjs --propio` → `colabora/META.html` (antes `tareas-nlt-colabora-mensadef.html`)): lista «Gestor de Tareas
  MENSADEF», sin banda roja ni [PRUEBAS]; si falta la lista, ofrece usar la de pruebas cambiándole el nombre (conserva sus
  tareas) o crear una vacía.
- **Versión 2026-11-04 · 1 (buena):** pasan a la copia buena las novedades que estaban solo en la de pruebas (recibir
  mensajes de MENSADEF con «#importar», alta desde correos .msg/.eml, avisos de duplicados, actualización automática), para
  que el visor de MENSADEF pueda crear tareas en el Gestor común. La copia protegida se genera con la protección nueva
  (compactada, sin `</head>`, `<body>` ni `<!--` literales dentro del código; ver `SHAREPOINT.md`).
- **Copia de pruebas** `colabora/tareas-nlt-colabora-pruebas.html` (se genera con `node proteger.mjs --pruebas`): se sube
  junto a la buena sin sustituirla. Trabaja sobre la lista **«Gestor de Tareas PRUEBAS»** y nunca sobre la real (no deja
  cambiarla a otra que no acabe en PRUEBAS); guarda sus preferencias aparte; banda roja «VERSIÓN DE PRUEBAS»; los correos
  llevan «[PRUEBAS]» en el asunto. Si falta su lista, ofrece «Crear la lista de pruebas»: copia vacía de las columnas de
  «Gestor de Tareas» (de la real solo se leen las columnas). La versión 2026-10-27 · 1 está **solo en la copia de pruebas**;
  `colabora/tareas-nlt-colabora.html` sigue siendo la 2026-10-23 · 3 hasta que el usuario la dé por buena.
- **Asuntos desde MENSADEF y desde correos de Outlook** (versión 2026-10-27 · 1; ver `SINCRONIZACION.md`): el visor de
  MENSADEF abre la página con `#importar=<datos>` («➜ Crear tarea en Colabora») y aparece el alta rellena (asunto y, en
  la descripción, origen, referencias, expediente de MENSADEF, enlace y texto). También funciona si el `#` llega a la página
  del portal que la contiene. Los correos se arrastran a la página o se eligen con «✉ Desde correo»: `.msg` (Outlook de
  escritorio) y `.eml` (Outlook en la web), leídos en el navegador. **Sin duplicados**: la descripción lleva
  `Id. mensaje MENSADEF: …` o `Id. correo: …`; si se vuelve a pasar, avisa y enseña el asunto existente.
- **Actualización automática** (cada 2 minutos por defecto, *Ajustes*; 0 = no): con la pestaña visible y sin ficha abierta;
  marca «Nuevo» / «Cambiado» lo que han tocado otras personas hasta que se abre.
- **Dentro de una página del portal** (iframe): los enlaces de los correos y «Ver en Colabora» llevan a la página del
  portal (también con `start.aspx#/…`).
- **Alta de asuntos**: botón «＋ Nuevo asunto» o el campo rápido de *Mis NLT*, que entiende fechas escritas
  («informe de visita antes del viernes urgente» → NLT y prioridad Alta). El formulario rellena asunto, NLT,
  inicio, estado, prioridad, negociado(s), responsable (por defecto el usuario), personal implicado,
  expediente, descripción y observaciones, y crea el elemento con `POST …/items` (FormDigest de
  `/_api/contextinfo`). También copia `NombreResponsable`, `correoResponsable`, `NombreImplicados` y
  `correoimplicados`. Se aplican los permisos de la lista (403 = sin permiso de añadir) y se ejecutan sus
  flujos o alertas como con el formulario normal. Enlace alternativo a `NewForm.aspx`.
- **Modificar un asunto** («✎ Modificar» en la ficha): el mismo formulario del alta, relleno. Solo se envían los
  campos cambiados (`MERGE` a `items(id)`). Antes de guardar se relee el asunto: si otra persona lo ha
  modificado desde que se cargó la lista, no se guarda y se avisa (y `IF-MATCH` con su etag evita pisarlo).
  Opcionalmente manda el correo de asignación a las personas añadidas. Incluye «Fecha finalización».
- **Comentarios** (ficha del asunto): se guardan en la columna elegida en *Ajustes* (Observaciones o Registro de
  actividad; por defecto la que tenga «Anexar cambios al texto existente»). Si la columna anexa, cada comentario
  es una entrada nueva y el historial (autor y fecha) se lee de las versiones del elemento con
  `/_vti_bin/Lists.asmx` `GetVersionCollection`, como en el formulario de Colabora. Si no anexa, el comentario se
  escribe al principio del texto con fecha y autor.
- **Buscar personas** (responsable y personal implicado, varias personas): sugiere al escribir, primero entre los
  usuarios del sitio y después en el directorio, como el selector de personas de SharePoint
  (`clientPeoplePickerSearchUser`). Al elegir a alguien del directorio se le da de alta en el sitio con
  `/_api/web/ensureuser`, igual que el formulario de Colabora. Si «Personal implicado» admitiera una sola
  persona, la página lo respeta.
- **Correo de asignación**: al dar de alta un asunto (casilla marcada por defecto en el formulario) se manda
  un correo al responsable, con copia al personal implicado, con los datos del asunto y el enlace a
  `DispForm.aspx`. Lo envía **el propio Colabora** con su correo saliente (`POST /_api/SP.Utilities.Utility.SendEmail`,
  sin pasar por internet). Si el servidor no lo permite, el detalle del asunto ofrece «Preparar correo de
  asignación» en Outlook (`mailto:`). El botón «Enviar aviso de asignación» del detalle lo vuelve a mandar.
- **Avisos por correo** (pestaña *Avisos*): agrupa por responsable los asuntos abiertos que vencen en los
  próximos N días (y los vencidos) y prepara en Outlook, con `mailto:`, un correo por responsable
  (dirección de `correoResponsable` o del usuario; copia opcional a `correoimplicados`). **Lo envía el
  usuario**: la página no manda correos por sí misma. El enlace se limita a ~2000 caracteres. En el detalle
  de cada asunto, «Recordar por correo». También exporta los asuntos propios a Outlook (.ics) con alarma
  N días antes a las 9:00. Para avisos automáticos haría falta un flujo de trabajo en el servidor.
- **Calendario imprimible**: en la pestaña Calendario, «🖨 Imprimir / PDF» abre el mes en una ventana aparte (A4
  horizontal) con los asuntos abiertos en su NLT y los filtros aplicados; desde ahí se imprime o se guarda en PDF.
  Si el navegador no deja abrir ventanas, se descarga como `.html` para abrirlo e imprimirlo.
- **Estado al crear**: «Remitido al negociado» (como al enviarlo desde Colabora); se cambia en *Ajustes*.
- `pruebas/punto-situacion.mjs`: inclusión de asuntos en el Punto de Situación (instalada o no, permisos, cierre, validación).
- `pruebas/simulacion.mjs`: prueba con Playwright contra un Colabora simulado (`node colabora/pruebas/simulacion.mjs`).
  `pruebas/importar.mjs`: alta desde MENSADEF (también dentro del portal) y desde correos .msg/.eml, duplicados y
  actualización automática (`TAREAS_HTML=colabora/colabora/tareas-nlt-colabora.html` para la copia protegida).
  `VERBOSE=1` simula SharePoint 2013 (*verbose*); `TAREAS_HTML=colabora/colabora/tareas-nlt-colabora.html` prueba la
  copia protegida; `CAPTURAS=<carpeta>` guarda capturas del panel.
- `prueba-sharepoint.html`: página de diagnóstico que comprueba si el sitio ejecuta páginas propias y
  lista las listas y columnas (sin contenido).

- **Avisos por correo con envío robusto** (versión 2026-10-22 · 3, como Permisos; receta «Envío robusto» de `SHAREPOINT.md`): si
  Colabora rechaza una dirección («destinatario válido»), el aviso se reenvía uno a uno, por la cuenta de la persona y,
  si tiene una cuenta antigua sin buzón, a su otra cuenta con su mismo nombre. Quien tramita ve a quién llegó y a quién
  no, y cada aviso queda anotado en los comentarios del asunto. En *Ajustes*, «Correo de prueba».

## Correspondencia de columnas

| App | Columna de «Gestor de Tareas» (nombre interno) |
|---|---|
| Asunto | `Title` |
| NLT | `FechaVencimiento` |
| Estado (valor real) | `ESTADO` — se clasifica en pendiente / en curso / en espera / terminada; ajustable en *Ajustes* |
| Prioridad | `Prioridad` |
| Responsable | `ResponsableDeLaInformacion` (o `NombreResponsable`) |
| Implicados | `PersonalImplicado0` (o `NombreImplicados`) |
| Negociado | `NegociadoAsignado`, `NegociadosImplicados` |
| Expediente | `ControlExpediente` |
| Descripción | `DescripcionDelAsunto` (o `Descripcion`) |
| Observaciones | `Comentarios` |
| Registro | `REGISTRODEACTIVIDAD` |
| Inicio / fin | `FechaDeInicio` / `fECHAFINALIZACION` (con fecha de finalización cuenta como terminado) |

Funciona con JSON ligero y, si el servidor no lo admite, con el formato *verbose* de SharePoint 2013.
Requiere Edge o Chrome (no modo Internet Explorer).
