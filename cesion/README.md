# Cesión de imágenes · IGE

> Proyecto independiente. Etiqueta: `[CESION]`. Sustituye al formulario InfoPath «cesion de imagenes.xsn» de SUIGESUR (lista
> «CESION DE IMAGENES» de su sitio) y lo eleva a IGE (26/11/2026). Hecho con el modelo común de las aplicaciones de Colabora
> (base: [CECONSEG](../ceconseg/), que a su vez sigue a [Incidentes](../incidentes/)).

Cuando una FCS (Guardia Civil, Policía, autoridad judicial…) pide a una unidad imágenes de sus cámaras, la unidad registra la
petición y esta sube escalón a escalón hasta SINTSEG, que resuelve; la respuesta baja igual hasta la unidad, que entrega las
imágenes (si se autorizan) y registra la entrega; la SUIGE lo comprueba y cierra.

## Archivos

- `cesion.html`: el original legible (el que se edita).
- `colabora/cesion.html`: **la copia que se sube a Colabora** (cifrada entera, autoría y bloqueo de dominio). Se genera con
  `cd cesion/proteger && npm install && node proteger.mjs`.
- `img/`: escudo y USO OFICIAL de los correos (los mismos que Incidentes; si ya están junto a su página, no hace falta subirlos).
- `pruebas/simulacion.mjs`: prueba completa contra un SharePoint simulado, en ligero y *verbose*
  (`node cesion/pruebas/simulacion.mjs`; `CES_HTML=cesion/colabora/cesion.html PROXY=1` para la copia protegida).

## Decisiones del usuario (26/11/2026)

| Tema | Decisión |
|---|---|
| Sitio | IGE: `/et/jige/colaborativo` (como Incidentes) |
| Circuito | Escalón a escalón: Unidad → SUIGE informa → DIACU informa → IGE consulta a SINTSEG → **SINTSEG resuelve** → IGE traslada → SUIGE comunica a la unidad → la unidad entrega las imágenes → la SUIGE comprueba y cierra |
| SINTSEG | Hoy fuera de Colabora: IGE le consulta por oficio y **registra su resolución** (con su referencia y el oficio adjunto). Objetivo: que se integre; basta con crear el grupo `SINTSEG_CESION` en Accesos y meter a sus personas, y desde ese momento resuelven ellos en la aplicación |
| Histórico | No se importan las solicitudes de la lista antigua |

## Puesta en marcha

1. Sube `colabora/cesion.html` a la biblioteca del sitio de IGE donde está la de Incidentes y ábrela con Control total.
2. La primera vez sale **«Preparar la aplicación»**: crea la lista **CESION DE IMAGENES** con sus 46 columnas.
3. En **Accesos**: crea el grupo `CESION_UNIDADES`, «Permitir que cualquiera solicite acceso» y da a la lista el permiso
   para guardar a las unidades (como en Incidentes). Si quieres, oculta la biblioteca y las listas.
4. Los avisos usan los responsables de cada SUIGE de Incidentes; crea **CESION RESPONSABLES** en Ajustes solo si alguna SUIGE
   tiene otra persona para esto.
5. DIACU propio (`DIACU_CESION`) y SINTSEG (`SINTSEG_CESION`): créalos en Accesos cuando tengas decididas sus personas.

## Lista `CESION DE IMAGENES`

`ESTADO`, cadena de mando (`MANDO1N/2N/3N`, `NOMBRE1N/2N/3N`, `SUIGES`), `ANIO`, `MESCORRESPONDIENTE`, `ResponsableDeLaInformacion`,
`ResponsableDelParte`; **solicitud**: `CUERPOSOLICITANTE`, `ORGANOSOLICITANTE`, `REFSOLICITANTE`, `FECHASOLICITUD`, `REFERENCIADELSMD`,
`URGENTE`, `MOTIVOSOLICITUD`, `IMAGENESDESDE`, `IMAGENESHASTA`, `CAMARAS`, `PRESERVADAS`, `FECHASOBRESCRITURA`, `OBSUNIDAD`;
**informes**: `INFORMESUIGE/OBSSUIGE`, `INFORMEDIACU/OBSDIACU`, `INFORMEIGE/OBSIGE`, `REFCONSULTASINTSEG`, `FECHACONSULTASINTSEG`;
**SINTSEG**: `RESOLUCIONSINTSEG` (AUTORIZADA / AUTORIZADA CON CONDICIONES / DENEGADA), `OBSSINTSEG`, `REFSINTSEG`, `FECHARESOLUCION`,
`RESOLUCIONREGISTRADAPOR`; **entrega**: `INSTRUCCIONESSUIGE`, `FECHAENTREGA`, `RECEPTOR`, `SOPORTE`, `OBSENTREGA`, `FECHACIERRE`;
`ObservacionesDelExpediente` (historial con el resultado de cada correo) y `ModificadoPorTEXTO`.

Estados: `BORRADOR` · `DEVUELTO A LA UNIDAD` · `REMITIDO A SUIGE` · `REMITIDO A DIACU` · `REMITIDO A IGE` · `CONSULTADO A SINTSEG` ·
`RESUELTO POR SINTSEG` · `RESPUESTA EN LA SUIGE` · `COMUNICADO A LA UNIDAD` · `IMAGENES ENTREGADAS` · `CERRADO`.

## Pantallas

- **Solicitudes**: tu papel, lo que espera tu acción, en tramitación, pendientes de SINTSEG, el circuito con sus recuentos y
  aviso en rojo de las **grabaciones que se sobrescriben en 3 días o menos** sin haberse entregado.
- **Pendiente de mi acción**: por papel (unidad, SUIGE, DIACU, IGE, SINTSEG), las urgentes primero.
- **Búsqueda y consulta**: busca en todos los campos; filtros por fase, SUIGE, año, solicitante y resolución; CSV e impresión.
- **Estadísticas**: por SUIGE (solicitudes, en tramitación, cerradas, urgentes, autorizadas, con condiciones, denegadas,
  entregadas, grabaciones en riesgo, días medios hasta la resolución y hasta el cierre) y gráficos.
- **Informe detallado** (como Incidentes): agrupar por SUIGE, mando, unidad, solicitante, resolución, año, mes o situación;
  indicadores, comparativa, evolución mensual, gráficos, plazos, relación y detalle con historial; imprimir / PDF y Excel.
- **Ficha**: datos, pasos del circuito, informes, resolución, entrega, historial, adjuntos, acciones de cada papel e impresión.
- **Accesos** y **Ajustes** (Control total): modelo común (solicitudes de acceso, grupos, DIACU propio, SINTSEG, ocultar
  biblioteca y listas, responsables).

## Pasar a histórico (26/11/2026)

En **Ajustes** (Control total), «🗄️ Pasar a histórico»: elegir año y meses (por la fecha de alta), «Ver qué entra»,
«Exportar» (ZIP con el Excel de todas las columnas, el historial y los datos personales, los adjuntos y `REGISTRO.txt`),
«Informe del periodo» para el PDF que se remite a IGE y «Borrar lo exportado» (escribiendo «BORRAR <año>»; va a la papelera
de reciclaje de Colabora). Por defecto solo los expedientes cerrados; la casilla «Incluir también los abiertos» es para
empezar de cero.

