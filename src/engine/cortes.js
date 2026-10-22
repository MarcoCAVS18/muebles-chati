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

export function listaDeCompras(data, plan, cfg, resElec, elec3d) {
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
    filas.push({ categoria: 'Equipos', item: e.nombre, cantidad: 1, nota: e.estado || 'Ya comprado' });
  }
  if (elec3d) {
    for (const e of elec3d.equipos) {
      filas.push({ categoria: 'Equipos', item: e.nombre, cantidad: 1, nota: 'Ya comprado' });
    }
  }
  if (resElec) {
    for (const c of resElec.cableCompras) {
      filas.push({ categoria: 'Cables y protecciones', item: c.item, cantidad: `${c.metros} m`, nota: 'Largo medido en el 3D, con 15 % de sobrante' });
    }
    // Fusibles por cable que lleva protección propia
    const fus = new Map();
    const disy = new Map();
    for (const t of resElec.tramos) {
      if (t.tipo === 'senal') continue;
      if (t.tipo === 'ac') {
        // De 230 V: un disyuntor por línea (las dos tomas comparten el del inversor), no un fusible
        disy.set(t.fusible, 1);
        continue;
      }
      const k = `Fusible ${t.fusible} A`;
      fus.set(k, (fus.get(k) || 0) + 1);
    }
    for (const [item, cantidad] of fus) {
      filas.push({ categoria: 'Cables y protecciones', item, cantidad, nota: 'Uno por línea; la caja de fusibles reparte las de 12 V' });
    }
    for (const [amp] of disy) {
      filas.push({ categoria: 'Cables y protecciones', item: `Disyuntor ${amp} A curva B (230 V)`, cantidad: 1, nota: 'A la salida del inversor, antes de las tomas' });
    }
    if (disy.size) {
      filas.push({ categoria: 'Cables y protecciones', item: 'Interruptor diferencial 30 mA (2 polos)', cantidad: 1, nota: 'A la salida del inversor. El técnico confirma el puenteo neutro-tierra' });
    }
    filas.push({ categoria: 'Cables y protecciones', item: 'Corta-baterías general', cantidad: 1, nota: 'Falta en el diseño: confirmar con el técnico dónde va' });
    filas.push({ categoria: 'Cables y protecciones', item: 'Shunt o monitor de batería', cantidad: 1, nota: 'Falta en el diseño: confirmar con el técnico' });
    filas.push({ categoria: 'Cables y protecciones', item: 'Barras de distribución positiva y negativa', cantidad: 2, nota: 'Falta en el diseño: reparten los cables del borne de la batería' });
    filas.push({ categoria: 'Cables y protecciones', item: 'Terminales de ojal y termocontraíbles', cantidad: 1, nota: 'Un surtido para todos los calibres' });
    filas.push({ categoria: 'Cables y protecciones', item: 'Pasacables de goma 20 mm', cantidad: 13, nota: 'Estantes, divisores, tablero, fondo y mamparo' });
    filas.push({ categoria: 'Cables y protecciones', item: 'Manguera de grado alimenticio, abrazaderas y T', cantidad: 1, nota: 'Bidones, bomba y canilla' });
  }
  // Sistema de gas (el anafe y la garrafa figuran en Equipos)
  if (data.equipos.some((e) => e.id === 'garrafa')) {
    filas.push({ categoria: 'Gas', item: 'Manguera flexible de gas certificada con abrazaderas', cantidad: 1, nota: 'Del regulador a la llave de corte, con bucle para el cajón' });
    filas.push({ categoria: 'Gas', item: 'Caño o flexible de acero para el tramo fijo al anafe', cantidad: 1, nota: 'Tramo corto de la llave de corte a la entrada del anafe' });
    filas.push({ categoria: 'Gas', item: 'Sellador de roscas apto para gas', cantidad: 1, nota: '' });
    filas.push({ categoria: 'Gas', item: 'Spray detector de fugas (o agua con jabón)', cantidad: 1, nota: 'Para probar todas las uniones' });
  }
  return filas;
}
