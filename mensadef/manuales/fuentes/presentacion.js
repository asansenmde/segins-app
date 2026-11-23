// Presentación de SENDERO para el mando → ../SENDERO-presentacion.pptx
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
// pptxgenjs escribe la paleta de Office en el tema: aquí se ponen los colores de SENDERO (ppt/theme/theme1.xml)
async function applyTheme(archivo, tema) {
  const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(archivo));
  const ruta = 'ppt/theme/theme1.xml';
  let xml = await zip.file(ruta).async('string');
  const orden = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const esquema = '<a:clrScheme name="' + tema.name + '">' + orden.map(k => '<a:' + k + '><a:srgbClr val="' + tema.colors[k] + '"/></a:' + k + '>').join('') + '</a:clrScheme>';
  xml = xml.replace(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/, esquema).replace(/(<a:theme[^>]*name=")[^"]*"/, '$1' + tema.name + '"');
  zip.file(ruta, xml);
  for (const n of Object.keys(zip.files)) if (zip.files[n].dir) delete zip.files[n]; // sin entradas de carpeta (Word/PowerPoint en la nube las rechazan)
  fs.writeFileSync(archivo, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

const CAP = path.join(__dirname, '..', 'capturas');
const SALIDA = path.join(__dirname, '..', 'SENDERO-presentacion.pptx');
const HEX = { navy: '13294B', bosque: '2E5A3A', oro: 'C9A227', tinta: '1F2A37', papel: 'F3F5F8', gris: '5A6270', blanco: 'FFFFFF', rojo: 'B23A3A' };
const THEME = {
  name: 'SENDERO', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: HEX.tinta, lt1: HEX.blanco, dk2: HEX.navy, lt2: HEX.papel, accent1: HEX.navy, accent2: HEX.bosque, accent3: HEX.oro,
    accent4: '4F7CAC', accent5: '7A8B99', accent6: HEX.rojo, hlink: '1F5FA8', folHlink: '6B4FA0' }
};

async function icono(nombre, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[nombre], { color: '#' + color, size: 256 }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + png.toString('base64');
}
const tam = f => { const b = fs.readFileSync(path.join(CAP, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
// Imagen encajada en una caja, sin deformar
function captura(slide, f, x, y, w, h, nombre) {
  const t = tam(f), r = Math.min(w / t.w, h / t.h), iw = t.w * r, ih = t.h * r;
  slide.addImage({ path: path.join(CAP, f), x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, objectName: nombre,
    altText: 'Captura del MENSADEF simulado: ' + nombre, shadow: { type: 'outer', color: '000000', opacity: 0.25, blur: 8, offset: 3, angle: 90 } });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13,33 × 7,5 in
  pres.author = 'Cte. Alfredo Sánchez Sender';
  pres.company = 'Ejército de Tierra';
  pres.title = 'SENDERO · Presentación';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const PIE = '© 2026 Cte. Alfredo Sánchez Sender · SENDERO · USO OFICIAL';

  pres.defineSlideMaster({ title: 'OSCURA', background: { color: HEX.navy },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.3, w: 11.7, h: 1.4, fontSize: 54, bold: true, color: C.background1, charSpacing: 12, margin: 0, align: 'left' }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 3.8, w: 11.7, h: 1.6, fontSize: 22, italic: true, color: C.accent3, margin: 0 }, text: '' } },
      { text: { text: PIE, options: { x: 0.8, y: 6.8, w: 11.7, h: 0.4, fontSize: 11, color: 'C9D3DF', margin: 0 } } }] });
  pres.defineSlideMaster({ title: 'CONTENIDO', background: { color: HEX.blanco },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontSize: 36, bold: true, color: C.text2, margin: 0, valign: 'middle' }, text: '' } },
      { text: { text: PIE, options: { x: 0.6, y: 7.0, w: 10, h: 0.3, fontSize: 10, color: HEX.gris, margin: 0 } } }],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.gris, align: 'right' } });

  const I = {};
  for (const [n, c] of [['FaInbox', HEX.blanco], ['FaSearch', HEX.blanco], ['FaTasks', HEX.blanco], ['FaFileSignature', HEX.blanco], ['FaServer', HEX.blanco],
    ['FaBan', HEX.blanco], ['FaUserShield', HEX.blanco], ['FaCode', HEX.blanco], ['FaPenNib', HEX.blanco], ['FaCheckCircle', HEX.bosque], ['FaTimesCircle', HEX.rojo],
    ['FaBolt', HEX.oro], ['FaLink', HEX.blanco], ['FaPrint', HEX.blanco], ['FaFlag', HEX.blanco], ['FaRoute', HEX.blanco]]) I[n + c] = await icono(n, c);
  const circulo = (s, ic, x, y, d, fondo, nombre) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fondo }, line: { color: fondo }, objectName: nombre + ' círculo' });
    s.addImage({ data: I[ic], x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5, objectName: nombre + ' icono', altText: nombre });
  };
  const tarjeta = (s, x, y, w, h, nombre, fondo = HEX.papel) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12,
    fill: { color: fondo }, line: { color: fondo }, objectName: nombre });
  const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 15, color: C.text1, valign: 'top', ...o });

  // 1. Portada
  pres.addSection({ title: 'Presentación' });
  let s = pres.addSlide({ masterName: 'OSCURA', sectionTitle: 'Presentación' });
  s.addShape(pres.shapes.OVAL, { x: 0.8, y: 0.8, w: 1.2, h: 1.2, fill: { color: HEX.bosque }, line: { color: HEX.oro, width: 3 }, objectName: 'emblema' });
  txt(s, 'S', { x: 0.8, y: 0.8, w: 1.2, h: 1.2, fontSize: 48, bold: true, color: C.accent3, align: 'center', valign: 'middle', fontFace: 'Cambria', objectName: 'emblema letra' });
  txt(s, 'MINISTERIO DE DEFENSA · EJÉRCITO DE TIERRA', { x: 2.3, y: 1.15, w: 9, h: 0.5, fontSize: 14, bold: true, color: 'C9D3DF', charSpacing: 4, objectName: 'organismo' });
  s.addText('S E N D E R O', { placeholder: 'title' });
  s.addText([{ text: 'El camino de cada mensaje', options: { breakLine: true } },
    { text: 'Visor de mensajes de MENSADEF · presentación al mando', options: { italic: false, fontSize: 18, color: C.background1 } }], { placeholder: 'body' });
  txt(s, 'Diseño, desarrollo y propiedad intelectual: Cte. Alfredo Sánchez Sender · versión 2026-11-19 · 5 · noviembre de 2026',
    { x: 0.8, y: 5.9, w: 11.7, h: 0.4, fontSize: 14, color: C.background1, objectName: 'autoría' });
  s.addNotes('SENDERO es un visor de MENSADEF desarrollado en la unidad. En unos minutos: qué es, qué resuelve, cómo rinde, qué seguridad tiene y cómo ha evolucionado.');

  // 2. Qué es
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Presentación' });
  s.addText('Todas las bandejas en una sola pantalla', { placeholder: 'title' });
  txt(s, [
    { text: 'Un favorito del navegador', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: 'Se pulsa en MENSADEF y abre el visor dentro de la propia página, con la sesión y los permisos de cada usuario. Nada que instalar en el puesto.', options: { breakLine: true, paraSpaceAfter: 12 } },
    { text: 'Lo de todas las células, junto', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: 'Entrada y salida de todas las células del usuario, con anexos, texto, banderas y comentarios.', options: { breakLine: true, paraSpaceAfter: 12 } },
    { text: 'Del mensaje a la acción', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: 'Tarea en META, Punto de Situación, oficio en PDF, correo, rúbrica y firma en el Portafirmas, sin salir de la ficha.' },
  ], { x: 0.6, y: 1.6, w: 4.9, h: 5.0, objectName: 'qué es' });
  captura(s, 'p1.png', 5.9, 1.5, 6.9, 5.2, 'pantalla principal');
  s.addNotes('La imagen es del entorno de pruebas simulado: no hay datos reales. Cada persona ve sus propias células, igual que en MENSADEF.');

  // 3. Problemas que resuelve
  pres.addSection({ title: 'Valor' });
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Valor' });
  s.addText('Qué problemas resuelve', { placeholder: 'title' });
  const problemas = [
    ['FaInbox', 'Bandejas dispersas', 'En MENSADEF se revisa célula a célula y bandeja a bandeja. SENDERO las junta en una lista por días.'],
    ['FaSearch', 'Localizar antecedentes', 'Buscar «Su referencia» o un escrito antiguo exige ir célula por célula. SENDERO lo busca en todas, de cualquier fecha.'],
    ['FaTasks', 'Seguimiento', 'Pasar un mensaje a una tarea o al Punto de Situación era copiar a mano. SENDERO lo lleva relleno y deja constancia.'],
    ['FaFileSignature', 'Firma', 'Pasar a rúbrica y encontrar la petición en el Portafirmas lleva varios pasos. SENDERO guía hasta AutoFirma.'],
  ];
  problemas.forEach(([ic, t, d], i) => {
    const x = 0.6 + i * 3.05;
    tarjeta(s, x, 1.7, 2.85, 4.1, 'problema ' + (i + 1));
    circulo(s, ic + HEX.blanco, x + 0.3, 2.0, 0.9, HEX.navy, t);
    txt(s, t, { x: x + 0.3, y: 3.1, w: 2.3, h: 0.8, fontSize: 19, bold: true, color: C.text2, fontFace: 'Cambria', objectName: t + ' título' });
    txt(s, d, { x: x + 0.3, y: 3.95, w: 2.3, h: 2.3, fontSize: 14, objectName: t + ' texto' });
  });
  s.addNotes('Los cuatro problemas salen del trabajo diario con MENSADEF en la unidad.');

  // 4. Mejoras respecto a MENSADEF solo
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Valor' });
  s.addText('Mejoras respecto a usar MENSADEF solo', { placeholder: 'title' });
  const filas = [
    ['Ver los mensajes', 'Célula a célula', 'Todas las células, entrada y salida, en una lista'],
    ['Buscar', 'En la bandeja abierta', '«🔎 En todo MENSADEF»: todas las células, cualquier fecha'],
    ['Antecedentes', 'Buscar a mano la referencia', '«Su referencia» y «N.º referencia» pulsables'],
    ['Seguimiento', 'Copiar a META o al PSIT', 'Un botón, datos rellenos y constancia en MENSADEF'],
    ['Revisión', 'Solo leído / no leído', '«✓ Visto», banderas, filtros y aviso de comentarios nuevos'],
    ['Documentos', 'Abrir el mensaje en MENSADEF', 'Oficio en PDF, correo preparado, informe para imprimir'],
    ['Firma', 'Buscar la petición en el Portafirmas', '«✍ Firmar en Rúbrica» la localiza y guía la firma'],
  ];
  const cab = o => ({ bold: true, color: HEX.blanco, fill: { color: HEX.navy }, fontSize: 15, ...o });
  s.addTable([[{ text: '', options: cab() }, { text: 'MENSADEF solo', options: cab() }, { text: 'Con SENDERO', options: cab({ fill: { color: HEX.bosque } }) }],
    ...filas.map((f, i) => f.map((t, j) => ({ text: t, options: { fontSize: 14, bold: j === 0, color: j === 0 ? HEX.navy : HEX.tinta,
      fill: { color: j === 2 ? 'E7F0EA' : (i % 2 ? HEX.blanco : HEX.papel) } } })))],
  { x: 0.6, y: 1.6, w: 12.1, colW: [2.4, 4.1, 5.6], rowH: 0.62, border: { type: 'solid', pt: 0.5, color: 'D5DBE3' }, valign: 'middle', margin: 0.08, objectName: 'comparación' });
  s.addNotes('SENDERO no sustituye a MENSADEF: lee de él y usa sus mismas funciones. Redactar y enviar mensajes sigue siendo en MENSADEF.');

  // 5. Recorrido de un mensaje
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Valor' });
  s.addText('El camino de cada mensaje', { placeholder: 'title' });
  const pasos = [['FaInbox', 'Llega', 'a las bandejas de las células'], ['FaSearch', 'Se lee', 'con texto, anexos y referencias'],
    ['FaFlag', 'Se marca', 'visto, bandera y comentario'], ['FaTasks', 'Se sigue', 'tarea en META o al PSIT'], ['FaPenNib', 'Se firma', 'rúbrica y Portafirmas']];
  pasos.forEach(([ic, t, d], i) => {
    const x = 0.75 + i * 2.5;
    circulo(s, ic + HEX.blanco, x + 0.55, 2.0, 1.2, i === 4 ? HEX.bosque : HEX.navy, t);
    if (i < 4) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 1.95, y: 2.45, w: 0.5, h: 0.3, fill: { color: HEX.oro }, line: { color: HEX.oro }, objectName: 'flecha ' + (i + 1) });
    txt(s, t, { x, y: 3.45, w: 2.3, h: 0.5, fontSize: 20, bold: true, color: C.text2, align: 'center', fontFace: 'Cambria', objectName: t });
    txt(s, d, { x, y: 3.95, w: 2.3, h: 0.8, fontSize: 15, color: HEX.gris, align: 'center', objectName: t + ' detalle' });
  });
  tarjeta(s, 0.6, 5.2, 12.1, 1.3, 'nota recorrido');
  txt(s, [{ text: 'Todo desde la ficha del mensaje. ', options: { bold: true, color: C.text2 } },
    { text: 'Lo que cambia algo en MENSADEF (leído, bandera, comentario, rúbrica) queda hecho en MENSADEF, igual que si se hiciera allí, y las acciones que escriben piden confirmación.' }],
  { x: 0.9, y: 5.4, w: 11.5, h: 0.9, fontSize: 16, valign: 'middle', objectName: 'nota' });

  // 6. Rendimiento
  pres.addSection({ title: 'Rendimiento y seguridad' });
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Rendimiento y seguridad' });
  s.addText('Rendimiento: carga rápida y progresiva', { placeholder: 'title' });
  const cifras = [['Hoy', 'al abrir se carga solo el día (3 o 7 días si se elige)'], ['6', 'consultas a la vez a MENSADEF (antes 3)'],
    ['1 s', 'la lista se enseña según llega, sin esperar a todas las bandejas'], ['100', 'mensajes por página; cuerpo y anexos solo al abrir']];
  cifras.forEach(([n, d], i) => {
    const x = 0.6 + i * 3.05;
    tarjeta(s, x, 1.6, 2.85, 2.3, 'cifra ' + (i + 1));
    txt(s, n, { x: x + 0.25, y: 1.75, w: 2.35, h: 1.0, fontSize: 54, bold: true, color: C.accent2, fontFace: 'Cambria', objectName: 'cifra ' + n });
    txt(s, d, { x: x + 0.25, y: 2.8, w: 2.35, h: 1.0, fontSize: 14, color: HEX.gris, objectName: 'cifra texto ' + (i + 1) });
  });
  txt(s, 'Tiempos de carga', { x: 0.6, y: 4.2, w: 6, h: 0.45, fontSize: 20, bold: true, color: C.text2, fontFace: 'Cambria', objectName: 'tiempos título' });
  const t2 = (a, b, rojo) => [{ text: a, options: { fontSize: 14 } }, { text: b, options: { fontSize: 14, bold: true, color: rojo ? HEX.rojo : HEX.tinta } }];
  s.addTable([
    [{ text: 'Escenario', options: cab({ fontSize: 14 }) }, { text: 'Tiempo', options: cab({ fontSize: 14 }) }],
    t2('Entorno simulado: 3 días, 2 células, 136 mensajes (sin red real)', '0,1 s · no representativo'),
    t2('Real: primera carga, «Hoy», todas las células', '[MEDIR EN REAL]', true),
    t2('Real: «7 días», todas las células', '[MEDIR EN REAL]', true),
  ], { x: 0.6, y: 4.75, w: 12.1, colW: [8.6, 3.5], rowH: 0.48, border: { type: 'solid', pt: 0.5, color: 'D5DBE3' }, fill: { color: HEX.papel }, valign: 'middle', margin: 0.08, objectName: 'tiempos' });
  s.addNotes('Las cifras de la fila «Real» están por medir en un puesto real: SENDERO enseña en su barra de estado cuánto ha tardado cada carga y qué bandejas han sido las más lentas. La del simulado no sirve como referencia porque no hay red.');

  // 7. Seguridad
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Rendimiento y seguridad' });
  s.addText('Seguridad: los datos no salen del servidor', { placeholder: 'title' });
  const seg = [
    ['FaServer', 'Los datos se quedan en MENSADEF', 'Se ejecuta en mensadef.mdef.es con la sesión del usuario. Sin servidores propios, sin librerías ni recursos de internet.'],
    ['FaBan', 'Sin descargas', 'SENDERO no se descarga ni se reparte como archivo: se instala desde Colabora. Los informes y PDF se generan en el propio navegador.'],
    ['FaUserShield', 'Acceso controlado', 'Solo entran los autorizados en Colabora (por ámbito o persona; bloqueos). Se comprueba en cada apertura.'],
    ['FaCheckCircle', 'Mismos permisos', 'Nadie ve con SENDERO nada que no vea en MENSADEF. Solo escribe lo que MENSADEF ya permite, con confirmación.'],
    ['FaCode', 'Código protegido', 'Ofuscado, ligado al dominio *.mdef.es y con autoría visible. Caduca y se puede retirar una versión.'],
  ];
  seg.forEach(([ic, t, d], i) => {
    const y = 1.55 + i * 1.07;
    circulo(s, ic + (ic === 'FaCheckCircle' ? HEX.bosque : HEX.blanco), 0.7, y, 0.8, ic === 'FaCheckCircle' ? 'E7F0EA' : HEX.navy, t);
    txt(s, t, { x: 1.75, y: y + 0.02, w: 3.6, h: 0.75, fontSize: 18, bold: true, color: C.text2, valign: 'middle', objectName: t });
    txt(s, d, { x: 5.4, y: y + 0.02, w: 7.3, h: 0.8, fontSize: 14, valign: 'middle', objectName: t + ' detalle' });
  });

  // 8. Control de acceso y versiones
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Rendimiento y seguridad' });
  s.addText('El mando decide quién lo usa y qué versión vale', { placeholder: 'title' });
  txt(s, [
    { text: 'Autorización', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: 'Por ámbito de MENSADEF completo, persona a persona o bloqueando a alguien. Las solicitudes se piden desde SENDERO y las aprueba el Cte. o el responsable del ámbito, con aviso por correo.', options: { breakLine: true, paraSpaceAfter: 12 } },
    { text: 'Versión vigente y obligatoria', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: 'Quien tiene una versión anterior ve el aviso; si se marca obligatoria, deja de funcionar.', options: { breakLine: true, paraSpaceAfter: 12 } },
    { text: 'Caducidad', options: { bold: true, color: C.text2, fontSize: 18, breakLine: true } },
    { text: '30, 60, 90 días o indefinida, elegida en Colabora y aplicada al momento a todos los favoritos repartidos.' },
  ], { x: 0.6, y: 1.6, w: 5.2, h: 5.0, objectName: 'gobierno' });
  captura(s, 'acceso-solicitudes.png', 6.2, 1.6, 6.5, 3.2, 'página de acceso');
  captura(s, 'bloqueo.png', 7.4, 4.9, 4.1, 1.95, 'no autorizado');
  s.addNotes('Todo se gestiona en la página de acceso de Colabora (listas «SENDERO Autorizados» y «SENDERO Solicitudes» del sitio JSUIGE).');

  // 9. Historial de versiones
  pres.addSection({ title: 'Evolución' });
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Evolución' });
  s.addText('Historial de versiones', { placeholder: 'title' });
  const hitos = [
    ['28/10', 'Primeras pruebas', 'Lectura de las bandejas de cada célula'],
    ['04/11', 'Versión para instalar', 'Favorito para toda la estructura SUIGE'],
    ['07/11', 'Nace SENDERO', 'Nombre, imagen y código protegido'],
    ['09/11', 'Acciones', 'Comentarios, banderas y paso a rúbrica'],
    ['10/11', 'Portal', 'Entrada automática desde la portada'],
    ['11/11', 'META y PSIT', 'Paso de mensajes a tareas y al Punto de Situación'],
    ['15–16/11', 'Control de acceso', 'Autorización, caducidad y versión obligatoria'],
    ['17/11', 'Rendimiento', 'Carga de hoy, 6 a la vez y progresiva'],
    ['18/11', 'Documentos', 'Oficio en PDF, referencias y comentarios nuevos'],
    ['19/11', 'Búsqueda y firma', '«En todo MENSADEF» y firma en el Portafirmas'],
  ];
  s.addShape(pres.shapes.LINE, { x: 0.9, y: 3.65, w: 11.6, h: 0, line: { color: HEX.oro, width: 3 }, objectName: 'línea de tiempo' });
  hitos.forEach(([f, t, d], i) => {
    const x = 0.6 + i * 1.21, arriba = i % 2 === 0;
    s.addShape(pres.shapes.OVAL, { x: x + 0.45, y: 3.5, w: 0.3, h: 0.3, fill: { color: i === hitos.length - 1 ? HEX.bosque : HEX.navy }, line: { color: HEX.blanco, width: 2 }, objectName: 'hito ' + f });
    txt(s, [{ text: f, options: { bold: true, color: C.accent3, fontSize: 14, breakLine: true } }, { text: t, options: { bold: true, color: C.text2, fontSize: 14, breakLine: true } },
      { text: d, options: { fontSize: 12, color: HEX.gris } }], { x: x - 0.25, y: arriba ? 1.65 : 4.05, w: 1.7, h: 1.75, align: 'center', valign: arriba ? 'bottom' : 'top', objectName: 'hito texto ' + f });
  });
  tarjeta(s, 0.6, 6.05, 12.1, 0.75, 'versión actual');
  txt(s, [{ text: 'Versión actual: 2026-11-19 · 5. ', options: { bold: true, color: C.text2 } }, { text: 'Un único favorito para MENSADEF y para el Portafirmas. Cada versión, con sus novedades, se anota en Colabora.' }],
    { x: 0.9, y: 6.1, w: 11.5, h: 0.65, fontSize: 15, valign: 'middle', objectName: 'actual' });
  s.addNotes('Fechas de 2026. Detalle completo de cada versión en el manual técnico y en el README del proyecto.');

  // 10. Calidad
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Evolución' });
  s.addText('Cada versión se prueba antes de repartirla', { placeholder: 'title' });
  txt(s, '28', { x: 0.6, y: 1.8, w: 4, h: 1.8, fontSize: 120, bold: true, color: C.accent2, fontFace: 'Cambria', objectName: 'número pasadas' });
  txt(s, 'pasadas automáticas en un MENSADEF, un Colabora y un Portafirmas simulados, con datos inventados', { x: 0.6, y: 3.7, w: 4.3, h: 1.4, fontSize: 18, color: C.text2, objectName: 'pasadas texto' });
  txt(s, [
    { text: 'Todas las formas de entrar: desde la célula, desde la portada, con sesión, sin sesión y con MENSADEF lento.', options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'Usuario no autorizado, versión nueva, versión obligatoria y caducidad de 30, 60, 90 días o indefinida.', options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'Rechazos de MENSADEF (rúbrica sin firma) y organización sin META ni PSIT.', options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'Página de acceso en Colabora y panel de firma en el Portafirmas.', options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'Última ejecución sobre la versión actual: todo correcto.', options: { bullet: true, bold: true, color: HEX.bosque } },
  ], { x: 5.5, y: 1.9, w: 7.2, h: 4.5, fontSize: 16, objectName: 'qué se prueba' });

  // 11. Siguientes pasos
  s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Evolución' });
  s.addText('Siguientes pasos', { placeholder: 'title' });
  const sig = [
    ['FaBolt', 'Medir los tiempos reales', 'Tomar en puestos reales los tiempos de la primera carga y de la búsqueda para completar la lámina de rendimiento.'],
    ['FaRoute', 'Extender a otros ámbitos', 'Planteado: un único SENDERO para varias organizaciones (IGE, MAPER, MALE…), cada una con su META y su Punto de Situación.'],
    ['FaLink', 'Cerrar los pendientes con MENSADEF', 'Enlace directo a un mensaje concreto y PDF original desde MENSADEF, cuando se conozcan sus llamadas.'],
  ];
  sig.forEach(([ic, t, d], i) => {
    const x = 0.6 + i * 4.1;
    tarjeta(s, x, 1.7, 3.85, 3.9, 'paso ' + (i + 1));
    circulo(s, ic + (ic === 'FaBolt' ? HEX.oro : HEX.blanco), x + 0.35, 2.0, 0.9, HEX.navy, t);
    txt(s, t, { x: x + 0.35, y: 3.1, w: 3.15, h: 0.9, fontSize: 20, bold: true, color: C.text2, fontFace: 'Cambria', objectName: t });
    txt(s, d, { x: x + 0.35, y: 4.05, w: 3.15, h: 2.0, fontSize: 15, objectName: t + ' detalle' });
  });

  // 12. Cierre
  s = pres.addSlide({ masterName: 'OSCURA', sectionTitle: 'Evolución' });
  s.addText('S E N D E R O', { placeholder: 'title' });
  s.addText([{ text: 'El camino de cada mensaje', options: { breakLine: true } },
    { text: 'Diseño, desarrollo y propiedad intelectual: Cte. Alfredo Sánchez Sender', options: { italic: false, fontSize: 18, color: C.background1 } }], { placeholder: 'body' });

  await pres.writeFile({ fileName: SALIDA });
  await applyTheme(SALIDA, THEME);
  console.log('escrito', SALIDA);
})();
