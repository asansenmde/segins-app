# SEGINS · Evaluación de seguridad de instalaciones

**Desarrollada por el Comandante Alfredo Sánchez Sender.** © 2026. Todos los derechos reservados: ver [LICENSE](LICENSE).

App web instalable (PWA) para hacer evaluaciones SEGINS desde el móvil, sin conexión,
con fotos marcadas, agenda e informe en Word.

> Este repositorio contiene, además, tres proyectos **independientes de SEGINS**, cada uno en su carpeta:
>
> - [`tareas/`](tareas/): **Tareas NLT**, gestor personal de tareas con fechas límite (NLT).
> - [`colabora/`](colabora/): **Tareas Colabora**, gestor de la lista «Gestor de Tareas» del SharePoint interno.
> - [`mensadef/`](mensadef/): **visor de mensajes de MENSADEF**.
>
> Cómo pedir cambios en cada uno y páginas nuevas: [`PROYECTOS.md`](PROYECTOS.md).

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
- **Análisis de riesgos (Mosler)**: una valoración por amenaza (22 amenazas de base en dos grupos,
  ampliables), V propuesta por el cuestionario, clasificación Bajo ≤ 200, Normal ≤ 600, Alto > 600
  (o Mosler clásica de 5 niveles, en Ajustes) e importación de la tabla Mosler copiada desde Excel
  (de cada amenaza se toma el elemento con el riesgo más alto).
- **Acciones derivadas**: acción correctora propuesta para cada no conformidad (con plazo por defecto de
  30 días para P1 y 90 para P2), acciones sugeridas por los riesgos Mosler, acciones generales, acciones
  propias y estado de cada una. Aparecen en la agenda y en el informe.
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

## Apps nativas (Android e iOS)

El mismo código se empaqueta como app nativa con [Capacitor](https://capacitorjs.com).

- **Android**: cada cambio en `main` compila el APK con GitHub Actions (`.github/workflows/android.yml`)
  y lo publica en *Releases*. Enlace a la última versión:
  https://github.com/asansenmde/segins-app/releases/latest/download/SEGINS.apk
  Va firmado siempre con la misma clave (`android/segins.keystore`), así que cada versión se instala
  encima de la anterior sin perder datos.
- **iOS**: el proyecto está en `ios/`. Para compilarlo e instalarlo hace falta un Mac con Xcode
  y una cuenta de Apple Developer (o TestFlight).

Para regenerar localmente: `npm install && npm run sync`.

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
