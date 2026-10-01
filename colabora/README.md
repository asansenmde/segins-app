# Tareas Colabora · Gestor de Tareas en SharePoint interno

> Proyecto independiente de SEGINS (raíz del repositorio), de la app personal [Tareas NLT](../tareas/) y del
> [visor de MENSADEF](../mensadef/).

Versión de Tareas NLT que se ejecuta **dentro de Colabora** (SharePoint interno del Ministerio) y trabaja
sobre la lista **«Gestor de Tareas»** del sitio `/et/SUIGESUR/JSUIGE`, con la sesión del usuario.
Los datos no salen del servidor: la página no carga nada de internet ni envía nada fuera.

- `tareas-nlt-colabora.html`: la app. Se sube a una biblioteca del sitio y se abre desde allí.
  Lee la lista con la API REST y escribe solo para **dar de alta, modificar y comentar** asuntos, con los
  permisos del usuario (403 = sin permiso). **Nunca borra.**
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
- **Estado al crear**: «Remitido al negociado» (como al enviarlo desde Colabora); se cambia en *Ajustes*.
- `pruebas/simulacion.mjs`: prueba con Playwright contra un Colabora simulado (`node colabora/pruebas/simulacion.mjs`).
- `prueba-sharepoint.html`: página de diagnóstico que comprueba si el sitio ejecuta páginas propias y
  lista las listas y columnas (sin contenido).

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
