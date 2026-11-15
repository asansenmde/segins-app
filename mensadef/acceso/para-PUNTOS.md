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

Lo que debe hacer el PSIT al abrirse con #importar= y destino "psit":
1. Leerlo (también desde window.top si va dentro de la página del portal), validarlo y borrarlo de la dirección con
   history.replaceState, como hace META.
2. Abrir «Mi negociado» con una entrada nueva rellena (asunto; en la situación, el texto o un extracto; referencia y
   expediente), en el negociado del usuario, para que la revise y pulse Guardar. No crear nada sin que el usuario pulse.
3. Guardarla con Origen = «SENDERO» (añadir esa opción a la columna Origen de «PS Aportaciones» si es una lista de
   opciones), OrigenUrl = enlace y OrigenId = id.
4. Si el usuario no tiene negociado o el punto está cerrado, decirlo claramente.
Nada de esto pasa por META. Probarlo con la simulación del proyecto.
