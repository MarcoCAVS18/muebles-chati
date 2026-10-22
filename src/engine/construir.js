// Arma los tres muebles a partir de la configuración y valida interferencias.
import { crearContexto } from './contexto.js';
import { trasero } from './trasero.js';
import { cama } from './cama.js';
import { derecho } from './derecho.js';

const solapa = (a, b) => {
  const tol = 0.5;
  return (
    a.x + a.sx > b.x + tol &&
    b.x + b.sx > a.x + tol &&
    a.y + a.sy > b.y + tol &&
    b.y + b.sy > a.y + tol &&
    a.z + a.sz > b.z + tol &&
    b.z + b.sz > a.z + tol
  );
};

export const GRUPOS = ['Mueble trasero', 'Cama', 'Mueble derecho'];

export function construir(cfg) {
  const ctx = crearContexto(cfg);
  const { van } = cfg;
  const [GT, GC, GD] = GRUPOS;

  trasero(ctx, GT);
  cama(ctx, GC);
  derecho(ctx, GD);

  // Pasarruedas como obstáculos
  const arcos = [
    { nombre: 'Pasarruedas izquierdo', x: 0, y: 0, z: van.archInicio, sx: van.archIntrusion, sy: van.archAlto, sz: van.archLargo },
    {
      nombre: 'Pasarruedas derecho',
      x: van.ancho - van.archIntrusion,
      y: 0,
      z: van.archInicio,
      sx: van.archIntrusion,
      sy: van.archAlto,
      sz: van.archLargo,
    },
  ];

  const avisos = [...ctx.avisos];
  const partes = ctx.partes;

  // Límites de la van
  for (const p of partes) {
    if (p.x < -0.5 || p.y < -0.5 || p.z < -0.5 || p.x + p.sx > van.ancho + 0.5 || p.y + p.sy > van.alto + 0.5 || p.z + p.sz > van.largo + 0.5) {
      avisos.push(`${p.id} (${p.nombre}) se sale del interior de la van.`);
    }
  }
  // Con la cama extendida las bandejas salen hacia el pasillo: controlar que no choquen
  for (const p of partes) {
    if (!p.ext) continue;
    const abierta = { ...p, x: p.x + cfg.cama.extension };
    for (const o of partes) {
      if (o.grupo !== p.grupo && solapa(abierta, o)) {
        avisos.push(`Con la cama extendida, ${p.id} (${p.nombre}) choca con ${o.id} (${o.nombre}).`);
      }
    }
    if (abierta.x + abierta.sx > van.ancho + 0.5) avisos.push(`Con la cama extendida, ${p.id} (${p.nombre}) se sale de la van.`);
  }
  // Interferencias entre muebles y con pasarruedas
  const visto = new Set();
  for (let i = 0; i < partes.length; i++) {
    for (let j = i + 1; j < partes.length; j++) {
      const a = partes[i];
      const b = partes[j];
      if (a.grupo !== b.grupo && solapa(a, b)) {
        const k = `${a.grupo}|${b.grupo}`;
        if (!visto.has(k)) {
          visto.add(k);
          avisos.push(`Interferencia entre ${a.grupo} y ${b.grupo}: ${a.id} (${a.nombre}) choca con ${b.id} (${b.nombre}).`);
        }
      }
    }
    for (const arco of arcos) {
      if (solapa(partes[i], arco)) {
        avisos.push(`${partes[i].id} (${partes[i].nombre}) choca con el ${arco.nombre.toLowerCase()}.`);
      }
    }
  }

  return {
    partes,
    decos: ctx.decos,
    layout: ctx.layout,
    uniones: ctx.uniones,
    herrajes: ctx.herrajes,
    equipos: ctx.equipos,
    anclajes: ctx.anclajes,
    arcos,
    avisos,
    grupos: GRUPOS,
  };
}
