# Operadores CECONSEG · IGE

> Proyecto independiente. Etiqueta: `[CECONSEG]`. Sustituye al formulario InfoPath «ceconseg.xsn» de SUIGESUR (lista
> «Operadores CSEG» de `/et/SUIGESUR/colaborativo/SEGURIDAD`) y lo eleva a IGE (25/11/2026). Hecho con la misma metodología
> y la misma infraestructura que [Incidentes](../incidentes/).

Cada unidad con operadores CECONSEG envía su parte: nº de operadores que entran de servicio (y de tropa), HPS sin
solicitar / en trámite / concedida / denegada (y las que caducan en 6 meses), certificados de instrucción de seguridad sin
cursar / ejecutados y compromisos de confidencialidad firmados. **Todo lo que no esté completo se justifica** (motivos, fechas
previstas, si prestan servicio operadores sin HPS y medidas adoptadas). Lo valoran su SUIGE, DIACU e IGE.

## Archivos

- `ceconseg.html`: el original legible (el que se edita).
- `colabora/ceconseg.html`: **la copia que se sube a Colabora** (cifrada entera, autoría y bloqueo de dominio). Se genera
  con `cd ceconseg/proteger && npm install && node proteger.mjs`.
- `img/`: escudo y USO OFICIAL de los correos (los mismos que Incidentes; si ya están junto a la página de Incidentes, no hace falta subirlos otra vez).
- `pruebas/simulacion.mjs`: prueba completa contra un SharePoint simulado, en ligero y *verbose*
  (`node ceconseg/pruebas/simulacion.mjs`; `CEC_HTML=ceconseg/colabora/ceconseg.html PROXY=1` para la copia protegida).

## Decisiones del usuario (25/11/2026)

| Tema | Decisión |
|---|---|
| Sitio | IGE: `/et/jige/colaborativo` (como Incidentes) |
| Unidades | Cadena de mando M1N › M2N › M3N en cascada, las mismas listas que Incidentes; la SUIGE sale del mando de 2.º nivel |
| Circuito | Unidad → SUIGE → DIACU → IGE, **igual que Incidentes**: la SUIGE valora (BIEN / REGULAR / MAL + observaciones) e informa a DIACU o lo devuelve a la unidad; DIACU valora e informa a IGE (o lo devuelve a la SUIGE); si DIACU no lo eleva en 2 días hábiles, la SUIGE puede elevarlo a IGE; IGE hace la valoración final y cierra (puede reabrir) |
| Periodicidad | **Abierta**: mensual, bimestral, trimestral (la de partida), cuatrimestral, semestral o anual, elegida en Ajustes; un solo parte ordinario por unidad y periodo + extraordinario (si cambia más del 15 % de los operadores, con su mes) |
| Justificación | El desglose de HPS (sin solicitar + en trámite + concedida + denegada) y el de certificados (sin cursar + ejecutados) tiene que sumar el nº de operadores. Si hay operadores sin HPS concedida, certificados sin cursar o compromisos sin firmar, no se envía sin los motivos, las fechas previstas, si prestan servicio sin HPS y, en ese caso o con HPS denegadas, las medidas adoptadas |
| Control | Las unidades obligadas se marcan en Ajustes; «Control de entregas» dice quién falta en el periodo y permite recordárselo |
| Acceso | Solicitud común («SOLICITUDES ACCESO APLICACIONES», aplicación CECONSEG) y grupo propio `CECONSEG_UNIDADES`; SEGURIDAD_SUIGE… y SEGURIDAD_IGE como en Incidentes |
| Histórico | No se importan los partes de «Operadores CSEG» |

## Puesta en marcha

1. Sube `colabora/ceconseg.html` a la biblioteca del sitio de IGE donde está la de Incidentes y ábrela con Control total.
2. La primera vez sale **«Preparar la aplicación»**: crea la lista **CECONSEG OPERADORES** con sus 40 columnas (si se preparó
   con la versión 1, sale «A la lista le faltan 9 columnas · Crearlas ahora»).
3. En **Ajustes**: elige la periodicidad del parte (trimestral si no se toca); crea la lista **CECONSEG UNIDADES** y marca las unidades obligadas (de M3N, agrupadas por mando de
   2.º nivel); crea la lista de responsables (**CECONSEG RESPONSABLES**) y pon al menos uno por SUIGE.
4. En **Accesos**: crea el grupo `CECONSEG_UNIDADES`, «Permitir que cualquiera solicite acceso» y da a la lista de partes
   el permiso para guardar a las unidades (como en Incidentes).
5. «Enviarme un correo de prueba» y, en la tabla de responsables, «✉ Probar».

## Listas

- `CECONSEG OPERADORES` (la crea la página): `ESTADO`, `MANDO1N/2N/3N` (número en M1N–M3N), `MN1/MN2/MN3` (nombres), `SUIGES`,
  `ANIO`, `TRIMESTRE` (código del periodo: M01–M12, B1–B6, T1–T4, C1–C3, S1–S2 o A), `TIPODETRAMITE` (la periodicidad o
  EXTRAORDINARIO), `MESCORRESPONDIENTE`, `ResponsableDeLaInformacion` (persona), `ResponsableDelParte`, `NUMEROOPERADORES`,
  `OPERADORESTROPA`, `HPSSINCURSAR`, `HPSENTRAMITE`, `HPSEJECUTADA`, `HPSDENEGADA`, `HPSCADUCA`, `CERTSINCURSAR`, `CERTEJECUTADO`,
  `COMPROMISOCONF`, `SIRVENSINHPS` (SI/NO), `MOTIVOSHPS`, `FECHAPREVISTAHPS`, `MOTIVOSCERT`, `FECHAPREVISTACERT`, `MOTIVOSCOMP`,
  `MEDIDASUNIDAD`, `OBSUNIDAD`, `VALORACIONSUIGE/DIACU/IGE`, `OBSSUIGE/DIACU/IGE`,
  `ObservacionesDelExpediente` (historial, con el resultado de cada correo) y `ModificadoPorTEXTO`. La periodicidad se guarda en la
  descripción de esta lista (línea «Configuración CECONSEG: {…}»).
- `CECONSEG UNIDADES`: `Title` (unidad), `M3N`, `M2N`, `MN2`, `SUIGES`, `Activa`.
- `CECONSEG RESPONSABLES`: responsables de los avisos por escalón (como en Incidentes).
- Se leen `M1N`, `M2N` y `M3N` del sitio (las de Incidentes) y la lista común de solicitudes.

Estados: `BORRADOR` · `DEVUELTO A LA UNIDAD` · `REMITIDO A SUIGE` · `REMITIDO A DIACU` · `REMITIDO A IGE` · `CERRADO`.

## Pantallas

- **Partes registrados**: tu papel, lo que espera tu acción, partes en tramitación, unidades con el parte del trimestre
  anterior enviado, el circuito con sus recuentos y los últimos partes.
- **Pendiente de valoración**: por papel (mis borradores y devueltos, SUIGE, DIACU, IGE), los más antiguos primero.
- **Control de entregas**: unidades obligadas de tu SUIGE (todas, si eres de IGE) con su parte del periodo y «✉ Recordar».
- **Búsqueda y consulta**: busca en todos los campos, filtros, CSV e impresión de la relación.
- **Estadísticas**: por SUIGE (último parte enviado de cada unidad en el periodo): operadores, HPS (con denegadas y las que
  caducan) y su % de concedidas sobre los operadores, certificados, compromisos, unidades con operadores sin HPS de servicio,
  valoraciones y gráficos de barras. «📑 Informe detallado de este periodo» lleva al informe con el mismo periodo.
- **Informe detallado** (como el de Incidentes): año, periodo, SUIGE y «Agrupar por» (SUIGE, mando de 2.º nivel, unidad,
  periodo, año, valoración SUIGE o IGE) y apartados a elegir: resumen con indicadores, comparativa por grupo (con barra de la
  situación de las HPS), evolución por periodos, gráficos de HPS / certificados / compromisos / valoraciones, unidades con
  menor % de HPS concedida, huecos y justificación, obligadas sin parte, relación de unidades y detalle de cada parte (con el
  historial si se marca). Lo que se ve es lo que se imprime: «🖨 Imprimir informe / PDF» (A4 apaisado, cabecera oficial) y
  «📊 Excel del informe (CSV)» con los grupos y todos los partes.
- **Ficha**: datos, «Situación para el analista» (huecos: cuántos operadores sin HPS y por qué, certificados, compromisos,
  HPS que caducan, si sirven sin HPS) con la justificación de la unidad, pasos del circuito, valoraciones, historial, adjuntos,
  acciones de cada papel e impresión. Las tarjetas marcan «⚠ Sirven sin HPS» o «⚠ n a revisar», y los avisos por correo lo incluyen.
- El formulario no deja enviar si el desglose no cuadra o falta la justificación (solo pide la que hace falta), ni un segundo
  parte ordinario de la misma unidad y periodo.
