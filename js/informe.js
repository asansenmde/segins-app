// Generación del informe en Word (.docx) dentro del móvil.
import { S } from './state.js';
import * as db from './db.js';
import { calcEval, fmtNum } from './scoring.js';
import { fmtFecha, hoyISO, MESES } from './ui.js';
import { CAMPOS_CABECERA } from './views/comun.js';
import { graficoSVG, graficoRiesgos } from './views/evaluaciones.js';
import { CRITERIOS, clases, escala, calcFila, umbralAccion, resumenMosler } from './mosler.js';
import { planAcciones, accionesGenerales, propuestaItem } from './acciones.js';

function cargarDocx() {
  if (window.docx) return Promise.resolve(window.docx);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'js/lib/docx.iife.js';
    s.onload = () => res(window.docx);
    s.onerror = () => rej(new Error('No se pudo cargar el generador de Word'));
    document.head.appendChild(s);
  });
}

function svgAPng(svg, escala = 2) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width * escala;
      c.height = img.height * escala;
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b.arrayBuffer().then(buf => res({ data: new Uint8Array(buf), w: img.width, h: img.height })), 'image/png');
    };
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

async function datosFoto(id) {
  const blob = await db.getFoto(id);
  if (!blob) return null;
  const bmp = await createImageBitmap(blob);
  const r = { data: new Uint8Array(await blob.arrayBuffer()), w: bmp.width, h: bmp.height };
  bmp.close();
  return r;
}

const COLOR_NIVEL = { Satisfactorio: 'C8E6C9', Mejorable: 'FFE0B2', Deficiente: 'FFCDD2', 'Sin datos': 'EEEEEE' };
const COLOR_ESTADO = { OK: 'C8E6C9', VIGILAR: 'FFE0B2', 'CRÍTICO': 'FFCDD2', 'ALERTA P1': 'EF9A9A', 'Sin datos': 'EEEEEE' };
const TXT_R = { C: 'C', I: 'I', NA: 'NA' };

export async function generarInforme(ev, opt) {
  const d = await cargarDocx();
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun,
    Header, Footer, AlignmentType, HeadingLevel, ShadingType, PageNumber, BorderStyle, TableLayoutType,
  } = d;
  const cfg = S.config;
  const { areas, global: g } = calcEval(ev);
  const cab = ev.cabecera;
  const FUENTE = 'Arial';

  const t = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: FUENTE, size: o.size ?? 20, bold: o.bold, italics: o.italics, color: o.color });
  const p = (text, o = {}) => new Paragraph({
    children: Array.isArray(text) ? text : [t(text, o)],
    alignment: o.align, spacing: { after: o.after ?? 80, before: o.before ?? 0 }, heading: o.heading, keepNext: o.keepNext,
  });
  const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 }, keepNext: true, children: [t(text, { size: 26, bold: true, color: '3B4A2F' })] });
  const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, keepNext: true, children: [t(text, { size: 22, bold: true, color: '3B4A2F' })] });
  const celda = (contenido, o = {}) => new TableCell({
    children: (Array.isArray(contenido) ? contenido : [contenido]).map(c => (typeof c === 'string' || typeof c === 'number' || c == null)
      ? p(c, { size: o.size ?? 18, bold: o.bold, align: o.align, after: 0 }) : c),
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: o.span,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
  // Texto blanco en cabeceras de tabla
  const cabeceraBlanca = (cols, anchos) => new TableRow({
    tableHeader: true,
    children: cols.map((c, i) => new TableCell({
      children: [new Paragraph({ children: [t(c, { size: 17, bold: true, color: 'FFFFFF' })] })],
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: '3B4A2F' },
      width: anchos ? { size: anchos[i], type: WidthType.PERCENTAGE } : undefined,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
    })),
  });
  const tabla = (rows) => new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED });

  const marca = (cfg.marcaClasificacion || '').trim();
  const lineaMarca = () => (marca ? [p(marca, { bold: true, align: AlignmentType.CENTER, size: 20, color: 'B71C1C', after: 40 })] : []);

  const hijos = [];

  // ---- Portada / encabezado del documento ----
  hijos.push(
    p(cfg.cabeceraOrganismo || '', { bold: true, align: AlignmentType.CENTER, size: 22, after: 40 }),
    p('INFORME DE EVALUACIÓN DE SEGURIDAD DE INSTALACIONES (SEGINS)', { bold: true, align: AlignmentType.CENTER, size: 28, before: 200, after: 80 }),
    p(cab.instalacion || '', { bold: true, align: AlignmentType.CENTER, size: 26, after: 40 }),
    p([cab.localidad, cab.fecha ? fmtFecha(cab.fecha) : ''].filter(Boolean).join(' — '), { align: AlignmentType.CENTER, size: 22, after: 240 }),
  );

  // ---- 1. Datos ----
  hijos.push(h1('1. DATOS DE LA EVALUACIÓN'));
  hijos.push(tabla(CAMPOS_CABECERA.map(([k, lbl]) => new TableRow({
    children: [celda(lbl, { bold: true, fill: 'EEF1EA', w: 38 }), celda(k === 'fecha' ? fmtFecha(cab[k]) : (cab[k] || ''), { w: 62 })],
  }))));

  // ---- 2. Resultado global ----
  hijos.push(h1('2. RESULTADO GLOBAL'));
  hijos.push(tabla([
    cabeceraBlanca(['Criterio', 'Valor', 'Nivel'], [44, 22, 34]),
    new TableRow({ children: [celda('Puntuación ponderada (0-100)', { bold: true }), celda(fmtNum(g.puntos), { align: AlignmentType.CENTER }), celda(g.nivelPuntos, { fill: COLOR_NIVEL[g.nivelPuntos], bold: true })] }),
    new TableRow({ children: [celda('% de conformidad', { bold: true }), celda(fmtNum(g.pct) + ' %', { align: AlignmentType.CENTER }), celda(g.nivelPct, { fill: COLOR_NIVEL[g.nivelPct], bold: true })] }),
    new TableRow({ children: [celda('Ítems P1 no conformes', { bold: true }), celda(String(g.p1EnI), { align: AlignmentType.CENTER, fill: g.p1EnI ? 'EF9A9A' : undefined }), celda(g.estado, { fill: COLOR_ESTADO[g.estado], bold: true })] }),
    new TableRow({ children: [celda('Ítems evaluados', { bold: true }), celda(`${g.respondidos} / ${g.total}`, { align: AlignmentType.CENTER }), celda(`C ${g.c} · I ${g.i} · NA ${g.na}`)] }),
  ]));
  hijos.push(p(`Umbrales: ≥ ${ev.umbrales.umbralSat} Satisfactorio · ${ev.umbrales.umbralMej}–${ev.umbrales.umbralSat - 1} Mejorable · < ${ev.umbrales.umbralMej} Deficiente. Un ítem P1 no conforme genera ALERTA. Las áreas sin ítems aplicables no computan en el global.`, { size: 16, italics: true, before: 60 }));

  // ---- 3. Resultado por área ----
  hijos.push(h1('3. RESULTADO POR ÁREA'));
  hijos.push(tabla([
    cabeceraBlanca(['Área', 'Peso', 'C', 'I', 'NA', '% Conf.', 'Nivel', 'Puntos', 'Nivel', 'P1 en I', 'Estado'], [22, 6, 5, 5, 5, 8, 11, 8, 11, 6, 13]),
    ...areas.map(a => new TableRow({
      children: [
        celda(`${a.id}. ${a.nombre}`, { size: 16 }), celda(String(a.peso), { size: 16, align: AlignmentType.CENTER }),
        celda(String(a.c), { size: 16, align: AlignmentType.CENTER }), celda(String(a.i), { size: 16, align: AlignmentType.CENTER }), celda(String(a.na), { size: 16, align: AlignmentType.CENTER }),
        celda(fmtNum(a.pct), { size: 16, align: AlignmentType.CENTER }), celda(a.nivelPct, { size: 15, fill: COLOR_NIVEL[a.nivelPct] }),
        celda(fmtNum(a.puntos), { size: 16, align: AlignmentType.CENTER }), celda(a.nivelPuntos, { size: 15, fill: COLOR_NIVEL[a.nivelPuntos] }),
        celda(String(a.p1EnI), { size: 16, align: AlignmentType.CENTER, fill: a.p1EnI ? 'EF9A9A' : undefined }), celda(a.estado, { size: 15, fill: COLOR_ESTADO[a.estado], bold: true }),
      ],
    })),
  ]));
  const graf = await svgAPng(graficoSVG(areas, ev.umbrales, { ancho: 640, alto: 250 }));
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 160 },
    children: [new ImageRun({ type: 'png', data: graf.data, transformation: { width: 600, height: Math.round(600 * graf.h / graf.w) } })],
  }));
  hijos.push(p('Barra verde: % de conformidad · Barra ámbar: puntos ponderados · Línea verde: umbral Satisfactorio · Línea roja: umbral Mejorable.', { size: 16, italics: true, align: AlignmentType.CENTER }));

  // ---- 4. Alertas P1 ----
  const noConf = [];
  for (const a of ev.areas) for (const it of a.items) {
    const r = ev.respuestas[it.id];
    if (r?.r === 'I') noConf.push({ a, it, r });
  }
  const p1 = noConf.filter(x => x.it.prioridad === 'P1');
  hijos.push(h1('4. ALERTAS P1'));
  if (!p1.length) hijos.push(p('No se han detectado ítems de prioridad P1 no conformes.'));
  else hijos.push(tabla([
    cabeceraBlanca(['Nº', 'Cuestión', 'Observaciones'], [8, 46, 46]),
    ...p1.map(({ it, r }) => new TableRow({ children: [celda(it.codigo, { bold: true, fill: 'FFCDD2' }), celda(it.texto), celda(r.obs || '')] })),
  ]));

  // ---- 5. No conformidades ----
  hijos.push(h1('5. NO CONFORMIDADES'));
  if (!noConf.length) hijos.push(p('No se han detectado no conformidades.'));
  let nFoto = 0;
  const bloqueFotos = async (fotos) => {
    const imgs = [];
    for (const f of fotos) {
      const im = await datosFoto(f.id);
      if (im) imgs.push({ im, pie: f.pie, n: ++nFoto });
    }
    if (!imgs.length) return [];
    const ANCHO = 300;
    const filas = [];
    for (let i = 0; i < imgs.length; i += 2) {
      filas.push(new TableRow({
        children: [0, 1].map(k => {
          const x = imgs[i + k];
          if (!x) return new TableCell({ children: [new Paragraph('')], borders: sinBordes });
          const alto = Math.round(ANCHO * x.im.h / x.im.w);
          const red = alto > 300 ? 300 / alto : 1;
          return new TableCell({
            borders: sinBordes,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'jpg', data: x.im.data, transformation: { width: Math.round(ANCHO * red), height: Math.round(alto * red) } })] }),
              p(`Foto ${x.n}${x.pie ? ': ' + x.pie : ''}`, { size: 16, italics: true, align: AlignmentType.CENTER, after: 120 }),
            ],
          });
        }),
      }));
    }
    return [new Table({ rows: filas, width: { size: 100, type: WidthType.PERCENTAGE }, borders: sinBordesTabla })];
  };
  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const sinBordes = { top: nb, bottom: nb, left: nb, right: nb };
  const sinBordesTabla = { ...sinBordes, insideHorizontal: nb, insideVertical: nb };

  for (const { a, it, r } of noConf) {
    hijos.push(h2(`${it.codigo} — ${a.nombre}`));
    const filas = [
      ['Cuestión', it.texto],
      ['Prioridad / peso', `${it.prioridad} / ${it.peso}`],
      ['Observaciones', r.obs || '—'],
    ];
    const acc = r.accion ?? propuestaItem(it);
    if (acc) filas.push(['Acción correctora', acc]);
    if (r.ref) filas.push(['Referencia', r.ref]);
    if (r.responsable) filas.push(['Responsable', r.responsable]);
    if (r.plazo) filas.push(['Plazo de subsanación', fmtFecha(r.plazo)]);
    hijos.push(tabla(filas.map(([k, v]) => new TableRow({
      children: [celda(k, { bold: true, fill: it.prioridad === 'P1' ? 'FFEBEE' : 'FFF3E0', w: 26 }), celda(v, { w: 74 })],
    }))));
    if (opt.fotos && r.fotos?.length) hijos.push(...(await bloqueFotos(r.fotos)));
  }

  let sec = 6;

  // ---- Análisis de riesgos (Mosler) ----
  const mos = resumenMosler(ev);
  if (opt.mosler && mos.completas.length) {
    const hex = (c) => c.replace('#', '');
    const celdaClase = (r, size = 15) => r.completo
      ? new TableCell({
        children: [new Paragraph({ children: [t(r.clase.nombre.toUpperCase(), { size, bold: true, color: 'FFFFFF' })] })],
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(r.clase.color) },
        margins: { top: 30, bottom: 30, left: 60, right: 60 },
      })
      : celda('', { size });
    const escalaTxt = clases().map((c, i) => `${c.nombre} ${i ? `${clases()[i - 1].max + 1}–${c.max}` : `≤ ${c.max}`}`).join(' · ');
    hijos.push(h1(`${sec++}. ANÁLISIS DE RIESGOS (MÉTODO MOSLER)`));
    hijos.push(p(`Cada amenaza se valora sobre cada elemento de la instalación. I = F×S; D = P×E; C = I+D; PR = A×V; ER = C×PR (de 2 a 1250). Clasificación del riesgo: ${escalaTxt}.`, { size: 18, after: 120 }));

    // Riesgos que requieren atención
    const atencion = mos.conAccion;
    hijos.push(h2(`Riesgos con ER mayor de ${umbralAccion()} (${atencion.length})`));
    if (!atencion.length) hijos.push(p(`Todas las valoraciones tienen ER ≤ ${umbralAccion()}.`, { size: 18 }));
    else hijos.push(tabla([
      cabeceraBlanca(['Amenaza', 'Elemento', 'C', 'PR', 'ER', 'Riesgo'], [32, 30, 8, 8, 9, 13]),
      ...atencion.map(({ a, e, r }) => new TableRow({
        children: [celda(a.nombre, { size: 16, bold: true }), celda(e.nombre, { size: 16 }), celda(String(r.C), { size: 16, align: AlignmentType.CENTER }),
          celda(String(r.PR), { size: 16, align: AlignmentType.CENTER }), celda(String(r.ER), { size: 16, bold: true, align: AlignmentType.CENTER }), celdaClase(r, 15)],
      })),
    ]));
    const gr = await svgAPng(graficoRiesgos(mos.completas, { ancho: 640, max: 10 }));
    hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 160 },
      children: [new ImageRun({ type: 'png', data: gr.data, transformation: { width: 600, height: Math.round(600 * gr.h / gr.w) } })],
    }));

    // Detalle por amenaza, con el mismo formato que la hoja de cálculo Mosler
    if (opt.moslerDetalle !== false) {
      hijos.push(h2('Detalle por amenaza'));
      let grupoActual = null;
      for (const a of ev.mosler) {
        const filas = ev.moslerElementos.map(e => ({ e, v: a.valores?.[e.id] || {}, r: calcFila(a.valores?.[e.id]) })).filter(f => f.r.completo);
        if (!filas.length) continue;
        if (a.grupo !== grupoActual) { grupoActual = a.grupo; hijos.push(p(grupoActual.toUpperCase(), { bold: true, size: 18, before: 160, after: 60 })); }
        const n = (x) => celda(x == null ? '' : String(x), { size: 14, align: AlignmentType.CENTER });
        hijos.push(tabla([
          cabeceraBlanca([a.nombre.toUpperCase(), 'F', 'S', 'I', 'P', 'E', 'D', 'C', 'A', 'V', 'PR', 'ER', 'RIESGO'], [24, 5, 5, 5, 5, 5, 5, 6, 5, 5, 6, 8, 16]),
          ...filas.map(({ e, v, r }) => new TableRow({
            children: [celda(e.nombre, { size: 14 }), n(v.F), n(v.S), n(r.I), n(v.P), n(v.E), n(r.D), n(r.C), n(v.A), n(v.V), n(r.PR),
              celda(String(r.ER), { size: 14, bold: true, align: AlignmentType.CENTER }), celdaClase(r, 13)],
          })),
        ]));
        if (a.notas?.trim()) hijos.push(p([t('Justificación / medidas: ', { bold: true, size: 16 }), t(a.notas, { size: 16 })], { before: 60, after: 120 }));
        else hijos.push(p('', { after: 120 }));
      }
    }

    hijos.push(h2('Escala de valoración'));
    hijos.push(tabla([
      cabeceraBlanca(['Criterio', '1', '2', '3', '4', '5'], [20, 16, 16, 16, 16, 16]),
      ...CRITERIOS.map(c => new TableRow({ children: [celda(`${c.k} · ${c.nombre}`, { size: 15, bold: true }), ...c.escala.map(e => celda(e, { size: 15 }))] })),
    ]));
    hijos.push(p(`Clasificación del riesgo (${escala().nombre}): ${escalaTxt}.`, { size: 16, italics: true, before: 60 }));
  }

  // ---- Plan de acciones derivadas ----
  const plan = planAcciones(ev);
  const generales = accionesGenerales(ev);
  if (opt.acciones && (plan.length || generales.length)) {
    hijos.push(h1(`${sec++}. PLAN DE ACCIONES DERIVADAS`));
    if (generales.length) {
      hijos.push(h2('Acciones generales'));
      for (const g of generales) hijos.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [t(g, { size: 19 })] }));
    }
    if (plan.length) {
      hijos.push(h2('Acciones concretas'));
      const colEstado = { Pendiente: 'FFF3E0', 'En curso': 'E3F2FD', Cumplida: 'E8F5E9' };
      hijos.push(tabla([
        cabeceraBlanca(['Nº', 'Acción', 'Origen', 'Prio.', 'Responsable', 'Plazo', 'Estado'], [5, 38, 14, 7, 14, 11, 11]),
        ...plan.map((a, i) => new TableRow({
          children: [
            celda(String(i + 1), { size: 16, align: AlignmentType.CENTER }),
            celda(a.texto || '—', { size: 16 }),
            celda(a.origen, { size: 15 }),
            celda(a.prioridad, { size: 16, bold: true, align: AlignmentType.CENTER, fill: a.prioridad === 'P1' ? 'FFCDD2' : undefined }),
            celda(a.responsable || '—', { size: 15 }),
            celda(a.plazo ? fmtFecha(a.plazo) : '—', { size: 15, align: AlignmentType.CENTER }),
            celda(a.estado, { size: 15, bold: true, fill: colEstado[a.estado] }),
          ],
        })),
      ]));
      hijos.push(p('Plazos por defecto: 30 días para prioridad P1 y 90 días para P2, contados desde la fecha de la evaluación.', { size: 15, italics: true, before: 60 }));
    }
  }

  // ---- Detalle completo ----
  if (opt.detalle) {
    hijos.push(h1(`${sec++}. DETALLE DEL CUESTIONARIO`));
    for (const a of ev.areas) {
      hijos.push(h2(`${a.id}. ${a.nombre} (peso ${a.peso})`));
      hijos.push(tabla([
        cabeceraBlanca(['Nº', 'Cuestión / acción a verificar', 'Prio.', 'Peso', 'Resp.', 'Observaciones'], [7, 43, 7, 7, 7, 29]),
        ...a.items.map(it => {
          const r = ev.respuestas[it.id] || {};
          const fill = r.r === 'C' ? 'E8F5E9' : r.r === 'I' ? 'FFEBEE' : r.r === 'NA' ? 'F5F5F5' : undefined;
          return new TableRow({
            children: [
              celda(it.codigo, { size: 16, bold: true }), celda(it.texto, { size: 16 }), celda(it.prioridad, { size: 16, align: AlignmentType.CENTER }),
              celda(String(it.peso), { size: 16, align: AlignmentType.CENTER }), celda(TXT_R[r.r] || '—', { size: 16, bold: true, align: AlignmentType.CENTER, fill }),
              celda(r.obs || '', { size: 16 }),
            ],
          });
        }),
      ]));
    }
  }

  // ---- Fotos de ítems conformes ----
  if (opt.fotos && opt.fotosC) {
    const conFotos = ev.areas.flatMap(a => a.items).filter(it => ev.respuestas[it.id]?.r !== 'I' && ev.respuestas[it.id]?.fotos?.length);
    if (conFotos.length) {
      hijos.push(h1(`${sec++}. OTRAS FOTOGRAFÍAS`));
      for (const it of conFotos) {
        hijos.push(h2(`${it.codigo} — ${it.texto}`));
        hijos.push(...(await bloqueFotos(ev.respuestas[it.id].fotos)));
      }
    }
  }

  // ---- Conclusiones y firma ----
  hijos.push(h1(`${sec++}. CONCLUSIONES Y PROPUESTAS`));
  const concl = (ev.conclusiones || '').split('\n');
  for (const linea of concl) hijos.push(p(linea || ' ', { after: 60 }));

  const f = cab.fecha || hoyISO();
  const [yy, mm, dd] = f.split('-');
  hijos.push(p(`${ev.lugarFirma ? ev.lugarFirma + ', ' : ''}${+dd} de ${MESES[+mm - 1]} de ${yy}`, { align: AlignmentType.CENTER, before: 480, after: 120 }));
  hijos.push(p('EL JEFE DEL EQUIPO EVALUADOR', { bold: true, align: AlignmentType.CENTER, after: 900 }));
  hijos.push(p([cfg.evaluadorEmpleo, cfg.evaluadorNombre].filter(Boolean).join(' ') || ' ', { align: AlignmentType.CENTER }));

  const doc = new Document({
    creator: 'SEGINS', title: `Informe SEGINS ${cab.instalacion || ''}`,
    styles: { default: { document: { run: { font: FUENTE, size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 1300, bottom: 1100, left: 1100, right: 1100 } } },
      headers: {
        default: new Header({ children: [...lineaMarca(), p(`${cfg.cabeceraOrganismo || ''} · Evaluación SEGINS · ${cab.instalacion || ''}`, { size: 16, color: '666666', align: AlignmentType.RIGHT })] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [t('Página ', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FUENTE }), t(' de ', { size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: FUENTE })] }),
            ...lineaMarca(),
          ],
        }),
      },
      children: hijos,
    }],
  });
  return Packer.toBlob(doc);
}
