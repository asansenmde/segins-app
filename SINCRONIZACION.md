# Plataforma de tareas: MENSADEF + Outlook → Tareas Colabora

Objetivo: que un mensaje oficial de **MENSADEF** o un **correo de Outlook** se convierta con un clic en una
tarea del **grupo de trabajo**, y que todo el grupo la vea y la gestione al momento.

La aplicación de tareas es el **Gestor de tareas de la Jefatura de SUIGESUR** (`colabora/`, versión 2026-10-27 · 1):
se edita `colabora/tareas-nlt-colabora.html` y se sube a Colabora la copia protegida
`colabora/colabora/tareas-nlt-colabora.html`. MENSADEF se usa en
`https://mensadef.mdef.es/ambito/2SUIGE/SitePages/ambito.aspx` (célula SETEC SEGURIDAD); el marcador del visor se
pulsa desde esa misma página.

## Decisión principal: el centro es la lista «Gestor de Tareas» de Colabora

```
  MENSADEF (mensadef.mdef.es)          Outlook (escritorio o web)
  visor «Mensajes MENSADEF»            correo .msg / .eml
          │ ➜ Crear tarea en Colabora          │ arrastrar o «✉ Desde correo»
          │ (datos en el #fragmento,           │ (se lee en el navegador)
          │  no pasan por ningún servidor)     │
          ▼                                    ▼
  ┌──────────────────────────────────────────────────────────┐
  │  Tareas Colabora (colabora.mdef.es)                      │
  │  lista «Gestor de Tareas» = tareas del grupo de trabajo  │
  │  alta revisada · sin duplicados · responsable e          │
  │  implicados · correo de asignación · comentarios         │
  │  actualización automática con novedades de los demás     │
  └──────────────────────────────────────────────────────────┘
          │ (opcional, solo referencias sin contenido)
          ▼
  Tareas NLT personal (claude.ai)
```

Por qué Colabora y no Tareas NLT (claude.ai):

- **Los datos oficiales no salen de la red del Ministerio.** Tareas NLT guarda en la cuenta de claude.ai (fuera
  del Ministerio) y sincroniza con Google Calendar. El contenido de MENSADEF y de los correos de trabajo no debe ir
  allí. Colabora es un servidor interno y la lista ya tiene los permisos del grupo.
- **El grupo de trabajo ya existe allí**: responsables, personal implicado, negociados, correo interno de
  asignación, historial de comentarios y los flujos de la lista.
- Cada persona trabaja con **su sesión y sus permisos**: nadie ve ni modifica nada que no pudiera ver o
  modificar en Colabora.

## Lo que ya funciona (fase 1)

### MENSADEF → tarea (`mensadef/visor-mensadef.html`)

En el detalle de cada mensaje, **«➜ Crear tarea en Colabora»**:

1. La primera vez pide la dirección de la página de Tareas Colabora (se guarda en ese navegador).
2. Abre Colabora en una pestaña con el alta **ya rellena**: el asunto y, en la descripción, el origen, fecha,
   autoridad, referencia, su referencia, expediente de MENSADEF, enlace a la ficha y el texto del mensaje. El
   expediente del asunto sigue siendo el **nº de Colabora**, que se asigna al crearlo.
3. Se revisa (responsable, NLT, negociado, implicados…) y se pulsa **Crear en Colabora**. Se manda el correo de
   asignación como en cualquier alta.

MENSADEF y Colabora son servidores distintos y el navegador no deja que una página escriba en el otro. Por eso
los datos viajan en el **fragmento de la dirección** (`#importar=…`): el navegador no lo envía a ningún servidor
(ni a Colabora ni a nadie), solo lo lee la página de Colabora al abrirse, y lo borra de la barra de direcciones.
La dirección que se guarda en el visor es la del archivo `tareas-nlt-colabora.html` de la biblioteca; si se pone la
de una página del portal que la lleva dentro, también funciona.

En la tabla del visor, los mensajes ya pasados llevan **«➜ Tarea»** (y la columna «Pasado a Colabora» en el CSV).

### Outlook → tarea (`colabora/tareas-nlt-colabora.html`)

- **Arrastrar el correo** desde Outlook a la página de Tareas Colabora, o botón **«✉ Desde correo»**.
- Admite **.msg** (Outlook de escritorio; si el navegador no acepta el arrastre directo, arrástralo antes al
  escritorio o usa *Archivo → Guardar como*) y **.eml** (Outlook en la web: *⋯ → Descargar*).
- El correo se lee en el navegador (no se sube a ningún sitio): asunto, remitente, destinatarios, fecha, texto
  y nombres de los adjuntos. Rellena el alta igual que un mensaje de MENSADEF.

### Sin duplicados

La descripción guarda una línea con el identificador de origen (`Id. mensaje MENSADEF: …` o `Id. correo: …`).
Si se intenta pasar otra vez el mismo mensaje o correo, la página avisa y enseña el asunto que ya existe (con
la opción de crear otro igualmente).

### «Tiempo real» para el grupo

La página de Tareas Colabora se **actualiza sola** (cada 2 minutos por defecto; *Ajustes*), solo con la pestaña
visible y sin interrumpir si estás escribiendo o tienes una ficha abierta. Los asuntos **nuevos o cambiados por
otras personas** se marcan («Nuevo», «Cambiado») hasta que los abres, y la cabecera dice cuántas novedades hay.

## Siguientes fases (propuestas)

| Fase | Qué | Necesita |
|---|---|---|
| 2 | **Clasificar en el visor de MENSADEF**: reglas por tipo, autoridad u órgano que sugieran responsable, negociado, prioridad y NLT al pasar el mensaje (p. ej. «Órdenes de JSUIGE → Seguridad, NLT 5 días»). | Solo cambios en las páginas. Que me digas las reglas (sin contenido). |
| 2 | **Pasar varios mensajes de golpe** desde el visor (selección múltiple → una pestaña de Colabora con la lista para dar de alta uno a uno). | Solo cambios en las páginas. |
| 2 | **Tablero del grupo** en Tareas Colabora: carga por persona, lo que entra cada día por origen (MENSADEF / correo / manual), vencidos por negociado. | Solo cambios en la página. |
| 3 | **Correo → tarea sin abrir la página**: un buzón o carpeta de Outlook cuyos correos crean el asunto solos. | Un flujo en el servidor (Power Automate o flujo de SharePoint) o un complemento de Outlook desplegado por el CIS. Consultar con informática. |
| 3 | **Avisos automáticos** (vencimientos, asignaciones) aunque nadie abra la página. | Flujo de trabajo en la lista de Colabora (servidor). |
| 3 | **Enlace con Tareas NLT personal**: solo la referencia y la NLT, sin asunto ni texto, para verla en tu agenda. | Visto bueno de tu responsable de seguridad. |

## Seguridad

- Las páginas usan **tu sesión**: solo leen lo que tú puedes leer y solo escriben donde tienes permiso (403 = sin
  permiso). Nada se borra.
- Ningún dato sale de los servidores del Ministerio ni pasa por internet. El fragmento `#importar=` no se envía a
  ningún servidor y se borra al abrir la página. Lo único que guarda el navegador es la dirección de la página de
  Colabora y los identificadores de los mensajes ya pasados.
- Todo lo que llega (de MENSADEF, de un correo o de la dirección) se muestra como texto: no se ejecuta nada.
- Antes de usarlo con mensajes clasificados o de difusión limitada, consúltalo con tu responsable de seguridad.

## Pruebas

`node mensadef/pruebas/visor.mjs` (botón «Crear tarea en Colabora») y `node colabora/pruebas/importar.mjs`
(alta desde MENSADEF, duplicados, datos manipulados, correo .msg y .eml, actualización automática), con datos
simulados.
