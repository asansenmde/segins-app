# SENDERO · Control de acceso (Colabora)

> Parte del proyecto MENSADEF (`[MENSADEF]`). © 2026 Cte. Alfredo Sánchez Sender.

Página que decide **quién puede usar SENDERO**. Se sube a Colabora, sitio `/et/SUIGESUR/JSUIGE`, en
`aplicaciones/SENDERO-acceso.html` (desde el 16/11/2026; antes en `colaborativo`, donde no todos entraban) (si se sube a otra biblioteca, cambiar `URL_ACCESO` en
`../generar-marcador.py` y regenerar el favorito).

- **Se sube** `subir/SENDERO-acceso.html` (copia protegida, la genera `generar-marcador.py`). `SENDERO-acceso.html` es el
  original legible.
- **Listas** (las crea la pestaña «Preparación», con Control total del sitio):
  - «SENDERO Autorizados»: `Title` (valor: código del ámbito o correo), `Tipo` (Ámbito, Persona, Bloqueo, Versión),
    `Activo`, `Responsables` (correos, en los ámbitos), `Hasta` (opcional), `Nota` (en Versión: dirección del favorito),
    `UrlMeta` y `UrlPsit` (en los ámbitos: META y Punto de Situación de esa organización; se mandan a SENDERO con la
    autorización; si la lista es anterior y no tiene esas columnas, se lee sin ellas hasta pulsar «Crear columnas»).
    Permisos propios: todos **leen**, solo Control total y el grupo «SENDERO Administradores» (Colaborar) escriben.
  - «SENDERO Solicitudes»: `Title` (nombre), `Correo`, `Ambito`, `Motivo`, `Estado` (Pendiente, Aprobada, Denegada),
    `Respuesta`, `RespondidoPor`, `VersionSendero`, `Avisos`. Todos pueden **crear**; cada uno ve y edita solo las suyas; el grupo
    (Diseño) las ve todas.
- **Reglas**: ámbito activo = todos los de ese ámbito de MENSADEF; ámbito inactivo con responsables = nadie en bloque, sus
  responsables aprueban una a una; persona; bloqueo (gana a todo). «Hasta» deja una regla sin efecto desde el día
  siguiente.
- **Versión vigente y caducidad**: la versión anotada (la más nueva, título «AAAA-MM-DD · n», con la dirección del favorito en
  `Nota`) y la caducidad de los favoritos (elemento «Caducidad», `Nota` = 30, 60, 90 o «indefinida»); las dos se mandan a SENDERO.
- **2026-11-16 · 2**: «Acceso limitado» ya no cuenta como lectura: «Ajustarlo» da «Leer» a «usuarios del dominio» si solo
  tenía ese (caso real de SUIGESUR: sin «Leer», los usuarios no podían comprobar su autorización). «Permisos propios» se
  pregunta aparte si Colabora no lo devuelve con el resto (decía «todavía hereda» sin ser verdad). Pruebas `LIMITADO=1`.
- **2026-11-16 · 5**: «✎ Editar» en cada regla: carga sus datos en el recuadro de arriba (valor, nota, «Hasta», responsables,
  META y PSIT) y «Guardar cambios»; lo que no se toca se conserva y la regla sigue activa o inactiva como estaba.
- **2026-11-16 · 6**: «✉ Avisar por correo» de la versión vigente (pestaña «Versión vigente»): a las personas autorizadas
  activas y a los responsables de cada ámbito (sin los bloqueados), en copia oculta y con el enlace a la página de instalación;
  envío robusto (si Colabora rechaza alguna dirección, uno a uno). A quien entra por su ámbito sin estar dado de alta no se le
  puede escribir: ve la franja al abrir SENDERO.
- **2026-11-16 · 7**: antes de enviar el aviso de versión sale la **lista de destinatarios con casillas** (marcar/desmarcar
  todos, cuántos marcados) y «✉ Enviar a los marcados».
- **2026-11-16 · 8**: al dar de alta una persona a mano, «✉ Avisarle por correo» (marcada) le manda que está autorizada con el
  enlace a la página de instalación; «✉ Avisar» en cada persona de la lista para mandárselo cuando se quiera. El correo de
  solicitud aprobada lleva también ese enlace.
- **2026-11-16 · 9**: **versión obligatoria** («Obligatoria» al anotar; «Quitar la obligación»): `#comprobar` con una versión
  anterior a la «Mínima» contesta `ok: false, motivo: 'version'` (y un `error` legible para los favoritos que no conocen ese motivo).
- **Modos de la página**: sin nada en la dirección, gestión (Control total: todo; responsables de ámbito: solicitudes de
  sus ámbitos y autorizar o bloquear personas; el resto: su solicitud). `#solicitar=…`: formulario de solicitud (lo abre
  SENDERO). `#comprobar=…`: responde a SENDERO con `postMessage` solo a `https://mensadef.mdef.es` (marco oculto o ventana
  pequeña) qué cuenta de Colabora es, si está autorizada, por qué regla, su última solicitud y la versión vigente.
- **Avisos por correo** (2026-11-15 · 4, envío robusto de `SHAREPOINT.md`): cada solicitud nueva avisa a `AVISAR` (el Cte.) y
  a los responsables de su ámbito; al aprobar o denegar, a quien la pidió. Si Colabora rechaza una dirección, se reintenta
  una a una, por su cuenta y por otra cuenta del sitio con el mismo nombre; se dice a quién no llegó (con «Preparar el correo
  en Outlook») y se anota en la columna `Avisos` de la solicitud. «Correo de prueba» en «Preparación». La alerta de Colabora
  (enlace 🔔) sigue disponible como respaldo.
- Pruebas: `node ../pruebas/acceso.mjs` (`VERBOSE=1`, `PROTEGIDA=1`); también en `sh ../pruebas/todas.sh`.
