// Contexto de construcción: junta piezas, uniones, herrajes, equipos y anclajes.

const PREFIJOS = {
  'Mueble izquierdo': 'IZQ',
  Cama: 'CAM',
  'Mueble derecho': 'DER',
};

export function crearContexto(cfg) {
  const partes = [];
  const uniones = [];
  const herrajes = [];
  const equipos = [];
  const anclajes = [];
  const avisos = [];
  const contadores = {};
  const t = cfg.materiales.estructura.t;
  const tb = cfg.materiales.fondo.t;

  function parte(p) {
    const pref = PREFIJOS[p.grupo] || 'GEN';
    contadores[pref] = (contadores[pref] || 0) + 1;
    const id = `${pref}-${String(contadores[pref]).padStart(2, '0')}`;
    partes.push({ tipo: 'placa', mat: 'estructura', ...p, id });
    return id;
  }

  // tipo: cola_tornillo | cajon | piso | pared | directo
  function unir(grupo, tipo, largo, detalle, extra = {}) {
    uniones.push({ grupo, tipo, largo: Math.round(largo), detalle, ...extra });
  }

  function herraje(grupo, nombre, cantidad, nota = '') {
    herrajes.push({ grupo, nombre, cantidad, nota });
  }

  function equipo(e) {
    equipos.push(e);
  }

  function anclaje(grupo, punto, metodo, cantidad, nota = '') {
    anclajes.push({ grupo, punto, metodo, cantidad, nota });
  }

  function aviso(texto) {
    avisos.push(texto);
  }

  return {
    cfg,
    t,
    tb,
    partes,
    uniones,
    herrajes,
    equipos,
    anclajes,
    avisos,
    parte,
    unir,
    herraje,
    equipo,
    anclaje,
    aviso,
  };
}
