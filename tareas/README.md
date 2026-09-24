# Tareas NLT · Gestor de tareas con fecha límite

App web (PWA, funciona sin conexión) para llevar **todo lo que haces** y saber en todo momento
**qué NLT (fecha límite para finalizar) tienes pendientes**.

## Qué hace

- **Mis NLT** (inicio): contador de NLT vencidas, que vencen hoy, en los próximos 7 días y abiertas.
  Las tareas se agrupan por urgencia con semáforo (rojo: vencida u hoy; naranja: quedan pocos días;
  verde: con margen). Alta rápida con título + NLT, búsqueda y filtro por categoría.
- **Tarea**: título, NLT y hora límite (con atajos Hoy / Mañana / +1 semana…), categoría, prioridad,
  estado (pendiente, en curso, en espera, hecha), repetición (diaria, semanal, mensual, anual: al
  terminarla se crea la siguiente con su nueva NLT), notas, pasos con barra de progreso, bitácora de
  avances y **cronómetro** de tiempo dedicado (o minutos añadidos a mano).
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
`icon.svg` y `manifest.webmanifest`, y las capacidades `db`, `user` y `downloads`.

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

Al publicar cambios, sube la constante `VERSION` en `tareas/sw.js`.
