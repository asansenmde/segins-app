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

## Pruebas

Playwright contra un SharePoint simulado (rutas `page.route`), con formato ligero y *verbose*, alta,
modificación con conflicto, comentarios y correo. Para ejecutarlas: `node colabora/pruebas/simulacion.mjs`,
`node mensadef/pruebas/visor.mjs` y `node mensadef/pruebas/diagnostico.mjs` (Playwright global y Chromium ya
instalados). Copiarlas a la carpeta del proyecto nuevo y adaptar los datos simulados (sin datos reales).
