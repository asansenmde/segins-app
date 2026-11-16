// Genera la versión protegida de puntos-situacion.html para subir a Colabora: ../colabora/puntos-situacion.html
// El original legible (../puntos-situacion.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd puntos-situacion/proteger && npm install && node proteger.mjs
//      node proteger.mjs --pruebas  → ../colabora/puntos-situacion-pruebas.html (copia de pruebas: listas «PS … PRUEBAS», banda roja)
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import { cifrar } from './cifrado.mjs';   // todo cifrado: textos, campos y expresiones (como las demás aplicaciones)

const PRUEBAS = process.argv.includes('--pruebas');
const origen = new URL('../puntos-situacion.html', import.meta.url), destino = new URL(PRUEBAS ? '../colabora/puntos-situacion-pruebas.html' : '../colabora/puntos-situacion.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');
if (PRUEBAS) {
  if (!html.includes('var PRUEBAS = false;')) throw new Error('No encuentro «var PRUEBAS = false;» en puntos-situacion.html');
  html = html.replace('var PRUEBAS = false;', 'var PRUEBAS = true;');
}
// Se ofusca el código de la aplicación (el último <script>)
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
// Protección (16/11/2026, como las demás aplicaciones desde el 13/11): todo cifrado con cifrado.mjs (textos, nombres de
// campo y expresiones regulares; etiquetas </head>… como \x3c para el filtro de la red, y no se genera si queda alguna).
// Sustituye al compactado del 04/11, que dejaba los textos legibles. SEMILLA=n para otra semilla.
const { codigo: codigoFinal } = cifrar(codigo, Number(process.env.SEMILLA || 20261027));
const ofuscado = codigoFinal;

const aviso = '<!--\n  Puntos de Situación de SUIGESUR · versión ' + version + ' (protegida' + (PRUEBAS ? ', COPIA DE PRUEBAS' : '') + ')\n' +
  '  © 2026 Cte. Alfredo Sánchez Sender. Desarrollador y autor de esta aplicación. Todos los derechos reservados.\n' +
  '  Prohibida su copia, modificación o redistribución sin autorización del autor.\n-->\n';
let salida = html.slice(0, ini + 8) + '\n' + codigoFinal + '\n' + html.slice(fin);
salida = salida.replace(/^<!doctype html>\n<!--[\s\S]*?-->\n/i, '<!doctype html>\n' + aviso);
// Fuera los comentarios internos del HTML y del estilo (se queda solo el aviso de autoría del principio)
const [cab, resto] = [salida.slice(0, salida.indexOf('-->') + 3), salida.slice(salida.indexOf('-->') + 3)];
salida = cab + resto.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
fs.mkdirSync(new URL('../colabora/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, salida);
console.log('Versión ' + version + ' protegida: ' + destino.pathname + ' (' + Math.round(salida.length / 1024) + ' KB; código de la aplicación ' +
  Math.round(codigo.length / 1024) + ' KB → ' + Math.round(ofuscado.length / 1024) + ' KB)');
