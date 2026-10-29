// Silueta en U invertida de los portales de la cama, en el plano de un costado (plano 'zy': u = z de la pieza y v = y,
// medidos desde su esquina mínima): el calado queda abierto hacia ABAJO (dos patas y un travesaño arriba) y lleva las
// esquinas de arriba redondeadas. Devuelve el contorno ya armado como comandos M / L / A, igual que el resto de las
// piezas con contorno propio.
const PI = Math.PI;

export function portalU({ w, h, n0, n1, a1, r }) {
  const rr = Math.max(0, Math.min(r, (n1 - n0) / 2, a1));
  return {
    plano: 'zy',
    tipo: 'portal',
    w,
    h,
    n0,
    n1,
    a1,
    esquinas: rr > 0.01 ? 2 : 0,
    radio: rr,
    cmds: [
      { t: 'M', u: 0, v: 0 },
      { t: 'L', u: 0, v: h },
      { t: 'L', u: w, v: h },
      { t: 'L', u: w, v: 0 },
      { t: 'L', u: n1, v: 0 },
      { t: 'L', u: n1, v: a1 - rr },
      ...(rr > 0.01 ? [{ t: 'A', cu: n1 - rr, cv: a1 - rr, r: rr, a0: 0, a1: 0.5 * PI, tag: 'esquina' }] : []),
      { t: 'L', u: n0 + rr, v: a1 },
      ...(rr > 0.01 ? [{ t: 'A', cu: n0 + rr, cv: a1 - rr, r: rr, a0: 0.5 * PI, a1: PI, tag: 'esquina' }] : []),
      { t: 'L', u: n0, v: 0 },
      { t: 'L', u: 0, v: 0 },
    ],
  };
}
