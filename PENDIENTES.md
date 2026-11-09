# Pendientes (encargados por el usuario, a la espera de que diga «adelante»)

Lista viva: se tacha (o se borra) cada punto cuando se haga. Modelo de todo: **`vsa/`** (recetas en `SHAREPOINT.md`).

## Para todas las aplicaciones de Colabora (Permisos, Incidentes, Tareas Colabora y las nuevas)

1. **Copia protegida + autoría** (como `vsa/proteger/`):
   - aviso «© 2026 Cte. Alfredo Sánchez Sender» en la cabecera HTML, `meta author/copyright` y pie visible (oculto al
     imprimir);
   - original legible en local/repositorio y copia ofuscada `<proyecto>/colabora/<página>.html` con bloqueo de
     dominio `.mdef.es` para subir a Colabora;
   - pasar las pruebas simuladas también contra la copia protegida.
   - **Hecho:** VSA (19/10/2026), Incidentes y Permisos (20/10/2026), Tareas Colabora (22/10/2026, con el nuevo panel de
     la pestaña Tareas).
2. **Control de acceso con solicitud** (receta «Control de acceso con solicitud»): pantalla «Solicitar acceso»,
   lista común «SOLICITUDES DE ACCESO» (columna `Aplicacion`), pestaña «Accesos», grupo propio de cada aplicación.
   - **Hecho:** VSA (17/10/2026) e Incidentes (20/10/2026, con transición y aviso por correo de cada solicitud).
     Permisos (20/10/2026): acceso a **Registro SIPERDEF por unidad** (solicitud, asignación de unidades, propietario lo ve
     todo; transición para los registradores sin unidad). **Falta:** Tareas Colabora; en Permisos, permisos por elemento.
3. **Firma electrónica con AutoFirma / portafirmas** (receta «Firma electrónica con AutoFirma») donde haya que firmar
   documentos: PDF generado en la página, firma PAdES visible, adjunto al elemento y segunda firma si procede.

4. **Página de diagnóstico de permisos** (solo lectura): por cada lista del subsitio, si hereda o tiene permisos
   propios y qué grupos tienen qué nivel, marcando en rojo «Usuarios del dominio» / «Todos». Pedida el 20/10/2026 por
   un usuario con «Lectura restringida» que veía todas las listas (pendiente de hacer).

5. **Ocultar la ruleta en el portal**: hecho con un Editor de scripts (receta y cómo volver a verla en `SHAREPOINT.md`,
   «Ocultar la ruleta y la cinta en el portal»). Pendiente de confirmar que el administrador la ve sin `?admin=1`.

6. **Tareas Colabora**: hecha toda la propuesta de visibilidad (22/10/2026). Queda por decidir si lleva **control de
   acceso con solicitud** (punto 2) o sigue abierta a quien tenga permiso en la lista.

7. **Nuevo proyecto: Acciones derivadas de inspecciones técnicas** (pedido el 22/10/2026, en análisis). Lista abierta
   en la que los negociados (seguridad, programación y coordinación, riesgos laborales, acuartelamiento,
   infraestructura…) cargan las acciones derivadas de cada inspección, con número, deficiencia, acción, plazo y
   responsable. Cada acuartelamiento ve solo lo suyo y lo subsana en plazo; la jefatura controla el cumplimiento.
   Esperando del usuario la estructura de la plantilla y las decisiones de la propuesta antes de empezar. Irá en su
   carpeta, con etiqueta propia.

8. **Permisos, avisos por correo** (22/10/2026, versión · 5, confirmado por el usuario): ya llegan aunque la solicitud
   nombre al autorizador o aprobador con una cuenta antigua sin buzón. Queda pedir al administrador de Colabora que retire
   la cuenta antigua del usuario para que no aparezca al buscarle.
9. **Envío robusto de correo en todas las páginas**: hecho el 22/10/2026 en VSA (· 1), Incidentes (· 1), Tareas
   Colabora (· 3) y Permisos (· 6), probado en simulación (original y protegida). Pendiente de que el usuario suba las
   cuatro copias protegidas y haga un «Correo de prueba» en cada una.

10. **Permisos: sustituciones de los jefes de unidad** (versión 2026-10-23 · 1, probado en simulación): tipos de sustitución,
    sin «interino», sustitutos que no pueden estar de permiso; pestaña «Mandos sustitutos». El usuario probó la copia de
    pruebas (26/10/2026) y pidió la versión 2026-10-26 · 1: pestaña solo para autorizadores (lo que autorizan), jefes (lo
    suyo) y mando (todo); filtros por fechas y unidad, teléfonos en las barras, detalle, resumen, informe y CSV; eliminar
    solicitudes solo el administrador; menú más visual. El usuario dio por buena la copia de pruebas y se entregó la
    original protegida (`permisos/colabora/permisos.html`, 26/10/2026). Pendiente de que la suba a Colabora.
11. **Tareas Colabora: expediente y estado** (versión 2026-10-23 · 3, probado en simulación): el expediente es el nº de
    Colabora; estado terminado ⇔ fecha de finalización obligatoria; la situación la marca solo el estado. Los asuntos
    antiguos incoherentes salen con aviso ⚠ («Fecha de fin sin estado terminado» / «Terminado sin fecha de fin»):
    corregirlos poco a poco desde la propia página. Pendiente de subir la copia protegida.
12. **Pérdida de documentación** (`perdidas/`, versión 2026-10-27 · 1, probada en simulación): formulario del InfoPath,
    circuito unidad › SUIGE › IGE, acceso de Incidentes, datos personales solo para quien tramita. Subida (copia con semilla
    fija, 27/10/2026) y columnas de seguimiento creadas (confirmado por el usuario). Pendiente: comprobar con datos reales
    (34 notificaciones antiguas, casi todas en REMITIDO A M1 sin SUIGES: la SUIGE sale de la unidad).
    Permisos de la lista: «Colaborar» a INCIDENTES_UNIDADES y SEGURIDAD_*, sin «Usuarios del dominio» (como Incidentes).
    **Aparcado «por ahora»** (el usuario lo analiza): permisos por elemento al remitir (cada pérdida visible solo para su
    unidad, su SUIGE e IGE), porque con «Colaborar» la lista abierta directamente en Colabora deja ver las de otras unidades.
13. **Solicitudes de acceso del sitio JIGE** (27/10/2026): Incidentes y Pérdidas usaban por error la lista interna oculta
    «Solicitudes de acceso» de SharePoint; ahora «SOLICITUDES ACCESO APLICACIONES» (Incidentes 2026-10-27 · 1, Pérdidas · 2).
    Hecho (27/10/2026, confirmado en Preparación): lista creada, solo sus elementos, abierta a «usuarios del dominio» y
    grupo INCIDENTES_UNIDADES (8 personas). Queda confirmar la alerta «Avisarme» con una solicitud de prueba. **VSA tiene el mismo fallo** (sigue con «SOLICITUDES DE
    ACCESO»): corregirlo cuando el usuario diga.
    **01/11/2026**: una unidad acreditada no podía guardar el borrador («Acceso denegado»): `INCIDENTES_UNIDADES` sin
    «Colaborar» en la lista de incidentes. Incidentes 2026-11-01 · 1 lo avisa y en Ajustes › Accesos lo da con un botón.
    Copia protegida (semilla fija 20261027) subida y funcionando (01/11/2026). Pendiente: pulsar «Dar «Colaborar»…» en
    Ajustes › Accesos y confirmar con la unidad. Revisar Pérdidas y VSA igual.

Orden y alcance de cada una, a confirmar con el usuario cuando lo pida (empezar por la que diga).

## Hecho en VSA (referencia)

Control de acceso · firma con AutoFirma (BAE + empresa) · circuito SUIGE → DIACU/IGE · Informes · copia protegida y
autoría.
13. **MENSADEF + Outlook → Tareas Colabora** (versión 2026-10-27 · 1, probada en simulación, original y protegida; diseño en
    `SINCRONIZACION.md`): «➜ Crear tarea en Colabora» en el visor de MENSADEF, alta desde correos .msg/.eml (arrastrar o
    «✉ Desde correo»), sin duplicados y actualización automática con novedades. Entregadas **solo copias de pruebas** (el
    usuario no quiere tocar las buenas): `colabora/colabora/tareas-nlt-colabora-pruebas.html` (lista «Gestor de Tareas
    PRUEBAS») y el favorito «Mensajes MENSADEF (pruebas)». Pendiente: que las pruebe desde la célula SETEC SEGURIDAD y,
    si las da por buenas, regenerar y entregar las buenas. Siguientes
    fases (reglas de clasificación, varios mensajes a la vez, tablero del grupo) a la espera de sus reglas.
14. **Visor de MENSADEF con bandejas** (copia de pruebas, 28/10/2026): lee las bandejas de las células del usuario con el
    servicio `mensadefapi` (cabeceras `passcode` y `user` tomadas de la propia aplicación), por defecto todas las suyas,
    con «✓ Visto», «➜ Tarea», tarjetas, píldoras de célula, autoría y diseño. **Confirmado por el usuario** que ya lee su
    célula y (versión 2026-10-28 · 4) que el visor obtiene solo la clave del servicio con `ValidateUser`, como la aplicación. Pendiente: que lo use unos días; decidir si «visto» debe ser compartido por el grupo (ahora es de cada
    navegador) y, cuando lo dé por bueno, regenerar el favorito bueno. Versión 2026-10-29 · 3: informes como los de Permisos
    (encabezado, extracto y detalle con el texto completo, agrupados; PDF, Word, texto, CSV) y autoría más visible:
    el usuario lo da por bueno (29/10/2026). **Se queda en versión de pruebas** para presentarlo al jefe; no regenerar el
    favorito bueno hasta que el usuario lo pida.

15. **MENSADEF versión para instalar** (04/11/2026): el usuario dio por buena la de pruebas. Entregados el favorito
    definitivo (`mensadef/marcador-visor-mensadef.html`, para toda la estructura SUIGE, con varios Gestores de Tareas a
    elegir) y el Gestor de Tareas bueno 2026-11-04 · 1 con importación (`colabora/colabora/tareas-nlt-colabora.html`).
    Su gestor propio será la copia de pruebas (lista «Gestor de Tareas PRUEBAS»). Pendiente: que suba el Gestor bueno,
    reparta el favorito y lo confirme. Aparcado a petición del usuario: la protección nueva para Permisos, VSA y Pérdidas
    (en `git stash`, «Protección nueva para Permisos, VSA, Pérdidas y Tareas (a medias, 04/11)»).
    04/11/2026 (tarde): el Gestor propio pasa a ser `colabora/colabora/tareas-nlt-colabora-mensadef.html` (lista «Gestor de
    Tareas MENSADEF»; al abrirla ofrece usar la de pruebas cambiándole el nombre). Gestor 2026-11-04 · 3: terminados por
    fechas, sin tope de 200, y marcas «Punto de situación» / «Tratar con el General» (columna `TratarEn`, se crea en
    Ajustes). Visor 2026-11-04 · 2: ◀ ▶ con la ficha ampliada.
    07/11/2026: anexos en la ficha del visor (abrir y descargar, sin marcar como leído), dados por buenos y pasados al
    favorito definitivo (2026-11-07 · 2). El envío por correo se probó y se quitó a petición del usuario.
    09/11/2026: SENDERO 2026-11-09 · 2 (pruebas): comentario en MENSADEF desde la ficha y comentario automático al añadir
    tarea en META. Pendiente: que lo pruebe en un mensaje sin importancia (y confirme que el autor sale bien) para pasarlo
    al favorito definitivo.
    09/11/2026: SENDERO 2026-11-09 · 5 (pruebas): barra de la ficha ampliada siempre fija, «Ver estructura» oculto y
    cambio de bandera desde la ficha. Pendiente: que pruebe poner y quitar una bandera (quitar = idEtiqueta 0, supuesto).
    09/11/2026: probado por el usuario. Comentario y bandera pasados al favorito definitivo (2026-11-09 · 6).
    09/11/2026: SENDERO 2026-11-09 · 7 (pruebas): «Pasar a rúbrica» (2026-11-09 · 8: «Firmar en Rúbrica» quitado, no
    funcionaba; en su lugar, enlace fijo «Ir a Rúbrica»). Pendiente: que confirme «Pasar a rúbrica» para pasarlo al definitivo.
    09/11/2026: «Pasar a rúbrica» confirmado por el usuario. Versión final 2026-11-09 · 9 con rúbrica, «Ir a Rúbrica»,
    «⟳ Actualizar» y hora de la última actualización (sin «Pasar a rúbrica» si el estado es «Enviado»).
    09/11/2026: el Gestor propio se llama META (2026-11-09 · 1, `colabora/colabora/tareas-nlt-colabora-mensadef.html`),
    con la «M» dorada en la cabecera. Misma lista y mismos datos. Pendiente: que lo suba a Colabora en lugar del anterior.

16. **Nuevo proyecto: Puntos de Situación de SUIGESUR** (`puntos-situacion/`, etiqueta `[PUNTOS]`; acordado el 09/11/2026,
    se hace el 10/11/2026). Sustituye al Word de Colabora donde cada negociado aporta lo suyo. Decisiones del usuario:
    - Un solo HTML para el sitio `/et/SUIGESUR/JSUIGE` (el usuario puede crear listas). La primera vez crea las listas
      «PS Negociados», «PS Puntos» y «PS Aportaciones» (contrato de columnas en `colabora/README.md`, versión 2026-11-09 · 2)
      y la validación del bloqueo; activa versiones.
    - Negociados copiados de `NegociadoAsignado` de «Gestor de Tareas», en este orden: PROCOR, Infraestructura,
      Seguridad, PRL, Calidad de Vida, Acuartelamiento (confirmar emparejamiento al instalar).
    - Varias entradas por negociado (asunto, situación, prioridad, orden arrastrando), «Sin novedad», «Traer del punto
      anterior»; **imágenes dentro del texto** (insertar, pegar, arrastrar; reducidas a ~1600 px; adjuntos del elemento;
      pie «Figura n»).
    - Permisos: cada negociado da de alta y edita lo suyo; **PROCOR** gestiona los puntos y puede retocar cualquier
      entrada; el usuario, control total (fila de coordinación en «PS Negociados»).
    - Bloqueo real por fecha y hora: `CierrePunto` en cada entrada + validación de lista; solo PROCOR reabre o cambia la
      hora (y entonces actualiza `CierrePunto` de todas las entradas). Comprobar en la instalación si la validación con la
      hora actual funciona y si frena los adjuntos.
    - Panel de seguimiento (cuenta atrás, quién ha aportado, recordar a pendientes), correo al abrir y recordatorio
      (envío robusto), siguiente punto periódico con un clic.
    - Informe Word .docx «PUNTO DE SITUACIÓN DE SUIGESUR» con el membrete de Incidentes (escudo, USO OFICIAL, banda azul y
      oro «EJÉRCITO DE TIERRA · INSPECCIÓN GENERAL DEL EJÉRCITO · SUIGESUR»), referencia **PS-año-número** (correlativo por
      año), fecha del punto, de elaboración y de cierre; todos los negociados («Sin novedad» / «No ha aportado
      información»); firma; pie con quién lo emite y página. Archivo `PS-2026-045 Punto de Situación 2026-11-10.docx`.
    - Histórico: «Archivar en…» (descargar Word y .zip de imágenes, ruta de red, confirmación; anota quién y cuándo) y,
      pasados 30 días del archivo, «Borrar contenido» a la **papelera** (solo PROCOR y el usuario, doble confirmación); la
      ficha del punto se conserva siempre. Ocupación en Colabora a la vista.
    - Desde META: hecho y preparado (Gestor 2026-11-09 · 2, «📋 Incluir en el Punto de Situación»). En la aplicación,
      mostrar «Desde META» con enlace a la tarea y, como **propuestas**, los asuntos marcados **⭐ Tratar con el General** en
      META que aún no estén en el punto abierto.
    - Autoría y copia protegida, control de acceso y pruebas simuladas como en las demás páginas.
    Maquetas enseñadas y aprobadas el 09/11/2026 (con datos ficticios).
    09/11/2026: Gestor de Tareas / META 2026-11-09 · 2 con «📋 Incluir en el Punto de Situación», probado en simulación
    (original y protegidas, ligero y verbose). Pendiente: que suba las copias; funcionará cuando se instale Puntos de Situación.
    09/11/2026: 2026-11-09 · 3: solo se incluyen los asuntos marcados ⭐ Tratar con el General (petición del usuario).
