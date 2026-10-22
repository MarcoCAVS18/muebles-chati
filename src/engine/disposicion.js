// Disposición interna del mueble trasero. La usan el mueble (trasero.js) y el eléctrico 3D
// (electrico3d.js) para que los equipos y los cables salgan de las mismas medidas.
//
// Secciones de izquierda a derecha, vistas desde la puerta trasera hacia los asientos
// (x = 0 es la pared izquierda):
//   E  eléctrico: batería acostada, inversor, DC-DC y fusibles abajo; panel y enchufes en el frente
//   K  cocina:    anafe arriba, cajón de la garrafa y heladera al piso
//   W  agua:      fregadero arriba, cajón bajo el fregadero y cajón de bidones al piso
//
// La cama (plataforma a 500 mm) pasa frente al mueble. Lo que está bajo la cama sale hacia un hueco
// libre; lo que está sobre la cama queda a la vista.

export function disposicionTrasero(cfg) {
  const { van, trasero: tr, equipos: eq, cama: ca } = cfg;
  const t = cfg.materiales.estructura.t;
  const tb = cfg.materiales.fondo.t;

  const zF = van.largo - tr.profundidad; // frente del mueble (hacia la cama)
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
  const yInicioAlto = yCamaSup + 20; // los frentes altos empiezan sobre la cama

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

  // --- Sección E: eléctrico ---
  // Batería acostada (largo sobre x) al frente y abajo. El estante de los equipos queda 62 mm sobre
  // ella para llegar a los bornes. Todo lo de adentro termina por debajo del plano de la cama.
  const E = {
    xBateria: sec.E.x0 + 15,
    yBateria: yPiso + 3,
    zBateria: zIn + 15,
    bsx: bat.x, // largo de la batería (x)
    bsy: bat.y, // alto de la batería (y)
    bsz: bat.z, // ancho de la batería (z)
  };
  E.yTopeBateria = E.yBateria + E.bsy;
  E.yEstante = E.yTopeBateria + 62; // estante de los equipos
  E.yEquipos = E.yEstante + t + 2; // cara inferior de los equipos sobre el estante
  E.hueco = hueco.E;

  // --- Sección K: cocina ---
  const K = {
    yHeladera: yPiso + 3,
    xHeladera: sec.K.x0 + (sec.K.x1 - sec.K.x0 - fri.x) / 2,
  };
  K.yEstante = K.yHeladera + fri.y + 7; // estante bajo el cajón del gas
  K.yCajonGas = K.yEstante + t + 2;
  K.altoCajonGas = 150;
  K.fondoCajonGas = 340;
  K.anchoCajon = hueco.K.x1 - hueco.K.x0 - 26;
  K.xCajon = hueco.K.x0 + 13;
  K.xCentro = (sec.K.x0 + sec.K.x1) / 2;
  K.yAnafe = tr.alto - eq.anafe.y; // cara inferior del anafe

  // --- Sección W: agua ---
  const W = {
    yCajonBidones: yPiso + 1,
    altoCajonBidones: 260,
    fondoCajonBidones: 340,
    anchoCajon: hueco.W.x1 - hueco.W.x0 - 26,
    xCajon: hueco.W.x0 + 13,
  };
  W.yPisoBidones = W.yCajonBidones + t; // el piso del cajón de bidones es de 15 mm
  W.yEstante = W.yPisoBidones + bid.y + 12; // estante sobre los bidones
  W.yCajonFregadero = 525;
  W.altoCajonFregadero = 120;
  W.fondoCajonFregadero = 260;
  // El fregadero y la canilla se acomodan desde el borde izquierdo de la sección de agua
  W.xFregadero = sec.W.x0 + 25;
  W.xCanilla = W.xFregadero + eq.fregadero.x + 30;
  W.xBomba = sec.W.x0 + 250;
  W.bomba = { x: W.xBomba, y: W.yEstante + t + 2, z: zF + 345, sx: 120, sy: 80, sz: 70 }; // sobre el estante, atrás del cajón bajo el fregadero

  return { t, tb, zF, zB, zIn, zFondo, x1, yBase, yPiso, yTapa, d1, d2, yCamaSup, yCamaInf, yTopeBajo, yInicioAlto, sec, hueco, E, K, W };
}
