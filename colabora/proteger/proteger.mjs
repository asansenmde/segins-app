// Genera la versión protegida de tareas-nlt-colabora.html para subir a Colabora: ../colabora/tareas-nlt-colabora.html
// El original legible (../tareas-nlt-colabora.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd colabora/proteger && npm install && node proteger.mjs
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const origen = new URL('../tareas-nlt-colabora.html', import.meta.url), destino = new URL('../colabora/tareas-nlt-colabora.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');

// Se ofusca el código de la aplicación (el último <script>)
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
const ofuscado = JavaScriptObfuscator.obfuscate(codigo, {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,   // más lento y no aporta mucho aquí
  deadCodeInjection: false,
  selfDefending: true,            // deja de funcionar si alguien lo reformatea para leerlo
  domainLock: ['.mdef.es'],       // solo funciona dentro de los dominios de Defensa (colabora.mdef.es…)
  unicodeEscapeSequence: false
}).getObfuscatedCode();

const aviso = '<!--\n  Gestor de tareas de la Jefatura de SUIGESUR · versión ' + version + ' (protegida)\n' +
  '  © 2026 Cte. Alfredo Sánchez Sender. Desarrollador y autor de esta aplicación. Todos los derechos reservados.\n' +
  '  Prohibida su copia, modificación o redistribución sin autorización del autor.\n-->\n';
let salida = html.slice(0, ini + 8) + '\n' + ofuscado + '\n' + html.slice(fin);
salida = salida.replace(/^<!doctype html>\n<!--[\s\S]*?-->\n/i, '<!doctype html>\n' + aviso);
// Fuera los comentarios internos del HTML y del estilo (se queda solo el aviso de autoría del principio)
const [cab, resto] = [salida.slice(0, salida.indexOf('-->') + 3), salida.slice(salida.indexOf('-->') + 3)];
salida = cab + resto.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
fs.mkdirSync(new URL('../colabora/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, salida);
console.log('Versión ' + version + ' protegida: ' + destino.pathname + ' (' + Math.round(salida.length / 1024) + ' KB; código de la aplicación ' +
  Math.round(codigo.length / 1024) + ' KB → ' + Math.round(ofuscado.length / 1024) + ' KB)');
