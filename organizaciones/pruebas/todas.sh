#!/bin/sh
# Batería de [ORGANIZACIONES] (23/11/2026). Uso: sh organizaciones/pruebas/todas.sh
cd "$(dirname "$0")/../.."
fallos=0
prueba() { nombre="$1"; shift; salida=$(env "$@" 2>&1); rc=$?
  if [ $rc -eq 0 ] && echo "$salida" | grep -q "TODO BIEN"; then r=bien; else r=MAL; fallos=$((fallos+1)); echo "$salida" | grep -E "Error|errores"; fi
  echo "== $nombre: $r"; }
prueba "prueba de sitio (ligero)" node organizaciones/pruebas/prueba-sitio.mjs
prueba "prueba de sitio (verbose, SharePoint 2013)" VERBOSE=1 node organizaciones/pruebas/prueba-sitio.mjs
[ $fallos -eq 0 ] && echo "TODO BIEN" || { echo "HAY FALLOS: $fallos"; exit 1; }
