// Fondo inclinado del mueble trasero (variante opcional, apagada por defecto).
//
// El fondo plano actual apoya contra el mamparo en z = van.largo. Detrás de él, la separación metálica y los asientos dejan
// un hueco en cuña: mucho en el piso y casi nada arriba (ver data/perfilMamparo.js). El fondo inclinado es UN solo plano
// recto que se apoya en los dos puntos que lo frenan (el borde de arriba del metal y el asiento) y deja un aire configurable.
// Con ese plano el mueble gana fondo abajo, donde van la batería y los bidones, y pierde unos milímetros arriba.
//
// Coordenadas: z hacia la cabina. s(y) es cuánto sale la cara de ATRÁS del fondo respecto del mamparo (positivo = hacia los
// asientos). La cara de adelante va un espesor más atrás en el sentido contrario: allí terminan los estantes, la base,
// los divisores y los costados.
import { PERFIL_MAMPARO } from '../data/perfilMamparo.js';

function interpolar(perfil, y) {
  if (y <= perfil[0][0]) return perfil[0][1];
  for (let i = 1; i < perfil.length; i++) {
    if (y <= perfil[i][0]) {
      const [y0, d0] = perfil[i - 1];
      const [y1, d1] = perfil[i];
      return d0 + ((d1 - d0) * (y - y0)) / (y1 - y0);
    }
  }
  return perfil[perfil.length - 1][1];
}

export function planoFondo(cfg) {
  const { van, trasero: tr } = cfg;
  const t = cfg.materiales.estructura.t;
  const tb = cfg.materiales.medio.t;
  const aire = tr.aireFondo ?? 10;
  const yIni = tr.zocalo; // abajo del fondo (cara de abajo de la base)
  const yFin = tr.alto - t; // arriba del fondo (cara de abajo de las tapas)

  // Alturas donde se mira que el plano no toque: cada 5 mm y en cada punto medido
  const ys = new Set();
  for (let y = yIni; y < yFin; y += 5) ys.add(y);
  ys.add(yFin);
  for (const [y] of PERFIL_MAMPARO) if (y > yIni && y < yFin) ys.add(y);
  const alturas = [...ys].sort((a, b) => a - b);
  const sup = alturas.map((y) => interpolar(PERFIL_MAMPARO, y));

  // Para cada inclinación k, el plano s = c - k y más profundo que no toca nada; se elige la que da más volumen neto
  let mejor = null;
  for (let i = 0; i <= 1200; i++) {
    const k = i * 0.0005;
    let c = Infinity;
    for (let j = 0; j < alturas.length; j++) c = Math.min(c, sup[j] - aire + k * alturas[j]);
    const area = c * (yFin - yIni) - (k * (yFin * yFin - yIni * yIni)) / 2;
    if (!mejor || area > mejor.area + 1e-9) mejor = { k, c, area };
  }
  const { k, c, area } = mejor;
  const ang = Math.atan(k);
  const cos = Math.cos(ang);
  const espH = tb / cos; // espesor del fondo medido en horizontal

  const sAtras = (y) => c - k * y;
  const zAtras = (y) => van.largo + sAtras(y);
  const zFrente = (y) => zAtras(y) - espH;

  return {
    k,
    c,
    ang,
    grados: (ang * 180) / Math.PI,
    aire,
    tb,
    espH,
    yIni,
    yFin,
    sAtras,
    zAtras,
    zFrente,
    gananciaPiso: sAtras(yIni), // cuánto fondo gana el mueble a la altura de la base
    perdidaTecho: -sAtras(yFin), // cuánto pierde arriba (si es negativa, no pierde)
    largoFondo: (yFin - yIni) / cos, // largo del fondo medido sobre la pendiente
    area, // mm2 netos por mm de ancho
  };
}
