# Operadores CECONSEG · IGE

> Proyecto independiente. Etiqueta: `[CECONSEG]`. Sustituye al formulario InfoPath «ceconseg.xsn» de SUIGESUR (lista
> «Operadores CSEG» de `/et/SUIGESUR/colaborativo/SEGURIDAD`) y lo eleva a IGE (25/11/2026). Hecho con la misma metodología
> y la misma infraestructura que [Incidentes](../incidentes/).

Cada unidad con operadores CECONSEG envía su parte: nº de operadores que entran de servicio (y de tropa), HPS sin
cursar / en trámite / ejecutada, certificados de instrucción de seguridad sin cursar / ejecutados y compromisos de
confidencialidad firmados. Lo valoran su SUIGE, DIACU e IGE.

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
| Periodicidad | Trimestral (un solo parte por unidad y trimestre) + extraordinario (si cambia más del 15 % de los operadores, con su mes) |
| Control | Las unidades obligadas se marcan en Ajustes; «Control trimestral» dice quién falta y permite recordárselo |
| Acceso | Solicitud común («SOLICITUDES ACCESO APLICACIONES», aplicación CECONSEG) y grupo propio `CECONSEG_UNIDADES`; SEGURIDAD_SUIGE… y SEGURIDAD_IGE como en Incidentes |
| Histórico | No se importan los partes de «Operadores CSEG» |

## Puesta en marcha

1. Sube `colabora/ceconseg.html` a la biblioteca del sitio de IGE donde está la de Incidentes y ábrela con Control total.
2. La primera vez sale **«Preparar la aplicación»**: crea la lista **CECONSEG OPERADORES** con sus 31 columnas.
3. En **Ajustes**: crea la lista **CECONSEG UNIDADES** y marca las unidades obligadas (de M3N, agrupadas por mando de
   2.º nivel); crea la lista de responsables (**CECONSEG RESPONSABLES**) y pon al menos uno por SUIGE.
4. En **Accesos**: crea el grupo `CECONSEG_UNIDADES`, «Permitir que cualquiera solicite acceso» y da a la lista de partes
   el permiso para guardar a las unidades (como en Incidentes).
5. «Enviarme un correo de prueba» y, en la tabla de responsables, «✉ Probar».

## Listas

- `CECONSEG OPERADORES` (la crea la página): `ESTADO`, `MANDO1N/2N/3N` (número en M1N–M3N), `MN1/MN2/MN3` (nombres), `SUIGES`,
  `ANIO`, `TRIMESTRE` (T1–T4), `TIPODETRAMITE` (TRIMESTRAL / EXTRAORDINARIO), `MESCORRESPONDIENTE`, `ResponsableDeLaInformacion`
  (persona), `ResponsableDelParte`, `NUMEROOPERADORES`, `OPERADORESTROPA`, `HPSSINCURSAR`, `HPSENTRAMITE`, `HPSEJECUTADA`,
  `CERTSINCURSAR`, `CERTEJECUTADO`, `COMPROMISOCONF`, `OBSUNIDAD`, `VALORACIONSUIGE/DIACU/IGE`, `OBSSUIGE/DIACU/IGE`,
  `ObservacionesDelExpediente` (historial, con el resultado de cada correo) y `ModificadoPorTEXTO`.
- `CECONSEG UNIDADES`: `Title` (unidad), `M3N`, `M2N`, `MN2`, `SUIGES`, `Activa`.
- `CECONSEG RESPONSABLES`: responsables de los avisos por escalón (como en Incidentes).
- Se leen `M1N`, `M2N` y `M3N` del sitio (las de Incidentes) y la lista común de solicitudes.

Estados: `BORRADOR` · `DEVUELTO A LA UNIDAD` · `REMITIDO A SUIGE` · `REMITIDO A DIACU` · `REMITIDO A IGE` · `CERRADO`.

## Pantallas

- **Partes registrados**: tu papel, lo que espera tu acción, partes en tramitación, unidades con el parte del trimestre
  anterior enviado, el circuito con sus recuentos y los últimos partes.
- **Pendiente de valoración**: por papel (mis borradores y devueltos, SUIGE, DIACU, IGE), los más antiguos primero.
- **Control trimestral**: unidades obligadas de tu SUIGE (todas, si eres de IGE) con su parte trimestral y «✉ Recordar».
- **Búsqueda y consulta**: busca en todos los campos, filtros, CSV e impresión de la relación.
- **Estadísticas e informes**: por SUIGE (último parte enviado de cada unidad en el periodo): operadores, HPS y su % de
  ejecutadas, certificados, compromisos y valoraciones; informe oficial para imprimir / PDF con las unidades que faltan.
- **Ficha**: datos, pasos del circuito, valoraciones, historial, adjuntos, acciones de cada papel e impresión.
- El formulario avisa si las HPS (sin cursar + en trámite + ejecutada) no suman el número de operadores, y no deja un
  segundo parte trimestral de la misma unidad y trimestre.
