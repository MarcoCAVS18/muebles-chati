// Caja de un cajón (sin el frente). dir indica hacia dónde se tira: 'x+', 'x-', 'z+', 'z-'.
// x, y, z: esquina mínima de la caja. ancho: medida transversal. fondo: profundidad en el eje de tirada.
// pisoGrueso: piso de 15 mm (cajones que cargan peso). carga: texto con la carga de las correderas.
// fino: laterales, trasera y piso de la placa intermedia (12 mm) en lugar de la de estructura y la de fondos.

export function cajon(ctx, { grupo, nombre, x, y, z, ancho, alto, fondo, dir, pisoGrueso = false, fino = false, carga = '' }) {
  const { t, tb, tm } = ctx;
  const tl = fino ? tm : t; // grosor de los laterales y de la trasera
  const mat = fino ? 'medio' : 'estructura';
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

  caja('lateral', 0, fondo, 0, tl, 0, alto, mat);
  caja('lateral', 0, fondo, ancho - tl, tl, 0, alto, mat);
  caja('trasera', 0, tl, tl, ancho - 2 * tl, 0, alto, mat);
  if (pisoGrueso) caja('piso del cajón (15 mm)', tl, fondo - tl, tl, ancho - 2 * tl, 0, t);
  else if (fino) caja('piso del cajón', tl, fondo - tl, tl, ancho - 2 * tl, 0, tm, 'medio');
  else caja('piso del cajón', tl, fondo - tl, tl, ancho - 2 * tl, 0, tb, 'fondo');

  const largoCorredera = Math.floor(fondo / 50) * 50;
  ctx.herraje(grupo, carga ? `Par de correderas de carga ${largoCorredera} mm (${carga})` : `Par de correderas telescópicas ${largoCorredera} mm`, 1, nombre);
}
