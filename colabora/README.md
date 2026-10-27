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
- `pruebas/simulacion.mjs`: prueba con Playwright contra un Colabora simulado (`node colabora/pruebas/simulacion.mjs`).
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
