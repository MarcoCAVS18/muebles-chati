// Mueble cruzado detrás de los asientos, de pared a pared, con frentes planos y puertas a ras.
// Origen: x = 0 es la pared izquierda, el fondo apoya contra el mamparo (z = largo).
// Las secciones (ver disposicion.js), de izquierda a derecha: E eléctrico (la L, más profunda),
// K cocina y W agua.
import { cajon } from './cajon.js';
import { frenteZ } from './frentes.js';
import { disposicionTrasero } from './disposicion.js';

export function trasero(ctx, G) {
  const { cfg, t, tb } = ctx;
  const { trasero: tr, equipos: eq } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zFL, zB, zIn, zFondo, x1, yBase, yPiso, yTapa, d1, d2, sec, hueco, E, K, W } = L;
  const prof = tr.profundidad;
  const profL = zB - zFL;
  const largoInt = prof - t - tb; // profundidad interior de la cocina y el agua
  const largoIntE = profL - t - tb; // profundidad interior de la sección eléctrica

  ctx.layout.trasero = L;

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Costados, fondo, base y zócalo
  P('Costado izquierdo', 0, 0, zFL, t, tr.alto - t, profL - tb);
  P('Costado derecho', x1 - t, 0, zF, t, tr.alto - t, prof - tb);
  P('Fondo (contra el mamparo)', t, yBase, zB - tb, x1 - 2 * t, tr.alto - t - yBase, tb, 'fondo');
  P('Base (eléctrico)', t, yBase, L.E.zIn, d1 + t - t, t, largoIntE);
  P('Base (cocina y agua)', d1 + t, yBase, zIn, x1 - t - (d1 + t), t, largoInt);
  P('Zócalo frontal (eléctrico)', t, 0, zFL, d1 + t - t, yBase, t);
  P('Zócalo frontal (cocina y agua)', d1 + t, 0, zF, x1 - t - (d1 + t), yBase, t);

  // Divisores entre secciones: el primero sigue la L y queda a la vista como escalón
  const altoDiv = yTapa - yPiso;
  P('Divisor eléctrico y cocina (escalón de la L)', d1, yPiso, E.zIn, t, altoDiv, largoIntE);
  P('Divisor cocina y agua', d2, yPiso, zIn, t, altoDiv, largoInt);

  // Estantes
  P('Estante de los cajones de cocina (cierra el eléctrico)', sec.E.x0, E.yEstante, E.zIn, sec.E.x1 - sec.E.x0, t, largoIntE);
  P('Estante bajo el gas (sobre la heladera)', sec.K.x0, K.yEstante, zIn, sec.K.x1 - sec.K.x0, t, largoInt);
  P('Estante sobre los bidones', sec.W.x0, W.yEstante, zIn, sec.W.x1 - sec.W.x0, t, largoInt);

  // Tapas: una por sección, atornilladas desde arriba
  P('Tapa 1 (eléctrico)', 0, yTapa, zFL, d1 + t, t, profL);
  P('Tapa 2 (cocina)', d1 + t, yTapa, zF, d2 - d1, t, prof);
  P('Tapa 3 (fregadero)', d2 + t, yTapa, zF, x1 - d2 - t, t, prof);

  // Frentes planos con puertas a ras. En la sección eléctrica los frentes bajos terminan antes del plano
  // de la cama y el tablero cubre desde ahí: el travesaño del medio es donde se atornilla la cama.
  const yTopeE = L.yTopeBajo;
  frenteZ(ctx, {
    grupo: G,
    zf: zFL,
    ya: yBase,
    yb: yTapa,
    xa: sec.E.x0,
    xb: d1,
    hx0: hueco.E.x0,
    hx1: hueco.E.x1,
    marco: 'Frente eléctrico',
    tope: 'Frente de los cajones de cocina - travesaño superior',
    huecos: [
      { nombre: 'Puerta de la batería y los equipos', y0: yBase, y1: yTopeE, color: '#ffe082', abre: 'bateria', marcoBajo: 'Frente eléctrico - travesaño' },
      ...E.cajones.map((c, i) => ({
        nombre: `Frente ${c.nombre.toLowerCase()}`,
        y0: c.y0,
        y1: c.y1,
        marcoBajo: i === 0 ? 'Tablero del panel y los enchufes' : 'Frente eléctrico - travesaño',
      })),
    ],
  });
  const f = { grupo: G, zf: zF, ya: yBase, yb: yTapa };
  frenteZ(ctx, {
    ...f,
    xa: d1 + t,
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
      { nombre: 'Frente cajón de bidones', y0: yBase, y1: W.yEstante - 3, color: '#b3e5fc', abre: 'bidon1' },
      { nombre: 'Frente cajón bajo el fregadero', y0: W.yCajonFregadero, y1: 760 },
    ],
  });

  // Cajones (se tiran hacia la cama o el pasillo)
  for (const c of E.cajones) {
    cajon(ctx, {
      grupo: G,
      nombre: c.nombre,
      x: hueco.E.x0 + 13,
      y: c.y0 + 5,
      z: E.zIn + 15,
      ancho: hueco.E.x1 - hueco.E.x0 - 26,
      alto: c.y1 - c.y0 - 25,
      fondo: Math.min(560, Math.floor((zFondo - (E.zIn + 15) - 15) / 50) * 50), // correderas de 500 mm cuando la L mide 570 mm
      dir: 'z-',
    });
  }
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

  // Botones push en cada frente. Las puertas llevan el botón cerca del borde libre (se supone que las bisagras
  // quedan a la izquierda de cada puerta), los cajones lo llevan al centro.
  const bt = (nombre, x, y, z) => ctx.boton({ grupo: G, nombre, eje: 'z-', x, y, z });
  const centro = (h) => (h.x0 + h.x1) / 2;
  bt('Puerta de la batería y los equipos', hueco.E.x1 - 2 - 45, yTopeE - 2 - 70, zFL);
  for (const c of E.cajones) bt(`Frente ${c.nombre.toLowerCase()}`, centro(hueco.E), (c.y0 + c.y1) / 2, zFL);
  const yPuertaHel = K.yHeladera + eq.nevera.y + 2; // borde alto de la puerta de la heladera
  bt('Puerta de la heladera', hueco.K.x1 - 2 - 45, yPuertaHel - 70, zF);
  bt('Frente cajón del gas', centro(hueco.K), 785 - 45, zF);
  bt('Frente cajón de bidones', centro(hueco.W), W.yEstante - 3 - 60, zF);
  bt('Frente cajón bajo el fregadero', centro(hueco.W), (W.yCajonFregadero + 760) / 2, zF);

  // Uniones
  ctx.unir(G, 'cola_tornillo', tr.alto + prof + tr.alto + profL, 'Costados con base, fondo y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (largoInt + largoIntE) + 4 * (tr.alto - yBase), 'Divisores con base, tapa, fondo y frente');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t) + 6 * (tr.alto - yBase), 'Marcos de los frentes con costados, base y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (x1 - 2 * t), 'Estantes con divisores y costados');
  ctx.unir(G, 'cola_tornillo', 2 * x1, 'Tapas con costados y divisores (atornilladas desde arriba)');

  // Fijación a la van
  ctx.unir(G, 'piso', x1 - 2 * t, 'Zócalo y base al piso de la van');
  ctx.unir(G, 'pared', tr.alto + profL, 'Costado izquierdo a la pared izquierda');
  ctx.unir(G, 'pared', tr.alto + prof, 'Costado derecho a la pared derecha');
  ctx.unir(G, 'pared', x1, 'Fondo al mamparo de los asientos (escuadras en la parte alta)');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L a la base y tornillos al listón del piso, con butilo', 8, 'Sellar los agujeros');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L al costado izquierdo', 4, 'Remache o autoperforante');
  ctx.anclaje(G, 'Pared derecha', 'Escuadras L al costado derecho', 4, 'Remache o autoperforante; revisar que no tape la puerta corrediza');
  ctx.anclaje(G, 'Mamparo', 'Escuadras L al fondo, arriba y abajo', 6, 'Dejar el pasacables del eléctrico sin tapar');

  // Herrajes
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas a ras)', 5, 'Puerta de la heladera (2) y puerta de la batería y los equipos, que es ancha (3)');
  ctx.herrajeBotones(G); // un botón push por frente: reemplaza al tirador y al imán
  ctx.herraje(G, 'Soporte regulable de estante', 12, 'Estantes del eléctrico, la cocina y el agua');
  ctx.herraje(G, 'Sifón y desagüe para fregadero', 1, 'Con la salida hacia un bidón de aguas grises o al piso');
  ctx.herraje(G, 'Rejilla de ventilación 100 cm2 para el gas', 1, 'Al exterior por el piso, bajo el cajón de la garrafa: el gas pesa más que el aire');
  ctx.herraje(G, 'Detector de monóxido de carbono', 1, 'Con la cocina a gas en un espacio cerrado es obligatorio en la práctica');
  ctx.herraje(G, 'Extintor de polvo ABC de 1 kg', 1, 'Cerca de la puerta, lejos de la cocina');
  ctx.herraje(G, 'Rejilla de ventilación de la heladera', 2, 'Una abajo y una arriba, para el aire del compresor');
  ctx.herraje(G, 'Rejilla de ventilación para el inversor y el DC-DC', 2, 'En la puerta de la batería y los equipos: se calientan con carga');

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
