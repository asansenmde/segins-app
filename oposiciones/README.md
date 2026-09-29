# Oposición Guardia Civil · Plan de estudio

App web (PWA, funciona sin conexión) para llevar la preparación de la oposición: qué temas toca
estudiar cada semana, cuánto se domina cada uno, los tests hechos, los artículos que se fallan y un
informe de cómo va todo.

## Qué hace

- **Semana**: se eligen los días y los temas a estudiar (estudio, repaso o test). Cada día se tachan;
  al tacharlo se apunta el tiempo, el nuevo % de dominio del tema y si se completa una vuelta.
  Arriba: temas planificados, hechos y horas estudiadas frente al objetivo semanal. Si la semana está
  vacía, propone los temas que llevan más tiempo sin tocarse.
- **Temario**: cuatro materias (Temario 1-23, Inglés, Psicotécnicos, Gramática y ortografía). Por tema:
  % de dominio, vueltas, días desde la última vez (verde ≤ 7, naranja ≤ 14, rojo más), horas, nota media
  de sus tests y fallos anotados. Los títulos se editan y se pueden añadir o borrar temas.
- **Tests**: fecha, materia, temas, preguntas, aciertos, fallos y en blanco (se calcula solo). La nota
  sobre 10 aplica la penalización de Ajustes (por defecto aciertos − fallos/3). En cada test se anotan
  los **artículos fallados** (ley + artículo + qué se confundió).
- **Artículos fallados**: agrupados por tema y ordenados por veces fallado. «Repasado» los aparta;
  si se vuelve a fallar el mismo artículo, reaparece.
- **Informe**: avance del temario, temas sin estudiar, horas de la semana, media de los últimos 5 tests,
  avance por materia, evolución de la nota, horas por semana (8 semanas), temas pendientes sin estudiar,
  temas con más de una semana sin tocar, artículos más fallados, temas con nota < 5 y tabla completa.
  Se puede **copiar como texto** (WhatsApp, correo) o **descargar** como página HTML.
- **Ajustes**: nombre, fecha del examen (cuenta atrás arriba), objetivo de horas semanales,
  penalización, tema claro/oscuro, copia de seguridad (.json), restaurar y borrar todo.

## Sincronización

Publicada en claude.ai (https://claude.ai/artifact/2924eTaMQfq3w2KXCZKTVe, capacidades `db` y `downloads`), los datos se guardan en la cuenta en
`oposicion/principal/{temas,sesiones,tests,plan,marcas,config}`, un documento por elemento, y se
sincronizan en directo. Quien reciba el enlace compartido con permiso «Puede editar» ve y modifica los
mismos datos (por ejemplo, la opositora en su móvil y su padre o madre en el suyo). Los cambios hechos
sin conexión se fusionan al volver (gana la versión más reciente de cada elemento).

La copia de GitHub Pages (o abierta en local) guarda los datos **solo en ese navegador**. Para pasar
datos de una a otra: *Descargar copia de seguridad* y *Restaurar*.

## Uso

En GitHub Pages queda en `…/oposiciones/`. En local: `python3 -m http.server 8000` y abrir
`http://localhost:8000/oposiciones/`. Al publicar cambios, sube `VERSION` en `oposiciones/sw.js`.
