// Contexto de construcción: junta piezas, uniones, herrajes, equipos y anclajes.

const PREFIJOS = {
  'Mueble trasero': 'TRA',
  Cama: 'CAM',
  'Mueble derecho': 'DER',
};

const BOTON = { radio: 14, alto: 12 };
export const NOMBRE_BOTON = 'Cierre a botón (push) redondo con pestillo';

export function crearContexto(cfg) {
  const partes = [];
  const decos = []; // detalles visuales (ranuras, aberturas): no se cortan ni pesan
  const layout = {}; // posiciones clave que usan el eléctrico y los equipos
  const uniones = [];
  const herrajes = [];
  const equipos = [];
  const anclajes = [];
  const avisos = [];
  const botones = []; // botones push (cierre circular de los frentes): se dibujan en el 3D y se cuentan como herraje
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

  // Botón push redondo (cierre de gabinete para autocaravana): x, y, z es el centro del botón sobre la cara del
  // frente; eje es hacia dónde sale: 'x-', 'x+', 'z-' o 'z+'. El botón mide unos 28 mm y sobresale 12 mm (ESTIMADO,
  // confirmar con la ficha del producto). Sirve para trabar el frente y para tirar de él.
  function boton({ grupo, nombre, eje, x, y, z, ext = false }) {
    const r = BOTON.radio;
    const h = BOTON.alto;
    const sig = eje[1] === '+' ? 1 : -1;
    const caja =
      eje[0] === 'x'
        ? { x: sig > 0 ? x : x - h, sx: h, y: y - r, sy: 2 * r, z: z - r, sz: 2 * r }
        : { z: sig > 0 ? z : z - h, sz: h, x: x - r, sx: 2 * r, y: y - r, sy: 2 * r };
    botones.push({ grupo, nombre, eje, cx: x, cy: y, cz: z });
    decos.push({ ...caja, forma: 'boton', eje, grupo, ext, nombre: `Botón push: ${nombre}`, color: '#1b1b1b', id: `DEC-${String(decos.length + 1).padStart(3, '0')}` });
  }

  // Suma al herraje los botones push puestos en un mueble (uno por frente)
  function herrajeBotones(grupo) {
    const lista = botones.filter((b) => b.grupo === grupo);
    if (lista.length) herraje(grupo, NOMBRE_BOTON, lista.length, lista.map((b) => b.nombre).join(', '));
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
    botones,
    parte,
    deco,
    unir,
    herraje,
    herrajeBotones,
    equipo,
    boton,
    anclaje,
    aviso,
  };
}
