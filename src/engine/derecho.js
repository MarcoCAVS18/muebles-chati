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

  // Pasarruedas derecho: el mueble se apoya sobre él. Bajo 430 mm solo queda libre la franja del frente.
  const aIni = van.archInicio;
  const aFin = van.archInicio + van.archLargo;
  const xA = van.ancho - van.archIntrusion - 5; // cara del pasarruedas con 5 mm de luz
  const yArco = van.archAlto + 5; // cara inferior del piso que apoya sobre el pasarruedas

  ctx.layout.derecho = { xF, zA, zZ, zDiv };

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Panel trasero alto: cierra los cajones y la alacena
  P('Panel trasero alto', xF, 0, zA, de.profundidad, 1250, t);
  // Costado contra la pared derecha
  P('Costado de pared (trasero)', xW - t, 0, zA + t, t, yCaj, aIni - zA - t);
  P('Costado de pared (sobre el pasarruedas)', xW - t, yArco, aIni, t, yCaj - yArco, aFin - aIni);
  P('Costado de pared (delantero)', xW - t, 0, aFin, t, yCaj, zZ - aFin);
  // Costado delantero del módulo de la puerta
  P('Costado delantero', xF + t, 0, zZ - t, de.profundidad - 2 * t, yPue, t);
  // Base y división entre módulos
  // La base llega hasta el pasarruedas; detrás de él solo hay tramos en los extremos
  P('Base', xF + t, de.zocalo, zA + t, xA - xF - t, t, zZ - zA - 2 * t);
  P('Base (tramo trasero, detrás del pasarruedas)', xA, de.zocalo, zA + t, xW - t - xA, t, aIni - zA - t);
  P('Base (tramo delantero, detrás del pasarruedas)', xA, de.zocalo, aFin, xW - t - xA, t, zZ - t - aFin);
  // Piso que apoya sobre el pasarruedas: sostiene los cajones y cierra la franja baja del frente
  P('Piso de los cajones (sobre el pasarruedas)', xF + t, yArco, zA + t, de.profundidad - 2 * t, t, zDiv - zA - t);
  P('División entre módulos (frente)', xF + t, de.zocalo + t, zDiv, xA - xF - t, yArco - de.zocalo - t, t);
  P('División entre módulos', xF + t, yArco, zDiv, de.profundidad - 2 * t, yCaj - yArco - 2 * t, t);
  P('Estante del módulo de la puerta', xF + t, yArco, zDiv + t + t, de.profundidad - 2 * t, t, zZ - zDiv - 3 * t);
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
      { nombre: 'Frente cajón inferior', y0: 455, y1: 640, marcoBajo: 'Frente ciego bajo los cajones (tapa el pasarruedas)' },
      { nombre: 'Frente cajón superior', y0: 655, y1: 840 },
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
  // La caja arranca detrás del panel delantero (15 mm), que va pegado a la cara de atrás del frente
  const fondoCaj = xW - t - (xF + 2 * t);
  cajon(ctx, { grupo: G, nombre: 'Cajón inferior', x: xF + 2 * t, y: 462, z: zCaj, ancho: anchoCaj, alto: 170, fondo: fondoCaj, dir: 'x-' });
  cajon(ctx, { grupo: G, nombre: 'Cajón superior', x: xF + 2 * t, y: 662, z: zCaj, ancho: anchoCaj, alto: 170, fondo: fondoCaj, dir: 'x-' });

  // Panel delantero de cada cajón (ancho completo, delante de los laterales); el frente se atornilla a él desde adentro
  P('Cajón inferior - delantera', xF + t, 462, zCaj, t, 170, anchoCaj);
  P('Cajón superior - delantera', xF + t, 662, zCaj, t, 170, anchoCaj);
  ctx.unir(G, 'directo', 0, 'Delanteras de los cajones atornilladas a los laterales (por la cara de adelante, que queda tapada por el frente)', {
    herraje: 'Tornillo aglomerado 4x40 mm',
    cantidad: 2 * 4,
  });
  ctx.unir(G, 'directo', 0, 'Frentes de los cajones atornillados a su delantera, desde adentro de la caja', {
    herraje: 'Tornillo 4x25 mm (cara contra cara de 15 mm)',
    cantidad: 2 * 4,
  });

  // Alacena sobre los cajones
  const xAl = xW - alt.profundidad;
  const yAl = alt.base;

  // Botones push hacia el pasillo (x-): cajones al centro y puertas cerca del borde libre
  // (se supone que las bisagras quedan del lado del frente del mueble)
  const bt = (nombre, y, z, x = xF) => ctx.boton({ grupo: G, nombre, eje: 'x-', x, y, z });
  const zCajC = (zA + 2 * t + zDiv - t + 2) / 2;
  bt('Frente cajón inferior', (455 + 640) / 2, zCajC);
  bt('Frente cajón superior', (655 + 840) / 2, zCajC);
  bt('Puerta del módulo de la mesa', 735 - 80, zDiv + 2 * t + 5 + 2 + 45);
  bt('Alacena - puerta', yAl + 20 + 60, zDiv - 2 - 45, xAl);
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
  // Los montantes miden 15 mm de ancho: un 4x40 los atraviesa, por eso los marcos llevan tornillos 4x25
  ctx.unir(G, 'directo', 0, 'Marcos de los frentes (cara contra cara de 15 mm)', {
    herraje: 'Tornillo 4x25 mm (cara contra cara de 15 mm)',
    cantidad: Math.ceil((2 * (yCaj - de.zocalo) + 4 * (zDiv - zA)) / 150) + 1,
  });
  ctx.unir(G, 'piso', de.largo + de.profundidad, 'Base del mueble al piso de la van');
  ctx.unir(G, 'pared', yCaj + de.largo, 'Costado de pared a la pared derecha');
  ctx.unir(G, 'pared', 1250, 'Panel trasero alto al cierre trasero');
  ctx.unir(G, 'pared', zDiv - zA, 'Fondo de la alacena a la pared derecha');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L en la base y tornillos al listón del piso', 6, 'Sellar los agujeros');
  ctx.anclaje(G, 'Pared derecha', 'Escuadras L en el costado y en el fondo de la alacena', 6, 'Remache o autoperforante');
  ctx.anclaje(G, 'Cierre trasero', 'Escuadras L en el panel trasero alto', 2, '');

  // Herrajes
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm', 4, 'Puerta del módulo de la mesa x2, puerta de la alacena x2');
  ctx.herrajeBotones(G); // un botón push por frente: reemplaza al tirador y al imán
  ctx.herraje(G, 'Fieltro o goma antivibración 5 mm', 2, 'Entre el piso de los cajones y el estante de la puerta, y el pasarruedas derecho');
}
