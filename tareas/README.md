# Tareas NLT · Gestor de tareas con fecha límite

App web (PWA, funciona sin conexión) para llevar **todo lo que haces** y saber en todo momento
**qué NLT (fecha límite para finalizar) tienes pendientes**.

## Qué hace

- **Mis NLT** (inicio): contador de NLT vencidas, que vencen hoy, en los próximos 7 días y abiertas.
  Las tareas se agrupan por urgencia con semáforo (rojo: vencida u hoy; naranja: quedan pocos días;
  verde: con margen). Alta rápida con título + NLT, búsqueda y filtro por categoría.
- **Ficha de la tarea**, en seis apartados:
  1. *La tarea*: asunto, referencia correlativa (T-2026-001…), prioridad (crítica, alta, media, baja),
     descripción e instrucciones, categoría y lugar o instalación.
  2. *Quién*: quién la ordena y cuándo, responsable (asignación a otra persona) y colaboradores.
  3. *Plazo y avisos*: NLT con hora, atajos (hoy, +1 semana…), **avisos o alarmas** varios por tarea
     (n días antes del NLT o en una fecha y hora concretas), repetición y tiempo estimado. Cambiar un NLT
     exige indicar el motivo: queda la NLT original y el historial de prórrogas.
  4. *Seguimiento*: estado, avance (automático según los pasos o manual), pasos, dependencias de otras
     tareas (se marca «Bloqueada»), cronómetro y bitácora con historial automático de cambios.
  5. *Observaciones y documentos*: observaciones y enlaces (Drive, SharePoint, web).
  6. *Cierre*: resultado o informe de cumplimiento.
  Desde la ficha se puede **enviar al responsable** (texto listo para correo o WhatsApp) y pasarla al calendario.
- **Avisos**: los que han llegado a su hora aparecen arriba en *Mis NLT* con «Visto» y «Recordar mañana»;
  con la app abierta, además, notificación. Para alarmas con la app cerrada, exportar a calendario (.ics).
- **Google Calendar** (en Ajustes, versión de claude.ai): cada tarea abierta con NLT se convierte en un
  evento de tu calendario con los avisos como alarmas (hasta 5, como mucho 4 semanas antes), en la zona
  horaria del dispositivo. Al cambiar la tarea se actualiza; al terminarla, quitarle el NLT o borrarla,
  el evento se elimina. Usa el conector de Google Calendar de claude.ai (capacidad `mcp`); la marca
  `TNLT<id>` en la descripción evita duplicados si una llamada falla a medias.
- **Espacio de equipo compartido** (versión de claude.ai): cada tarea es *personal* (privada) o de
  *equipo* (la ven y actualizan todos los que tienen acceso a la app). Las de equipo se asignan a un
  miembro por su identidad de claude.ai; el responsable la recibe en «Te han asignado» y confirma con
  «Enterado», que ve quien la encargó. La bitácora muestra quién hizo cada anotación. Los avisos, los
  «recordar mañana» y los eventos de Google Calendar de una tarea de equipo son de su responsable (o de
  quien la creó si está sin asignar) y se guardan en su espacio privado. Quien solo tiene permiso de
  consulta ve el equipo pero no puede modificarlo. Para añadir a alguien: *Compartir* en claude.ai e
  invitarle por correo con permiso «Puede editar». Borrar todo o restaurar una copia solo afecta a lo
  personal.
- **Directorio de personas** (en Ajustes): personas con cargo, correo y teléfono; filtro por responsable («mías» o
  «delegadas») y tabla de carga de trabajo por responsable en *Lo que hago*.
- **Tablero** por estados: arrastrar y soltar en escritorio, botones ◀ ▶ en el móvil.
- **Calendario** mensual con las NLT de cada día; se pueden crear tareas en un día concreto.
- **Lo que hago** (actividad): por periodo (hoy, semana, mes…) muestra tareas hechas, % entregadas
  dentro de NLT, tiempo dedicado por categoría y una cronología de todo. Permite **anotar lo no
  planificado** (llamadas, imprevistos) con su tiempo, copiar un resumen de texto o exportar a CSV.
- **Ajustes**: días de aviso, notificaciones diarias de NLT vencidas/de hoy, exportar las NLT a
  Google Calendar/Outlook (.ics, con aviso el día anterior), categorías, tema claro/oscuro, copia de
  seguridad (.json), restaurar y exportar a Excel (.csv).

## Sincronización entre dispositivos

La versión publicada en claude.ai (https://claude.ai/artifact/9Qqg68wrV3upUSdjZWwZWU) guarda las
tareas en tu cuenta y las sincroniza **en directo** en cualquier móvil, tablet u ordenador donde
inicies sesión en claude.ai (el indicador ☁ ✓ de la barra superior lo confirma). Cada tarea se guarda
por separado y los cambios hechos sin conexión se fusionan al volver. Las tareas son privadas de cada
usuario: aunque compartas el enlace, nadie más ve las tuyas.

Para actualizar esa versión se vuelve a publicar `tareas/index.html` con `app.js`, `app.css`,
`icon.svg` y `manifest.webmanifest`, y las capacidades `db`, `user` (con el ámbito `profile`, para ver los nombres del equipo), `downloads` y `mcp` (Google Calendar: `create_event`, `update_event`,
`delete_event`, `list_events`, `list_calendars`).

### Acceso directo con icono propio

Un enlace de claude.ai siempre se guarda con el icono de Claude. Para tener el icono de Tareas NLT en
la pantalla de inicio se usa `tareas/abrir.html` (publicado en GitHub Pages): se abre en Safari o
Chrome, se añade a la pantalla de inicio y, al tocar el icono, redirige al momento a la versión
sincronizada. Abre el navegador normal, así que usa la sesión de claude.ai ya iniciada.

La copia de GitHub Pages (o abierta en local) guarda los datos **solo en ese navegador**
(localStorage); en *Ajustes → Sincronización* enlaza a la versión sincronizada. Para pasar datos de
una a otra: *Descargar copia de seguridad* y *Restaurar copia*.

## Uso

Se publica junto a SEGINS: en GitHub Pages queda en `…/tareas/`. En local:
`python3 -m http.server 8000` y abrir `http://localhost:8000/tareas/`.
Para instalarla en el móvil: Chrome → ⋮ → *Instalar aplicación*; Safari → Compartir → *Añadir a pantalla de inicio*.

Al publicar cambios, sube la constante `VERSION` en `tareas/sw.js`, `VERSION_APP` en `app.js` y el `?v=` de
`index.html` (así el navegador no reutiliza una copia antigua; la versión se ve en *Ajustes → Datos*).

El visor de claude.ai muestra la app en un marco que **bloquea el envío de formularios**: ningún botón
debe depender de `submit`. Todos son `type="button"` con su propio manejador (y Intro se atiende a mano).
