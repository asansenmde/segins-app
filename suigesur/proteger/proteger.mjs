// Genera la versión protegida de CENTRO_CONTROL_NLT_SUIGESUR.html para subir a Colabora: ../colabora/CENTRO_CONTROL_NLT_SUIGESUR.html
// El original legible (../CENTRO_CONTROL_NLT_SUIGESUR.html) es el que se edita; esta copia se regenera cada vez que cambia.
// Uso: cd suigesur/proteger && npm install && node proteger.mjs
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import fs from 'fs';
import { cifrar } from './cifrado.mjs';   // todo cifrado: textos, campos y expresiones (receta de incidentes/proteger)

const NOMBRE = 'CENTRO_CONTROL_NLT_SUIGESUR.html';
const origen = new URL('../' + NOMBRE, import.meta.url), destino = new URL('../colabora/' + NOMBRE, import.meta.url);
let html = fs.readFileSync(origen, 'utf8');

// Se cifra el código de la aplicación (el último <script>); el primero (aviso de navegador antiguo) se deja tal cual.
const ini = html.lastIndexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < ini) throw new Error('No encuentro el <script> de la aplicación');
const codigo = html.slice(ini + 8, fin);
const version = (codigo.match(/const VERSION = '([^']+)'/) || [])[1] || '?';
const { codigo: ofuscado } = cifrar(codigo, Number(process.env.SEMILLA || 20261124), { transformObjectKeys: false });

const aviso = '<!--\n  Centro de Control NLT · SUIGESUR · versión ' + version + ' (protegida)\n' +
  '  © 2026 Cte. Alfredo Sánchez Sender. Desarrollador y autor de esta aplicación. Todos los derechos reservados.\n' +
  '  Prohibida su copia, modificación o redistribución sin autorización del autor.\n-->\n';
let salida = html.slice(0, ini + 8) + '\n' + ofuscado + '\n' + html.slice(fin);
// Fuera los comentarios internos del HTML y del estilo; el aviso de autoría va justo después del <!doctype>
salida = salida.replace(/<!--[\s\S]*?-->\n?/g, '').replace(/<style>[\s\S]*?<\/style>/g, st => st.replace(/\/\*[\s\S]*?\*\//g, ''));
salida = salida.replace(/^<!doctype html>\n/i, '<!doctype html>\n' + aviso);
fs.mkdirSync(new URL('../colabora/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, salida);
console.log('Versión ' + version + ' protegida: ' + destino.pathname + ' (' + Math.round(salida.length / 1024) + ' KB; código de la aplicación ' +
  Math.round(codigo.length / 1024) + ' KB → ' + Math.round(ofuscado.length / 1024) + ' KB)');
