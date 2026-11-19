# Cuadrante de servicios `[CUADRANTE]`


## Archivos

| Archivo | Para qué |
|---|---|
| `cuadrante.html` | Original legible: el que se edita. |
| `colabora/cuadrante.html` | **Copia cifrada que se sube a Colabora** (`cd cuadrante/proteger && node proteger.mjs`). |
| `pruebas/simulacion.mjs` | Prueba completa contra un SharePoint simulado, en formato ligero y *verbose*. Con `CUAD_HTML=cuadrante/colabora/cuadrante.html` prueba la copia cifrada y con `PROXY=1`, el filtro de la red. |

## Puesta en marcha (versión 2026-11-20 · 1)

1. Subir `colabora/cuadrante.html` a una biblioteca del sitio JSUIGE (por ejemplo `…/JSUIGE/aplicaciones/`) y abrirla con
   la cuenta que tiene Control total.
2. En **Ajustes**:
   - «Crear las listas que faltan» (las siete, con sus columnas: componentes, turnos, ausencias, festivos, cambios de servicio,
     servicios debidos y reglas);
   - revisar y guardar las **reglas del cuadrante** (tarjeta 0);
   - crear los grupos `CUADRANTE_GESTORES` y `CUADRANTE_USUARIOS`;
   - añadir a los gestores;
   - «Dar los permisos».
3. En **Accesos**: crear o preparar la lista común «SOLICITUDES ACCESO APLICACIONES», si no está. Al abrir la página, tu
   cuenta queda guardada para el aviso directo.
4. Los gestores, en **Componentes**, dan de alta a los oficiales y suboficiales con empleo, antigüedad, escalafón,
   teléfono y negociado. También entran solos al aprobar en Accesos una solicitud como componente.
5. En **Festivos**: «Añadir los nacionales y de Andalucía de 2027» y, a mano, los locales de Sevilla, los traslados y
   los puentes.
6. En **Cuadrante del mes**, enero de 2027:
   - elegir quién empieza cada rotación (es el primer mes);
   - revisar la propuesta y guardar el borrador;
   - «Enviar como provisional» con un plazo para pedir cambios y, si quieres, «Avisar a cada uno de sus servicios
     provisionales»;
   - cuando acabe el plazo, «Publicar el definitivo» y, cuando decidas, «Avisar a cada uno de sus servicios».

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
  - comisión de servicio y baja médica, siempre (aunque sea un día);
  - vacaciones, permisos y otras ausencias de **más de 5 días laborables**.
- **No se salta, y hay que hacer un cambio de servicio** (es lo único que se permite), con:
  - los **asuntos propios**;
  - las vacaciones o permisos de 5 días laborables o menos.

  La página avisa del choque y el gestor ve si está resuelto (corregido el 18/11/2026).
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
- **Los 5 días son laborables.** Comisión y baja saltan siempre; asuntos propios nunca (hay que hacer un cambio).
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

## Guardar y avisar, por separado (20/11/2026)

**Ningún botón de guardar, enviar como provisional o publicar manda correos.** El gestor decide si avisa y a quién, con
botones aparte, y la página enseña si ya se avisó y cuándo:
- En el provisional: «✉ Avisar a cada uno de sus servicios provisionales» (sus servicios y el plazo; copia a los gestores).
- En el mes publicado, recuadro «✉ Avisos»: «✉ Avisar a cada uno de sus servicios» (sus servicios definitivos; copia a
  los gestores).

Al editar un mes publicado, «💾 Guardar cambios» ya no envía correos, para no saturar a nadie. Los cambios quedan
apuntados como «sin avisar» (en «CUADRANTE AJUSTES», elemento del mes). En el mes publicado, el recuadro «✉ Avisos»
los lista y el gestor elige:
- **«Avisar a los implicados»:** solo a quien tenía y a quien hace ahora cada servicio cambiado, con copia a los
  gestores;
- **«Enviar el cuadrante actualizado a todos»:** a todos los del mes y a los gestores, con los cambios marcados. Sirve
  también para reenviar el cuadrante aunque no haya cambios.

Al enviar, los pendientes se vacían. Los cambios de servicio pedidos por los componentes siguen avisando solos a los
interesados y a los gestores.

## Cuadrante provisional antes de publicar (19/11/2026)

Para que nadie se lleve una sorpresa, el gestor puede enviar el borrador guardado **como provisional**, con un plazo
para pedir cambios.
- No se envía ningún correo al hacerlo. Si el gestor quiere, «Avisar a cada uno de sus servicios provisionales» manda
  a cada componente sus servicios y el plazo, y a los gestores la copia; la página dice si ya se avisó y cuándo.
- Mientras es provisional, todos lo ven con el aviso «Cuadrante PROVISIONAL» y pueden pedir cambios con «🔁 Pedir
  cambio» (el circuito de siempre: firma, compañero y gestor). Los cambios validados ya van en el cuadrante.
- El gestor puede seguir retocando el mes, avisar (o volver a avisar) o «Retirar el provisional».
- Al «Publicar el definitivo» el mes queda cerrado, sin correos; el aviso de los definitivos se manda aparte desde
  «✉ Avisos».

El estado del mes se guarda en «CUADRANTE AJUSTES» (elemento `MES aaaa-mm`); los turnos siguen en borrador hasta el
definitivo.

## Correos: quién recibe cada aviso (19/11/2026, revisado)

Todos van a la CUENTA de cada persona; en la prueba simulada no sale ninguno a una dirección. «Gestores» = integrantes
de `CUADRANTE_GESTORES` y, siempre, el administrador (su cuenta se lee de la lista común de solicitudes, donde la deja al
entrar). Antes, el administrador que no estaba en el grupo no recibía nada.

| Cuándo | A quién |
|---|---|
| Se envía como provisional o se publica un mes | Nadie. Solo si el gestor pulsa «Avisar a cada uno de sus servicios»: a cada componente sus servicios (y el plazo, si es provisional) y a los gestores la copia del cuadrante. |
| Se modifica un mes publicado | Nadie al guardar. Desde «✉ Avisos»: a los implicados (copia a los gestores) o a todos con el cuadrante actualizado. |
| Alguien pide un cambio | Al compañero y a los gestores. |
| El compañero acepta y firma | A los gestores. |
| Se valida, se rechaza o se anula un cambio | A los dos interesados y, en copia, a los gestores. |
| Se comunica una ausencia | A los gestores. |
| Se aprueba o deniega una ausencia | Al interesado. |
| Solicitud de acceso | Al administrador; la respuesta, al solicitante. |

**Cuentas antiguas (19/11/2026).** Si un componente está enlazado a una cuenta antigua o sin buzón, el correo no le llega.
- En «Componentes», la columna «Cuenta (avisos)» enseña la cuenta enlazada de cada uno.
- «✉ Probar» le envía un correo de prueba y dice si Colabora lo acepta.
- En «Editar» se cambia la cuenta por la buena.
- Si Colabora rechaza la cuenta, la página prueba con otra cuenta de la misma persona (mismo nombre) y lo dice.

Quien no es componente no recibe «sus servicios», pero si es gestor (o administrador) recibe la copia. En Ajustes están
esta tabla, «Enviarme un correo de prueba» y «Probar el aviso a los gestores» (dice a quién ha ido).

## Mes publicado, vista en tabla y quitar componentes (19/11/2026)

- **Mes publicado cerrado.** Una vez publicado, el mes queda cerrado: nadie ve desplegables. Los gestores tienen
  «✏️ Editar cuadrante publicado».
  - Al editarlo cambian lo necesario, con su motivo, y pulsan «Guardar cambios» (sin correos). Desde «✉ Avisos» se avisa
    a los implicados o a todos con el cuadrante como queda: arriba los cambios y debajo cada turno, con «(CAMBIADO)».
  - «Cancelar la edición» descarta los cambios sin guardar.
  - «Poner a … (siguiente disponible)», en «Revisar», abre la edición directamente.
- **Vista en tabla** para todos, con el selector «📋 Por turnos / 📊 En tabla» del cuadrante del mes. Es como la hoja
  de cálculo:
  - una fila por persona y una columna por turno, con su teléfono;
  - X en sus servicios, y X* si es a mano, debido o por cambio (con el motivo al pasar el ratón);
  - el color de las ausencias, los fines de semana resaltados, tu fila marcada y la cuenta del mes.

  «Imprimir» imprime la vista que se está viendo; la tabla sale en A4 apaisado.
- **Quitar componente** (en «Componentes»). Si tiene servicios, se le da de baja desde hoy: se conserva su histórico
  y se avisa de cuántos servicios futuros hay que reasignar. Si no tiene ninguno, se quita de la lista (a la papelera de
  Colabora).
- **«Mis servicios»** enseña el mes en curso y los siguientes; a los gestores, también los de meses en borrador. Si sale
  vacío, explica por qué: sin alta, alta con otra cuenta, mes sin publicar o propuesta sin guardar.

## Reglas configurables (19/11/2026)

El administrador las cambia en Ajustes, tarjeta «0. Reglas del cuadrante». Se guardan en la lista «CUADRANTE AJUSTES»
(elemento «REGLAS»); sin ella valen las de por defecto, que son las acordadas.

- **Ausencias.**
  - El número de días (5) y si se cuentan laborables o naturales.
  - Para cada tipo de ausencia: «salta siempre», «salta si pasa del número de días» o «no salta nunca: debe hacer un
    cambio».
- **Turnos.**
  - Diario de 2 días o de 1.
  - Fin de semana de viernes a domingo, o sábado y domingo.
  - Si los festivos y puentes pegados al fin de semana forman un solo turno.
- **Rotación y orden.**
  - Una rotación para diario y otra para fines de semana y festivos, o una sola.
  - Orden del más antiguo al más moderno, o al revés.
- **Correo:** si se envían los avisos.

Los cambios valen para las propuestas nuevas: los meses ya guardados no se tocan, pero se pueden volver a proponer.

## Asignación a mano y servicios debidos (19/11/2026)

- **Cómo se asignó cada turno.** Cada turno guarda si fue por rotación, a mano, por un servicio debido o por un cambio
  de servicio, y el motivo (columnas `Asignacion` y `MotivoAsignacion`). En el mes se ve con una etiqueta y un campo de
  motivo.
- **La rotación solo avanza con los turnos de rotación.** Si el gestor pone a alguien a mano o le asigna un servicio
  debido, quien iba por rotación pasa al turno siguiente: en una propuesta, el resto del mes se recalcula solo. «↺»
  devuelve el turno a la rotación. Al volver a proponer un mes, se respetan los turnos a mano, debidos y de cambio.
- **Servicios debidos** (lista «CUADRANTE DEUDAS»), para lo que se arrastra del pasado.
  - En la pestaña «Cambios», el gestor registra quién debe un servicio, a quién (opcional), de qué tipo y por qué.
  - En el mes, la tarjeta «Servicios debidos pendientes» los ofrece con los turnos posibles; ★ marca los turnos de
    la persona a quien se le debe.
  - Al asignarlo y guardar, el turno queda como «servicio debido» con su motivo y el servicio debido, saldado con
    ese turno.
  - En el cuadro de la rotación, la columna «Debe» cuenta los servicios debidos pendientes de cada uno.
- **Más motivos.** Las sustituciones (⚡ imprevisto, «poner al siguiente disponible») quedan «a mano» con su motivo, y
  los cambios de servicio validados, como «cambio de servicio».

## Orden de la rotación en el cuadrante del mes (18/11/2026)

Encima del mes, el gestor ve para cada cuadrante el orden de la rotación (del más antiguo al más moderno, con empleo y
antigüedad), quién empieza el diario y quién el fin de semana, cuántos servicios lleva cada uno en el mes y sus
ausencias. Cada ausencia sale con su color y dice si salta el servicio o si hay que hacer un cambio. En cada turno, las
personas salen con su número de orden. El cuadro se puede plegar y la página lo recuerda.

## Cambios de servicio (18/11/2026)

1. **Pedir.** El interesado, en «Mis servicios», pulsa «🔁 Pedir cambio» en uno de sus servicios publicados. El botón
   sale destacado si ese servicio tiene el aviso «debe hacer un cambio». Elige:
   - el tipo: **permuta** (cada uno hace el del otro; solo servicios del mismo tipo) o **cesión** (el compañero le
     cubre sin devolución);
   - el compañero, de su mismo cuadrante;
   - el motivo.

   La página genera el PDF de la solicitud, que se firma con AutoFirma (recuadro del solicitante). Se guarda en
   «CUADRANTE CAMBIOS» con el PDF adjunto y le llega un correo al compañero.
2. **Aceptar.** El compañero lo ve al entrar: «Aceptar y firmar» firma el mismo PDF en su recuadro; también puede
   «Rechazar» con motivo. Al aceptar, les llega un correo a los gestores.
3. **Validar.** Un gestor, en la pestaña «Cambios», pulsa «Validar y firmar» (tercera firma) o «Rechazar».
   - Al validar, el cuadrante se cambia solo y queda en el historial del turno.
   - Les llega un correo a los dos interesados.
   - «Validar sin firma» queda anotado, por si el gestor no puede firmar.

**Cesión con devolución (19/11/2026).** Al pedir una cesión sale marcado «Le devolveré el servicio» (se puede
desmarcar), y queda en el PDF. Al validarla, se registra sola como servicio debido del solicitante al compañero, del
mismo tipo de servicio, y el gestor la asigna desde «Servicios debidos pendientes».

**El cambio se ve en el cuadrante, para todos:**
- mientras está en trámite: «🔁 Cambio nº N en trámite (pendiente del compañero / del gestor) con …»;
- una vez validado: la etiqueta «cambio de servicio» y «Cambio nº N (cesión): lo hace X en lugar de Y». También sale en
  el cuadrante impreso.

**«🔁 Pedir cambio» siempre a la vista (19/11/2026).**
- El botón sale en «Mis servicios» y en tus turnos del cuadrante del mes.
- Se puede pedir hasta el mismo día del servicio.
- Si no se puede pedir, en su lugar se dice por qué:
  - falta la lista de cambios (al administrador le dice que la cree en Ajustes);
  - el mes no está publicado;
  - el servicio ya ha pasado;
  - ya hay un cambio en trámite.

Antes de firmar se comprueba que el cuadrante sigue igual que cuando se pidió. Los adjuntos son
`CAMBIO-<n>-1-solicitante.pdf`, `-2-companero.pdf` y `-3-validado.pdf`, cada uno con una firma más. La librería
de AutoFirma va pegada en el HTML, como en VSA.

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
