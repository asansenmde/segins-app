# SEGINS · Evaluación de seguridad de instalaciones

App web instalable (PWA) para hacer evaluaciones SEGINS desde el móvil, sin conexión,
con fotos marcadas, agenda e informe en Word.

> En [`tareas/`](tareas/) hay además un gestor de tareas con fechas límite (NLT), independiente de SEGINS.

## Qué hace

- **Cuestionario**: 7 áreas y 44 ítems de base (C / I / NA, prioridad P1/P2, peso). Puedes añadir,
  editar o quitar ítems y áreas. Los cambios solo afectan a evaluaciones nuevas.
- **Evaluación**: datos de cabecera (empiezan vacíos), respuesta por ítem, observaciones
  (obligatorias si I), referencia, responsable, plazo y fotos.
- **Fotos**: cámara o galería, sello opcional con código y fecha, marcas (flecha, círculo,
  rectángulo, trazo libre y texto). Se quitan los metadatos GPS.
- **Resultados**: los dos criterios (% de conformidad y puntos ponderados), nivel de cada uno,
  alerta P1, gráfico y comparación con la evaluación anterior de la misma instalación.
- **Informe Word (.docx)** generado en el móvil: datos, resultado global y por área, gráfico,
  alertas P1, no conformidades con fotos, detalle completo, conclusiones y firma.
- **Agenda**: visitas y eventos + plazos de subsanación automáticos; plazos vencidos en Inicio.
- **Instalaciones**: ficha e histórico de evaluaciones.

## Seguridad

- Todo se guarda **solo en el dispositivo**, en IndexedDB, **cifrado con AES-GCM 256**
  con una clave derivada del PIN (PBKDF2-SHA256, 310.000 iteraciones).
- Bloqueo automático tras 5 min sin uso o 1 min fuera de la app.
- Copia de seguridad exportable (sale cifrada con el PIN). **Sin el PIN no hay recuperación.**
- No hay servidor ni llamadas a servicios externos: una vez cargada, funciona sin red.

## Cálculo (correcciones respecto al Excel)

- Los ítems sin responder no penalizan; se muestran como pendientes.
- Un área sin ítems aplicables no cuenta en el global: su peso se reparte entre las demás.
- Los pesos de las áreas se normalizan si no suman 100.

## Instalación

La app necesita servirse por **HTTPS** (requisito del navegador para instalarla y cifrar).
Basta con copiar esta carpeta a cualquier servidor web estático (intranet, GitHub Pages, etc.).
Después, en el móvil: Chrome → ⋮ → *Instalar aplicación*; Safari → Compartir → *Añadir a pantalla de inicio*.

Para probarla en local: `python3 -m http.server 8000` y abrir `http://localhost:8000`.

Al publicar cambios, sube la constante `VERSION` en `sw.js` para que los móviles se actualicen.

## Estructura

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js            arranque, PIN, navegación
js/db.js             almacenamiento cifrado y copias
js/state.js          estado en memoria
js/plantilla.js      cuestionario base (44 ítems) y configuración inicial
js/scoring.js        cálculo de resultados
js/fotos.js          captura, sello, visor y anotación
js/informe.js        informe Word (librería docx, incluida en js/lib)
js/views/*.js        pantallas
```
