// Configuración inicial. Todas las medidas en milímetros.
// Origen del sistema de coordenadas de la van:
//   x = ancho (0 = pared izquierda mirando desde atrás hacia adelante)
//   y = alto (0 = piso)
//   z = largo (0 = puerta trasera, aumenta hacia los asientos)

export const CONFIG_INICIAL = {
  // Medidas tomadas por Marco (medidas 19-09 y 18-10). Lo marcado como ESTIMADO hay que medirlo.
  van: {
    ancho: 1720,
    largo: 2410,
    alto: 1270,
    margenTrasero: 170, // zona del cierre del baúl (0.13 y 0.17 m)
    archInicio: 1290, // distancia hasta las ruedas
    archLargo: 450, // ESTIMADO
    archIntrusion: 210, // ESTIMADO (cuánto entra el pasarruedas hacia el interior)
    archAlto: 470,
  },

  materiales: {
    // Hojas estándar 2440 x 1220. Confirmar en Derome qué medida venden.
    estructura: { nombre: 'Contrachapado 15 mm', t: 15, hojaL: 2440, hojaA: 1220, densidad: 680 },
    fondo: { nombre: 'Contrachapado 9 mm', t: 9, hojaL: 2440, hojaA: 1220, densidad: 640 },
  },

  listones: {
    l45x45: { nombre: 'Listón 45x45 mm', a: 45, b: 45, largo: 2400, densidad: 500 },
    l30x30: { nombre: 'Listón 30x30 mm', a: 30, b: 30, largo: 2400, densidad: 500 },
    l45x20: { nombre: 'Listón 45x20 mm', a: 45, b: 20, largo: 2400, densidad: 500 },
  },

  corte: { kerf: 3, recorte: 5, rotar: false },

  izquierdo: {
    profundidad: 400,
    largo: 1100,
    alto: 850,
    zocalo: 80,
    nevera: { largo: 480 },
    cajones: { largo: 340, n: 2 },
    // la bahía eléctrica ocupa lo que sobra
  },

  cama: {
    ancho: 1200,
    largo: 1700,
    base: 490, // altura de la parte inferior del marco (sobre el pasarruedas)
    marco: 100,
    separacion: 45, // separación mínima entre listones
    largoCajon: 500,
    altoCajon: 250,
    holguraMueble: 10,
  },

  derecho: {
    profundidad: 400,
    largo: 530,
    alto: 850,
    zocalo: 80,
    alacena: { profundidad: 300, separacion: 150 },
  },

  mesa: { ancho: 400, largo: 500, altura: 700 },

  // Dimensiones de equipos (ESTIMADAS, confirmar con la ficha de cada producto comprado)
  equipos: {
    bateria: { x: 330, z: 172, y: 215 },
    dcdc: { x: 200, z: 110, y: 70 },
    fusibles: { x: 150, z: 100, y: 50 },
    pileta: { x: 340, z: 400, y: 150 },
    tanque: { x: 300, z: 250, y: 300 },
  },
};

// Consumos ESTIMADOS: editar con los valores reales de cada producto.
export const CARGAS_INICIALES = [
  { id: 'nevera', nombre: 'Heladera compresor 12 V', w: 45, horas: 24, ciclo: 0.35, tipo: '12V' },
  { id: 'luces', nombre: 'Luces LED', w: 12, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'usb', nombre: 'Carga USB / celulares', w: 30, horas: 3, ciclo: 0.6, tipo: '12V' },
  { id: 'bomba', nombre: 'Bomba de agua 12 V', w: 48, horas: 0.15, ciclo: 1, tipo: '12V' },
  { id: 'extractor', nombre: 'Extractor de techo', w: 15, horas: 4, ciclo: 1, tipo: '12V' },
  { id: 'notebook', nombre: 'Notebook (toma 230 V)', w: 60, horas: 3, ciclo: 0.7, tipo: '230V' },
];

export const ELECTRICA_INICIAL = {
  bateriaAh: 100,
  bateriaV: 12.8,
  profundidadDescarga: 0.9, // LiFePO4
  cargadorNominalA: 40,
  cargadorRealA: 30, // lo que realmente entrega el alternador inteligente (ESTIMADO)
  inversor: true,
  eficienciaInversor: 0.85,
  caidaMaxPct: 3,
  tramos: [
    { id: 't1', nombre: 'Batería del auto - fusible ANL - DC-DC', largoM: 5.0, amperes: 40, fijo: true },
    { id: 't2', nombre: 'DC-DC - batería trasera', largoM: 0.8, amperes: 40, fijo: true },
    { id: 't3', nombre: 'Batería trasera - caja de fusibles', largoM: 0.6, amperes: 'auto', fijo: true },
  ],
  ramalLargoM: 3.0,
};
