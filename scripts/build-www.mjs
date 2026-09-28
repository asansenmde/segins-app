// Copia la app web (la misma que se publica en GitHub Pages) a www/, que es lo que empaquetan Android e iOS.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const ENTRADAS = ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const e of ENTRADAS) cpSync(e, `www/${e}`, { recursive: true });
console.log('www/ lista');
