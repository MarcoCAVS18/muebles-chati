// Contornos de la cama en peine: la placa fija (dedos y ranuras abiertas hacia el pasillo) y las varillas móviles
// (los pedazos que salen de las ranuras, unidos por un lomo). Cerrada parece una sola placa; abierta, las varillas
// salen hacia el pasillo y quedan intercaladas con los dedos de la placa.
//
// Todo en milímetros y en las coordenadas de la van. Cada contorno se devuelve en la forma (u, v) de la pieza, como el
// resto de los contornos de enfoque.js: u = x - px y v = -(z - pz), con (px, pz) la esquina mínima de la pieza.
const PI = Math.PI;

// Constructor de trazos: lleva el punto actual y sabe hacer filetes (esquinas redondeadas) en cualquier esquina recta
function trazador(px, pz) {
  const U = (x) => x - px;
  const V = (z) => -(z - pz);
  const cmds = [];
  const ang = (cu, cv, u, v) => Math.atan2(v - cv, u - cu);
  const api = {
    cmds,
    M: (x, z) => cmds.push({ t: 'M', u: U(x), v: V(z) }),
    L: (x, z) => cmds.push({ t: 'L', u: U(x), v: V(z) }),
    // Arco de centro (cx, cz) desde (xa, za) hasta (xb, zb); cw = en sentido horario en (u, v)
    A: (cx, cz, r, xa, za, xb, zb, cw, tag) => {
      const cu = U(cx);
      const cv = V(cz);
      const a0 = ang(cu, cv, U(xa), V(za));
      let a1 = ang(cu, cv, U(xb), V(zb));
      if (cw) while (a1 > a0 - 1e-9) a1 -= 2 * PI;
      else while (a1 < a0 + 1e-9) a1 += 2 * PI;
      cmds.push({ t: 'A', cu, cv, r, a0, a1, tag });
    },
    // Esquina recta en (x, z) que llega con dirección d1 y sale con d2 (vectores unitarios en x, z), con radio r
    F: (x, z, d1, d2, r, tag) => {
      if (r < 0.01) return api.L(x, z);
      const sx = x - d1[0] * r;
      const sz = z - d1[1] * r;
      const ex = x + d2[0] * r;
      const ez = z + d2[1] * r;
      api.L(sx, sz);
      // El giro se mira en (u, v), donde z queda invertido
      const cruz = d1[0] * -d2[1] - -d1[1] * d2[0];
      api.A(sx + d2[0] * r, sz + d2[1] * r, r, sx, sz, ex, ez, cruz < 0, tag);
    },
  };
  return api;
}

// Reparto de las ranuras sobre la zona de las varillas. Hay una varilla más que dedos: las de las puntas llevan las
// correderas. Con n ranuras y la proporción dada entre el dedo y la ranura, el ancho de cada ranura sale de que todo
// cierre justo contra las dos puntas (cada punta lleva su luz).
export function repartoPeine({ z0, z1, n, proporcion = 1, luz }) {
  if (!(n >= 2)) return null;
  const total = z1 - z0 + 2 * luz; // de la pared de la primera ranura a la de la última
  const ancho = total / (n + (n - 1) * proporcion);
  const fw = ancho * proporcion;
  const s0 = z0 - luz;
  return { n, ancho, fw, ranuras: Array.from({ length: n }, (_, k) => s0 + k * (ancho + fw)) };
}

// Esquina del pasillo cuando el borde de la placa es más angosto que el radio: el arco sigue siendo el de la placa entera
// y se corta donde termina cada pieza. Devuelve el x donde el círculo cruza la recta z = zc.
const xCirculo = (cx, cz, r, zc) => cx + Math.sqrt(Math.max(0, r * r - (cz - zc) * (cz - zc)));

// Placa fija: lomo contra la pared, dedos hacia el pasillo y un hueco donde se aloja el lomo móvil
export function peineFijo({ x0, x1, zmin, zmax, xl, xs, ranuras, ancho, costilla, R, rs }) {
  const p = trazador(x0, zmin);
  const n = ranuras.length;
  const e0 = ranuras[0]; // borde de la placa que mira a la primera ranura
  const e1 = ranuras[n - 1] + ancho;
  const cs = [x1 - R, zmin + R]; // centro de la esquina del pasillo, del lado de zmin
  const cn = [x1 - R, zmax - R]; // y del lado de zmax
  const rsA = Math.min(rs, ancho / 2 - 0.5);
  const dir = { izq: [-1, 0], der: [1, 0], sube: [0, -1], baja: [0, 1] };

  p.M(x0 + R, zmin);
  // Esquina del pasillo de arriba (zmin): entera si el borde alcanza, cortada en el borde si no
  if (e0 - zmin >= R) {
    p.L(x1 - R, zmin);
    p.A(cs[0], cs[1], R, x1 - R, zmin, x1, zmin + R, true, 'esquina');
    p.L(x1, e0);
  } else {
    p.L(x1 - R, zmin);
    const xa = xCirculo(cs[0], cs[1], R, e0);
    p.A(cs[0], cs[1], R, x1 - R, zmin, xa, e0, true, 'esquina');
  }
  // Ranuras: la pared de cada ranura, su fondo con esquinas redondeadas y el dedo que sigue
  for (let k = 0; k < n; k++) {
    const s = ranuras[k];
    p.F(xl, s, dir.izq, dir.baja, rsA, k === 0 ? 'esquina' : 'esquinaSin'); // fondo, lado de arriba
    p.F(xl, s + ancho, dir.baja, dir.der, rsA, 'esquinaSin'); // fondo, lado de abajo
    if (k < n - 1) {
      p.L(xs, s + ancho); // lado del dedo
      p.L(xs, s + ancho + costilla); // punta del dedo (a escuadra: ahí apoya el lomo móvil)
    }
  }
  // Borde de abajo (zmax) y el resto de la placa
  if (zmax - e1 >= R) {
    p.L(x1, e1);
    p.L(x1, zmax - R);
    p.A(cn[0], cn[1], R, x1, zmax - R, x1 - R, zmax, true, 'esquina');
  } else {
    p.L(xCirculo(cn[0], cn[1], R, e1), e1);
    p.A(cn[0], cn[1], R, xCirculo(cn[0], cn[1], R, e1), e1, x1 - R, zmax, true, 'esquina');
  }
  p.L(x0 + R, zmax);
  p.A(x0 + R, zmax - R, R, x0 + R, zmax, x0, zmax - R, true, 'esquina');
  p.L(x0, zmin + R);
  p.A(x0 + R, zmin + R, R, x0, zmin + R, x0 + R, zmin, true, 'esquina');
  return { cmds: p.cmds, esquinas: 4, radio: R, radioRanura: rsA };
}

// Varillas móviles: el lomo del lado del pasillo y las varillas hacia la pared. Salen de las ranuras de la placa
// (con luz a cada lado) y el lomo sale del borde de la misma placa.
export function peineMovil({ x1, zmin, zmax, xr, xs, ranuras, ancho, luz, R, rr }) {
  const n = ranuras.length;
  const z0 = ranuras[0] + luz; // cara exterior de la primera varilla
  const z1 = ranuras[n - 1] + ancho - luz; // y de la última
  const p = trazador(xr, z0);
  const rrA = Math.min(rr, (ancho - 2 * luz) / 2 - 0.5);
  const cs = [x1 - R, zmin + R];
  const cn = [x1 - R, zmax - R];
  const dir = { izq: [-1, 0], der: [1, 0], sube: [0, -1], baja: [0, 1] };

  p.M(xr + rrA, z0);
  // Esquina del pasillo de arriba: sigue el círculo de la placa desde donde empieza el lomo
  if (zmin + R > z0) {
    p.L(xCirculo(cs[0], cs[1], R, z0), z0);
    p.A(cs[0], cs[1], R, xCirculo(cs[0], cs[1], R, z0), z0, x1, zmin + R, true, 'esquina');
  } else {
    p.L(x1, z0);
  }
  if (zmax - R < z1) {
    p.L(x1, zmax - R);
    p.A(cn[0], cn[1], R, x1, zmax - R, xCirculo(cn[0], cn[1], R, z1), z1, true, 'esquina');
  } else {
    p.L(x1, z1);
  }
  p.L(xr + rrA, z1);
  // Varillas de abajo hacia arriba: punta de atrás redondeada, costado, lomo y costado de la varilla anterior
  for (let k = n - 1; k >= 0; k--) {
    const a = ranuras[k] + luz; // cara de arriba de la varilla (z menor)
    const b = ranuras[k] + ancho - luz; // cara de abajo
    p.F(xr, b, dir.izq, dir.sube, rrA, k === n - 1 ? 'esquina' : 'esquinaSin');
    p.F(xr, a, dir.sube, dir.der, rrA, 'esquinaSin');
    if (k > 0) {
      p.L(xs, a); // lado de arriba de la varilla, hasta el lomo
      p.L(xs, ranuras[k - 1] + ancho - luz); // cara interior del lomo hasta la varilla anterior
    }
  }
  return { cmds: p.cmds, esquinas: 2, radio: R, radioRanura: rrA };
}
