#!/bin/sh
# Batería completa de SENDERO (10/11/2026): todas las formas de entrar y los dos favoritos, para no romper lo que ya funciona.
# Uso: sh mensadef/pruebas/todas.sh   (tarda unos minutos). Falla si alguna pasada da errores o se para.
cd "$(dirname "$0")"
fallos=0
for v in "FINAL=1" "X=1" "PORTAL=1 FINAL=1" "PORTAL=1 FINAL=1 VENTANA=1" "PORTAL=1 FINAL=1 LENTO=1" "PORTAL=1 SESION=1 FINAL=1"; do
  salida=$(env $v node bandejas.mjs 2>&1)
  if echo "$salida" | grep -q "errores: \[\]" && ! echo "$salida" | grep -q "Error"; then r=bien; else r=MAL; fallos=$((fallos+1)); fi
  echo "== $v: $r"
  echo "$salida" | grep -E "^VISTO|^estado:|visto con filtro|tecla V|leído al abrir|rúbrica:|bandera puesta|comentario:|al añadir a META|bajo el asunto|columna Firma|Sin bandera|agrupar:|responder en MENSADEF|o pasar o firmar|Tarea» junto al asunto|botón derecho|entrada automática|tras iniciar" | cut -c1-110 | sed 's/^/   /'
done
[ $fallos -eq 0 ] && echo "TODO BIEN" || { echo "$fallos PASADAS CON FALLOS"; exit 1; }
