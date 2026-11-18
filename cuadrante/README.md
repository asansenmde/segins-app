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

## Decisiones del 18/11/2026 (segunda ronda)

- **Horario:** cada servicio va de 08:00 a 08:00 del día siguiente; el de viernes a domingo acaba el lunes a las 08:00.
  No hay saliente.
- **Vacaciones:** los «más de 5 días» son **laborables**. Con 5 laborables o menos no se salta: hay que hacer un cambio.
- **Comisión, baja y curso:** saltan el servicio siempre, aunque duren un solo día.
- **Ausencia que coincide con parte del turno:** basta un día para que se salte el turno entero; lo hace el siguiente.
- **Orden de la rotación:** por empleo y antigüedad, **del más antiguo al más moderno**. Quien entra nuevo ocupa su
  lugar por empleo y antigüedad.
- **Cambios de servicio:**
  - **permuta** (yo hago tu servicio y tú el mío) o **cesión** (tú me cubres sin devolución);
  - solo entre servicios del mismo tipo (diario con diario; fin de semana o festivo con fin de semana o festivo) y
    dentro del mismo cuadrante;
  - llevan **tres firmas** con AutoFirma (los dos interesados y el gestor), y el PDF firmado se guarda en Colabora.
- **Cuadrante mensual:** no se firma. Se imprime como lista por días, con los dos cuadrantes juntos (cada día con su jefe
  y su auxiliar, y los festivos marcados).
- **Imprevisto el mismo día** (enfermedad repentina): la página propone el siguiente de la lista y el gestor lo confirma
  o elige a otro. Queda anotado y se avisa a los dos.
- **Estadística:** servicios hechos por persona (diario y festivo, por mes y por año), solo para consultar. No corrige
  la rotación.
- **Vista:** todos los dados de alta ven los dos cuadrantes enteros, con lo suyo resaltado.
- **Datos de cada componente:** empleo, antigüedad, teléfono (se ve en el cuadrante) y negociado o destino.
- **Vacaciones de 5 laborables o menos sin cambio:** unos días antes del servicio la página avisa al gestor, que
  decide si mantiene el servicio o asigna a otro.
- **Cambios:** sin plazo ni límite (hasta el mismo día). La permuta no tiene plazo para devolverse; decide el gestor
  al validar.
- **Ausencias:** el adjunto (orden de comisión, parte) es opcional. Si el gestor la rechaza, el motivo es obligatorio
  y se avisa al interesado.
- **Días:** todos iguales, con un jefe y un auxiliar; no hay días especiales aparte de los festivos.
- **Gestores:** grupo de Colabora `CUADRANTE_GESTORES`, sin nadie por encima. Cualquiera de ellos propone, publica,
  aprueba ausencias y valida cambios.
- **Correos:** al publicar el cuadrante (a cada uno, con sus servicios) y cuando hay cambios de servicio. **Sin
  recordatorio diario.**
- **Impreso:** como las demás aplicaciones: «USO OFICIAL», «CUADRANTE DE SERVICIOS · JSUIGE», mes y año, fecha de
  impresión y autoría. Sin escudo.
- **Inicio:** enero de 2027. En diciembre el gestor da de alta a los componentes e indica el siguiente de cada lista;
  no se meten meses anteriores.
- **Permisos:** se pasan al cuadrante **todos los permisos AUTORIZADOS**. Entran ya aprobados (solo se avisa al
  gestor), y el gestor puede cambiarles el tipo. Las ausencias comunicadas a mano (comisión, baja, curso) sí las aprueba
  el gestor.
- **AutoFirma:** todos tienen certificado y AutoFirma. Si alguien no puede firmar, el gestor puede validar igualmente
  y queda anotado «sin firma».
- **Control total en JSUIGE:** el usuario. Desde Ajustes crea las listas y el grupo `CUADRANTE_GESTORES`, y aprueba
  las solicitudes de acceso.

## Lo que se toma de la hoja actual (Excel de 2026, solo como referencia)

- **Componentes:** nº de escalafón y fecha de antigüedad en el empleo, que sirven para ordenar la rotación.
- **Tipos de ausencia, con su color:**
  - vacaciones (verde claro);
  - asuntos propios, «AAPP» (azul);
  - baja médica (rojo);
  - comisión de servicio (verde);
  - permiso, como el de paternidad (naranja claro);
  - otros (naranja), con observación libre (por ejemplo «pendiente de incorporación»).
- **Baja del cuadrante:** se ve en gris oscuro desde la fecha de baja, sin borrar a la persona.
- **Vista anual para el gestor:** el año entero en horizontal (una columna por turno, con el fin de semana resaltado),
  además de la vista mensual.
- **No se toma:** los días sueltos de diario (ahora son bloques de 2 días), la marca «C» antigua (los cambios van con
  su propio registro) ni las marcas «RS» y «CS IT» (son comisión de servicio).

## Diseño propuesto

Listas, que crea la página desde Ajustes:

| Lista | Qué guarda |
|---|---|
| CUADRANTE COMPONENTES | persona, cuadrante (oficiales/suboficiales), empleo, antigüedad, teléfono, negociado, alta/baja |
| CUADRANTE TURNOS | cada turno publicado: fecha de inicio y fin, tipo (diario/fin de semana/festivo/puente), cuadrante, persona, estado |
| CUADRANTE AUSENCIAS | persona, tipo, fechas, origen (a mano o Permisos), adjunto, estado, motivo del rechazo |
| CUADRANTE CAMBIOS | permuta o cesión, turnos, las dos personas, firmas (PDF adjunto), estado, historial |
| CUADRANTE FESTIVOS | fecha, nombre, ámbito (nacional/Andalucía/Sevilla), puentes marcados por el gestor |

Acceso: lista común «SOLICITUDES ACCESO APLICACIONES» con aviso directo al administrador. Ver el cuadrante: quien esté
de alta en CUADRANTE COMPONENTES. Gestionar: el grupo `CUADRANTE_GESTORES`. Ajustes y Accesos: solo con Control total.

Pendiente de confirmar: ver la conversación del 18/11/2026 y `PENDIENTES.md`.
