// Arma los tres muebles a partir de la configuración y valida interferencias.
import { crearContexto } from './contexto.js';
import { mueble, alacena } from './mueble.js';
import { cama, mesa } from './cama.js';

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

export function construir(cfg) {
  const ctx = crearContexto(cfg);
  const { van, izquierdo: iz, derecho: de, cama: ca, mesa: me } = cfg;
  const GI = 'Mueble izquierdo';
  const GC = 'Cama';
  const GD = 'Mueble derecho';

  mueble(ctx, {
    grupo: GI,
    lado: 'izq',
    x0: 0,
    z0: van.margenTrasero,
    profundidad: iz.profundidad,
    largo: iz.largo,
    alto: iz.alto,
    zocalo: iz.zocalo,
    bahias: [
      { tipo: 'nevera', largo: iz.nevera.largo },
      { tipo: 'cajones', largo: iz.cajones.largo, n: iz.cajones.n },
      { tipo: 'electrico' },
    ],
  });

  const bz0 = van.largo - ca.largo;
  cama(ctx, {
    grupo: GC,
    bx0: iz.profundidad + ca.holguraMueble,
    bz0,
    ancho: ca.ancho,
    largo: ca.largo,
    base: ca.base,
    marco: ca.marco,
    separacion: ca.separacion,
    largoCajon: ca.largoCajon,
    altoCajon: ca.altoCajon,
  });

  const xDer = van.ancho - de.profundidad;
  mueble(ctx, {
    grupo: GD,
    lado: 'der',
    x0: xDer,
    z0: van.margenTrasero,
    profundidad: de.profundidad,
    largo: de.largo,
    alto: de.alto,
    zocalo: de.zocalo,
    bahias: [{ tipo: 'pileta' }],
  });
  const yAlacena = de.alto + de.alacena.separacion;
  alacena(ctx, {
    grupo: GD,
    lado: 'der',
    x0: van.ancho - de.alacena.profundidad,
    z0: van.margenTrasero,
    profundidad: de.alacena.profundidad,
    largo: de.largo,
    y0: yAlacena,
    alto: van.alto - 20 - yAlacena,
  });
  mesa(ctx, {
    grupo: GD,
    x0: xDer,
    z0: van.margenTrasero + 20,
    ancho: me.ancho,
    largo: me.largo,
    altura: me.altura,
  });

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
    uniones: ctx.uniones,
    herrajes: ctx.herrajes,
    equipos: ctx.equipos,
    anclajes: ctx.anclajes,
    arcos,
    avisos,
    grupos: [GI, GC, GD],
  };
}
