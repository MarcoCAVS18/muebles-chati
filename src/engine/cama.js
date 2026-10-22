// Cama de listones con dos cajones traseros (se abren hacia la puerta del baúl).
import { cajon } from './cajon.js';

export function cama(ctx, p) {
  const { grupo, bx0, bz0, ancho: BW, largo: BL, base: Y, marco: M, separacion, largoCajon, altoCajon } = p;
  const { t, tb } = ctx;
  const l45 = 45;

  // Marco
  ctx.parte({ grupo, nombre: 'Larguero', x: bx0, y: Y, z: bz0, sx: t, sy: M, sz: BL });
  ctx.parte({ grupo, nombre: 'Larguero', x: bx0 + BW - t, y: Y, z: bz0, sx: t, sy: M, sz: BL });
  ctx.parte({ grupo, nombre: 'Cabecera', x: bx0 + t, y: Y, z: bz0, sx: BW - 2 * t, sy: M, sz: t });
  ctx.parte({ grupo, nombre: 'Piecera', x: bx0 + t, y: Y, z: bz0 + BL - t, sx: BW - 2 * t, sy: M, sz: t });

  const ySlat = Y + M - 20;
  // Listones de apoyo (soportan los travesaños)
  for (const x of [bx0 + t, bx0 + BW - t - 30]) {
    ctx.parte({
      grupo,
      nombre: 'Listón de apoyo',
      tipo: 'liston',
      mat: 'l30x30',
      x,
      y: ySlat - 30,
      z: bz0 + t,
      sx: 30,
      sy: 30,
      sz: BL - 2 * t,
    });
  }

  // Travesaños de listones 45x20
  const util = BL - 2 * t;
  const nT = Math.max(2, Math.floor((util + separacion) / (l45 + separacion)));
  const paso = (util - l45) / (nT - 1);
  for (let i = 0; i < nT; i++) {
    ctx.parte({
      grupo,
      nombre: 'Travesaño',
      tipo: 'liston',
      mat: 'l45x20',
      x: bx0 + t,
      y: ySlat,
      z: bz0 + t + i * paso,
      sx: BW - 2 * t,
      sy: 20,
      sz: l45,
    });
  }

  // Garaje con dos cajones
  const Dd = largoCajon;
  const gar = t + 5 + Dd + 5 + tb;
  const abertura = (BW - 3 * t) / 2;
  const xGuia = [bx0, bx0 + BW / 2 - t / 2, bx0 + BW - t];
  for (const x of xGuia) {
    ctx.parte({ grupo, nombre: 'Panel guía del garaje', x, y: 0, z: bz0, sx: t, sy: Y, sz: gar - tb });
  }
  ctx.parte({
    grupo,
    nombre: 'Trasera del garaje',
    mat: 'fondo',
    x: bx0 + t,
    y: 0,
    z: bz0 + gar - tb,
    sx: BW - 2 * t,
    sy: Y,
    sz: tb,
  });

  for (let k = 0; k < 2; k++) {
    const xIni = bx0 + t + k * (abertura + t);
    ctx.parte({
      grupo,
      nombre: `Frente de cajón ${k + 1}`,
      x: xIni + 2,
      y: 25,
      z: bz0,
      sx: abertura - 4,
      sy: altoCajon + 20,
      sz: t,
    });
    cajon(ctx, {
      grupo,
      nombre: `Cajón ${k + 1} (cama)`,
      x: xIni + 13,
      y: 30,
      z: bz0 + t + 5,
      ancho: abertura - 26,
      alto: altoCajon,
      fondo: Dd,
      dir: 'z-',
    });
    ctx.herraje(grupo, 'Tirador', 1, `Cajón ${k + 1} (cama)`);
  }

  // Patas de listón 45x45
  const zPatas = [bz0 + gar, bz0 + gar + (BL - gar - l45) / 2, bz0 + BL - l45];
  for (const z of zPatas) {
    for (const x of [bx0, bx0 + BW - l45]) {
      ctx.parte({
        grupo,
        nombre: 'Pata',
        tipo: 'liston',
        mat: 'l45x45',
        x,
        y: 0,
        z,
        sx: l45,
        sy: Y,
        sz: l45,
      });
    }
  }

  // Uniones y anclajes
  ctx.unir(grupo, 'cola_tornillo', 4 * M, 'Marco: largueros con cabecera y piecera');
  ctx.unir(grupo, 'cola_tornillo', 2 * (BL - 2 * t), 'Listones de apoyo al marco');
  ctx.unir(grupo, 'directo', 0, 'Travesaños a los listones de apoyo', {
    cantidad: nT * 4,
    herraje: 'Tornillo 4x35 mm (travesaños)',
  });
  ctx.unir(grupo, 'cola_tornillo', 3 * (gar - tb) + 2 * Y, 'Paneles guía del garaje');
  ctx.unir(grupo, 'directo', 0, 'Patas al marco', { cantidad: 6 * 3, herraje: 'Tornillo 5x60 mm (patas al marco)' });
  ctx.anclaje(
    grupo,
    'Patas - piso',
    'Atornillar cada pata con una escuadra al listón del piso (5x50 mm).',
    6,
    'Las patas del lado derecho quedan cerca del pasarruedas: verificar interferencia'
  );
  ctx.anclaje(
    grupo,
    'Paneles guía - piso',
    'Tornillos 5x50 mm hacia los listones del piso, cada 250 mm.',
    Math.ceil((3 * (gar - tb)) / 250) + 2,
    ''
  );
  ctx.anclaje(
    grupo,
    'Larguero izquierdo - mueble izquierdo',
    'Dos escuadras 40x40 uniendo el larguero con el lateral del mueble izquierdo.',
    2,
    'Evita que la cama se mueva al frenar'
  );
}

export function mesa(ctx, p) {
  const { grupo, x0, z0, ancho, largo, altura } = p;
  const e = 15;
  // x0: borde de la cara frontal del mueble derecho; la mesa se despliega hacia -x
  ctx.parte({
    grupo,
    nombre: 'Tablero de mesa plegable',
    x: x0 - ancho,
    y: altura,
    z: z0,
    sx: ancho,
    sy: e,
    sz: largo,
  });
  ctx.parte({
    grupo,
    nombre: 'Pata de mesa',
    tipo: 'liston',
    mat: 'l45x45',
    x: x0 - ancho,
    y: 0,
    z: z0 + largo / 2 - 22,
    sx: 45,
    sy: altura,
    sz: 45,
  });
  ctx.herraje(grupo, 'Bisagra de piano 500 mm (mesa)', 1);
  ctx.herraje(grupo, 'Bisagra para pata plegable', 1);
  ctx.herraje(grupo, 'Pasador o imán para sostener la mesa plegada', 2);
  ctx.anclaje(
    grupo,
    'Mesa - mueble derecho',
    'Bisagra de piano al canto del mueble derecho con tornillos 4x25 mm. Dejar la pata apoyando en el piso.',
    1,
    'La pata tiene que apoyar sobre un listón del piso'
  );
}
