// Genera la versión protegida de incidentes.html para subir a Colabora: ../colabora/incidentes.html
// El original legible (../incidentes.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd incidentes/proteger && npm install && node proteger.mjs
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const origen = new URL('../incidentes.html', import.meta.url), destino = new URL('../colabora/incidentes.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');

// Se ofusca el código de la aplicación (el último <script>). Si algún día se incluye una librería de terceros con
// licencia (p. ej. AutoFirma), va en otro <script> anterior y se deja tal cual.
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
// Protección (03/11/2026): con la ofuscación fuerte (tabla de textos cifrada, «self-defending», bloqueo de dominio del
// ofuscador) algunas copias llegaban a Edge con el programa anulado y se veía el código como texto (26/10 · 1, 01/11 · 1,
// 03/11 · 2): un filtro o antivirus reconoce las marcas de esa herramienta y depende de cómo salga cada copia. El original
// legible nunca falla. Ahora se hace como un compactado normal: nombres internos cambiados y sin espacios ni comentarios,
// sin las marcas del ofuscador. El bloqueo a los dominios de Defensa se hace con una comprobación propia, que también queda
// compactada. FUERTE=1 vuelve a la ofuscación anterior (SEMILLA=n para cambiar la semilla).
const fuerte = !!process.env.FUERTE;
const guardia = "if (!/(^|\\.)mdef\\.es$/i.test(location.hostname)) { document.documentElement.innerHTML = '<p style=\"font:16px sans-serif;margin:40px\">Esta aplicación solo funciona en Colabora (mdef.es). © 2026 Cte. Alfredo Sánchez Sender.</p>'; throw new Error('dominio'); }\n";
const ofuscado = JavaScriptObfuscator.obfuscate(fuerte ? codigo : guardia + codigo, fuerte ? {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: true,
  domainLock: ['.mdef.es'],
  seed: Number(process.env.SEMILLA || 20261027),
  unicodeEscapeSequence: false
} : {
  compact: true,
  identifierNamesGenerator: 'mangled',
  renameGlobals: false,
  stringArray: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  numbersToExpressions: false,
  simplify: true,
  splitStrings: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  seed: 20261103
}).getObfuscatedCode();
// En el modo normal, los espacios y comillas dobles de los textos vuelven a escribirse tal cual (el generador los pone como
// \x20 y \x22, y tantos códigos hexadecimales también parecen código camuflado). Solo si la barra no está a su vez escapada.
const codigoCompacto = fuerte ? ofuscado : ofuscado.replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ').replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ')
  .replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"').replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"');
// CAUSA REAL de «sale el código como texto» (03/11/2026): algo en la red de Defensa mete su propio código en las páginas
// buscando etiquetas como </head> o <body>, y las encontraba también DENTRO del programa (la plantilla de la ventana de
// impresión), partiéndolo en dos. Con la ofuscación fuerte, esos textos unas veces salían cifrados y otras no: por eso
// fallaba «al azar». Ahora el «<» de esas etiquetas se escribe \x3c dentro del código (el navegador lo lee igual).
const ETIQUETAS = /<(?=\/?(?:!doctype|html|head|body|meta|title|style|link|base|script)\b)/gi;
const codigoFinal = codigoCompacto.replace(ETIQUETAS, '\\x3c');
if (/<\/script|<!--|<\/?(?:!doctype|html|head|body)\b/i.test(codigoFinal)) throw new Error('El código protegido contiene etiquetas de página («</head>», «<body>»…): no se puede pegar en la página');

const aviso = '<!--\n  Incidentes de seguridad en instalaciones · Inspección General del Ejército · versión ' + version + ' (protegida)\n' +
  '  © 2026 Cte. Alfredo Sánchez Sender. Desarrollador y autor de esta aplicación. Todos los derechos reservados.\n' +
  '  Prohibida su copia, modificación o redistribución sin autorización del autor.\n-->\n';
let salida = html.slice(0, ini + 8) + '\n' + codigoFinal + '\n' + html.slice(fin);
salida = salida.replace(/^<!doctype html>\n<!--[\s\S]*?-->\n/i, '<!doctype html>\n' + aviso);         // aviso con la versión
// Fuera los comentarios internos del HTML y del estilo (se queda solo el aviso de autoría del principio)
const [cab, resto] = [salida.slice(0, salida.indexOf('-->') + 3), salida.slice(salida.indexOf('-->') + 3)];
salida = cab + resto.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
fs.mkdirSync(new URL('../colabora/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, salida);
console.log('Versión ' + version + ' protegida: ' + destino.pathname + ' (' + Math.round(salida.length / 1024) + ' KB; código de la aplicación ' +
  Math.round(codigo.length / 1024) + ' KB → ' + Math.round(ofuscado.length / 1024) + ' KB)');
