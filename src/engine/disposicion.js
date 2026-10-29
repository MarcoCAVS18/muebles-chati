// Disposición interna del mueble trasero. La usan el mueble (trasero.js) y el eléctrico 3D
// (electrico3d.js) para que los equipos y los cables salgan de las mismas medidas.
//
// Secciones de izquierda a derecha, vistas desde la puerta trasera hacia los asientos
// (x = 0 es la pared izquierda):
//   E  eléctrico (la L, 570 mm de fondo): al piso la batería acostada, el inversor, el DC-DC y los
//      fusibles, bajo el plano de la cama; sobre la cama, el tablero con interruptores y enchufes
//      y la heladera de tapa arriba, con la tapa a ras de la mesada
//   K  cocina (500 mm, angosta): anafe arriba, dos cajones de cocina y la garrafa fija al piso, detrás de una puerta
//   W  agua (500 mm): fregadero arriba, cajón bajo el fregadero y cajón de bidones al piso
//
// La cama (superficie a 400 mm, 1800 mm de largo) termina contra el frente de la sección E. Al compartimento eléctrico se
// entra por una puerta en el costado izquierdo; lo que está sobre la cama queda a la vista.

export function disposicionTrasero(cfg) {
  const { van, trasero: tr, equipos: eq, cama: ca } = cfg;
  const t = cfg.materiales.estructura.t;
  const tb = cfg.materiales.fondo.t;

  const profL = tr.profundidadL ?? tr.profundidad;
  const zF = van.largo - tr.profundidad; // frente de la cocina y del agua
  const zFL = van.largo - profL; // frente de la sección eléctrica (la L)
  const zB = van.largo; // mamparo
  const zIn = zF + t; // primera cara interior, detrás del frente
  const zFondo = zB - tb; // cara interior del fondo
  const x1 = tr.ancho;
  const yBase = tr.zocalo; // cara inferior de la base
  const yPiso = yBase + t; // cara superior de la base
  const yTapa = tr.alto - t; // cara inferior de la tapa
  const d1 = tr.divisor1;
  const d2 = tr.divisor2;

  // Plano de la cama
  const yCamaSup = ca.plataforma;
  const yCamaInf = ca.plataforma - t;
  const yTopeBajo = yCamaInf - 35; // los frentes bajos terminan antes del listón de unión de la cama
  const yInicioAlto = yCamaSup + 20; // los frentes altos empiezan sobre ella

  const sec = {
    E: { x0: t, x1: d1 },
    K: { x0: d1 + t, x1: d2 },
    W: { x0: d2 + t, x1: x1 - t },
  };
  // Hueco de cada frente (los montantes son los bordes de la sección)
  const hueco = {
    E: { x0: sec.E.x0 + 15, x1: sec.E.x1 - 15 },
    K: { x0: sec.K.x0 + 15, x1: sec.K.x1 - 15 },
    W: { x0: sec.W.x0 + 15, x1: sec.W.x1 - 15 },
  };

  const bid = eq.bidon;
  const fri = eq.nevera;
  const bat = eq.bateria;
  const inv = eq.inversor;
  const dc = eq.dcdc;
  const fus = eq.fusibles;
  const anl = eq.anl;

  // --- Sección E: eléctrico ---
  // Todo al piso. Fila del frente (se alcanza por la puerta): fusibles, DC-DC e inversor.
  // Fila del fondo: la batería (con los bornes arriba) y el fusible principal a su lado.
  const zInE = zFL + t; // primera cara interior de la sección E
  const yE = yPiso + 3; // altura de lo que va apoyado en el piso
  const E = {
    zF: zFL,
    zIn: zInE,
    yPiso: yE,
    yEstante: yTopeBajo + 2, // estante que cierra el compartimento eléctrico y es el piso de los cajones
    // Tablero con interruptores y enchufes, sobre la cama
    yTablero: yCamaSup + 40,
    yTableroFin: 570, // arriba del tablero empieza el frente fijo de la heladera
  };
  // Heladera de tapa arriba, sobre el compartimento eléctrico: su tapa queda a ras de la mesada y se abre por un corte de la
  // tapa 1. Va 80 mm detrás del frente: ahí bajan los cables del tablero. Atrás queda un hueco de unos 130 mm para el aire y los cables.
  E.yNevera = tr.alto - fri.y;
  E.yEstanteNevera = E.yNevera - t; // estante que la sostiene
  E.zNevera = zInE + 80;
  E.xNevera = t + (d1 - t - fri.x) / 2;
  // Inversor y DC-DC contra el borde derecho; los fusibles a su izquierda.
  // Si la L es profunda el inversor va de largo sobre z (como los demás equipos). Si es angosta (570 mm), el inversor,
  // el paso del cable largo y la batería no entran uno detrás de otro: el inversor va atravesado, con el largo sobre x.
  const fondoE = zFondo - zInE;
  E.inversorAtravesado = 15 + inv.z + 70 + bat.z + 60 > fondoE;
  const ivSx = E.inversorAtravesado ? inv.z : inv.x;
  const ivSz = E.inversorAtravesado ? inv.x : inv.z;
  E.inversor = { x: sec.E.x1 - 15 - ivSx, y: yE, z: zInE + 15, sx: ivSx, sy: inv.y, sz: ivSz };
  E.dcdc = { x: E.inversor.x - 10 - dc.x, y: yE, z: zInE + 15, sx: dc.x, sy: dc.y, sz: dc.z };
  E.fusibles = { x: E.dcdc.x - 10 - fus.z, y: yE, z: zInE + 15, sx: fus.z, sy: fus.y, sz: fus.x };
  // Batería contra el fondo, con 70 mm de pasada para los cables. Apoya sobre la almohadilla calefactora y esta
  // sobre una plancha aislante: así el frío del piso no le llega y el calor no se pierde hacia abajo.
  const aisl = eq.aislante;
  const cal = eq.calefactor;
  const xBat = sec.E.x0 + 15;
  const zBat = zFondo - 70 - bat.z;
  const yBat = yE + aisl.y + cal.y;
  E.bateria = { x: xBat, y: yBat, z: zBat, sx: bat.x, sy: bat.y, sz: bat.z };
  E.yTopeBateria = yBat + bat.y;
  // La plancha aislante es más grande que la batería (sobresale en el frente y los costados)
  E.aislante = {
    x: xBat - (aisl.x - bat.x) / 2,
    y: yE,
    z: zBat - (aisl.z - bat.z) + (aisl.z - bat.z) / 2,
    sx: aisl.x,
    sy: aisl.y,
    sz: aisl.z,
  };
  E.calefactor = { x: xBat + (bat.x - cal.x) / 2, y: yE + aisl.y, z: zBat + (bat.z - cal.z) / 2, sx: cal.x, sy: cal.y, sz: cal.z };
  // Dos disyuntores de 120 A de rearme manual, al piso con la palanca hacia arriba, entre la fila del frente y la
  // batería: el primero en la línea del DC-DC a la batería y el segundo en la que va a la caja de fusibles.
  const cb = eq.cortacircuitos;
  const zFinFila = Math.max(E.fusibles.z + E.fusibles.sz, E.dcdc.z + E.dcdc.sz, E.inversor.z + E.inversor.sz);
  const zCb = zFinFila + 20;
  E.cb1 = { x: xBat + 10, y: yE, z: zCb, sx: cb.x, sy: cb.y, sz: cb.z };
  E.cb2 = { x: E.cb1.x + cb.x + 10, y: yE, z: zCb, sx: cb.x, sy: cb.y, sz: cb.z };
  // El termostato va en el piso, delante de la batería y del aislante, a la derecha de los disyuntores;
  // la sonda se apoya en la cara de la batería que mira al frente, lejos de la almohadilla
  const ter = eq.termostato;
  E.termostato = { x: E.cb2.x + cb.x + 25, y: yE, z: E.aislante.z - 12 - ter.z, sx: ter.x, sy: ter.y, sz: ter.z };
  // El fusible principal va a la derecha de la batería, pegado al borne positivo
  E.anl = { x: E.bateria.x + bat.x + 12, y: yE, z: E.bateria.z + 20, sx: anl.x, sy: anl.y, sz: anl.z };
  // Borne positivo en el extremo derecho de la batería, en la cara de arriba
  E.borne = { x: E.bateria.x + bat.x - 55, y: E.yTopeBateria, z: E.bateria.z + 40 };
  // Los equipos se alcanzan por la puerta del costado izquierdo, no por abajo de la cama: el estante que cierra el compartimento
  // sube lo que haga falta para dejar lugar a los cables de los bornes (55 mm como mínimo)
  E.yEstante = Math.max(E.yEstante, Math.ceil((E.yTopeBateria + 60) / 5) * 5);
  E.huecoCables = E.yEstanteNevera - (E.yEstante + t); // hueco entre los dos estantes: por ahí corren los cables del tablero
  // Puerta del costado izquierdo (se ve al abrir la puerta lateral de la van): deja a la vista la batería y los equipos
  E.puertaLateral = { y0: yPiso + 5, y1: E.yEstante - 5, z0: zInE + 20, z1: zFondo - 20 };

  // --- Sección K: cocina ---
  const gar = eq.garrafa;
  const reg = eq.regulador;
  const K = {};
  // La garrafa va fija, parada, detrás de una puerta con la bisagra a la derecha. Apoya en el piso a través de un círculo
  // calado en la base, que la traba y la deja 15 mm más abajo. La puerta arranca después del borde de la cama: al abrirse,
  // el borde libre gira hacia la derecha y nunca pasa bajo la cama.
  const xBordeCama = ca.x0 + ca.ancho;
  K.yAsiento = yBase; // base de la garrafa
  K.yEstante = K.yAsiento + gar.y + reg.y + 15; // estante sobre la garrafa con su regulador
  K.puerta = { x0: Math.max(hueco.K.x0, xBordeCama + 4), x1: hueco.K.x1 };
  K.anchoCajon = hueco.K.x1 - hueco.K.x0 - 26;
  K.xCajon = hueco.K.x0 + 13;
  K.xCentro = (sec.K.x0 + sec.K.x1) / 2;
  K.xGar = (K.puerta.x0 + K.puerta.x1) / 2; // centro de la garrafa en x, frente al centro de la puerta
  K.zGar = zIn + 20; // frente de la garrafa
  K.asiento = { cx: K.xGar, cz: K.zGar + gar.z / 2, r: Math.max(gar.x, gar.z) / 2 + 5 }; // círculo de la base
  K.yAnafe = tr.alto - eq.anafe.y; // cara inferior del anafe
  // Dos cajones de cocina entre el estante de la garrafa y el anafe. Son cortos para dejar libre el fondo
  // (llave de corte y caño del gas)
  const yCajIni = K.yEstante + t + 12;
  K.yCajIni = yCajIni;
  const yCajFin = K.yAnafe - 25;
  const altoCaj = (yCajFin - yCajIni - 15) / 2;
  K.cajones = [
    { nombre: 'Cajón de cocina 1', y0: yCajIni, y1: yCajIni + altoCaj },
    { nombre: 'Cajón de cocina 2', y0: yCajIni + altoCaj + 15, y1: yCajFin },
  ];
  K.fondoCajonCocina = 340;

  // --- Sección W: agua ---
  const W = {
    yCajonBidones: yPiso + 1,
    altoCajonBidones: 260,
    anchoCajon: hueco.W.x1 - hueco.W.x0 - 26,
    xCajon: hueco.W.x0 + 13,
  };
  W.yPisoBidones = W.yCajonBidones + t; // el piso del cajón de bidones es de 15 mm
  // Los dos bidones planos van girados (el largo a lo ancho del cajón) y uno detrás del otro: de frente no entran
  // con la canilla en el fondo del cajón. El de agua limpia va atrás, cerca de la bomba; el de aguas grises, adelante.
  // La canilla y la boca miran hacia la pared derecha.
  const sepBid = 10;
  const canBid = bid.canilla ?? 0;
  const zBid0 = zIn + 15 + 5; // 5 mm de luz contra el frente del cajón
  const xBid = W.xCajon + t + 2;
  W.bidones = [
    { nombre: 'limpia', x: xBid, y: W.yPisoBidones, z: zBid0 + bid.z + sepBid, sx: bid.x, sy: bid.y, sz: bid.z },
    { nombre: 'grises', x: xBid, y: W.yPisoBidones, z: zBid0, sx: bid.x, sy: bid.y, sz: bid.z },
  ];
  // Fondo del cajón: luz, los dos bidones, separación, luz y la trasera; las correderas vienen de a 50 mm
  const fondoNecesario = 5 + 2 * bid.z + sepBid + 5 + t;
  W.fondoCajonBidones = Math.min(Math.ceil(fondoNecesario / 50) * 50, zFondo - (zIn + 15));
  // Sobra a lo ancho: lado interior del cajón menos el largo del bidón con la canilla y las luces
  W.sobraBidones = W.anchoCajon - 2 * t - (2 + bid.x + canBid + 2);
  W.yEstante = W.yPisoBidones + bid.y + 12; // estante sobre los bidones
  W.yCajonFregadero = 510;
  W.altoCajonFregadero = 120;
  W.fondoCajonFregadero = 260;
  // El fregadero y la canilla se acomodan desde el borde izquierdo de la sección de agua
  W.xFregadero = sec.W.x0 + 25;
  W.xCanilla = W.xFregadero + eq.fregadero.x + 30;
  W.xBomba = sec.W.x0 + 250;
  W.bomba = { x: W.xBomba, y: W.yEstante + t + 2, z: zF + 345, sx: 164, sy: 80, sz: 90 }; // sobre el estante, atrás del cajón bajo el fregadero

  return { t, tb, zF, zFL, zB, zIn, zFondo, x1, yBase, yPiso, yTapa, d1, d2, yCamaSup, yCamaInf, yTopeBajo, yInicioAlto, sec, hueco, E, K, W };
}
