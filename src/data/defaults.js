// Configuración inicial. Todas las medidas en milímetros.
// Sistema de coordenadas de la van:
//   x = ancho (0 = pared izquierda, mirando desde la puerta trasera hacia los asientos)
//   y = alto (0 = piso)
//   z = largo (0 = puerta trasera, aumenta hacia los asientos; el mamparo está en z = largo)
//
// La distribución sigue la foto de referencia:
//   - Mueble trasero cruzado de pared a pared, pegado a la zona de los asientos (cabecera de la cama).
//     Vista desde la puerta trasera, de izquierda a derecha:
//       izquierda: electricidad al piso (batería, inversor, DC-DC, fusibles) y arriba interruptores,
//                  enchufes y la heladera, con la tapa a ras de la mesada; esta sección es la L: llega a 570 mm de profundidad
//       centro:    anafe angosto, dos cajones de cocina y la garrafa de gas fija al piso, detrás de una puerta
//       derecha:   grifo y fregadero, con dos bidones al piso (uno de agua limpia y uno de aguas grises)
//   - Cama extensible (71 a 120 cm) de plywood: dos módulos (120 y 60) con ventanas y dos placas en peine cuyas varillas salen al pasillo
//   - Mueble derecho con cajones, puerta bajo la mesa plegable y alacena alta

export const CONFIG_INICIAL = {
  // Medidas tomadas por Marco. Lo marcado como ESTIMADO hay que medirlo.
  van: {
    ancho: 1720,
    largo: 2410,
    alto: 1265, // 425 mm del pasarruedas más 840 mm hasta el techo construible
    margenTrasero: 170, // zona del cierre del baúl
    // Pasarruedas (medido): 800 mm de largo, 425 de alto y 185 de profundidad. De atrás hacia adelante:
    // 330 mm libres, pasarruedas, 220 mm de vigas sin aislar, puerta lateral de 980 mm y los asientos.
    archInicio: 320,
    archLargo: 800,
    archIntrusion: 185,
    archAlto: 425,
    // El izquierdo, con su tapa, queda a 38 cm para que se pueda estar sentado sobre el colchón. El real mide 425 mm:
    // la placa de la cama lleva un corte para que pase el arco (todavía no se dibuja).
    archAltoIzq: 380,
    // Puerta lateral derecha (corrediza): 980 mm de largo, empieza a 90 mm del mamparo
    puertaLateral: { desdeMamparo: 90, largo: 980, vigas: 220 },
    espacioMampara: 100, // la curva de la mampara (ya retirada) deja 100 mm libres abajo para pasar cables
  },

  materiales: {
    estructura: { nombre: 'Contrachapado 15 mm', t: 15, hojaL: 2440, hojaA: 1220, densidad: 680 },
    fondo: { nombre: 'Contrachapado 9 mm', t: 9, hojaL: 2440, hojaA: 1220, densidad: 640 },
  },

  listones: {
    l45x45: { nombre: 'Listón 45x45 mm', a: 45, b: 45, largo: 2400, densidad: 500 },
    l30x30: { nombre: 'Listón 30x30 mm', a: 30, b: 30, largo: 2400, densidad: 500 },
  },

  corte: { kerf: 3, recorte: 5, rotar: false },

  // Mueble cruzado detrás de los asientos, de pared a pared. Secciones de izquierda a derecha:
  // eléctrica (la L, más profunda), cocina y agua. Las posiciones x son la cara izquierda de cada
  // divisor (el divisor tiene el espesor de la placa).
  trasero: {
    ancho: 1560, // MEDIDO por Marco: libre, con aislación y revestimiento (solo vale para el mueble; el resto de la van sigue con 1720)
    profundidad: 500, // cocina y agua (el fregadero mide 400 mm de fondo)
    profundidadL: 570, // sección izquierda: llega hasta la cabecera de la cama
    alto: 850,
    zocalo: 20,
    // Interiores de 620 (eléctrica con la heladera arriba), 330 (cocina) y 550 (agua con los bidones girados): suman 1500
    divisor1: 635, // fin de la sección eléctrica
    divisor2: 980, // fin de la cocina
  },

  // Cama extensible de 71 a 120 cm, hecha con dos placas en peine: cada una se corta con ranuras abiertas hacia el pasillo y
  // los pedazos que salen de las ranuras son las varillas móviles. Cerrada parece una placa plana; abierta, las varillas
  // salen 49 cm y quedan intercaladas con los dedos de la placa
  cama: {
    x0: 10,
    ancho: 710, // cama cerrada
    extension: 490, // se agranda hasta 1200
    radio: 50, // radio de las esquinas
    largo: 1800, // largo de la cama, de pared a pared del mueble trasero: las dos tapas de los extremos están adentro
    plataforma: 400, // altura de la cara superior: pasarruedas izquierdo (380) + fieltro (5) + placa (15)
    fieltro: 5, // entre las placas y el pasarruedas izquierdo
    largoCabecera: 1200, // largo del módulo de la cabecera (el otro, de 600 mm, va al pie)
    // Peine: ranuras abiertas hacia el pasillo (el fondo lleva esquinas redondeadas). El ancho de cada ranura sale de la
    // cantidad de varillas; el dedo fijo que queda entre dos ranuras mide lo mismo (dedo: 1 = igual que la ranura)
    varillasPie: 4,
    varillasCabecera: 8,
    ranura: { dedo: 1, radio: 20 },
    lomo: 60, // lomo fijo contra la pared, de donde salen los dedos de la placa
    lomoMovil: 80, // lomo de las varillas, del lado del pasillo
    luzVarilla: 2, // luz de cada varilla dentro de su ranura, a cada lado
    alturaCorredera: 30, // alto máximo de las correderas: van al listón de 30 x 30 de las varillas
    // Ventanas de los costados (hueco de cada cajón): zócalo y cabezal son la madera que queda abajo y arriba
    // Ventanas de los costados, cerradas por una puerta que baja hasta el piso (bisagras de cazoleta abajo). margen = lo que
    // deja la ventana a cada lado; apoyoCajon = sección del listón de los refuerzos de piso
    ventana: { radio: 40, zocalo: 40, cabezal: 40, margen: 58, apoyoCajon: 45 },
  },

  // Mueble derecho: módulo de cajones (atrás), módulo con puerta bajo la mesa y alacena
  derecho: {
    profundidad: 400,
    largo: 1100,
    zocalo: 80,
    altoPuerta: 750, // altura del módulo de la mesa
    altoCajones: 870, // altura de la mesada de cajones
    largoCajones: 585,
    alacena: { profundidad: 300, base: 870, alto: 380 },
  },

  mesa: { ancho: 400 }, // con la cama de 71 cm cerrada quedan 600 mm de pasillo

  // Datos del vehículo (ESTIMADOS)
  vehiculo: {
    bateriaX: 1350, // centro de la batería del auto, bajo el asiento del acompañante
    bateriaZ: 2760,
    bateriaY: 130,
  },

  // Dimensiones de equipos en el orden de los ejes de la van (x ancho, y alto, z profundidad hacia el fondo del mueble).
  // MEDIDAS por Marco: batería, inversor, DC-DC, caja de fusibles, interruptores, enchufes y bomba (la bomba está en disposicion.js).
  // El resto sigue ESTIMADO: confirmar con cada ficha.
  equipos: {
    bateria: { x: 295, y: 280, z: 200 }, // 29,5 x 28 x 20 cm (ancho, alto, profundidad), bornes arriba
    fusibles: { x: 140, y: 50, z: 90 }, // caja de 9 x 14 cm (el alto es ESTIMADO); va apoyada con el lado de 14 cm hacia el fondo
    inversor: { x: 255, y: 190, z: 95 }, // 25,5 x 19 x 9,5 cm: de frente a la puerta de los equipos
    dcdc: { x: 185, y: 123, z: 67 }, // 18,5 x 12,3 x 6,7 cm: de frente a la puerta de los equipos
    // Bidón plano de 20 L con canilla (Camping4u / Scandihills). Va girado: el largo a lo ancho del cajón y los dos uno detrás del otro.
    // La canilla sobresale por el lado del largo (medida estimada con la foto: confirmar al llegar)
    bidon: { x: 416, y: 408, z: 203, canilla: 40 }, // largo, alto, grosor
    nevera: { x: 585, y: 350, z: 335 }, // Alpicool G22 de 25 L, de tapa arriba: 585 sin manijas (unos 598 con ellas), alto 350, fondo 335
    fregadero: { x: 340, y: 130, z: 400 }, // los 400 mm son el fondo; el ancho es ESTIMADO
    anafe: { x: 300, y: 70, z: 440 }, // ESTIMADO, a elegir: 2 hornallas empotradas de hasta 300 de ancho y 440 de fondo (la cocina mide 330 de ancho)
    garrafa: { x: 230, y: 330, z: 230 }, // garrafa chica recargable (ESTIMADA)
    regulador: { x: 70, y: 60, z: 70 },
    valvulaGas: { x: 40, y: 40, z: 40 },
    detectorGas: { x: 40, y: 50, z: 22 },
    bateriaAuto: { x: 278, y: 190, z: 175 },
    anl: { x: 60, y: 40, z: 40 },
    // Protección de la batería contra el frío (ESTIMADOS: confirmar con cada producto). Van debajo y al lado de la batería.
    calefactor: { x: 150, y: 3, z: 150 }, // almohadilla de silicona 12 V de 30 W, plana (x ancho, y espesor, z fondo)
    aislante: { x: 305, y: 10, z: 230 }, // plancha de espuma aislante bajo la almohadilla; sobresale de la batería
    termostato: { x: 60, y: 35, z: 22 }, // módulo con sonda: enciende a 4 grados y apaga a 10
    // Disyuntor de 120 A de rearme manual, de montaje en superficie (ESTIMADO: confirmar con el producto). Se monta con la cara hacia arriba
    cortacircuitos: { x: 80, y: 45, z: 70 },
    panelSwitches: { x: 165, y: 40, z: 25 }, // panel de 16,5 x 4 cm (la profundidad es ESTIMADA)
    enchufe: { x: 50, y: 50, z: 25 }, // 5 x 5 cm (la profundidad es ESTIMADA)
    lampara: { x: 25, y: 60, z: 60 }, // base de la lámpara flexible (profundidad, alto, ancho); el cuello y la cabeza se ven aparte
  },

  // Cuatro tiras de 2 m en el techo, todas con el mismo inicio y fin: dos centrales a 6 cm del marco del extractor
  // (una a cada lado) y dos laterales cerca de las paredes. x es el centro de cada tira.
  led: { tiras: 4, largoM: 2, wPorM: 9.6, x1: 635, x2: 1085, x3: 250, x4: 1470 },

  // Lámpara flexible de lectura, en la pared izquierda sobre la viga sin aislar (la de 22 cm entre el pasarruedas y la
  // puerta). z es el centro de la lámpara desde la puerta trasera e y la altura de la base: más o menos el pecho de
  // quien está acostado (cama a 39,5 cm, colchón y unos 20 cm más). El cable llega por el techo y baja por la viga.
  lampara: { z: 1230, y: 680 },

  // Ventilación de techo: se abre a mano, no tiene conexión eléctrica ni ventilador
  extractor: { x: 860, z: 1650, hueco: 280, marco: 310 },
};

// Consumos ESTIMADOS: editar con los valores reales de cada producto.
export const CARGAS_INICIALES = [
  { id: 'nevera', nombre: 'Heladera compresor 12 V', w: 45, horas: 24, ciclo: 0.35, tipo: '12V' },
  { id: 'ledA', nombre: 'Tira LED 1 del techo (central izquierda, 2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'ledB', nombre: 'Tira LED 2 del techo (central derecha, 2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'ledC', nombre: 'Tira LED 3 del techo (lateral izquierda, 2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'ledD', nombre: 'Tira LED 4 del techo (lateral derecha, 2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  // 3 W de luz más 10 W de la salida USB (5 V, 2 A) a máxima carga; se prende pocas horas
  { id: 'lampara', nombre: 'Lámpara flexible de lectura 12 V (pared izquierda)', w: 13, horas: 0.5, ciclo: 1, tipo: '12V' },
  { id: 'bomba', nombre: 'Bomba de agua 12 V', w: 48, horas: 0.15, ciclo: 1, tipo: '12V' },
  // Solo trabaja con frío (la batería se mantiene sobre 4 grados): 8 h en el día y un quinto del tiempo encendida
  { id: 'calefBateria', nombre: 'Calefactor de la batería (solo con frío, 30 W)', w: 30, horas: 8, ciclo: 0.2, tipo: '12V' },
  { id: 'usbc', nombre: 'Carga de celulares por USB-C (230 V)', w: 40, horas: 3, ciclo: 0.6, tipo: '230V' },
  { id: 'notebook', nombre: 'Notebook (toma 230 V)', w: 60, horas: 3, ciclo: 0.7, tipo: '230V' },
];

export const ELECTRICA_INICIAL = {
  bateriaAh: 150,
  bateriaV: 12.8,
  profundidadDescarga: 0.9, // LiFePO4
  cargadorNominalA: 40,
  cargadorRealA: 30, // lo que entrega el alternador inteligente (ESTIMADO)
  cargadorVCarga: 14.4, // tensión de carga del DC-DC (perfil litio); sirve para calcular la corriente de entrada
  cargadorVEntrada: 13, // tensión de la batería del auto con el motor en marcha, ya con la caída del cable
  cargadorEfic: 0.95, // rendimiento del DC-DC (ESTIMADO)
  tensionDiseno: 12, // las corrientes de los cables y fusibles se calculan a esta tensión
  inversorEsperaW: 20, // consumo propio del inversor encendido sin carga (ESTIMADO, ver su ficha)
  inversorEsperaH: 4, // horas por día con el inversor encendido
  inversor: true, // ya comprado
  inversorW: 1000, // ESTIMADO: poné la potencia real del inversor comprado
  eficienciaInversor: 0.85,
  caidaMaxPct: 3,
  margenCable: 1.15, // sobrante de cable en cada tramo
  switches: ['Luces centrales del techo (tiras 1 y 2, junto a la claraboya)', 'Luces laterales del techo (tiras 3 y 4, junto a las paredes)', 'Lámpara flexible (lado izquierdo)', 'Bomba de agua', 'Inversor (mando)'],
};
