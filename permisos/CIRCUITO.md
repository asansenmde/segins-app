# Circuito de «Solicitud de Permisos» según el formulario InfoPath

Sacado de la plantilla `Permisos.xsn` (8 oct 2026): reglas, vistas y conexiones de datos. Sin datos de personas
(las 8 opciones de `JEFE` no se copian aquí). La página [PERMISOS] debe dejar los mismos campos que el formulario
para que ambos convivan.

## Vistas del formulario y quién puede actuar

| Vista | Botones visibles solo si… |
|---|---|
| Edit item (solicitud) | eres el `Solicitante` o su `RepresentanteDelSolicitante` (borradores) |
| APROBADOR | `AprobadorDePermiso` = usuario actual |
| AUTORIZADOR | `AutorizadorDelPermiso` = usuario actual |
| Registro | `Registro_x0020_SIPERDEF` = usuario actual y `Estado` = `3-Autorizado` |
| GESTORES / tramitación | consulta; al abrir una solicitud `4-Registrado SIPERDEF` se muestra la vista Registro |

El privilegio es **ser la persona indicada en la solicitud**, no un grupo (el registrador se asigna en la propia
solicitud; el grupo «Personal de Registro» del sitio agrupa a los 12 registradores).

## Acciones

En todas: al guardar se rellenan `SolicitanteTexto`, `RepresentanteTexto`, `AprobadorTexto`, `AutorizadorTexto`
(nombres) y los `Correo…` (correo del perfil del usuario, servicio `userprofileservice.asmx`). Columnas calculadas:
`MotivoSeleccionado` = `TipoDePermiso`; `ValidacionEstado` = `Estado`; `dia_x0020_mas_x0020_uno` = `FechaDeFin` + 1 día;
`TextoResumen` = `"Solicitado por el : " + Empleo + " D. " + Solicitante + ", el día: " + Created + " "`;
`RegistradorTexto` = nombre del registrador. Validación: `FechaDeFin` ≥ `FechaInicio`.
`RegistroDeBorrador` (HTML) acumula: `" / SOLICITADA APROBACIÓN por: <solicitante> En su Nombre o Representado por. <representante>  A las  <ahora>. En Estado: <estado>"`.
`mensajeAPROBADOR` / `mensajeAutorizador` / `TextoRegistro` solo sirven para avisos en pantalla y se vacían.

### Solicitante / representante (vista Edit item)
- **Guardar borrador**: `Estado` = `0-Borrador de Solicitante` (si es el solicitante) o `0-Borrador de Representante`.
- **Solicitar aprobación**: exige `NIF` y `AprobadorDePermiso`. `Estado` = `1-Pendiente de Aprobar`. Correo
  «CORREO APROBADOR» (para: solicitante; cc: aprobador; asunto «Pendiente de APROBAR un Permiso solicitado por: …»).
- **Solicitar autorización directa** (`AutorizarDirecto` = sí): exige `NIF` y `AutorizadorDelPermiso`.
  `Estado` = `2-Aprobado`, `EstadoDeAprobacion` = `APROBADO`, `FechaDeAprobacion` = ahora. Correo «Correo de Aprobacion y
  Solicitud de AUTORIZACION» (para: solicitante; cc: autorizador; cco: aprobador).

### Aprobador (vista APROBADOR)
- **Aprobar y remitir al autorizador** («elevar»): exige elegir `AutorizadorDelPermiso`. `Estado` = `2-Aprobado`,
  `EstadoDeAprobacion` = `APROBADO`, `FechaDeAprobacion` = ahora. Correo de aprobación y solicitud de autorización.
- **Devolver**: exige `Observaci_x00f3_nesAprobador`. Vuelve a `0-Borrador de Representante` (si hay representante) o
  `0-Borrador de Solicitante`; vacía aprobador, autorizador, `JEFE`, textos y correos. Correo «Devuelto al solicitante».
- **Rechazar**: exige observaciones. `Estado` = `5-Rechazado`. Correo «Rechazo Aprobador» (para: solicitante).

### Autorizador (vista AUTORIZADOR)
- **Autorizar**: `Estado` = `3-Autorizado`, `EstadoDeAutorizacion` = `AUTORIZADO`, `FechaDeAutorizacion` = ahora,
  `EstadoDeRegistro` = `Pendiente de Registro`. Correo «Autorizado» («Permiso Autorizado y con pase a REGISTRO DE SIPERDEF»).
- **Devolver al aprobador**: exige `ObservacionesAutorizador`. `Estado` = `1-Pendiente de Aprobar`, `EstadoDeAprobacion` =
  `SIN APROBAR`, `EstadoDeAutorizacion` = `SIN AUTORIZAR`, vacía fechas, autorizador y correos. Correo «devolucion Autorizador»
  (para: aprobador; cc: solicitante).
- **Devolver al solicitante**: exige observaciones. `Estado` = `0-Borrador de Solicitante`; vacía autorizador y `JEFE`.
- **Rechazar**: exige observaciones. `Estado` = `5-Rechazado`. Correo «Rechazo del autorizador».

### Registro SIPERDEF (vista Registro)
- **Registrado**: `Estado` = `4-Registrado SIPERDEF`, `EstadoDeRegistro` = `REGISTRADO`, `RegistradorTexto` = registrador.
- **Anular**: exige `ObservacionesDelRegistro`. `Estado` = `5-Anulado en SIPERDEF`.

## Correos

Los envía InfoPath Forms Services (7 conexiones de correo). Asuntos con el nombre de quien actúa y el asunto de la
solicitud; el cuerpo es la propia solicitud. La página los enviará con `SP.Utilities.Utility.SendEmail` (correo del
propio servidor) y, si no puede, los preparará en Outlook.

## Listas auxiliares

- `empleos` (`Title`): valores para `Empleo` (la columna de elección tiene opciones de relleno; se guarda el texto).
- `UNIDADES` (`ID`, `Title`): búsqueda `Unidad0`.
