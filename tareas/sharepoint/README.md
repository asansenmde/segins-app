# Tareas NLT · Colabora (SharePoint interno)

Versión de Tareas NLT que se ejecuta **dentro de Colabora** (SharePoint interno del Ministerio) y trabaja
sobre la lista **«Gestor de Tareas»** del sitio `/et/SUIGESUR/JSUIGE`, con la sesión del usuario.
Los datos no salen del servidor: la página no carga nada de internet ni envía nada fuera.

- `tareas-nlt-colabora.html`: la app. Se sube a una biblioteca del sitio y se abre desde allí.
  Lee la lista con la API REST y **solo escribe para dar de alta asuntos nuevos**; no modifica ni borra
  los existentes (para eso, «Editar en Colabora» abre el formulario estándar de SharePoint).
- **Alta de asuntos**: botón «＋ Nuevo asunto» o el campo rápido de *Mis NLT*, que entiende fechas escritas
  («informe de visita antes del viernes urgente» → NLT y prioridad Alta). El formulario rellena asunto, NLT,
  inicio, estado, prioridad, negociado(s), responsable (por defecto el usuario), personal implicado,
  expediente, descripción y observaciones, y crea el elemento con `POST …/items` (FormDigest de
  `/_api/contextinfo`). También copia `NombreResponsable`, `correoResponsable`, `NombreImplicados` y
  `correoimplicados`. Se aplican los permisos de la lista (403 = sin permiso de añadir) y se ejecutan sus
  flujos o alertas como con el formulario normal. Enlace alternativo a `NewForm.aspx`.
- **Avisos por correo** (pestaña *Avisos*): agrupa por responsable los asuntos abiertos que vencen en los
  próximos N días (y los vencidos) y prepara en Outlook, con `mailto:`, un correo por responsable
  (dirección de `correoResponsable` o del usuario; copia opcional a `correoimplicados`). **Lo envía el
  usuario**: la página no manda correos por sí misma. El enlace se limita a ~2000 caracteres. En el detalle
  de cada asunto, «Recordar por correo». También exporta los asuntos propios a Outlook (.ics) con alarma
  N días antes a las 9:00. Para avisos automáticos haría falta un flujo de trabajo en el servidor.
- `prueba-mensadef.html`: diagnóstico para MENSADEF (`mensadef.mdef.es/ambito/2SUIGE`). Se sube a la carpeta
  personal de mensajes y analiza la biblioteca: columnas, tipos de contenido, número de archivos por tipo,
  meses que abarca y qué columnas vienen rellenas. El resumen para copiar no incluye asuntos, nombres de
  archivo ni contenido. Solo GET.
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
