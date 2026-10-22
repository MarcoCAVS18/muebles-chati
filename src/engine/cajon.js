// Caja de un cajón (sin el frente). dir indica hacia dónde se tira: 'x+', 'x-', 'z+', 'z-'.
// x, y, z: esquina mínima de la caja. ancho: medida transversal. fondo: profundidad en el eje de tirada.
// pisoGrueso: piso de 15 mm (cajones que cargan peso). carga: texto con la carga de las correderas.

export function cajon(ctx, { grupo, nombre, x, y, z, ancho, alto, fondo, dir, pisoGrueso = false, carga = '' }) {
  const { t, tb } = ctx;
  const eje = dir[0];
  const signo = dir[1];

  // dl: desplazamiento desde el fondo del cajón; sd: tamaño en profundidad
  // wl: desplazamiento transversal; sw: tamaño transversal; hl: altura local; sh: alto
  const caja = (nom, dl, sd, wl, sw, hl, sh, mat = 'estructura') => {
    const pd = signo === '+' ? dl : fondo - dl - sd;
    const d =
      eje === 'x'
        ? { x: x + pd, sx: sd, z: z + wl, sz: sw }
        : { z: z + pd, sz: sd, x: x + wl, sx: sw };
    ctx.parte({
      grupo,
      nombre: `${nombre} - ${nom}`,
      mat,
      x: d.x,
      y: y + hl,
      z: d.z,
      sx: d.sx,
      sy: sh,
      sz: d.sz,
    });
  };

  caja('lateral', 0, fondo, 0, t, 0, alto);
  caja('lateral', 0, fondo, ancho - t, t, 0, alto);
  caja('trasera', 0, t, t, ancho - 2 * t, 0, alto);
  if (pisoGrueso) caja('piso del cajón (15 mm)', t, fondo - t, t, ancho - 2 * t, 0, t);
  else caja('piso del cajón', t, fondo - t, t, ancho - 2 * t, 0, tb, 'fondo');

  ctx.unir(grupo, 'cajon', 2 * alto + 2 * (ancho + fondo), `Caja ${nombre}`);
  const largoCorredera = Math.floor(fondo / 50) * 50;
  ctx.herraje(grupo, carga ? `Par de correderas de carga ${largoCorredera} mm (${carga})` : `Par de correderas telescópicas ${largoCorredera} mm`, 1, nombre);
}
