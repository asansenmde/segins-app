// Genera la versión protegida de tareas-nlt-colabora.html para subir a Colabora: ../colabora/tareas-nlt-colabora.html
// El original legible (../tareas-nlt-colabora.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd colabora/proteger && npm install && node proteger.mjs
//      node proteger.mjs --pruebas  → ../colabora/tareas-nlt-colabora-pruebas.html (copia de pruebas: lista «Gestor de Tareas PRUEBAS», banda roja)
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import { cifrar } from './cifrado.mjs';   // todo cifrado: textos, campos y expresiones (13/11/2026)

const PRUEBAS = process.argv.includes('--pruebas');
//      node proteger.mjs --propio   → ../colabora/META.html (Gestor propio de MENSADEF: lista «Gestor de Tareas MENSADEF»)
const PROPIO = process.argv.includes('--propio');
// ORIGEN=ruta: generar desde otro original (p. ej. la versión que está como buena en Colabora)
const origen = process.env.ORIGEN ? new URL('file://' + (process.env.ORIGEN.startsWith('/') ? '' : process.cwd() + '/') + process.env.ORIGEN) : new URL('../tareas-nlt-colabora.html', import.meta.url), destino = new URL(PROPIO ? '../colabora/META.html' : PRUEBAS ? '../colabora/tareas-nlt-colabora-pruebas.html' : '../colabora/tareas-nlt-colabora.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');
if (PROPIO) {
  if (!html.includes('var PROPIO = false;')) throw new Error('No encuentro «var PROPIO = false;» en tareas-nlt-colabora.html');
  html = html.replace('var PROPIO = false;', 'var PROPIO = true;');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>META · Gestión de expedientes MENSADEF</title>');
}
if (PRUEBAS) {
  if (!html.includes('var PRUEBAS = false;')) throw new Error('No encuentro «var PRUEBAS = false;» en tareas-nlt-colabora.html');
  html = html.replace('var PRUEBAS = false;', 'var PRUEBAS = true;');
}

// Se ofusca el código de la aplicación (el último <script>)
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
// Protección (13/11/2026): todo cifrado con cifrado.mjs (textos, nombres de campo y expresiones; etiquetas </head>… como
// \x3c para el filtro de la red). Sustituye al compactado del 04/11, que dejaba los textos legibles.
const { codigo: ofuscado } = cifrar(codigo, Number(process.env.SEMILLA || 20261027));
const codigoFinal = ofuscado;

const aviso = '<!--\n  Gestor de tareas de la Jefatura de SUIGESUR · versión ' + version + ' (protegida' + (PRUEBAS ? ', COPIA DE PRUEBAS' : PROPIO ? ', META · GESTOR PROPIO DE MENSADEF' : '') + ')\n' +
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
