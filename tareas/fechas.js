// Lee una frase en español y saca de ella la NLT, la hora, la prioridad y la categoría.
// «Informe extintores antes del viernes a las 10 #Informes urgente» →
//   { titulo: 'Informe extintores', nlt: '2026-10-02', hora: '10:00', prioridad: 'alta', categoria: 'Informes' }
// Todo se hace en el dispositivo: no se envía el texto a ningún sitio.

const MESES = { enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4, mayo: 5, may: 5, junio: 6, jun: 6,
  julio: 7, jul: 7, agosto: 8, ago: 8, septiembre: 9, setiembre: 9, sept: 9, sep: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12 };
const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, 'miércoles': 3, jueves: 4, viernes: 5, sabado: 6, 'sábado': 6 };
const NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15 };

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Palabras de enlace que suelen ir delante de la fecha y sobran en el título
const ENLACE = /(?:\s|^)(?:(?:como\s+(?:muy\s+)?tarde|a\s+m[aá]s\s+tardar|antes\s+de(?:l)?|para(?:\s+el)?|hasta(?:\s+el)?|con\s+fecha|nlt:?|plazo:?|vence|fecha\s+l[ií]mite:?|el|la|del|de|y|,|-|:)\s*)+$/i;

function fechaValida(y, m, d) {
  const f = new Date(y, m - 1, d);
  return f.getFullYear() === y && f.getMonth() === m - 1 && f.getDate() === d ? f : null;
}

// Si no se dice el año y la fecha ya pasó este año, es la del año que viene
function conAnio(m, d, y, hoy) {
  if (y) return fechaValida(y < 100 ? 2000 + y : y, m, d);
  const f = fechaValida(hoy.getFullYear(), m, d);
  if (f && f < hoy) return fechaValida(hoy.getFullYear() + 1, m, d);
  return f;
}

export function interpretar(texto, ahora = new Date()) {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const res = { titulo: texto.trim(), nlt: '', hora: '', prioridad: '', categoria: '', trozos: [] };
  let t = ` ${texto} `;
  const quitar = (m, desc) => { res.trozos.push(desc); t = t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length); };
  const mas = n => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d; };
  const buscar = re => re.exec(t);
  let fecha = null, m;

  // Categoría: #Palabra
  if ((m = buscar(/#([\p{L}\p{N}_\-]+)/u))) { res.categoria = m[1].replace(/_/g, ' '); quitar(m, 'categoría'); }
  // Prioridad
  if ((m = buscar(/(?:!!+|\b(?:cr[ií]tic[ao]|inmediat[ao]|flash)\b)/i))) { res.prioridad = 'critica'; quitar(m, 'prioridad'); }
  else if ((m = buscar(/(?:\s!(?=\s)|\b(?:urgente|urgent[ií]simo|prioritari[ao])\b)/i))) { res.prioridad = 'alta'; quitar(m, 'prioridad'); }

  // Hora: «a las 10», «a las 9:30», «10:00», «10h», «10.30 h»
  if ((m = buscar(/\b(?:a\s+las?\s+)(\d{1,2})(?:[:.h](\d{2}))?\s*(?:h(?:oras)?\b)?/i)) || (m = buscar(/\b(\d{1,2}):(\d{2})\b/))
    || (m = buscar(/\b(\d{1,2})(?:\.(\d{2}))?\s*h(?:oras)?\b/i))) {
    const h = +m[1], mi = +(m[2] || 0);
    if (h < 24 && mi < 60) { res.hora = `${pad(h)}:${pad(mi)}`; quitar(m, 'hora'); }
  }

  // Fechas, de la más concreta a la más vaga
  if ((m = buscar(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/)) || (m = buscar(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/))) {
    fecha = conAnio(+m[2], +m[1], m[3] ? +m[3] : 0, hoy);
  }
  if (!fecha && (m = buscar(/\b(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\.?(?:\s+(?:de|del)?\s*(\d{4}))?\b/i))) {
    fecha = conAnio(MESES[m[2].toLowerCase()], +m[1], m[3] ? +m[3] : 0, hoy);
  }
  if (!fecha && (m = buscar(/\bpasado\s+ma[ñn]ana\b/i))) fecha = mas(2);
  if (!fecha && (m = buscar(/(?<!(?:por|de)\s+la\s+)\bma[ñn]ana\b/i))) fecha = mas(1);
  if (!fecha && (m = buscar(/\bhoy\b/i))) fecha = hoy;
  if (!fecha && (m = buscar(/\b(?:en|dentro\s+de)\s+(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince)\s+(d[ií]as?|semanas?|mes(?:es)?)\b/i))) {
    const n = /\d/.test(m[1]) ? +m[1] : NUM[m[1].toLowerCase()];
    const u = sinTildes(m[2]);
    if (u.startsWith('dia')) fecha = mas(n);
    else if (u.startsWith('semana')) fecha = mas(7 * n);
    else { fecha = new Date(hoy); fecha.setMonth(fecha.getMonth() + n); }
  }
  if (!fecha && (m = buscar(/\b(?:(pr[oó]xim[oa]|siguiente|este|esta)\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(\s+(?:que\s+viene|pr[oó]ximo|de\s+la\s+semana\s+que\s+viene))?\b/i))) {
    const dia = DIAS[sinTildes(m[2])];
    if (/semana/i.test(m[3] || '')) {
      // «el martes de la semana que viene»: ese día de la semana natural siguiente
      const lunes = mas(((1 - hoy.getDay() + 7) % 7) || 7);
      fecha = new Date(lunes); fecha.setDate(lunes.getDate() + (dia + 6) % 7);
    } else {
      let dif = (dia - hoy.getDay() + 7) % 7;
      if (dif === 0) dif = 7; // «el viernes» dicho un viernes es el de la semana siguiente
      fecha = mas(dif);
    }
  }
  if (!fecha && (m = buscar(/\b(?:a\s+)?(?:fin(?:al)?|finales)\s+de(?:l)?\s+mes\b/i))) fecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  if (!fecha && (m = buscar(/\b(?:(?:esta|la)\s+semana|fin(?:al)?\s+de\s+(?:la\s+)?semana)\b/i))) {
    fecha = mas((5 - hoy.getDay() + 7) % 7); // el viernes de esta semana
  }
  if (!fecha && (m = buscar(/\b(?:el\s+)?d[ií]a\s+(\d{1,2})\b|\bel\s+(\d{1,2})(?![\d:.,/%])\b/i))) {
    const d = +(m[1] || m[2]);
    fecha = fechaValida(hoy.getFullYear(), hoy.getMonth() + 1, d);
    if (fecha && fecha < hoy) fecha = fechaValida(hoy.getFullYear(), hoy.getMonth() + 2, d) || new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);
  }
  if (fecha && m) { res.nlt = iso(fecha); quitar(m, 'fecha'); }

  // Título: sin los trozos reconocidos ni las palabras de enlace que quedan colgando
  let titulo = t.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) titulo = titulo.replace(ENLACE, '').replace(/^[\s,;:\-–]+|[\s,;:\-–]+$/g, '').trim();
  titulo = titulo.replace(/\s+(?:antes\s+de(?:l)?|para\s+el|hasta\s+el|el)\s+(?=,|$)/i, '').trim();
  res.titulo = titulo ? titulo[0].toUpperCase() + titulo.slice(1) : texto.trim();
  return res;
}
