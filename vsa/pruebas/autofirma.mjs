// Prueba de prueba-autofirma.html: AutoFirma simulado (se sustituyen AutoScript.selectCertificate y AutoScript.sign).
// Uso: node vsa/pruebas/autofirma.mjs [certificado-base64]   (Playwright global y Chromium ya instalados)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const html = fs.readFileSync(new URL('../prueba-autofirma.html', import.meta.url), 'utf8');
const CERT = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8').trim() : null;
const O = 'https://colabora.mdef.es/et/jige/colaborativo/SiteAssets/prueba-autofirma.html';

async function prueba(escenario) {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  const errs = [], fuera = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u = r.request().url(); if (u === O) return r.fulfill({ body: html, contentType: 'text/html' }); fuera.push(u); return r.abort(); });
  await p.goto(O);
  const entorno = await p.$$eval('#entorno tr', t => t.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | '));
  // AutoFirma simulado
  await p.evaluate(([esc, cert]) => {
    window.__llamadas = [];
    AutoScript.selectCertificate = (prm, ok, ko) => setTimeout(() => esc === 'cancela' ? ko('es.gob.afirma.core.AOCancelledOperationException', 'Operacion cancelada por el usuario') : ok(cert), 50);
    AutoScript.sign = (datos, alg, fmt, prm, ok, ko) => {
      window.__llamadas.push({ alg, fmt, prm, datos });
      setTimeout(() => esc === 'sin autofirma' ? ko('es.gob.afirma.standalone.ApplicationNotFoundException', 'No se pudo conectar con Autofirma', 'AS620017') : ok(datos, cert), 50);
    };
  }, [escenario, CERT]);
  await p.click('#bCert'); await p.waitForTimeout(200);
  const rCert = (await p.textContent('#rCert')).replace(/\s+/g, ' ');
  await p.click('#bFirma1'); await p.waitForTimeout(200);
  const r1 = (await p.textContent('#rFirma1')).replace(/\s+/g, ' ');
  let r2 = '-', pdfOk = '-';
  if (escenario === 'normal') {
    await p.click('#bFirma2'); await p.waitForTimeout(200);
    r2 = (await p.textContent('#rFirma2')).replace(/\s+/g, ' ');
    const ll = await p.evaluate(() => window.__llamadas.map(x => ({ alg: x.alg, fmt: x.fmt, prm: x.prm.split('\n').slice(1, 5).join(','), n: x.datos.length })));
    console.log(escenario, '| llamadas:', JSON.stringify(ll));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#rFirma1 a.descarga')]);
    const ruta = new URL('prueba.pdf', import.meta.url).pathname; await dl.saveAs(ruta);
    const pdf = fs.readFileSync(ruta, 'latin1'); fs.unlinkSync(ruta);
    const sx = +pdf.match(/startxref\n(\d+)/)[1];
    const offs = [...pdf.slice(sx).matchAll(/(\d{10}) 00000 n/g)].map(m => +m[1]);
    pdfOk = (pdf.slice(sx, sx + 4) === 'xref' && offs.every((o, i) => pdf.slice(o).startsWith((i + 1) + ' 0 obj'))) + ' · ' + /ELECTR\xd3NICA/.test(pdf) + ' · ' + dl.suggestedFilename();
    const len = +pdf.match(/\/Length (\d+)/)[1], ini = pdf.indexOf('stream\n') + 7;
    pdfOk += ' · longitud ' + (pdf.slice(ini + len, ini + len + 9) === 'endstream');
  }
  await p.click('#bInforme').catch(() => {}); 
  const informe = (await p.textContent('#log')).split('\n').filter(l => /Certificado|Firma|AutoScript|Librer/.test(l)).join(' / ');
  console.log(escenario, '| entorno:', entorno);
  console.log(escenario, '| cert:', rCert.slice(0, 200), '| firma 1:', r1.slice(0, 160), '| firma 2:', r2.slice(0, 120), '| PDF xref/acentos/nombre:', pdfOk);
  console.log(escenario, '| informe:', informe.slice(0, 400), '| peticiones fuera:', fuera, '| errores:', errs);
  if (escenario === 'normal') await p.screenshot({ path: new URL('autofirma.png', import.meta.url).pathname, fullPage: true });
  await b.close();
}
await prueba('normal'); await prueba('cancela'); await prueba('sin autofirma');
