# Centro de Control NLT · SUIGESUR

> Proyecto independiente de SEGINS (raíz), de [Tareas NLT](../tareas/), de [Tareas Colabora](../colabora/) y del
> [visor de MENSADEF](../mensadef/). Etiqueta: `[SUIGESUR]`.

Gestión, seguimiento y análisis de las obligaciones de seguridad de las unidades dependientes de SUIGESUR.
Es una sola página HTML que se sube a Colabora y trabaja con **cuatro listas de SharePoint**, usando la sesión del
usuario. No carga nada de internet ni envía datos fuera del servidor. Los datos solo están en SharePoint: el
navegador recuerda únicamente la pestaña, los filtros y la asignación de columnas.

- `CENTRO_CONTROL_NLT_SUIGESUR.html`: la aplicación (sustituye a la versión anterior, generada con ChatGPT).
- `colabora/CENTRO_CONTROL_NLT_SUIGESUR.html`: **la copia que se sube a Colabora** (código cifrado, autoría y bloqueo de dominio
  `.mdef.es`). Se genera con `cd suigesur/proteger && npm install && node proteger.mjs` cada vez que cambia el original.
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

## Quién entrega cada obligación y generación de plazos

- Cada obligación tiene «¿Quién debe entregarla?»: *sin definir*, *todas las unidades activas* o *solo las marcadas*
  (p. ej. el estadillo VSA, solo tres unidades). Se guarda en `UnidadesHabituales` (`TODAS` o lista de ID).
- También se define desde la ficha de cada unidad («Obligaciones que debe entregar esta unidad»).
- **Entregas → Generar plazos de un periodo**: para un año y unos meses (2027, 2028…) crea los registros de todas las
  obligaciones periódicas activas **solo para sus unidades obligadas**, con la NLT del catálogo. Las «sin definir» no
  generan nada y lo que ya existe no se duplica. Se puede desmarcar cualquier obligación antes de generar.
- **Asignar** sigue disponible para casos sueltos (una obligación, unidades y periodos a mano, NLT editable).

## Corregir y deshacer

Todo lo que se quita va a la **Papelera de reciclaje** del sitio (`recycle()`), se comprueba releyendo la lista y se
puede restaurar desde allí.

- **Deshacer** el último lote creado (asignación o generación de plazos): botón tras crearlo y aviso en Entregas.
- **Entregas → Corregir asignaciones**: (1) registros de unidades que, según «¿Quién debe entregarla?», no deben
  entregar esa obligación (papelera o «No aplicable»; los recibidos no se tocan); (2) quitar los registros de una
  obligación, unidad o periodo; (3) empezar de cero: todas las entregas a la papelera, escribiendo BORRAR.
- **Entregas**: seleccionar todos los registros del filtro y enviarlos a la papelera.
- **Unidades**: aviso y filtro de posibles duplicados (mismo nombre o siglas), filtro por fecha de alta, selección y
  papelera en bloque de las que no tienen entregas ni eventos (las demás se desactivan). Unidades y obligaciones sin
  registros también se pueden enviar a la papelera desde su ficha.
- Un formulario no se puede enviar dos veces mientras guarda. Si un alta se crea pero no supera la comprobación, la
  lista se relee para que aparezca y no se vuelva a crear.
- Ya no se ofrece la relación de unidades de la versión anterior (creaba duplicados con nombres distintos) y el
  catálogo NLT inicial solo se ofrece con la lista vacía.

## Cambios a lo largo de los años

Todo es editable desde la aplicación: obligaciones nuevas, cambio de día o meses de NLT, de periodicidad o de quién la
entrega, unidades nuevas. Lo que deja de hacerse se **desactiva** (no se borra, para conservar el histórico) y, si
se quiere, sus entregas pendientes que aún no han vencido pasan a «No aplicable». Cada registro guarda su propia NLT,
así que cambiar una regla solo afecta a los plazos que se generen después; los años anteriores no se alteran.

## Asignación selectiva

El catálogo no genera nada por sí solo. «Asignar obligación» crea un registro por cada **unidad marcada** y cada
**periodo marcado** (NLT propuesta según día y meses del catálogo, editable), omite los que ya existen
(unidad + obligación + periodo) y puede recordar las unidades habituales de esa obligación.

## Aspecto e informes como el resto de aplicaciones (24/11/2026, versión 2026-11-24 · 1)

El usuario encontraba la página liosa y los informes no salían bien en PDF. Ahora:
- **Cabecera oficial** (Ministerio de Defensa, USO OFICIAL, banda azul y oro), **pestañas con icono y subtítulo** (con aviso
  en rojo si hay entregas vencidas o eventos vencidos) y pie de autoría con la versión, como Incidentes o Cuadrante.
- **Inicio: «Lo urgente hoy»** arriba, sin filtros: vencidas sin remitir, NLT en los próximos 15 días, recibidas sin validar y
  eventos vencidos; cada recuadro lleva a su lista. Los filtros quedan plegados en «🔎 Filtrar los indicadores» y solo
  afectan a los indicadores de debajo. «Generar plazos de un periodo» está a mano en el Inicio.
- **Informes**: «🖨 Imprimir / PDF» abre el informe en una ventana aparte con la cabecera oficial, en A4 (apaisado si lleva
  tablas anchas), resumen en recuadros de colores, barra de distribución, barras de puntualidad y cumplimiento por unidad
  y obligación, evolución mensual (solo meses con datos), incumplimientos resaltados y pie «Emitido por… · USO OFICIAL».
  Se elige «Guardar como PDF» en el diálogo de impresión. Si el navegador bloquea la ventana, se descarga el informe.
  Word sale con el mismo contenido y estilo; CSV igual que antes.
- **Copia protegida** en `colabora/` (en esta aplicación el cifrado va sin `transformObjectKeys`, que rompía el alta de
  unidades; los nombres de campo ya van cifrados igualmente).

