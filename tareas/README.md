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

## Datos

Todo se guarda **solo en el navegador** (localStorage), sin servidor. Cada dispositivo tiene sus
propios datos: usa *Descargar copia de seguridad* y *Restaurar copia* para pasarlos de uno a otro.

## Uso

Se publica junto a SEGINS: en GitHub Pages queda en `…/tareas/`. En local:
`python3 -m http.server 8000` y abrir `http://localhost:8000/tareas/`.
Para instalarla en el móvil: Chrome → ⋮ → *Instalar aplicación*; Safari → Compartir → *Añadir a pantalla de inicio*.

Al publicar cambios, sube la constante `VERSION` en `tareas/sw.js`.
