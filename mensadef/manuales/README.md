# SENDERO · Manuales y presentación

> Parte del proyecto MENSADEF (`[MENSADEF]`). © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.

Documentación de SENDERO, versión **2026-11-19 · 5**.

| Documento | Archivos | Público |
|---|---|---|
| Manual de usuario | `SENDERO-manual-de-usuario.docx` / `.pdf` | Cualquier unidad del Ejército de Tierra que use MENSADEF |
| Manual técnico | `SENDERO-manual-tecnico.docx` / `.pdf` | Informática y CIS |
| Presentación | `SENDERO-presentacion.pptx` | Mando |

- **Esquemas** (estilo Visio, en `capturas/esquema-*.svg|png`): en el manual de usuario, entrar, trabajar un mensaje,
  META/PSIT y rúbrica y firma; en el técnico, arquitectura, secuencia de arranque, control de acceso y publicación.
- Las capturas (`capturas/`) salen del **MENSADEF simulado** de `../pruebas/` (datos inventados, sin mensajes ni personas reales).
- **Cifras de rendimiento**: solo la del simulado (0,1 s para 136 mensajes, sin red, no representativa). Las reales están
  marcadas **[MEDIR EN REAL]** en el manual técnico (capítulo 8) y en la lámina 6 de la presentación. Para medir: abrir
  SENDERO, esperar al final de la carga y pasar el ratón por el estado («Carga en N s · M bandejas, 6 a la vez…»).

## Regenerar

Los documentos se generan con los scripts de `fuentes/` (no se editan a mano los Word para no perder los cambios):

```sh
cd mensadef/manuales/fuentes
python3 esquemas.py && node render-esquemas.mjs      # esquemas SVG → PNG
node manual-usuario.js && node manual-tecnico.js && node presentacion.js
python3 convertir.py ../SENDERO-manual-de-usuario.docx ../SENDERO-manual-tecnico.docx   # índice y PDF
```

Necesita Node.js con `docx`, `pptxgenjs`, `react`, `react-dom`, `react-icons` y `sharp`, y LibreOffice con su módulo de
Python (`uno`). Al cambiar SENDERO, actualizar la versión (`VERSION`) y el texto de los scripts, y repetir las capturas con
el simulado si cambia la pantalla (`PRESENTA=dir` y `CAPTURA_*` en `../pruebas/bandejas.mjs`).
