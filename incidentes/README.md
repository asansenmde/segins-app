# [INCIDENTES] Incidentes de seguridad (Colabora, sitio JIGE)

Página para la lista de incidentes de seguridad que usa la página del sitio
`/et/jige/colaborativo/SitePages/INCIDENTES DE SEGURIDAD.aspx` en Colabora.

## Estado

1. **Diagnóstico** (`prueba-incidentes.html`): en curso. Hay que conocer la lista, sus columnas y cómo se usa antes
   de diseñar la página.
2. Página `incidentes.html`: pendiente del diagnóstico y de lo que se quiera hacer con ella.

## Archivos

- `prueba-incidentes.html`: diagnóstico. **Solo lee** con la sesión del usuario.
  - **Paso 1**: lista las listas del sitio y marca con ⭐ las que usa la página «INCIDENTES DE SEGURIDAD». Para eso
    busca en la página identificadores de listas y rutas `/Lists/…`; el texto de la página no se guarda.
  - **Paso 2**: «Analizar» una lista da su estructura: columnas (nombre interno, tipo, obligatoria, opciones), vistas,
    tipos de contenido, flujos de trabajo, formularios y los permisos propios en la lista.
  - Recuentos solo de columnas de opciones, sí/no, fechas (por año, pasadas o futuras), números, personas y búsquedas
    (cuántas rellenas y cuántas distintas).
  - **No pide ni enseña textos libres** (asunto, descripción…), nombres de personas ni fechas concretas. De las
    opciones, solo los valores que se repiten 3 o más veces. Las columnas cuyo nombre sugiere personas (jefe,
    responsable, instructor…) dan solo el número de opciones.
  - Se puede subir a **cualquier biblioteca de Colabora** donde se puedan subir archivos (por ejemplo la de
    `permisos.html`): consulta el sitio `/et/jige/colaborativo` con la sesión del usuario.
- `pruebas/diagnostico.mjs`: prueba con un sitio simulado (formato ligero y *verbose*, paginación, privacidad).
  Uso: `node incidentes/pruebas/diagnostico.mjs`.
