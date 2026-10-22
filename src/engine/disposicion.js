// Disposición interna del mueble trasero. La usan el mueble (trasero.js) y el eléctrico 3D
// (electrico3d.js) para que los equipos y los cables salgan de las mismas medidas.
//
// Secciones de izquierda a derecha (x = 0 es la pared izquierda):
//   A  agua:      fregadero arriba, cajón abajo del fregadero y cajón hasta el piso con 2 bidones de 20 L
//   B  guardado:  puertas, arriba y abajo de la cama
//   C  cocina:    anafe arriba, cajón de la garrafa y heladera abajo
//   D  eléctrico: batería, inversor, DC-DC y fusibles, con el panel y los enchufes en el frente
//
// La cama (plataforma a 500 mm) pasa frente a las secciones A y B. Lo que está bajo la cama sale
// hacia un hueco libre; lo que está sobre la cama queda a la vista.

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
  const dA = tr.divisorAgua;
  const d1 = tr.divisor1;
  const d2 = tr.divisor2;

  // Plano de la cama
  const yCamaSup = ca.plataforma;
  const yCamaInf = ca.plataforma - t;
  const yTopeBajo = yCamaInf - 35; // los frentes bajos terminan antes del listón de unión de la cama
  const yInicioAlto = yCamaSup + 20; // los frentes altos empiezan sobre la cama

  const sec = {
    A: { x0: t, x1: dA },
    B: { x0: dA + t, x1: d1 },
    C: { x0: d1 + t, x1: d2 },
    D: { x0: d2 + t, x1: x1 - t },
  };
  // Hueco de cada frente (los montantes son los bordes de la sección)
  const hueco = {
    A: { x0: sec.A.x0 + 15, x1: sec.A.x1 - 15 },
    B: { x0: sec.B.x0 + 15, x1: sec.B.x1 - 15 },
    C: { x0: sec.C.x0 + 15, x1: sec.C.x1 - 18 },
    D: { x0: sec.D.x0 + 15, x1: sec.D.x1 - 15 },
  };

  const bid = eq.bidon;
  const fri = eq.nevera;
  const bat = eq.bateria;

  // --- Sección A: agua ---
  const A = {
    yCajonBidones: yPiso + 1,
    altoCajonBidones: 260,
    fondoCajonBidones: 340,
    anchoCajon: hueco.A.x1 - hueco.A.x0 - 26,
    xCajon: hueco.A.x0 + 13,
  };
  A.yPisoBidones = A.yCajonBidones + t; // el piso del cajón de bidones es de 15 mm
  A.yEstante = A.yPisoBidones + bid.y + 12; // estante sobre los bidones
  A.yCajonFregadero = 525;
  A.altoCajonFregadero = 120;
  A.fondoCajonFregadero = 260;

  // --- Sección C: cocina ---
  const C = {
    yHeladera: yPiso + 3,
    xHeladera: sec.C.x0 + (sec.C.x1 - sec.C.x0 - fri.x) / 2,
  };
  C.yEstante = C.yHeladera + fri.y + 7; // estante bajo el cajón del gas
  C.yCajonGas = C.yEstante + t + 2;
  C.altoCajonGas = 150;
  C.fondoCajonGas = 340;
  C.anchoCajon = hueco.C.x1 - hueco.C.x0 - 26;
  C.xCajon = hueco.C.x0 + 13;
  C.xCentro = (sec.C.x0 + sec.C.x1) / 2;
  C.yAnafe = tr.alto - eq.anafe.y; // cara inferior del anafe

  // --- Sección D: eléctrico ---
  // Batería parada (largo vertical) al frente; el estante de los equipos sobre ella
  const D = {
    xBateria: sec.D.x0 + 15,
    yBateria: yPiso + 3,
    zBateria: zIn + 15,
    bsx: bat.z, // ancho de la batería parada (x)
    bsy: bat.x, // alto de la batería parada (y)
    bsz: bat.y, // fondo de la batería parada (z)
  };
  D.yTopeBateria = D.yBateria + D.bsy;
  D.yEstante = D.yTopeBateria + 10; // estante de los equipos
  D.yEquipos = D.yEstante + t + 2; // cara inferior de los equipos sobre el estante
  D.yBordeTablero = D.yEquipos + 112; // sobre este nivel va el tablero del panel y los enchufes

  return { t, tb, zF, zB, zIn, zFondo, x1, yBase, yPiso, yTapa, dA, d1, d2, yCamaSup, yCamaInf, yTopeBajo, yInicioAlto, sec, hueco, A, C, D };
}
