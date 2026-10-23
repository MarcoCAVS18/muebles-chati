// Cálculo eléctrico: auto -> DC-DC -> batería trasera -> distribución. Sin panel solar.

const SECCIONES = [0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
const FUSIBLES = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200];
// Disyuntores de 230 V (curva B): no existen de 7,5 A ni de 1,25 veces cualquier valor
const DISYUNTORES = [6, 10, 13, 16, 20, 25, 32];
// Las cargas con motor arrancan con varias veces su corriente de trabajo: el fusible de 1,25 veces las corta de arranque
const FACTOR_FUSIBLE = { nevera: 2.5, bomba: 2.5 };
// Caminos de la energía de la batería a cada consumo: la caída de tensión se suma a lo largo de todo el camino
const CAMINOS = [
  { nombre: 'Entrada del DC-DC (batería del auto hasta el DC-DC)', ids: ['c_auto_anl', 'c_largo'] },
  { nombre: 'Salida del DC-DC hasta la batería de 150 Ah', ids: ['c_dcdc_bat'] },
  { nombre: 'Batería hasta el inversor', ids: ['c_bat_fusp', 'c_fusp_inv'] },
  { nombre: 'Batería hasta la heladera', ids: ['c_bat_caja', 'c_caja_nevera'] },
  { nombre: 'Batería hasta la bomba', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_bomba'] },
  { nombre: 'Batería hasta la tira LED 1', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_ledA'] },
  { nombre: 'Batería hasta la tira LED 2', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_ledB'] },
  { nombre: 'Batería hasta la tira LED 3', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_ledC'] },
  { nombre: 'Batería hasta la tira LED 4', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_ledD'] },
  { nombre: 'Batería hasta la lámpara flexible', ids: ['c_bat_caja', 'c_caja_panel', 'c_panel_lampara'] },
];
const RHO_COBRE = 0.0172; // ohm * mm2 / m

// Corriente admisible CONSERVADORA (cable agrupado dentro de un mueble, sin ventilación).
// Confirmar siempre con la ficha del cable comprado.
const AMPACIDAD = { 0.75: 8, 1: 10, 1.5: 15, 2.5: 20, 4: 30, 6: 40, 10: 60, 16: 80, 25: 100, 35: 125, 50: 150, 70: 190, 95: 230 };

const siguiente = (lista, valor) => lista.find((v) => v >= valor) ?? lista[lista.length - 1];

const largoPolilinea = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);

export function calcularElectrica(cargas, e, cables = []) {
  const inversor = e.inversor;
  // Las corrientes de diseño se calculan a 12 V (la batería de litio baja de 12,8 V al descargarse y a los
  // equipos de potencia constante les sube la corriente). La energía diaria sigue usando la tensión nominal.
  const vDiseno = e.tensionDiseno ?? 12;
  const filas = cargas
    .filter((c) => inversor || c.tipo !== '230V')
    .map((c) => {
      const whCarga = c.w * c.horas * c.ciclo;
      const wh = c.tipo === '230V' ? whCarga / e.eficienciaInversor : whCarga;
      return { ...c, wh, amperes: (c.tipo === '230V' ? c.w / e.eficienciaInversor : c.w) / vDiseno };
    });
  // Consumo propio del inversor mientras está encendido sin carga (ESTIMADO, ver la ficha del inversor)
  const esperaW = e.inversorEsperaW ?? 20;
  const esperaH = e.inversorEsperaH ?? 4;
  if (inversor && esperaW > 0 && esperaH > 0) {
    filas.push({ id: 'inversorEspera', nombre: 'Inversor encendido (consumo propio)', w: esperaW, horas: esperaH, ciclo: 1, tipo: '12V', wh: esperaW * esperaH, amperes: esperaW / vDiseno, calculada: true });
  }

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
    return c ? c.w / vDiseno : 0;
  };
  const ampInversor = e.inversorW / (vDiseno * e.eficienciaInversor);
  const suma12 = cargas.filter((c) => c.tipo === '12V').reduce((s, c) => s + c.w / vDiseno, 0);
  // Entrada del DC-DC: la potencia que entrega a la batería (corriente nominal a la tensión de carga) sale de la
  // batería del auto con el motor en marcha, a una tensión menor y con pérdidas. Confirmar con el manual del DC-DC.
  const vCarga = e.cargadorVCarga ?? 14.4;
  const vEntrada = e.cargadorVEntrada ?? 13;
  const efCargador = e.cargadorEfic ?? 0.95;
  const ampDcdcEntrada = (e.cargadorNominalA * vCarga) / (efCargador * vEntrada);
  const resolver = {
    dcdc: e.cargadorNominalA,
    dcdcEntrada: ampDcdcEntrada,
    inversor: ampInversor,
    carga12: suma12,
    nevera: ampDe('nevera'),
    ledA: ampDe('ledA'),
    ledB: ampDe('ledB'),
    ledC: ampDe('ledC'),
    ledD: ampDe('ledD'),
    lampara: ampDe('lampara'),
    bomba: ampDe('bomba'),
    switches: ampDe('ledA') + ampDe('ledB') + ampDe('ledC') + ampDe('ledD') + ampDe('lampara') + ampDe('bomba'),
    ac: e.inversorW / 230,
    senal: 0.5,
  };

  // voltaje: tensión del circuito; minimo: sección mínima por robustez mecánica; factor: margen del fusible
  const calcCable = (largoM, amperes, voltaje = 12, minimoMm2 = 1.5, factor = 1.25, alterna = false) => {
    const caidaV = (e.caidaMaxPct / 100) * voltaje;
    const minimo = (2 * largoM * amperes * RHO_COBRE) / caidaV;
    const fusible = siguiente(alterna ? DISYUNTORES : FUSIBLES, amperes * factor);
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
      voltaje: ac ? 230 : 12,
      ...calcCable(largoM, amperes, ac ? 230 : 12, senal ? 0.75 : 1.5, FACTOR_FUSIBLE[c.corriente] ?? 1.25, ac),
    };
  });

  // La caída de tensión se acumula a lo largo de cada camino (por ejemplo batería -> caja de fusibles -> panel -> bomba).
  // Si un camino pasa del máximo se engruesa el tramo que más cae, hasta cumplirlo.
  const porId = new Map(tramos.map((t) => [t.id, t]));
  const caminos = CAMINOS.map((c) => ({ ...c, tramos: c.ids.map((id) => porId.get(id)) })).filter((c) => c.tramos.every(Boolean));
  const sumaPct = (c) => c.tramos.reduce((s, t) => s + t.caidaPct, 0);
  for (let vuelta = 0; vuelta < 60; vuelta++) {
    let cambio = false;
    for (const c of caminos) {
      if (sumaPct(c) <= e.caidaMaxPct + 1e-9) continue;
      const cand = c.tramos
        .filter((t) => SECCIONES.indexOf(t.seccion) < SECCIONES.length - 1)
        .sort((a, b) => b.caidaReal - a.caidaReal)[0];
      if (!cand) continue;
      cand.seccion = SECCIONES[SECCIONES.indexOf(cand.seccion) + 1];
      cand.caidaReal = (2 * cand.largoM * cand.amperes * RHO_COBRE) / cand.seccion;
      cand.caidaPct = (cand.caidaReal / cand.voltaje) * 100;
      cand.limitadoPor = 'caída acumulada del camino';
      cambio = true;
    }
    if (!cambio) break;
  }
  const caminosRes = caminos.map((c) => ({
    nombre: c.nombre,
    ids: c.ids,
    caidaPct: sumaPct(c),
    ok: sumaPct(c) <= e.caidaMaxPct + 1e-6,
    largoM: c.tramos.reduce((s, t) => s + t.largoM, 0),
  }));

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
  if (inversor) {
    avisos.push(
      `El inversor a plena carga pide unos ${Math.round(ampInversor)} A de la batería (a ${vDiseno} V) y más en el arranque de cargas con motor. Confirmar con la ficha de la batería de ${e.bateriaAh} Ah que el BMS entrega esa corriente de forma continua y el pico del inversor.`
    );
  }
  if (e.cargadorRealA > e.cargadorNominalA) avisos.push('La corriente real de carga supera la nominal del DC-DC.');
  avisos.push(
    `Entrada del DC-DC: con ${e.cargadorNominalA} A de salida a ${vCarga} V se calculan unos ${ampDcdcEntrada.toFixed(0)} A de entrada (a ${vEntrada} V y ${Math.round(efCargador * 100)} % de rendimiento). Confirmar con el manual del DC-DC comprado y usar el fusible de entrada que pide el fabricante.`
  );
  avisos.push('El DC-DC debe ser compatible con alternador inteligente (el Jumpy lo es) y necesita su cable de señal de encendido (ignición) con fusible propio. El fusible ANL va a menos de 30 cm del borne de la batería del auto.');
  avisos.push('Heladera y bomba: el fusible se calcula con 2,5 veces la corriente de trabajo por el arranque del motor. Confirmar con el manual de cada una (algunas heladeras piden fusible de 15 A y cable de 2,5 mm2).');
  if (inversor) {
    avisos.push('Lado de 230 V: el inversor necesita un diferencial de 30 mA y un disyuntor (6 A). El técnico define si hace falta puentear neutro y tierra según el modelo del inversor.');
  }
  avisos.push('Todavía no están en el diseño: corta-baterías general, shunt o monitor de batería, barras de distribución positiva y negativa, y el fusible de la salida del DC-DC pegado al borne.');
  avisos.push('La batería de litio no se debe cargar con menos de 0 grados: confirmar que tiene protección por baja temperatura o calefacción propia (invierno en Suecia).');
  if (caminosRes.some((c) => !c.ok)) avisos.push('Algún camino pasa la caída máxima aunque se usó la sección más grande de la lista: acortar el recorrido.');
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
    caminos: caminosRes,
    ampDcdcEntrada,
    ramales,
    cableCompras,
    avisos,
  };
}
