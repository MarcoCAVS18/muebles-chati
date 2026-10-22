// Mueble cruzado detrás de los asientos, como en la foto: 3 secciones con frentes a ras
// y 2 tapas. Origen: x = 0 es la pared izquierda, el fondo apoya contra el mamparo (z = largo).
import { cajon } from './cajon.js';
import { frenteZ } from './frentes.js';

export function trasero(ctx, G) {
  const { cfg, t, tb } = ctx;
  const { van, trasero: tr, equipos: eq } = cfg;

  const zF = van.largo - tr.profundidad; // cara delantera (hacia la cama)
  const zB = van.largo; // mamparo
  const x1 = tr.ancho;
  const yBase = tr.zocalo; // arriba del zócalo
  const yTapa = tr.alto - t; // cara inferior de la tapa
  const d1 = tr.divisor1;
  const d2 = tr.divisor2;

  ctx.layout.trasero = { zF, zB, x1, yBase, yTapa, d1, d2, t };

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Costados, fondo y base
  P('Costado izquierdo', 0, 0, zF, t, tr.alto - t, tr.profundidad - tb);
  P('Costado derecho', x1 - t, 0, zF, t, tr.alto - t, tr.profundidad - tb);
  P('Fondo (contra el mamparo)', t, yBase, zB - tb, x1 - 2 * t, tr.alto - t - yBase, tb, 'fondo');
  P('Base', t, yBase, zF + t, x1 - 2 * t, t, tr.profundidad - t - tb);
  P('Zócalo frontal', t, 0, zF, x1 - 2 * t, yBase, t);

  // Divisores entre secciones
  P('Divisor sección 1 y 2', d1, yBase + t, zF + t, t, yTapa - yBase - t, tr.profundidad - t - tb);
  P('Divisor sección 2 y 3', d2, yBase + t, zF + t, t, yTapa - yBase - t, tr.profundidad - t - tb);

  // Estantes interiores
  // Sección 1: piso de la zona eléctrica (debajo de la heladera)
  const yEstE = 370;
  P('Estante bajo la heladera', t, yEstE, zF + t, d1 - t, t, tr.profundidad - t - tb);
  // Sección 2: estante intermedio (sobre los bidones)
  const yEstB = 480;
  P('Estante sobre los bidones', d1 + t, yEstB, zF + t, d2 - d1 - t, t, tr.profundidad - t - tb);
  // Sección 3: estante bajo el cajón
  const yEstC = 630;
  P('Estante sección 3', d2 + t, yEstC, zF + t, x1 - t - d2 - t, t, tr.profundidad - t - tb);

  // Tapas
  P('Tapa 1 (fregadero)', 0, yTapa, zF, d1 + t / 2, t, tr.profundidad);
  P('Tapa 2', d1 + t / 2, yTapa, zF, x1 - d1 - t / 2, t, tr.profundidad);

  // Frentes planos con puertas a ras (la posición de cada hueco sale de la foto)
  const f = { grupo: G, zf: zF, ya: yBase, yb: yTapa };
  frenteZ(ctx, {
    ...f,
    xa: t,
    xb: d1,
    hx0: 110,
    hx1: 610,
    marco: 'Frente sección 1',
    huecos: [{ nombre: 'Puerta F1 (heladera)', y0: 460, y1: 740 }],
  });
  frenteZ(ctx, {
    ...f,
    xa: d1,
    xb: d2,
    hx0: 780,
    hx1: 950,
    marco: 'Frente sección 2',
    huecos: [
      { nombre: 'Puerta F2b (bidones)', y0: 120, y1: 450 },
      { nombre: 'Puerta F2 (guardado)', y0: 470, y1: 800 },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: d2,
    xb: x1 - t,
    hx0: 1000,
    hx1: 1350,
    marco: 'Frente sección 3',
    huecos: [
      { nombre: 'Puerta F3', y0: 120, y1: 620 },
      { nombre: 'Frente del cajón F3', y0: 640, y1: 800 },
    ],
  });

  // Cajón chico de la sección 3 (se tira hacia la cama)
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón sección 3',
    x: 1010,
    y: 645,
    z: zF + t + 15,
    ancho: 330,
    alto: 140,
    fondo: 330,
    dir: 'z-',
  });

  // Uniones
  const prof = tr.profundidad;
  ctx.unir(G, 'cola_tornillo', 2 * (tr.alto + prof), 'Costados con base, fondo y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (prof - t) + 2 * (tr.alto - yBase), 'Divisores con base, tapa, fondo y frente');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t) + 4 * (tr.alto - yBase), 'Marcos del frente con costados, base y tapas');
  ctx.unir(G, 'cola_tornillo', 3 * (d2 - t), 'Estantes con divisores y costados');
  ctx.unir(G, 'cola_tornillo', 2 * x1, 'Tapas con costados y divisores (atornilladas desde arriba)');

  // Fijación a la van
  ctx.unir(G, 'piso', x1 - 2 * t, 'Zócalo y base al piso de la van');
  ctx.unir(G, 'pared', tr.alto + prof, 'Costado izquierdo a la pared izquierda');
  ctx.unir(G, 'pared', x1, 'Fondo al mamparo de los asientos (escuadras en la parte alta)');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L a la base y tornillos al listón del piso, con butilo', 6, 'Sellar los agujeros');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L al costado izquierdo', 4, 'Remache o autoperforante');
  ctx.anclaje(G, 'Mamparo', 'Escuadras L al fondo, arriba y abajo', 4, 'Dejar el pasacable del eléctrico sin tapar');

  // Herrajes
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas a ras)', 8, 'F1 x2, F2 x2, F2b x2, F3 x2');
  ctx.herraje(G, 'Tirador embutido', 5, 'F1, F2, F2b, F3 y el cajón');
  ctx.herraje(G, 'Imán o cierre push para puertas', 4);
  ctx.herraje(G, 'Soporte regulable de estante', 8, 'Estantes de las secciones 2 y 3');

  // Equipos que no son eléctricos
  const fri = eq.nevera;
  const freg = eq.fregadero;
  const bid = eq.bidon;
  ctx.equipo({
    id: 'nevera',
    nombre: 'Heladera de compresor',
    grupo: G,
    x: 40,
    y: yEstE + t + 5,
    z: zF + t + 5,
    sx: fri.x,
    sy: fri.y,
    sz: fri.z,
    color: '#cfd8dc',
    nota: 'Debajo del fregadero, se abre por la puerta F1',
  });
  ctx.equipo({
    id: 'fregadero',
    nombre: 'Fregadero',
    grupo: G,
    x: 140,
    y: yTapa - freg.y,
    z: zF + 40,
    sx: freg.x,
    sy: freg.y,
    sz: freg.z,
    color: '#b0bec5',
    nota: 'Encastrado en la tapa 1, sección izquierda',
  });
  // Abertura del fregadero en la tapa 1 (solo visual; se calar con caladora)
  ctx.deco({
    grupo: G,
    nombre: 'Abertura del fregadero',
    x: 140,
    y: tr.alto - 0.4,
    z: zF + 40,
    sx: freg.x,
    sy: 0.8,
    sz: freg.z,
  });
  ctx.herraje(G, 'Sifón y desagüe para fregadero', 1, 'Con la salida hacia el bidón de aguas grises o al piso');
  for (let i = 0; i < 2; i++) {
    ctx.equipo({
      id: `bidon${i + 1}`,
      nombre: `Bidón de agua ${i + 1}`,
      grupo: G,
      x: d1 + t + 22,
      y: yBase + t + 5,
      z: zF + t + 8 + i * (bid.z + 6),
      sx: bid.x,
      sy: bid.y,
      sz: bid.z,
      color: '#4fc3f7',
      nota: 'Sección inferior central',
    });
  }
  ctx.equipo({
    id: 'bomba',
    nombre: 'Bomba de agua 12 V',
    grupo: G,
    x: d1 + t + 60,
    y: yEstB + t + 2,
    z: zF + t + 40,
    sx: 120,
    sy: 80,
    sz: 70,
    color: '#26a69a',
    nota: 'Estante de la sección central, se alcanza por la puerta F2',
  });
  ctx.equipo({
    id: 'canilla',
    nombre: 'Canilla',
    grupo: G,
    x: 550,
    y: tr.alto,
    z: zB - 45,
    sx: 30,
    sy: 100,
    sz: 30,
    color: '#cfd8dc',
    nota: 'Sobre la tapa 1, al lado del fregadero',
  });
}
