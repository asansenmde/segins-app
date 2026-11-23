# Organizaciones · META y PSIT para todo el ET

> Proyecto `[ORGANIZACIONES]`, independiente de los demás. © 2026 Cte. Alfredo Sánchez Sender.

## Idea (acordada el 23/11/2026, a falta de la fase 0)

- **El código, solo en SUIGESUR.** META y el Punto de Situación (PSIT) se publican una sola vez, en
  `/et/SUIGESUR/JSUIGE/aplicaciones`. Nadie más sube copias.
- **Los datos, en el sitio de cada organización.** `META.html?org=IGE` trabaja con las listas del sitio de Colabora de la
  IGE, con los permisos de quien la abre. SUIGESUR es una organización más (sus listas de JSUIGE, sin migrar nada).
- **Tres niveles:**
  1. Central (el Cte. Sánchez Sender y quien designe): da de alta organizaciones, sus sitios y sus administradores, desde
     una consola y la lista «Organizaciones» de JSUIGE.
  2. Administradores de cada organización (los que nombra el nivel central, no quien tenga Control total del sitio): Ajustes,
     instalación, células y negociados, accesos y solicitudes.
  3. Usuarios: los que da de alta su administrador.
- **Límites:** solo sitios del mismo servidor (`colabora.mdef.es`); los propietarios del sitio de la organización siempre
  pueden ver sus listas desde SharePoint; una versión para todos exige copia de pruebas central, organización piloto y
  listas que aguanten versiones anteriores («Actualizar la instalación»); índices en las columnas filtradas (límite de 5.000).

Fases: 0 prueba de sitio · 1 consola central y lista «Organizaciones» · 2 META para varias organizaciones (`colabora/`) ·
3 PSIT para varias organizaciones (sesión `[PUNTOS]`) · 4 piloto y resto.

## Fase 0 · `prueba-sitio.html` (versión 2026-11-23 · 1)

Página de diagnóstico. **Solo lee**: peticiones GET y la clave de escritura (`POST /_api/contextinfo`, no cambia nada).
No crea, no modifica, no borra, no envía correos, no lee el contenido de las listas ni el nombre de la persona.

- **Se sube** tal cual a `/et/SUIGESUR/JSUIGE/aplicaciones/prueba-sitio.html` (página de diagnóstico, sin copia protegida,
  como `colabora/prueba-sharepoint.html`).
- **Dónde está esta página**: sitio, carpeta, servidor, colección de sitios, versión de SharePoint y formato.
- **Por cada sitio pegado** (cualquier dirección de dentro del sitio; varios, uno por línea; se prueban de uno en uno):
  mismo servidor; se llega al sitio (sube por la ruta y para en un 401/403); versión y formato; tus permisos (ver, añadir,
  editar, eliminar, administrar listas, administrar permisos, crear grupos, administrar el sitio, API remotas); si se
  podría instalar; colección de sitios (misma u otra); si tu cuenta figura en el sitio; clave de escritura; cuántas listas
  y si ya existen las de META y del PSIT; niveles de permiso («Lectura restringida», «META»); tiempos.
- **📋 Copiar el resultado**: solo estructura (direcciones, sí/no, tiempos).
- Sirve también para que **un administrador de otra organización** la abra desde SUIGESUR y pruebe su sitio con su cuenta:
  así se comprueba además que puede abrir la biblioteca `aplicaciones` de JSUIGE.

Pruebas: `sh organizaciones/pruebas/todas.sh` (Colabora simulado con cuatro sitios, un sitio sin acceso, otro servidor y
una dirección inexistente; ligero y verbose; comprueba que solo hace GET y la clave, que para en el 401, que la copia no
lleva nombres y que cabe en el móvil).
