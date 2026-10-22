// Configuración inicial. Todas las medidas en milímetros.
// Sistema de coordenadas de la van:
//   x = ancho (0 = pared izquierda, mirando desde la puerta trasera hacia los asientos)
//   y = alto (0 = piso)
//   z = largo (0 = puerta trasera, aumenta hacia los asientos; el mamparo está en z = largo)
//
// La distribución sigue la foto de referencia:
//   - Mueble trasero cruzado, pegado al mamparo de los asientos (cabecera de la cama)
//   - Cama de plataforma ranurada pegada a la pared izquierda, con caja con arco al pie
//   - Mueble derecho con cajones, puerta bajo la mesa plegable y alacena alta

export const CONFIG_INICIAL = {
  // Medidas tomadas por Marco. Lo marcado como ESTIMADO hay que medirlo.
  van: {
    ancho: 1720,
    largo: 2410,
    alto: 1270,
    margenTrasero: 170, // zona del cierre del baúl
    archInicio: 1290, // distancia hasta las ruedas
    archLargo: 450, // ESTIMADO
    archIntrusion: 210, // ESTIMADO
    archAlto: 470,
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

  // Mueble cruzado detrás de los asientos: 3 secciones y 2 tapas
  trasero: {
    ancho: 1380,
    profundidad: 400,
    alto: 850,
    zocalo: 80,
    divisor1: 670, // límite de la sección izquierda (fregadero, heladera, batería)
    divisor2: 980, // límite de la sección central (bidones, inversor, DC-DC)
  },

  // Cama de plataforma ranurada, pegada a la pared izquierda y al mueble trasero
  cama: {
    x0: 10,
    ancho: 800,
    largo: 1850,
    plataforma: 500, // altura de la cara superior (pasa por encima del pasarruedas)
    largoCabecera: 990, // largo de la placa de la cabecera (la otra placa va al pie)
    cajonA: { z: 1100, ancho: 600, fondo: 450, alto: 200 },
    cajonB: { ancho: 420, fondo: 600, alto: 200 },
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

  mesa: { ancho: 500 },

  // Datos del vehículo (ESTIMADOS)
  vehiculo: {
    bateriaX: 1350, // centro de la batería del auto, bajo el asiento del acompañante
    bateriaZ: 2760,
    bateriaY: 130,
  },

  // Dimensiones de equipos en el orden de los ejes de la van (ESTIMADAS, confirmar con cada ficha)
  equipos: {
    bateria: { x: 483, y: 240, z: 170 }, // batería 150 Ah
    fusibles: { x: 140, y: 50, z: 100 },
    inversor: { x: 150, y: 75, z: 300 },
    dcdc: { x: 110, y: 70, z: 200 },
    bidon: { x: 250, y: 360, z: 172 },
    nevera: { x: 560, y: 300, z: 340 },
    fregadero: { x: 400, y: 130, z: 340 },
    bateriaAuto: { x: 278, y: 190, z: 175 },
    anl: { x: 60, y: 40, z: 40 },
    panelSwitches: { x: 130, y: 60, z: 25 },
    enchufe: { x: 70, y: 70, z: 25 },
  },

  led: { tiras: 2, largoM: 2, wPorM: 9.6, x1: 430, x2: 1290 },
};

// Consumos ESTIMADOS: editar con los valores reales de cada producto.
export const CARGAS_INICIALES = [
  { id: 'nevera', nombre: 'Heladera compresor 12 V', w: 45, horas: 24, ciclo: 0.35, tipo: '12V' },
  { id: 'luces', nombre: 'Tiras LED del techo (2 x 2 m)', w: 38, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'bomba', nombre: 'Bomba de agua 12 V', w: 48, horas: 0.15, ciclo: 1, tipo: '12V' },
  { id: 'extractor', nombre: 'Extractor de techo', w: 15, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'usbc', nombre: 'Carga de celulares por USB-C (230 V)', w: 40, horas: 3, ciclo: 0.6, tipo: '230V' },
  { id: 'notebook', nombre: 'Notebook (toma 230 V)', w: 60, horas: 3, ciclo: 0.7, tipo: '230V' },
];

export const ELECTRICA_INICIAL = {
  bateriaAh: 150,
  bateriaV: 12.8,
  profundidadDescarga: 0.9, // LiFePO4
  cargadorNominalA: 40,
  cargadorRealA: 30, // lo que entrega el alternador inteligente (ESTIMADO)
  inversor: true, // ya comprado
  inversorW: 1000, // ESTIMADO: poné la potencia real del inversor comprado
  eficienciaInversor: 0.85,
  caidaMaxPct: 3,
  margenCable: 1.15, // sobrante de cable en cada tramo
  switches: ['Luces del techo 1', 'Luces del techo 2', 'Bomba de agua', 'Extractor', 'Inversor (mando)'],
};
