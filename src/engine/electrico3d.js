// Sistema eléctrico en 3D: equipos con posición, cables como polilíneas y escenario
// (puerta lateral, vigas y asientos). Todo en mm con los mismos ejes que los muebles.
//
// Camino de la energía:
//   batería del auto (bajo el asiento del acompañante) -> fusible ANL -> cable largo por el piso bajo los asientos
//   -> hueco inferior del mamparo -> DC-DC -> disyuntor 1 (120 A) -> batería de 150 Ah -> fusible principal -> inversor -> enchufes
//   batería -> disyuntor 2 (120 A) -> caja de fusibles de 12 salidas -> heladera y panel de 5 interruptores -> 4 tiras LED,
//   lámpara flexible, bomba y mando del inversor; y una salida propia de 5 A al termostato del calefactor de la batería
//   (almohadilla bajo la batería sobre una plancha aislante, con la sonda pegada a la batería)
//
// Todo lo eléctrico del mueble está en la sección izquierda (E), al piso y bajo el plano de la cama, con la
// batería (bornes arriba). El tablero con interruptores y enchufes queda sobre la cama, en el frente de esa misma
// sección. Los cables del tablero van por el hueco que queda entre el estante y los cajones de cocina.
// El extractor del techo no tiene conexión: se deja en el 3D para ubicar las luces. Las 4 tiras LED van del mismo inicio
// al mismo fin: las dos centrales a cada lado del extractor (interruptor 1) y las dos laterales cerca de las paredes
// (interruptor 2). La lámpara flexible (interruptor 3) está en la pared izquierda, sobre la viga: su cable va por el
// techo y baja por la viga.

import { disposicionTrasero } from './disposicion.js';

export const GRUPO_ELEC = 'Eléctrico';

export function electrico3d(cfg) {
  const { van, equipos: eq, vehiculo: ve, led, extractor: ex, lampara: lamp } = cfg;
  const L = disposicionTrasero(cfg);
  const { zF, zFL, zB: zb, zFondo, yTapa, sec, E, K, W } = L;
  const bomba = W.bomba;
  const EN = 'Mueble trasero';

  const caja = (id, nombre, x, y, z, sx, sy, sz, extra) => ({ id, nombre, grupo: GRUPO_ELEC, x, y, z, sx, sy, sz, ...extra });

  // --- Equipos dentro de la sección E (eléctrica), todos al piso ---
  const b = E.bateria;
  const bateria = caja('bateria', 'Batería de litio 150 Ah', b.x, b.y, b.z, b.sx, b.sy, b.sz, {
    en: EN,
    color: '#1565c0',
    nota: 'Sección eléctrica (izquierda), al piso, contra el fondo y bajo el plano de la cama',
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

  // --- Disyuntores de 120 A de rearme manual (pack de 2) ---
  const c1 = E.cb1;
  const c2 = E.cb2;
  const cortacircuitos1 = caja('cortacircuitos1', 'Disyuntor 120 A (DC-DC a batería)', c1.x, c1.y, c1.z, c1.sx, c1.sy, c1.sz, {
    en: EN,
    color: '#212121',
    estado: 'Falta comprar (se vende en pack de 2, con terminales de ojal)',
    nota: 'Al piso, delante de la batería, con la palanca hacia arriba. Corta a mano la línea del DC-DC a la batería',
  });
  const cortacircuitos2 = caja('cortacircuitos2', 'Disyuntor 120 A (batería a caja de fusibles)', c2.x, c2.y, c2.z, c2.sx, c2.sy, c2.sz, {
    en: EN,
    color: '#212121',
    estado: 'Falta comprar (se vende en pack de 2, con terminales de ojal)',
    nota: 'Al piso, delante de la batería, al lado del primero. Corta a mano todo lo de 12 V que reparte la caja de fusibles',
  });

  // --- Calefactor de la batería contra el frío: aislante, almohadilla y termostato con sonda ---
  const ai = E.aislante;
  const aislante = caja('aislante', 'Aislante bajo la batería (espuma 10 mm)', ai.x, ai.y, ai.z, ai.sx, ai.sy, ai.sz, {
    en: EN,
    color: '#fdd835',
    estado: 'Falta comprar',
    nota: 'Plancha de espuma aislante de 10 mm entre el piso y la almohadilla; sobresale unos 5 mm a los costados y 15 mm al frente',
  });
  const ca = E.calefactor;
  const calefactor = caja('calefactor', 'Almohadilla calefactora 12 V (30 W)', ca.x, ca.y, ca.z, ca.sx, ca.sy, ca.sz, {
    en: EN,
    color: '#d84315',
    estado: 'Falta comprar',
    nota: 'Plana, bajo la cara de abajo de la batería (queda tapada por ella), sobre el aislante',
  });
  const te = E.termostato;
  const termostato = caja('termostato', 'Termostato con sonda (enciende a 4, apaga a 10 grados)', te.x, te.y, te.z, te.sx, te.sy, te.sz, {
    en: EN,
    color: '#1b5e20',
    estado: 'Falta comprar',
    nota: 'Al piso, delante de la batería. La sonda va pegada al costado de la batería, lejos de la almohadilla',
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

  // --- Techo: cuatro tiras LED y el extractor (sin conexión) ---
  const yTecho = van.alto;
  const zLed0 = 250;
  const largoLed = led.largoM * 1000;
  const tira = (id, n, xc, nota) =>
    caja(id, `Tira LED ${led.largoM} m (${n})`, xc - 10, yTecho - 8, zLed0, 20, 8, largoLed, { color: '#fff59d', emisivo: true, nota });
  const ledA = tira('ledA', 1, led.x1, 'Techo, central izquierda: pasa por el costado de la claraboya, a 6 cm del marco');
  const ledB = tira('ledB', 2, led.x2, 'Techo, central derecha: pasa por el otro costado de la claraboya, a 6 cm del marco');
  const ledC = tira('ledC', 3, led.x3, 'Techo, lateral izquierda, cerca de la pared de la cama');
  const ledD = tira('ledD', 4, led.x4, 'Techo, lateral derecha, cerca de la pared del mueble derecho');
  const extractor = caja('extractor', 'Extractor de techo (sin conexión)', ex.x - ex.marco / 2, yTecho - 25, ex.z - ex.marco / 2, ex.marco, 25, ex.marco, {
    color: '#cfd8dc',
    nota: `Se abre a mano, sin ventilador. Hueco ${ex.hueco} mm, con el marco ${ex.marco} mm`,
  });

  // --- Lámpara flexible en la pared izquierda, sobre la viga sin aislar, a la altura del pecho de quien está acostado ---
  const lm = eq.lampara;
  const xViga = 22; // la viga sobresale 22 mm de la pared
  const zL = lamp.z;
  const yL = lamp.y; // centro de la base
  const lampara = caja('lampara', 'Lámpara flexible de lectura 12 V', xViga, yL - lm.y / 2, zL - lm.z / 2, lm.x, lm.y, lm.z, {
    color: '#212121',
    nota: 'Pared izquierda, sobre la viga sin aislar de 22 cm que queda entre el pasarruedas y la puerta; a la altura del pecho al estar acostado',
  });
  const yTopeL = lampara.y + lampara.sy; // cara de arriba de la base: ahí entra el cable

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
    bateria, fusibles, fusiblePrincipal, inversor, dcdc, cortacircuitos1, cortacircuitos2, aislante, calefactor, termostato,
    panelSwitches, enchufe1, enchufe2,
    ledA, ledB, ledC, ledD, lampara, extractor, bateriaAuto, anlCaja,
  ];

  // --- Cables (puntos en mm). tipo: dc | ac | senal | agua | gas ---
  const zA = ve.bateriaZ - 10; // cota z del fusible ANL del auto
  const xTerm = bateriaAuto.x + 20; // borne positivo de la batería del auto
  const xEnt = sec.E.x1 - 17; // por donde entra el cable largo al mueble, entre el ANL y el divisor
  const yEnt = 60; // altura de la entrada: pasa por el hueco de 100 mm bajo la curva del mamparo
  const zUnder = 2600; // recorrido bajo los asientos
  const zRutaLargo = Math.max(iv.z + iv.sz, dcdc.z + dcdc.sz) + 42; // el cable largo pasa por detrás de los equipos del frente
  const yCan = yTecho - 12; // cota de los cables en el techo
  const zFinA = zLed0 + largoLed;
  const xCeil = xViga + 90; // por el techo el cable de la lámpara corre cerca de la pared izquierda, antes de bajar por la viga
  const zAtras = zFondo - 5; // pegado al fondo del mueble
  const zTr = zFL + 2; // cara trasera del tablero
  const yHueco = 505; // altura de los cables del tablero en el hueco entre el estante y los cajones
  const yBajo = iv.y + iv.sy + 1; // por encima de los equipos de la fila del frente
  const xPan = panelSwitches.x;
  const yAlto = dcdc.y + dcdc.sy + 14; // los cables del DC-DC pasan por encima de la caja de fusibles
  const yCaja = 100; // el cable del segundo disyuntor a la caja de fusibles pasa por encima de ellos
  const yCalef = 115; // el cable de la caja al termostato pasa por encima de los disyuntores
  const zCalef = E.cb1.z - 5;
  const xCalef = ca.x + ca.sx - 8; // por donde el cable del termostato entra a la almohadilla
  const yBat = b.y;

  const cables = [
    {
      id: 'c_auto_anl',
      nombre: 'Positivo de la batería del auto al fusible ANL',
      tipo: 'dc',
      desde: 'bateriaAuto',
      hasta: 'anl',
      video: 'anl',
      corriente: 'dcdcEntrada',
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
      corriente: 'dcdcEntrada',
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
        [xEnt, 95, zRutaLargo],
        [dcdc.x + dcdc.sx / 2, 95, zRutaLargo],
        [dcdc.x + dcdc.sx / 2, 95, dcdc.z + dcdc.sz + 2],
      ],
      nota: 'Va por el piso bajo los asientos, cruza de lado a lado, entra al mueble por el hueco de 10 cm bajo la curva del mamparo (con pasacables en el fondo) y sigue pegado al piso, detrás del inversor, hasta la parte de atrás del DC-DC.',
    },
    {
      id: 'c_dcdc_cb1',
      nombre: 'DC-DC al disyuntor 1',
      tipo: 'dc',
      desde: 'dcdc',
      hasta: 'cortacircuitos1',
      video: 'dcdc',
      corriente: 'dcdc',
      puntos: [
        [dcdc.x + 18, dcdc.y + dcdc.sy + 1, dcdc.z + 30],
        [dcdc.x + 18, yAlto, dcdc.z + 30],
        [dcdc.x + 18, yAlto, c1.z + 20],
        [c1.x + 62, yAlto, c1.z + 20],
        [c1.x + 62, c1.y + c1.sy + 1, c1.z + 20],
      ],
      nota: 'Salida del DC-DC al primer disyuntor, pasando por encima de la caja de fusibles. Usar el mismo calibre que la entrada.',
    },
    {
      id: 'c_cb1_bat',
      nombre: 'Disyuntor 1 a la batería',
      tipo: 'dc',
      desde: 'cortacircuitos1',
      hasta: 'bateria',
      video: 'dcdc',
      corriente: 'dcdc',
      sinFusible: true,
      puntos: [
        [c1.x + 18, c1.y + c1.sy + 1, c1.z + 50],
        [c1.x + 18, yTP + 22, c1.z + 50],
        [c1.x + 18, yTP + 22, zTP + 30],
        [xTP, yTP + 22, zTP + 30],
        [xTP, yTP + 1, zTP + 30],
      ],
      nota: 'Del disyuntor al borne positivo de la batería, por encima de ella. El fusible de esta línea es el del tramo anterior.',
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
      id: 'c_bat_cb2',
      nombre: 'Batería al disyuntor 2',
      tipo: 'dc',
      desde: 'bateria',
      hasta: 'cortacircuitos2',
      video: 'fusibles',
      corriente: 'carga12',
      puntos: [
        [xTP, yTP + 1, zTP + 15],
        [xTP, yTP + 47, zTP + 15],
        [c2.x + 62, yTP + 47, zTP + 15],
        [c2.x + 62, yTP + 47, c2.z + 20],
        [c2.x + 62, c2.y + c2.sy + 1, c2.z + 20],
      ],
      nota: 'Alimenta todo lo de 12 V que no pasa por el inversor. Va por encima de la batería, bajo el estante, hasta el segundo disyuntor.',
    },
    {
      id: 'c_cb2_caja',
      nombre: 'Disyuntor 2 a la caja de fusibles',
      tipo: 'dc',
      desde: 'cortacircuitos2',
      hasta: 'fusibles',
      video: 'fusibles',
      corriente: 'carga12',
      sinFusible: true,
      puntos: [
        [c2.x + 18, c2.y + c2.sy + 1, c2.z + 50],
        [c2.x + 18, yCaja, c2.z + 50],
        [c2.x + 18, yCaja, fusibles.z + 70],
        [fusibles.x + fusibles.sx / 2 - 30, yCaja, fusibles.z + 70],
        [fusibles.x + fusibles.sx / 2 - 30, fusibles.y + fusibles.sy + 1, fusibles.z + 70],
      ],
      nota: 'Del disyuntor a la entrada de la caja de fusibles (12 salidas, cada una con su negativo individual). El fusible de esta línea es el del tramo anterior.',
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
      nombre: 'Panel a tira LED 1 (central izquierda)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledA',
      video: 'ledA',
      corriente: 'ledA',
      puntos: [
        [xPan + 10, yHueco + 15, zTr],
        [xPan + 10, yHueco + 15, zAtras - 10],
        [xPan + 10, yCan, zAtras - 10],
        [xPan + 10, yCan, zFinA],
        [led.x1, yCan, zFinA],
        [led.x1, yTecho - 8, zFinA],
      ],
      nota: 'Interruptor 1 (luces centrales). Va por el hueco sobre el estante hasta el fondo del mueble, sube por atrás de los cajones, atraviesa la tapa por un pasacables y sigue por el techo hasta el extremo de la tira.',
    },
    {
      id: 'c_panel_ledB',
      nombre: 'Panel a tira LED 2 (central derecha)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledB',
      video: 'ledB',
      corriente: 'ledB',
      puntos: [
        [xPan + 24, yHueco + 15, zTr],
        [xPan + 24, yHueco + 15, zAtras - 5],
        [xPan + 24, yCan, zAtras - 5],
        [xPan + 24, yCan, zFinA + 12],
        [led.x2, yCan, zFinA + 12],
        [led.x2, yTecho - 8, zFinA],
      ],
      nota: 'Interruptor 1, igual que la tira 1: los dos cables salen del mismo borne del interruptor. Comparte el recorrido y el pasacables de la tapa con los otros cables de luz.',
    },
    {
      id: 'c_panel_ledC',
      nombre: 'Panel a tira LED 3 (lateral izquierda)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledC',
      video: 'ledC',
      corriente: 'ledC',
      puntos: [
        [xPan + 38, yHueco + 15, zTr],
        [xPan + 38, yHueco + 15, zAtras],
        [xPan + 38, yCan, zAtras],
        [xPan + 38, yCan, zFinA + 24],
        [led.x3, yCan, zFinA + 24],
        [led.x3, yTecho - 8, zFinA],
      ],
      nota: 'Interruptor 2 (luces laterales). Mismo recorrido que las otras tiras: sube por el fondo del mueble y llega por el extremo de la tira.',
    },
    {
      id: 'c_panel_ledD',
      nombre: 'Panel a tira LED 4 (lateral derecha)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'ledD',
      video: 'ledD',
      corriente: 'ledD',
      puntos: [
        [xPan + 52, yHueco + 15, zTr],
        [xPan + 52, yHueco + 15, zAtras - 15],
        [xPan + 52, yCan, zAtras - 15],
        [xPan + 52, yCan, zFinA + 36],
        [led.x4, yCan, zFinA + 36],
        [led.x4, yTecho - 8, zFinA],
      ],
      nota: 'Interruptor 2, igual que la tira 3. Cruza el techo de lado a lado por detrás de las tiras, antes de que empiecen, hasta el lado del mueble derecho.',
    },
    {
      id: 'c_panel_lampara',
      nombre: 'Panel a la lámpara flexible (pared izquierda)',
      tipo: 'dc',
      desde: 'panelSwitches',
      hasta: 'lampara',
      video: 'lampara',
      corriente: 'lampara',
      puntos: [
        [xPan + 66, yHueco + 15, zTr],
        [xPan + 66, yHueco + 15, zAtras - 20],
        [xPan + 66, yCan, zAtras - 20],
        [xCeil, yCan, zAtras - 20],
        [xCeil, yCan, zL + 22],
        [xViga + 2, yCan, zL + 22],
        [xViga + 2, yTopeL + 1, zL + 22],
      ],
      nota: 'Interruptor 3. Sube con los cables de las tiras, cruza el techo hacia la pared izquierda, sigue por el techo hasta la altura de la viga de 22 cm y baja pegado a ella hasta la lámpara. La viga no está aislada: el cable va dentro de una canaleta o funda corrugada, bien sujeto.',
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
      id: 'c_caja_calef',
      nombre: 'Caja de fusibles al termostato del calefactor',
      tipo: 'dc',
      desde: 'fusibles',
      hasta: 'termostato',
      video: 'fusibles',
      corriente: 'calef',
      puntos: [
        [fusibles.x + fusibles.sx - 10, fusibles.y + fusibles.sy + 1, fusibles.z + 40],
        [fusibles.x + fusibles.sx - 10, yCalef, fusibles.z + 40],
        [fusibles.x + fusibles.sx - 10, yCalef, zCalef],
        [te.x + te.sx / 2, yCalef, zCalef],
        [te.x + te.sx / 2, yCalef, te.z + te.sz / 2],
        [te.x + te.sx / 2, te.y + te.sy + 1, te.z + te.sz / 2],
      ],
      nota: 'Salida propia de la caja de fusibles con fusible de 5 A. Sin interruptor: el termostato decide cuándo se enciende.',
    },
    {
      id: 'c_termo_calef',
      nombre: 'Termostato a la almohadilla calefactora',
      tipo: 'dc',
      desde: 'termostato',
      hasta: 'calefactor',
      video: 'fusibles',
      corriente: 'calef',
      sinFusible: true,
      puntos: [
        [xCalef, te.y + 20, te.z + te.sz + 1],
        [xCalef, ca.y + ca.sy / 2, te.z + te.sz + 6],
        [xCalef, ca.y + ca.sy / 2, ca.z + 4],
      ],
      nota: 'Cable corto por el piso, entre el aislante y la batería, hasta la almohadilla. Lo protege el fusible de 5 A de la caja.',
    },
    {
      id: 'c_termo_sonda',
      nombre: 'Sonda del termostato a la batería',
      tipo: 'senal',
      desde: 'termostato',
      hasta: 'bateria',
      video: 'fusibles',
      corriente: 'senal',
      puntos: [
        [te.x + 15, te.y + te.sy + 1, te.z + te.sz / 2],
        [te.x + 15, yBat + 130, te.z + te.sz / 2],
        [te.x + 15, yBat + 130, b.z - 1],
      ],
      nota: 'La sonda se pega con cinta térmica al costado de la batería que mira al frente, a media altura, lejos de la almohadilla, para medir la temperatura de la batería y no la del calefactor.',
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
  const xBombaC = W.xBomba + W.bomba.sx / 2; // centro de la bomba
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
    { nombre: 'Viga sin aislar (izquierda)', x: 0, y: 0, z: zPuerta0 - pl.vigas, sx: 22, sy: van.alto, sz: pl.vigas, color: '#a1887f', opacidad: 0.4 },
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
    // Cuello flexible y cabeza de la lámpara: apuntan hacia la cama
    { nombre: 'Cuello flexible de la lámpara', x: xViga + lm.x / 2 - 4, y: yTopeL, z: zL - 4, sx: 8, sy: 140, sz: 8, color: '#424242' },
    { nombre: 'Cabeza de la lámpara', x: xViga + lm.x / 2 - 4, y: yTopeL + 125, z: zL - 15, sx: 55, sy: 30, sz: 30, color: '#212121' },
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

  return { equipos, cables, mangueras, escenario, decos, decosElec };
}
