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

Resultado de `prueba-permisos.html` (8 oct 2026, solo recuentos):

- **No hay flujos de trabajo** (ni 2010 ni 2013): los cambios de estado los hace el formulario InfoPath
  (`newifs/editifs/displayifs.aspx`, tipo de contenido «Elemento»). Sin versiones ni aprobación de contenido.
- `Estado` (elección): `0-Borrador de Solicitante`, `0-Borrador de Representante`, `1-Pendiente de Aprobar`,
  `2-Aprobado`, `3-Autorizado`, `4-Registrado SIPERDEF`, `5-Rechazado`, `Sin Identificar Solicitante` (por defecto) y,
  fuera de la lista de opciones, `5-Anulado en SIPERDEF`.
- Subestados de texto: `EstadoDeAprobacion` APROBADO / SIN APROBAR; `EstadoDeAutorizacion` AUTORIZADO / SIN AUTORIZAR;
  `EstadoDeRegistro` REGISTRADO / SIN REGISTRAR / Pendiente de Registro.
- Recuentos: 2.516 solicitudes (2.110 registradas); `AutorizarDirecto` en 919 (sin aprobador intermedio); aprobador
  en 1.535, autorizador en 2.316; 75 aprobadores, 43 autorizadores y 12 registradores distintos; representante en 301.
- Grupos con pinta de privilegio: «Aprobadores», «00-Jefes-JSUIGESUR», «JEFES UCO», «Personal de Registro».
- `Empleo` tiene opciones de relleno («Escriba la opción #1…»): el formulario debe tomarlo de la lista `empleos`.
  `JEFE`: 8 opciones (no se muestran). `Unidad0`: búsqueda en `UNIDADES`. `NIF` obligatorio (dato sensible).

Circuito supuesto (por confirmar): borrador → `1-Pendiente de Aprobar` (aprobador) → `2-Aprobado` (autorizador; con
`AutorizarDirecto` se llega aquí sin aprobador) → `3-Autorizado` + «Pendiente de Registro» (Personal de Registro) →
`4-Registrado SIPERDEF`; en cualquier paso `5-Rechazado`.

## Archivos

- `prueba-permisos.html`: diagnóstico específico. Se sube a cualquier biblioteca de Colabora y se pulsa «Analizar».
  Solo lee; el resumen lleva estructura y recuentos (los estados en texto libre se recortan: nada tras «por», «:» o
  «-», ni cifras), las opciones de `JEFE` solo como número y nunca nombres, fechas, motivos ni observaciones. Para
  consultar los flujos de SharePoint 2013 hace dos POST de solo lectura (`contextinfo` y
  `EnumerateSubscriptionsByList`).
- `pruebas/diagnostico.mjs`: prueba con Playwright contra una lista simulada (formato ligero y *verbose*); comprueba
  además que el resumen no contiene nombres ni fechas.
