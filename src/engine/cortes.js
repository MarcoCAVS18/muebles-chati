// Lista de cortes, plano de placas, peso y lista de compras.
import { optimizarPlacas, optimizarListones } from './packer.js';
import { resumenFijaciones } from './fijaciones.js';

const r1 = (n) => Math.round(n * 10) / 10;

export function listaDeCortes(partes, cfg) {
  const placas = {};
  const listones = {};
  const avisos = [];

  for (const p of partes) {
    if (p.tipo === 'liston') {
      const dims = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
      (listones[p.mat] = listones[p.mat] || []).push({
        id: p.id,
        grupo: p.grupo,
        nombre: p.nombre,
        largo: r1(dims[0]),
      });
    } else {
      const dims = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
      const t = dims[2];
      const esperado = cfg.materiales[p.mat].t;
      if (Math.abs(t - esperado) > 0.6) {
        avisos.push(`${p.id}: el espesor (${r1(t)} mm) no coincide con el material (${esperado} mm).`);
      }
      (placas[p.mat] = placas[p.mat] || []).push({
        id: p.id,
        grupo: p.grupo,
        nombre: p.nombre,
        L: r1(dims[0]),
        A: r1(dims[1]),
        t: r1(t),
      });
    }
  }
  return { placas, listones, avisos };
}

export function planificar(partes, cfg) {
  const lista = listaDeCortes(partes, cfg);
  const planPlacas = {};
  for (const [mat, piezas] of Object.entries(lista.placas)) {
    planPlacas[mat] = optimizarPlacas(piezas, cfg.materiales[mat], cfg.corte);
  }
  const planListones = {};
  for (const [mat, piezas] of Object.entries(lista.listones)) {
    planListones[mat] = optimizarListones(piezas, cfg.listones[mat].largo, cfg.corte.kerf);
  }
  return { lista, planPlacas, planListones };
}

export function pesoEstimado(partes, cfg) {
  let kg = 0;
  for (const p of partes) {
    const vol = (p.sx * p.sy * p.sz) / 1e9; // m3
    const dens = p.tipo === 'liston' ? cfg.listones[p.mat].densidad : cfg.materiales[p.mat].densidad;
    kg += vol * dens;
  }
  return kg;
}

export function listaDeCompras(data, plan, cfg) {
  const filas = [];
  for (const [mat, res] of Object.entries(plan.planPlacas)) {
    const m = cfg.materiales[mat];
    filas.push({
      categoria: 'Madera',
      item: `${m.nombre} - hoja ${m.hojaL} x ${m.hojaA} mm`,
      cantidad: res.hojas.length,
      nota: `Aprovechamiento ${Math.round(res.aprovechamientoTotal * 100)} %. Sumar una hoja de margen si querés errores de corte.`,
    });
  }
  for (const [mat, res] of Object.entries(plan.planListones)) {
    const l = cfg.listones[mat];
    filas.push({
      categoria: 'Madera',
      item: `${l.nombre} x ${l.largo} mm`,
      cantidad: res.barras.length,
      nota: '',
    });
  }
  // Herrajes agrupados por nombre
  const mapa = new Map();
  for (const h of data.herrajes) {
    const k = h.nombre;
    mapa.set(k, (mapa.get(k) || 0) + h.cantidad);
  }
  for (const [item, cantidad] of mapa) {
    filas.push({ categoria: 'Herrajes', item, cantidad, nota: '' });
  }
  const fij = resumenFijaciones(data.uniones, data.anclajes);
  for (const f of fij.totales) {
    filas.push({ categoria: 'Fijaciones', item: f.nombre, cantidad: f.cantidad, nota: f.nota });
  }
  for (const e of data.equipos) {
    filas.push({ categoria: 'Equipos', item: e.nombre, cantidad: 1, nota: 'Ya comprado' });
  }
  return filas;
}
