# Permisos · Solicitud de Permisos en Colabora

> Proyecto independiente ([PERMISOS]). No comparte código con Tareas Colabora ni con los demás proyectos.

Objetivo: una página en Colabora para **solicitar permisos** y, según el privilegio de cada usuario, **aprobarlos,
autorizarlos o elevarlos**, sobre la lista **«Solicitud de Permisos»** del sitio
`/et/SUIGESUR/colaborativo/CALIDAD-VIDA` (hoy con formulario InfoPath, `newifs.aspx`).

## Estado

Primera versión (8 oct 2026), probada con datos simulados; pendiente de prueba en Colabora. Estructura conocida (resumen del diagnóstico general, sin datos):

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

- `permisos.html`: la página. Se sube a una biblioteca de Colabora (p. ej. Documentos compartidos de CALIDAD-VIDA) y
  se abre desde allí. Pestañas: **Mis solicitudes** (como solicitante o representante; nueva solicitud, borrador y
  envío), **Pendientes de mí** («Esperan mi acción»: aprobar o autorizar, según figures en la solicitud; «Ya tramitadas
  por mí»: las que aprobé, autoricé o rechacé, **agrupadas por persona** como un expediente: días por tipo de permiso
  en el cupo elegido y sus solicitudes con el estado actual; buscador por nombre), **Calendario** de permisos concedidos (y pendientes, opcional) por dependencia y unidad, imprimible en
  PDF, **Consulta** con filtros y exportación a CSV, y **Ajustes** (solo para quien tiene «Control total» en la lista o
  es administrador: permiso «Administrar permisos»; los demás no ven la pestaña y los avisos por correo se envían siempre). Reproduce las acciones, campos y correos del
  formulario InfoPath descritos en `CIRCUITO.md`; cada cambio se guarda solo si nadie ha tocado la solicitud desde que
  se cargó (`IF-MATCH`). El NIF solo se muestra a quien interviene.
  **Registro SIPERDEF**: pestaña aparte, visible solo para el grupo de Colabora «Personal de Registro»: solicitudes
  autorizadas pendientes de registrar (y registradas o anuladas en los últimos 30 días) **agrupadas por unidad**, con
  solicitante, empleo, NIF, tipo, cupo, fechas, días y festivos. Cada fila lleva el botón rojo **«PENDIENTE DE
  REGISTRO»**: al pulsarlo pide confirmación («¿Ya está registrado en SIPERDEF?») y pasa a verde **«REGISTRADO EN
  SIPERDEF»**, el estado final, y a los 2-3 segundos desaparece de pendientes (queda en «Ya registrados o anulados») (también desde la ficha, con la misma confirmación). Relación imprimible
  en PDF y CSV. Ya no aparece en «Pendientes de mí».
  **Alcance por papel**: la página pide al servidor solo las solicitudes en las que el usuario figura (solicitante,
  representante, aprobador, autorizador, registrador o autor) y, si está en un grupo de registro, las autorizadas,
  registradas y anuladas. Quien tiene «Administrar listas» en la lista (gestor) ve todas. Es un filtro de la página:
  la protección real depende de los permisos de la lista en Colabora. Adjuntos: desde el formulario de Colabora.
- **Enlace de los correos**: `permisos.html?id=N` abre la página directamente en esa solicitud (si le corresponde a
  quien la abre). Los correos que envía el formulario InfoPath siguen llevando sus enlaces antiguos.
- `img/`: logo del Ministerio de Defensa y sello «USO OFICIAL», sacados de la plantilla del
  formulario. La página los lleva incrustados (cabecera e impresiones). **Para que salgan en los correos** hay que
  subir los dos archivos `permisos-*.png` a la misma biblioteca que `permisos.html`: el correo los enlaza desde allí
  (los clientes de correo no muestran imágenes incrustadas). Si no están, el correo sale con la cabecera en texto.
- **Impresión / PDF** con formato oficial (logo, «USO OFICIAL», pie con emisor y fecha): ficha de cada
  solicitud (con casillas de firma), relación de la pestaña Consulta según los filtros, calendario del mes y relación
  de registro por unidad.
- **Calendario para llevar el control**: por defecto muestra *mis permisos* (azul) y *los que he aprobado, autorizado
  o registrado* (morado); el selector «Ver» permite solo los míos, solo los tramitados o todos los que puedo ver.
  Debajo, la tabla «Control del mes» con mi papel en cada uno. Exporta a Outlook (`.ics`, días completos; los míos
  marcan «fuera de la oficina»).
- **Otras ayudas**: tabla «Tipo de permiso · Solicitado el · Días concedidos hábiles» (una fila por permiso) (días del permiso menos festivos
  indicados; solo concedidos) por cupo de año en «Mis solicitudes», con el nombre del solicitante arriba (orientativo:
  manda SIPERDEF); en «Pendientes de mí», «Esperan mi acción» en rojo y «Ya tramitadas por mí» en verde;
  «⏳ esperando N días» y «empieza en N días» (en rojo si pasan de 3 días o empieza pronto) en lo pendiente, ordenado
  por fecha de inicio; botón «✉ Enviar recordatorio» al aprobador o autorizador de mi solicitud (correo oficial, uno
  al día); aviso de **solapes** solo cuando la misma persona tiene dos solicitudes en las mismas fechas: al pedirla
  y al aprobador y al autorizador. Que coincidan varias personas de una unidad no se avisa (lo decide quien autoriza).
- **Que no se escape ninguna pendiente**:
  - Se tienen en cuenta todas las cuentas del usuario en el sitio, porque el formulario InfoPath pudo guardar a la persona
    con otra cuenta (formato antiguo `dominio\usuario`). Cuentan las de la misma cuenta de dominio, o las de mismo
    correo y mismo nombre; un buzón compartido no basta.
  - También se busca por el **correo y el nombre** que el formulario InfoPath guarda en cada solicitud
    (`CorreoDelSolicitante`, `CorreoDeAPROBADOR`, `CorreoDeAUTORIZADOR`, `SolicitanteTexto`, `AprobadorTexto`,
    `AutorizadorTexto`). Así aparecen aunque la persona guardada sea otra cuenta. Si Colabora no admite ese filtro, se
    repite la lectura solo por cuentas.
  - El **nombre** se reconoce aunque esté escrito de otra forma («Apellidos, Nombre», tildes, mayúsculas): en el servidor
    se busca el apellido más largo y luego se confirma que coinciden todas las palabras. También cuenta el campo «JEFE»
    si la solicitud no tiene persona en ese papel.
  - Los estados se reconocen aunque cambien mayúsculas, tildes o espacios.
  - Las columnas de persona admiten varias personas.
- **Seguridad del registro**:
  - La pestaña, los NIF de la tabla, la relación impresa y el CSV solo funcionan para el grupo «Personal de Registro»
    (si no se puede leer el grupo, se trata como «no pertenece»).
  - Antes de registrar o anular se vuelve a preguntar al servidor si sigues en el grupo (por si te quitaron con la
    página abierta).
  - Antes de cualquier trámite se comprueba en el servidor que la solicitud no ha cambiado (fecha y estado) y que te
    corresponde la acción.
  - Cada trámite (aprobar, devolver, rechazar, autorizar, registrar, anular) se anota en el historial
    (`RegistroDeBorrador`) con nombre y hora.
  - El NIF solo se pide al servidor para quien interviene; el registro, solo en las autorizadas, registradas o anuladas.
  - En Ajustes, «Comprobar accesos» (solo lectura) enseña tus permisos en la lista, los integrantes del grupo de
    registro, si la lista hereda permisos del sitio y quién tiene acceso, y avisa si hay grupos amplios con lectura.
  - **Límite**: la protección real es la de la lista en Colabora. Quien tenga lectura sobre la lista ve todas las
    solicitudes desde sus vistas. Hay que revisarlo con el propietario del sitio y el oficial de seguridad.
- **Aprobado ≠ concedido**: «2-Aprobado» es solo el visto bueno del jefe; el permiso está **concedido** cuando se
  AUTORIZA (3) o ya está registrado (4). La página lo deja claro en todas partes:
  - estados con texto claro («2 · Aprobado por el jefe · falta AUTORIZAR» en naranja; «3 · ✔ CONCEDIDO» en verde);
  - pasos en la ficha (Solicitud › Aprobación del jefe › AUTORIZACIÓN = concedido › Registro);
  - al pedirlo se elige «Tengo mando intermedio» o «No tengo mando intermedio (directo al autorizador)»;
  - el correo de aprobación avisa «EL PERMISO AÚN NO ESTÁ CONCEDIDO» y el de autorización «ESTÁ CONCEDIDO»;
  - recuadros, calendario, tabla de días y Outlook solo cuentan como concedidos los autorizados o registrados.
  En la lista se siguen guardando los mismos estados del formulario InfoPath.
- Colores: azul marino y oro (página, impresiones y correos), para distinguirla del resto de aplicaciones.
- `CIRCUITO.md`: reglas del formulario InfoPath (sacadas de la plantilla `.xsn`).
- `pruebas/simulacion.mjs`: prueba completa contra una lista simulada (ligero y *verbose*): alta con validaciones,
  aprobar y elevar, devolver sin observaciones, autorizar, registrar, NIF, conflicto, calendario (filtro «Ver», control del mes, .ics), impresión, CSV, espera, solapes,
  recordatorio y resumen de días; escenario «seguridad»: fuera del grupo con la página abierta, estado
  cambiado en el servidor, NIF no pedido por el gestor ajeno y «Comprobar accesos».

- `prueba-permisos.html`: diagnóstico específico. Se sube a cualquier biblioteca de Colabora y se pulsa «Analizar».
  Solo lee; el resumen lleva estructura y recuentos (los estados en texto libre se recortan: nada tras «por», «:» o
  «-», ni cifras), las opciones de `JEFE` solo como número y nunca nombres, fechas, motivos ni observaciones. Para
  consultar los flujos de SharePoint 2013 hace dos POST de solo lectura (`contextinfo` y
  `EnumerateSubscriptionsByList`).
- `pruebas/diagnostico.mjs`: prueba con Playwright contra una lista simulada (formato ligero y *verbose*); comprueba
  además que el resumen no contiene nombres ni fechas.

## Acceso a Registro SIPERDEF por unidad (20/10/2026)

- **Pestaña «Acceso a Registro SIPERDEF»** (quien no es registrador): aviso en rojo («Acceso exclusivo para el personal de
  las Secciones de Personal. Se comprobará…»), formulario con empleo, teléfono, **unidad o unidades** (lista `UNIDADES`),
  cargo en la sección de personal, departamento del perfil (se guarda para comprobarlo), motivo y **declaración
  obligatoria**. Se guarda en la lista «SOLICITUDES ACCESO APLICACIONES» del sitio (no «Solicitudes de acceso»: ese nombre es el
  de la lista interna de SharePoint para pedir acceso al sitio, solo para propietarios; daba 404 a los usuarios) (`Aplicacion` = REGISTRO SIPERDEF) y avisa por
  correo a asansen@et.mde.es.
- **Pestaña «Accesos de registro»** (Control total): preparación (crear las listas «SOLICITUDES ACCESO APLICACIONES» y
  «ASIGNACIONES REGISTRO SIPERDEF», columnas que falten, seguridad: solicitudes «solo sus elementos»; asignaciones las
  leen todos y solo las modifica quien administra la lista, `WriteSecurity` 4); solicitudes pendientes con aviso si el
  departamento del perfil no coincide con la unidad pedida; **aprobar** (alta en «Personal de Registro», asignación de
  unidades y correo), denegar con motivo; **personal de registro actual** con sus unidades para asignarlas o cambiarlas,
  y retirar (sale del grupo y se borra su asignación).
- **Registro**: cada registrador ve, registra, imprime y exporta (y ve el NIF) solo de **sus unidades**. Quien tiene
  Control total o administra la lista ve y registra **todas** (sin estar en el grupo). Transición (`ACC.transicion`): el
  registrador sin unidad asignada sigue viéndolas todas con un aviso; con `false`, no ve ninguna.
- Es un filtro de la página: para que tampoco se vea fuera de ella harían falta permisos por elemento (pendiente).

## Autoría y versión protegida

© 2026 Cte. Alfredo Sánchez Sender (cabecera, `meta author/copyright` y pie con la versión, oculto al imprimir).
`permisos.html` es el original legible; **`colabora/permisos.html`** la copia cifrada que se sube a Colabora
(`cd permisos/proteger && npm install && node proteger.mjs`; bloqueo de dominio `.mdef.es`). Probarla:
`PERM_HTML=permisos/colabora/permisos.html node permisos/pruebas/simulacion.mjs`.

**Lectura sin datos relacionados (20/10/2026):** si al leer las solicitudes SharePoint responde 404 (el usuario no puede
leer la lista `UNIDADES` o la lista de usuarios del sitio, de donde salen la unidad y los nombres), la página las lee sin
`$expand` (personas por su Id y los campos `*Texto` del formulario; unidad por `Unidad0Id`) y muestra un aviso que dice
cuál de las dos no puede leer. Solución en Colabora: «Leer» para «usuarios del dominio» en `UNIDADES` y, en el sitio,
al menos «Lectura restringida». Los errores de carga dicen qué recurso falló.
