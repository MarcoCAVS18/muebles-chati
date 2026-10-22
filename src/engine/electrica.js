// Cálculo eléctrico: auto -> DC-DC -> batería trasera -> distribución. Sin panel solar.

const SECCIONES = [0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
const FUSIBLES = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200];
const RHO_COBRE = 0.0172; // ohm * mm2 / m

// Corriente admisible CONSERVADORA (cable agrupado dentro de un mueble, sin ventilación).
// Confirmar siempre con la ficha del cable comprado.
const AMPACIDAD = { 0.75: 8, 1: 10, 1.5: 15, 2.5: 20, 4: 30, 6: 40, 10: 60, 16: 80, 25: 100, 35: 125, 50: 150, 70: 190, 95: 230 };

const siguiente = (lista, valor) => lista.find((v) => v >= valor) ?? lista[lista.length - 1];

const largoPolilinea = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);

export function calcularElectrica(cargas, e, cables = []) {
  const inversor = e.inversor;
  const filas = cargas
    .filter((c) => inversor || c.tipo !== '230V')
    .map((c) => {
      const whCarga = c.w * c.horas * c.ciclo;
      const wh = c.tipo === '230V' ? whCarga / e.eficienciaInversor : whCarga;
      return { ...c, wh, amperes: (c.tipo === '230V' ? c.w / e.eficienciaInversor : c.w) / e.bateriaV };
    });

  const whDia = filas.reduce((s, f) => s + f.wh, 0);
  const ahDia = whDia / e.bateriaV;
  const ahUtil = e.bateriaAh * e.profundidadDescarga;
  const whBateria = e.bateriaAh * e.bateriaV;
  const autonomiaDias = ahDia > 0 ? ahUtil / ahDia : Infinity;
  const horasConduccion = ahDia / e.cargadorRealA;
  const corrienteMax = filas.reduce((s, f) => s + f.amperes, 0);

  // Corriente continua de cada carga de 12 V (potencia / tensión)
  const ampDe = (id) => {
    const c = cargas.find((x) => x.id === id);
    return c ? c.w / e.bateriaV : 0;
  };
  const ampInversor = e.inversorW / (e.bateriaV * e.eficienciaInversor);
  const suma12 = cargas.filter((c) => c.tipo === '12V').reduce((s, c) => s + c.w / e.bateriaV, 0);
  const resolver = {
    dcdc: e.cargadorNominalA,
    inversor: ampInversor,
    carga12: suma12,
    nevera: ampDe('nevera'),
    ledA: ampDe('luces') / 2,
    ledB: ampDe('luces') / 2,
    bomba: ampDe('bomba'),
    extractor: ampDe('extractor'),
    switches: ampDe('luces') + ampDe('bomba') + ampDe('extractor'),
    ac: e.inversorW / 230,
    senal: 0.5,
  };

  // voltaje: tensión del circuito; minimo: sección mínima por robustez mecánica
  const calcCable = (largoM, amperes, voltaje = 12, minimoMm2 = 1.5) => {
    const caidaV = (e.caidaMaxPct / 100) * voltaje;
    const minimo = (2 * largoM * amperes * RHO_COBRE) / caidaV;
    const fusible = siguiente(FUSIBLES, amperes * 1.25);
    // El cable tiene que soportar el fusible que lo protege y también cumplir la caída máxima
    const porCorriente = SECCIONES.find((s) => AMPACIDAD[s] >= fusible) ?? SECCIONES[SECCIONES.length - 1];
    const porCaida = siguiente(SECCIONES, minimo);
    const seccion = Math.max(porCaida, porCorriente, minimoMm2);
    const caidaReal = (2 * largoM * amperes * RHO_COBRE) / seccion;
    let limitadoPor = 'caída de tensión';
    if (seccion === porCorriente && porCorriente >= porCaida) limitadoPor = 'corriente';
    if (seccion === minimoMm2 && minimoMm2 > porCorriente && minimoMm2 > porCaida) limitadoPor = 'sección mínima';
    return {
      seccionMinima: minimo,
      seccion,
      limitadoPor,
      caidaReal,
      caidaPct: (caidaReal / voltaje) * 100,
      fusible,
    };
  };

  // Cada cable del 3D usa su largo real (más 15 % de sobrante para terminales y curvas)
  const tramos = cables.map((c) => {
    const largoM = (largoPolilinea(c.puntos) / 1000) * (e.margenCable ?? 1.15);
    const amperes = resolver[c.corriente] ?? 1;
    const ac = c.tipo === 'ac';
    const senal = c.tipo === 'senal';
    return {
      ...c,
      largoM,
      amperes,
      ...calcCable(largoM, amperes, ac ? 230 : 12, senal ? 0.75 : 1.5),
    };
  });

  const ramales = filas.map((f) => ({
    nombre: f.nombre,
    amperes: f.amperes,
    ...calcCable(3, f.amperes),
  }));

  // Cable a comprar, por sección (los de CC llevan positivo y negativo)
  const mapa = new Map();
  const sumar = (clave, item, metros) => {
    const prev = mapa.get(clave) || { item, metros: 0 };
    prev.metros += metros;
    mapa.set(clave, prev);
  };
  for (const t of tramos) {
    const m = t.largoM;
    if (t.tipo === 'dc') {
      sumar(`dc-${t.seccion}`, `Cable de cobre flexible ${t.seccion} mm2 (rojo y negro)`, m * 2);
    } else if (t.tipo === 'ac') {
      sumar(`ac-${t.seccion}`, `Cable 3 x ${t.seccion} mm2 para 230 V`, m);
    } else if (t.tipo === 'senal') {
      sumar(`se-${t.seccion}`, `Cable de señal 2 x ${t.seccion} mm2`, m);
    }
  }
  const cableCompras = [...mapa.values()]
    .map((c) => ({ ...c, metros: Math.ceil(c.metros * 10) / 10 }))
    .sort((a, b) => a.item.localeCompare(b.item));

  const avisos = [];
  if (autonomiaDias < 1.5) avisos.push('La autonomía sin manejar es menor a 1,5 días. Revisar consumos o sumar batería.');
  if (inversor && ampInversor > 100) {
    avisos.push(
      `El inversor a plena carga pide unos ${Math.round(ampInversor)} A de la batería. Confirmar que el BMS de la batería de ${e.bateriaAh} Ah entrega esa corriente de forma continua.`
    );
  }
  if (e.cargadorRealA > e.cargadorNominalA) avisos.push('La corriente real de carga supera la nominal del DC-DC.');
  avisos.push('El DC-DC debe ser compatible con alternador inteligente (el Jumpy lo es). El fusible ANL va a menos de 30 cm del borne de la batería del auto.');
  avisos.push('Los largos de cable salen del recorrido dibujado en 3D, con 15 % de sobrante. Medir en la van antes de cortar.');

  return {
    filas,
    whDia,
    ahDia,
    ahUtil,
    whBateria,
    autonomiaDias,
    horasConduccion,
    corrienteMax,
    ampInversor,
    tramos,
    ramales,
    cableCompras,
    avisos,
  };
}
