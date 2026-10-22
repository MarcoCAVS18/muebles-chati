// Mueble cruzado detrás de los asientos, de pared a pared, con frentes planos y puertas a ras.
// Origen: x = 0 es la pared izquierda, el fondo apoya contra el mamparo (z = largo).
// Las secciones (ver disposicion.js): A agua, B guardado, C cocina y D eléctrico.
import { cajon } from './cajon.js';
import { frenteZ } from './frentes.js';
import { disposicionTrasero } from './disposicion.js';

export function trasero(ctx, G) {
  const { cfg, t, tb } = ctx;
  const { trasero: tr, equipos: eq } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zB, zIn, x1, yBase, yPiso, yTapa, dA, d1, d2, sec, hueco, A, C, D, yTopeBajo, yInicioAlto } = L;
  const prof = tr.profundidad;
  const largoInt = prof - t - tb; // profundidad entre el frente y el fondo

  ctx.layout.trasero = L;

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Costados, fondo, base y zócalo
  P('Costado izquierdo', 0, 0, zF, t, tr.alto - t, prof - tb);
  P('Costado derecho', x1 - t, 0, zF, t, tr.alto - t, prof - tb);
  P('Fondo (contra el mamparo)', t, yBase, zB - tb, x1 - 2 * t, tr.alto - t - yBase, tb, 'fondo');
  P('Base', t, yBase, zIn, x1 - 2 * t, t, largoInt);
  P('Zócalo frontal', t, 0, zF, x1 - 2 * t, yBase, t);

  // Divisores entre secciones
  const altoDiv = yTapa - yPiso;
  P('Divisor agua y guardado', dA, yPiso, zIn, t, altoDiv, largoInt);
  P('Divisor guardado y cocina', d1, yPiso, zIn, t, altoDiv, largoInt);
  P('Divisor cocina y eléctrico', d2, yPiso, zIn, t, altoDiv, largoInt);

  // Estantes
  P('Estante sobre los bidones', sec.A.x0, A.yEstante, zIn, sec.A.x1 - sec.A.x0, t, largoInt);
  P('Estante de guardado', sec.B.x0, A.yEstante, zIn, sec.B.x1 - sec.B.x0, t, largoInt);
  P('Estante bajo el gas (sobre la heladera)', sec.C.x0, C.yEstante, zIn, sec.C.x1 - sec.C.x0, t, largoInt);
  P('Estante de los equipos eléctricos', sec.D.x0, D.yEstante, zIn, sec.D.x1 - sec.D.x0, t, largoInt);

  // Tapas
  P('Tapa 1 (fregadero)', 0, yTapa, zF, d1 + t, t, prof);
  P('Tapa 2 (cocina)', d1 + t, yTapa, zF, x1 - d1 - t, t, prof);

  // Frentes planos con puertas a ras. Los frentes bajos terminan antes del plano de la cama y los
  // altos empiezan sobre ella: el travesaño del medio es donde se atornilla la cama.
  const f = { grupo: G, zf: zF, ya: yBase, yb: yTapa };
  frenteZ(ctx, {
    ...f,
    xa: sec.A.x0,
    xb: dA,
    hx0: hueco.A.x0,
    hx1: hueco.A.x1,
    marco: 'Frente agua',
    huecos: [
      { nombre: 'Frente cajón de bidones', y0: yBase, y1: yTopeBajo, color: '#b3e5fc', abre: 'bidon1' },
      { nombre: 'Frente cajón bajo el fregadero', y0: yInicioAlto, y1: 760 },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: dA,
    xb: d1,
    hx0: hueco.B.x0,
    hx1: hueco.B.x1,
    marco: 'Frente guardado',
    huecos: [
      { nombre: 'Puerta de guardado bajo la cama', y0: yBase, y1: yTopeBajo },
      { nombre: 'Puerta de guardado sobre la cama', y0: yInicioAlto, y1: 790 },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: d1,
    xb: d2,
    hx0: hueco.C.x0,
    hx1: hueco.C.x1,
    marco: 'Frente cocina',
    huecos: [
      { nombre: 'Puerta de la heladera', y0: yBase, y1: C.yHeladera + eq.nevera.y + 2, color: '#cfd8dc', abre: 'nevera' },
      { nombre: 'Frente cajón del gas', y0: C.yEstante + 17, y1: 785, color: '#ffcc80', abre: 'garrafa' },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: d2,
    xb: x1 - t,
    hx0: hueco.D.x0,
    hx1: hueco.D.x1,
    marco: 'Frente eléctrico',
    tope: 'Tablero del panel y los enchufes',
    huecos: [
      { nombre: 'Puerta de la batería', y0: yBase, y1: D.yEstante - 3, color: '#ffe082', abre: 'bateria' },
      { nombre: 'Puerta de los equipos eléctricos', y0: D.yEquipos, y1: D.yBordeTablero, color: '#ffe082', abre: 'inversor' },
    ],
  });

  // Cajones (se tiran hacia la cama o el pasillo)
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón de bidones',
    x: A.xCajon,
    y: A.yCajonBidones,
    z: zIn + 15,
    ancho: A.anchoCajon,
    alto: A.altoCajonBidones,
    fondo: A.fondoCajonBidones,
    dir: 'z-',
    pisoGrueso: true,
    carga: '45 kg o más, dos bidones de 20 L pesan unos 40 kg',
  });
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón bajo el fregadero',
    x: A.xCajon,
    y: A.yCajonFregadero,
    z: zIn + 15,
    ancho: A.anchoCajon,
    alto: A.altoCajonFregadero,
    fondo: A.fondoCajonFregadero,
    dir: 'z-',
  });
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón de la garrafa',
    x: C.xCajon,
    y: C.yCajonGas,
    z: zIn + 15,
    ancho: C.anchoCajon,
    alto: C.altoCajonGas,
    fondo: C.fondoCajonGas,
    dir: 'z-',
  });

  // Uniones
  ctx.unir(G, 'cola_tornillo', 2 * (tr.alto + prof), 'Costados con base, fondo y tapas');
  ctx.unir(G, 'cola_tornillo', 3 * (2 * largoInt + 2 * (tr.alto - yBase)), 'Divisores con base, tapa, fondo y frente');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t) + 8 * (tr.alto - yBase), 'Marcos de los frentes con costados, base y tapas');
  ctx.unir(G, 'cola_tornillo', 4 * (d2 - t), 'Estantes con divisores y costados');
  ctx.unir(G, 'cola_tornillo', 2 * x1, 'Tapas con costados y divisores (atornilladas desde arriba)');

  // Fijación a la van
  ctx.unir(G, 'piso', x1 - 2 * t, 'Zócalo y base al piso de la van');
  ctx.unir(G, 'pared', tr.alto + prof, 'Costado izquierdo a la pared izquierda');
  ctx.unir(G, 'pared', tr.alto + prof, 'Costado derecho a la pared derecha');
  ctx.unir(G, 'pared', x1, 'Fondo al mamparo de los asientos (escuadras en la parte alta)');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L a la base y tornillos al listón del piso, con butilo', 8, 'Sellar los agujeros');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L al costado izquierdo', 4, 'Remache o autoperforante');
  ctx.anclaje(G, 'Pared derecha', 'Escuadras L al costado derecho', 4, 'Remache o autoperforante; revisar que no tape la puerta corrediza');
  ctx.anclaje(G, 'Mamparo', 'Escuadras L al fondo, arriba y abajo', 6, 'Dejar el pasacables del eléctrico sin tapar');

  // Herrajes
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas a ras)', 10, 'Guardado x2 puertas, heladera, batería y equipos eléctricos');
  ctx.herraje(G, 'Tirador embutido', 8, 'Dos cajones del agua, dos puertas de guardado, heladera, cajón del gas y dos puertas eléctricas');
  ctx.herraje(G, 'Imán o cierre push para puertas', 6);
  ctx.herraje(G, 'Soporte regulable de estante', 12, 'Estantes de agua, guardado, cocina y eléctrico');
  ctx.herraje(G, 'Sifón y desagüe para fregadero', 1, 'Con la salida hacia un bidón de aguas grises o al piso');
  ctx.herraje(G, 'Rejilla de ventilación 100 cm2 para el gas', 1, 'Al exterior por el piso, bajo el cajón de la garrafa: el gas pesa más que el aire');
  ctx.herraje(G, 'Detector de monóxido de carbono', 1, 'Con la cocina a gas en un espacio cerrado es obligatorio en la práctica');
  ctx.herraje(G, 'Extintor de polvo ABC de 1 kg', 1, 'Cerca de la puerta, lejos de la cocina');
  ctx.herraje(G, 'Rejilla de ventilación de la heladera', 2, 'Una abajo y una arriba, para el aire del compresor');

  // ---- Equipos que no son eléctricos ----
  const E = (e) => ctx.equipo({ grupo: G, ...e });
  const fri = eq.nevera;
  const freg = eq.fregadero;
  const bid = eq.bidon;
  const ana = eq.anafe;
  const gar = eq.garrafa;
  const reg = eq.regulador;
  const val = eq.valvulaGas;
  const det = eq.detectorGas;

  // Agua
  E({
    id: 'fregadero',
    nombre: 'Fregadero',
    x: 40,
    y: yTapa - freg.y,
    z: zF + 20,
    sx: freg.x,
    sy: freg.y + t + 3,
    sz: freg.z,
    color: '#b0bec5',
    nota: 'Encastrado en la tapa 1, sección del agua, arriba de los dos cajones',
  });
  ctx.deco({
    grupo: G,
    nombre: 'Cubeta del fregadero',
    x: 55,
    y: tr.alto + 3.1,
    z: zF + 35,
    sx: freg.x - 30,
    sy: 0.8,
    sz: freg.z - 30,
    color: '#90a4ae',
  });
  for (let i = 0; i < 2; i++) {
    E({
      id: `bidon${i + 1}`,
      nombre: `Bidón de agua ${i + 1} (20 L)`,
      x: A.xCajon + t + 2 + i * (bid.x + 10),
      y: A.yPisoBidones,
      z: zIn + 15 + 5,
      sx: bid.x,
      sy: bid.y,
      sz: bid.z,
      color: '#4fc3f7',
      nota: 'En el cajón que llega hasta el piso, bajo el fregadero',
    });
  }
  E({
    id: 'bomba',
    nombre: 'Bomba de agua 12 V',
    x: 250,
    y: A.yEstante + t + 2,
    z: zF + 345,
    sx: 120,
    sy: 80,
    sz: 70,
    color: '#26a69a',
    nota: 'Sobre el estante de los bidones, atrás del cajón bajo el fregadero',
  });
  E({
    id: 'canilla',
    nombre: 'Canilla',
    x: 435,
    y: tr.alto,
    z: zB - 45,
    sx: 30,
    sy: 100,
    sz: 30,
    color: '#cfd8dc',
    nota: 'Sobre la tapa 1, al lado del fregadero',
  });

  // Cocina: heladera abajo, cajón del gas en el medio y anafe arriba
  E({
    id: 'nevera',
    nombre: 'Heladera de compresor',
    x: C.xHeladera,
    y: C.yHeladera,
    z: zIn + 5,
    sx: fri.x,
    sy: fri.y,
    sz: fri.z,
    color: '#cfd8dc',
    nota: 'Sección de la cocina, abajo del cajón del gas; se abre por la puerta gris',
  });
  E({
    id: 'anafe',
    nombre: 'Anafe de 2 hornallas',
    x: C.xCentro - ana.x / 2,
    y: C.yAnafe,
    z: zF + 60,
    sx: ana.x,
    sy: ana.y + 8,
    sz: ana.z,
    color: '#78909c',
    estado: 'Confirmar medidas',
    nota: 'Empotrado en la tapa 2, sección de la cocina',
  });
  for (const dx of [-100, 100]) {
    ctx.deco({
      grupo: G,
      nombre: 'Hornalla',
      x: C.xCentro + dx - 45,
      y: tr.alto + 8.1,
      z: zF + 60 + ana.z / 2 - 45,
      sx: 90,
      sy: 1,
      sz: 90,
      color: '#212121',
    });
  }
  E({
    id: 'garrafa',
    nombre: 'Garrafa de gas chica (recargable)',
    x: C.xCentro - gar.x / 2,
    y: C.yCajonGas + tb,
    z: zIn + 15 + 10,
    sx: gar.x,
    sy: gar.y,
    sz: gar.z,
    color: '#ef6c00',
    estado: 'A comprar',
    nota: 'Parada dentro del cajón de la cocina, con correa',
  });
  E({
    id: 'regulador',
    nombre: 'Regulador de gas',
    x: C.xCentro - reg.x / 2,
    y: C.yCajonGas + tb + gar.y,
    z: zIn + 15 + 10 + 80,
    sx: reg.x,
    sy: reg.y,
    sz: reg.z,
    color: '#fdd835',
    estado: 'A comprar',
    nota: 'Sobre la válvula de la garrafa',
  });
  E({
    id: 'valvulaGas',
    nombre: 'Llave de corte de gas',
    x: sec.C.x1 - 100,
    y: 740,
    z: zF + 380,
    sx: val.x,
    sy: val.y,
    sz: val.z,
    color: '#d84315',
    estado: 'A comprar',
    nota: 'Atrás del anafe, se alcanza sacando el cajón del gas',
  });
  E({
    id: 'detectorGas',
    nombre: 'Detector de gas (GLP)',
    x: sec.C.x1 - 12,
    y: 250,
    z: zF - det.z,
    sx: det.x,
    sy: det.y,
    sz: det.z,
    color: '#eceff1',
    estado: 'A comprar',
    nota: 'En el frente, cerca del piso: el gas pesa más que el aire',
  });
}
