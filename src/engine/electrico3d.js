// Sistema eléctrico en 3D: equipos con posición, cables como polilíneas y escenario
// (mamparo y asientos). Todo en mm con los mismos ejes que los muebles.
//
// Camino de la energía:
//   batería del auto (bajo el asiento del acompañante) -> fusible ANL -> cable largo bajo los asientos
//   -> mamparo -> DC-DC -> batería de 150 Ah -> fusible principal -> inversor -> enchufes
//   batería -> caja de fusibles -> heladera y panel de 5 interruptores -> 3 tiras LED, bomba y mando del inversor
//
// Todo lo eléctrico del mueble está en la sección derecha (D), lejos del fregadero. El extractor del
// techo no tiene conexión: se deja en el 3D para ubicar las luces.

import { disposicionTrasero } from './disposicion.js';

export const GRUPO_ELEC = 'Eléctrico';

export function electrico3d(cfg) {
  const { van, trasero: tr, equipos: eq, vehiculo: ve, led, extractor: ex } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zB: zb, zFondo, sec, D, A, C } = L;
  const EN = 'Mueble trasero';

  const caja = (id, nombre, x, y, z, sx, sy, sz, extra) => ({ id, nombre, grupo: GRUPO_ELEC, x, y, z, sx, sy, sz, ...extra });

  // --- Equipos dentro de la sección D (eléctrica) ---
  const bateria = caja('bateria', 'Batería de litio 150 Ah (parada)', D.xBateria, D.yBateria, D.zBateria, D.bsx, D.bsy, D.bsz, {
    en: EN,
    color: '#1565c0',
    nota: 'Sección eléctrica, abajo, parada, detrás de la puerta de la batería',
  });
  const TP = [D.xBateria + 70, D.yTopeBateria]; // borne positivo (x, y); z se define en cada cable

  const inv = eq.inversor;
  const inversor = caja('inversor', 'Inversor 12 V a 230 V', D.xBateria, D.yEquipos, zF + 110, inv.x, inv.y, inv.z, {
    en: EN,
    color: '#455a64',
    nota: 'Ya comprado. Sobre el estante de los equipos',
  });
  const dc = eq.dcdc;
  const dcdc = caja('dcdc', 'Cargador DC-DC', D.xBateria + 165, D.yEquipos, zFondo - 31 - dc.z, dc.x, dc.y, dc.z, {
    en: EN,
    color: '#00897b',
    nota: 'Carga la batería de 150 Ah desde la del auto. Pegado al mamparo',
  });
  const fus = eq.fusibles;
  const fusibles = caja('fusibles', 'Caja de fusibles', D.xBateria + 170, D.yEquipos, zF + 40, fus.z, fus.y, fus.x, {
    en: EN,
    color: '#ef6c00',
    nota: 'Reparte la energía de 12 V',
  });
  const anl = eq.anl;
  const fusiblePrincipal = caja('fusiblePrincipal', 'Fusible principal del inversor', sec.D.x1 - anl.x - 5, 480, zF + 40, anl.x, anl.y, anl.z, {
    en: EN,
    color: '#ffb300',
    nota: 'Al lado de la batería, entre la batería y el inversor',
  });

  // --- Frente de la sección eléctrica: panel de interruptores y enchufes ---
  const ps = eq.panelSwitches;
  const ench = eq.enchufe;
  const xTablero = sec.D.x0 + 25;
  const panelSwitches = caja('panelSwitches', 'Panel de 5 interruptores', xTablero, 760, zF - ps.z, ps.x, ps.y, ps.z, {
    color: '#263238',
    nota: 'En el tablero del frente de la sección eléctrica',
  });
  const enchufe1 = caja('enchufe1', 'Enchufe 230 V con USB-C (1)', xTablero, 675, zF - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el tablero del frente de la sección eléctrica',
  });
  const enchufe2 = caja('enchufe2', 'Enchufe 230 V con USB-C (2)', xTablero + ench.x + 12, 675, zF - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el tablero del frente de la sección eléctrica',
  });

  // --- Techo: tres tiras LED y el extractor (sin conexión) ---
  const yTecho = van.alto;
  const zLed0 = 250;
  const largoLed = led.largoM * 1000;
  const zExtAtras = ex.z - ex.marco / 2; // borde del extractor hacia la puerta trasera
  const zFinC = zExtAtras - 60; // la tercera tira sigue hacia la puerta trasera desde el extractor
  const largoC = Math.max(zFinC - zLed0, 0);
  const ledA = caja('ledA', `Tira LED ${led.largoM} m (1)`, led.x1 - 10, yTecho - 8, zLed0, 20, 8, largoLed, {
    color: '#fff59d',
    emisivo: true,
    nota: 'Techo, lado izquierdo',
  });
  const ledB = caja('ledB', `Tira LED ${led.largoM} m (2)`, led.x2 - 10, yTecho - 8, zLed0, 20, 8, largoLed, {
    color: '#fff59d',
    emisivo: true,
    nota: 'Techo, lado derecho',
  });
  const ledC = caja('ledC', `Tira LED ${(largoC / 1000).toFixed(1).replace('.', ',')} m (3)`, led.xC - 10, yTecho - 8, zLed0, 20, 8, largoC, {
    color: '#fff59d',
    emisivo: true,
    nota: 'Techo, al centro, desde el extractor hacia la puerta trasera',
  });
  const extractor = caja('extractor', 'Extractor de techo (sin conexión)', ex.x - ex.marco / 2, yTecho - 25, ex.z - ex.marco / 2, ex.marco, 25, ex.marco, {
    color: '#cfd8dc',
    nota: `Se abre a mano, sin ventilador. Hueco ${ex.hueco} mm, con el marco ${ex.marco} mm`,
  });

  // --- Batería del auto bajo el asiento del acompañante ---
  const ba = eq.bateriaAuto;
  const bateriaAuto = caja('bateriaAuto', 'Batería del auto', ve.bateriaX - ba.x / 2, ve.bateriaY, ve.bateriaZ - ba.z / 2, ba.x, ba.y, ba.z, {
    color: '#b71c1c',
    nota: 'Debajo del asiento del acompañante, lado de la puerta derecha',
  });
  const anlCaja = caja('anl', 'Fusible ANL', bateriaAuto.x - 80, 200, ve.bateriaZ - 10, 60, 40, 40, {
    color: '#ffb300',
    nota: 'A menos de 30 cm del borne positivo de la batería del auto',
  });

  const equipos = [
    bateria, fusibles, fusiblePrincipal, inversor, dcdc, panelSwitches, enchufe1, enchufe2,
    ledA, ledB, ledC, extractor, bateriaAuto, anlCaja,
  ];

  // --- Cables (puntos en mm). tipo: dc | ac | senal | agua | gas ---
  const zA = ve.bateriaZ - 10; // cota z del fusible ANL
  const xTerm = bateriaAuto.x + 20; // borne positivo de la batería del auto
  const xCab = dcdc.x + dcdc.sx / 2 + 20; // por donde entra el cable largo al mueble
  const yCab = dcdc.y + dcdc.sy / 2;
  const zUnder = 2600; // recorrido bajo los asientos
  const yTop = D.yTopeBateria;
  const yAlto = D.yEquipos + inv.y + 22; // nivel de los cables por encima del inversor
  const zTab = zF - 13; // plano de la canaleta pegada al tablero
  const yCan = yTecho - 12; // cota de los cables en el techo
  const zFinA = zLed0 + largoLed;

  const cables = [
    {
      id: 'c_auto_anl',
      nombre: 'Positivo de la batería del auto al fusible ANL',
      tipo: 'dc',
      desde: 'bateriaAuto',
      hasta: 'anl',
      video: 'anl',
      corriente: 'dcdc',
      puntos: [
        [xTerm, bateriaAuto.y + ba.y + 2, zA + 10],
        [anlCaja.x + 30, bateriaAuto.y + ba.y + 2, zA + 10],
        [anlCaja.x + 30, anlCaja.y + anlCaja.sy, zA + 10],
      ],
      nota: 'Cable cortísimo: el ANL tiene que estar pegado al borne.',
    },
    {
      id: 'c_largo',
      nombre: 'Cable largo bajo los asientos hasta el DC-DC',
      tipo: 'dc',
      desde: 'anl',
      hasta: 'dcdc',
      video: 'cableado',
      corriente: 'dcdc',
      puntos: [
        [anlCaja.x, 220, zA + 10],
        [anlCaja.x - 20, 220, zA + 10],
        [anlCaja.x - 20, 30, zA + 10],
        [anlCaja.x - 20, 30, zUnder],
        [xCab, 30, zUnder],
        [xCab, 30, zb + 8],
        [xCab, yCab, zb + 8],
        [xCab, yCab, zb - 30],
        [xCab, yCab, dcdc.z + dcdc.sz + 2],
      ],
      nota: 'Va por el piso bajo el asiento del acompañante, sube por el mamparo, lo pasa por un pasacables y entra directo al DC-DC.',
    },
    {
      id: 'c_dcdc_bat',
      nombre: 'DC-DC a batería de 150 Ah',
      tipo: 'dc',
      desde: 'dcdc',
      hasta: 'bateria',
      video: 'dcdc',
      corriente: 'dcdc',
      puntos: [
        [dcdc.x + 25, dcdc.y + dcdc.sy + 1, dcdc.z + 15],
        [dcdc.x + 25, yAlto, dcdc.z + 15],
        [TP[0], yAlto, dcdc.z + 15],
        [TP[0], yAlto, zF + 90],
        [TP[0], yTop + 1, zF + 90],
      ],
      nota: 'Salida del DC-DC al borne de la batería, por arriba del inversor y por un pasacables del estante. Usar el mismo calibre que la entrada.',
    },
    {
      id: 'c_bat_fusp',
      nombre: 'Batería al fusible principal',
      tipo: 'dc',
      desde: 'bateria',
      hasta: 'fusiblePrincipal',
      video: 'fusiblePrincipal',
      corriente: 'inversor',
      puntos: [
        [TP[0], yTop + 1, zF + 84],
        [TP[0], yTop + 5, zF + 84],
        [fusiblePrincipal.x + 30, yTop + 5, zF + 84],
        [fusiblePrincipal.x + 30, yTop + 5, fusiblePrincipal.z + 20],
        [fusiblePrincipal.x + 30, fusiblePrincipal.y + fusiblePrincipal.sy + 1, fusiblePrincipal.z + 20],
      ],
      nota: 'Fusible lo más cerca posible del borne positivo.',
    },
    {
      id: 'c_fusp_inv',
      nombre: 'Fusible principal al inversor',
      tipo: 'dc',
      desde: 'fusiblePrincipal',
      hasta: 'inversor',
      video: 'inversor',
      corriente: 'inversor',
      puntos: [
        [fusiblePrincipal.x - 1, 500, fusiblePrincipal.z + 20],
        [fusiblePrincipal.x - 30, 500, fusiblePrincipal.z + 20],
        [fusiblePrincipal.x - 30, 500, zF + 25],
        [fusiblePrincipal.x - 30, 575, zF + 25],
        [inversor.x + 90, 575, zF + 25],
        [inversor.x + 90, 575, inversor.z - 2],
      ],
      nota: 'Cable corto y grueso, por el frente del estante. El inversor es el consumo más fuerte del sistema.',
    },
    {
      id: 'c_bat_caja',
      nombre: 'Batería a la caja de fusibles',
      tipo: 'dc',
      desde: 'bateria',
      hasta: 'fusibles',
      video: 'fusibles',
      corriente: 'carga12',
      puntos: [
        [TP[0], yTop + 1, zF + 96],
        [TP[0], yTop + 5, zF + 96],
        [fusibles.x + 50, yTop + 5, zF + 96],
        [fusibles.x + 50, fusibles.y - 1, zF + 96],
      ],
      nota: 'Alimenta todo lo de 12 V que no pasa por el inversor.',
    },
    {
      id: 'c_caja_nevera',
      nombre: 'Caja de fusibles a la heladera',
      tipo: 'dc',
      desde: 'fusibles',
      hasta: 'nevera',
      video: 'nevera',
      corriente: 'nevera',
      puntos: [
        [fusibles.x + 20, fusibles.y + fusibles.sy + 1, zF + 150],
        [fusibles.x + 20, yAlto, zF + 150],
        [sec.C.x1 - 8, yAlto, zF + 150],
        [sec.C.x1 - 8, yAlto, zFondo - 21],
        [sec.C.x1 - 8, 250, zFondo - 21],
        [sec.C.x1 - 40, 250, zFondo - 21],
        [sec.C.x1 - 40, 250, L.zIn + 5 + eq.nevera.z + 2],
      ],
      nota: 'Pasa el divisor por un agujero con pasacables, baja por el fondo de la cocina y entra por atrás de la heladera. Sin interruptor.',
    },
    {
      id: 'c_caja_panel',
      nombre: 'Caja de fusibles al panel de interruptores',
      tipo: 'dc',
      desde: 'fusibles',
      hasta: 'panelSwitches',
      video: 'panelSwitches',
      corriente: 'switches',
      puntos: [
        [fusibles.x + 50, fusibles.y + fusibles.sy + 1, zF + 60],
        [fusibles.x + 50, panelSwitches.y + 10, zF + 60],
        [panelSwitches.x + 80, panelSwitches.y + 10, zF + 60],
        [panelSwitches.x + 80, panelSwitches.y + 10, zF],
      ],
      nota: 'Un solo cable de entrada al panel; de ahí salen los 5 interruptores.',
    },
    {
      id: 'c_panel_ledA',
      nombre: 'Panel a tira LED 1',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledA',
      video: 'ledA',
      corriente: 'ledA',
      puntos: [
        [panelSwitches.x + 10, panelSwitches.y + panelSwitches.sy + 1, zTab],
        [panelSwitches.x + 10, yCan, zTab],
        [panelSwitches.x + 10, yCan, zFinA],
        [led.x1, yCan, zFinA],
        [led.x1, yTecho - 8, zFinA],
      ],
      nota: 'Sube por una canaleta pegada al tablero y sigue por el techo hasta el extremo de la tira.',
    },
    {
      id: 'c_panel_ledB',
      nombre: 'Panel a tira LED 2',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledB',
      video: 'ledB',
      corriente: 'ledB',
      puntos: [
        [panelSwitches.x + 30, panelSwitches.y + panelSwitches.sy + 1, zTab],
        [panelSwitches.x + 30, yCan, zTab],
        [panelSwitches.x + 30, yCan, zFinA + 12],
        [led.x2, yCan, zFinA + 12],
        [led.x2, yTecho - 8, zFinA],
      ],
      nota: 'Comparte la canaleta con los otros cables de luz.',
    },
    {
      id: 'c_panel_ledC',
      nombre: 'Panel a tira LED 3 (centro)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledC',
      video: 'ledC',
      corriente: 'ledC',
      puntos: [
        [panelSwitches.x + 50, panelSwitches.y + panelSwitches.sy + 1, zTab],
        [panelSwitches.x + 50, yCan, zTab],
        [ex.x + ex.marco / 2 + 85, yCan, zTab],
        [ex.x + ex.marco / 2 + 85, yCan, zLed0 + largoC],
        [led.xC, yCan, zLed0 + largoC],
        [led.xC, yTecho - 8, zLed0 + largoC],
      ],
      nota: 'Rodea el extractor por el costado y llega a la tira por el lado del extractor. El extractor no lleva cable.',
    },
    {
      id: 'c_panel_bomba',
      nombre: 'Panel a la bomba de agua',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'bomba',
      video: 'bomba',
      corriente: 'bomba',
      puntos: [
        [panelSwitches.x + 100, panelSwitches.y + 30, zF],
        [panelSwitches.x + 100, panelSwitches.y + 30, zFondo - 10],
        [400, panelSwitches.y + 30, zFondo - 10],
        [400, 520, zFondo - 10],
        [320, 520, zFondo - 10],
        [320, 520, zF + 345 + 70 + 2],
      ],
      nota: 'Va por atrás del tablero y por la parte alta del fondo del mueble, detrás del anafe y del fregadero, hasta la bomba. Lejos del gas: separarlo con una canaleta.',
    },
    {
      id: 'c_panel_mando',
      nombre: 'Panel al mando del inversor',
      tipo: 'senal',
      desde: 'panelSwitches',
      hasta: 'inversor',
      video: 'inversor',
      corriente: 'senal',
      puntos: [
        [panelSwitches.x + 50, panelSwitches.y + 10, zF],
        [panelSwitches.x + 50, panelSwitches.y + 10, zF + 45],
        [panelSwitches.x + 50, inversor.y + 50, zF + 45],
        [panelSwitches.x + 50, inversor.y + 50, inversor.z - 2],
      ],
      nota: 'Cable de señal de 2 hilos: el interruptor 5 enciende o apaga el inversor sin tocarlo.',
    },
    {
      id: 'c_inv_ench1',
      nombre: 'Inversor al enchufe 1 (230 V)',
      tipo: 'ac',
      desde: 'inversor',
      hasta: 'enchufe1',
      video: 'enchufe1',
      corriente: 'ac',
      puntos: [
        [enchufe1.x + 10, inversor.y + 40, inversor.z - 2],
        [enchufe1.x + 10, inversor.y + 40, zF + 55],
        [enchufe1.x + 10, enchufe1.y + 25, zF + 55],
        [enchufe1.x + 10, enchufe1.y + 25, zF + 2],
      ],
      nota: 'Cable de 3 hilos (fase, neutro y tierra). Siempre con disyuntor aguas abajo del inversor.',
    },
    {
      id: 'c_ench1_ench2',
      nombre: 'Derivación del enchufe 1 al enchufe 2',
      tipo: 'ac',
      desde: 'enchufe1',
      hasta: 'enchufe2',
      video: 'enchufe2',
      corriente: 'ac',
      puntos: [
        [enchufe1.x + 50, enchufe1.y + 50, zF + 2],
        [enchufe1.x + 50, enchufe1.y + 50, zF + 30],
        [enchufe2.x + 40, enchufe2.y + 50, zF + 30],
        [enchufe2.x + 40, enchufe2.y + 50, zF + 2],
      ],
      nota: 'Misma línea de 230 V.',
    },
  ];

  // --- Mangueras de agua y de gas ---
  const bid = eq.bidon;
  const bidon2x = A.xCajon + L.t + 2 + (bid.x + 10);
  const cuello = [bidon2x + bid.x / 2, A.yPisoBidones + bid.y, zF + 35 + bid.z - 40]; // boca del segundo bidón
  const reg = eq.regulador;
  const yRegulador = C.yCajonGas + L.tb + eq.garrafa.y; // base del regulador, sobre la garrafa
  const zRegulador = L.zIn + 15 + 10 + 80 + reg.z / 2; // centro del regulador en z
  const mangueras = [
    {
      id: 'm_bidon_bomba',
      nombre: 'Manguera del bidón a la bomba',
      tipo: 'agua',
      desde: 'bidon2',
      hasta: 'bomba',
      video: 'bomba',
      puntos: [
        [cuello[0], cuello[1], cuello[2]],
        [cuello[0], 520, cuello[2]],
        [cuello[0], 520, zF + 380],
        [372, 520, zF + 380],
      ],
      nota: 'Manguera de grado alimenticio. Sube por un agujero del estante. Unir los dos bidones en paralelo con una T.',
    },
    {
      id: 'm_bomba_canilla',
      nombre: 'Manguera de la bomba a la canilla',
      tipo: 'agua',
      desde: 'bomba',
      hasta: 'canilla',
      video: 'canilla',
      puntos: [
        [340, 561, zF + 380],
        [340, 600, zF + 380],
        [400, 600, zF + 380],
        [400, 830, zF + 380],
        [450, 830, zF + 380],
        [450, 851, zF + 420],
      ],
      nota: 'Sube por al lado del fregadero y atraviesa la tapa por un agujero junto a la canilla.',
    },
    {
      id: 'm_gas_regulador',
      nombre: 'Manguera de gas del regulador a la llave de corte',
      tipo: 'gas',
      desde: 'regulador',
      hasta: 'valvulaGas',
      video: 'gas',
      puntos: [
        [C.xCentro, yRegulador + reg.y + 1, zRegulador],
        [C.xCentro, 775, zRegulador],
        [sec.C.x1 - 80, 775, zRegulador],
        [sec.C.x1 - 80, 775, zF + 400],
      ],
      nota: 'Manguera flexible certificada para gas con abrazaderas, con bucle suficiente para que el cajón se abra sin tirar.',
    },
    {
      id: 'm_gas_anafe',
      nombre: 'Caño de gas de la llave de corte al anafe',
      tipo: 'gas',
      desde: 'valvulaGas',
      hasta: 'anafe',
      video: 'gas',
      puntos: [
        [sec.C.x1 - 80, 781, zF + 400],
        [sec.C.x1 - 80, 790, zF + 400],
        [sec.C.x1 - 80, 790, zF + 340],
        [sec.C.x1 - 80, 797, zF + 340],
      ],
      nota: 'Tramo corto y fijo hasta la entrada del anafe. Probar todas las uniones con agua jabonosa.',
    },
  ];

  // --- Escenario: mamparo y asientos ---
  const escenario = [
    { nombre: 'Mamparo detrás de los asientos', x: 0, y: 0, z: zb, sx: van.ancho, sy: van.alto, sz: 8, color: '#9aa5b1', opacidad: 0.25 },
    { nombre: 'Piso de la cabina', x: 0, y: -12, z: zb + 8, sx: van.ancho, sy: 12, sz: 900, color: '#6d5a44' },
    // Asiento del acompañante (lado derecho)
    { nombre: 'Asiento del acompañante - base', x: 1070, y: 330, z: zb + 120, sx: 560, sy: 120, sz: 480, color: '#37474f', opacidad: 0.35 },
    { nombre: 'Asiento del acompañante - respaldo', x: 1070, y: 450, z: zb + 20, sx: 560, sy: 620, sz: 130, color: '#37474f', opacidad: 0.35 },
    // Asiento del conductor (lado izquierdo)
    { nombre: 'Asiento del conductor - base', x: 150, y: 330, z: zb + 120, sx: 560, sy: 120, sz: 480, color: '#37474f', opacidad: 0.35 },
    { nombre: 'Asiento del conductor - respaldo', x: 150, y: 450, z: zb + 20, sx: 560, sy: 620, sz: 130, color: '#37474f', opacidad: 0.35 },
  ];
  const decos = [
    { nombre: 'Pasacables en el mamparo', x: xCab - 20, y: yCab - 15, z: zb - 4, sx: 40, sy: 30, sz: 18, color: '#212121' },
  ];
  // Detalles del techo que se ven junto con el eléctrico
  const decosElec = [
    {
      nombre: 'Hueco del extractor',
      x: ex.x - ex.hueco / 2,
      y: yTecho - 26,
      z: ex.z - ex.hueco / 2,
      sx: ex.hueco,
      sy: 1.2,
      sz: ex.hueco,
      color: '#37474f',
    },
  ];

  return { equipos, cables, mangueras, escenario, decos, decosElec, largoC };
}
