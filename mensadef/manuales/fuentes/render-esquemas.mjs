// Pasa los esquemas SVG (../capturas/esquema-*.svg) a PNG a doble resolución, para los manuales de Word.
// © 2026 Cte. Alfredo Sánchez Sender.
import { createRequire } from 'module';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'capturas');
const b = await pw.chromium.launch();
for (const f of readdirSync(dir).filter(x => /^esquema-.*\.svg$/.test(x))) {
  const svg = readFileSync(join(dir, f), 'utf8');
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
  await p.setContent('<html><body style="margin:0">' + svg + '</body></html>');
  await p.screenshot({ path: join(dir, f.replace('.svg', '.png')), clip: { x: 0, y: 0, width: +w, height: +h } });
  await p.close();
  console.log('png', f);
}
await b.close();
