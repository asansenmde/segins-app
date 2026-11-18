# Cuadrante de servicios `[CUADRANTE]`

Página para Colabora, sitio JSUIGE. Lleva dos cuadrantes: el de **oficiales** (jefe de servicio) y el de **suboficiales**
(auxiliar de servicio). Aún no hay nada creado en SharePoint: las listas las creará la propia página desde Ajustes.
Modelo obligatorio de Colabora (`CLAUDE.md`): control de acceso con solicitud, Ajustes y Accesos solo con Control total,
correo a la cuenta y copia cifrada entera.

## Reglas acordadas con el usuario (18/11/2026), en revisión

- **Turnos de entre semana:** bloques de lunes-martes y miércoles-jueves.
- **Turnos de fin de semana:** de viernes a domingo.
- **Festivos:** un festivo entre semana es turno de festivo, de la lista de fin de semana.
  - Calendario: nacionales, Andalucía y Sevilla.
  - El gestor mantiene la lista de festivos.
- **Puente:** el gestor lo marca a mano. El fin de semana más los festivos pegados son un solo turno.
- **Rotación:** cada cuadrante tiene su rotación de entre semana y su rotación de fin de semana. Cada persona está en las dos.
- **Se salta el servicio** (y quien se salta **pierde el turno**: lo hace el siguiente y la rotación sigue) con:
  - vacaciones de **más de 5 días**;
  - comisión de servicio;
  - baja médica, curso o permiso.
- **Vacaciones de 5 días o menos:** no se salta. Si coinciden con un servicio, el usuario tiene que hacer un **cambio de
  servicio**; es lo único que se permite. La página avisa del choque y el gestor ve si está resuelto.
- **Turnos cortos:** si un festivo parte un bloque de entre semana, el día que queda es turno de diario. Por ejemplo,
  con el martes festivo, el lunes es diario. El día festivo es turno de festivo.
- **Turno entre dos meses** (lunes 30 y martes 1): cuenta en el mes en que empieza. La rotación es la misma de un mes a otro.
- **Sin descanso mínimo** entre servicios. Nadie está exento.
- **Cambios entre compañeros:** uno lo pide, el otro acepta y el gestor lo aprueba. Queda en el historial.
- **Gestores:** son comunes a los dos cuadrantes.
  - La página propone el mes y el gestor lo modifica y lo publica, unos 15 días antes.
  - Las ausencias se pueden comunicar hasta el mismo día.
  - Si una ausencia choca con un servicio ya publicado, se avisa al gestor y se le propone al siguiente.
- **Ausencias:** las comunica el usuario y el gestor las aprueba.
- **Vacaciones desde Permisos:** salen de la aplicación Permisos (`/et/SUIGESUR/colaborativo/CALIDAD-VIDA`, lista
  «Solicitud de Permisos»).
  - Columnas: `TipoDePermiso`, `FechaInicio`, `FechaDeFin`, `Estado`; concedido = AUTORIZADO.
  - Primera fase, solo en el cuadrante: al entrar, cada usuario ve sus permisos autorizados y los pasa al cuadrante.
  - Segunda fase, cambio en `[PERMISOS]`: un botón «Comunicar al cuadrante de servicios».
- **Cambio de servicio con firma (AutoFirma, como en VSA):** uno lo pide y firma, el otro lo acepta y firma, y el gestor
  lo valida. El cuadrante mensual también se puede firmar.
- **Quién lo ve:** solo quien está de alta en los cuadrantes.
- **Avisos por correo:**
  - el mes publicado, a cada uno con sus servicios;
  - recordatorio el día antes;
  - ausencias nuevas, al gestor;
  - cambios, a los afectados.
- **Impresión:** cuadrante mensual. No se exporta a Outlook.

Pendiente de confirmar: ver la conversación del 18/11/2026 y `PENDIENTES.md`.
