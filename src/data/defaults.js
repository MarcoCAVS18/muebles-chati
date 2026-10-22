// Configuración inicial. Todas las medidas en milímetros.
// Sistema de coordenadas de la van:
//   x = ancho (0 = pared izquierda, mirando desde la puerta trasera hacia los asientos)
//   y = alto (0 = piso)
//   z = largo (0 = puerta trasera, aumenta hacia los asientos; el mamparo está en z = largo)
//
// La distribución sigue la foto de referencia:
//   - Mueble trasero cruzado de pared a pared, pegado a la zona de los asientos (cabecera de la cama).
//     Vista desde la puerta trasera, de izquierda a derecha:
//       izquierda: electricidad al piso (batería acostada, inversor, DC-DC, fusibles) y arriba interruptores,
//                  enchufes y cajones de cocina; esta sección es la L: llega a 670 mm de profundidad
//       centro:    anafe, cajón de la garrafa de gas y heladera al piso
//       derecha:   grifo y fregadero, con los dos bidones de agua al piso
//   - Cama extensible (90 a 120 cm) de plywood con esquinas redondeadas, con caja con arco al pie
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
    ancho: 1720,
    profundidad: 500, // cocina y agua (el fregadero mide 400 mm de fondo)
    profundidadL: 670, // sección izquierda: llega hasta la cabecera de la cama
    alto: 850,
    zocalo: 20,
    divisor1: 617, // fin de la sección eléctrica
    divisor2: 1087, // fin de la cocina (queda centrada en el mueble)
  },

  // Cama extensible de 90 a 120 cm: placas de plywood con esquinas redondeadas y bandejas que se tiran al pasillo
  cama: {
    x0: 10,
    ancho: 900, // cama cerrada
    extension: 300, // se agranda hasta 1200
    bandejaAncho: 500, // 200 mm quedan debajo de la placa fija al abrir
    radio: 50, // radio de las esquinas
    largo: 1700, // confirmado
    plataforma: 440, // altura de la cara superior: la placa (15 mm) apoya justo sobre el pasarruedas (425)
    largoCabecera: 940, // largo de la placa de la cabecera (la otra placa va al pie)
    huecoMueble: 430, // espacio libre bajo la cama, frente al mueble trasero (bidones y puertas bajas)
    cajonCabecera: { fondo: 560, alto: 200 },
    cajonPie: { fondo: 600, alto: 200 },
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

  mesa: { ancho: 400 }, // con la cama de 90 cm cerrada quedan 410 mm de pasillo

  // Datos del vehículo (ESTIMADOS)
  vehiculo: {
    bateriaX: 1350, // centro de la batería del auto, bajo el asiento del acompañante
    bateriaZ: 2760,
    bateriaY: 130,
  },

  // Dimensiones de equipos en el orden de los ejes de la van (ESTIMADAS, confirmar con cada ficha)
  equipos: {
    bateria: { x: 483, y: 240, z: 170 }, // batería 150 Ah (largo, alto, ancho); va acostada, con el largo sobre x
    fusibles: { x: 140, y: 50, z: 100 },
    inversor: { x: 150, y: 75, z: 300 },
    dcdc: { x: 110, y: 70, z: 200 },
    bidon: { x: 215, y: 400, z: 290 }, // bidón de 20 L (grosor, alto, ancho)
    nevera: { x: 420, y: 300, z: 340 },
    fregadero: { x: 340, y: 130, z: 400 }, // los 400 mm son el fondo; el ancho es ESTIMADO
    anafe: { x: 420, y: 55, z: 300 }, // anafe de 2 hornallas empotrado
    garrafa: { x: 230, y: 330, z: 230 }, // garrafa chica recargable (ESTIMADA)
    regulador: { x: 70, y: 60, z: 70 },
    valvulaGas: { x: 40, y: 40, z: 40 },
    detectorGas: { x: 40, y: 50, z: 22 },
    bateriaAuto: { x: 278, y: 190, z: 175 },
    anl: { x: 60, y: 40, z: 40 },
    panelSwitches: { x: 130, y: 60, z: 25 },
    enchufe: { x: 70, y: 70, z: 25 },
  },

  // Tres tiras en el techo: dos de 2 m a los costados y una en el centro, detrás del extractor
  led: { tiras: 3, largoM: 2, wPorM: 9.6, x1: 430, x2: 1290, xC: 860 },

  // Ventilación de techo: se abre a mano, no tiene conexión eléctrica ni ventilador
  extractor: { x: 860, z: 1650, hueco: 280, marco: 310 },
};

// Consumos ESTIMADOS: editar con los valores reales de cada producto.
export const CARGAS_INICIALES = [
  { id: 'nevera', nombre: 'Heladera compresor 12 V', w: 45, horas: 24, ciclo: 0.35, tipo: '12V' },
  { id: 'ledA', nombre: 'Tira LED 1 del techo (2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'ledB', nombre: 'Tira LED 2 del techo (2 m)', w: 19, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'ledC', nombre: 'Tira LED 3 del techo (centro, 1,2 m)', w: 12, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'bomba', nombre: 'Bomba de agua 12 V', w: 48, horas: 0.15, ciclo: 1, tipo: '12V' },
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
  switches: ['Luces del techo 1', 'Luces del techo 2', 'Luces del techo 3', 'Bomba de agua', 'Inversor (mando)'],
};
