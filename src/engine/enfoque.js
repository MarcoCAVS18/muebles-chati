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
// Las piezas con esquinas redondeadas, recorte, arco o calados interiores no son una caja. El contorno se da como comandos
// en el sistema de la forma (u, v): en las placas planas (plano 'xz') u = x y v = -z; en las de frente (plano 'xy')
// u = x y v = y; en los costados (plano 'zy') u = z y v = y. Las esquinas llevan la marca 'esquina' y el arco calado 'arco'.
// Los calados interiores (ranuras y ventanas) se dan en la pieza como huecos { tipo, a0, a1, b0, b1, r } en las
// coordenadas de su cara (a, b), medidas desde la esquina mínima: ver marcoVisible.
const aMarco = (plano, u, v) => (plano === 'xz' ? [u, -v] : plano === 'zy' ? [v, u] : [u, v]);
const aForma = (plano, a, b) => (plano === 'xz' ? [a, -b] : plano === 'zy' ? [b, a] : [a, b]);

// Rectángulo con esquinas redondeadas en la forma (u, v), recorrido en sentido horario como el contorno de afuera
function rectRedondo(u0, v0, u1, v1, r) {
  if (r < 0.01)
    return [
      { t: 'M', u: u0, v: v1 },
      { t: 'L', u: u1, v: v1 },
      { t: 'L', u: u1, v: v0 },
      { t: 'L', u: u0, v: v0 },
    ];
  return [
    { t: 'M', u: u0 + r, v: v1 },
    { t: 'L', u: u1 - r, v: v1 },
    { t: 'A', cu: u1 - r, cv: v1 - r, r, a0: PI / 2, a1: 0, tag: 'esquina' },
    { t: 'L', u: u1, v: v0 + r },
    { t: 'A', cu: u1 - r, cv: v0 + r, r, a0: 0, a1: -PI / 2, tag: 'esquina' },
    { t: 'L', u: u0 + r, v: v0 },
    { t: 'A', cu: u0 + r, cv: v0 + r, r, a0: -PI / 2, a1: -PI, tag: 'esquina' },
    { t: 'L', u: u0, v: v1 - r },
    { t: 'A', cu: u0 + r, cv: v1 - r, r, a0: PI, a1: PI / 2, tag: 'esquina' },
  ];
}

function huecosDe(p, plano) {
  return (p.huecos || []).map((h) => {
    const r = Math.max(0, Math.min(h.r || 0, (h.a1 - h.a0) / 2, (h.b1 - h.b0) / 2));
    const [ua, va] = aForma(plano, h.a0, h.b0);
    const [ub, vb] = aForma(plano, h.a1, h.b1);
    return { ...h, r, cmds: rectRedondo(Math.min(ua, ub), Math.min(va, vb), Math.max(ua, ub), Math.max(va, vb), r) };
  });
}

// Hay que dibujarla con contorno propio (no como caja)
export const tieneContorno = (p) => !!(p.perfil || p.radio || p.calado || (p.huecos && p.huecos.length) || p.redondeo);

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
      huecos: [],
    };
  }
  if (p.perfil) {
    // Placa en peine: el contorno viene armado de la cama (ranuras abiertas al pasillo, varillas con su lomo)
    const pf = p.perfil;
    return {
      plano: 'xz',
      w: p.sx,
      h: p.sz,
      cmds: pf.cmds,
      escuadras: [],
      esquinas: pf.esquinas,
      radio: pf.radio,
      recorte: null,
      arco: null,
      huecos: [],
      peine: pf,
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
    return { plano: 'xz', w, h, cmds, escuadras, esquinas: rec ? 5 : 4, radio: r, recorte: rec, arco: null, huecos: huecosDe(p, 'xz') };
  }
  if ((p.huecos && p.huecos.length) || p.redondeo) {
    // Pieza plana de cualquier cara con calados interiores y, si lleva, las 4 esquinas redondeadas
    const plano = ['zy', 'xz', 'xy'][[p.sx, p.sy, p.sz].indexOf(Math.min(p.sx, p.sy, p.sz))];
    const [w, h] = plano === 'zy' ? [p.sz, p.sy] : plano === 'xz' ? [p.sx, p.sz] : [p.sx, p.sy];
    const r = Math.min(p.redondeo || 0, w / 2, h / 2);
    const cmds = rectRedondo(0, plano === 'xz' ? -h : 0, w, plano === 'xz' ? 0 : h, r);
    const [la, lb] = plano === 'zy' ? [p.sy, p.sz] : plano === 'xz' ? [p.sx, p.sz] : [p.sx, p.sy];
    const escuadras = r
      ? []
      : [
          [0, 0, 1, 1],
          [la, 0, -1, 1],
          [la, lb, -1, -1],
          [0, lb, 1, -1],
        ];
    return { plano, w, h, cmds, escuadras, esquinas: r ? 4 : 0, radio: r, recorte: null, arco: null, huecos: huecosDe(p, plano) };
  }
  return null;
}


// Agrupa los calados de una pieza por tipo: cantidad, el que se acota (uno entero del medio, para que las cotas caigan
// en el centro de la pieza) y la madera que queda entre ese y el que sigue
export function gruposDeHuecos(c) {
  const por = {};
  for (const h of c.huecos || []) (por[h.tipo] = por[h.tipo] || []).push(h);
  return Object.entries(por).map(([tipo, lista]) => {
    const largoMax = Math.max(...lista.map((h) => h.a1 - h.a0));
    const completos = lista.filter((h) => h.a1 - h.a0 >= largoMax - 0.5);
    const ref = completos[Math.floor((completos.length - 1) / 2)];
    const sig = lista[lista.indexOf(ref) + 1] || null;
    return {
      tipo,
      n: lista.length,
      cortos: lista.length - completos.length,
      primero: ref,
      siguiente: sig,
      costilla: sig ? Math.abs(sig.b0 - ref.b1) : 0,
      bordeA: ref.a0,
      bordeB: ref.b0,
    };
  });
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
        texto: c.peine
          ? `${c.esquinas} esquinas exteriores redondeadas de radio R${fmt(c.radio)} mm (fresadora con fresa de radio o plantilla)${c.peine.tipo === 'movil' ? '; las del lomo siguen el mismo círculo que las de la placa, para que cerrada parezca una sola pieza' : ''}`
          : `${c.esquinas} esquinas redondeadas de radio R${fmt(c.radio)} mm (fresadora con fresa de radio o plantilla)`,
      });
    }
    if (c.peine) {
      const pf = c.peine;
      if (pf.tipo === 'fijo') {
        lineas.push({
          tipo: 'arco',
          texto: `${pf.n} ranuras de ${fmt(pf.ancho)} mm de ancho, abiertas hacia el pasillo, de ${fmt(pf.largoDedo)} mm de fondo; el fondo lleva esquinas R${fmt(c.peine.radioRanura ?? 0)} (taladro en cada esquina, caladora y fresadora o lija para pulirlas)`,
        });
        lineas.push({
          tipo: 'recto',
          texto: `Quedan ${pf.n - 1} dedos fijos de ${fmt(pf.costilla)} mm de ancho entre las ranuras, ${fmt(pf.lomo)} mm de lomo contra la pared y un hueco de ${fmt(pf.lomoM)} mm en el borde del pasillo donde va el lomo móvil`,
        });
        lineas.push({
          tipo: 'recto',
          texto: 'Los pedazos que salen de las ranuras no se tiran: son las varillas móviles. Cortá con cuidado y guardalos en orden',
        });
      } else {
        lineas.push({
          tipo: 'arco',
          texto: `${pf.n} varillas de ${fmt(pf.anchoVarilla)} mm de ancho y ${fmt(pf.largoDedo - pf.luz)} mm de largo, con las puntas de atrás R${fmt(pf.radioRanura ?? 0)}; entran en las ranuras de la placa con ${fmt(pf.luz)} mm de luz a cada lado`,
        });
        lineas.push({
          tipo: 'recto',
          texto: `El lomo de ${fmt(pf.lomoM)} mm del lado del pasillo es parte de esta misma pieza (sale del borde de la placa): las varillas ya vienen unidas. Se atornilla desde arriba al listón de unión`,
        });
      }
    }
    if (c.recorte) {
      lineas.push({
        tipo: 'arco',
        texto: `Recorte rectangular de ${fmt(c.recorte.a1 - c.recorte.a0)} x ${fmt(c.recorte.b1 - c.recorte.b0)} mm en una esquina; su ángulo interior queda a 90°`,
      });
    }
    for (const g of gruposDeHuecos(c)) {
      const h = g.primero;
      const largo = Math.max(h.a1 - h.a0, h.b1 - h.b0);
      const ancho = Math.min(h.a1 - h.a0, h.b1 - h.b0);
      if (h.tipo === 'ranura') {
        lineas.push({
          tipo: 'arco',
          texto: `${g.n} ranuras iguales de ${fmt(largo)} x ${fmt(ancho)} mm, con esquinas R${fmt(h.r)}, a lo ancho de la pieza${g.costilla ? ` y ${fmt(g.costilla)} mm de madera entre una y otra` : ''}${g.cortos ? `; las ${g.cortos} que quedan junto al recorte son más cortas` : ''} (taladro en cada esquina, caladora y fresadora o lija para pulirlas)`,
        });
      } else if (h.tipo === 'asiento') {
        lineas.push({
          tipo: 'arco',
          texto: `Calado circular de ${fmt(2 * h.r)} mm de diámetro, el asiento de la garrafa: su centro queda a ${fmt((h.a0 + h.a1) / 2)} mm del borde izquierdo y a ${fmt((h.b0 + h.b1) / 2)} mm del borde del frente (taladro y caladora; la pieza que sale sirve para otra parte)`,
        });
      } else if (h.tipo === 'puerta') {
        // En el costado (plano zy) la coordenada a es la altura y la b la distancia al frente
        lineas.push({
          tipo: 'arco',
          texto: `Calado de la puerta de ${fmt(largo)} x ${fmt(ancho)} mm con esquinas R${fmt(h.r)}: queda a ${fmt(g.bordeA)} mm del borde de abajo y a ${fmt(g.bordeB)} mm del borde del frente (taladro en las esquinas y caladora). La pieza que sale es la puerta: lijala 2 mm por lado para dejar la luz`,
        });
      } else {
        // En los costados (plano zy) la coordenada a es la altura; en los frentes (plano xy) es el costado
        const abajo = c.plano === 'zy' ? g.bordeA : g.bordeB;
        const lateral = c.plano === 'zy' ? g.bordeB : g.bordeA;
        lineas.push({
          tipo: 'arco',
          texto: `Ventana de ${fmt(largo)} x ${fmt(ancho)} mm con esquinas R${fmt(h.r)}: queda a ${fmt(abajo)} mm del borde de abajo y a ${fmt(lateral)} mm del borde lateral (taladro en las esquinas, caladora y fresadora; la pieza que sale sirve para otra parte)`,
        });
      }
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
  if (c) return c.plano === 'xz' ? 1 : c.plano === 'zy' ? 0 : 2;
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

// ---------- Cámara ----------
// Lado por el que se ve cada eje: x hacia el centro de la van, y desde arriba, z desde la puerta trasera
const signoDe = (ax, ctr, xMedio) => (ax === 0 ? (ctr[0] < xMedio ? 1 : -1) : ax === 1 ? 1 : -1);

export function posarCamara(p, { invertir = false, xMedio = 860, aspecto = 1.6, fovDeg = 45 } = {}) {
  const ctr = [p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2];
  const ax = ejeVista(p);
  const lado = (p.lado || signoDe(ax, ctr, xMedio)) * (invertir ? -1 : 1);
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
      } else if (k.tag === 'esquinaSin') {
        arcos.push({ pts, tipo: 'redondo', etiqueta: '', pos: pts[Math.floor(n / 2)] });
      } else {
        const [a, b] = aMarco(c.plano, k.cu, k.cv);
        arcos.push({ pts, tipo: 'arco', etiqueta: '', pos: V(a, b) });
      }
    }
    // Calados interiores: las esquinas de todos y las medidas del primero de cada tipo
    const referencias = new Set(gruposDeHuecos(c).map((g) => g.primero));
    for (const h of c.huecos) {
      let rotulado = !referencias.has(h);
      for (const k of h.cmds) {
        if (k.t !== 'A') continue;
        const pts = [];
        const n = 12;
        for (let i = 0; i <= n; i++) {
          const ang = k.a0 + ((k.a1 - k.a0) * i) / n;
          const [a, b] = aMarco(c.plano, k.cu + k.r * Math.cos(ang), k.cv + k.r * Math.sin(ang));
          pts.push(V(a, b));
        }
        let etiqueta = '';
        let pos = pts[Math.floor(n / 2)];
        if (!rotulado) {
          rotulado = true;
          etiqueta = `R${fmt(k.r)}`;
          const mitad = (k.a0 + k.a1) / 2;
          const [a, b] = aMarco(c.plano, k.cu + (k.r + 22) * Math.cos(mitad), k.cv + (k.r + 22) * Math.sin(mitad));
          pos = V(a, b);
        }
        arcos.push({ pts, tipo: 'redondo', etiqueta, pos });
      }
    }
    for (const g of gruposDeHuecos(c)) {
      const h = g.primero;
      const am = (h.a0 + h.a1) / 2;
      const bm = (h.b0 + h.b1) / 2;
      const nom = { ranura: 'Ranura', puerta: 'Puerta', asiento: 'Asiento' }[h.tipo] || 'Ventana';
      const aEn = (f) => h.a0 + f * (h.a1 - h.a0);
      // La etiqueta puede ir en otro lugar de la línea para que las de una misma ranura no se pisen
      const cota = (ini, fin, valor, nombre, etiquetaPos) => cotas.push({ ini, fin, ext: [], valor, nombre, tipo: 'arco', ...(etiquetaPos ? { etiquetaPos } : {}) });
      if (h.tipo === 'ranura') {
        // Las ranuras se repiten: el largo, el ancho y la madera entre una y otra se leen en distintos lugares
        cota(V(h.a0, bm), V(h.a1, bm), h.a1 - h.a0, `Ranura de ${fmt(h.b1 - h.b0)} x`, V(aEn(0.27), bm));
        if (g.siguiente && g.costilla > 12) cota(V(aEn(0.78), h.b1), V(aEn(0.78), g.siguiente.b0), g.costilla, 'Entre ranuras');
      } else {
        const nomA = c.plano === 'zy' ? 'Del borde de abajo' : 'Del borde lateral';
        const nomB = c.plano === 'zy' ? (h.tipo === 'puerta' ? 'Del borde del frente' : 'Del borde lateral') : c.plano === 'xz' ? 'Del borde del frente' : 'Del borde de abajo';
        cota(V(h.a0, bm), V(h.a1, bm), h.a1 - h.a0, nom);
        cota(V(aEn(0.12), h.b0), V(aEn(0.12), h.b1), h.b1 - h.b0, nom);
        if (h.b0 > 12) cota(V(aEn(0.85), 0), V(aEn(0.85), h.b0), h.b0, nomB);
        if (h.a0 > 12) cota(V(0, bm), V(h.a0, bm), h.a0, nomA);
      }
    }
    if (c.peine) {
      // Placa en peine: ancho de la ranura (o de la varilla), madera entre una y otra, largo y lomos
      const pf = c.peine;
      const k = Math.floor((pf.n - 1) / 2);
      const movil = pf.tipo === 'movil';
      const zi = pf.ranuras[k] + (movil ? pf.luz : 0) - p.z; // borde de z menor de la ranura o varilla del medio
      const w = movil ? pf.anchoVarilla : pf.ancho;
      const sep = movil ? pf.costilla + 2 * pf.luz : pf.costilla;
      const a0 = (movil ? pf.xl + pf.luz : pf.xl) - p.x; // punta de atrás
      const a1 = pf.xs - p.x;
      const zc = zi + w / 2;
      const cota = (ini, fin, valor, nombre, etiquetaPos) => cotas.push({ ini, fin, ext: [], valor, nombre, tipo: 'arco', ...(etiquetaPos ? { etiquetaPos } : {}) });
      cota(V(a0 + 0.25 * (a1 - a0), zi), V(a0 + 0.25 * (a1 - a0), zi + w), w, movil ? 'Varilla' : 'Ranura');
      if (k < pf.n - 1) cota(V(a0 + 0.75 * (a1 - a0), zi + w), V(a0 + 0.75 * (a1 - a0), zi + w + sep), sep, movil ? 'Entre varillas' : 'Dedo fijo');
      cota(V(a0, zc), V(a1, zc), a1 - a0, movil ? 'Largo de las varillas' : 'Fondo de las ranuras', V((a0 + a1) / 2 + 40, zc));
      if (movil) cota(V(a1, zc), V(p.sx, zc), p.sx - a1, 'Lomo');
      else cota(V(0, zc), V(a0, zc), a0, 'Lomo');
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
