// Cama de plataforma ranurada, pegada a la pared izquierda y a la cabecera (mueble trasero).
// Dos placas con ranuras, caja con arco al pie y dos cajones que se tiran hacia el pasillo.
import { cajon } from './cajon.js';

export function cama(ctx, G) {
  const { cfg, t } = ctx;
  const { van, cama: ca, trasero: tr } = cfg;

  const x0 = ca.x0;
  const x1 = ca.x0 + ca.ancho; // borde hacia el pasillo
  const zCab = van.largo - tr.profundidad; // frente del mueble trasero
  const zPie = zCab - ca.largo; // extremo trasero de la cama
  const yT = ca.plataforma; // cara superior
  const yB = yT - t; // cara inferior de las placas
  const zCentro = zCab - ca.largoCabecera; // división entre placas
  const L = ca.ancho;

  ctx.layout.cama = { x0, x1, zPie, zCab, yT, zCentro };

  const P = (nombre, x, y, z, sx, sy, sz, extra = {}) => ctx.parte({ grupo: G, nombre, x, y, z, sx, sy, sz, ...extra });
  const LST = (nombre, x, y, z, sx, sy, sz, mat) => ctx.parte({ grupo: G, nombre, tipo: 'liston', mat, x, y, z, sx, sy, sz });

  // Placas de la plataforma
  const holgura = 1.5; // mitad de la luz entre placas
  P('Placa de la cabecera', x0, yB, zCentro + holgura, L, t, zCab - zCentro - holgura);
  P('Placa del pie', x0, yB, zPie, L, t, zCentro - zPie - holgura);

  // Ranuras (visual): 6 en la cabecera y 5 en el pie
  const ranuras = (zIni, zFin, n, nombre) => {
    const paso = (zFin - zIni) / n;
    for (let i = 0; i < n; i++) {
      ctx.deco({
        grupo: G,
        nombre: `${nombre} ${i + 1}`,
        x: x0 + 60,
        y: yT - 0.4,
        z: zIni + paso * i + paso * 0.35,
        sx: L - 120,
        sy: 0.8,
        sz: 22,
      });
    }
  };
  ranuras(zCentro + 40, zCab - 40, 6, 'Ranura cabecera');
  ranuras(zPie + 40, zCentro - 40, 5, 'Ranura pie');
  ctx.herraje(G, 'Broca de pala o fresa para ranuras 22 mm', 1, 'Ranuras de ventilación: se hacen con caladora o fresadora');

  // Caja del pie con la abertura en arco (visto desde la puerta trasera)
  const aX0 = 390;
  const aX1 = 730;
  const aY0 = 60;
  const radio = (aX1 - aX0) / 2;
  const aCy = yB - 15 - radio; // centro del arco: deja 15 mm hasta la placa
  P('Frente del pie - izquierdo', x0, 0, zPie, aX0 - x0, yB, t);
  P('Frente del pie - derecho', aX1, 0, zPie, x1 - aX1, yB, t);
  P('Frente del pie - bajo la abertura', aX0, 0, zPie, aX1 - aX0, aY0, t);
  P('Frente del pie - sobre la abertura (calar arco)', aX0, aCy, zPie, aX1 - aX0, yB - aCy, t);
  ctx.deco({ grupo: G, nombre: 'Arco de la abertura', forma: 'arco', cx: (aX0 + aX1) / 2, cy: aCy, z: zPie - 0.6, radio, sz: 0.8 });
  ctx.herraje(G, 'Plantilla de arco R' + radio + ' mm', 1, 'Marcar el arco en la pieza sobre la abertura y calar con caladora');
  const zInt = zPie + 385; // fondo de la caja
  P('Lateral izquierdo de la caja del pie', x0, 0, zPie + t, t, yB, zInt - zPie - t);
  P('Lateral derecho de la caja del pie', x1 - t, 0, zPie + t, t, yB, zInt - zPie - t);
  P('Panel interior de la caja del pie', x0 + t, 0, zInt - t, L - 2 * t, yB, t);

  // Panel central: divide las placas y es guía de un cajón
  const zPanel = zCentro - t / 2;
  P('Panel central de apoyo', x0, 0, zPanel, L, yB, t);

  // Cajones bajo la cama, se tiran hacia el pasillo (x+)
  const yCaj = 20;
  const frente = (nombre, x, y, z, sz, sy) => P(nombre, x, y, z, t, sy, sz);

  const A = ca.cajonA;
  const xA = 235;
  cajon(ctx, { grupo: G, nombre: 'Cajón A', x: xA, y: yCaj, z: A.z, ancho: A.ancho, alto: A.alto, fondo: x1 - t - xA, dir: 'x+' });
  frente('Frente cajón A', x1 - t, yCaj - 5, A.z - 2, A.ancho + 4, A.alto + 10);
  P('Guía cajón A (trasera)', xA, 10, A.z - t, x1 - t - xA, 240, t);
  P('Guía cajón A (delantera)', xA, 10, A.z + A.ancho, x1 - t - xA, 240, t);

  const B = ca.cajonB;
  const zB = zInt + t + t;
  cajon(ctx, { grupo: G, nombre: 'Cajón B', x: x1 - t - B.fondo, y: yCaj, z: zB, ancho: B.ancho, alto: B.alto, fondo: B.fondo, dir: 'x+' });
  frente('Frente cajón B', x1 - t, yCaj - 5, zB - 2, B.ancho + 4, B.alto + 10);
  P('Guía cajón B (trasera)', x1 - t - B.fondo, 10, zB - t, B.fondo, 240, t);
  if (zB + B.ancho > zPanel - 2) ctx.aviso('El cajón B toca el panel central de la cama: reducir su ancho.');

  // Apoyos de las placas: listones laterales y travesaño que esquiva el pasarruedas
  const arcoFin = van.archInicio + van.archLargo;
  LST('Listón de apoyo derecho - cabecera', x1 - 30, yB - 30, zCentro + t / 2 + holgura, 30, 30, zCab - zCentro - t / 2 - holgura - 30, 'l30x30');
  LST('Listón de apoyo derecho - pie', x1 - 30, yB - 30, zInt, 30, 30, zPanel - zInt, 'l30x30');
  LST('Travesaño detrás del pasarruedas', x0, yB - 30, arcoFin + 10, L - 30, 30, 30, 'l30x30');

  // Escuadras al mueble trasero (dos tramos, esquivando las puertas)
  LST('Listón de unión a la cabecera - izquierdo', x0, yB - 30, zCab - 30, 95, 30, 30, 'l30x30');
  LST('Listón de unión a la cabecera - derecho', 615, yB - 30, zCab - 30, x1 - 615, 30, 30, 'l30x30');

  // Uniones
  ctx.unir(G, 'cola_tornillo', 2 * L, 'Placas con panel central, listones y caja del pie');
  ctx.unir(G, 'cola_tornillo', 2 * (yB + L), 'Caja del pie: frentes, laterales y panel interior');
  ctx.unir(G, 'directo', 0, 'Placas atornilladas desde arriba a los apoyos (se pueden levantar)', {
    herraje: 'Tornillo avellanado 4x40 mm (placas de la cama)',
    cantidad: 24,
  });
  ctx.unir(G, 'directo', 0, 'Listones de unión al frente del mueble trasero', {
    herraje: 'Tornillo aglomerado 4x50 mm (cama al mueble trasero)',
    cantidad: 8,
  });
  ctx.unir(G, 'piso', 2 * L, 'Frente del pie y panel central al piso de la van');
  ctx.unir(G, 'pared', ca.largo, 'Caja del pie y apoyos contra la pared izquierda');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L en el frente del pie y en el panel central', 4, 'Sellar los agujeros');
  ctx.anclaje(G, 'Mueble trasero', 'Listones de unión atornillados al frente del mueble', 2, 'Evitar las puertas F1 y F2b');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L en la caja del pie', 2, 'Remache o autoperforante');

  // Herrajes
  ctx.herraje(G, 'Tirador embutido o de cinta', 2, 'Frentes de los cajones');
  ctx.herraje(G, 'Fieltro o goma antivibración 20 mm', 1, 'Entre la placa y el pasarruedas, 1 m');
}
