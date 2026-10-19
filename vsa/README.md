# [VSA] Cuestionario de calidad VSA (Colabora, sitio JIGE)

Página para la lista **«CUESTIONARIO DE CALIDAD VSA»** (`Lists/PARTES VSA`) del sitio `/et/jige/colaborativo`:
seguimiento del Acuerdo Marco VS-VSA (servicio de vigilantes de seguridad con y sin armas en las BAE). Reproduce el
formulario InfoPath `cuestionario_vsa.xsn` (se analizó la plantilla; no se copia al repositorio) y añade, como en
Incidentes, el circuito con avisos, la consulta, las estadísticas y los informes.

Se sube a una biblioteca de Colabora junto con `img/vsa-minisdef.png` e `img/vsa-uso-oficial.png` (sin la carpeta
`img`, al lado de la página: los usan los correos).

## Formulario de la BAE («＋ Nuevo cuestionario»)

| Sección | Campos (columna) |
|---|---|
| Cabecera | Año (`A_x00f1_o`), estado del informe; instrucciones y pautas de valoración de la plantilla |
| Novedades | ¿Hay novedad? (`NOVEDADES`, obligatorio) |
| BAE evaluada | Mando de 1.er nivel (siempre IGE, bloqueado) › 2.º nivel › BAE en cascada (listas `M1N` › `M2N` › `M3N`; número en `MANDO1N–3N`, nombre en `M1N–M3N`, SUIGE en `suige`) · Empresa que realiza el servicio (`EMPRESA0`) |
| Responsable que firma | Responsable de la BAE (`ResponsableDeLaInformacion`; «Gestor identificado correctamente») · Personal que puede visualizar (`PersonalVisibilidad`, varias personas) |
| Cuestionario | Las **24 preguntas** de la plantilla (1–15 cumplimiento del PPT/PCAP; 16–24 grado de satisfacción), cada una con puntuación `RESP_n` (las columnas de la 9, 14 y 17 se llaman `RES_9`, `RES_14`, `RES_17`) y observación `OBS_n`; resumen en vivo con la media y las mejorables · Adjuntos |

- **Guardar borrador** (`ESTADO` = BORRADOR) cuantas veces haga falta.
- **Enviar formulario** (`ESTADO` = ENVIADO): solo el responsable de la BAE. Exige novedades, BAE, empresa y las 24
  puntuaciones («0 No Observado» si el servicio no se ha prestado). Si hay «Mejorable» o «Muy mejorable» sin
  observación, pregunta antes de enviar. `Title` = fecha del envío.

## Circuito

| Fase | Quién | Qué guarda |
|---|---|---|
| BORRADOR | responsable de la BAE | formulario |
| ENVIADO (pendiente / EN CURSO) | Negociado de Seguridad de la SUIGE (`SEGURIDAD_<SUIGE>`) | «Enviar valoración»: `VALORACIONSUIGE` = EN CURSO (sigue en la SUIGE), CERRADO (`ESTADO` = CERRADO) o ELEVADO A DIACU; `NegSeg` = quien valora; observaciones obligatorias. «Editar formulario» lo devuelve a la BAE (BORRADOR) y «Rechazar» lo deja RECHAZADO |
| ELEVADO A DIACU | `SEGURIDAD_IGE` | valoración de DIACU y cierre (`ESTADO` = CERRADO), o devolver a la SUIGE |
| CERRADO / RECHAZADO | IGE o quien administra la lista | reabrir con motivo (vuelve a la SUIGE) |

Las valoraciones y anotaciones se añaden con fecha y nombre a `Observaciones` (en la plantilla, «Observaciones por parte
del Negociado»). Antes de guardar se comprueba que nadie ha cambiado el cuestionario.

**Diferencia con la plantilla**: en el InfoPath, «Enviar valoración» deja siempre `ESTADO` = CERRADO; aquí solo si la
valoración es CERRADO, para que «EN CURSO» y «ELEVADO A DIACU» sigan abiertos y DIACU pueda actuar.

**Correos** (la plantilla no envía ninguno; formato oficial, enlace `vsa.html?id=N`): enviado → SUIGE (copia al personal
que puede visualizar); elevado → SEGURIDAD_IGE (copia SUIGE); en curso, devuelto → responsable y autor; cerrado,
rechazado → responsable y autor (copia SUIGE y personal). Tras cada envío, a cuántos llegó, qué grupos no dejan ver sus
integrantes y «Enviarlo también desde Outlook».

**Quién ve qué** (como Incidentes): `SEGURIDAD_IGE`, todo; cada SUIGE, las BAE de su mando de 2.º nivel; todos, los que
crearon, de los que son responsables, los que valoraron o en los que figuran como personal que puede visualizar.

## Control de acceso

**Tiene acceso** quien esté en un grupo de papel (SEGURIDAD_SUIGE…, SEGURIDAD_IGE), en el grupo de responsables de BAE
**`VSA_BAE`** o tenga Control total / administre la lista (constante `ACCESO` al principio del código). **Quien no**, o
quien no pueda leer la lista (403/404), ve en vez de la aplicación «🔒 No tienes acceso» y el formulario
**«Solicitar acceso»**: nombre y correo de su cuenta (no se escriben), empleo y unidad (propuestos con el cargo y el
departamento del directorio, si el servidor los da), mando de 2.º nivel y BAE en cascada o unidad en texto, teléfono,
para qué lo necesita y motivo. Se guarda en la lista **«SOLICITUDES DE ACCESO»** y se avisa por correo al grupo
«Propietarios Colaborativo». Mientras está pendiente, la persona ve su estado.

**Pestaña «Accesos»** (solo Control total):
- **Preparación**: si faltan, botones «Crear la lista» (con sus 14 columnas y «leer y editar solo sus elementos») y
  «Crear el grupo» `VSA_BAE`; y **«Permitir que cualquiera solicite acceso»**: rompe la herencia de permisos de la
  lista de solicitudes y da «Colaborar» al grupo de todos que ya use el sitio («Usuarios del dominio», «Todos»…; si no
  lo encuentra, «Todos» con `ensureuser`). Sin esto, quien no tiene permiso en el sitio no puede ni leer ni escribir en
  la lista y ve «No puedes usar la lista» (con el código del error). Al crear la lista se hace solo.
  Si a la lista le faltan columnas (p. ej. creada a mano), lo dice y ofrece «Crear las columnas que faltan».
- **Solicitudes pendientes**: quién es, empleo, unidad, correo, teléfono, papel y motivo; grupo propuesto según el papel
  (BAE → VSA_BAE; SUIGE → SEGURIDAD_<SUIGE> de su mando; DIACU/IGE → SEGURIDAD_IGE). **«Aprobar y dar acceso»** añade
  a la persona al grupo y le avisa; **«Denegar»** exige motivo y también avisa.
- **Responsables de BAE con acceso** (miembros de VSA_BAE) con «Quitar acceso», y el histórico de solicitudes resueltas.

La comprobación la hace la página. Para que la haga también Colabora, quitar «Usuarios del dominio» de la lista del
cuestionario y dar permiso a los grupos SEGURIDAD_* y VSA_BAE; la lista de solicitudes debe seguir abierta a todos
para que cualquiera pueda pedir acceso.

## Pestañas

Cuestionarios (recuadros por fase, nota media, medias bajas, con novedad), Pendiente de valoración y tramitación,
Accesos (solo Control total), Búsqueda y consulta (agrupada por empresa, BAE, SUIGE, fase, año o mes; PDF y CSV con las 24 respuestas), Estadísticas
(media general, de cumplimiento y de satisfacción; aspectos peor valorados; medias por empresa, SUIGE, BAE y pregunta;
distribución de respuestas; novedades) y Ajustes (solo Control total). Las medias no cuentan «No observado».

Columnas de la lista que la plantilla no usa y la página tampoco: MOTIVO, ACCION, T.Solucion, T.Respuesta,
Parte de la Empresa, Parte, Revision Semestral, MES, Lote, MATERIAL (`ControlDeRegistro`).

## Pruebas

`pruebas/simulacion.mjs`: sitio simulado (ligero y *verbose*): alcance por papel, valoración SUIGE (elevar, devolver,
rechazar), cierre DIACU, conflicto, estadísticas, CSV, formulario (borrador, envío, validaciones, cascada) e impresión.
Control de acceso: usuario sin acceso que lo solicita, sin lista de solicitudes o sin permiso en ella, abrir la lista a todos, aprobar/denegar/quitar y preparación (crear lista y grupo).
Uso: `node vsa/pruebas/simulacion.mjs`.
