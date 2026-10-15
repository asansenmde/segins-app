# [INCIDENTES] Incidentes de seguridad (Colabora, sitio JIGE)

Página para la lista de incidentes de seguridad que usa la página del sitio
`/et/jige/colaborativo/SitePages/INCIDENTES DE SEGURIDAD.aspx` en Colabora.

## Estado

1. Diagnóstico (`prueba-incidentes.html`): hecho. Lista «INCIDENTES DE SEGURIDAD» (URL `Lists/INTRUSIONES`).
2. **Página `incidentes.html`**: primera versión, para probar en Colabora.

## La página `incidentes.html`

Se sube a una biblioteca de Colabora (la misma que `permisos.html` vale) junto con `img/incidentes-minisdef.png` e
`img/incidentes-uso-oficial.png` (sin la carpeta `img`, al lado de la página: los usan los correos). Consulta el sitio
`/et/jige/colaborativo` con la sesión del usuario.

**Circuito** (los mismos campos que el formulario de Colabora):

| Fase | Quién | Qué guarda la página |
|---|---|---|
| Parte (BORRADOR → REMITIDO A M1) | quien lo da de alta | se hace en el **formulario de Colabora** («＋ Nuevo parte», «Editar el parte»), que rellena la cadena de mando y el grupo |
| Valoración SUIGE | grupo `SEGURIDAD_<SUIGE>` | `VALORACIONSUIGES`, `ValoradoPorSUIGE` = sí, `ESTADO` = EN SEGUIMIENTO |
| DIACU | `SEGURIDAD_DIAPER` o `JDIACU` | `DIACU` = visto / elevado / rechazado, `VALORACIONDIACU`, `ValoradoPorDIACU`; rechazar devuelve a la SUIGE (`ValoradoPorSUIGE` = no) |
| IGE (solo si DIACU eleva) | `SEGURIDAD_IGE` | `valoracionIGE`, `ValoradoPorIGE` = sí |
| Cierre | IGE (o DIACU si fue «visto») | `ESTADO` = EXP CERRADO; IGE o quien administra la lista puede reabrir (con motivo) |

Cada trámite y cada observación se anotan con nombre y hora en `ObservacionesDelExpediente` (historial). Antes de
guardar se comprueba que nadie ha cambiado el incidente (fecha y estado) y que te corresponde la acción.
`REGISTRODEACTIVIDAD` no se toca (es del formulario).

**SUIGE de cada parte**: columna `SUIGES` si está rellena; si no, el nombre del `grupo`; si no, la cadena de mando
(`MANDO1N–3N`, `MN1–MN4`) que contenga SUIGESUR, SUIGENOR, SUIGECAN, SUIGEPIR, SECOORCEN/SECORCEN o DIIN.

**Quién ve qué**: DIACU, IGE y quien administra la lista, todo; cada SUIGE, los suyos (filtro en el servidor por
`SUIGES`, grupo o cadena de mando; si Colabora no admite buscar texto, se leen solo número, SUIGES, grupo y cadena de
mando para localizarlos); el resto, los que dio de alta o en los que figura. La protección real es la de la lista.

**Pestañas**: Panel (recuadros por fase, probabilidad alta, reiterados, denuncias, últimos partes), Pendientes de mí
(«Esperan mi acción» en rojo por papel, los más antiguos primero, ⏳ días en rojo a partir de 7; «Ya tramitados por
mí» en verde), Incidentes (filtros, PDF de la relación, CSV), Estadísticas (barras por tipo, mes, SUIGE,
probabilidad, fase, provincia, reiterado, zona señalizada y denuncia, con los mismos filtros) y Ajustes (solo Control
total).

**Ficha**: pasos del circuito, aviso si hay más partes del mismo tipo en el mismo lugar, datos del parte, los cinco
textos, valoraciones, historial, acciones del papel que toque, «Añadir observación», «Enviar recordatorio», ficha
oficial en PDF y enlaces al formulario de Colabora (adjuntos, editar el borrador).

**Correos** (formato oficial, con enlace `incidentes.html?id=N`; nunca llevan los textos del parte):
valorado por SUIGE → DIACU; visto → SUIGE; elevado → IGE (copia SUIGE); rechazado → SUIGE; valorado por IGE → DIACU
(copia SUIGE); cerrado → SUIGE con copia al responsable, al autor y a `correosPersonasInfo`. Siempre copia a
`correosPersonasInfo`. Los destinatarios son los integrantes de los grupos; si un grupo oculta sus integrantes, se
ofrece preparar el correo en Outlook. Los avisos del formulario InfoPath siguen funcionando aparte.

**Pendiente de confirmar en Colabora**: nombres de los grupos de DIACU e IGE (constantes `ROLES` y `GRUPO_CORREO`
al principio del código).

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
- `pruebas/simulacion.mjs`: prueba de la página con un sitio simulado (ligero y *verbose*): papeles, alcance, las
  cinco acciones, correos, conflicto, impresión, CSV, estadísticas y enlace. Uso: `node incidentes/pruebas/simulacion.mjs`.
- `pruebas/diagnostico.mjs`: prueba con un sitio simulado (formato ligero y *verbose*, paginación, privacidad).
  Uso: `node incidentes/pruebas/diagnostico.mjs`.
