[PUNTOS] Quitar del Punto de Situación un asunto pasado desde SENDERO

SENDERO (2026-11-16 · 5) tiene en la ficha «✕ Quitar del PSIT»: quita la marca en SENDERO, deja en MENSADEF el comentario
«Quitado del Punto de Situación por NOMBRE…» y ofrece «Abrir el PSIT», que abre la página del PSIT así:

  <dirección de puntos-situacion.html>#quitar=<encodeURIComponent(JSON)>

JSON: { v: 1, origen: "SENDERO", id: <la clave del mensaje, la misma que llegó como «id» al pasarlo y que el PSIT guarda en
OrigenClave>, asunto, referencia }

Lo que debería hacer el PSIT al abrirse con #quitar=:
1. Leerlo (también desde window.top), validarlo y borrarlo de la dirección con history.replaceState.
2. Buscar en «PS Aportaciones» la entrada con OrigenClave = id (y Origen = SENDERO). Si está, abrirla y ofrecer
   «Eliminar» con confirmación (con los permisos de siempre: solo quien puede editarla; si el punto está cerrado, decirlo).
3. Si no la encuentra, decir «No hay ninguna entrada de este mensaje en el Punto de Situación».
Nada se borra sin que el usuario pulse.
