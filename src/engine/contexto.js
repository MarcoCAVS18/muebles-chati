// Contexto de construcción: junta piezas, uniones, herrajes, equipos y anclajes.

const PREFIJOS = {
  'Mueble trasero': 'TRA',
  Cama: 'CAM',
  'Mueble derecho': 'DER',
};

export function crearContexto(cfg) {
  const partes = [];
  const decos = []; // detalles visuales (ranuras, aberturas): no se cortan ni pesan
  const layout = {}; // posiciones clave que usan el eléctrico y los equipos
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

  function deco(d) {
    decos.push({ color: '#2b2118', ...d, id: `DEC-${String(decos.length + 1).padStart(3, '0')}` });
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
    decos,
    layout,
    uniones,
    herrajes,
    equipos,
    anclajes,
    avisos,
    parte,
    deco,
    unir,
    herraje,
    equipo,
    anclaje,
    aviso,
  };
}
