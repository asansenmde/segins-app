[PUNTOS] Recibir asuntos de SENDERO directamente en el Punto de Situación

SENDERO (visor de MENSADEF, versión 2026-11-15 · 4) ya no pasa por META para llevar un mensaje al Punto de Situación: el botón
«★ Al PSIT» abre directamente la página del PSIT de la organización en una pestaña nueva, con los datos en el fragmento de la
dirección (el mismo sistema que usa META, el fragmento no se envía a ningún servidor):

  <dirección de puntos-situacion.html>#importar=<encodeURIComponent(JSON)>

JSON que manda SENDERO:
  v: 1
  origen: "SENDERO"
  destino: "psit"
  id: clave del mensaje en MENSADEF
  asunto, fecha (ISO), de (remitente), firma (quién firma el MENSADEF)
  referencia, suReferencia, expediente
  enlace: dirección del mensaje en MENSADEF
  texto: cuerpo del mensaje en texto (máx. 6000 caracteres)
  departamento: célula de MENSADEF del mensaje (puede no venir)

Objetivo del usuario: un mensaje que solo interesa al Punto de Situación no pasa por META; el PSIT ve de qué célula es y lo
incluye en el negociado que toca, igual que hoy hace con las propuestas que llegan de META («📋 Incluir»).

Lo que debe hacer el PSIT al abrirse con #importar= y destino "psit":
1. Leerlo (también desde window.top si va dentro de la página del portal), validarlo y borrarlo de la dirección con
   history.replaceState, como hace META.
2. Célula → negociado: en Ajustes, cada negociado de «PS Negociados» tiene una columna nueva «Célula de MENSADEF» (una o
   varias, separadas por «;»), como ya tiene «Negociado en el Gestor» para META. Con `departamento` (la célula) se busca el
   negociado; si no casa con ninguno, se pregunta a cuál va (lista de negociados) y se ofrece guardarlo en Ajustes.
3. Abrir ese negociado con la entrada nueva rellena, igual que «📋 Incluir» de una propuesta de META (asunto; en la
   situación, el texto o un extracto; referencia y expediente), para que el usuario la revise y pulse Guardar. No crear
   nada sin que el usuario pulse. Si no tiene permiso en ese negociado, decirlo.
4. Guardarla con Origen = «SENDERO» (añadir esa opción a la columna Origen de «PS Aportaciones» si es una lista de
   opciones), OrigenUrl = enlace y OrigenId = id.
5. Si el punto está cerrado, decirlo claramente.
Nada de esto pasa por META. Probarlo con la simulación del proyecto. Cuando esté, en SENDERO se pone PSIT_DIRECTO = true
(sesión «[MENSADEF] SENDERO»).
