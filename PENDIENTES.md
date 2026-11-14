# Pendientes

Lista viva: se borra cada punto cuando se haga. Recetas en `SHAREPOINT.md`; reglas en `CLAUDE.md`.
Ordenada el 14/11/2026 (lo hecho, resumido al final). SENDERO y Puntos de Situación se llevan en sus propias sesiones.

## Lo que tiene que hacer el usuario en Colabora

1. **Subir las copias cifradas** (13/11/2026) y abrir cada una en Edge para ver que no sale el código como texto:
   Incidentes 2026-11-12 · 1, Pérdidas 2026-11-05 · 3, VSA 2026-11-06 · 1, Permisos 2026-11-05 · 2 (+ copia de pruebas),
   Gestor de Tareas y **META.html** 2026-11-13 · 2 (META en `…/JSUIGE/aplicaciones/META.html`).
2. **Borrar lo viejo:** la META antigua `tareas-nlt-colabora-mensadef.html` (ahora es `META.html`) y cualquier copia vieja
   subida con otro nombre.
3. **Incidentes · responsables de los avisos:** en Ajustes, «Crear la lista» («INCIDENTES RESPONSABLES»), poner al menos un
   responsable por SUIGE, DIACU e IGE, probar SUIGESUR con «✉ Probar» y dejar la lista en **Leer** para los demás.
4. **META · quién ve qué:** crear desde Ajustes la lista «META MIEMBROS», dar de alta a cada uno en su negociado/departamento
   y dejarla en **Leer** para los demás. La biblioteca del `.html`, solo lectura para los usuarios.
5. **VSA · solicitudes antiguas:** resolver en Accesos las marcadas con 📦 (quedaron en la lista interna «Solicitudes de
   acceso») y crear la alerta «🔔 Avisarme» de la lista «SOLICITUDES ACCESO APLICACIONES» si no la tiene.
6. **Pérdidas:** comprobar con datos reales (34 notificaciones antiguas, casi todas en REMITIDO A M1 sin SUIGES).
7. **Permisos:** pedir al administrador de Colabora que retire la cuenta antigua del usuario (sale al buscarle).
8. **Ruleta del portal:** confirmar que el administrador la ve sin `?admin=1`.

## Pendiente de que el usuario decida

- **Eliminar en Incidentes y Pérdidas:** con «Colaborar» pueden eliminar todos; ¿nivel de permiso propio sin «Eliminar
  elementos» para unidades y SUIGE, o limitar el botón en la página?
- **Pérdidas: permisos por elemento** al remitir (cada pérdida visible solo para su unidad, SUIGE e IGE). Aparcado.
- **Buscar en todos los campos** (regla de `CLAUDE.md`): ¿revisar ya todas las aplicaciones o al tocar cada una?
- **Gestor de Tareas común:** ¿control de acceso con solicitud, como META, o sigue abierto a quien tenga permiso en la lista?
- **Página de diagnóstico de permisos** (solo lectura: qué grupos tienen qué nivel en cada lista). Pedida el 20/10/2026.
- **Nuevo proyecto «Acciones derivadas de inspecciones técnicas»:** esperando la estructura de la plantilla.

## Hecho (resumen)

- **Todas las de Colabora:** autoría y copia **cifrada entera** (`proteger/cifrado.mjs`, 13/11), envío robusto de correo,
  control de acceso con solicitud (lista común «SOLICITUDES ACCESO APLICACIONES», no la interna «Solicitudes de acceso»),
  Ajustes y Accesos solo con Control total.
- **Incidentes 2026-11-12 · 1:** unificada con la de la otra sesión; responsables de los avisos por escalón; adjuntos y
  «Eliminar» con permiso.
- **Pérdidas 2026-11-05 · 3:** búsqueda por nombre/NIF, adjuntos, «Eliminar» con permiso.
- **VSA 2026-11-06 · 1:** solicitudes de acceso arregladas (avisos y lista), lee las antiguas.
- **Permisos 2026-11-05 · 2:** mandos sustitutos, avisos propios al aprobador y al autorizador.
- **Gestor de Tareas / META 2026-11-13 · 2:** (la sesión de SENDERO siguió desde mi 2026-11-10 · 2) quién ve cada
  expediente, Punto de Situación, departamentos de MENSADEF. Batería `colabora/pruebas/todas.sh`.
- **Tareas NLT 16:** tareas desde correos, aspecto como META, «➜ Pasar a META» y quitarla al crearla allí.
