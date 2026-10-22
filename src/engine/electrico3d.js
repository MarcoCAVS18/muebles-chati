// Sistema eléctrico en 3D: equipos con posición, cables como polilíneas y escenario
// (puerta lateral, vigas y asientos). Todo en mm con los mismos ejes que los muebles.
//
// Camino de la energía:
//   batería del auto (bajo el asiento del acompañante) -> fusible ANL -> cable largo por el piso bajo los asientos
//   -> hueco inferior del mamparo -> DC-DC -> batería de 150 Ah -> fusible principal -> inversor -> enchufes
//   batería -> caja de fusibles -> heladera y panel de 5 interruptores -> 3 tiras LED, bomba y mando del inversor
//
// Todo lo eléctrico del mueble está en la sección izquierda (E), al piso y bajo el plano de la cama, con la
// batería acostada. El tablero con interruptores y enchufes queda sobre la cama, en el frente de esa misma
// sección. Los cables del tablero van por el hueco que queda entre el estante y los cajones de cocina.
// El extractor del techo no tiene conexión: se deja en el 3D para ubicar las luces.

import { disposicionTrasero } from './disposicion.js';

export const GRUPO_ELEC = 'Eléctrico';

export function electrico3d(cfg) {
  const { van, equipos: eq, vehiculo: ve, led, extractor: ex } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zFL, zB: zb, zFondo, yTapa, sec, E, K, W } = L;
  const bomba = W.bomba;
  const EN = 'Mueble trasero';

  const caja = (id, nombre, x, y, z, sx, sy, sz, extra) => ({ id, nombre, grupo: GRUPO_ELEC, x, y, z, sx, sy, sz, ...extra });

  // --- Equipos dentro de la sección E (eléctrica), todos al piso ---
  const b = E.bateria;
  const bateria = caja('bateria', 'Batería de litio 150 Ah (acostada)', b.x, b.y, b.z, b.sx, b.sy, b.sz, {
    en: EN,
    color: '#1565c0',
    nota: 'Sección eléctrica (izquierda), al piso, acostada contra el fondo y bajo el plano de la cama',
  });
  const xTP = E.borne.x; // borne positivo (extremo derecho de la batería)
  const yTP = E.borne.y;
  const zTP = E.borne.z; // z del primer cable que sale del borne; los otros van más atrás

  const iv = E.inversor;
  const inversor = caja('inversor', 'Inversor 12 V a 230 V', iv.x, iv.y, iv.z, iv.sx, iv.sy, iv.sz, {
    en: EN,
    color: '#455a64',
    nota: 'Ya comprado. Al piso, detrás de la puerta de la sección eléctrica, contra el divisor de la cocina',
  });
  const an = E.anl;
  const fusiblePrincipal = caja('fusiblePrincipal', 'Fusible principal del inversor', an.x, an.y, an.z, an.sx, an.sy, an.sz, {
    en: EN,
    color: '#ffb300',
    nota: 'Al piso, pegado al extremo de la batería donde está el borne positivo y detrás del inversor',
  });
  const fs = E.fusibles;
  const fusibles = caja('fusibles', 'Caja de fusibles', fs.x, fs.y, fs.z, fs.sx, fs.sy, fs.sz, {
    en: EN,
    color: '#ef6c00',
    nota: 'Reparte la energía de 12 V. Al piso, junto a la puerta, para llegar rápido al panel y a la heladera',
  });
  const dd = E.dcdc;
  const dcdc = caja('dcdc', 'Cargador DC-DC', dd.x, dd.y, dd.z, dd.sx, dd.sy, dd.sz, {
    en: EN,
    color: '#00897b',
    nota: 'Carga la batería de 150 Ah desde la del auto. Al piso, entre la caja de fusibles y el inversor',
  });

  // --- Tablero en el frente de la sección eléctrica, sobre la cama ---
  const ps = eq.panelSwitches;
  const ench = eq.enchufe;
  const yTab = L.yCamaSup + 45; // sobre la cama, entre la cama y el primer cajón de cocina
  const panelSwitches = caja('panelSwitches', 'Panel de 5 interruptores', fusibles.x + 3, yTab + 5, zFL - ps.z, ps.x, ps.y, ps.z, {
    color: '#263238',
    nota: 'En el tablero del frente de la sección eléctrica, sobre la cama, arriba de la caja de fusibles',
  });
  const enchufe1 = caja('enchufe1', 'Enchufe 230 V con USB-C (1)', inversor.x, yTab, zFL - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el tablero del frente de la sección eléctrica, arriba del inversor',
  });
  const enchufe2 = caja('enchufe2', 'Enchufe 230 V con USB-C (2)', inversor.x + ench.x + 8, yTab, zFL - ench.z, ench.x, ench.y, ench.z, {
    color: '#eceff1',
    nota: 'En el tablero del frente de la sección eléctrica, al lado del primero',
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
  const zA = ve.bateriaZ - 10; // cota z del fusible ANL del auto
  const xTerm = bateriaAuto.x + 20; // borne positivo de la batería del auto
  const xEnt = sec.E.x1 - 17; // por donde entra el cable largo al mueble, entre el ANL y el divisor
  const yEnt = 60; // altura de la entrada: pasa por el hueco de 100 mm bajo la curva del mamparo
  const zUnder = 2600; // recorrido bajo los asientos
  const yCan = yTecho - 12; // cota de los cables en el techo
  const zFinA = zLed0 + largoLed;
  const zAtras = zFondo - 5; // pegado al fondo del mueble
  const zTr = zFL + 2; // cara trasera del tablero
  const yHueco = 505; // altura de los cables del tablero en el hueco entre el estante y los cajones
  const yBajo = iv.y + iv.sy + 1; // por encima de los equipos de la fila del frente
  const xPan = panelSwitches.x;

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
        [xEnt, 30, zUnder],
        [xEnt, 30, zb + 8],
        [xEnt, yEnt, zb + 8],
        [xEnt, yEnt, zFondo - 6],
        [xEnt, 95, zFondo - 6],
        [xEnt, 95, iv.z + iv.sz + 42],
        [dcdc.x + dcdc.sx / 2, 95, iv.z + iv.sz + 42],
        [dcdc.x + dcdc.sx / 2, 95, dcdc.z + dcdc.sz + 2],
      ],
      nota: 'Va por el piso bajo los asientos, cruza de lado a lado, entra al mueble por el hueco de 10 cm bajo la curva del mamparo (con pasacables en el fondo) y sigue pegado al piso, detrás del inversor, hasta la parte de atrás del DC-DC.',
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
        [dcdc.x + 18, dcdc.y + dcdc.sy + 1, dcdc.z + 30],
        [dcdc.x + 18, yTP + 22, dcdc.z + 30],
        [dcdc.x + 18, yTP + 22, zTP + 30],
        [xTP, yTP + 22, zTP + 30],
        [xTP, yTP + 1, zTP + 30],
      ],
      nota: 'Salida del DC-DC al borne de la batería, por encima de ella. Usar el mismo calibre que la entrada.',
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
        [xTP, yTP + 1, zTP],
        [xTP, yTP + 22, zTP],
        [fusiblePrincipal.x + fusiblePrincipal.sx / 2, yTP + 22, zTP],
        [fusiblePrincipal.x + fusiblePrincipal.sx / 2, fusiblePrincipal.y + fusiblePrincipal.sy + 1, zTP],
      ],
      nota: 'Fusible lo más cerca posible del borne positivo: baja directo a la tapa del fusible, a unos 30 cm.',
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
        [fusiblePrincipal.x + fusiblePrincipal.sx / 2, 58, fusiblePrincipal.z - 1],
        [fusiblePrincipal.x + fusiblePrincipal.sx / 2, 58, inversor.z + inversor.sz + 1],
      ],
      nota: 'Cable corto y grueso, del fusible a la parte de atrás del inversor. Es el consumo más fuerte del sistema.',
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
        [xTP, yTP + 1, zTP + 15],
        [xTP, yTP + 47, zTP + 15],
        [xTP, yTP + 47, fusibles.z + 70],
        [fusibles.x + fusibles.sx / 2 - 30, yTP + 47, fusibles.z + 70],
        [fusibles.x + fusibles.sx / 2 - 30, fusibles.y + fusibles.sy + 1, fusibles.z + 70],
      ],
      nota: 'Alimenta todo lo de 12 V que no pasa por el inversor. Va por encima de los equipos, bajo el estante.',
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
        [fusibles.x + fusibles.sx / 2 + 20, fusibles.y + fusibles.sy + 1, fusibles.z + 125],
        [fusibles.x + fusibles.sx / 2 + 20, 200, fusibles.z + 125],
        [fusibles.x + fusibles.sx / 2 + 20, 200, zF + 85],
        [sec.K.x0 + 8, 200, zF + 85],
        [sec.K.x0 + 8, 200, K.zNeveraFondo + 15],
        [K.xHeladera + 60, 200, K.zNeveraFondo + 15],
        [K.xHeladera + 60, 200, K.zNeveraFondo + 1],
      ],
      nota: 'Pasa el divisor por un agujero con pasacables, sigue por el costado de la heladera y entra por atrás. Sin interruptor.',
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
        [fusibles.x + 30, fusibles.y + fusibles.sy + 1, fusibles.z + 15],
        [fusibles.x + 30, yHueco, fusibles.z + 15],
        [fusibles.x + 30, yHueco, zTr],
      ],
      nota: 'Un solo cable de entrada al panel, sube por un pasacables del estante; de ahí salen los 5 interruptores.',
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
        [xPan + 20, yHueco + 15, zTr],
        [xPan + 20, yHueco + 15, zAtras - 10],
        [xPan + 20, yCan, zAtras - 10],
        [xPan + 20, yCan, zFinA],
        [led.x1, yCan, zFinA],
        [led.x1, yTecho - 8, zFinA],
      ],
      nota: 'Va por el hueco sobre el estante hasta el fondo del mueble, sube por atrás de los cajones, atraviesa la tapa por un pasacables y sigue por el techo hasta el extremo de la tira.',
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
        [xPan + 40, yHueco + 15, zTr],
        [xPan + 40, yHueco + 15, zAtras - 5],
        [xPan + 40, yCan, zAtras - 5],
        [xPan + 40, yCan, zFinA + 12],
        [led.x2, yCan, zFinA + 12],
        [led.x2, yTecho - 8, zFinA],
      ],
      nota: 'Comparte el recorrido y el pasacables de la tapa con los otros cables de luz.',
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
        [xPan + 60, yHueco + 15, zTr],
        [xPan + 60, yHueco + 15, zAtras],
        [xPan + 60, yCan - 14, zAtras],
        [ex.x + ex.marco / 2 + 85, yCan - 14, zAtras],
        [ex.x + ex.marco / 2 + 85, yCan - 14, zLed0 + largoC],
        [led.xC, yCan - 14, zLed0 + largoC],
        [led.xC, yTecho - 8, zLed0 + largoC],
      ],
      nota: 'Sube con los otros dos, cruza el techo por atrás, baja a lo largo del extractor por el costado y llega a la tira por el lado del extractor. El extractor no lleva cable.',
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
        [xPan + 80, yHueco + 30, zTr],
        [xPan + 80, yHueco + 30, zAtras],
        [xPan + 80, yTapa - 17, zAtras],
        [bomba.x + bomba.sx / 2, yTapa - 17, zAtras],
        [bomba.x + bomba.sx / 2, bomba.y + 60, zAtras],
        [bomba.x + bomba.sx / 2, bomba.y + 60, bomba.z + bomba.sz + 1],
      ],
      nota: 'Va por el hueco sobre el estante y por atrás de los cajones, y cruza los dos divisores por la parte alta del fondo con pasacables hasta la bomba. Es el tramo más largo de 12 V del mueble: pasa detrás del anafe, así que va dentro de una funda o canaleta y lejos del caño de gas.',
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
        [xPan + 100, yHueco, zTr],
        [xPan + 100, yHueco, zFL + 22],
        [xPan + 100, yBajo + 17, zFL + 22],
        [inversor.x + 100, yBajo + 17, zFL + 22],
        [inversor.x + 100, yBajo + 17, inversor.z + 15],
        [inversor.x + 100, yBajo - 1, inversor.z + 15],
      ],
      nota: 'Cable de señal de 2 hilos: el interruptor 5 enciende o apaga el inversor sin tocarlo. Baja por un pasacables del estante.',
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
        [inversor.x + 30, yBajo, inversor.z + 40],
        [inversor.x + 30, enchufe1.y + 25, inversor.z + 40],
        [inversor.x + 30, enchufe1.y + 25, zTr],
      ],
      nota: 'Cable de 3 hilos (fase, neutro y tierra) por un pasacables del estante. Siempre con disyuntor aguas abajo del inversor.',
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
        [enchufe1.x + 50, enchufe1.y + 50, zTr],
        [enchufe1.x + 50, enchufe1.y + 50, zTr + 25],
        [enchufe2.x + 40, enchufe2.y + 50, zTr + 25],
        [enchufe2.x + 40, enchufe2.y + 50, zTr],
      ],
      nota: 'Misma línea de 230 V.',
    },
  ];

  // --- Mangueras de agua y de gas ---
  const bid = eq.bidon;
  const bidon2x = W.xCajon + L.t + 2 + (bid.x + 10);
  const cuello = [bidon2x + bid.x / 2, W.yPisoBidones + bid.y, zF + 35 + bid.z - 40]; // boca del segundo bidón
  const reg = eq.regulador;
  const yRegulador = K.yCajonGas + L.tb + eq.garrafa.y; // base del regulador, sobre la garrafa
  const zRegulador = L.zIn + 15 + 10 + 80 + reg.z / 2; // centro del regulador en z
  const xBombaC = W.xBomba + 60; // centro de la bomba
  const xCanillaC = W.xCanilla + 15; // centro de la canilla
  const xValvula = sec.K.x1 - 80;
  const zB = zb;
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
        [W.xBomba + 120 + 1, 520, zF + 380],
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
        [xBombaC, 561, zF + 380],
        [xBombaC, 600, zF + 380],
        [W.xCanilla - 12, 600, zF + 380],
        [W.xCanilla - 12, 830, zF + 380],
        [xCanillaC, 830, zF + 380],
        [xCanillaC, 830, zB - 30],
        [xCanillaC, 851, zB - 30],
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
        [K.xCentro, yRegulador + reg.y + 1, zRegulador],
        [K.xCentro, 775, zRegulador],
        [xValvula, 775, zRegulador],
        [xValvula, 775, zF + 400],
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
        [xValvula, 781, zF + 400],
        [xValvula, 790, zF + 400],
        [xValvula, 790, zF + 340],
        [xValvula, 797, zF + 340],
      ],
      nota: 'Tramo corto y fijo hasta la entrada del anafe. Probar todas las uniones con agua jabonosa.',
    },
  ];

  // --- Escenario: puerta lateral, vigas y asientos ---
  // La mampara entre los asientos ya no está: solo queda su curva, con 10 cm libres abajo para los cables.
  const pl = van.puertaLateral;
  const zPuerta0 = van.largo - pl.desdeMamparo - pl.largo; // la puerta corrediza derecha termina 90 mm antes del mamparo
  const escenario = [
    { nombre: 'Puerta lateral corrediza derecha', x: van.ancho - 8, y: 0, z: zPuerta0, sx: 8, sy: 1100, sz: pl.largo, color: '#80cbc4', opacidad: 0.22 },
    { nombre: 'Vigas sin aislar (derecha)', x: van.ancho - 22, y: 0, z: zPuerta0 - pl.vigas, sx: 22, sy: van.alto, sz: pl.vigas, color: '#a1887f', opacidad: 0.4 },
    { nombre: 'Piso de la cabina', x: 0, y: -12, z: zb + 8, sx: van.ancho, sy: 12, sz: 900, color: '#6d5a44' },
    // Asiento del acompañante (lado derecho)
    { nombre: 'Asiento del acompañante - base', x: 1070, y: 330, z: zb + 120, sx: 560, sy: 120, sz: 480, color: '#37474f', opacidad: 0.35 },
    { nombre: 'Asiento del acompañante - respaldo', x: 1070, y: 450, z: zb + 20, sx: 560, sy: 620, sz: 130, color: '#37474f', opacidad: 0.35 },
    // Asiento del conductor (lado izquierdo)
    { nombre: 'Asiento del conductor - base', x: 150, y: 330, z: zb + 120, sx: 560, sy: 120, sz: 480, color: '#37474f', opacidad: 0.35 },
    { nombre: 'Asiento del conductor - respaldo', x: 150, y: 450, z: zb + 20, sx: 560, sy: 620, sz: 130, color: '#37474f', opacidad: 0.35 },
  ];
  const decos = [
    { nombre: 'Pasacables en el fondo del mueble', x: xEnt - 20, y: yEnt - 15, z: zFondo - 4, sx: 40, sy: 30, sz: 18, color: '#212121' },
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
