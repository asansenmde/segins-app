# Pendientes

Lista viva: se borra cada punto cuando se haga. Recetas en `SHAREPOINT.md`; reglas en `CLAUDE.md`.
Ordenada el 14/11/2026 (lo hecho, resumido al final). SENDERO y Puntos de Situación se llevan en sus propias sesiones.

## Lo que tiene que hacer el usuario en Colabora

1. **Subir las copias cifradas** (13/11/2026) y abrir cada una en Edge para ver que no sale el código como texto:
   Incidentes 2026-11-12 · 1, Pérdidas 2026-11-05 · 3, VSA 2026-11-06 · 1, Permisos 2026-11-05 · 2 (+ copia de pruebas),
   Gestor de Tareas y **META.html** 2026-11-13 · 2 (META en `…/JSUIGE/aplicaciones/META.html`).
2. **Borrar lo viejo:** la META antigua `tareas-nlt-colabora-mensadef.html` (ahora es `META.html`) y cualquier copia vieja
   subida con otro nombre.
3. **Incidentes · responsables de los avisos:** en Ajustes, «Crear la lista» («INCIDENTES RESPONSABLES»), poner al menos un
   responsable por SUIGE, DIACU e IGE, probar SUIGESUR con «✉ Probar» y dejar la lista en **Leer** para los demás.
4. **META · quién ve qué:** crear desde Ajustes la lista «META MIEMBROS», dar de alta a cada uno en su negociado/departamento
   y dejarla en **Leer** para los demás. La biblioteca del `.html`, solo lectura para los usuarios.
5. **VSA · solicitudes antiguas:** resolver en Accesos las marcadas con 📦 (quedaron en la lista interna «Solicitudes de
   acceso») y crear la alerta «🔔 Avisarme» de la lista «SOLICITUDES ACCESO APLICACIONES» si no la tiene.
6. **Pérdidas:** comprobar con datos reales (34 notificaciones antiguas, casi todas en REMITIDO A M1 sin SUIGES).
7. **Permisos:** pedir al administrador de Colabora que retire la cuenta antigua del usuario (sale al buscarle).
8. **Ruleta del portal:** confirmar que el administrador la ve sin `?admin=1`.

9. **Correo (17/11/2026):** subir las copias 2026-11-17 de todas las aplicaciones (ya envían a la cuenta de cada persona,
   que es lo que Colabora acepta) y confirmar que llegan los avisos; si a alguien no le llegan, que abra
   `prueba-correo.html` con su cuenta y mande el resumen.
10. **Aviso directo de las solicitudes de acceso (17/11/2026):** subir Incidentes, Pérdidas y VSA 2026-11-17 · 2 y META
   2026-11-17 · 3, y **abrir cada una una vez con la cuenta del administrador** (deja su cuenta guardada en la descripción
   de la lista de solicitudes; en Accesos sale «✔ guardada»). Probar con alguien sin acceso: le debe llegar el aviso o
   salirle «Falta un paso» con el botón de Outlook.
   - **Incidentes 2026-11-20 · 1 (20/11/2026):** al entrar con Control total sale el recuadro de solicitudes pendientes
     (de todas las aplicaciones) y en «Accesos» cada solicitud dice si su aviso salió o por qué no. Subirla y mirar en
     «Accesos › Preparación» si sale «✔ guardada» y, en la próxima solicitud, qué dice «✉ Aviso por correo». Después,
     llevar lo mismo a Pérdidas, VSA, META, Permisos y Cuadrante.
   - **Incidentes 2026-11-20 · 2:** el aviso de un parte nuevo va a la CUENTA de los responsables de su SUIGE (leída de
     la lista de responsables). Comprobar en Ajustes que cada SUIGE tiene al menos una persona en «Responsables» (no
     solo «Otras direcciones») y mirar en el historial del próximo parte a quién llegó.
11. **Cuadrante de servicios, versión 2026-11-23 · 1 (tabla del mes arriba al asignar, solicitudes de acceso pendientes a la vista; guardar, publicar y avisar por separado: ningún botón de guardar o publicar manda correos, provisional antes de publicar, reglas configurables, servicios debidos, cesión con devolución, mes publicado cerrado, vista en tabla, quitar componentes y correos revisados):** subir `cuadrante/colabora/cuadrante.html` a JSUIGE y seguir la
   «Puesta en marcha» de `cuadrante/README.md` (listas, grupos, gestores, permisos, componentes, festivos de 2027 y
   publicar enero). Revisar las reglas en Ajustes y registrar en «Cambios» los servicios que se deben de antes. Probar un cambio de servicio real con AutoFirma y TEMD (las tres firmas). Comprobar los correos con «Probar el aviso a los gestores», con «✉ Probar» de cada componente (en «Componentes»; si a alguien no le llega, cambiarle la cuenta en «Editar») y publicando un mes de prueba. Pendiente: traer los
   permisos autorizados de la aplicación de Permisos y el botón «Comunicar al cuadrante» en Permisos.

## Pendiente de que el usuario decida

- **Eliminar en Incidentes y Pérdidas:** con «Colaborar» pueden eliminar todos; ¿nivel de permiso propio sin «Eliminar
  elementos» para unidades y SUIGE, o limitar el botón en la página?
- **Pérdidas: permisos por elemento** al remitir (cada pérdida visible solo para su unidad, SUIGE e IGE). Aparcado.
- **Buscar en todos los campos** (regla de `CLAUDE.md`): ¿revisar ya todas las aplicaciones o al tocar cada una?
- **Gestor de Tareas común:** ¿control de acceso con solicitud, como META, o sigue abierto a quien tenga permiso en la lista?
- **Página de diagnóstico de permisos** (solo lectura: qué grupos tienen qué nivel en cada lista). Pedida el 20/10/2026.
- **Nuevo proyecto «Acciones derivadas de inspecciones técnicas»:** esperando la estructura de la plantilla.
- **Todas las de Colabora:** autoría y copia **cifrada entera** (`proteger/cifrado.mjs`, 13/11), envío robusto de correo,
  control de acceso con solicitud (lista común «SOLICITUDES ACCESO APLICACIONES», no la interna «Solicitudes de acceso»),
  Ajustes y Accesos solo con Control total.
- **Incidentes 2026-11-12 · 1:** unificada con la de la otra sesión; responsables de los avisos por escalón; adjuntos y
  «Eliminar» con permiso.
- **Pérdidas 2026-11-05 · 3:** búsqueda por nombre/NIF, adjuntos, «Eliminar» con permiso.
- **VSA 2026-11-06 · 1:** solicitudes de acceso arregladas (avisos y lista), lee las antiguas.
- **Permisos 2026-11-05 · 2:** mandos sustitutos, avisos propios al aprobador y al autorizador.
- **Gestor de Tareas / META 2026-11-13 · 2:** (la sesión de SENDERO siguió desde mi 2026-11-10 · 2) quién ve cada
  expediente, Punto de Situación, departamentos de MENSADEF. Batería `colabora/pruebas/todas.sh`.
- **Tareas NLT 16:** tareas desde correos, aspecto como META, «➜ Pasar a META» y quitarla al crearla allí.
- **23/11/2026 · subir a Colabora:** Cuadrante 2026-11-23 · 2 (tabla arriba al asignar; ausencias que no se pierden ni
  duplican con «HTTP 503»), Incidentes 2026-11-23 · 1, Pérdidas 2026-11-23 · 1, VSA 2026-11-23 · 1 y Permisos 2026-11-23 · 2
  (en todas, los correos llevan solo el botón, sin la dirección escrita debajo). Si el 503 de las ausencias se repite,
  decir si pasa siempre o a veces y si se adjuntaba un documento.
- **24/11/2026 · Centro de Control NLT (SUIGESUR) 2026-11-24 · 3** (valores de los desplegables en Ajustes, lista NLT_CONFIGURACION; catálogo según la Guía 2026 con «📘 Guía de tramitación 2026» en Obligaciones): subir `suigesur/colabora/CENTRO_CONTROL_NLT_SUIGESUR.html`
  a `/et/SUIGESUR/JSUIGE/aplicaciones` (sustituye al anterior) y probar «Informes › 🖨 Imprimir / PDF». Pendiente de decidir:
  ponerle el control de acceso con solicitud y los avisos por correo del modelo común (aún no los tiene).
- **25/11/2026 · CECONSEG 2026-11-25 · 7** (operadores CECONSEG elevado a IGE, con la metodología de Incidentes; periodicidad
  elegible en Ajustes y justificación obligatoria de cada operador sin HPS, certificado sin cursar o compromiso sin firmar; informe detallado con gráficos, imprimir / PDF y Excel, como Incidentes; responsables de los avisos tomados de Incidentes si no tiene los suyos): subir
  `ceconseg/colabora/ceconseg.html` a la biblioteca del sitio de IGE y seguir la «Puesta en marcha» de `ceconseg/README.md`
  (preparar la lista, unidades obligadas, periodicidad, grupo CECONSEG_UNIDADES y permisos). Como ya se
  preparó con la versión 4: en Ajustes › Preparación pulsar los dos «Crearlas» (NOMBRE1N–3N en partes y NOMBRE2N en unidades).
- **25/11/2026 · Ocultar biblioteca y listas en Permisos y Cuadrante** (2026-11-25 · 1): subir `permisos/colabora/permisos.html`
  y `cuadrante/colabora/cuadrante.html` (y META, `colabora/colabora/META.html`). Pendiente de decidir: SUIGESUR (sin control
  de acceso ni Accesos todavía).
- **25/11/2026 · DIACU propio por aplicación** (Incidentes, VSA y Pérdidas 2026-11-25 · 2, CECONSEG 2026-11-25 · 9): subir las
  cuatro copias cifradas. Cuando se quiera separar DIACU en una aplicación: Accesos › Preparación › «Crear el grupo
  DIACU_<APLICACIÓN>» y añadir enseguida a sus personas (mientras no exista, DIACU sigue siendo SEGURIDAD_IGE). Pendiente de
  decidir: si Pérdidas tendrá paso de valoración de DIACU.
