// Protege el código del visor de MENSADEF para el favorito: lo llama generar-marcador.py.
// Uso: node proteger.mjs <entrada.html> <salida.html>
// Igual que las páginas de Colabora (ver SHAREPOINT.md, «Si la copia protegida sale como código»): compactado normal
// (nombres internos cambiados, sin espacios ni comentarios), sin las marcas de la ofuscación fuerte, con bloqueo propio a
// *.mdef.es y sin etiquetas de página («</head>», «<body>», «<!--»…) escritas tal cual dentro del código.
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) throw new Error('Uso: node proteger.mjs <entrada.html> <salida.html>');
const html = fs.readFileSync(entrada, 'utf8');
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> del visor');
const codigo = html.slice(ini + 8, fin);
const guardia = "if (!/(^|\\.)mdef\\.es$/i.test(location.hostname)) { document.documentElement.innerHTML = '<p style=\"font:16px sans-serif;margin:40px\">Este visor solo funciona en MENSADEF (mdef.es). © 2026 Cte. Alfredo Sánchez Sender.</p>'; throw new Error('dominio'); }\n";
const ofuscado = JavaScriptObfuscator.obfuscate(guardia + codigo, {
  compact: true, identifierNamesGenerator: 'mangled', renameGlobals: false, stringArray: false, selfDefending: false, debugProtection: false,
  disableConsoleOutput: false, controlFlowFlattening: false, deadCodeInjection: false, numbersToExpressions: false, simplify: true,
  splitStrings: false, transformObjectKeys: false, unicodeEscapeSequence: false, seed: 20261105
}).getObfuscatedCode();
// Espacios y comillas dobles tal cual (el generador los pone como \x20 y \x22), si la barra no está escapada
const compacto = ofuscado.replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ').replace(/(^|[^\\])((?:\\\\)*)\\x20/g, '$1$2 ')
  .replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"').replace(/(^|[^\\])((?:\\\\)*)\\x22/g, '$1$2"');
const final = compacto.replace(/<(?=\/?(?:!doctype|html|head|body|meta|title|style|link|base|script)\b|!--)/gi, '\\x3c');
if (/<\/script|<!--|<\/?(?:!doctype|html|head|body)\b/i.test(final)) throw new Error('El código protegido contiene etiquetas de página');
// Fuera los comentarios del HTML y del estilo, salvo el aviso de autoría del principio
let pagina = html.slice(0, ini + 8) + '\n' + final + '\n' + html.slice(fin);
const cab = pagina.slice(0, pagina.indexOf('-->') + 3), resto = pagina.slice(pagina.indexOf('-->') + 3);
pagina = cab + resto.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
fs.writeFileSync(salida, pagina);
console.log('Visor protegido: ' + Math.round(codigo.length / 1024) + ' KB → ' + Math.round(final.length / 1024) + ' KB');
