# Cómo pedir cambios y páginas nuevas

## Los proyectos

| Etiqueta | Carpeta | Qué es |
|---|---|---|
| `[SEGINS]` | raíz | Evaluación de seguridad de instalaciones (la app original) |
| `[NLT]` | `tareas/` | Tareas NLT, tu gestor personal (el de claude.ai) |
| `[COLABORA]` | `colabora/` | Tareas Colabora, lista «Gestor de Tareas» del SharePoint interno |
| `[MENSADEF]` | `mensadef/` | Visor de mensajes de MENSADEF |
| `[PERMISOS]` | `permisos/` | Solicitud, aprobación y autorización de permisos (Colabora, CALIDAD-VIDA) |

Para el desarrollo, las piezas reutilizables y las pruebas están en `SHAREPOINT.md`.

## Para pedir un cambio

Empieza el mensaje con la **etiqueta** del proyecto. Así no hay confusión posible:

> **[MENSADEF]** En el visor, añade un filtro por «Su referencia».
>
> **[COLABORA]** Que el aviso por correo incluya también los asuntos en espera.
>
> **[NLT]** Quiero una categoría por defecto al crear tareas.

Si no pones etiqueta y no queda claro, te preguntaré a qué proyecto te refieres antes de tocar nada.

Consejo: para trabajar mucho tiempo en un proyecto, abre **una sesión de Claude Code distinta por proyecto** y
escribe al empezar «Trabajamos solo en [MENSADEF]». Cada conversación queda más corta y centrada.

## Para pedir una página nueva de SharePoint (ejemplo: incidentes de seguridad)

**1. Localiza la lista** (sin copiarme contenido):
- Si está en **Colabora**: sube `colabora/prueba-sharepoint.html` a una biblioteca de **ese mismo sitio** y
  ábrela. Te enseña las listas del sitio y las columnas de la que elijas.
- Si está en **MENSADEF**: pulsa el favorito «Prueba MENSADEF» en la portada de ese ámbito.
- Si está en **otro SharePoint**: prueba primero a subir `colabora/prueba-sharepoint.html`; si se descarga en vez
  de abrirse, dímelo y preparo un marcador como el de MENSADEF.

**2. Pídemela con esta ficha** (cópiala y rellénala):

```
[NUEVO] Página de …………… (p. ej. incidentes de seguridad)
- Servidor y sitio: …………… (p. ej. Colabora, /et/SUIGESUR/JSUIGE)
- Lista o biblioteca: ……………
- Columnas (las del diagnóstico, o el resumen que te da): ……………
- Qué quiero ver: …………… (p. ej. abiertos por gravedad, por instalación, vencidos)
- Filtros y búsqueda: ……………
- Informes o exportación: …………… (Word, CSV, correo…)
- ¿Solo consultar o también dar de alta / modificar?: ……………
- ¿Relación con otro proyecto?: …………… (p. ej. pasar un incidente a Tareas Colabora)
```

**3. Yo la hago en su propia carpeta** (`incidentes/`), con su README, la etiqueta `[INCIDENTES]` y pruebas
contra un SharePoint simulado. Te la paso para subirla (o su marcador, si el servidor no ejecuta páginas).

**4. La pruebas** y me cuentas qué falla o qué falta **sin pegar contenido**: describe el problema o manda una
captura en la que no se lean datos.

### Recordatorio de seguridad

Las páginas leen con **tu sesión y tus permisos**, no ven nada que tú no veas, y los datos no salen del
servidor. Lo único que me pasas son nombres de listas y columnas y recuentos. Para sistemas oficiales, consulta
con tu responsable de seguridad antes de usarlas o de enviarme resúmenes.
