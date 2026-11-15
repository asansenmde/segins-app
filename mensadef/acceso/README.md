# SENDERO · Control de acceso (Colabora)

> Parte del proyecto MENSADEF (`[MENSADEF]`). © 2026 Cte. Alfredo Sánchez Sender.

Página que decide **quién puede usar SENDERO**. Se sube a Colabora, sitio `/et/SUIGESUR/colaborativo` (todo el ET tiene
acceso), en `Documentos compartidos/SENDERO-acceso.html` (si se sube a otra biblioteca, cambiar `URL_ACCESO` en
`../generar-marcador.py` y regenerar el favorito).

- **Se sube** `subir/SENDERO-acceso.html` (copia protegida, la genera `generar-marcador.py`). `SENDERO-acceso.html` es el
  original legible.
- **Listas** (las crea la pestaña «Preparación», con Control total del sitio):
  - «SENDERO Autorizados»: `Title` (valor: código del ámbito o correo), `Tipo` (Ámbito, Persona, Bloqueo, Versión),
    `Activo`, `Responsables` (correos, en los ámbitos), `Hasta` (opcional), `Nota` (en Versión: dirección del favorito).
    Permisos propios: todos **leen**, solo Control total y el grupo «SENDERO Administradores» (Colaborar) escriben.
  - «SENDERO Solicitudes»: `Title` (nombre), `Correo`, `Ambito`, `Motivo`, `Estado` (Pendiente, Aprobada, Denegada),
    `Respuesta`, `RespondidoPor`, `VersionSendero`. Todos pueden **crear**; cada uno ve y edita solo las suyas; el grupo
    (Diseño) las ve todas.
- **Reglas**: ámbito activo = todos los de ese ámbito de MENSADEF; ámbito inactivo con responsables = nadie en bloque, sus
  responsables aprueban una a una; persona; bloqueo (gana a todo). «Hasta» deja una regla sin efecto desde el día
  siguiente.
- **Modos de la página**: sin nada en la dirección, gestión (Control total: todo; responsables de ámbito: solicitudes de
  sus ámbitos y autorizar o bloquear personas; el resto: su solicitud). `#solicitar=…`: formulario de solicitud (lo abre
  SENDERO). `#comprobar=…`: responde a SENDERO con `postMessage` solo a `https://mensadef.mdef.es` (marco oculto o ventana
  pequeña) qué cuenta de Colabora es, si está autorizada, por qué regla, su última solicitud y la versión vigente.
- **Aviso por correo** de solicitudes nuevas: alerta de Colabora (enlace en «Preparación»); la página no envía correos.
- Pruebas: `node ../pruebas/acceso.mjs` (`VERBOSE=1`, `PROTEGIDA=1`); también en `sh ../pruebas/todas.sh`.
