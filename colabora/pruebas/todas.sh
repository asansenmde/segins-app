#!/bin/sh
# Batería completa de los Gestores (Gestor común y META), original y protegidos (11/11/2026). Uso: sh colabora/pruebas/todas.sh
# Falla si alguna prueba no termina bien. Pasarla siempre antes de entregar, para no perder lo que ya funcionaba.
cd "$(dirname "$0")/../.."
fallos=0
prueba() { nombre="$1"; shift; salida=$(env "$@" 2>&1); rc=$?
  if [ $rc -eq 0 ] && ! echo "$salida" | grep -qE "HAY FALLOS|TimeoutError|ReferenceError|TypeError"; then r=bien; else r=MAL; fallos=$((fallos+1)); fi
  echo "== $nombre: $r"; }
COM=colabora/colabora/tareas-nlt-colabora.html; META=colabora/colabora/tareas-nlt-colabora-mensadef.html
prueba "simulación (original)" node colabora/pruebas/simulacion.mjs
prueba "simulación (original, verbose)" VERBOSE=1 node colabora/pruebas/simulacion.mjs
prueba "simulación (común protegido)" TAREAS_HTML=$COM node colabora/pruebas/simulacion.mjs
prueba "simulación (META protegida)" TAREAS_HTML=$META node colabora/pruebas/simulacion.mjs
prueba "importar desde SENDERO (común protegido)" TAREAS_HTML=$COM node colabora/pruebas/importar.mjs
prueba "quién ve los expedientes (META)" node colabora/pruebas/meta-acceso.mjs
prueba "quién ve los expedientes (META protegida)" TAREAS_HTML=$META node colabora/pruebas/meta-acceso.mjs
prueba "quién ve los expedientes (verbose)" VERBOSE=1 node colabora/pruebas/meta-acceso.mjs
prueba "punto de situación (original)" node colabora/pruebas/punto-situacion.mjs
prueba "punto de situación (META protegida)" TAREAS_HTML=$META node colabora/pruebas/punto-situacion.mjs
[ $fallos -eq 0 ] && echo "TODO BIEN" || { echo "$fallos PRUEBAS CON FALLOS"; exit 1; }
