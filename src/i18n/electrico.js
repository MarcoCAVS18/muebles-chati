// Traduce al idioma elegido los textos de lo eléctrico, el agua y el gas, que el motor arma en español.
// Cada texto se busca por el id del equipo o del cable (elec.equipos.<id>, elec.cables.<id>...). Si falta alguno,
// queda el texto en español. Los cálculos siguen usando los datos originales: acá solo se cambian los nombres.

// tx(clave, textoEnEspañol, parametros) devuelve la traducción si existe en el idioma elegido
export function traductor(i18n) {
  return (clave, defecto, params) => (defecto != null && i18n.exists(clave) ? i18n.t(clave, params) : defecto);
}

const contexto = (cfg) => ({ m: cfg.led.largoM, hueco: cfg.extractor.hueco, marco: cfg.extractor.marco });

export const equipoT = (tx, e, ctx = {}) => ({
  ...e,
  nombre: tx(`elec.equipos.${e.id}.nombre`, e.nombre, ctx),
  nota: tx(`elec.equipos.${e.id}.nota`, e.nota, ctx),
  estado: tx(`elec.equipos.${e.id}.estado`, e.estado, ctx),
});

export const cableT = (tx, c) => ({
  ...c,
  nombre: tx(`elec.cables.${c.id}.nombre`, c.nombre),
  nota: tx(`elec.cables.${c.id}.nota`, c.nota),
});

const escenaT = (tx, o) => (o.clave ? { ...o, nombre: tx(`elec.escena.${o.clave}`, o.nombre) } : o);

// Todo lo que sale de electrico3d() con los nombres en el idioma elegido
export function traducirElec3d(e3, tx, cfg) {
  const ctx = contexto(cfg);
  return {
    ...e3,
    equipos: e3.equipos.map((e) => equipoT(tx, e, ctx)),
    cables: e3.cables.map((c) => cableT(tx, c)),
    mangueras: e3.mangueras.map((c) => cableT(tx, c)),
    escenario: e3.escenario.map((o) => escenaT(tx, o)),
    decos: (e3.decos || []).map((o) => escenaT(tx, o)),
    decosElec: (e3.decosElec || []).map((o) => escenaT(tx, o)),
  };
}

// Resultado de calcularElectrica() con consumos, tramos, caminos, cable a comprar y avisos en el idioma elegido
export function traducirResultado(res, tx, e3T) {
  const cableDe = new Map([...e3T.cables, ...e3T.mangueras].map((c) => [c.id, c]));
  return {
    ...res,
    filas: res.filas.map((f) => ({ ...f, nombre: tx(`elec.cargas.${f.id}`, f.nombre) })),
    tramos: res.tramos.map((t) => {
      const c = cableDe.get(t.id);
      return c ? { ...t, nombre: c.nombre, nota: c.nota } : t;
    }),
    caminos: res.caminos.map((c) => ({ ...c, nombre: tx(`elec.caminos.${c.id}`, c.nombre) })),
    cableCompras: res.cableCompras.map((c) => ({ ...c, item: tx(`elec.compra.${c.tipo}`, c.item, { sec: c.seccion }) })),
    avisos: res.avisosT.map((a, i) => tx(`elec.avisos.${a.clave}`, res.avisos[i], a.params)),
  };
}

// Ficha de un elemento (descripción, dónde va y consejos) y su búsqueda de videos
export function infoT(tx, i18n, id, info) {
  const consejos = info.consejos && i18n.exists(`elec.info.${id}.consejos`) ? i18n.t(`elec.info.${id}.consejos`, { returnObjects: true }) : info.consejos;
  return {
    ...info,
    descripcion: tx(`elec.info.${id}.descripcion`, info.descripcion),
    ubicacion: tx(`elec.info.${id}.ubicacion`, info.ubicacion),
    busqueda: tx(`elec.info.${id}.busqueda`, info.busqueda),
    consejos,
  };
}

const LIMITES = { 'caída de tensión': 'caida', corriente: 'corriente', 'sección mínima': 'minima', 'caída acumulada del camino': 'acumulada' };
export const limiteT = (tx, texto) => (LIMITES[texto] ? tx(`elec.limite.${LIMITES[texto]}`, texto) : texto);
