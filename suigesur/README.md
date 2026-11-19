# Centro de Control NLT · SUIGESUR

> Proyecto independiente de SEGINS (raíz), de [Tareas NLT](../tareas/), de [Tareas Colabora](../colabora/) y del
> [visor de MENSADEF](../mensadef/). Etiqueta: `[SUIGESUR]`.

Gestión, seguimiento y análisis de las obligaciones de seguridad de las unidades dependientes de SUIGESUR.
Es una sola página HTML que se sube a Colabora y trabaja con **cuatro listas de SharePoint**, usando la sesión del
usuario. No carga nada de internet ni envía datos fuera del servidor. Los datos solo están en SharePoint: el
navegador recuerda únicamente la pestaña, los filtros y la asignación de columnas.

- `CENTRO_CONTROL_NLT_SUIGESUR.html`: la aplicación (sustituye a la versión anterior, generada con ChatGPT).
- `pruebas/simulacion.mjs`: prueba con Playwright contra un SharePoint simulado, en formato ligero y *verbose*
  (`node suigesur/pruebas/simulacion.mjs`).

## Instalación

1. Sube `CENTRO_CONTROL_NLT_SUIGESUR.html` a la biblioteca `https://colabora.mdef.es/et/SUIGESUR/JSUIGE/aplicaciones`
   sustituyendo el archivo anterior («Reemplazar» / «Conservar ambos» no: reemplazar). Las listas no se tocan.
2. Ábrelo desde la biblioteca en Edge o Chrome. El sitio (`/et/SUIGESUR/JSUIGE`) se detecta solo a partir de la
   ruta de la página; en *Ajustes* se puede fijar a mano.
3. **Las listas se preparan solas.** Al conectar, la aplicación comprueba las cuatro listas y crea la que falte y las
   columnas que falten, las vuelve a leer para comprobarlas e informa en *Inicio* y *Ajustes*. Solo **añade**: nunca
   borra ni renombra listas, columnas ni datos, y reconoce las columnas de la versión anterior para no duplicarlas.
   Se hace una vez por sesión; si el usuario no tiene permiso «Administrar listas», la página lo indica y basta con que
   el propietario del sitio la abra una vez. El detalle de columnas está plegado en *Ajustes* solo para diagnóstico.
4. Da de alta **una unidad a mano** y comprueba que la cabecera muestra «✔ Verificado en UCO_SUIGESUR · ID n».
   Solo entonces carga el catálogo NLT inicial y, si procede, la relación de unidades (*Ajustes → Catálogos iniciales*,
   con selección previa).

## Listas y columnas

Las columnas se localizan por nombre interno o por nombre visible; si una existe con otro nombre, se asigna en
*Ajustes*. Las de la versión anterior (`NombreUnidad`, `NombreObligacion`, `Notas`, `LinkDocumento`, `AccionNotas`,
`Evento`, `UnidadesIncluidas`…) se reconocen y se siguen rellenando.

| Lista | Columnas (nombre interno) |
|---|---|
| `NLT_MAESTRO` (catálogo) | `Title`(+`NombreObligacion`), `Codigo`, `Descripcion`, `Periodicidad`, `DiaNLT`, `Meses`, `ReglaNLT`, `PlazoDias`, `Categoria`, `Ambito`, `Activa`, `UnidadesHabituales`, `Observaciones` |
| `UCO_SUIGESUR` (unidades) | `Title`(+`NombreUnidad`), `Siglas`, `Ambito`, `Contacto`, `Activa`, `Observaciones` |
| `CONTROL_ENTREGAS` | `Title`, `Unidad`, `SiglasUnidad`, `UnidadID`, `Obligacion`, `ObligacionID`, `Periodo`, `FechaNLT`, `FechaRecepcion`, `FechaValidacion`, `Estado`, `Responsable`, `Referencia`, `Observaciones` |
| `SEGUIMIENTO_EVENTOS` | `Title`(+`Evento`), `TipoEvento`, `Unidad`, `SiglasUnidad`, `UnidadID`, `ObligacionID`, `FechaActivacion`, `FechaLimite`, `FechaCierre`, `Estado`, `Responsable`, `Observaciones` |

ID, fecha de registro y de modificación, autor y editor son las columnas de sistema de SharePoint.

## Escritura verificada

Cada alta o modificación: FormDigest de `/_api/contextinfo` → `POST …/items` en *verbose* con
`__metadata.type = ListItemEntityTypeFullName` (o `MERGE` a `items(id)` con `IF-MATCH: etag`, solo los campos
cambiados y tras comprobar que nadie lo ha modificado) → **relectura del elemento** → comparación columna a columna.
Solo si coincide se confirma; si no, se dice qué columna no se ha guardado. Si una columna no existe, no se envía
nada y se indica cuál falta. Los errores muestran operación, lista, código HTTP, endpoint y mensaje de SharePoint;
*Ajustes* guarda el registro de operaciones de la sesión («Copiar diagnóstico»).

Borrado: solo de registros de entregas, a la **papelera de reciclaje** (`recycle()`), con confirmación y
verificación. Unidades y obligaciones se desactivan, no se borran.

## Estados y cálculo de indicadores

- Estado registrado: Pendiente · Recibido · En revisión · Validado · Requiere subsanación · No aplicable.
- Situación calculada: *pendiente en plazo*, *vencida sin remitir* (NLT superada), *recibida en plazo* o *fuera de
  plazo* (recepción posterior a la NLT, con días de retraso), *validada*.
- **Exigibles** = recibidas + vencidas sin remitir (no cuentan las no aplicables ni las pendientes aún en plazo).
- Puntualidad = en plazo / exigibles · Remisión = recibidas / exigibles · Cumplimiento = validadas / exigibles.
- Incumplimiento = vencida sin remitir o recibida fuera de plazo. Reincidencia = misma unidad y obligación con 2 o
  más incumplimientos.

## Asignación selectiva

El catálogo no genera nada por sí solo. «Asignar obligación» crea un registro por cada **unidad marcada** y cada
**periodo marcado** (NLT propuesta según día y meses del catálogo, editable), omite los que ya existen
(unidad + obligación + periodo) y puede recordar las unidades habituales de esa obligación.
