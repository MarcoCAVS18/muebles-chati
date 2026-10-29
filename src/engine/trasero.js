// Mueble cruzado detrás de los asientos, de pared a pared, con frentes planos y puertas a ras.
// Origen: x = 0 es la pared izquierda, el fondo apoya contra el mamparo (z = largo).
// Las secciones (ver disposicion.js), de izquierda a derecha: E eléctrico (la L, más profunda, con la
// heladera arriba), K cocina (angosta, con la garrafa fija detrás de una puerta) y W agua.
// Los equipos eléctricos se alcanzan por una puerta en el costado izquierdo (la que se ve al abrir la puerta lateral
// de la van), no por debajo de la cama: el frente de la sección eléctrica queda cerrado, contra la tapa de la cama.
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

  // Los bornes de la batería necesitan lugar para el cable entre ella y el estante que cierra el compartimento
  const aireBornes = E.yEstante - (E.bateria.y + E.bateria.sy);
  if (aireBornes < 55) {
    ctx.aviso(`La batería queda a ${Math.round(aireBornes)} mm del estante del compartimento eléctrico: faltan ${Math.round(55 - aireBornes)} mm para los cables de los bornes.`);
  }
  // La garrafa entra por el hueco de su puerta, sin rozar los montantes
  if (eq.garrafa.x + 6 > K.puerta.x1 - K.puerta.x0) {
    ctx.aviso(`La garrafa (${eq.garrafa.x} mm) no pasa por el hueco de su puerta (${Math.round(K.puerta.x1 - K.puerta.x0)} mm): la puerta arranca después del borde de la cama.`);
  }

  const P = (nombre, x, y, z, sx, sy, sz, mat = 'estructura') => ctx.parte({ grupo: G, nombre, mat, x, y, z, sx, sy, sz });

  // Costados, fondo, base y zócalo
  // El costado izquierdo lleva calada la puerta del compartimento eléctrico (la puerta es la pieza que sale del calado)
  const pl = E.puertaLateral;
  ctx.parte({
    grupo: G,
    nombre: 'Costado izquierdo',
    mat: 'estructura',
    x: 0,
    y: 0,
    z: zFL,
    sx: t,
    sy: tr.alto - t,
    sz: profL - tb,
    huecos: [{ tipo: 'puerta', a0: pl.y0, a1: pl.y1, b0: pl.z0 - zFL, b1: pl.z1 - zFL, r: 6 }],
  });
  P('Costado derecho', x1 - t, 0, zF, t, tr.alto - t, prof - tb);
  // El fondo va en dos mitades, una por módulo (el mueble se arma en dos módulos que se unen adentro de la van)
  P('Fondo eléctrico (contra el mamparo)', t, yBase, zB - tb, d1, tr.alto - t - yBase, tb, 'fondo');
  P('Base (eléctrico)', t, yBase, L.E.zIn, d1 + t - t, t, largoIntE);
  // La base de la cocina lleva calado el asiento circular de la garrafa: apoya en el piso a través del círculo
  {
    const xb = d1 + t;
    ctx.parte({
      grupo: G,
      nombre: 'Base (cocina y agua)',
      mat: 'estructura',
      x: xb,
      y: yBase,
      z: zIn,
      sx: x1 - t - xb,
      sy: t,
      sz: largoInt,
      huecos: [{ tipo: 'asiento', a0: K.asiento.cx - K.asiento.r - xb, a1: K.asiento.cx + K.asiento.r - xb, b0: K.asiento.cz - K.asiento.r - zIn, b1: K.asiento.cz + K.asiento.r - zIn, r: K.asiento.r }],
    });
  }
  P('Zócalo frontal (eléctrico)', t, 0, zFL, d1 + t - t, yBase, t);
  P('Zócalo frontal (cocina y agua)', d1 + t, 0, zF, x1 - t - (d1 + t), yBase, t);

  // Divisores entre secciones: el primero sigue la L y queda a la vista como escalón
  const altoDiv = yTapa - yPiso;
  P('Divisor eléctrico y cocina (escalón de la L)', d1, yPiso, E.zIn, t, altoDiv, largoIntE);
  P('Divisor cocina y agua', d2, yPiso, zIn, t, altoDiv, largoInt);

  // Estantes
  P('Estante que cierra el compartimento eléctrico', sec.E.x0, E.yEstante, E.zIn, sec.E.x1 - sec.E.x0, t, largoIntE);
  // El estante de la heladera empieza 10 mm antes que ella: delante queda libre para que bajen los cables del tablero
  P('Estante de la heladera', sec.E.x0, E.yEstanteNevera, E.zNevera - 10, sec.E.x1 - sec.E.x0, t, largoIntE - (E.zNevera - 10 - E.zIn));
  P('Estante sobre la garrafa (bajo los cajones de cocina)', sec.K.x0, K.yEstante, zIn, sec.K.x1 - sec.K.x0, t, largoInt);
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
    tope: 'Frente de la heladera - travesaño superior',
    huecos: [
      // Frente fijo: los equipos se alcanzan por la puerta del costado izquierdo
      { nombre: 'Frente fijo del eléctrico (tapa de los equipos)', y0: yBase, y1: yTopeE, marcoBajo: 'Frente eléctrico - travesaño' },
      // Frente fijo de la heladera, con rejillas: la heladera se abre por arriba. Se saca con tornillos para llegar al compresor.
      { nombre: 'Frente fijo de la heladera (con rejillas)', y0: E.yTableroFin, y1: yTapa - 25, color: '#cfd8dc', abre: 'nevera', marcoBajo: 'Tablero del panel y los enchufes' },
    ],
  });
  const f = { grupo: G, zf: zF, ya: yBase, yb: yTapa };
  // Puerta de la garrafa: sube hasta el estante y arranca después del borde de la cama, con la bisagra a la derecha
  frenteZ(ctx, {
    ...f,
    yb: K.yCajIni,
    xa: d1 + t,
    xb: d2,
    hx0: K.puerta.x0,
    hx1: K.puerta.x1,
    marco: 'Frente cocina (garrafa)',
    tope: 'Frente cocina (garrafa) - travesaño',
    huecos: [{ nombre: 'Puerta de la garrafa (bisagra a la derecha)', y0: yBase, y1: K.yEstante - 3, color: '#ffcc80', abre: 'garrafa' }],
  });
  frenteZ(ctx, {
    ...f,
    ya: K.yCajIni,
    xa: d1 + t,
    xb: d2,
    hx0: hueco.K.x0,
    hx1: hueco.K.x1,
    marco: 'Frente cocina',
    huecos: K.cajones.map((c) => ({ nombre: `Frente ${c.nombre.toLowerCase()}`, y0: c.y0, y1: c.y1 })),
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

  // Cajones (se tiran hacia el pasillo)
  for (const c of K.cajones) {
    cajon(ctx, {
      grupo: G,
      nombre: c.nombre,
      x: K.xCajon,
      y: c.y0 + 5,
      z: zIn + 15,
      ancho: K.anchoCajon,
      alto: c.y1 - c.y0 - 25,
      fondo: K.fondoCajonCocina, // cortos: atrás quedan libres la llave de corte y el caño del gas
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

  // Lo que sigue se agrega al final para no mover los ids de las demás piezas.
  // Segunda mitad del fondo (cocina y agua), contra el mamparo
  P('Fondo cocina y agua (contra el mamparo)', d1 + t, yBase, zB - tb, x1 - t - (d1 + t), tr.alto - t - yBase, tb, 'fondo');
  // Apoyos bajo las bases: la base queda a yBase del piso, y sin apoyo se pandea con la carga de los bidones y la batería.
  // Son tiras de canto (de recorte de la hoja de 15 mm) en el sentido del ancho: adelante, al medio y atrás. Cruzan los
  // listones del piso, que van a lo largo de la van, y ahí se atornillan.
  const apoyos = (sufijo, x, sx, zIni) => {
    const zAtras = zFondo - t;
    for (const [lugar, z] of [
      ['adelante', zIni],
      ['al medio', (zIni + zAtras) / 2],
      ['atrás', zAtras],
    ]) {
      P(`Apoyo bajo la base, ${lugar} (${sufijo})`, x, 0, z, sx, yBase, t);
    }
  };
  apoyos('eléctrico', t, d1, E.zIn);
  apoyos('cocina y agua', d1 + t, x1 - t - (d1 + t), zIn);
  ctx.unir(G, 'directo', 0, 'Apoyos bajo las bases pegados y atornillados desde arriba (un tornillo cada 150 mm)', {
    herraje: 'Tornillo 3,5x30 mm (cajones)',
    cantidad: 3 * Math.ceil(d1 / 150) + 3 * Math.ceil((x1 - 2 * t - d1) / 150),
  });
  // Panel delantero de cada cajón: la caja arranca 15 mm detrás del frente (zIn + 15) justamente para que entre este panel.
  // Va delante de los laterales, ancho completo; el frente (que cierra a ras del marco) se atornilla a él desde adentro.
  const delantera = (nombre, x, y, ancho, alto) => P(`${nombre} - delantera`, x, y, zIn, ancho, alto, t);
  for (const c of K.cajones) delantera(c.nombre, K.xCajon, c.y0 + 5, K.anchoCajon, c.y1 - c.y0 - 25);
  delantera('Cajón de bidones', W.xCajon, W.yCajonBidones, W.anchoCajon, W.altoCajonBidones);
  delantera('Cajón bajo el fregadero', W.xCajon, W.yCajonFregadero, W.anchoCajon, W.altoCajonFregadero);
  // Puerta del costado izquierdo: es la pieza que sale del calado del costado, con 2 mm de luz. Se ve al abrir la puerta lateral
  // de la van y deja a la vista la batería y todos los equipos. Abre hacia afuera, con la bisagra del lado del mamparo.
  {
    const luz = 2;
    ctx.parte({
      grupo: G,
      nombre: 'Puerta lateral del compartimento eléctrico',
      mat: 'estructura',
      x: 0,
      y: pl.y0 + luz,
      z: pl.z0 + luz,
      sx: t,
      sy: pl.y1 - pl.y0 - 2 * luz,
      sz: pl.z1 - pl.z0 - 2 * luz,
      color: '#ffe082',
      abre: 'bateria',
      lado: -1,
    });
    ctx.boton({ grupo: G, nombre: 'Puerta lateral del compartimento eléctrico', eje: 'x-', x: 0, y: (pl.y0 + pl.y1) / 2, z: pl.z0 + luz + 45 });
  }
  ctx.unir(G, 'directo', 0, 'Delanteras de los cajones atornilladas a los laterales (por la cara de adelante, que queda tapada por el frente)', {
    herraje: 'Tornillo aglomerado 4x40 mm',
    cantidad: 4 * 4,
  });
  ctx.unir(G, 'directo', 0, 'Frentes de los cajones atornillados a su delantera, desde adentro de la caja', {
    herraje: 'Tornillo 4x25 mm (cara contra cara de 15 mm)',
    cantidad: 4 * 4,
  });

  // Los dos módulos se arman afuera y se unen adentro de la van, contra la cara derecha del divisor 1.
  // El módulo de la cocina y el agua no tiene pared izquierda: la pared es el divisor del módulo eléctrico.
  ctx.unir(G, 'directo', 0, 'Unión de los dos módulos: desde el compartimento eléctrico, a través del divisor 1, al montante izquierdo de la cocina', {
    herraje: 'Tornillo 4x25 mm (unión de los dos módulos)',
    cantidad: 3,
  });
  ctx.unir(G, 'directo', 0, 'Dos escuadras L bajo la tapa 2, contra la cara del divisor 1, para que el borde izquierdo de la tapa no quede colgado', {
    herraje: 'Escuadra L 40x40 mm (pared)',
    cantidad: 2,
  });
  ctx.unir(G, 'directo', 0, 'Tornillos cortos de esas escuadras: no pueden pasar los 15 mm de la tapa ni del divisor', {
    herraje: 'Tornillo 3,5x12 mm (escuadras de unión)',
    cantidad: 8,
  });

  // Botones push en cada frente. Las puertas llevan el botón cerca del borde libre (la bisagra queda del lado contrario),
  // los cajones lo llevan al centro.
  const bt = (nombre, x, y, z) => ctx.boton({ grupo: G, nombre, eje: 'z-', x, y, z });
  const centro = (h) => (h.x0 + h.x1) / 2;
  // La puerta de la garrafa tiene la bisagra a la derecha: el botón va cerca del borde izquierdo
  bt('Puerta de la garrafa (bisagra a la derecha)', K.puerta.x0 + 2 + 45, K.yEstante - 3 - 60, zF);
  for (const c of K.cajones) bt(`Frente ${c.nombre.toLowerCase()}`, centro(hueco.K), (c.y0 + c.y1) / 2, zF);
  bt('Frente cajón de bidones', centro(hueco.W), W.yEstante - 3 - 60, zF);
  bt('Frente cajón bajo el fregadero', centro(hueco.W), (W.yCajonFregadero + 760) / 2, zF);

  // Uniones
  ctx.unir(G, 'cola_tornillo', tr.alto + prof + tr.alto + profL, 'Costados con base, fondo y tapas');
  ctx.unir(G, 'cola_tornillo', 2 * (largoInt + largoIntE) + 4 * (tr.alto - yBase), 'Divisores con base, tapa, fondo y frente');
  // Los montantes miden 15 mm de ancho: un 4x40 los atraviesa, por eso los marcos llevan tornillos 4x25
  ctx.unir(G, 'directo', 0, 'Marcos de los frentes con costados, base y tapas (cara contra cara de 15 mm)', {
    herraje: 'Tornillo 4x25 mm (cara contra cara de 15 mm)',
    cantidad: Math.ceil((2 * (x1 - 2 * t) + 6 * (tr.alto - yBase)) / 150) + 1,
  });
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
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas a ras)', 4, 'Dos en la puerta de la garrafa (bisagra a la derecha) y dos en la puerta lateral del compartimento eléctrico');
  ctx.herrajeBotones(G); // un botón push por frente: reemplaza al tirador y al imán
  ctx.herraje(G, 'Soporte regulable de estante', 16, 'Estantes del eléctrico (2), la cocina y el agua');
  ctx.herraje(G, 'Sifón y desagüe para fregadero', 1, 'Con la salida hacia un bidón de aguas grises o al piso');
  ctx.herraje(G, 'Rejilla de ventilación 100 cm2 para el gas', 1, 'Al exterior por el piso, justo bajo el círculo del asiento de la garrafa: el gas pesa más que el aire');
  ctx.herraje(G, 'Detector de monóxido de carbono', 1, 'Con la cocina a gas en un espacio cerrado es obligatorio en la práctica');
  ctx.herraje(G, 'Extintor de polvo ABC de 1 kg', 1, 'Cerca de la puerta, lejos de la cocina');
  ctx.herraje(G, 'Rejilla de ventilación de la heladera', 2, 'Una abajo y una arriba del frente fijo, para el aire del compresor');
  ctx.herraje(G, 'Rejilla de ventilación para el inversor y el DC-DC', 2, 'En la puerta lateral del compartimento eléctrico: se calientan con carga');

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
  // El bidón 1 es el de agua limpia (atrás, cerca de la bomba) y el 2 el de aguas grises (adelante)
  const papeles = [
    { nombre: 'Bidón de agua limpia (20 L, plano)', color: '#4fc3f7', nota: 'Atrás en el cajón de bidones, girado: la boca y la canilla miran a la pared derecha' },
    { nombre: 'Bidón de aguas grises (20 L, plano)', color: '#a1887f', nota: 'Adelante en el cajón de bidones, girado: recibe el desagüe del fregadero' },
  ];
  W.bidones.forEach((b, i) => {
    E_({
      id: `bidon${i + 1}`,
      nombre: papeles[i].nombre,
      x: b.x,
      y: b.y,
      z: b.z,
      sx: b.sx,
      sy: b.sy,
      sz: b.sz,
      color: papeles[i].color,
      estado: 'A comprar: plano con canilla de 416 x 203 x 408 mm (Camping4u o Scandihills). Medirlo al llegar',
      nota: papeles[i].nota,
    });
  });
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

  // Heladera (izquierda, arriba del eléctrico): de tapa arriba, con la tapa a ras de la mesada (sobresale 3 mm como el fregadero)
  E_({
    id: 'nevera',
    nombre: 'Heladera de compresor (Alpicool G22, 25 L)',
    x: E.xNevera,
    y: E.yNevera,
    z: E.zNevera,
    sx: fri.x,
    sy: fri.y + 3,
    sz: fri.z,
    color: '#cfd8dc',
    estado: 'A comprar: Alpicool G22 de 25 L (unas 2 000 kr)',
    nota: 'Sección eléctrica, arriba, apoyada en su estante; se abre por un corte de la tapa 1',
  });

  // Cocina (centro): anafe arriba, dos cajones de cocina y la garrafa fija al piso, detrás de una puerta
  const zAna = zF + (prof - ana.z) / 2; // el anafe queda centrado en el fondo del mueble
  E_({
    id: 'anafe',
    nombre: 'Anafe de 2 hornallas',
    x: K.xCentro - ana.x / 2,
    y: K.yAnafe,
    z: zAna,
    sx: ana.x,
    sy: ana.y + 8,
    sz: ana.z,
    color: '#78909c',
    estado: 'Confirmar medidas',
    nota: 'Empotrado en la tapa 2, sección de la cocina',
  });
  for (const dz of [-100, 100]) {
    ctx.deco({
      grupo: G,
      nombre: 'Hornalla',
      x: K.xCentro - 45,
      y: tr.alto + 8.1,
      z: zAna + ana.z / 2 + dz - 45,
      sx: 90,
      sy: 1,
      sz: 90,
      color: '#212121',
    });
  }
  E_({
    id: 'garrafa',
    nombre: 'Garrafa de gas chica (recargable)',
    x: K.xGar - gar.x / 2,
    y: K.yAsiento,
    z: K.zGar,
    sx: gar.x,
    sy: gar.y,
    sz: gar.z,
    color: '#ef6c00',
    estado: 'A comprar',
    nota: 'Parada y fija dentro del armario, apoyada en el piso a través del círculo de la base, con correa',
  });
  E_({
    id: 'regulador',
    nombre: 'Regulador de gas',
    x: K.xGar - reg.x / 2,
    y: K.yAsiento + gar.y,
    z: K.zGar + 80,
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
    y: K.yAnafe - val.y - 15,
    z: zFondo - 20 - val.z,
    sx: val.x,
    sy: val.y,
    sz: val.z,
    color: '#d84315',
    estado: 'A comprar',
    nota: 'Contra el fondo, bajo el anafe y detrás de los cajones de cocina; se alcanza sacando el cajón de arriba',
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
