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
    grupo INCIDENTES_UNIDADES (8 personas). Queda confirmar la alerta «Avisarme» con una solicitud de prueba. VSA tenía el mismo fallo: corregido el
    06/11/2026 (VSA 2026-11-06 · 1, misma lista y aviso a asansen@et.mde.es; lee también las solicitudes antiguas). Queda
    que el usuario suba la versión, resuelva las solicitudes 📦 y cree la alerta «Avisarme» si no la tiene.
14. **Buscar en todos los campos** (regla del usuario, 05/11/2026, ya en `CLAUDE.md`): revisar los campos «Buscar» de
    cada aplicación (Tareas Colabora, Permisos, Incidentes, VSA, Pérdidas…) para que busquen en todos los campos. Pendiente
    de que el usuario diga si se hace ya en todas o al tocar cada una.
15. **Eliminar registros y adjuntos** (05/11/2026, hecho en Incidentes 2026-11-05 · 1 y Pérdidas 2026-11-05 · 3): botón
    rojo «Eliminar» en la ficha solo para quien tiene permiso de eliminar en la lista (va a la papelera). Falta que el
    usuario decida si quita «Eliminar elementos» a unidades y SUIGE (con «Colaborar» pueden todos) con un nivel de permiso
    propio en Colabora.

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
    09/11/2026: Gestor común y META 2026-11-09 · 2 con «Ajustes solo con Control total» (portado de la rama
    claude/task-manager-web-nlt-n7elx4, que partía de una versión vieja sin Finalizar/Eliminar). Subidos y confirmados
    por el usuario el mismo día.
    09/11/2026: SENDERO 2026-11-09 · 10 con la barra en dos pisos, probado por el usuario y pasado al definitivo.
    10/11/2026: SENDERO 2026-11-10 · 1 (pruebas): portal de inicio desde la portada de MENSADEF (Landing), con el inicio
    de sesión del ámbito en una ventana pequeña. Probado por el usuario; versión definitiva 2026-11-10 · 2 con el portal rediseñado.
    10/11/2026: SENDERO 2026-11-10 · 3 (portal sin caer a borradores) confirmado por el usuario.
    10/11/2026: SENDERO 2026-11-10 · 4 (pruebas): marca leído en MENSADEF al abrir y «Marcar no leído». Pendiente: que
    lo pruebe (la negrita debe desaparecer también en MENSADEF). Analizado crear mensajes: ver respuesta del 10/11.
    10/11/2026: SENDERO 2026-11-10 · 5: leído en el definitivo; entrada automática desde la portada en pruebas.
    Pendiente: que pruebe la entrada automática sin sesión abierta.
    10/11/2026: SENDERO 2026-11-10 · 8: entrada automática en el definitivo; «Visto» se quita también con una tarjeta
    elegida; batería `mensadef/pruebas/todas.sh` para no repetir errores ya resueltos.
    11/11/2026: SENDERO 2026-11-11 · 1 manda a META el negociado y el responsable (se recuerdan por célula y negociado);
    Gestor común y META 2026-11-11 · 1 los ponen en el alta. Pendiente: que suba los dos Gestores y pruebe.
    11/11/2026: departamentos = células de MENSADEF (SENDERO 2026-11-11 · 2 manda la célula; Gestor común y META
    2026-11-11 · 2 la ponen como departamento; responsable = quien crea). Pendiente: subir los Gestores y, con Control
    total, activar una vez Ajustes → «Departamentos de MENSADEF» en cada lista (META y común).

16. **Gestor de Tareas / META 2026-11-10 · 1** (10/11/2026): junta la · 2 (Ajustes solo con Control total, rama
    `claude/mensadef-outlook-tasks-sync-vozg8g`) y la · 3 («📋 Incluir en el Punto de Situación», rama
    `claude/modest-fermat-9zf46n`), hechas por separado. Probado en simulación (original y protegida, ligero y verbose).
    Pendiente: que el usuario suba el Gestor común; META se regenera igual por si la quiere. Ojo: las sesiones de SENDERO
    y de Puntos de Situación siguen con su versión; si vuelven a tocar el Gestor, que partan de esta.
17. **META: quién ve cada expediente** (10/11/2026, META 2026-11-10 · 2): autor, responsable, implicados y su negociado; todo
    con Control total o «Lo ve todo»; altas en Ajustes (lista «META MIEMBROS»). Probado en simulación. Pendiente: que el
    usuario suba META, cree la lista desde Ajustes y dé de alta a cada uno en su negociado. Siguiente paso posible: que
    SENDERO pase el negociado y el responsable al abrir la tarea (se hace en la sesión de SENDERO). `importar.mjs` no
    sirve con la copia de META (ya pasaba con la · 2): adaptarlo si se toca la importación.
    11/11/2026: Gestor común y META 2026-11-11 · 3 = control de acceso de META (rama task-manager, 10/11 · 2) + Punto de
    Situación + departamentos = células de MENSADEF. Pendiente: subir los dos y, en Ajustes (Control total), activar
    «Departamentos de MENSADEF» y dar de alta a la gente con sus células en «Quién ve los expedientes de META».
    11/11/2026: Gestores 2026-11-11 · 4 (sin negociados antiguos, alta reordenada, células automáticas) y SENDERO
    2026-11-11 · 3 (manda todas las células). Pendiente: subir los dos Gestores y el favorito.
    11/11/2026: Gestores 2026-11-11 · 5: catálogo de departamentos (12 células de SUIGESUR, altas y bajas en Ajustes).
    Pendiente: subirlos y pulsar en Ajustes «Poner las 12 células de SUIGESUR» en META y en el común.
    11/11/2026: 2026-11-11 · 6: el Gestor común vuelve a sus negociados (departamentos solo en META). Pendiente: subir el
    común; META puede quedarse en la · 5 o subir la · 6 (igual para META).
    11/11/2026: «📋 Al Punto de Situación» desde SENDERO (pruebas 2026-11-11 · 4) pasando por META (2026-11-11 · 7).
    Pendiente: que lo pruebe con el favorito de pruebas y META; luego pasarlo al definitivo.
    11/11/2026: META se sube como `aplicaciones/META.html` (2026-11-11 · 8); SENDERO 2026-11-11 · 5 la trae por defecto y el
    botón se llama «Pasar directamente al PSIT» (aún solo en pruebas).
    11/11/2026: META 2026-11-11 · 9 con solicitud de acceso. Pendiente: subir META.html y, en Ajustes › «Quién ve los
    expedientes», crear «META SOLICITUDES» (y la alerta), dar de alta a la gente o atender sus solicitudes.
    11/11/2026: META 2026-11-11 · 11 (solicitud de acceso como Incidentes, sin menús sin alta) y SENDERO 2026-11-11 · 6
    (PSIT en el definitivo, botón arreglado). Pendiente: probarlos.
    12/11/2026: implantación en otros ámbitos (IGE, MAPER, MALE…). Decidido con el usuario:
    - SENDERO único con una tabla ámbito → META, y portal con los ámbitos del usuario.
    - Una META por organización, en su sitio de Colabora (`…/aplicaciones/META.html`), con la lista «META
      CONFIGURACIÓN» (organización, ámbito, correo de avisos, Punto de Situación) y el asistente «Instalar META» en
      Ajustes.
    - Candados: instalar solo con la cuenta asansen y Control total en el sitio; META solo arranca en los sitios
      autorizados (lista dentro del código cifrado); SENDERO solo manda a esas META.
    - Día a día de cada organización: su administrador local (opción a).
    - Quitar lo fijo de SUIGESUR: 12 células → «Cargar mis células desde SENDERO»; correo de avisos y franja desde la
      configuración.
    - Pendiente: esperar a las pruebas del usuario antes de empezar.
    12/11/2026: publicados y confirmados por el usuario: SENDERO 2026-11-11 · 6 (SENDERO.html) y META 2026-11-12 · 3 (META.html).

<!-- Traído de la rama claude/modest-fermat-9zf46n (Puntos de Situación) el 12/11/2026 -->

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
    09/11/2026: **hecha la aplicación** (`puntos-situacion/`, versión 2026-11-09 · 1), probada en simulación (original,
    protegida y de pruebas; ligero y verbose; Word comprobado con LibreOffice). Pendiente del usuario: subir
    `puntos-situacion/colabora/puntos-situacion.html` (o primero la de pruebas) a una biblioteca de `/et/SUIGESUR/JSUIGE`,
    abrirla para la puesta en marcha, revisar el emparejamiento de negociados, añadir miembros en Ajustes y contar si la
    validación del bloqueo quedó activa («Comprobar la instalación»).
    10/11/2026: Puntos de Situación **2026-11-10 · 1**: «✎ Modificar punto» y «🗑 Eliminar punto» (a la papelera) para la
    coordinación, pedido por el usuario al probar la copia de pruebas. Pendiente: que suba la nueva copia de pruebas.
    10/11/2026: Puntos de Situación **2026-11-10 · 2**: editor ampliable y la parte de cada negociado en Word o PDF
    (petición del usuario). Pendiente: que suba la copia de pruebas y lo pruebe.
    10/11/2026: Gestor común, META y pruebas **2026-11-10 · 1**: unidas la · 2 confirmada (Ajustes solo con Control total) y
    el enlace con el Punto de Situación (solo ⭐ Tratar con el General). Pendiente: que suba las tres copias.
    12/11/2026: Puntos de Situación 2026-11-12 · 2 (quitar «Sin novedad» y entradas sin pantalla de identificarse) confirmado por el usuario.
    12/11/2026: Puntos de Situación 2026-11-12 · 3 (asunto en su línea y texto debajo en el informe, Word y PDF) confirmado por el usuario.
    12/11/2026: Puntos de Situación 2026-11-12 · 4 (propuestas de META sin negociado: motivo e «Incluir en…» para PROCOR) confirmado por el usuario.
    12/11/2026: Puntos de Situación 2026-11-12 · 5 (tras «Incluir en…» se abre «Mi negociado» en ese negociado) confirmado por el usuario.
    12/11/2026: Puntos de Situación 2026-11-12 · 6 (informe completo en PDF para todos los negociados en «Informe»): entregado.
    12/11/2026: META 2026-11-12 · 7 confirmado (estado solo En curso/Terminada, nombres «Reunión de entradas» y «Punto Situación
      semanal», Recordar asignación, correos en ventana nueva, filtros con los departamentos propios, eliminar con aviso del motivo).
      Eliminar no funcionaba porque el nivel «Colaborar» del sitio JSUIGE no tiene «Eliminar elementos»: el usuario creó un nivel
      propio «META» (Colaborar + Eliminar elementos) para la lista «Gestor de Tareas MENSADEF» y ya funciona. No dar Control total
      para esto (en META, Control total = administrador: ve todo y Ajustes).
    13/11/2026: SENDERO 2026-11-13 · 9 entregado (pantalla completa, acción/info y último comentario, columna Firma, «Sin bandera»,
      agrupar por días/meses, barra de la ficha con la propuesta A, «↩ Responder» en MENSADEF, comentarios firmados con el nombre).
    PENDIENTE DEL USUARIO: pasar el favorito «Explorar Portafirmas» en portafirmas.mdef.es (lista de pendientes, marcar una y pulsar
      Firmar, cancelar AutoFirma) y pegar lo que copia (solo estructura). Con eso: que SENDERO abra la petición en el Portafirmas
      lista para firmar. Firmar (identificarse, AutoFirma y PIN) lo sigue haciendo el usuario.
    PENDIENTE (opcional): autor de los comentarios hechos en MENSADEF, con «Escuchar MENSADEF» sobre el historial de comentarios.
    14/11/2026: SENDERO 2026-11-14 · 1 a · 8 entregados (plegar grupos, «Ir a Rúbrica» con la lista filtrada del Portafirmas, filtros
      sin Tipo/Remitente, Sí/No, células sin estrella, franja amarilla con letras azules). PENDIENTE DEL USUARIO: probar «Ir a
      Rúbrica» y «↩ Responder» de verdad, y decir si se hace la limpieza de filtros propuesta (Célula, Leído y Estado como pastillas).
    15/11/2026: SENDERO 2026-11-15 · 1: **control de acceso en Colabora** (`/et/SUIGESUR/colaborativo`, página
      `mensadef/acceso/SENDERO-acceso.html`, listas «SENDERO Autorizados» y «SENDERO Solicitudes»; por ámbito de MENSADEF,
      persona y bloqueo; responsables de ámbito; versión vigente) y **caducidad de 30 días** por versión (petición del
      usuario; sustituye a la lista de códigos de la misma mañana). PENDIENTE DEL USUARIO: subir `acceso/subir/SENDERO-acceso.html`
      a «Documentos compartidos» de colaborativo, abrirla y hacer la «Preparación», añadir el ámbito 2SUIGE (y los que
      quiera) y probar SENDERO. Confirmar si la comprobación va sola (marco oculto) o pide el clic «Comprobar en Colabora».
    15/11/2026: SENDERO 2026-11-15 · 3: comprobación en cada apertura (fase inicial). PENDIENTE: cuando el usuario lo diga,
      recordar la autorización unos días. Confirmar si en Colabora funciona la comprobación oculta (marco) o solo la ventana.
    15/11/2026: SENDERO 2026-11-15 · 4 y acceso 2026-11-15 · 5: META y PSIT de cada organización en la regla del ámbito (Colabora);
      «★ Al PSIT» directo al Punto de Situación sin pasar por META. PENDIENTE: en la sesión «[PUNTOS]», que el PSIT acepte
      `#importar=` con origen SENDERO (texto entregado al usuario). PENDIENTE DEL USUARIO: «Crear columnas» en Preparación y
      poner en el ámbito 2SUIGE las direcciones de META y del PSIT (✎ en «Autorizados y bloqueos»).
    16/11/2026: SENDERO 2026-11-16 · 2: «★ Al PSIT» directo al Punto de Situación (por defecto el de SUIGESUR, cambiable),
      etiqueta «★ PSIT» y filtro «Tarea / PSIT». Asunto cerrado con el usuario.
    16/11/2026: SENDERO 2026-11-16 · 6: marca PSIT/Tarea solo al confirmar «Sí, está guardado»; «Quitar del PSIT / de META».
      PENDIENTE DEL USUARIO: pasar «Escuchar MENSADEF» abriendo un mensaje (para que el enlace lleve al mensaje y no a la célula).
      PENDIENTE: que el PSIT (sesión [PUNTOS], texto para-PUNTOS-quitar.md) y META acepten `#quitar=`.
    18/11/2026: SENDERO 2026-11-18 · 2: «Imprimir / PDF» y «Su referencia» pulsable. PENDIENTE DEL USUARIO: pasar «Escuchar
      MENSADEF» pulsando en un mensaje los botones «PDF» y «Enviar correo» de MENSADEF (para el PDF original y su envío).
    19/11/2026: SENDERO (2026-11-18 · 11 con el arreglo de documentos): el enlace de MENSADEF del correo, el PSIT y META lleva a
      la célula, no al mensaje. El usuario lo deja así. PENDIENTE (opcional): si da la forma de la dirección de un mensaje abierto
      en MENSADEF (lo que va tras «#/», sin datos), poner el enlace directo.
    19/11/2026: PENDIENTE (acordado, para la próxima versión de SENDERO, junto con lo demás): «🔎 Buscar en todo MENSADEF» junto a
      «Buscar»: el texto va al buscador de MENSADEF (`criterioBusqueda` de buzon/ObtenerBuzonCelula) en todas las células, entrada
      y salida, de cualquier fecha; resultados en una ventana encima (como las referencias), sin tocar la lista; pulsar = ver el
      mensaje en esa ventana. Avisar si una bandeja da 50 (hay más). Comprobar con el usuario qué campos busca MENSADEF.
    Resto pendiente de SENDERO (19/11/2026): probar de verdad «Ir a Rúbrica» y «↩ Responder»; PDF original y «Enviar correo» de
      MENSADEF (Escuchar, opcional); recordar la autorización unos días (cuando el usuario lo diga); «Quitar del PSIT» en la
      sesión [PUNTOS] (para-PUNTOS-quitar.md) y en META; enlace directo al mensaje (aparcado); limpieza de filtros (aparcado);
      firmar desde SENDERO (idea).
    19/11/2026: ACORDADO con el usuario, para la próxima versión: «✍ Firmar en Rúbrica» desde SENDERO = abrir el Portafirmas con la
      petición localizada (como «Ir a Rúbrica») + favorito nuevo «Firmar con SENDERO» en portafirmas.mdef.es que la busca, la abre
      (el Portafirmas exige abrirla), la marca y pulsa Firmar; AutoFirma pide certificado y PIN (siempre el usuario).
      PENDIENTE DEL USUARIO: escucha con «Explorar Portafirmas» de una firma COMPLETA (abrir, marcar, Firmar y firmar de verdad).
    19/11/2026: SENDERO 2026-11-19 · 2: «Buscar en todo MENSADEF» y «Firmar en Rúbrica» + favorito «Firmar con SENDERO» (hechos).
      PENDIENTE DEL USUARIO: probarlos de verdad (qué campos busca MENSADEF; que el favorito localice la petición y firme).

    23/11/2026: **[ORGANIZACIONES] META y PSIT para todo el ET** (`organizaciones/README.md`): código solo en SUIGESUR, datos en el
      sitio de cada organización, administradores nombrados por el usuario. Fase 0 hecha: `organizaciones/prueba-sitio.html`
      (solo lee). PENDIENTE DEL USUARIO: subirla a `/et/SUIGESUR/JSUIGE/aplicaciones`, probar sitios de otras organizaciones
      (y pedir a un administrador de otra organización que la abra y pruebe el suyo) y pasar «📋 Copiar el resultado».
      Pendiente de decidir: a) ¿todos los sitios en colabora.mdef.es?, b) META y PSIT de una organización en sitios distintos,
      c) ¿solo el usuario nombra administradores?, d) quién hace cada fase.
    23/11/2026: SENDERO 2026-11-23 · 4: «✉ Correo» descarga el correo como archivo de Outlook (.eml, «X-Unsent: 1»): al abrirlo,
      Outlook de escritorio lo enseña como correo nuevo listo para enviar, con formato, texto completo, datos, «Abrir en MENSADEF»
      y los documentos ADJUNTOS (hasta 10 MB; los que no caben, con su enlace). Quitado «✉ Enviar con el PDF» (el correo ya lleva
      los documentos). PENDIENTE DEL USUARIO: probarlo en su Outlook (que se abra como correo nuevo y no como recibido; que lleve
      los adjuntos) y decir el límite de tamaño de correo si no es 10 MB. Para que «Abrir en MENSADEF» lleve al mensaje: la forma
      de la dirección de un mensaje abierto en MENSADEF (lo que va tras «#/», cambiando números por X).
