// Mueble derecho de la foto: módulo de cajones (atrás), módulo con puerta bajo la mesa,
// alacena arriba de los cajones y mesa plegable que se abre hacia la cama.
import { cajon } from './cajon.js';
import { frenteX } from './frentes.js';

export function derecho(ctx, G) {
  const { cfg, t, tb } = ctx;
  const { van, derecho: de, mesa } = cfg;

  const xF = van.ancho - de.profundidad; // frente hacia el pasillo
  const xW = van.ancho; // pared derecha
  const zA = van.margenTrasero; // extremo trasero
  const zZ = zA + de.largo; // extremo delantero
  const zDiv = zA + de.largoCajones; // división entre módulos
  const yCaj = de.altoCajones;
  const yPue = de.altoPuerta;
  const alt = de.alacena;

  ctx.layout.derecho = { xF, zA, zZ, zDiv };

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Panel trasero alto: cierra los cajones y la alacena
  P('Panel trasero alto', xF, 0, zA, de.profundidad, 1250, t);
  // Costado contra la pared derecha
  P('Costado de pared', xW - t, 0, zA + t, t, yCaj, zZ - zA - t);
  // Costado delantero del módulo de la puerta
  P('Costado delantero', xF + t, 0, zZ - t, de.profundidad - 2 * t, yPue, t);
  // Base y división entre módulos
  P('Base', xF + t, de.zocalo, zA + t, de.profundidad - 2 * t, t, zZ - zA - 2 * t);
  P('División entre módulos', xF + t, de.zocalo + t, zDiv, de.profundidad - 2 * t, yCaj - de.zocalo - 2 * t, t);
  P('Estante del módulo de la puerta', xF + t, 400, zDiv + t + t, de.profundidad - 2 * t, t, zZ - zDiv - 3 * t);
  // Mesadas
  P('Mesada de cajones', xF, yCaj - t, zA + t, de.profundidad, t, zDiv - zA - t);
  P('Tapa del módulo de la mesa', xF, yPue - t, zDiv + t, de.profundidad, t, zZ - zDiv - t);

  // Frente de cajones (módulo trasero)
  frenteX(ctx, {
    grupo: G,
    xf: xF,
    za: zA + t,
    zb: zDiv + t,
    ya: de.zocalo,
    yb: yCaj - t,
    hz0: zA + 2 * t,
    hz1: zDiv - t + 2,
    marco: 'Frente de cajones',
    huecos: [
      { nombre: 'Frente cajón inferior', y0: 100, y1: 540 },
      { nombre: 'Frente cajón superior', y0: 560, y1: 820 },
    ],
  });
  // Frente de la puerta (módulo de la mesa)
  frenteX(ctx, {
    grupo: G,
    xf: xF,
    za: zDiv + t,
    zb: zZ,
    ya: de.zocalo,
    yb: yPue - t,
    hz0: zDiv + 2 * t + 5,
    hz1: zZ - t,
    marco: 'Frente del módulo de la mesa',
    huecos: [{ nombre: 'Puerta del módulo de la mesa', y0: 100, y1: 735 }],
  });

  // Cajones, se tiran hacia el pasillo (x-)
  const zCaj = zA + t + 13;
  const anchoCaj = zDiv - zA - t - 26;
  const fondoCaj = xW - t - (xF + t) - 5;
  cajon(ctx, { grupo: G, nombre: 'Cajón inferior', x: xF + t + 5, y: 110, z: zCaj, ancho: anchoCaj, alto: 380, fondo: fondoCaj, dir: 'x-' });
  cajon(ctx, { grupo: G, nombre: 'Cajón superior', x: xF + t + 5, y: 580, z: zCaj, ancho: anchoCaj, alto: 220, fondo: fondoCaj, dir: 'x-' });

  // Alacena sobre los cajones
  const xAl = xW - alt.profundidad;
  const yAl = alt.base;
  P('Alacena - fondo', xW - tb, yAl + t, zA + t, tb, alt.alto - 2 * t, zDiv - zA - t, 'fondo');
  P('Alacena - base', xAl, yAl, zA + t, alt.profundidad - tb, t, zDiv - zA - t);
  P('Alacena - tapa', xAl, yAl + alt.alto - t, zA + t, alt.profundidad - tb, t, zDiv - zA - t);
  P('Alacena - lateral delantero', xAl + t, yAl + t, zDiv - t, alt.profundidad - t - tb, alt.alto - 2 * t, t);
  P('Alacena - puerta', xAl, yAl + 20, zA + t + 2, t, alt.alto - 40, zDiv - zA - t - 4);
  P('Alacena - estante', xAl + t, yAl + alt.alto / 2, zA + t, alt.profundidad - t - tb, t, zDiv - zA - 2 * t);

  // Mesa plegable: se abre hacia el centro y queda al nivel de la tapa del módulo
  const xMesa = xF - mesa.ancho;
  P('Tapa de la mesa plegable', xMesa, yPue - t, zDiv + t + 10, mesa.ancho, t, zZ - zDiv - t - 20);
  ctx.herraje(G, 'Bisagra de piano 1000 mm (mesa)', 1, 'Entre la mesa y el frente del módulo');
  ctx.herraje(G, 'Soporte plegable para mesa (par)', 1, 'Brazos que sostienen la tapa abierta');
  ctx.herraje(G, 'Pasador o cierre para mesa plegada', 1);

  // Uniones
  ctx.unir(G, 'cola_tornillo', 2 * (yCaj + de.largo), 'Costados, panel trasero, bases y división');
  ctx.unir(G, 'cola_tornillo', 2 * (zDiv - zA) + 2 * (zZ - zDiv), 'Mesadas con costados y división');
  ctx.unir(G, 'cola_tornillo', 2 * (alt.alto + alt.profundidad) + 2 * (zDiv - zA), 'Alacena: tapa, base, fondo y lateral');
  ctx.unir(G, 'cola_tornillo', 2 * (yCaj - de.zocalo) + 4 * (zDiv - zA), 'Marcos de los frentes');
  ctx.unir(G, 'piso', de.largo + de.profundidad, 'Base del mueble al piso de la van');
  ctx.unir(G, 'pared', yCaj + de.largo, 'Costado de pared a la pared derecha');
  ctx.unir(G, 'pared', 1250, 'Panel trasero alto al cierre trasero');
  ctx.unir(G, 'pared', zDiv - zA, 'Fondo de la alacena a la pared derecha');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L en la base y tornillos al listón del piso', 6, 'Sellar los agujeros');
  ctx.anclaje(G, 'Pared derecha', 'Escuadras L en el costado y en el fondo de la alacena', 6, 'Remache o autoperforante');
  ctx.anclaje(G, 'Cierre trasero', 'Escuadras L en el panel trasero alto', 2, '');

  // Herrajes
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm', 4, 'Puerta del módulo de la mesa x2, puerta de la alacena x2');
  ctx.herraje(G, 'Tirador embutido', 4, 'Puerta, alacena y los dos cajones');
  ctx.herraje(G, 'Imán o cierre push', 2);
}
