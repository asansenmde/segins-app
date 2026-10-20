# [INCIDENTES] Incidentes de seguridad en instalaciones (Colabora, sitio JIGE)

Página para la lista de incidentes de seguridad que usa la página del sitio
`/et/jige/colaborativo/SitePages/INCIDENTES DE SEGURIDAD.aspx` en Colabora.

## Estado

1. Diagnóstico (`prueba-incidentes.html`): hecho. Lista «INCIDENTES DE SEGURIDAD» (URL `Lists/INTRUSIONES`).
2. **Página `incidentes.html`**: formulario y circuito del InfoPath reproducidos en la página.

## La página `incidentes.html`

Se sube a una biblioteca de Colabora (la misma que `permisos.html` vale) junto con `img/incidentes-minisdef.png` e
`img/incidentes-uso-oficial.png` (sin la carpeta `img`, al lado de la página: los usan los correos). Consulta el sitio
`/et/jige/colaborativo` con la sesión del usuario.

**Reproduce el formulario InfoPath** `incidentes_de_seguridad.xsn` (se analizó la plantilla; no se copia al repositorio):
mismos campos, textos de ayuda, botones, valores de `ESTADO` y reglas.

### Formulario de notificación («＋ Nuevo parte» y «Completar e informar a SUIGE»)

| Sección | Campos (columna) |
|---|---|
| Datos del responsable de la información | Empleo (lista `empleos` del sitio CALIDAD-VIDA de SUIGESUR; si no se puede leer, los 16 empleos del formulario) · Responsable que va a tramitar la información (`ResponsableDeLaInformacion`; «Gestor identificado correctamente» si eres tú) · Personal que puede visualizar la información (`grupo`; la página mira si la columna admite varias personas o una sola y, si es una, guarda la primera; todas van en `correosPersonasInfo`, reciben los avisos y ven el parte por su correo) |
| BAE afectada (orgánicas y no orgánicas que dependen de la cadena IGE en seguridad de las instalaciones) | Mando de primer nivel (**siempre IGE, bloqueado**) › segundo nivel › unidad, **en cascada** como el InfoPath: listas `M1N` › `M2N` (por `ID_M1N`) › `M3N` (por `M2N`). Se guarda el **número** del elemento en `MANDO1N–3N` y el **nombre** en `MN1–MN3`; al cambiar un nivel se vacían los inferiores |
| Datos del incidente | Tipo · Lugar (provincia, lista `PROVINCIAS`) · Fecha y hora (`FechaNotificacion`) · ¿Zona señalizada? · ¿Reiterada? · Probabilidad · ¿Denuncia? y nº |
| Responda a todas las preguntas | Observación, análisis, medidas, control de medidas, conclusión (con las ayudas del InfoPath) · Aceptación de los protocolos (`ACEPTACION`) · Adjuntos |

- **Guardar borrador**: `ESTADO` = BORRADOR (basta la fecha, que la lista exige). Se puede modificar cuantas veces haga falta.
- **Informar a SUIGE** (botón azul): **solo el responsable de la información**, como en el InfoPath. Exige todos los
  campos y la aceptación. La SUIGE sale del **mando de 2.º nivel** (`MN2`): SUIGESUR, SUIGENOR, SUIGEPIR, SUIGECAN,
  SECOORCEN, DIAPER, DIIN; **MADOC va a la SUIGESUR** (así lo hace la plantilla). Si el mando no tiene SUIGE, avisa y no envía.
  Guarda `ESTADO` = REMITIDO A SUIGE, `ResponsableDelParte`, `SUIGES` (si es una de sus opciones), `Title` = fecha de
  alta, `correosPersonasInfo` = correos del «personal que puede visualizar», y sube los adjuntos.

### Circuito (valores de `ESTADO` que escribe el InfoPath)

| Fase | Quién | Botones | Qué guarda |
|---|---|---|---|
| BORRADOR | responsable / autor | Guardar borrador · Informar a SUIGE | ver arriba |
| REMITIDO A SUIGE | grupo `SEGURIDAD_<SUIGE>` | Informar a DIACU (siempre primero) | `VALORACIONSUIGES`, `ValoradoPorSUIGE`; `ESTADO` = REMITIDO A DIACU |
| REMITIDO A DIACU | `SEGURIDAD_IGE` | Actualizar información · INFORMAR A IGE | `VALORACIONDIACU`, `ValoradoPorDIACU`; al informar, `DIACU` = ELEVADO POR DIACU y `ESTADO` = REMITIDO A M1 |
| REMITIDO A DIACU, pasados 2 días hábiles | grupo `SEGURIDAD_<SUIGE>` | ELEVAR A IGE (sin valoración de DIACU) | `ESTADO` = REMITIDO A M1; anotación en el historial y correo a IGE con copia a la SUIGE |
| REMITIDO A M1 (en IGE) | `SEGURIDAD_IGE` | Valoración de IGE | `valoracionIGE`, `ValoradoPorIGE`; `ESTADO` = VALORADO INCIDENTE POR JIGE |
| VALORADO INCIDENTE POR JIGE / EN SEGUIMIENTO | `SEGURIDAD_IGE` | Cerrar expediente | `ESTADO` = EXP CERRADO (en el InfoPath no hay botón; se hacía a mano). Se puede reabrir con motivo (EN SEGUIMIENTO) |

Los partes antiguos con otros valores se colocan así: ENVIADO → remitido a SUIGE; REMITIDO A IGE → en IGE; CERRADO →
cerrado. Cada trámite se anota con nombre y hora en `ObservacionesDelExpediente`. Antes de guardar se comprueba que
nadie ha cambiado el parte (fecha y estado) y que te corresponde la acción. `REGISTRODEACTIVIDAD` no se toca.

**Quién ve qué**: DIACU e IGE (grupo `SEGURIDAD_IGE`), todo. **Administrar la lista o tener Control total NO da acceso a
los partes de otras SUIGE**. Cada SUIGE, los de su mando de 2.º nivel (o columna `SUIGES`); todos, los que dieron de
alta, de los que son responsables o en los que figuran como «personal que puede visualizar». Filtro en el servidor; si
Colabora no lo admite, se leen solo número, autor, responsable, personas, SUIGES y cadena de mando para localizarlos.
La protección real es la de la lista.

**Pestañas**: Incidentes registrados (recuadros por fase, probabilidad alta, reiterados, denuncias, últimos partes),
Pendiente de valoración y tramitación (mis borradores y lo que espera a mi papel, en rojo; «Ya tramitados por mí» en
verde), Búsqueda y consulta (filtros, agrupada por provincia, unidad, probabilidad, SUIGE, tipo, fase o mes; PDF y CSV),
Estadísticas y Ajustes (solo Control total).

**Correos** (formato oficial, enlace `incidentes.html?id=N`, nunca con los textos del parte), con los asuntos del InfoPath:

| Paso | Asunto | Para | Copia |
|---|---|---|---|
| Informar a SUIGE | NUEVO INCIDENTE DE SEGURIDAD EN ARG <SUIGE> | `SEGURIDAD_<SUIGE>` | personal que puede visualizar |
| SUIGE › DIACU | NUEVO INCIDENTE DE SEGURIDAD VALORADO POR SUIGE | `SEGURIDAD_IGE` | personal que puede visualizar (oculta) |
| DIACU › IGE | INCIDENTE DE SEGURIDAD VALORADO POR DIACU | `SEGURIDAD_IGE` | SUIGE |
| SUIGE › IGE (DIACU fuera de plazo) | INCIDENTE … ELEVADO POR <SUIGE> SIN VALORACIÓN DE DIACU | `SEGURIDAD_IGE` | SUIGE |
| Valoración de IGE | INCIDENTE DE SEGURIDAD ACTUALIZADO | SUIGE | personal que puede visualizar |
| Cierre | … EXPEDIENTE CERRADO | SUIGE | responsable, autor y personal que puede visualizar |

Remitente: el de Colabora («Colaborativo»). Se probó a cambiarlo y el servidor aceptaba el envío pero el correo no llegaba, así que se dejó como estaba. Tras cada envío la página dice a cuántos llegó, qué grupos no dejan ver sus integrantes y ofrece «Enviarlo también desde Outlook». La plantilla InfoPath envía a **buzones escritos a mano**; la página, en cambio, a los **integrantes de los grupos**
de Colabora (no se copian buzones al código). Si un grupo oculta sus integrantes, se ofrece preparar el correo en Outlook.

**Fallos de la plantilla InfoPath** (no se reproducen): las reglas de SUIGEPIR y SECORCEN envían el correo al buzón de
SUIGESUR; la regla de DIIN comprueba DIAPER (un parte de DIIN no se envía); «Actualizar información» de DIACU manda el
correo de «valorado por JIGE».

**Grupos** (constantes `ROLES` y `GRUPO_CORREO` al principio del código): confirmados con los permisos de la lista.
DIACU e IGE comparten `SEGURIDAD_IGE`.

## Archivos

- `prueba-incidentes.html`: diagnóstico. **Solo lee** con la sesión del usuario.
  - **Paso 1**: lista las listas del sitio y marca con ⭐ las que usa la página «INCIDENTES DE SEGURIDAD». Para eso
    busca en la página identificadores de listas y rutas `/Lists/…`; el texto de la página no se guarda.
  - **Paso 2**: «Analizar» una lista da su estructura: columnas (nombre interno, tipo, obligatoria, opciones), vistas,
    tipos de contenido, flujos de trabajo, formularios y los permisos propios en la lista.
  - Recuentos solo de columnas de opciones, sí/no, fechas (por año, pasadas o futuras), números, personas y búsquedas
    (cuántas rellenas y cuántas distintas).
  - **No pide ni enseña textos libres** (asunto, descripción…), nombres de personas ni fechas concretas. De las
    opciones, solo los valores que se repiten 3 o más veces. Las columnas cuyo nombre sugiere personas (jefe,
    responsable, instructor…) dan solo el número de opciones.
  - Se puede subir a **cualquier biblioteca de Colabora** donde se puedan subir archivos (por ejemplo la de
    `permisos.html`): consulta el sitio `/et/jige/colaborativo` con la sesión del usuario.
- `prueba-incidentes.html` · **paso 2 «Analizar el formulario»**: compara la cadena de mando (MANDO1N–3N, MN1–MN4), la
  provincia y el grupo de los partes con las listas auxiliares (M1N–M4N, UNIDADES IGE, PROVINCIAS, UGE) y mira qué listas
  y columnas usa el código del formulario de alta. Solo porcentajes, recuentos y nombres de listas y columnas. Sirve para
  hacer el alta dentro de la página sin romper las vistas de cada SUIGE. Prueba: `pruebas/diagnostico-formulario.mjs`.
- **Nombre REST de MN1–MN4**: su nombre interno empieza por «_» (`_x004d_N1`), y en el REST de SharePoint se llaman
  `OData__x004d_N1`. Pedirlos con el nombre corto daba «HTTP 400» al leer la lista. Además, si Colabora rechaza otra
  columna, la página la quita, repite la lectura y lo avisa en el panel.
- `pruebas/simulacion.mjs`: prueba de la página con un sitio simulado (ligero y *verbose*): papeles, alcance (SUIGE,
  MADOC, «personal que puede visualizar»), el circuito completo, correos, conflicto, formulario (cascada de mandos,
  personas, adjuntos, borrador, informar a SUIGE, solo el responsable), impresión, CSV, estadísticas y enlace. Uso: `node incidentes/pruebas/simulacion.mjs`.
- `pruebas/diagnostico.mjs`: prueba con un sitio simulado (formato ligero y *verbose*, paginación, privacidad).
  Uso: `node incidentes/pruebas/diagnostico.mjs`.

**Plazo de DIACU** (20/10/2026): la SUIGE ya no informa directamente a IGE. Si DIACU no lo eleva en **2 días hábiles**
(sin sábados ni domingos; no descuenta festivos) contados desde la anotación «INFORMADO A DIACU» del historial, la SUIGE
puede elevarlo a IGE desde el día siguiente (`PLAZO_DIACU`). Mientras tanto la ficha dice desde qué día podrá.

## Correo de prueba (Ajustes)

En Ajustes (Control total), «✉ Enviarme un correo de prueba» manda un aviso con el formato nuevo a las direcciones
indicadas (por defecto, la propia). Sirve para distinguirlo del correo con formato antiguo, que no lo envía la página
sino una regla o flujo de trabajo de la lista heredado de InfoPath: desactivarla cuando se confirme que llega el nuevo.

## Autoría y versión protegida para Colabora

© 2026 Cte. Alfredo Sánchez Sender: aviso en la cabecera del HTML, `meta author/copyright` y pie visible con la versión
(no sale al imprimir).

- **`incidentes.html`** es el **original legible** (el que se edita; se guarda en local/repositorio).
- **`colabora/incidentes.html`** es la **copia protegida que se sube a Colabora**. Se regenera con
  `cd incidentes/proteger && npm install && node proteger.mjs` cada vez que cambia el original: código ofuscado
  (javascript-obfuscator, *self-defending*), **bloqueo de dominio** `.mdef.es` (fuera de Defensa no arranca) y sin los
  comentarios internos del HTML y del estilo.
- Probar la copia protegida: `INC_HTML=incidentes/colabora/incidentes.html node incidentes/pruebas/simulacion.mjs`.

## Panel, Estadísticas e Informes (20/10/2026)

- **Panel**: cabecera con el usuario y sus papeles; tarjetas «Esperan mi acción», «Expedientes abiertos», «Partes de
  los últimos 30 días» y «Partes en total»; el **circuito** en colores (borradores › SUIGE › DIACU › IGE › valorados ›
  cerrados), cada fase lleva a la consulta filtrada.
- **Estadísticas**: tarjetas de probabilidad alta o muy alta (abiertos), reiterados, con denuncia, partes del año y
  cerrados (antes en el panel) y barras de colores (probabilidad y fase con su color).
- **Informes** (como VSA): filtros de siempre, agrupar por tipo, SUIGE, provincia, unidad, probabilidad, año,
  trimestre, mes o situación; apartados: resumen, comparativa con totales, evolución mensual, distribución por
  probabilidad y por tipo, lugares con incidentes repetidos, relación de partes y, opcional, el detalle de cada parte
  con sus textos, las valoraciones de SUIGE/DIACU/IGE y el historial (se leen solo al imprimir). Impresión oficial
  (PDF) y CSV. Sin borradores.
