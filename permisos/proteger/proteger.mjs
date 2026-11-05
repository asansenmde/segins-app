// Genera la versión protegida de permisos.html para subir a Colabora: ../colabora/permisos.html
// El original legible (../permisos.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd permisos/proteger && npm install && node proteger.mjs
//      node proteger.mjs --pruebas  → ../colabora/permisos-pruebas.html (copia de pruebas: listas «… PRUEBAS», banda roja)
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const PRUEBAS = process.argv.includes('--pruebas');
const origen = new URL('../permisos.html', import.meta.url), destino = new URL(PRUEBAS ? '../colabora/permisos-pruebas.html' : '../colabora/permisos.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');
if (PRUEBAS) {
  if (!html.includes('var PRUEBAS = false;')) throw new Error('No encuentro «var PRUEBAS = false;» en permisos.html');
  html = html.replace('var PRUEBAS = false;', 'var PRUEBAS = true;');
}

// Se ofusca el código de la aplicación (el último <script>). Si algún día se incluye una librería de terceros con
// licencia (p. ej. AutoFirma), va en otro <script> anterior y se deja tal cual.
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
// Protección (04/11/2026, como Incidentes; ver SHAREPOINT.md «Si la copia protegida sale como código»):
// - Compactado normal (nombres internos cambiados, sin espacios ni comentarios), sin las marcas de la ofuscación fuerte.
// - Bloqueo propio a *.mdef.es al principio del código.
// - CAUSA REAL del «código como texto»: algo en la red de Defensa mete su código buscando etiquetas como </head> o <body>,
//   y las encontraba también DENTRO del programa (plantillas de impresión o de Word), partiéndolo en dos. Aquí el «<» de
//   esas etiquetas se escribe \x3c (el navegador lo lee igual) y se niega a generar la copia si queda alguna.
// FUERTE=1 vuelve a la ofuscación anterior (SEMILLA=n para la semilla).
const fuerte = !!process.env.FUERTE;
const guardia = "if (!/(^|\\.)mdef\\.es$/i.test(location.hostname)) { document.documentElement.innerHTML = '<p style=\"font:16px sans-serif;margin:40px\">Esta aplicación solo funciona en Colabora (mdef.es). © 2026 Cte. Alfredo Sánchez Sender.</p>'; throw new Error('dominio'); }\n";
const ofuscado = JavaScriptObfuscator.obfuscate(fuerte ? codigo : guardia + codigo, fuerte ? {
  compact: true, identifierNamesGenerator: 'hexadecimal', renameGlobals: false, stringArray: true, stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75, stringArrayRotate: true, stringArrayShuffle: true, splitStrings: false, controlFlowFlattening: false,
  deadCodeInjection: false, selfDefending: true, domainLock: ['.mdef.es'], seed: Number(process.env.SEMILLA || 20261027), unicodeEscapeSequence: false
} : {
  compact: true, identifierNamesGenerator: 'mangled', renameGlobals: false, stringArray: false, selfDefending: false, debugProtection: false,
  disableConsoleOutput: false, controlFlowFlattening: false, deadCodeInjection: false, numbersToExpressions: false, simplify: true,
  splitStrings: false, transformObjectKeys: false, unicodeEscapeSequence: false, seed: 20261103
}).getObfuscatedCode();
// Espacios y comillas dobles de los textos tal cual (el generador los pone como \x20 y \x22), si la barra no está escapada
const codigoCompacto = fuerte ? ofuscado : ofuscado.replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ').replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ')
  .replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"').replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"');
const ETIQUETAS = /<(?=\/?(?:!doctype|html|head|body|meta|title|style|link|base|script)\b|!--)/gi;   // también «<!--»
const codigoFinal = codigoCompacto.replace(ETIQUETAS, '\\x3c');
if (/<\/script|<!--|<\/?(?:!doctype|html|head|body)\b/i.test(codigoFinal)) throw new Error('El código protegido contiene etiquetas de página («</head>», «<body>»…): no se puede pegar en la página');

const aviso = '<!--\n  Solicitud de permisos · SUIGESUR · versión ' + version + ' (protegida' + (PRUEBAS ? ', COPIA DE PRUEBAS' : '') + ')\n' +
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
