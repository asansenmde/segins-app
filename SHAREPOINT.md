# Piezas reutilizables para páginas de SharePoint

Guía técnica para crear páginas nuevas como Tareas Colabora o el visor de MENSADEF. **Se copia el código, no se
comparte** entre carpetas (cada proyecto es independiente). Las reglas generales están en `CLAUDE.md` y el
procedimiento para pedir una página nueva en `PROYECTOS.md`.

## Cómo se ejecuta la página

| Servidor | Cómo | Ejemplo |
|---|---|---|
| Ejecuta `.html` subidos a una biblioteca (Colabora) | Se sube el archivo y se abre desde la biblioteca | `colabora/tareas-nlt-colabora.html` |
| Los descarga en vez de abrirlos (MENSADEF) | Marcador `javascript:` que escribe la página sobre una del servidor (mismo origen y sesión) | `mensadef/generar-marcador.py` |

Antes de construir nada: página de diagnóstico (`colabora/prueba-sharepoint.html` o marcador «Prueba MENSADEF»)
para saber listas, columnas (nombres internos) y tipos. **Nunca pedir contenido al usuario.**

## Lectura (en `colabora/tareas-nlt-colabora.html` y `mensadef/visor-mensadef.html`)

- `api(url)`: `odata=nometadata` y, si responde 400/406/415, `odata=verbose` (SharePoint 2013), normalizado a `{ value, odata.nextLink }`.
- `webDe(ruta)`: busca el sitio subiendo por la ruta hasta que `/_api/web` responde.
- Paginación con `$top=500` y `odata.nextLink` / `__next`.
- Columnas de persona: `$select=Campo/Id,Campo/Title,Campo/EMail&$expand=Campo`.
- Texto enriquecido: `texto(html)` con `DOMParser` (no ejecuta nada) y mostrar siempre con `esc()`.
- Tipos y opciones de columnas: `/fields?$select=InternalName,Choices,RichText,Required,TypeAsString&$filter=…`.
  Propiedades de un tipo concreto (p. ej. `AppendOnly` de texto multilínea): pedir la columna sola con
  `/fields/getbyinternalnameortitle('X')`, porque en `$select` de la colección da error.

## Escritura (solo si el usuario la pide)

- `obtenerDigest()`: `POST /_api/contextinfo` → `X-RequestDigest` (se reutiliza hasta que caduca).
- `enviarSP(url, cuerpo, mensaje403, cabecerasExtra)`: POST verbose; 403 = sin permiso, 412 = conflicto.
- **Alta**: `POST …/items` con `__metadata.type = ListItemEntityTypeFullName` de la lista.
- **Modificar**: `leerElemento(id)` (GET verbose con etag) → si `Modified` ha cambiado desde que se cargó, avisar;
  si no, `POST items(id)` con `X-HTTP-Method: MERGE` e `IF-MATCH: <etag>`. Enviar **solo los campos cambiados**.
- Formato de valores: fecha `toISOString()`; persona `CampoId: n`; varias personas `CampoId: { results: [..] }`
  (si la columna es `User` y no `UserMulti`, un solo número); elección múltiple
  `{ __metadata: { type: 'Collection(Edm.String)' }, results: [..] }`; vaciar = `null`.
- **Nunca borrar** salvo petición expresa.

## Personas

- `selectorPersona(input, caja, alElegir)`: sugiere al escribir. Primero los usuarios del sitio
  (`/_api/web/siteusers`); desde 3 letras, el directorio con
  `POST /_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser`
  (la respuesta es un JSON en texto). Al elegir a alguien del directorio: `POST /_api/web/ensureuser`
  `{ logonName: Key }` → Id en el sitio.
- `currentuser?$select=Id,Title,Email` para el usuario actual.

## Correo

- `POST /_api/SP.Utilities.Utility.SendEmail` con `{ properties: { __metadata: { type: 'SP.Utilities.EmailProperties' },
  To: { results }, CC: { results }, Subject, Body (HTML escapado) } }`. Lo envía el correo saliente del propio
  servidor (no sale a internet). Si falla, ofrecer `mailto:` (límite ~2000 caracteres, ver `mailto()`).

### Envío robusto (OBLIGATORIO en toda página que mande correos) · modelo `permisos/permisos.html` (versión 2026-10-22 · 5)

Lección del 22/10/2026: en Permisos un autorizador no recibía las solicitudes. Colabora **rechaza el correo ENTERO** si
**una sola** dirección no es de un usuario que conozca con buzón («Asegúrese de que tenga un destinatario válido»), y
además las personas suelen tener **cuentas antiguas** en el sitio (sin buzón o con otro correo); si el solicitante elige
la antigua, el aviso no llega a nadie. El correo de prueba a la dirección buena sí funcionaba, lo que despistaba.
Copiar de Permisos `enviarUno`, `loginDe`, `otrasDirecciones`, `enviarCorreo`, `msgCorreo`, `claseCorreo`, `anotarAviso`
y `correoPrueba`:

1. Primero un único `SendEmail` con todos los destinatarios.
2. Si falla con «destinatario válido» (`DEST_MAL`), **uno a uno**; para cada dirección rechazada:
   - su **cuenta de inicio de sesión** (por el Id de la persona en el elemento con `getuserbyid(Id)`; para uno mismo,
     `currentuser.LoginName`; si no, buscándola en `siteusers` por `Email`);
   - si tampoco, **otra cuenta del sitio con el mismo nombre** (mismas palabras aunque cambie el orden o las mayúsculas)
     que tenga correo, y se dice «enviado a otra cuenta: antigua → buena».
3. A quien tramita, **siempre** el resultado: a cuántos llegó, qué direcciones no acepta Colabora y botón «Preparar el
   correo en Outlook» (`mailto:`). Nunca tragarse el error con `.catch(() => null)`.
4. **Anotar en el historial del elemento** a quién llegó de verdad (o «NO ENVIADO (motivo)»).
5. Al **elegir a una persona** en un formulario: si la cuenta elegida no tiene correo en Colabora y la misma persona tiene
   otra cuenta del sitio con correo, usar esa.
6. En la ficha, recuadro **«Aviso por correo»**: a qué direcciones iba, si la persona figura con OTRA cuenta o «sin
   correo», y botón «Reenviar el aviso ahora». En Ajustes, **«Correo de prueba»**.
7. Simular en las pruebas un Colabora que rechaza direcciones (`buzonMal` en `permisos/pruebas/simulacion.mjs`).

## Comentarios con historial

- Columna multilínea con «Anexar cambios al texto existente» (`AppendOnly`): se escribe solo el comentario nuevo.
- Historial: `POST /_vti_bin/Lists.asmx` SOAP `GetVersionCollection(strlistID, strlistItemID, strFieldName)`;
  cada `<Version>` trae el valor, `Modified` y `Editor` (`id;#Nombre,#…`). Funciona desde SharePoint 2010.
- Si la columna no anexa: releer el texto justo antes y escribir el comentario al principio con fecha y autor.

## Control de acceso con solicitud (modelo: `vsa/vsa.html`, probado en Colabora)

**Ponerlo en toda aplicación nueva** (Permisos, registro, SIPERDEF…), salvo que el usuario diga lo contrario. Se copia
del bloque `ACCESO` / `pantallaAcceso` / `vistaAccesos` de VSA y se adapta la constante `ACCESO`
(`app`, `grupoBae`, `grupos`, `avisar`, `papeles`).

- **Quién entra**: grupos de papel (`web/currentuser/groups`), un grupo propio de la aplicación (p. ej. `VSA_BAE`) o
  Control total. Si no, o si la lista principal da 403/404: pantalla «🔒 No tienes acceso» + formulario
  «Solicitar acceso».
- **Solicitud**: nombre y correo de la cuenta (no se escriben); empleo y unidad propuestos con
  `SP.UserProfiles.PeopleManager/GetMyProperties` (Title, Department); mando/unidad en cascada; papel y motivo. Se guarda
  en la lista común **«SOLICITUDES DE ACCESO»** (columna `Aplicacion` distingue cada app) y avisa por correo a
  «Propietarios Colaborativo». El solicitante ve el estado de sus solicitudes.
- **Pestaña «Accesos»** (Control total): aprobar = `POST sitegroups/getbyname('G')/users {SP.User, LoginName}` (login de
  `getuserbyid(n)`) + MERGE de la solicitud + correo; denegar con motivo; quitar = `users/removebyid(id)`.
- **Preparación** (botones, todo por REST, cada línea con ✔/✕ y la versión de la página):
  - crear la lista (`BaseTemplate:100`) y sus columnas (`fields/createfieldasxml`, `Options:8`); si la lista ya existe
    (p. ej. creada a mano), comprobar `fields?$select=InternalName` y **crear solo las que faltan**;
  - «solo sus elementos»: MERGE de la lista `{ReadSecurity:2, WriteSecurity:2}` (comparar con `Number()`); si falla,
    explicar el camino manual (Configuración avanzada);
  - **abrir la lista a todos**: `breakroleinheritance(copyRoleAssignments=true,clearSubscopes=true)` +
    `roleassignments/addroleassignment(principalid, roledefid)` con «Colaborar» (`roledefinitions/getbytype(3)`) para el
    grupo de todos que ya use el sitio (en Colabora es **«MDEF\usuarios del dominio»**; se busca en
    `web/roleassignments?$expand=Member`; si no, `ensureuser('c:0(.s|true')`). Sin esto, quien no tiene permiso en el
    sitio recibe **404** al leer la lista de solicitudes;
  - crear el grupo propio (`POST sitegroups {SP.Group, Title}`).
- **Nombre de la lista**: si el sitio tiene activadas las solicitudes de acceso de SharePoint, ya existe la lista interna
  **«Solicitudes de acceso»** (solo propietarios) y `getbytitle('SOLICITUDES DE ACCESO')` la encuentra (no distingue
  mayúsculas): los usuarios reciben 404. Comprobar antes `…/_api/web/lists/getbytitle('…')?$select=Title,Id`; en
  Permisos (CALIDAD-VIDA) se usa «SOLICITUDES ACCESO APLICACIONES».
- **Errores**: en la pantalla de acceso, distinguir 404 (no existe o no se ve), 401/403 (sin permiso) y 400 (columna
  que falta) y mostrar el detalle con la versión.
- La seguridad real exige además quitar «Usuarios del dominio» de la lista principal y dar permiso a los grupos.

## Firma electrónica con AutoFirma (modelo: `vsa/vsa.html`, probado en Colabora con TEMD)

**Usarla en toda aplicación que necesite firmar documentos.** Antes de nada, en un equipo nuevo o con dudas, la página
de prueba `vsa/prueba-autofirma.html` (elegir certificado, firmar un PDF y una segunda firma, «Copiar informe»).

- **Librería**: Cliente @firma `autoscript.js` 1.10.1 (github.com/ctt-gob-es/clienteafirma, `afirma-ui-miniapplet-deploy/
  src/main/webapp/js/autoscript.js`; GPL 2+ / EUPL 1.1), **pegada sin modificar** en un `<script>` propio antes del de la
  página. Habla con AutoFirma por `afirma://websocket…` + `wss://127.0.0.1` (nada sale del equipo). Iniciar una vez:
  `SupportDialog.enableSupportDialog(false)` (su diálogo carga imágenes de internet) y `AutoScript.cargarAppAfirma()`.
- **Firmar**: `AutoScript.sign(pdfBase64, 'SHA512withRSA', 'PAdES', params, ok(firmaB64, certB64), ko(tipo, msg, código))`
  siempre desde un clic. `params` (líneas `clave=valor`): `signaturePage`, `signaturePositionOnPageLowerLeftX/Y`,
  `…UpperRightX/Y` (firma visible), `layer2Text=Firmado por $$SUBJECTCN$$ el $$SIGNDATE=dd/MM/yyyy HH:mm$$`,
  `layer2FontSize`, `signReason`. Una segunda firma (otra persona/empresa) es otro `sign` PAdES sobre el PDF ya firmado:
  se añade sin invalidar la primera. `selectCertificate` sirve para probar (devuelve el certificado).
- **Errores**: `AOCancelledOperationException` (AS500001) = el usuario cerró AutoFirma; `ApplicationNotFoundException`
  (AS620017) = no se pudo hablar con AutoFirma (no instalada, bloqueada o no se pulsó «Abrir»; tarda ~30 s en fallar).
- **PDF generado en la página** (sin librerías, ver `pdfCuestionario` en VSA): A4, Helvetica/Helvetica-Bold WinAnsi
  (anchos AFM para partir líneas), texto en latin-1 (mapear –, “”, …, €), recuadros de firma dibujados donde irán las
  firmas visibles. **`/Info` tiene que ser un objeto indirecto**: si va dentro del trailer AutoFirma falla con
  «java.lang.Exception» (ClassCastException en PdfStamperImp).
- **Probar la firma real sin AutoFirma**: proyecto Maven con `es.gob.afirma:afirma-crypto-pdf:1.9.1` y
  `new AOPDFSigner().sign(pdf, "SHA512withRSA", clavePrivada, cadena, propiedades)` con un PKCS#12 de prueba (openssl);
  comprobar con pypdf/pymupdf que hay dos campos `/Sig` y que se ven los recuadros.
- **Guardar**: adjuntar con `AttachmentFiles/add(FileName='…')`. Para reemplazar, **leer antes la lista de adjuntos** y
  borrar solo si existe (`getByFileName('…')` + `X-HTTP-Method: DELETE`): en SharePoint 2013 borrar uno que no existe
  da 500 «fileName fuera del intervalo», no 404. Las anotaciones posteriores, releyendo el elemento (adjuntar cambia
  `Modified`). El estado de firmas se deduce de los nombres de los adjuntos; al subir el PDF de la otra parte,
  comprobar que tiene ≥ 2 `/ByteRange` y que empieza por los bytes del PDF ya firmado.

## Autoría y copia protegida (modelo: `vsa/proteger/`)

Original legible en el repositorio; a Colabora se sube una copia generada con `javascript-obfuscator` (solo el último
`<script>`, el de la aplicación; las librerías de terceros con licencia, como AutoFirma, se dejan tal cual), con
`selfDefending` y `domainLock: ['.mdef.es']`; además se quitan los comentarios internos del HTML y del `<style>` (solo
queda el aviso de autoría). Aviso de autoría «© 2026 Cte. Alfredo Sánchez Sender» en cabecera HTML,
`meta author` y pie visible (oculto al imprimir). Las pruebas simuladas se pasan también contra la copia protegida
(el origen simulado `https://colabora.mdef.es` cumple el bloqueo de dominio).

## Ocultar la ruleta y la cinta en el portal (Editor de scripts) · 20/10/2026

Página del portal: `/et/jige/colaborativo/SitePages/AREA SEGURIDAD PUBLICO.aspx`, elemento web **Editor de scripts**.
Oculta a los usuarios normales la ruleta (⚙), la cinta, «Compartir», «Seguir», «Contenido del sitio» y la
configuración; lo ve todo quien es administrador de la colección, puede administrar el sitio (`ManageWeb`
0x40000000), administrar permisos (0x2000000) o personalizar páginas (0x40000), y en modo edición. **No es
seguridad** (solo actúa en esa página; quien escriba la dirección entra): lo que protege son los permisos.

**Cómo volver a ver la ruleta (el usuario lo preguntará):**
1. Abrir la página **directamente** (sin `_layouts/15/start.aspx#/`) y con `?admin=1`:
   `https://colabora.mdef.es/et/jige/colaborativo/SitePages/AREA%20SEGURIDAD%20PUBLICO.aspx?admin=1`
   (con la versión actual del código también vale detrás del `#`).
2. Si aun así no sale: `…/AREA%20SEGURIDAD%20PUBLICO.aspx?contents=1` (mantenimiento de elementos web de SharePoint)
   › marcar el Editor de scripts › **Eliminar**. La página vuelve a ser normal.
3. Si como administrador no se ve sin `?admin=1`: F12 › Consola › línea «Permisos (Low): …» (o «Ruleta visible: …»)
   para saber qué permiso detecta y ajustar la máscara `PUEDE`.

Código (versión vigente):

```html
<style id="ocultarAdmin">
  #O365_MainLink_Settings, #siteactiontd, .ms-siteactions-root,
  a[id$=ctl00_site_share_button], #site_follow_button, .ms-promotedActionButton,
  #s4-ribbonrow, a[href*="viewlsts.aspx"], a[href*="/_layouts/15/settings.aspx"], .ms-navedit-editLinksText
  { display: none !important; }
</style>
<script>
  (function () {
    var ctx = window._spPageContextInfo || {};
    var mostrar = function (porque) { var s = document.getElementById('ocultarAdmin'); if (s) s.parentNode.removeChild(s); try { console.info('Ruleta visible: ' + porque); } catch (e) {} };
    var editando = document.forms[0] && document.forms[0].MSOLayout_InDesignMode && document.forms[0].MSOLayout_InDesignMode.value === '1';
    if (/[?&#]admin=1/.test(location.href)) return mostrar('admin=1');
    if (ctx.isSiteAdmin) return mostrar('administrador de la colección');
    if (editando) return mostrar('modo edición');
    var PUEDE = 0x40000000 | 0x2000000 | 0x40000;   // administrar sitio, administrar permisos, personalizar páginas
    var web = (ctx.webServerRelativeUrl || '/et/jige/colaborativo').replace(/\/$/, '');
    fetch(web + '/_api/web/EffectiveBasePermissions', { credentials: 'same-origin', headers: { Accept: 'application/json;odata=verbose' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var p = (d.d || d).EffectiveBasePermissions || d.d || d, bajo = Number(p.Low) || 0;
        try { console.info('Permisos (Low): ' + bajo.toString(16)); } catch (e) {}
        if (bajo & PUEDE) mostrar('permiso de administración');
      })
      .catch(function (e) { try { console.info('No se pudieron leer los permisos: ' + e); } catch (x) {} });
  })();
</script>
```

Bits de `EffectiveBasePermissions.Low` (PermissionKind − 1): ViewListItems 0x1, AddListItems 0x2, EditListItems 0x4,
ManageLists 0x800, AddAndCustomizePages 0x40000, ManagePermissions 0x2000000, ManageWeb 0x40000000.

## Abrir la aplicación dentro de una página del portal (que no se vea dónde está el .html) · 20/10/2026

Página `SitePages/<App>.aspx` con un **Editor de scripts** (más el código de la ruleta para quitar la cinta):

```html
<iframe id="app" style="width:100%;height:calc(100vh - 150px);border:0" title="Incidentes de seguridad en instalaciones"></iframe>
<script>
  // Pasa el «?id=» de los enlaces de los correos a la aplicación (también con la descarga mínima «start.aspx#/…»)
  var m = (location.search + location.hash).match(/[?&]id=(\d+)/);
  document.getElementById('app').src = '/et/jige/colaborativo/Documentos%20compartidos/incidentes.html' + (m ? '?id=' + m[1] : '');
</script>
```

- En el portal, los botones apuntan a `SitePages/Incidentes.aspx` / `SitePages/VSA.aspx`, no al `.html`.
- VSA e Incidentes detectan que están en un iframe del mismo sitio y ponen en los correos el enlace a la página del
  portal (`…/SitePages/Incidentes.aspx?id=N`), también si se abrió por `_layouts/15/start.aspx#/SitePages/…`.
- En Accesos › Preparación: «Ocultar la biblioteca» donde está el `.html` (`lists(guid)` MERGE `Hidden: true`) para que
  no salga en «Contenido del sitio»; si es «Documentos compartidos» avisa de que es la general y que conviene mover los
  `.html` a una biblioteca propia («Aplicaciones», solo Lectura para «Usuarios del dominio»). «Volver a mostrarla» lo
  deshace. No es seguridad: quien tenga la dirección la abre; protege la copia cifrada y los permisos de las listas.
- **Entrar en una biblioteca oculta** (el usuario lo preguntará): ocultarla no la borra; se entra por su dirección directa
  `…/colaborativo/<Biblioteca>/Forms/AllItems.aspx` (p. ej. `…/Documentos%20compartidos/Forms/AllItems.aspx`; guardarla en
  favoritos antes de ocultar), con «Volver a mostrarla» en Accesos › Preparación, o abriendo un `.html` de la biblioteca y
  cambiando el nombre del archivo por `Forms/AllItems.aspx`. Para subir una versión nueva basta la dirección directa.

## Pruebas

Playwright contra un SharePoint simulado (rutas `page.route`), con formato ligero y *verbose*, alta,
modificación con conflicto, comentarios y correo. Para ejecutarlas: `node colabora/pruebas/simulacion.mjs`,
`node mensadef/pruebas/visor.mjs` y `node mensadef/pruebas/diagnostico.mjs` (Playwright global y Chromium ya
instalados). Copiarlas a la carpeta del proyecto nuevo y adaptar los datos simulados (sin datos reales).
