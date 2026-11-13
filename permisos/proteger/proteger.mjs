// Genera la versión protegida de permisos.html para subir a Colabora: ../colabora/permisos.html
// El original legible (../permisos.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd permisos/proteger && npm install && node proteger.mjs
//      node proteger.mjs --pruebas  → ../colabora/permisos-pruebas.html (copia de pruebas: listas «… PRUEBAS», banda roja)
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import { cifrar } from './cifrado.mjs';   // todo cifrado: textos, campos y expresiones (13/11/2026)

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
// Protección (13/11/2026): todo cifrado con cifrado.mjs (textos, nombres de campo y expresiones; etiquetas </head>… como
// \x3c para el filtro de la red). Sustituye al compactado del 04/11 y a la ofuscación fuerte que dejaba el 25 % de los textos.
const { codigo: ofuscado } = cifrar(codigo, Number(process.env.SEMILLA || 20261027));
const codigoFinal = ofuscado;

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
