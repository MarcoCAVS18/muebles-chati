// Modo pieza: contorno de cada madera, descripción de sus cortes, posición de la cámara y líneas de cota.
// Todo en milímetros y en las coordenadas de la van (x ancho, y alto, z largo). El 3D lo pasa a metros y espeja x.

const PI = Math.PI;
const E = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const por = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return por(a, 1 / n);
};

const medio3 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const redondo = (n) => Math.round(n * 10) / 10;
export const fmt = (n) => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : String(redondo(n)).replace('.', ','));

// Colores de la visualización (el panel usa los mismos para la leyenda)
export const COLOR_CORTE = {
  medida: '#1c4f9c',
  recto: '#2b8a3e',
  redondo: '#e8590c',
  arco: '#c2255c',
};

// ---------- Contorno ----------
// Las piezas con esquinas redondeadas, recorte o arco no son una caja. El contorno se da como comandos en el
// sistema de la forma (u, v): en las placas planas (plano 'xz') u = x y v = -z; en las de frente (plano 'xy') u = x y v = y.
// Las esquinas llevan la marca 'esquina' y el arco calado la marca 'arco'.
export function contorno(p) {
  if (p.calado && p.calado.tipo === 'arco') {
    const w = p.sx;
    const h = p.sy;
    const R = p.calado.radio;
    return {
      plano: 'xy',
      w,
      h,
      cmds: [
        { t: 'M', u: 0, v: 0 },
        { t: 'A', cu: w / 2, cv: 0, r: R, a0: PI, a1: 0, tag: 'arco' },
        { t: 'L', u: w, v: h },
        { t: 'L', u: 0, v: h },
      ],
      escuadras: [
        [0, h, 1, -1],
        [w, h, -1, -1],
      ],
      esquinas: 0,
      recorte: null,
      arco: { a: w / 2, b: 0, r: R },
    };
  }
  if (p.radio) {
    const w = p.sx;
    const h = p.sz;
    const r = Math.min(p.radio, w / 2, h / 2);
    const rec = p.recorte ? { a0: p.recorte.x0 - p.x, a1: p.recorte.x1 - p.x, b0: p.recorte.z0 - p.z, b1: p.recorte.z1 - p.z } : null;
    const cmds = [
      { t: 'M', u: r, v: 0 },
      { t: 'L', u: w - r, v: 0 },
      { t: 'A', cu: w - r, cv: -r, r, a0: PI / 2, a1: 0, tag: 'esquina' },
    ];
    const escuadras = [];
    if (rec) {
      const vf = -rec.b0; // borde del recorte del lado de la cabecera
      cmds.push({ t: 'L', u: w, v: vf + r });
      cmds.push({ t: 'A', cu: w - r, cv: vf + r, r, a0: 0, a1: -PI / 2, tag: 'esquina' });
      cmds.push({ t: 'L', u: rec.a0, v: vf });
      cmds.push({ t: 'L', u: rec.a0, v: -h + r });
      cmds.push({ t: 'A', cu: rec.a0 - r, cv: -h + r, r, a0: 0, a1: -PI / 2, tag: 'esquina' });
      escuadras.push([rec.a0, rec.b0, 1, 1]);
    } else {
      cmds.push({ t: 'L', u: w, v: -h + r });
      cmds.push({ t: 'A', cu: w - r, cv: -h + r, r, a0: 0, a1: -PI / 2, tag: 'esquina' });
    }
    cmds.push({ t: 'L', u: r, v: -h });
    cmds.push({ t: 'A', cu: r, cv: -h + r, r, a0: -PI / 2, a1: -PI, tag: 'esquina' });
    cmds.push({ t: 'L', u: 0, v: -r });
    cmds.push({ t: 'A', cu: r, cv: -r, r, a0: PI, a1: PI / 2, tag: 'esquina' });
    return { plano: 'xz', w, h, cmds, escuadras, esquinas: rec ? 5 : 4, radio: r, recorte: rec, arco: null };
  }
  return null;
}

// ---------- Descripción de los cortes ----------
export function describirPieza(p, cfg) {
  const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
  const mat = p.tipo === 'liston' ? cfg.listones[p.mat] : cfg.materiales[p.mat];
  const c = contorno(p);
  const lineas = [];
  if (!c) {
    lineas.push({
      tipo: 'recto',
      texto: p.tipo === 'liston' ? 'Listón con un corte recto a 90° en cada extremo' : 'Corte recto a 90° en las 4 esquinas',
    });
  } else {
    if (c.esquinas) {
      lineas.push({
        tipo: 'redondo',
        texto: `${c.esquinas} esquinas redondeadas de radio R${fmt(c.radio)} mm (fresadora con fresa de radio o plantilla)`,
      });
    }
    if (c.recorte) {
      lineas.push({
        tipo: 'arco',
        texto: `Recorte rectangular de ${fmt(c.recorte.a1 - c.recorte.a0)} x ${fmt(c.recorte.b1 - c.recorte.b0)} mm en una esquina; su ángulo interior queda a 90°`,
      });
    }
    if (c.arco) {
      lineas.push({
        tipo: 'arco',
        texto: `Arco calado de R${fmt(c.arco.r)} mm (diámetro ${fmt(2 * c.arco.r)} mm) en el borde de abajo; queda ${fmt(c.h - c.arco.r)} mm de madera sobre el arco (plantilla y caladora)`,
      });
      lineas.push({ tipo: 'recto', texto: 'Las 2 esquinas de arriba quedan a 90°; las puntas de abajo las define el arco' });
    }
  }
  return { largo: d[0], ancho: d[1], espesor: d[2], material: mat ? mat.nombre : '', lineas };
}

// ---------- Marco de la cara visible ----------
// Eje fino = el del espesor. En empate se prefiere y, después z y después x.
export function ejeFino(p) {
  const d = [p.sx, p.sy, p.sz];
  let mejor = 1;
  for (const i of [1, 2, 0]) if (d[i] < d[mejor] - 0.5) mejor = i;
  return mejor;
}

export function ejeVista(p) {
  const c = contorno(p);
  if (c) return c.plano === 'xz' ? 1 : 2;
  return ejeFino(p);
}

// Marco de una cara: O es una esquina, U y V los dos ejes de la cara (a lo largo de U la coordenada a, de V la b)
// y N la normal que sale de la pieza. aVan(m, a, b, d) devuelve el punto de la cara, d mm hacia adentro de la pieza.
export function marcoVisible(p, ax, sgn) {
  if (ax === 1) return { ax, sgn, O: [p.x, p.y + (sgn > 0 ? p.sy : 0), p.z], U: E[0], V: E[2], N: por(E[1], sgn), LA: p.sx, LB: p.sz, t: p.sy };
  if (ax === 2) return { ax, sgn, O: [p.x, p.y, p.z + (sgn > 0 ? p.sz : 0)], U: E[0], V: E[1], N: por(E[2], sgn), LA: p.sx, LB: p.sy, t: p.sz };
  return { ax, sgn, O: [p.x + (sgn > 0 ? p.sx : 0), p.y, p.z], U: E[1], V: E[2], N: por(E[0], sgn), LA: p.sy, LB: p.sz, t: p.sx };
}

export const aVan = (m, a, b, d = 0) => resta(suma(suma(m.O, por(m.U, a)), por(m.V, b)), por(m.N, d));

// Pasa un punto de la forma (u, v) a las coordenadas (a, b) del marco
const aMarco = (plano, u, v) => (plano === 'xz' ? [u, -v] : [u, v]);

// ---------- Cámara ----------
// Lado por el que se ve cada eje: x hacia el centro de la van, y desde arriba, z desde la puerta trasera
const signoDe = (ax, ctr, xMedio) => (ax === 0 ? (ctr[0] < xMedio ? 1 : -1) : ax === 1 ? 1 : -1);

export function posarCamara(p, { invertir = false, xMedio = 860, aspecto = 1.6, fovDeg = 45 } = {}) {
  const ctr = [p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2];
  const ax = ejeVista(p);
  const lado = signoDe(ax, ctr, xMedio) * (invertir ? -1 : 1);
  const dims = [p.sx, p.sy, p.sz];
  const otros = [0, 1, 2].filter((i) => i !== ax).sort((i, j) => dims[j] - dims[i]);
  // Las placas planas se miran desde atrás y arriba (la pieza queda derecha en la pantalla); el resto, con una leve vuelta
  // hacia un lado y desde arriba para que se vea el espesor
  const k = ax === 1 ? { 2: 0.55, 0: 0.14 } : { [otros[0]]: 0.32, [otros[1]]: 0.3 };
  const dir = unit(
    suma(suma(por(E[ax], lado), por(E[otros[0]], k[otros[0]] * signoDe(otros[0], ctr, xMedio))), por(E[otros[1]], k[otros[1]] * signoDe(otros[1], ctr, xMedio)))
  );
  // Base de la cámara. El 3D espeja x, por eso la derecha de la pantalla en coordenadas de la van es up x forward
  const f = por(dir, -1);
  const arriba0 = Math.abs(punto(f, E[1])) > 0.97 ? E[2] : E[1];
  const R = unit(cruz(arriba0, f));
  const Up = cruz(f, R);
  let hx = 0;
  let hy = 0;
  let dd = 0;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const c = [(sx * p.sx) / 2, (sy * p.sy) / 2, (sz * p.sz) / 2];
        hx = Math.max(hx, Math.abs(punto(c, R)));
        hy = Math.max(hy, Math.abs(punto(c, Up)));
        dd = Math.max(dd, punto(c, dir));
      }
  const vf = (fovDeg * PI) / 180;
  const hf = 2 * Math.atan(Math.tan(vf / 2) * aspecto);
  const dist = Math.max(450, Math.max((hx * 1.45) / Math.tan(hf / 2), (hy * 2.35) / Math.tan(vf / 2)) + dd);
  return { ctr, ax, lado, dir, R, Up, dist, pos: suma(ctr, por(dir, dist)), marco: marcoVisible(p, ax, lado) };
}

// ---------- Cotas y marcas ----------
// Devuelve todo lo que se dibuja sobre la pieza: cotas con su etiqueta, esquinas redondeadas, arco y ángulos rectos.
export function anotarPieza(p, cam) {
  const m = cam.marco;
  const c = contorno(p);
  const V = (a, b, d = 0) => aVan(m, a, b, d);
  const cotas = [];
  const arcos = [];
  const marcas = [];
  const radios = [];

  const nombres = ['Largo', 'Ancho', 'Espesor'];
  const orden = [m.LA, m.LB, m.t].map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
  const rango = {};
  orden.forEach((o, k) => (rango[o.i] = nombres[k]));

  const off = Math.min(80, Math.max(26, 0.12 * Math.min(m.LA, m.LB)));

  // Cotas de la cara: la que se ve más horizontal va abajo y la otra a la izquierda
  const hEsU = Math.abs(punto(m.U, cam.R)) >= Math.abs(punto(m.V, cam.R));
  const Lh = hEsU ? m.LA : m.LB;
  const Lo = hEsU ? m.LB : m.LA;
  const vh = hEsU ? m.U : m.V;
  const vo = hEsU ? m.V : m.U;
  const pt = (h, o, d = 0) => (hEsU ? V(h, o, d) : V(o, h, d));
  const abajo0 = punto(vo, cam.Up) > 0; // la coordenada o crece hacia arriba: el borde de abajo es o = 0
  const izq0 = punto(vh, cam.R) > 0; // la coordenada h crece hacia la derecha: el borde izquierdo es h = 0
  const oBorde = abajo0 ? 0 : Lo;
  const oLinea = abajo0 ? -off : Lo + off;
  const hBorde = izq0 ? 0 : Lh;
  const hLinea = izq0 ? -off : Lh + off;
  cotas.push({
    ini: pt(0, oLinea),
    fin: pt(Lh, oLinea),
    ext: [
      [pt(0, oBorde), pt(0, oLinea)],
      [pt(Lh, oBorde), pt(Lh, oLinea)],
    ],
    valor: Lh,
    nombre: rango[hEsU ? 0 : 1],
    tipo: 'medida',
  });
  cotas.push({
    ini: pt(hLinea, 0),
    fin: pt(hLinea, Lo),
    ext: [
      [pt(hBorde, 0), pt(hLinea, 0)],
      [pt(hBorde, Lo), pt(hLinea, Lo)],
    ],
    valor: Lo,
    nombre: rango[hEsU ? 1 : 0],
    tipo: 'medida',
  });

  // Espesor: sobre la esquina más a la derecha, hacia afuera
  let mejor = null;
  const rc = c && c.recorte;
  for (const a of [0, m.LA])
    for (const b of [0, m.LB]) {
      if (rc && a >= rc.a0 && b >= rc.b0) continue; // esa esquina no tiene madera
      const q = V(a, b);
      const s = punto(q, cam.R) + 0.3 * punto(q, cam.Up);
      if (!mejor || s > mejor.s) mejor = { s, a, b };
    }
  const sa = mejor.a === m.LA ? 1 : -1;
  const sb = mejor.b === m.LB ? 1 : -1;
  const fuera = por(suma(por(m.U, sa), por(m.V, sb)), (off * 0.7) / Math.SQRT2);
  const e0 = suma(V(mejor.a, mejor.b, 0), fuera);
  const e1 = suma(V(mejor.a, mejor.b, m.t), fuera);
  cotas.push({
    ini: e0,
    fin: e1,
    ext: [
      [V(mejor.a, mejor.b, 0), e0],
      [V(mejor.a, mejor.b, m.t), e1],
    ],
    valor: m.t,
    nombre: rango[2],
    tipo: 'medida',
    etiquetaPos: suma(medio3(e0, e1), por(fuera, 1.7)),
  });

  if (c) {
    // Esquinas redondeadas y arco calado
    for (const k of c.cmds) {
      if (k.t !== 'A') continue;
      const pts = [];
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const ang = k.a0 + ((k.a1 - k.a0) * i) / n;
        const [a, b] = aMarco(c.plano, k.cu + k.r * Math.cos(ang), k.cv + k.r * Math.sin(ang));
        pts.push(V(a, b));
      }
      const mitad = (k.a0 + k.a1) / 2;
      if (k.tag === 'esquina') {
        const [a, b] = aMarco(c.plano, k.cu + (k.r + 22) * Math.cos(mitad), k.cv + (k.r + 22) * Math.sin(mitad));
        arcos.push({ pts, tipo: 'redondo', etiqueta: `R${fmt(k.r)}`, pos: V(a, b) });
      } else {
        const [a, b] = aMarco(c.plano, k.cu, k.cv);
        arcos.push({ pts, tipo: 'arco', etiqueta: '', pos: V(a, b) });
      }
    }
    if (c.arco) {
      const [a0, b0] = aMarco(c.plano, c.arco.a, c.arco.b);
      radios.push({ ini: V(a0, b0), fin: V(a0, b0 + c.arco.r), etiqueta: `Arco R${fmt(c.arco.r)}`, tipo: 'arco' });
      cotas.push({
        ini: V(a0 + 30, b0 + c.arco.r),
        fin: V(a0 + 30, c.h),
        ext: [],
        valor: c.h - c.arco.r,
        nombre: 'Sobre el arco',
        tipo: 'arco',
      });
    }
    if (c.recorte) {
      const r = c.recorte;
      // Las dos medidas del recorte se leen fuera de la placa, sobre su borde delantero y su borde derecho
      cotas.push({
        ini: V(r.a0, r.b1 + 36),
        fin: V(r.a1, r.b1 + 36),
        ext: [
          [V(r.a0, r.b1), V(r.a0, r.b1 + 36)],
          [V(r.a1, r.b1), V(r.a1, r.b1 + 36)],
        ],
        valor: r.a1 - r.a0,
        nombre: 'Recorte',
        tipo: 'arco',
        etiquetaPos: V(r.a0 + 0.5 * (r.a1 - r.a0), r.b1 + 36 + 62),
      });
      cotas.push({
        ini: V(r.a1 + 36, r.b0),
        fin: V(r.a1 + 36, r.b1),
        ext: [
          [V(r.a1, r.b0), V(r.a1 + 36, r.b0)],
          [V(r.a1, r.b1), V(r.a1 + 36, r.b1)],
        ],
        valor: r.b1 - r.b0,
        nombre: 'Recorte',
        tipo: 'arco',
        etiquetaPos: V(r.a1 + 70, (r.b0 + r.b1) / 2),
      });
    }
    for (const [a, b, da, db] of c.escuadras) {
      const l = 14;
      marcas.push([V(a + da * l, b), V(a + da * l, b + db * l), V(a, b + db * l)]);
    }
  } else {
    const l = Math.min(14, m.LA / 4, m.LB / 4);
    for (const [a, b, da, db] of [
      [0, 0, 1, 1],
      [m.LA, 0, -1, 1],
      [m.LA, m.LB, -1, -1],
      [0, m.LB, 1, -1],
    ])
      marcas.push([V(a + da * l, b), V(a + da * l, b + db * l), V(a, b + db * l)]);
  }
  return { cotas, arcos, marcas, radios };
}
