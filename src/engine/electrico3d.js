// Sistema eléctrico en 3D: equipos con posición, cables como polilíneas y escenario
// (mamparo y asientos). Todo en mm con los mismos ejes que los muebles.
//
// Camino de la energía:
//   batería del auto (bajo el asiento del acompañante) -> fusible ANL -> cable largo bajo los asientos
//   -> mamparo -> DC-DC -> batería de 150 Ah -> fusible principal -> inversor -> enchufes
//   batería -> caja de fusibles -> heladera, panel de 5 interruptores -> luces, bomba, extractor, mando

export const GRUPO_ELEC = 'Eléctrico';

export function electrico3d(cfg) {
  const { van, trasero: tr, equipos: eq, vehiculo: ve, led } = cfg;
  const t = cfg.materiales.estructura.t;
  const zf = van.largo - tr.profundidad; // frente del mueble trasero
  const zb = van.largo; // mamparo
  const yb = tr.zocalo + t + 5; // piso de la zona eléctrica, sobre la base
  const EN = 'Mueble trasero';

  const caja = (id, nombre, x, y, z, sx, sy, sz, extra) => ({ id, nombre, grupo: GRUPO_ELEC, x, y, z, sx, sy, sz, ...extra });

  // --- Equipos dentro de la sección izquierda (zona baja, detrás de la cama) ---
  const bat = eq.bateria;
  const bateria = caja('bateria', 'Batería de litio 150 Ah', 25, yb, zf + 30, bat.x, bat.y, bat.z, {
    en: EN,
    color: '#1565c0',
    nota: 'Sección izquierda, zona baja',
  });
  const fus = eq.fusibles;
  const fusibles = caja('fusibles', 'Caja de fusibles', 520, yb, zf + 30, fus.x, fus.y, fus.z, {
    en: EN,
    color: '#ef6c00',
    nota: 'Reparte la energía de 12 V',
  });
  const anl = eq.anl;
  const fusiblePrincipal = caja('fusiblePrincipal', 'Fusible principal del inversor', 520, yb, zf + 140, anl.x, anl.y, anl.z, {
    en: EN,
    color: '#ffb300',
    nota: 'Entre la batería y el inversor',
  });
  const inv = eq.inversor;
  const inversor = caja('inversor', 'Inversor 12 V a 230 V', 25, yb, zf + 220, inv.z, inv.y, inv.x, {
    en: EN,
    color: '#455a64',
    nota: 'Ya comprado',
  });
  const dc = eq.dcdc;
  const dcdc = caja('dcdc', 'Cargador DC-DC', 340, yb, zf + 240, dc.z, dc.y, dc.x, {
    en: EN,
    color: '#00897b',
    nota: 'Carga la batería de 150 Ah desde la del auto',
  });

  // --- Fuera de la sección: panel de interruptores y enchufes en el frente ---
  const ps = eq.panelSwitches;
  const ench = eq.enchufe;
  const zPanel = zf - ps.z;
  const panelSwitches = caja('panelSwitches', 'Panel de 5 interruptores', 630, 700, zPanel, ps.x, ps.y, ps.z, {
    color: '#263238',
    nota: 'En el frente del mueble, a la altura de la cabecera',
  });
  const enchufe1 = caja('enchufe1', 'Enchufe 230 V con USB-C (1)', 626, 610, zf - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el frente, sobre la cama',
  });
  const enchufe2 = caja('enchufe2', 'Enchufe 230 V con USB-C (2)', 702, 610, zf - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el frente, sobre la cama',
  });

  // --- Techo: tiras LED y extractor ---
  const yTecho = van.alto;
  const zLed0 = 250;
  const largoLed = led.largoM * 1000;
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
  const extractor = caja('extractor', 'Extractor de techo', 760, yTecho - 15, 1650, 250, 15, 250, {
    color: '#90a4ae',
    nota: 'Techo, sobre la zona de la mesa',
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

  const equipos = [bateria, fusibles, fusiblePrincipal, inversor, dcdc, panelSwitches, enchufe1, enchufe2, ledA, ledB, extractor, bateriaAuto, anlCaja];

  // --- Cables (puntos en mm). tipo: dc | ac | senal | agua ---
  const zA = ve.bateriaZ - 10; // cota z del fusible ANL
  const xTerm = bateriaAuto.x + 20; // borne positivo de la batería del auto
  const xCab = 360; // por donde entra el cable largo al mueble
  const zUnder = 2600; // recorrido bajo los asientos
  const T = [430, bateria.y + bateria.sy]; // borne positivo de la batería de 150 Ah (x, y)
  const yTop = bateria.y + bateria.sy;

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
        [xCab, yb + 10, zb + 8],
        [xCab, yb + 10, zb - 30],
        [xCab + 20, yb + 10, zb - 30],
        [xCab + 20, yb + 30, dcdc.z + dcdc.sz + 2],
      ],
      nota: 'Va por el piso bajo los asientos, pasa el mamparo por un pasacables y entra por el fondo del mueble.',
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
        [500, dcdc.y + dcdc.sy, zf + 280],
        [500, yTop + 12, zf + 280],
        [T[0], yTop + 12, zf + 280],
        [T[0], yTop + 12, zf + 66],
        [T[0], yTop + 2, zf + 66],
      ],
      nota: 'Salida del DC-DC al borne de la batería. Usar el mismo calibre que la entrada.',
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
        [T[0], yTop, zf + 40],
        [T[0], yTop + 16, zf + 40],
        [550, yTop + 16, zf + 40],
        [550, yTop + 16, zf + 160],
        [550, fusiblePrincipal.y + fusiblePrincipal.sy, zf + 160],
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
        [530, yb + 20, zf + 180],
        [530, yb + 20, zf + 212],
        [60, yb + 20, zf + 212],
        [60, yb + 25, inversor.z],
      ],
      nota: 'Cable corto y grueso. El inversor es el consumo más fuerte del sistema.',
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
        [T[0], yTop, zf + 90],
        [T[0], yTop + 24, zf + 90],
        [560, yTop + 24, zf + 90],
        [560, fusibles.y + fusibles.sy, zf + 90],
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
        [612, fusibles.y + fusibles.sy, zf + 85],
        [612, 420, zf + 85],
        [600, 420, zf + 85],
      ],
      nota: 'Directo a la caja de fusibles, sin pasar por interruptor.',
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
        [612, fusibles.y + fusibles.sy, zf + 50],
        [612, panelSwitches.y + 5, zf + 50],
        [640, panelSwitches.y + 5, zf + 50],
        [640, panelSwitches.y + 5, zf],
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
        [700, panelSwitches.y + panelSwitches.sy, zf - 13],
        [700, yTecho - 12, zf - 13],
        [700, yTecho - 12, zLed0 + largoLed],
        [led.x1, yTecho - 12, zLed0 + largoLed],
        [led.x1, yTecho - 8, zLed0 + largoLed],
      ],
      nota: 'Sube por una canaleta pegada al frente del mueble y sigue por el techo.',
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
        [715, panelSwitches.y + panelSwitches.sy, zf - 13],
        [715, yTecho - 12, zf - 13],
        [715, yTecho - 12, zLed0 + largoLed + 12],
        [led.x2, yTecho - 12, zLed0 + largoLed + 12],
        [led.x2, yTecho - 8, zLed0 + largoLed],
      ],
      nota: 'Comparte la canaleta con el cable de la otra tira.',
    },
    {
      id: 'c_panel_extractor',
      nombre: 'Panel al extractor de techo',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'extractor',
      video: 'extractor',
      corriente: 'extractor',
      puntos: [
        [730, panelSwitches.y + panelSwitches.sy, zf - 13],
        [730, yTecho - 20, zf - 13],
        [730, yTecho - 20, extractor.z + extractor.sz / 2],
        [extractor.x + extractor.sx / 2, yTecho - 15, extractor.z + extractor.sz / 2],
      ],
      nota: 'Pasar el cable por el costado del techo, nunca por el medio.',
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
        [745, panelSwitches.y + 5, zf],
        [745, panelSwitches.y + 5, zf + 30],
        [770, panelSwitches.y + 5, zf + 30],
        [770, 560, zf + 30],
        [770, 560, zf + 55],
      ],
      nota: 'Entra a la sección central por detrás del frente y baja hasta la bomba.',
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
        [655, panelSwitches.y + 40, zf],
        [655, panelSwitches.y + 40, zb - 18],
        [655, yb + 50, zb - 18],
        [60, yb + 50, zb - 18],
        [60, yb + 50, inversor.z + inversor.sz + 1],
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
        [300, yb + 60, inversor.z],
        [300, yb + 60, zf + 208],
        [650, yb + 60, zf + 208],
        [650, 640, zf + 208],
        [650, 640, zf],
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
        [650, 640, zf + 30],
        [736, 640, zf + 30],
        [736, 640, zf],
      ],
      nota: 'Misma línea de 230 V.',
    },
  ];

  // --- Mangueras de agua ---
  const bid2 = { x: 830, y: 460, z: zf + 287 };
  const mangueras = [
    {
      id: 'm_bidon_bomba',
      nombre: 'Manguera del bidón a la bomba',
      tipo: 'agua',
      desde: 'bidon2',
      hasta: 'bomba',
      video: 'bomba',
      puntos: [
        [bid2.x, bid2.y, bid2.z],
        [bid2.x, 540, bid2.z],
        [bid2.x, 540, zf + 127],
      ],
      nota: 'Manguera de grado alimenticio. Unir los dos bidones en paralelo con una T.',
    },
    {
      id: 'm_bomba_canilla',
      nombre: 'Manguera de la bomba a la canilla',
      tipo: 'agua',
      desde: 'bomba',
      hasta: 'canilla',
      video: 'canilla',
      puntos: [
        [805, 577, zf + 90],
        [805, 760, zf + 90],
        [565, 760, zf + 90],
        [565, 760, zb - 30],
        [565, tr.alto - 15, zb - 30],
      ],
      nota: 'Sube por la sección central, cruza el divisor por un agujero y llega a la canilla.',
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
    { nombre: 'Pasacables en el mamparo', x: xCab - 14, y: yb + 2, z: zb - 4, sx: 40, sy: 30, sz: 18, color: '#212121' },
  ];

  return { equipos, cables, mangueras, escenario, decos };
}
