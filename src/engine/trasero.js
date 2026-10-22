// Mueble cruzado detrás de los asientos, de pared a pared, con frentes planos y puertas a ras.
// Origen: x = 0 es la pared izquierda, el fondo apoya contra el mamparo (z = largo).
// Las secciones (ver disposicion.js), de izquierda a derecha: E eléctrico, K cocina y W agua.
import { cajon } from './cajon.js';
import { frenteZ } from './frentes.js';
import { disposicionTrasero } from './disposicion.js';

export function trasero(ctx, G) {
  const { cfg, t, tb } = ctx;
  const { trasero: tr, equipos: eq } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zB, zIn, x1, yBase, yPiso, yTapa, d1, d2, sec, hueco, E, K, W, yTopeBajo, yInicioAlto } = L;
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
  P('Divisor eléctrico y cocina', d1, yPiso, zIn, t, altoDiv, largoInt);
  P('Divisor cocina y agua', d2, yPiso, zIn, t, altoDiv, largoInt);

  // Estantes
  P('Estante de los equipos eléctricos', sec.E.x0, E.yEstante, zIn, sec.E.x1 - sec.E.x0, t, largoInt);
  P('Estante bajo el gas (sobre la heladera)', sec.K.x0, K.yEstante, zIn, sec.K.x1 - sec.K.x0, t, largoInt);
  P('Estante sobre los bidones', sec.W.x0, W.yEstante, zIn, sec.W.x1 - sec.W.x0, t, largoInt);

  // Tapas: una por sección, atornilladas desde arriba
  P('Tapa 1 (eléctrico)', 0, yTapa, zF, d1 + t, t, prof);
  P('Tapa 2 (cocina)', d1 + t, yTapa, zF, d2 - d1, t, prof);
  P('Tapa 3 (fregadero)', d2 + t, yTapa, zF, x1 - d2 - t, t, prof);

  // Frentes planos con puertas a ras. Los frentes bajos terminan antes del plano de la cama y los
  // altos empiezan sobre ella: el travesaño del medio es donde se atornilla la cama.
  const f = { grupo: G, zf: zF, ya: yBase, yb: yTapa };
  frenteZ(ctx, {
    ...f,
    xa: sec.E.x0,
    xb: d1,
    hx0: hueco.E.x0,
    hx1: hueco.E.x1,
    marco: 'Frente eléctrico',
    tope: 'Tablero del panel y los enchufes',
    huecos: [
      { nombre: 'Puerta de la batería', y0: yBase, y1: E.yEstante - 3, color: '#ffe082', abre: 'bateria' },
      { nombre: 'Puerta de los equipos eléctricos', y0: E.yEquipos - 2, y1: yTopeBajo, color: '#ffe082', abre: 'inversor' },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: d1,
    xb: d2,
    hx0: hueco.K.x0,
    hx1: hueco.K.x1,
    marco: 'Frente cocina',
    huecos: [
      { nombre: 'Puerta de la heladera', y0: yBase, y1: K.yHeladera + eq.nevera.y + 2, color: '#cfd8dc', abre: 'nevera' },
      { nombre: 'Frente cajón del gas', y0: K.yEstante + 17, y1: 785, color: '#ffcc80', abre: 'garrafa' },
    ],
  });
  frenteZ(ctx, {
    ...f,
    xa: d2,
    xb: x1 - t,
    hx0: hueco.W.x0,
    hx1: hueco.W.x1,
    marco: 'Frente agua',
    huecos: [
      { nombre: 'Frente cajón de bidones', y0: yBase, y1: yTopeBajo, color: '#b3e5fc', abre: 'bidon1' },
      { nombre: 'Frente cajón bajo el fregadero', y0: yInicioAlto, y1: 760 },
    ],
  });

  // Cajones (se tiran hacia la cama o el pasillo)
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón de bidones',
    x: W.xCajon,
    y: W.yCajonBidones,
    z: zIn + 15,
    ancho: W.anchoCajon,
    alto: W.altoCajonBidones,
    fondo: W.fondoCajonBidones,
    dir: 'z-',
    pisoGrueso: true,
    carga: '45 kg o más, dos bidones de 20 L pesan unos 40 kg',
  });
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón bajo el fregadero',
    x: W.xCajon,
    y: W.yCajonFregadero,
    z: zIn + 15,
    ancho: W.anchoCajon,
    alto: W.altoCajonFregadero,
    fondo: W.fondoCajonFregadero,
    dir: 'z-',
  });
  cajon(ctx, {
    grupo: G,
    nombre: 'Cajón de la garrafa',
    x: K.xCajon,
    y: K.yCajonGas,
    z: zIn + 15,
    ancho: K.anchoCajon,
    alto: K.altoCajonGas,
    fondo: K.fondoCajonGas,
    dir: 'z-',
  });

  // Uniones
  ctx.unir(G, 'cola_tornillo', 2 * (tr.alto + prof), 'Costados con base, fondo y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (2 * largoInt + 2 * (tr.alto - yBase)), 'Divisores con base, tapa, fondo y frente');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t) + 6 * (tr.alto - yBase), 'Marcos de los frentes con costados, base y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t), 'Estantes con divisores y costados');
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
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas a ras)', 6, 'Tres puertas, dos bisagras cada una: heladera, batería y equipos eléctricos');
  ctx.herraje(G, 'Tirador embutido', 6, 'Dos cajones del agua, heladera, cajón del gas y dos puertas eléctricas');
  ctx.herraje(G, 'Imán o cierre push para puertas', 3);
  ctx.herraje(G, 'Soporte regulable de estante', 12, 'Estantes del eléctrico, la cocina y el agua');
  ctx.herraje(G, 'Sifón y desagüe para fregadero', 1, 'Con la salida hacia un bidón de aguas grises o al piso');
  ctx.herraje(G, 'Rejilla de ventilación 100 cm2 para el gas', 1, 'Al exterior por el piso, bajo el cajón de la garrafa: el gas pesa más que el aire');
  ctx.herraje(G, 'Detector de monóxido de carbono', 1, 'Con la cocina a gas en un espacio cerrado es obligatorio en la práctica');
  ctx.herraje(G, 'Extintor de polvo ABC de 1 kg', 1, 'Cerca de la puerta, lejos de la cocina');
  ctx.herraje(G, 'Rejilla de ventilación de la heladera', 2, 'Una abajo y una arriba, para el aire del compresor');

  // ---- Equipos que no son eléctricos ----
  const E_ = (e) => ctx.equipo({ grupo: G, ...e });
  const fri = eq.nevera;
  const freg = eq.fregadero;
  const bid = eq.bidon;
  const ana = eq.anafe;
  const gar = eq.garrafa;
  const reg = eq.regulador;
  const val = eq.valvulaGas;
  const det = eq.detectorGas;

  // Agua (derecha)
  E_({
    id: 'fregadero',
    nombre: 'Fregadero',
    x: W.xFregadero,
    y: yTapa - freg.y,
    z: zF + 20,
    sx: freg.x,
    sy: freg.y + t + 3,
    sz: freg.z,
    color: '#b0bec5',
    nota: 'Encastrado en la tapa 3, sección del agua (derecha), arriba de los dos cajones',
  });
  ctx.deco({
    grupo: G,
    nombre: 'Cubeta del fregadero',
    x: W.xFregadero + 15,
    y: tr.alto + 3.1,
    z: zF + 35,
    sx: freg.x - 30,
    sy: 0.8,
    sz: freg.z - 30,
    color: '#90a4ae',
  });
  for (let i = 0; i < 2; i++) {
    E_({
      id: `bidon${i + 1}`,
      nombre: `Bidón de agua ${i + 1} (20 L)`,
      x: W.xCajon + t + 2 + i * (bid.x + 10),
      y: W.yPisoBidones,
      z: zIn + 15 + 5,
      sx: bid.x,
      sy: bid.y,
      sz: bid.z,
      color: '#4fc3f7',
      nota: 'En el cajón que llega hasta el piso, bajo el fregadero',
    });
  }
  E_({
    id: 'bomba',
    nombre: 'Bomba de agua 12 V',
    ...W.bomba,
    color: '#26a69a',
    nota: 'Sobre el estante de los bidones, atrás del cajón bajo el fregadero',
  });
  E_({
    id: 'canilla',
    nombre: 'Canilla',
    x: W.xCanilla,
    y: tr.alto,
    z: zB - 45,
    sx: 30,
    sy: 100,
    sz: 30,
    color: '#cfd8dc',
    nota: 'Sobre la tapa 3, al lado del fregadero',
  });

  // Cocina (centro): heladera abajo, cajón del gas en el medio y anafe arriba
  E_({
    id: 'nevera',
    nombre: 'Heladera de compresor',
    x: K.xHeladera,
    y: K.yHeladera,
    z: zIn + 5,
    sx: fri.x,
    sy: fri.y,
    sz: fri.z,
    color: '#cfd8dc',
    nota: 'Sección de la cocina, abajo del cajón del gas; se abre por la puerta gris',
  });
  E_({
    id: 'anafe',
    nombre: 'Anafe de 2 hornallas',
    x: K.xCentro - ana.x / 2,
    y: K.yAnafe,
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
      x: K.xCentro + dx - 45,
      y: tr.alto + 8.1,
      z: zF + 60 + ana.z / 2 - 45,
      sx: 90,
      sy: 1,
      sz: 90,
      color: '#212121',
    });
  }
  E_({
    id: 'garrafa',
    nombre: 'Garrafa de gas chica (recargable)',
    x: K.xCentro - gar.x / 2,
    y: K.yCajonGas + tb,
    z: zIn + 15 + 10,
    sx: gar.x,
    sy: gar.y,
    sz: gar.z,
    color: '#ef6c00',
    estado: 'A comprar',
    nota: 'Parada dentro del cajón de la cocina, con correa',
  });
  E_({
    id: 'regulador',
    nombre: 'Regulador de gas',
    x: K.xCentro - reg.x / 2,
    y: K.yCajonGas + tb + gar.y,
    z: zIn + 15 + 10 + 80,
    sx: reg.x,
    sy: reg.y,
    sz: reg.z,
    color: '#fdd835',
    estado: 'A comprar',
    nota: 'Sobre la válvula de la garrafa',
  });
  E_({
    id: 'valvulaGas',
    nombre: 'Llave de corte de gas',
    x: sec.K.x1 - 100,
    y: 740,
    z: zF + 380,
    sx: val.x,
    sy: val.y,
    sz: val.z,
    color: '#d84315',
    estado: 'A comprar',
    nota: 'Atrás del anafe, se alcanza sacando el cajón del gas',
  });
  E_({
    id: 'detectorGas',
    nombre: 'Detector de gas (GLP)',
    x: (hueco.E.x1 + hueco.K.x0 - det.x) / 2,
    y: 250,
    z: zF - det.z,
    sx: det.x,
    sy: det.y,
    sz: det.z,
    color: '#eceff1',
    estado: 'A comprar',
    nota: 'En el montante entre el eléctrico y la cocina, cerca del piso: el gas pesa más que el aire',
  });
}
