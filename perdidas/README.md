# [PERDIDAS] Pérdida de documentación

Página de una sola pieza (`perdidas.html`) para la lista **«PERDIDA DOCUMENTACION»** del sitio de Colabora
`/et/jige/colaborativo` (el mismo de Incidentes y VSA). Sustituye al formulario InfoPath `perdida_de_documentacion.xsn`.

- **Se sube a Colabora:** `colabora/perdidas.html` (copia protegida: ofuscada, solo funciona en `*.mdef.es`).
  Regenerarla tras cada cambio: `cd perdidas/proteger && npm install && node proteger.mjs`.
- **Original legible:** `perdidas.html` (es el que se edita).
- © 2026 Cte. Alfredo Sánchez Sender.

## Formulario (el del InfoPath)

Mismos apartados, textos y reglas que la vista «VISTA PRINCIPAL» del `.xsn`:

1. **Datos personales del usuario**: persona del directorio (`Usuario`), apellidos y nombre (`Denunciante`, se copia al
   elegir a la persona, como hacía el InfoPath), NIF (`DNI`, se comprueba la letra; admite NIE) y empleo (`Empleo`).
2. **Lugar donde se extravió**: provincia (lista `PROVINCIAS`).
3. **Unidad a la que pertenece**: mando de 1.er nivel › 2.º nivel › unidad de destino (listas `M1N` › `M2N` › `M3N`, en
   cascada; número en `MANDO1N–3N` y nombre en `MN1–MN3`). La SUIGE sale del mando de 2.º nivel (MADOC → SUIGESUR).
4. **Denuncia**: tramitada en FCS (SI/NO), ¿hubo testigos?, nº de denuncia, fecha y hora de la denuncia
   (`FechaNotificacion`, «antes de las 24 h»), fecha de la pérdida y modo del extravío.
5. **¿Se ha incluido en la BD NT 08_22? (obligatorio)** (`NT08_22`): sin contestar no se puede remitir (regla del InfoPath).
6. **Tipo de documento perdido** (varios) y «Escriba otros documentos» (`OTRO`) si se marca OTRA DOCUMENTACIÓN; `TipoDoc`
   guarda la lista en texto, como el InfoPath.
7. **Circunstancias y detalles** (`Comentario`), **responsable de la unidad que valida** y adjuntos (fotografía, denuncia).

«Guardar borrador» lo puede usar quien la da de alta; **«Remitir INFORMACIÓN» solo el responsable** («Gestor identificado
correctamente»), con confirmación. `REGISTRODEACTIVIDAD` se rellena como en el InfoPath («… por: nombre A las fecha. En
Estado: …»).

## Circuito (decidido por el usuario el 27/10/2026)

BORRADOR › **Remitir** (REMITIDO A M1, aviso a la SUIGE de la unidad) › la **SUIGE revisa**: marca las acciones adoptadas
(la vista «RESPONSABLES DE SEG» del InfoPath), escribe su revisión y la pasa a **EN SEGUIMIENTO** (aviso a IGE) o la
**devuelve a la unidad** › **IGE cierra** (EXP CERRADO; también puede cerrar las que siguen en la SUIGE) y puede reabrir.
Mientras está abierta, el responsable puede «Actualizar información» (se avisa a la SUIGE). En el InfoPath el responsable
cerraba el expediente; aquí cierra IGE. Valores antiguos: ENVIADO = remitida, CERRADO = cerrada, RECHAZADO = devuelta.

Cada trámite se confirma en una caja dentro de la ficha, se guarda sin pisar cambios de otros, se avisa por correo (envío
robusto, como Permisos) y la ficha se cierra con el resultado arriba en la página. Lo que falle después de guardar sale como
aviso, nunca como «No se pudo guardar».

## Columnas que añade la página

La lista no tenía historial ni revisión. En **Ajustes** (Control total) se crean: `ObservacionesDelExpediente` (historial,
nota), `VALORACIONSUIGES` (nota) y `ValoradoPorSUIGE` (sí/no). Mientras falten, la página avisa y no deja tramitar.

## Quién ve qué

- **Acceso**: el **mismo de Incidentes** (grupo `INCIDENTES_UNIDADES`, grupos `SEGURIDAD_*` y lista común «SOLICITUDES DE
  ACCESO» con `Aplicacion = INCIDENTES`): quien notifica incidentes notifica pérdidas, y las solicitudes se resuelven desde
  la pestaña «Accesos» de cualquiera de las dos páginas. Aviso de cada solicitud a asansen@et.mde.es.
- **Notificaciones**: IGE (`SEGURIDAD_IGE`) todas; cada SUIGE, las de sus unidades; el resto, las que dio de alta o de las
  que es responsable.
- **Datos personales** (persona, nombre y NIF del usuario): solo se leen al abrir la ficha, y solo para quien la dio de
  alta, el responsable, su SUIGE e IGE. No se piden en los listados ni salen en informes, estadísticas, CSV ni correos.

## Pestañas

Pérdidas notificadas (panel y circuito), Pendiente de revisión y tramitación, Búsqueda y consulta (filtros por fase,
documento, modo, SUIGE y fechas; agrupar; relación impresa y CSV), Estadísticas, Informes (agrupar por documento, modo,
SUIGE, provincia, unidad, año, trimestre, mes o situación; apartados a elegir; imprimir y CSV), y para Control total
Accesos y Ajustes.

## Pruebas

`node perdidas/pruebas/simulacion.mjs` (SharePoint simulado, formato ligero y *verbose*: unidad, SUIGE, IGE, sin acceso,
correo denegado y columnas que faltan; comprueba también que los listados no piden datos personales). Con
`PER_HTML=perdidas/colabora/perdidas.html` prueba la copia protegida.
