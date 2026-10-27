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
    circuito unidad › SUIGE › IGE, acceso de Incidentes, datos personales solo para quien tramita. Pendiente: subir
    `perdidas/colabora/perdidas.html`, crear las columnas de seguimiento en «Ajustes» y comprobar con datos reales
    (34 notificaciones antiguas, casi todas en REMITIDO A M1 sin SUIGES: la SUIGE sale de la unidad).
    Permisos de la lista: «Colaborar» a INCIDENTES_UNIDADES y SEGURIDAD_*, sin «Usuarios del dominio» (como Incidentes).
    **Aparcado «por ahora»** (el usuario lo analiza): permisos por elemento al remitir (cada pérdida visible solo para su
    unidad, su SUIGE e IGE), porque con «Colaborar» la lista abierta directamente en Colabora deja ver las de otras unidades.
13. **Solicitudes de acceso del sitio JIGE** (27/10/2026): Incidentes y Pérdidas usaban por error la lista interna oculta
    «Solicitudes de acceso» de SharePoint; ahora «SOLICITUDES ACCESO APLICACIONES» (Incidentes 2026-10-27 · 1, Pérdidas · 2).
    Pendiente del usuario: subir las dos, en Incidentes › Accesos › Preparación pulsar «Crear la lista» y «Permitir que
    cualquiera solicite acceso», y crear la alerta «Avisarme». **VSA tiene el mismo fallo** (sigue con «SOLICITUDES DE
    ACCESO»): corregirlo cuando el usuario diga.

Orden y alcance de cada una, a confirmar con el usuario cuando lo pida (empezar por la que diga).

## Hecho en VSA (referencia)

Control de acceso · firma con AutoFirma (BAE + empresa) · circuito SUIGE → DIACU/IGE · Informes · copia protegida y
autoría.
