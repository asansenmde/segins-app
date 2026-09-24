// Cálculo de resultados. Mismo criterio que el Excel SEGINS, con las correcciones acordadas:
// - Se muestran los dos criterios: % de conformidad (por nº de ítems) y puntos ponderados (por peso).
// - Los ítems sin responder no penalizan; se informan como pendientes.
// - Un área sin ítems aplicables no cuenta en el global (su peso se reparte entre las demás).

export function nivel(v, u) {
  if (v == null) return 'Sin datos';
  if (v >= u.umbralSat) return 'Satisfactorio';
  if (v >= u.umbralMej) return 'Mejorable';
  return 'Deficiente';
}

export function estado(r, u) {
  if (r.p1EnI > 0) return 'ALERTA P1';
  if (r.pct == null) return 'Sin datos';
  const peor = Math.min(r.pct, r.puntos);
  if (peor >= u.umbralSat) return 'OK';
  if (peor >= u.umbralMej) return 'VIGILAR';
  return 'CRÍTICO';
}

export function calcArea(area, respuestas, u) {
  let c = 0, i = 0, na = 0, pend = 0, pesoC = 0, pesoApl = 0, p1EnI = 0;
  for (const it of area.items) {
    const r = respuestas[it.id]?.r;
    const w = Number(it.peso) || 0;
    if (r === 'C') { c++; pesoC += w; pesoApl += w; }
    else if (r === 'I') { i++; pesoApl += w; if (it.prioridad === 'P1') p1EnI++; }
    else if (r === 'NA') na++;
    else pend++;
  }
  const apl = c + i;
  const res = {
    id: area.id, nombre: area.nombre, peso: Number(area.peso) || 0,
    total: area.items.length, apl, c, i, na, pend, p1EnI,
    pct: apl ? (c / apl) * 100 : null,
    puntos: pesoApl ? (pesoC / pesoApl) * 100 : null,
  };
  res.nivelPct = nivel(res.pct, u);
  res.nivelPuntos = nivel(res.puntos, u);
  res.estado = estado(res, u);
  return res;
}

export function calcEval(ev) {
  const u = ev.umbrales;
  const areas = ev.areas.map(a => calcArea(a, ev.respuestas, u));
  const conDatos = areas.filter(a => a.pct != null);
  const sumW = conDatos.reduce((s, a) => s + a.peso, 0);
  const pond = (k) => (sumW ? conDatos.reduce((s, a) => s + a.peso * a[k], 0) / sumW : null);
  const g = {
    pct: pond('pct'),
    puntos: pond('puntos'),
    p1EnI: areas.reduce((s, a) => s + a.p1EnI, 0),
    total: areas.reduce((s, a) => s + a.total, 0),
    respondidos: areas.reduce((s, a) => s + a.total - a.pend, 0),
    c: areas.reduce((s, a) => s + a.c, 0),
    i: areas.reduce((s, a) => s + a.i, 0),
    na: areas.reduce((s, a) => s + a.na, 0),
  };
  g.nivelPct = nivel(g.pct, u);
  g.nivelPuntos = nivel(g.puntos, u);
  g.estado = estado(g, u);
  return { areas, global: g };
}

export const fmtNum = (v, dec = 1) => (v == null ? '0' : v.toFixed(dec).replace('.', ','));
