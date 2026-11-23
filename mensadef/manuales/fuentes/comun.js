// Piezas comunes de los manuales de SENDERO (Word).
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
const fs = require('fs');
const path = require('path');
const d = require('docx');

const AZUL = '13294B', VERDE = '2E5A3A', ORO = 'B8922A', GRIS = '5A6270', CLARO = 'EEF2F6', AMARILLO = 'FFF6D6';
const FUENTE = 'Arial';
const CAPTURAS = path.join(__dirname, '..', 'capturas');
const ANCHO = 9638; // A4 con márgenes de 2 cm (11906 - 2 × 1134)

// Texto con **negrita** y «comillas» tal cual
function runs(texto, extra = {}) {
  const out = [];
  String(texto).split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach(t => {
    if (!t) return;
    if (t.startsWith('**')) out.push(new d.TextRun({ text: t.slice(2, -2), bold: true, ...extra }));
    else if (t.startsWith('`')) out.push(new d.TextRun({ text: t.slice(1, -1), font: 'Consolas', size: 19, color: AZUL, ...extra }));
    else out.push(new d.TextRun({ text: t, ...extra }));
  });
  return out;
}
const p = (t, o = {}) => new d.Paragraph({ children: runs(t), spacing: { after: 120 }, ...o });
const h1 = t => new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, children: [new d.TextRun(t)], pageBreakBefore: true });
const h1s = t => new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, children: [new d.TextRun(t)] });
const h2 = t => new d.Paragraph({ heading: d.HeadingLevel.HEADING_2, children: [new d.TextRun(t)] });
const h3 = t => new d.Paragraph({ heading: d.HeadingLevel.HEADING_3, children: [new d.TextRun(t)] });
const vi = t => new d.Paragraph({ numbering: { reference: 'vinetas', level: 0 }, children: runs(t), spacing: { after: 60 } });
let listas = 0;
// Lista numerada nueva (empieza en 1)
function pasos(items) {
  const ref = 'pasos' + (++listas);
  pasos.refs.push(ref);
  return items.map(t => new d.Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 80 } }));
}
pasos.refs = [];

function imagen(archivo, anchoCm, pie) {
  const buf = fs.readFileSync(path.join(CAPTURAS, archivo));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const anchoPx = Math.round(anchoCm / 2.54 * 96), altoPx = Math.round(anchoPx * h / w);
  const out = [new d.Paragraph({
    alignment: d.AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
    children: [new d.ImageRun({ type: 'png', data: buf, transformation: { width: anchoPx, height: altoPx },
      altText: { title: pie || archivo, description: pie || archivo, name: archivo } })]
  })];
  if (pie) out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 200 },
    children: [new d.TextRun({ text: pie, italics: true, size: 18, color: GRIS })] }));
  return out;
}

// Esquema a página completa (empieza en página nueva)
function esquema(archivo, pie, anchoCm = 16.5) {
  return [new d.Paragraph({ pageBreakBefore: true, keepNext: true, spacing: { after: 0 }, children: [] }), ...imagen(archivo, anchoCm, pie)];
}

const borde = { style: d.BorderStyle.SINGLE, size: 4, color: 'C8CFD8' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };
function tabla(cabecera, filas, anchos) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const celda = (t, i, cab) => new d.TableCell({
    borders: bordes, width: { size: anchos[i], type: d.WidthType.DXA },
    shading: cab ? { fill: AZUL, type: d.ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new d.Paragraph({ children: runs(t, cab ? { bold: true, color: 'FFFFFF' } : { size: 19 }) })]
  });
  return new d.Table({
    width: { size: total, type: d.WidthType.DXA }, columnWidths: anchos,
    rows: [new d.TableRow({ tableHeader: true, children: cabecera.map((t, i) => celda(t, i, true)) }),
      ...filas.map(f => new d.TableRow({ cantSplit: true, children: f.map((t, i) => celda(t, i, false)) }))]
  });
}
// Recuadro de aviso (nota, ojo, pendiente de medir)
function recuadro(titulo, texto, color = AMARILLO, filo = ORO) {
  const b = { style: d.BorderStyle.SINGLE, size: 4, color: filo };
  return new d.Table({
    width: { size: ANCHO, type: d.WidthType.DXA }, columnWidths: [ANCHO],
    rows: [new d.TableRow({ cantSplit: true, children: [new d.TableCell({
      width: { size: ANCHO, type: d.WidthType.DXA }, shading: { fill: color, type: d.ShadingType.CLEAR, color: 'auto' },
      borders: { top: b, bottom: b, right: b, left: { style: d.BorderStyle.SINGLE, size: 24, color: filo } },
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      children: [new d.Paragraph({ children: [new d.TextRun({ text: titulo, bold: true, color: AZUL })], spacing: { after: 60 } }),
        ...[].concat(texto).map(t => new d.Paragraph({ children: runs(t, { size: 20 }), spacing: { after: 40 } }))]
    })] })]
  });
}
const hueco = () => new d.Paragraph({ children: [], spacing: { after: 60 } });

function portada(titulo, subtitulo, publico, version) {
  const linea = (t, o) => new d.Paragraph({ alignment: d.AlignmentType.LEFT, children: [new d.TextRun({ font: FUENTE, ...o, text: t })] });
  return [
    new d.Paragraph({ spacing: { before: 1400 }, children: [] }),
    linea('MINISTERIO DE DEFENSA · EJÉRCITO DE TIERRA', { size: 20, bold: true, color: GRIS, characterSpacing: 40 }),
    new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 18, color: ORO, space: 6 } }, spacing: { after: 400 },
      children: [new d.TextRun({ text: 'S E N D E R O', font: 'Georgia', size: 72, bold: true, color: AZUL })] }),
    linea('El camino de cada mensaje', { size: 26, italics: true, color: ORO }),
    new d.Paragraph({ spacing: { before: 600 }, children: [new d.TextRun({ text: titulo, size: 44, bold: true, color: VERDE })] }),
    linea(subtitulo, { size: 24, color: GRIS }),
    new d.Paragraph({ spacing: { before: 800 }, children: [new d.TextRun({ text: 'Dirigido a: ', bold: true, size: 22 }), new d.TextRun({ text: publico, size: 22 })] }),
    new d.Paragraph({ children: [new d.TextRun({ text: 'Versión de SENDERO descrita: ', bold: true, size: 22 }), new d.TextRun({ text: version, size: 22 })] }),
    new d.Paragraph({ children: [new d.TextRun({ text: 'Fecha del documento: ', bold: true, size: 22 }), new d.TextRun({ text: '23 de noviembre de 2026', size: 22 })] }),
    new d.Paragraph({ spacing: { before: 1600 }, children: [new d.TextRun({ text: 'Diseño, desarrollo y propiedad intelectual: Cte. Alfredo Sánchez Sender', size: 20, color: GRIS })] }),
    new d.Paragraph({ children: [new d.TextRun({ text: '© 2026 Cte. Alfredo Sánchez Sender · Todos los derechos reservados · USO OFICIAL', size: 20, color: GRIS })] }),
    new d.Paragraph({ children: [new d.TextRun({ text: 'Las imágenes proceden del MENSADEF simulado de pruebas: no contienen mensajes ni personas reales.', size: 18, italics: true, color: GRIS })] }),
  ];
}

function documento(titulo, hijos) {
  const numbering = { config: [{ reference: 'vinetas', levels: [{ level: 0, format: d.LevelFormat.BULLET, text: '•', alignment: d.AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
  ...pasos.refs.map(r => ({ reference: r, levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: '%1.', alignment: d.AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 567, hanging: 340 } } } }] }))] };
  const pie = new d.Footer({ children: [new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [
    new d.TextRun({ text: 'SENDERO · ' + titulo + ' · © 2026 Cte. Alfredo Sánchez Sender · USO OFICIAL · pág. ', size: 16, color: GRIS }),
    new d.TextRun({ children: [d.PageNumber.CURRENT], size: 16, color: GRIS })] })] });
  const cab = new d.Header({ children: [new d.Paragraph({ alignment: d.AlignmentType.RIGHT,
    border: { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: ORO, space: 4 } },
    children: [new d.TextRun({ text: 'SENDERO · ' + titulo, size: 16, color: AZUL, bold: true })] })] });
  const margenes = { top: 1134, bottom: 1134, left: 1134, right: 1134 };
  return new d.Document({
    creator: 'Cte. Alfredo Sánchez Sender', title: 'SENDERO · ' + titulo, description: '© 2026 Cte. Alfredo Sánchez Sender',
    styles: {
      default: { document: { run: { font: FUENTE, size: 22 }, paragraph: { spacing: { line: 276, lineRule: d.LineRuleType.AUTO } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FUENTE, size: 34, bold: true, color: AZUL }, paragraph: { spacing: { before: 240, after: 160 }, keepNext: true, outlineLevel: 0,
          border: { bottom: { style: d.BorderStyle.SINGLE, size: 8, color: ORO, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FUENTE, size: 27, bold: true, color: VERDE }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FUENTE, size: 23, bold: true, color: AZUL }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
      ]
    },
    numbering,
    sections: [
      { properties: { page: { size: { width: 11906, height: 16838 }, margin: margenes } }, children: hijos.portada },
      { properties: { page: { size: { width: 11906, height: 16838 }, margin: margenes } }, headers: { default: cab }, footers: { default: pie },
        children: [h1s('Índice'), new d.TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }), ...hijos.cuerpo] }
    ]
  });
}

async function guardar(doc, archivo) {
  const buf = await d.Packer.toBuffer(doc);
  fs.writeFileSync(archivo, buf);
  console.log('escrito', archivo);
}

module.exports = { d, p, h1, h1s, h2, h3, vi, pasos, imagen, esquema, tabla, recuadro, hueco, portada, documento, guardar, ANCHO };
