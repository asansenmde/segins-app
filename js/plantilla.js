// Cuestionario base SEGINS (IT 07/23): 7 áreas, 44 ítems.
// Se copia a la configuración en el primer arranque; después se edita desde la app.

const it = (codigo, prioridad, peso, texto) => ({ id: codigo, codigo, prioridad, peso, texto, base: true });

export const PLANTILLA_BASE = [
  {
    id: 'A', nombre: 'Normativa y Plan (IT 07/23)', peso: 12, items: [
      it('A01', 'P1', 5, 'Plan de Seguridad actualizado a IT 07/23 y aprobado o en confección con plazo conocido.'),
      it('A02', 'P1', 4, 'Clasificación de zonas del PS coincide con señalización real (Anexo IV IT 07/23).'),
      it('A03', 'P2', 3, 'NOP armas particulares actualizada (NG 02/23) si aplica; locales/cajas fuertes en estudio o resueltos.'),
      it('A04', 'P2', 3, 'Cartelería videovigilancia LO 3/2018 en entradas, zonas sensibles y perímetros con población.'),
      it('A05', 'P1', 4, 'Guardia, CECONSEG, perímetros, zonas sensibles y SLPMC señalizados según Anexo IV.'),
      it('A06', 'P1', 4, 'Documentación clasificada en Guardia/CECONSEG con custodia adecuada (SEGINFO).'),
      it('A07', 'P2', 3, 'Seguimiento documentado de acciones / FDNO / SIMENDEF con estado actualizado.'),
    ],
  },
  {
    id: 'B', nombre: 'Perímetro, iluminación y cartelería', peso: 18, items: [
      it('B01', 'P1', 5, 'Cerramiento perimetral con integridad suficiente; tramos mal estado con compensación o obra en curso.'),
      it('B02', 'P1', 4, 'Seguimiento de mejoras de vallado documentado.'),
      it('B03', 'P2', 3, 'Cartelería Zona militar / reservada suficiente; valorar otros idiomas si procede.'),
      it('B04', 'P1', 4, 'Iluminación perimetral operativa; focos sorpresivos en polvorín/zonas vulnerables según plan.'),
      it('B05', 'P2', 3, 'Desbroce/poda perimetral ejecutado (contrato vigente u homologable).'),
      it('B06', 'P1', 4, 'Croquis/inventario perímetro con sectores vulnerables en Guardia y CECONSEG.'),
      it('B07', 'P1', 4, 'Gasolineras y depósitos exteriores con cerramiento o MESEINS según riesgo o solicitud activa.'),
    ],
  },
  {
    id: 'C', nombre: 'Controles de acceso', peso: 12, items: [
      it('C01', 'P1', 5, 'Controles de acceso con protección mínima del centinela/vigilante (alarma, visibilidad).'),
      it('C02', 'P1', 4, 'Medios solicitados/instalados: pulsadores, barreras, tornos, CCTV matrículas según necesidad.'),
      it('C03', 'P1', 4, 'Procedimientos identificación y registro personal/vehículos vigentes y aplicados.'),
      it('C04', 'P1', 4, 'Control acceso CECONSEG (electrónico o libro registro) implantado.'),
      it('C05', 'P2', 3, 'Medios pasivos anti-intrusión en accesos polvorín/depósitos (erizos, New Jersey) colocados o planificados.'),
    ],
  },
  {
    id: 'D', nombre: 'MESEINS / CCTV / CECONSEG', peso: 18, items: [
      it('D01', 'P1', 5, 'Cámaras perímetro y puntos sensibles operativas o compensaciones documentadas.'),
      it('D02', 'P1', 4, 'CECONSEG gestionable; software de alarmas actualizado o sustitución en curso.'),
      it('D03', 'P1', 4, 'CECONSEG zona prohibida señalizada; puertas/rack/rejas según NT/IT o acciones abiertas.'),
      it('D04', 'P2', 3, 'Cajetines custodia móviles en Guardia/CECONSEG cuando se exige.'),
      it('D05', 'P1', 4, 'Disponibilidad MESEINS adecuada o incidencias con plazos de restitución registrados.'),
      it('D06', 'P2', 3, 'Peticiones MESEINS/FDNO (cámaras, accesos, tampers) en seguimiento con referencia de oficio.'),
      it('D07', 'P1', 4, 'CECONSEG desatendidos: acceso, cámara interior, puerta normativa o acciones documentadas.'),
      it('D08', 'P2', 3, 'Alimentación alternativa / GE del CECONSEG cuando sea exigible.'),
    ],
  },
  {
    id: 'E', nombre: 'Comunicaciones y continuidad', peso: 10, items: [
      it('E01', 'P1', 5, 'Radios/comunicaciones seguridad operativas y enlace verificado.'),
      it('E02', 'P1', 4, 'Reserva equipos/baterías en uso y procedimiento de sustitución.'),
      it('E03', 'P1', 4, 'Canal alternativo comunicaciones operativo.'),
      it('E04', 'P1', 4, 'Sistemas críticos identificados con Tmáx indisponibilidad y alternativas.'),
      it('E05', 'P2', 3, 'Mantenimiento MESEINS con revisiones; demoras gestionadas.'),
    ],
  },
  {
    id: 'F', nombre: 'Guardia y reacción', peso: 15, items: [
      it('F01', 'P1', 4, 'Composición Guardia ajustada al Plan.'),
      it('F02', 'P1', 4, 'Reacción/retén definida y conocida.'),
      it('F03', 'P1', 5, 'Procedimiento o modelo de refuerzo/escalada conocido.'),
      it('F04', 'P1', 4, 'Personal conoce puntos vulnerables y normas del puesto.'),
      it('F05', 'P2', 3, 'Ensayos/ejercicios seguridad (no solo incendios) realizados o programados.'),
      it('F06', 'P2', 3, 'Puestos fijos y patrullas dimensionados según Plan.'),
    ],
  },
  {
    id: 'G', nombre: 'Depósitos, polvorín y zonas críticas', peso: 15, items: [
      it('G01', 'P1', 4, 'Depósitos agua/combustible/GE señalizados e incluidos en PS con clasificación correcta.'),
      it('G02', 'P1', 4, 'MESEINS en depósitos sensibles y gasolineras instalados o solicitados con seguimiento.'),
      it('G03', 'P1', 5, 'Polvorín (si aplica a la visita): iluminación, sorpresivos, accesos y pasivos conformes o acciones abiertas.'),
      it('G04', 'P1', 4, 'Armerías/depósitos armamento: rejas, techos, accesos según norma o FDNO en curso.'),
      it('G05', 'P1', 4, 'Cuartos cripto / ZAR OTAN / SLPMC: acreditación y medios según fase; seguimiento peticiones.'),
      it('G06', 'P2', 3, 'Gasolineras con cerramiento y/o MESEINS o solicitud registrada.'),
    ],
  },
];

export const CONFIG_INICIAL = {
  id: 'config',
  umbralSat: 85,
  umbralMej: 70,
  cabeceraOrganismo: 'EJÉRCITO DE TIERRA',
  marcaClasificacion: '',
  evaluadorEmpleo: '',
  evaluadorNombre: '',
  sellarFotos: true,
  bloqueoMin: 30,
  areas: PLANTILLA_BASE,
};
