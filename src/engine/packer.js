// Plano de cortes. Usa tiras (corte guillotina): primero se corta la hoja a lo ancho
// en tiras y después cada tira a lo largo. Sirve para sierra circular con guía.

export function optimizarPlacas(piezas, mat, corte) {
  const kerf = corte.kerf;
  const rec = corte.recorte;
  const W = mat.hojaL - 2 * rec;
  const H = mat.hojaA - 2 * rec;

  const items = piezas.map((p) => ({ ...p, w: p.L, h: p.A, rotada: false }));
  items.sort((a, b) => b.h - a.h || b.w - a.w);

  const hojas = [];
  const sinColocar = [];

  const colocar = (hoja, it) => {
    const opciones = [{ w: it.w, h: it.h, rotada: false }];
    if (corte.rotar && it.w !== it.h) opciones.push({ w: it.h, h: it.w, rotada: true });
    for (const o of opciones) {
      if (o.w > W || o.h > H) continue;
      for (const tira of hoja.tiras) {
        if (tira.h >= o.h && tira.usadoX + o.w <= W + 0.01) {
          tira.items.push({ ...it, w: o.w, h: o.h, rotada: o.rotada, x: tira.usadoX });
          tira.usadoX += o.w + kerf;
          return true;
        }
      }
      if (hoja.usadoY + o.h <= H + 0.01) {
        const tira = { y: hoja.usadoY, h: o.h, usadoX: 0, items: [] };
        tira.items.push({ ...it, w: o.w, h: o.h, rotada: o.rotada, x: 0 });
        tira.usadoX = o.w + kerf;
        hoja.tiras.push(tira);
        hoja.usadoY += o.h + kerf;
        return true;
      }
    }
    return false;
  };

  for (const it of items) {
    const cabe = (it.w <= W && it.h <= H) || (corte.rotar && it.h <= W && it.w <= H);
    if (!cabe) {
      sinColocar.push(it);
      continue;
    }
    let ok = false;
    for (const hoja of hojas) {
      if (colocar(hoja, it)) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      const hoja = { tiras: [], usadoY: 0 };
      hojas.push(hoja);
      colocar(hoja, it);
    }
  }

  const areaHoja = mat.hojaL * mat.hojaA;
  const resultado = hojas.map((h, i) => {
    const area = h.tiras.reduce((s, t) => s + t.items.reduce((s2, it) => s2 + it.w * it.h, 0), 0);
    return { numero: i + 1, tiras: h.tiras, aprovechamiento: area / areaHoja };
  });
  const areaPiezas = resultado.reduce((s, h) => s + h.aprovechamiento * areaHoja, 0);
  return {
    hojas: resultado,
    sinColocar,
    aprovechamientoTotal: hojas.length ? areaPiezas / (hojas.length * areaHoja) : 0,
    recorte: rec,
  };
}

// Listones: primer ajuste decreciente
export function optimizarListones(piezas, largoStock, kerf) {
  const orden = [...piezas].sort((a, b) => b.largo - a.largo);
  const barras = [];
  const sinColocar = [];
  for (const p of orden) {
    if (p.largo > largoStock) {
      sinColocar.push(p);
      continue;
    }
    let barra = barras.find((b) => b.usado + p.largo + (b.items.length ? kerf : 0) <= largoStock);
    if (!barra) {
      barra = { usado: 0, items: [] };
      barras.push(barra);
    }
    barra.usado += p.largo + (barra.items.length ? kerf : 0);
    barra.items.push(p);
  }
  return { barras, sinColocar };
}

// Instrucciones de corte en texto, por hoja
export function pasosDeCorte(hoja, corte) {
  const pasos = [];
  hoja.tiras.forEach((t, i) => {
    pasos.push(
      `Tira ${i + 1}: cortar la hoja a lo ancho dejando ${Math.round(t.h)} mm de alto` +
        (i === 0 ? ` (después de recortar ${corte.recorte} mm de borde)` : '')
    );
    let acum = 0;
    const cortes = t.items.map((it) => {
      acum += it.w;
      const txt = `${it.id} = ${Math.round(it.w)} mm`;
      acum += corte.kerf;
      return txt;
    });
    pasos.push(`   Cortar la tira en: ${cortes.join(' | ')}`);
  });
  return pasos;
}
