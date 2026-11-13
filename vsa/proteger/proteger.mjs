// Genera la versión protegida de vsa.html para subir a Colabora: ../colabora/vsa.html
// El original legible (../vsa.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd vsa/proteger && npm install && node proteger.mjs
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import { cifrar } from './cifrado.mjs';   // todo cifrado: textos, campos y expresiones (13/11/2026)

const origen = new URL('../vsa.html', import.meta.url), destino = new URL('../colabora/vsa.html', import.meta.url);
let html = fs.readFileSync(origen, 'utf8');

// Se ofusca solo el código de la aplicación (el último <script>). La librería de AutoFirma (Cliente @firma, GPL/EUPL)
// se deja tal cual, con su aviso de licencia.
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/var VERSION = '([^']+)'/) || [])[1] || '?';
const { codigo: ofuscado } = cifrar(codigo, Number(process.env.SEMILLA || 20261027));
const codigoFinal = ofuscado;

const aviso = '<!--\n  Cuestionario de calidad VSA · Inspección General del Ejército · versión ' + version + ' (protegida)\n' +
  '  © 2026 Cte. Alfredo Sánchez Sender. Desarrollador y autor de esta aplicación. Todos los derechos reservados.\n' +
  '  Prohibida su copia, modificación o redistribución sin autorización del autor.\n-->\n';
let salida = html.slice(0, ini + 8) + '\n' + codigoFinal + '\n' + html.slice(fin);
salida = salida.replace(/^<!doctype html>\n<!--[\s\S]*?-->\n/i, '<!doctype html>\n' + aviso)          // aviso con la versión
  .replace(/\n\s*\/\* Cliente @firma/, '\n/* Cliente @firma');                                       // nada más
// Fuera los comentarios internos del HTML y del estilo (se queda solo el aviso de autoría del principio)
const [cab, resto] = [salida.slice(0, salida.indexOf('-->') + 3), salida.slice(salida.indexOf('-->') + 3)];
salida = cab + resto.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
fs.mkdirSync(new URL('../colabora/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, salida);
console.log('Versión ' + version + ' protegida: ' + destino.pathname + ' (' + Math.round(salida.length / 1024) + ' KB; código de la aplicación ' +
  Math.round(codigo.length / 1024) + ' KB → ' + Math.round(ofuscado.length / 1024) + ' KB)');
