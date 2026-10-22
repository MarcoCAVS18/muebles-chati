// Cálculo eléctrico: auto -> DC-DC -> batería trasera -> distribución. Sin panel solar.

const SECCIONES = [0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
const FUSIBLES = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200];
const RHO_COBRE = 0.0172; // ohm * mm2 / m

// Corriente admisible CONSERVADORA (cable agrupado dentro de un mueble, sin ventilación).
// Confirmar siempre con la ficha del cable comprado.
const AMPACIDAD = { 0.75: 8, 1: 10, 1.5: 15, 2.5: 20, 4: 30, 6: 40, 10: 60, 16: 80, 25: 100, 35: 125, 50: 150, 70: 190, 95: 230 };

const siguiente = (lista, valor) => lista.find((v) => v >= valor) ?? lista[lista.length - 1];

export function calcularElectrica(cargas, e) {
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

  const calcCable = (largoM, amperes) => {
    const caidaV = (e.caidaMaxPct / 100) * 12;
    const minimo = (2 * largoM * amperes * RHO_COBRE) / caidaV;
    const fusible = siguiente(FUSIBLES, amperes * 1.25);
    // El cable tiene que soportar el fusible que lo protege y también cumplir la caída máxima
    const porCorriente = SECCIONES.find((s) => AMPACIDAD[s] >= fusible) ?? SECCIONES[SECCIONES.length - 1];
    const seccion = Math.max(siguiente(SECCIONES, minimo), porCorriente);
    const caidaReal = (2 * largoM * amperes * RHO_COBRE) / seccion;
    return {
      seccionMinima: minimo,
      seccion,
      limitadoPor: seccion === porCorriente && porCorriente > siguiente(SECCIONES, minimo) ? 'corriente' : 'caída de tensión',
      caidaReal,
      caidaPct: (caidaReal / 12) * 100,
      fusible,
    };
  };

  const tramos = e.tramos.map((t) => {
    const amperes = t.amperes === 'auto' ? Math.max(corrienteMax, 1) : t.amperes;
    return { ...t, amperes, ...calcCable(t.largoM, amperes) };
  });

  const ramales = filas.map((f) => ({
    nombre: f.nombre,
    amperes: f.amperes,
    ...calcCable(e.ramalLargoM, f.amperes),
  }));

  const avisos = [];
  if (autonomiaDias < 1.5) avisos.push('La autonomía sin manejar es menor a 1,5 días. Revisar consumos o sumar batería.');
  if (inversor) {
    avisos.push(
      'Hay cargas de 230 V: hace falta un inversor. No figura entre los productos comprados que tengo anotados.'
    );
  }
  if (e.cargadorRealA > e.cargadorNominalA) avisos.push('La corriente real de carga supera la nominal del DC-DC.');
  avisos.push(
    'El DC-DC debe ser compatible con alternador inteligente (el Jumpy lo es). El fusible ANL va a menos de 30 cm del borne de la batería del auto.'
  );

  return {
    filas,
    whDia,
    ahDia,
    ahUtil,
    whBateria,
    autonomiaDias,
    horasConduccion,
    corrienteMax,
    tramos,
    ramales,
    avisos,
  };
}
