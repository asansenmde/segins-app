# Permisos · Solicitud de Permisos en Colabora

> Proyecto independiente ([PERMISOS]). No comparte código con Tareas Colabora ni con los demás proyectos.

Objetivo: una página en Colabora para **solicitar permisos** y, según el privilegio de cada usuario, **aprobarlos,
autorizarlos o elevarlos**, sobre la lista **«Solicitud de Permisos»** del sitio
`/et/SUIGESUR/colaborativo/CALIDAD-VIDA` (hoy con formulario InfoPath, `newifs.aspx`).

## Estado

En análisis. Estructura conocida (resumen del diagnóstico general, sin datos):

- Listas del sitio: `Solicitud de Permisos` (≈2.500), `Permisos y Vacaciones IGE` (vacía), `UNIDADES` (búsqueda de
  `Unidad0`), `empleos`, `GRADO COBERTURA RPM`, `Workflow Tasks` (vacía: indica flujos de SharePoint 2013).
- Circuito que se deduce de las columnas: **solicitante** (`Solicitante`, o su `RepresentanteDelSolicitante`) →
  **aprobador** (`AprobadorDePermiso`, `EstadoDeAprobacion`, `FechaDeAprobacion`, `Observaci_x00f3_nesAprobador`) →
  **autorizador** (`AutorizadorDelPermiso`, `EstadoDeAutorizacion`, `FechaDeAutorizacion`, `ObservacionesAutorizador`;
  `AutorizarDirecto` salta la aprobación) → **registro en SIPERDEF** (`Registro_x0020_SIPERDEF`, `EstadoDeRegistro`,
  `ObservacionesDelRegistro`). Estado general en `Estado` (elección). Los campos `*Texto`, `Correo de…` y `mensaje…`
  parecen rellenarse para los avisos por correo del flujo.

Pendiente: `prueba-permisos.html` (opciones de las columnas, estados reales y sus combinaciones, flujos, grupos y
permisos del usuario) y la descripción del circuito por cargos.

## Archivos

- `prueba-permisos.html`: diagnóstico específico. Se sube a cualquier biblioteca de Colabora y se pulsa «Analizar».
  Solo lee; el resumen lleva estructura y recuentos (los estados en texto libre se recortan: nada tras «por», «:» o
  «-», ni cifras), las opciones de `JEFE` solo como número y nunca nombres, fechas, motivos ni observaciones. Para
  consultar los flujos de SharePoint 2013 hace dos POST de solo lectura (`contextinfo` y
  `EnumerateSubscriptionsByList`).
- `pruebas/diagnostico.mjs`: prueba con Playwright contra una lista simulada (formato ligero y *verbose*); comprueba
  además que el resumen no contiene nombres ni fechas.
