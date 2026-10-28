// Tutorial de armado por mueble. Todo sale del modelo (piezas, huecos, correderas, cables), así que si cambia una
// medida el tutorial cambia con ella. Lo que el modelo no decide (qué aparato real se compra) queda marcado como
// "esperar", y lo que el modelo deja sin resolver queda marcado como "ojo".
import { GRUPOS } from './construir.js';
import { resumenFijaciones } from './fijaciones.js';

const r0 = (n) => Math.round(n);
const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const dimsDe = (p) => [p.sx, p.sy, p.sz].sort((a, b) => b - a);

const solapa = (a, b) =>
  a.x + a.sx > b.x + 0.5 && b.x + b.sx > a.x + 0.5 && a.y + a.sy > b.y + 0.5 && b.y + b.sy > a.y + 0.5 && a.z + a.sz > b.z + 0.5 && b.z + b.sz > a.z + 0.5;

// ---------- Corte: en qué hoja o barra sale cada pieza ----------
function indiceCortes(plan, cfg) {
  const m = new Map();
  for (const [mat, res] of Object.entries(plan.planPlacas)) {
    const nom = cfg.materiales[mat].nombre.replace('Contrachapado ', '');
    for (const h of res.hojas) for (const t of h.tiras) for (const it of t.items) m.set(it.id, `${nom}, hoja ${h.numero}`);
  }
  for (const [mat, res] of Object.entries(plan.planListones)) {
    const nom = cfg.listones[mat].nombre;
    res.barras.forEach((b, i) => b.items.forEach((it) => m.set(it.id, `${nom}, barra ${i + 1}`)));
  }
  return m;
}

// Filas de piezas para mostrar en un paso: id, nombre, medida y de qué hoja sale
function filas(partes, cortes) {
  return partes.map((p) => {
    const d = dimsDe(p);
    const medida = p.tipo === 'liston' ? `${fmt(d[0])} mm de largo` : `${fmt(d[0])} x ${fmt(d[1])} x ${fmt(d[2])}`;
    return { id: p.id, nombre: p.nombre, medida, corte: cortes.get(p.id) || '' };
  });
}

// Tabla de hojas y barras de un mueble: qué piezas de ESTE mueble salen de cada una
function tablaCortes(grupo, prefijo, plan, cfg) {
  const out = [];
  for (const [mat, res] of Object.entries(plan.planPlacas)) {
    const nom = cfg.materiales[mat].nombre;
    for (const h of res.hojas) {
      const ids = [];
      let otras = 0;
      for (const t of h.tiras) for (const it of t.items) (it.id.startsWith(prefijo) ? ids.push(it.id) : otras++);
      if (ids.length) out.push([`${nom}, hoja ${h.numero}`, ids.join(', '), otras ? `${otras} de otros muebles` : '']);
    }
  }
  for (const [mat, res] of Object.entries(plan.planListones)) {
    const nom = cfg.listones[mat].nombre;
    res.barras.forEach((b, i) => {
      const its = b.items.filter((it) => it.id.startsWith(prefijo));
      if (its.length) out.push([`${nom}, barra ${i + 1}`, its.map((it) => `${it.id} (${fmt(it.largo)} mm)`).join(', '), b.items.length > its.length ? `${b.items.length - its.length} de otros muebles` : '']);
    });
  }
  return { titulo: 'De qué hoja o barra sale cada pieza', cabecera: ['Hoja o barra', 'Piezas de este mueble', 'Aparte'], filas: out };
}

// ---------- Cables y mangueras que cruzan una placa: agujeros y muescas ----------
const EJES = {
  // k: eje en el que la placa es fina; u y v: los dos ejes que quedan; etiquetas de los bordes y de las distancias
  1: { u: 0, v: 2, eu: ['lado izquierdo', 'lado derecho'], ev: ['frente', 'fondo (atrás)'], nu: 'del lado izquierdo', nv: 'del frente' },
  0: { u: 2, v: 1, eu: ['frente', 'fondo (atrás)'], ev: ['abajo', 'arriba'], nu: 'del frente', nv: 'de abajo' },
  2: { u: 0, v: 1, eu: ['izquierda', 'derecha'], ev: ['abajo', 'arriba'], nu: 'del lado izquierdo', nv: 'de abajo' },
};

export function agujerosDe(data, e3) {
  const placas = data.partes.filter((p) => p.tipo === 'placa');
  const mapa = new Map();
  for (const c of [...e3.cables, ...e3.mangueras]) {
    const pts = c.puntos;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const ejes = [0, 1, 2].filter((k) => Math.abs(a[k] - b[k]) > 0.5);
      if (ejes.length !== 1) continue;
      const k = ejes[0];
      const lo = Math.min(a[k], b[k]);
      const hi = Math.max(a[k], b[k]);
      for (const p of placas) {
        const o = [p.x, p.y, p.z];
        const s = [p.sx, p.sy, p.sz];
        if (s[k] > 16) continue;
        if (!(lo < o[k] - 0.5 && hi > o[k] + s[k] + 0.5)) continue;
        if ([0, 1, 2].filter((j) => j !== k).some((j) => a[j] < o[j] + 3 || a[j] > o[j] + s[j] - 3)) continue;
        if (!mapa.has(p.id)) mapa.set(p.id, { p, k, hits: [] });
        mapa.get(p.id).hits.push({ nombre: c.nombre, punto: a });
      }
    }
  }
  const out = [];
  for (const { p, k, hits } of mapa.values()) {
    const ej = EJES[k];
    const o = [p.x, p.y, p.z];
    const s = [p.sx, p.sy, p.sz];
    const W = s[ej.u];
    const H = s[ej.v];
    const grupos = [];
    for (const h of hits) {
      const u = h.punto[ej.u] - o[ej.u];
      const v = h.punto[ej.v] - o[ej.v];
      const g = grupos.find((q) => Math.hypot((q.u0 + q.u1) / 2 - u, (q.v0 + q.v1) / 2 - v) < 45);
      if (g) {
        g.u0 = Math.min(g.u0, u);
        g.u1 = Math.max(g.u1, u);
        g.v0 = Math.min(g.v0, v);
        g.v1 = Math.max(g.v1, v);
        if (!g.pasan.includes(h.nombre)) g.pasan.push(h.nombre);
      } else {
        grupos.push({ u0: u, u1: u, v0: v, v1: v, pasan: [h.nombre] });
      }
    }
    for (const g of grupos) {
      const cu = (g.u0 + g.u1) / 2;
      const cv = (g.v0 + g.v1) / 2;
      const cerca = [];
      if (g.u0 < 16) cerca.push(ej.eu[0]);
      if (W - g.u1 < 16) cerca.push(ej.eu[1]);
      if (g.v0 < 16) cerca.push(ej.ev[0]);
      if (H - g.v1 < 16) cerca.push(ej.ev[1]);
      const ancho = g.u1 - g.u0;
      const alto = g.v1 - g.v0;
      let que;
      if (cerca.length) {
        const largoMuesca = r0(Math.max(30, Math.max(ancho, alto) + 25));
        que = `Muesca de ${largoMuesca} mm sobre el borde (${cerca.join(' y ')}): ${g.pasan.length > 1 ? 'pasan varios cables juntos' : 'el cable'} a menos de 16 mm del borde y un agujero de 20 mm no entra`;
      } else if (g.pasan.length > 2 || ancho > 30 || alto > 30) {
        que = `Ventana de ${r0(Math.max(40, ancho + 25))} x ${r0(Math.max(30, alto + 25))} mm con las esquinas redondeadas (pasan ${g.pasan.length} juntos)`;
      } else {
        que = 'Agujero de 20 mm con pasacables de goma';
      }
      out.push({
        grupo: p.grupo,
        pieza: p.id,
        nombre: p.nombre,
        donde: `a ${r0(cu)} mm ${ej.nu} y a ${r0(cv)} mm ${ej.nv}`,
        que,
        pasan: g.pasan,
      });
    }
  }
  return out;
}

// ---------- Calados de aparatos que atraviesan una placa ----------
const CALADOS = ['nevera', 'anafe', 'fregadero', 'detectorGas'];
const EN_TABLERO = ['panelSwitches', 'enchufe1', 'enchufe2'];

export function caladosDe(data, e3) {
  const eqs = [...data.equipos, ...e3.equipos];
  const placas = data.partes.filter((p) => p.tipo === 'placa');
  const out = [];
  const rect = (p, e) => {
    const k = [p.sx, p.sy, p.sz].findIndex((v) => v <= 16);
    const ej = EJES[k];
    const o = [p.x, p.y, p.z];
    const q = [e.x, e.y, e.z];
    const a = [p.sx, p.sy, p.sz];
    const b = [e.sx, e.sy, e.sz];
    const u0 = Math.max(o[ej.u], q[ej.u]) - o[ej.u];
    const u1 = Math.min(o[ej.u] + a[ej.u], q[ej.u] + b[ej.u]) - o[ej.u];
    const v0 = Math.max(o[ej.v], q[ej.v]) - o[ej.v];
    const v1 = Math.min(o[ej.v] + a[ej.v], q[ej.v] + b[ej.v]) - o[ej.v];
    return { u0, u1, v0, v1, ej };
  };
  for (const e of eqs.filter((q) => CALADOS.includes(q.id))) {
    for (const p of placas.filter((pl) => solapa(e, pl))) {
      const r = rect(p, e);
      out.push({
        grupo: p.grupo,
        aparato: e.nombre,
        pieza: p.id,
        nombre: p.nombre,
        medida: `${r0(r.u1 - r.u0)} x ${r0(r.v1 - r.v0)} mm`,
        donde: `desde ${r0(r.u0)} mm ${r.ej.nu} y ${r0(r.v0)} mm ${r.ej.nv}`,
      });
    }
  }
  // Tablero: el panel de interruptores y los enchufes se meten por detrás del frente, el cuerpo atraviesa el tablero
  const tab = placas.find((p) => /^Tablero del panel/.test(p.nombre));
  if (tab) {
    for (const e of eqs.filter((q) => EN_TABLERO.includes(q.id))) {
      out.push({
        grupo: tab.grupo,
        aparato: e.nombre,
        pieza: tab.id,
        nombre: tab.nombre,
        medida: `${r0(e.sx)} x ${r0(e.sy)} mm`,
        donde: `desde ${r0(e.x - tab.x)} mm del lado izquierdo y ${r0(e.y - tab.y)} mm de abajo`,
        estimado: true,
      });
    }
  }
  return out;
}

// ---------- Cajones: medidas de la caja, correderas y frente ----------
const FRENTE_ESPECIAL = { 'Cajón de la garrafa': 'Frente cajón del gas' };

export function cajonesDe(data, grupo) {
  const del = (re) => data.partes.filter((p) => p.grupo === grupo && re.test(p.nombre));
  const lat = del(/ - lateral$/);
  const nombres = [...new Set(lat.map((p) => p.nombre.replace(/ - lateral$/, '')))];
  return nombres.map((nombre) => {
    const l = lat.filter((p) => p.nombre === `${nombre} - lateral`);
    const a = l[0];
    const ejeAncho = a.sx <= 16 ? 'x' : 'z';
    const largo = ejeAncho === 'x' ? a.sz : a.sx;
    const lo = Math.min(...l.map((p) => p[ejeAncho]));
    const hi = Math.max(...l.map((p) => p[ejeAncho] + (ejeAncho === 'x' ? p.sx : p.sz)));
    const frenteNombre = FRENTE_ESPECIAL[nombre] || `Frente ${nombre.toLowerCase()}`;
    const frente = data.partes.find((p) => p.grupo === grupo && p.nombre === frenteNombre);
    const delantera = data.partes.find((p) => p.grupo === grupo && p.nombre === `${nombre} - delantera`);
    const piso = data.partes.find((p) => p.grupo === grupo && p.nombre.startsWith(`${nombre} - piso`));
    const trasera = data.partes.find((p) => p.grupo === grupo && p.nombre === `${nombre} - trasera`);
    const herr = data.herrajes.find((h) => h.grupo === grupo && h.nota === nombre);
    const carga = !!herr && /carga/.test(herr.nombre);
    const piezas = [...l, trasera, piso, delantera, frente].filter(Boolean);
    return {
      nombre,
      laterales: l,
      piezas,
      ancho: hi - lo,
      alto: a.sy,
      largo,
      corredera: Math.floor(largo / 50) * 50,
      herraje: herr ? herr.nombre : '',
      yCentro: a.y + a.sy / 2,
      yBase: a.y,
      hueco: hi - lo + 26,
      carga,
      frente,
    };
  });
}

function rangoMm(vals) {
  const a = r0(Math.min(...vals));
  const b = r0(Math.max(...vals));
  return a === b ? `${a} mm` : `${a} a ${b} mm`;
}

function tablaCajones(cajones, extra = () => '') {
  return {
    titulo: 'Cada cajón',
    cabecera: ['Cajón', 'Caja (ancho x alto x largo)', 'Corredera', 'Altura de la corredera', 'Hueco libre', 'Frente'],
    filas: cajones.map((c) => [
      c.nombre + extra(c),
      `${r0(c.ancho)} x ${r0(c.alto)} x ${r0(c.largo)} mm`,
      `${c.corredera} mm${c.carga ? ' de carga' : ' telescópica'}`,
      `centro del lateral: ${r0(c.yCentro)} mm del piso de la van (${r0(c.alto / 2)} mm sobre la base de la caja)`,
      `${r0(c.hueco)} mm`,
      c.frente ? `${c.frente.id}: ${fmt(dimsDe(c.frente)[0])} x ${fmt(dimsDe(c.frente)[1])}` : '',
    ]),
  };
}

// ---------- Botones push: dónde va cada uno ----------
function tablaBotones(data, grupo) {
  const lista = data.botones.filter((b) => b.grupo === grupo);
  return {
    titulo: 'Botones push (el centro de cada uno, sobre la cara del frente)',
    cabecera: ['Frente', 'Pieza', 'Posición'],
    filas: lista.map((b) => {
      const p = data.partes.find((q) => q.grupo === grupo && q.nombre === b.nombre);
      if (!p) return [b.nombre, '', ''];
      const normalX = p.sx <= 16;
      const u = normalX ? b.cz - p.z : b.cx - p.x;
      const v = b.cy - p.y;
      return [b.nombre, p.id, `a ${r0(u)} mm ${normalX ? 'del borde de atrás' : 'del borde izquierdo'} y a ${r0(v)} mm del borde de abajo`];
    }),
  };
}

// ---------- Lista de compras de un mueble ----------
function listaDe(data, grupo) {
  const fij = resumenFijaciones(data.uniones, data.anclajes);
  const mapa = new Map();
  for (const u of fij.porGrupo[grupo] || []) mapa.set(u.herrajeNombre, (mapa.get(u.herrajeNombre) || 0) + u.cantidad);
  return {
    herrajes: data.herrajes.filter((h) => h.grupo === grupo).map((h) => ({ nombre: h.nombre, cantidad: h.cantidad, nota: h.nota })),
    fijaciones: [...mapa].map(([nombre, cantidad]) => ({ nombre, cantidad })),
  };
}

// ---------- Contenido general ----------
function generales(cfg) {
  const t = cfg.materiales.estructura.t;
  return {
    herramientas: [
      'Sierra circular con guía (o sierra de mesa), caladora con hojas finas para contrachapado, fresadora o lijadora.',
      'Taladro atornillador, brocas de 2,5 mm, 3 mm, 4 mm, 5 mm y 10 mm; avellanador; broca Forstner o copa de 35 mm para las bisagras; broca de copa de 20 mm para los pasacables.',
      'Sargentos o prensas (mínimo 4), escuadra grande, nivel, metro, lápiz, cinta de enmascarar, cola PVA D3 y un trapo húmedo.',
      'Pistola de cartuchos con butilo o sellador para los agujeros que llegan al piso.',
    ],
    reglas: [
      `Todas las uniones llevan cola PVA D3 más tornillos. Sin cola, el tornillo solo se afloja con las vibraciones de la van.`,
      `Tornillo 4x40 para unir una cara contra un canto: entran ${40 - t} mm dentro del canto. Si la cara contra cara es de ${t} mm y ${t} mm (marcos, delanteras de cajón), el 4x40 atraviesa todo: ahí va el 4x25.`,
      'Pretaladrá siempre: 4 mm pasante y avellanado en la pieza de cara; 2,5 a 3 mm en el canto de la otra, a unos 30 mm de profundidad. Sin pretaladrar el contrachapado se abre.',
      'Primer tornillo a 30 mm del extremo, después uno cada 150 mm (120 mm en cajones). Nunca a menos de 10 mm de un borde.',
      'Cola en las dos superficies, apretá con sargentos, escuadrá con la diagonal (las dos diagonales tienen que dar lo mismo) y sacá la cola que rebalsa con trapo húmedo antes de que seque.',
      'Los cantos que quedan a la vista, lijalos y sellalos. Los de las zonas con agua (bidones, fregadero, cajón de agua) sellalos con cola o barniz antes de armar.',
    ],
    seguridad: [
      'Antes de taladrar el piso o una pared de la van mirá qué hay del otro lado (cañerías de combustible, cables, freno). Un tornillo de más largo que el listón del piso puede perforar la chapa o un cable.',
      'El gas lo conecta un instalador matriculado, no lo hagas vos. Prepará el mueble y los pasos, pero la llave, el regulador y las mangueras de gas las deja probadas él.',
      'La parte eléctrica la revisa el técnico antes de cerrar nada. Conectá la batería siempre al final y con los interruptores abajo.',
      'Gafas, guantes y mascarilla cuando cortás o lijás contrachapado: el polvo de la cola irrita.',
    ],
    orden: [
      'Primero el mueble trasero: es la referencia de todo lo demás (la cama se une a su frente).',
      'Después la cama, que se apoya en el mueble trasero y en el piso.',
      'Al final el mueble derecho, que depende del pasarruedas derecho y de la pared.',
      'Los cajones, puertas y botones van al final de cada mueble, cuando el cuerpo ya está fijo y a escuadra.',
      'Las cajas de los pasarruedas y el piso de la van no están en esta app: se hacen antes, con vos.',
    ],
  };
}

// ---------- Tutorial del mueble trasero ----------
function trasero(data, plan, cfg, e3, cortes, indice) {
  const G = 'Mueble trasero';
  const L = data.layout.trasero;
  const t = cfg.materiales.estructura.t;
  const por = (re) => data.partes.filter((p) => p.grupo === G && re.test(p.nombre));
  const f = (re) => filas(por(re), cortes);
  const ag = agujerosDe(data, e3).filter((a) => a.grupo === G);
  const cal = caladosDe(data, e3).filter((a) => a.grupo === G);
  const cajones = cajonesDe(data, G);
  const entraPiso = 50 - (t + L.yBase);
  const estantes = por(/^Estante/);
  const pasos = [];

  pasos.push({
    id: 'tra-1',
    titulo: 'Cortar y rotular',
    intro: `Todo el mueble sale del contrachapado de ${t} mm y del de ${cfg.materiales.fondo.t} mm. Seguí el plano de la pestaña «Placas y cortes».`,
    hacer: [
      'Con sierra circular apoyá la cara linda hacia abajo; con caladora, hacia arriba. Así no astilla donde se ve.',
      'Cortá primero las tiras de la hoja a lo ancho y después cada tira a lo largo, como dice el plano.',
      'Rotulá cada pieza con su id (TRA-xx) en la cara que va por dentro, apenas la cortás. Con tantas piezas parecidas es la única forma de no confundirse.',
      'Lijá los cantos que quedan a la vista (frentes, tapas, zócalos) y sellá los de bidones, fregadero y cajón de agua.',
    ],
    piezas: [],
    tablas: [tablaCortes(G, 'TRA-', plan, cfg)],
    ojo: [`Las medidas descuentan ${cfg.corte.kerf} mm de corte entre pieza y pieza y ${cfg.corte.recorte} mm de borde de la hoja. Si tu sierra corta más gruesa, avisame y recalculo.`],
  });

  pasos.push({
    id: 'tra-2',
    titulo: 'Agujeros y muescas, antes de armar',
    intro: 'Los cables y las mangueras pasan de un compartimento a otro por las piezas. Es mucho más fácil taladrar ahora, con la pieza sobre el banco, que después dentro de la caja.',
    hacer: [
      'Marcá cada punto con las medidas de la tabla: la primera distancia es hacia el costado o el frente, la segunda hacia abajo o hacia el frente, según dice.',
      'Agujeros con broca de copa de 20 mm por la cara linda (astilla menos), lijá el borde y poné el pasacables de goma.',
      'Donde dice «muesca» el cable pasa pegado al borde: serruchá una media luna de unos 30 mm en el canto y lijala.',
      'Donde pasan varios cables juntos hacé una ventana con esquinas redondeadas y poné un pasacables en tira, o un agujero por cable si hay lugar.',
    ],
    piezas: [],
    tablas: [
      {
        titulo: 'Por dónde pasan los cables y las mangueras',
        cabecera: ['Pieza', 'Dónde', 'Qué hacer', 'Pasa'],
        filas: ag.map((a) => [`${a.pieza} ${a.nombre}`, a.donde, a.que, a.pasan.join('; ')]),
      },
    ],
    ojo: [
      'Las posiciones salen del recorrido de cables del 3D. Si cambiás el recorrido en la pestaña Eléctrica, volvé a mirar esta tabla antes de taladrar.',
      'Esta tabla no incluye los aparatos que atraviesan una pieza (heladera, anafe, fregadero): esos se cortan con el aparato en la mano, en el paso de las tapas.',
    ],
  });

  pasos.push({
    id: 'tra-3',
    titulo: 'Módulo eléctrico (el de la izquierda, en L)',
    intro: `Es una caja de ${r0(L.d1 + t)} mm de ancho con el costado izquierdo, el divisor 1 como pared derecha, la base y el fondo. Se arma afuera. La cara derecha del divisor 1 es donde después se apoya el otro módulo.`,
    hacer: [
      `Con la base boca abajo, pegá y atornillá los apoyos: adelante, al medio y atrás, a ras de los bordes (tornillos 3,5x30 desde arriba, uno cada 150 mm). La base queda ${L.yBase} mm sobre el piso y sin esto se pandea con la batería.`,
      'Apoyá el costado izquierdo acostado. Marcá en su cara de adentro la línea de abajo de la base y la del zócalo.',
      'Pegá y atornillá la base al costado (4x40 desde la cara de afuera del costado, a ras del borde de atrás y del frente).',
      'Parate el divisor 1 sobre la base, a ras del borde derecho, y atornillalo desde abajo, entre los apoyos. Escuadralo con la escuadra grande.',
      'Pegá el zócalo al frente de la base, entre el costado y el divisor.',
      'Pegá el fondo de 9 mm contra los cantos de atrás (base, divisor) con puntas o tornillos 3x20 cada 100 mm. Es lo que te deja la caja a escuadra: medí las dos diagonales.',
    ],
    piezas: [...f(/^(Base|Zócalo frontal) \(eléctrico\)|^Apoyo bajo la base.*\(eléctrico\)/), ...f(/^Costado izquierdo$/), ...f(/^Divisor eléctrico y cocina/), ...f(/^Fondo eléctrico/)],
    ojo: [
      'El fondo de 9 mm no toca el canto del costado izquierdo (el costado mide 15 mm y el fondo empieza a 15): la escuadra la da la base. Que no se mueva hasta fijarla a la van.',
      'No pongas todavía los estantes ni los marcos: la batería y los equipos pesados entran por arriba y por adelante.',
    ],
  });

  pasos.push({
    id: 'tra-4',
    titulo: 'Módulo de la cocina y el agua',
    intro: `Es una caja de ${r0(L.x1 - (L.d1 + t))} mm de ancho con el costado derecho, el divisor 2, la base y el fondo. No tiene pared izquierda: la pared es el divisor 1 del otro módulo.`,
    hacer: [
      'Pegá y atornillá los tres apoyos debajo de la base, igual que en el módulo eléctrico.',
      'Apoyá el costado derecho acostado y fijale la base (4x40 desde afuera). Parate el divisor 2 sobre la base y atornillalo desde abajo, entre los apoyos.',
      'Pegá el zócalo al frente y el fondo de 9 mm atrás, con puntas o tornillos 3x20.',
      'Como falta la pared izquierda, la caja tiende a abrirse en V: atravesale un listón provisorio arriba (atornillado en los dos extremos) hasta que esté apoyada contra el divisor 1.',
    ],
    piezas: [...f(/^(Base|Zócalo frontal) \(cocina y agua\)|^Apoyo bajo la base.*\(cocina y agua\)/), ...f(/^Costado derecho$/), ...f(/^Divisor cocina y agua/), ...f(/^Fondo cocina y agua/)],
    ojo: ['El costado derecho queda a la vista desde el pasillo: avellaná los tornillos y tapalos con masilla o tapones.'],
  });

  pasos.push({
    id: 'tra-5',
    titulo: 'Llevarlos a la van, fijarlos y unirlos',
    intro: 'El mueble mide 1560 mm de ancho y no pasa entero por las puertas: por eso son dos módulos. Se meten por separado y se unen adentro.',
    hacer: [
      'Antes de subir nada: marcá en el piso de la van dónde están los 4 listones del piso (medí desde la pared izquierda) y pasalos a la base de cada módulo. Los tornillos al piso tienen que caer sobre un listón.',
      `Tornillo al piso: 5x50 entra ${entraPiso} mm en el listón (${50} mm menos ${t} mm de base y ${L.yBase} mm de apoyo). Antes de usarlo medí la altura del listón: el tornillo no puede pasar de su altura menos 5 mm. Si el listón es más bajo, usá 5x40.`,
      'Primero el módulo eléctrico: contra el mamparo y la pared izquierda. Nivelalo con cuñas de contrachapado, sellá con butilo cada agujero del piso y atornillá.',
      'Fijá el costado izquierdo a la pared y el fondo al mamparo con escuadras L (arriba y abajo). Dejá sin tapar el pasacables del eléctrico en el fondo.',
      'Después el módulo de cocina y agua: deslizalo hasta que toque la cara derecha del divisor 1. Pasá cola en los cantos que se tocan (base, zócalo, fondo) y atornillalo al piso igual que el otro.',
      'Unión: tres tornillos 4x25 desde el compartimento eléctrico, a través del divisor 1, al montante izquierdo de la cocina (arriba, al medio y abajo). Son 4x25 porque un 4x40 atraviesa el montante de 15 mm.',
      'Dos escuadras L 40x40 debajo de la tapa 2 (cuando la pongas, paso 10), contra la cara del divisor 1, con tornillos cortos de 12 mm para que no atraviesen los 15 mm.',
    ],
    piezas: [],
    tablas: [],
    ojo: [
      'La unión entre módulos es lo más flojo del diseño. Lo que lo sostiene es que ambos están atornillados al piso, a las paredes y al mamparo.',
      'Las escuadras al mamparo del modelo traen tornillo autoperforante de 19 mm: con un fondo de 9 mm no llega a la chapa. Usá 4,8x32.',
      'No sé todavía qué altura tiene el listón del piso, ni si el ancho de 1560 vale para toda la van. Hasta medirlo, no atornilles al piso.',
    ],
  });

  pasos.push({
    id: 'tra-6',
    titulo: 'Estantes sobre soportes regulables',
    intro: 'Los cuatro estantes no se pegan: apoyan en soportes de 5 mm, así se pueden sacar para llegar al fondo. Se colocan con el mueble ya fijo.',
    hacer: [
      'Marcá cada soporte con la plantilla: dos por costado, a 50 mm del frente del estante y a 50 mm del fondo.',
      'Taladrá con broca de 5 mm y tope a 8 mm de profundidad. El divisor mide 15 mm y le entran agujeros de los dos lados: nunca más de 8 mm por lado.',
      'La cara de arriba del soporte va al nivel de la cara de abajo del estante, medida de la tabla.',
      'Probá cada estante antes de usarlo: tiene que entrar sin forzar y apoyar en los 4 soportes.',
    ],
    piezas: filas(estantes, cortes),
    tablas: [
      {
        titulo: 'Altura de cada estante (cara de abajo, desde el piso de la van)',
        cabecera: ['Estante', 'Altura', 'Medida del estante'],
        filas: estantes.map((p) => [`${p.id} ${p.nombre}`, `${r0(p.y)} mm`, `${fmt(dimsDe(p)[0])} x ${fmt(dimsDe(p)[1])} mm`]),
      },
    ],
    ojo: ['La altura es desde el piso de la van, no desde la base del mueble (la base queda a 35 mm del piso con su apoyo).'],
  });

  const marcoE = por(/^Frente eléctrico - montante|^Tablero del panel|^Frente de la heladera - travesaño/);
  const marcoK = por(/^Frente cocina - /);
  const marcoW = por(/^Frente agua - /);
  pasos.push({
    id: 'tra-7',
    titulo: 'Marcos de los frentes',
    intro: `Los frentes son planos y las puertas van a ras, metidas en el hueco con 2 mm de luz. El marco (montantes y travesaños de ${t} mm) cierra la cara de adelante del mueble.`,
    hacer: [
      'Armá cada marco sobre el banco: travesaño entre montantes, cola y dos tornillos 4x25 por unión, pretaladrando el canto del travesaño.',
      'Llevalo al mueble: cola en los cantos de la base y de los divisores, y 4x25 desde adentro del costado o del divisor hacia el montante.',
      'Medí cada hueco con una regla antes de cortar o colocar una puerta: tiene que dar el ancho de la puerta más 4 mm.',
      'El frente fijo de la heladera (TRA-21) se saca para llegar al compresor: sujetalo con 4 tornillos a tacos de 15x15 pegados detrás del marco.',
    ],
    piezas: [...filas(marcoE, cortes), ...filas(marcoK, cortes), ...filas(marcoW, cortes)],
    ojo: ['Los montantes miden solo 15 mm de ancho. Con ese ancho entra un tornillo, pero la unión depende de la cola: apretá bien con sargentos y dejá secar una noche.'],
  });

  pasos.push({
    id: 'tra-8',
    titulo: 'Cajones y correderas',
    intro: 'Cinco cajones se tiran hacia el pasillo. Cada caja lleva dos laterales, una trasera, un piso y una delantera de 15 mm; el frente se atornilla a la delantera desde adentro.',
    hacer: [
      'Armá cada caja: laterales contra los cantos de la trasera y de la delantera (4x40 desde afuera, pretaladrando el canto) y escuadrala con la diagonal.',
      'El piso va entre los laterales, al ras de abajo: cola y puntas, o tornillos 3,5x20 desde afuera por los laterales al canto del piso. El de bidones es de 15 mm.',
      'Corredera en el cajón: a ras del canto de adelante del lateral y centrada en el alto del lateral (tabla). Cada lado deja 13 mm de luz: la caja mide el hueco menos 26 mm.',
      'Corredera en el mueble: a la misma altura del piso de la van que la del cajón, a ras del borde de adelante del mueble. Nivelá con un listón de apoyo antes de atornillar.',
      'Colgá la caja y probala sin frente: tiene que correr y frenar sin rozar.',
      'Frente: ponelo en el hueco con 2 mm de luz, calzá con recortes de 2 mm y atornillalo a la delantera desde adentro de la caja con cuatro tornillos 4x25.',
    ],
    piezas: cajones.flatMap((c) => filas(c.piezas, cortes)),
    tablas: [tablaCajones(cajones)],
    ojo: [
      'El cajón de bidones carga unos 40 kg: usá correderas de carga y fijalas con todos los tornillos que traen, en todos los agujeros.',
      'Los cajones de cocina son cortos a propósito: atrás quedan libres la llave de corte y el caño de gas. No los alargues.',
    ],
  });

  pasos.push({
    id: 'tra-9',
    titulo: 'Puertas, frentes y botones push',
    intro: 'La puerta de la batería y los equipos es ancha y lleva tres bisagras de cazoleta. Los demás frentes abren con botones push redondos: no hay tiradores.',
    hacer: [
      'Cazoletas: broca Forstner de 35 mm, 12 mm de profundidad (con tope), con el centro a 22,5 mm del canto de la bisagra. Probá antes en un recorte.',
      `Posiciones de las tres bisagras de la puerta TRA-19, medidas desde los extremos del canto de ${r0(dimsDe(data.partes.find((p) => p.nombre === 'Puerta de la batería y los equipos'))[1])} mm: a 60 mm de cada punta y una al medio.`,
      'Botones push: taladrá del diámetro que diga la ficha del botón que compres (el modelo supone 28 mm) y fijalos con su pestillo. Medidas en la tabla.',
      'Dos rejillas de 100 mm en la puerta de la batería para el inversor y el DC-DC, y dos en el frente fijo de la heladera (una arriba y una abajo).',
    ],
    piezas: [...filas(por(/^Puerta de la batería/), cortes), ...filas(por(/^Frente fijo de la heladera/), cortes)],
    tablas: [tablaBotones(data, G)],
    ojo: [
      'Los montantes de 15 mm son muy angostos para la placa de la bisagra. Comprá la bisagra recién cuando tengas el contrachapado en la mano y probá una: puede hacer falta una placa con distanciador o un listón detrás del montante.',
      'Con las bisagras a la izquierda de cada puerta, el botón queda a la derecha. Si cambiás de lado, cambiá también los botones.',
    ],
  });

  pasos.push({
    id: 'tra-10',
    titulo: 'Tapas y calados de los aparatos',
    intro: 'Las tres tapas se atornillan desde arriba a los costados, divisores y marcos. Los calados del anafe, el fregadero y la heladera se hacen con el aparato real en la mano.',
    hacer: [
      'Antes de poner una tapa, pasá lo que va por abajo: mangueras, cables y la batería.',
      'Apoyá la tapa, marcá con cinta de enmascarar el contorno del aparato y dejá 3 a 5 mm de luz. Las medidas de la tabla son del modelo, no del catálogo.',
      'Calá con la caladora (primero un agujero de 10 mm en una esquina), lijá y sellá el canto. En las tapas 2 y 3 sellá bien: acá cae agua.',
      'Tapa 1: encima del compartimento eléctrico y la heladera. Tapa 2: la cocina. Tapa 3: el fregadero.',
      'Atornillá desde arriba cada 150 mm, a 15 mm del borde, con avellanado y masilla. La tapa 2 se une a la tapa 1 con cola en el canto.',
    ],
    piezas: filas(por(/^Tapa \d/), cortes),
    tablas: [
      {
        titulo: 'Calados (esperá al aparato real)',
        cabecera: ['Aparato', 'Pieza', 'Medida', 'Dónde'],
        filas: cal.map((c) => [`${c.aparato}${c.estimado ? ' (medida estimada)' : ''}`, `${c.pieza} ${c.nombre}`, c.medida, c.donde]),
      },
    ],
    ojo: ['El anafe y el fregadero todavía no están elegidos, y la medida de los enchufes y del panel es estimada. No cortes nada de esta tabla hasta tener el aparato.'],
  });

  pasos.push({
    id: 'tra-11',
    titulo: 'Instalaciones: eléctrica, agua y gas',
    intro: 'Esto no se improvisa: el orden evita que tengas que desarmar.',
    hacer: [
      'Eléctrica: la hace o la revisa el técnico. Los cables ya van en la pestaña Eléctrica, con calibres, fusibles y largos. La batería se conecta al final.',
      'Agua: bidón de agua limpia atrás, bomba a la derecha del mueble, manguera de grado alimenticio con abrazaderas hasta la canilla. El bidón de aguas grises va adelante.',
      'Fregadero: sifón con la salida hacia el bidón de aguas grises. Probalo con agua antes de tapar.',
      'Gas: caño del regulador a la llave de corte y de ahí al anafe. Lo conecta y lo prueba el instalador. Dejá el cajón de la garrafa sin nada encima.',
      'Ventilación del gas: rejilla de 100 cm² al exterior por el piso, bajo el cajón de la garrafa. Se define con el instalador antes de cortar la chapa.',
      'Detector de monóxido y extintor: el detector junto a la cocina, el extintor cerca de la puerta, lejos de la hornalla.',
    ],
    piezas: [],
    ojo: ['El corte de la chapa del piso para la ventilación es lo único que no se puede deshacer: no lo hagas hasta hablar con el instalador.'],
  });

  pasos.push({
    id: 'tra-12',
    titulo: 'Revisión final',
    intro: 'Antes de cargar equipos pesados, repasá que todo esté bien.',
    hacer: [
      'Escuadras: medí las dos diagonales de cada módulo y de cada puerta. Tienen que dar lo mismo con 1 mm de error.',
      'Todos los tornillos al piso, a las paredes y al mamparo apretados y con butilo.',
      'Cajones: abren y cierran sin rozar, frenan en el tope y los botones traban.',
      'Puertas: cierran a ras, con 2 mm de luz pareja. Los botones traban y sueltan.',
      'Cables y mangueras no rozan nada filoso y pasan por pasacables.',
      'Hacé una prueba: cargá los bidones llenos (unos 40 kg) y sacá el cajón con la van en plano.',
    ],
    piezas: [],
  });

  return {
    grupo: G,
    titulo: 'Mueble trasero',
    resumen: [
      `Detrás de los asientos, de pared a pared: ${r0(L.x1)} mm de ancho y ${r0(cfg.trasero.alto)} mm de alto, con tres secciones (eléctrica, cocina y agua).`,
      'Se arma en dos módulos afuera y se une adentro: el eléctrico (izquierda, en L, más profundo) y el de cocina y agua (derecha).',
      'La cama se une después al frente del módulo eléctrico.',
    ],
    lista: listaDe(data, G),
    pasos,
    esperar: [
      'Altura real del listón del piso y posición de los 4 listones (decide el largo de los tornillos al piso).',
      'Si el ancho de 1560 mm vale para toda la van o solo para este mueble.',
      'Anafe y fregadero elegidos (para cortar las tapas 2 y 3).',
      'Heladera comprada (para cortar la tapa 1 y hacer las rejillas).',
      'Bisagras y botones push comprados y probados contra el contrachapado.',
    ],
  };
}

// ---------- Tutorial de la cama ----------
function cama(data, plan, cfg, e3, cortes) {
  const G = 'Cama';
  const t = cfg.materiales.estructura.t;
  const por = (re) => data.partes.filter((p) => p.grupo === G && re.test(p.nombre));
  const f = (re) => filas(por(re), cortes);
  const cajones = cajonesDe(data, G);
  const placas = por(/^Placa de/);
  const bandejas = por(/^Bandeja extensible/);
  const costados = por(/^Costado del pasillo/);
  const frentePie = por(/^Frente del pie/);
  const lay = data.layout.cama;
  const sh = cfg.cama.ventana.apoyoCajon;
  const ranuras = (p) => (p.huecos || []).filter((h) => h.tipo === 'ranura');
  const tablaRanuras = {
    titulo: 'Ranuras de las placas y bandejas (todas de 70 mm de ancho con esquinas R20)',
    cabecera: ['Pieza', 'Cantidad', 'Largo de cada ranura (a lo ancho de la placa)', 'Posición de cada ranura, desde el borde que mira a la puerta trasera'],
    filas: [...placas, ...bandejas].map((p) => {
      const rs = ranuras(p);
      return [
        `${p.id} ${p.nombre.replace(/\(.*$/, '').trim()}`,
        String(rs.length),
        rs.length ? `${rangoMm(rs.map((h) => h.a1 - h.a0))}, empezando a ${r0(rs[0].a0)} mm del borde de la pared` : '',
        rs.map((h) => `${r0(h.b0)}-${r0(h.b1)}`).join(', '),
      ];
    }),
  };
  const ventanas = [...frentePie, ...costados].map((p) => {
    const h = (p.huecos || []).find((q) => q.tipo === 'ventana');
    if (!h) return [p.id, '', ''];
    const normalZ = p.sz <= 16;
    return [
      `${p.id} ${p.nombre.replace(/\(.*$/, '').trim()}`,
      normalZ ? `${r0(h.a1 - h.a0)} x ${r0(h.b1 - h.b0)} mm (ancho x alto)` : `${r0(h.b1 - h.b0)} x ${r0(h.a1 - h.a0)} mm (largo x alto)`,
      normalZ
        ? `esquinas R${cfg.cama.ventana.radio}; deja ${r0(h.a0)} mm a cada lado y ${r0(h.b0)} mm abajo`
        : `esquinas R${cfg.cama.ventana.radio}; empieza a ${r0(h.b0)} mm del borde que mira a la puerta trasera y a ${r0(h.a0)} mm del borde de abajo`,
    ];
  });
  const cab = placas.find((p) => /cabecera/.test(p.nombre));
  const rec = cab && cab.recorte;
  const pasos = [];

  pasos.push({
    id: 'cam-1',
    titulo: 'Cortar y rotular',
    intro: `La cama sale de contrachapado de ${t} mm y de listones de 45x45 y 30x30. Seguí el plano de «Placas y cortes».`,
    hacer: [
      'Cortá las piezas rectas; las curvas se hacen después (paso siguiente).',
      'Rotulá cada pieza con su id (CAM-xx) en la cara que va por dentro.',
      'Los listones se cortan a la medida de la tabla de barras. El largo dice cuánto, la sección ya viene de la barra.',
    ],
    piezas: [],
    tablas: [tablaCortes(G, 'CAM-', plan, cfg)],
  });

  pasos.push({
    id: 'cam-2',
    titulo: 'Calar ranuras, ventanas y esquinas redondas',
    intro: 'Las placas de la cama llevan ranuras (el dibujo de la plataforma) y los costados llevan ventanas donde van los cajones. Se hacen antes de armar, con plantilla.',
    hacer: [
      'Hacé una plantilla de cartón o MDF de una ranura (70 mm de ancho, esquinas R20) y de una ventana (esquinas R40). Marcá todas con la misma.',
      'Taladrá un agujero de 10 mm en una esquina de cada ranura o ventana, para meter la hoja de la caladora.',
      'Calá por dentro de la línea, dejando 1 a 2 mm, y terminá con fresadora y plantilla o con lija. Las esquinas exteriores de las placas y bandejas llevan R50.',
      'Las bandejas llevan las mismas ranuras que la placa de arriba y quedan en línea: marcalas con la misma plantilla y la misma posición a lo largo.',
      rec
        ? `La placa de la cabecera lleva un recorte rectangular de ${r0(rec.x1 - rec.x0)} x ${r0(rec.z1 - rec.z0)} mm en la esquina del pasillo, del lado del mueble trasero: es por donde sale el cajón de la garrafa.`
        : 'La placa de la cabecera no lleva recorte.',
    ],
    piezas: [...filas(placas, cortes), ...filas(bandejas, cortes), ...filas([...frentePie, ...costados], cortes)],
    tablas: [tablaRanuras, { titulo: 'Ventanas', cabecera: ['Pieza', 'Medida', 'Radio y margen'], filas: ventanas }],
    ojo: ['La medida de las ranuras se pierde fácil con la caladora. Calá primero una en un recorte y probala antes de cortar la placa.'],
  });

  pasos.push({
    id: 'cam-3',
    titulo: 'Refuerzos al piso de la van',
    intro: 'Son cuatro listones de 45x45 pegados al piso: dos por módulo. Sostienen las paredes de la caja y no se ven.',
    hacer: [
      'Marcá en el piso la posición de cada refuerzo (en el 3D, CAM-30 a CAM-33). Esquivan el pasarruedas.',
      'Pegá con adhesivo de montaje y atornillá a un listón del piso. Sellá cada agujero con butilo.',
      `Cuidado con el largo del tornillo: el listón mide ${sh} mm de alto, y un 25 mm no llega al piso. Con un listón de piso de 30 mm de alto, el tornillo tiene que medir al menos ${sh + 25} mm (5x70).`,
    ],
    piezas: f(/^Refuerzo de piso/),
    ojo: ['El modelo trae tornillos de 25 mm, que solo sirven si el refuerzo mide menos de 25 mm de alto. Medí el piso antes de comprar los tornillos.'],
  });

  pasos.push({
    id: 'cam-4',
    titulo: 'Cajas de los dos módulos',
    intro: 'La cama son dos módulos: el del pie (60 cm) y el de la cabecera (120 cm). Cada uno es una caja abierta con un costado hacia el pasillo.',
    hacer: [
      'Módulo del pie: frente (con ventana), costado del pasillo (con ventana) y panel central. Cola y 4x40 contra los refuerzos del piso.',
      'Módulo de la cabecera: costado del pasillo (con ventana), panel central y guía al fondo del hueco libre.',
      'Todo parado y a escuadra. Pegá cada pieza contra su refuerzo y atornillá a través del refuerzo, no al piso.',
      'Unión de los dos módulos: dos tornillos de 25 mm por el panel central.',
      'Pegá y atornillá los listones de las correderas de los cajones (45x45) en el panel central, el frente y la guía, a la altura que dice la tabla de cajones.',
    ],
    piezas: [...filas([...frentePie, ...costados], cortes), ...f(/^Panel central/), ...f(/^Guía de la cabecera/), ...f(/^Listón de las correderas/)],
    ojo: ['El panel central se acorta para esquivar el pasarruedas: probalo en seco contra el arco antes de pegar.'],
  });

  pasos.push({
    id: 'cam-5',
    titulo: 'Largueros y listones de pared',
    intro: 'Sobre las cajas van los listones de 30x30 donde apoyan las placas de la plataforma.',
    hacer: [
      `Largueros (a ${r0(por(/^Larguero de apoyo \(pie\)/)[0].x)} mm de la pared izquierda de la van): entre el frente, el panel central y la guía, a ras de la cara de abajo de la placa. Cola y 4x40 por los cantos.`,
      'Listones de pared (a la izquierda): contra la pared, a la misma altura. Sobre el pasarruedas no hay listón: la placa apoya ahí, con fieltro de 5 mm.',
      'Listón de unión: a lo largo del frente del mueble trasero, en el travesaño que queda entre los frentes bajos y los altos.',
    ],
    piezas: [...f(/^Larguero/), ...f(/^Listón de pared/), ...f(/^Listón de unión/)],
  });

  pasos.push({
    id: 'cam-6',
    titulo: 'Cajones de los costados',
    intro: 'Un cajón en cada módulo, que sale por la ventana del costado hacia el pasillo. El frente llena la ventana.',
    hacer: [
      'Caja con laterales, trasera y un piso de 15 mm. El frente va aparte, con las esquinas redondeadas.',
      'Corredera telescópica del largo de la tabla, atornillada al listón de 45x45 del módulo y al lateral del cajón, a la misma altura. Las dos partes de cada lado van a ras del frente.',
      'Probá la caja sin frente: tiene que correr sin rozar los listones.',
      'Frente: ponelo en la ventana con 3 mm de luz y atornillalo a los cantos de los laterales con dos tornillos por lado, avellanados. El botón push tapa el centro.',
    ],
    piezas: cajones.flatMap((c) => filas(c.piezas, cortes)),
    tablas: [tablaCajones(cajones), tablaBotones(data, G)],
    ojo: ['El frente se une directo a los cantos de los laterales, que son de 15 mm: usá cola y tornillos 4x40 bien pretaladrados, y tapalos con tapones del color de la madera.'],
  });

  pasos.push({
    id: 'cam-7',
    titulo: 'Bandejas extensibles',
    intro: 'Debajo de cada placa hay una bandeja con las mismas ranuras. Se tira hacia el pasillo y agranda la cama de 90 a 120 cm.',
    hacer: [
      'Correderas de carga de 500 mm (100 kg): una a cada lado de la bandeja. Bandeja del pie: entre el frente y el panel central. Bandeja de la cabecera: entre el panel central y la guía.',
      'La bandeja mide 15 mm de espesor y la corredera es más alta. Fijala a la cara lateral y asegurate de que no roce la placa de arriba.',
      'Cada bandeja lleva un retén para que no salga sola al frenar y una agarradera embutida en el borde.',
      'Probala con el peso: tiene que correr entera y quedar firme abierta (300 mm de extensión).',
    ],
    piezas: filas(bandejas, cortes),
    ojo: ['Esto depende de la corredera que compres: comprá las correderas antes de cortar las bandejas y verificá la altura real.'],
  });

  pasos.push({
    id: 'cam-8',
    titulo: 'Placas de la plataforma',
    intro: 'Las dos placas se atornillan desde arriba a los largueros y listones, y se pueden levantar para llegar al piso.',
    hacer: [
      'Pegá fieltro o goma de 5 mm sobre los pasarruedas (0,8 m cada uno).',
      'Apoyá la placa del pie y la de la cabecera: dejan 3 mm de luz entre ellas.',
      'Atornillá con tornillos avellanados 4x40, 24 en total, y avellaná la cabeza para que no moleste el colchón.',
      'El colchón lleva el mismo recorte que la placa de la cabecera.',
    ],
    piezas: filas(placas, cortes),
  });

  pasos.push({
    id: 'cam-9',
    titulo: 'Unir al mueble trasero y revisar',
    intro: 'La cama se apoya en el frente del módulo eléctrico del mueble trasero.',
    hacer: [
      'Atornillá el listón de unión al travesaño del frente del mueble trasero con 10 tornillos 4x50, en el travesaño, no en las puertas.',
      'Escuadras L en el listón de pared del pie, a la pared izquierda (2 tornillos autoperforantes o remaches).',
      'Probá los dos cajones y las dos bandejas abiertos y cerrados. Revisá que las bandejas abiertas no choquen con el mueble derecho.',
      'Sentate y acostate con peso: nada tiene que crujir.',
    ],
    piezas: [],
  });

  return {
    grupo: G,
    titulo: 'Cama',
    resumen: [
      `Cama de ${cfg.cama.largo / 10} cm de largo, ${cfg.cama.ancho / 10} cm de ancho, que se agranda a ${(cfg.cama.ancho + cfg.cama.extension) / 10} cm con las bandejas.`,
      'Son dos módulos: el del pie (60 cm) y el de la cabecera (120 cm). Cada uno tiene un cajón por la ventana del costado.',
      'Se apoya en el piso (refuerzos), en la pared izquierda (listones) y en el frente del mueble trasero.',
    ],
    lista: listaDe(data, G),
    pasos,
    esperar: [
      'Altura del listón del piso (largo de los tornillos de los refuerzos).',
      'Correderas de carga de 500 mm comprobadas contra el espesor de la bandeja.',
      'Fresadora o plantilla para las curvas, y una prueba con un recorte antes de cortar las placas.',
    ],
  };
}

// ---------- Tutorial del mueble derecho ----------
function derecho(data, plan, cfg, e3, cortes) {
  const G = 'Mueble derecho';
  const t = cfg.materiales.estructura.t;
  const por = (re) => data.partes.filter((p) => p.grupo === G && re.test(p.nombre));
  const f = (re) => filas(por(re), cortes);
  const cajones = cajonesDe(data, G);
  const de = cfg.derecho;
  const pasos = [];

  pasos.push({
    id: 'der-1',
    titulo: 'Cortar y rotular',
    intro: `Todo sale del contrachapado de ${t} mm, salvo el fondo de la alacena y los pisos de los cajones, que son de ${cfg.materiales.fondo.t} mm.`,
    hacer: [
      'Cortá y rotulá cada pieza con su id (DER-xx).',
      'Las tres piezas del costado de pared van por separado porque esquivan el pasarruedas: no las unas.',
    ],
    piezas: [],
    tablas: [tablaCortes(G, 'DER-', plan, cfg)],
  });

  pasos.push({
    id: 'der-2',
    titulo: 'Caja baja: panel trasero, costados y bases',
    intro: `El mueble mide ${de.profundidad} mm de profundidad y ${de.largo} mm de largo. Se apoya sobre el pasarruedas derecho y contra la pared.`,
    hacer: [
      'Parate el panel trasero alto contra el cierre trasero de la van, a escuadra.',
      'Pegá los tres tramos del costado de pared contra la pared derecha (trasero, sobre el pasarruedas y delantero) y fijalos con escuadras L.',
      'Bases: una grande hasta el pasarruedas y dos tramos chicos detrás de él. El piso de los cajones apoya sobre el pasarruedas, con fieltro de 5 mm.',
      'División entre módulos (la que separa cajones de la puerta) y el estante del módulo de la puerta. Todo con cola y 4x40 por los cantos.',
    ],
    piezas: [...f(/^Panel trasero alto/), ...f(/^Costado/), ...f(/^Base/), ...f(/^Piso de los cajones/), ...f(/^División/), ...f(/^Estante del módulo/)],
    ojo: ['La base queda a 80 mm del piso: apoyala en dos listones de recorte (de unos 80 mm de alto) y fijala con escuadras a los costados.'],
  });

  pasos.push({
    id: 'der-3',
    titulo: 'Mesadas',
    intro: 'La mesada de cajones y la tapa del módulo de la mesa cierran arriba. La mesa plegable se agrega más abajo.',
    hacer: [
      'Mesada de cajones: sobre los costados y la división, atornillada desde arriba.',
      'Tapa del módulo de la mesa: al nivel de la mesada de la puerta, cola y 4x40 a los cantos.',
    ],
    piezas: [...f(/^Mesada de cajones/), ...f(/^Tapa del módulo de la mesa/)],
  });

  pasos.push({
    id: 'der-4',
    titulo: 'Marcos de los frentes',
    intro: 'Dos marcos: el de los cajones (con un frente ciego abajo que tapa el pasarruedas) y el del módulo de la puerta.',
    hacer: [
      'Montantes y travesaños con cola y 4x25 (los 4x40 atraviesan 15 mm).',
      'El frente ciego bajo los cajones tapa el pasarruedas: va fijo, sin botón.',
      'Pegá cada marco a los cantos del mueble y atornillá desde adentro.',
    ],
    piezas: [...f(/^Frente de cajones - /), ...f(/^Frente ciego/), ...f(/^Frente del módulo de la mesa - /)],
  });

  pasos.push({
    id: 'der-5',
    titulo: 'Cajones y correderas',
    intro: 'Dos cajones, uno sobre otro, que se tiran hacia el pasillo.',
    hacer: [
      'Cada caja: laterales, trasera, piso de 9 mm y una delantera de 15 mm.',
      'Correderas de 350 mm a ras del borde de adelante, a la altura de la tabla.',
      'Frente: ponelo con 2 mm de luz y atornillalo a la delantera desde adentro, cuatro tornillos 4x25.',
    ],
    piezas: cajones.flatMap((c) => filas(c.piezas, cortes)),
    tablas: [tablaCajones(cajones)],
  });

  pasos.push({
    id: 'der-6',
    titulo: 'Alacena',
    intro: 'Una alacena arriba de los cajones, contra la pared, con una puerta hacia el pasillo.',
    hacer: [
      'Fondo de 9 mm contra la pared derecha, base, tapa y lateral delantero con cola y 4x40.',
      'Estante a media altura sobre dos soportes.',
      'Atornillá la alacena a la pared con escuadras L (remaches o autoperforantes).',
    ],
    piezas: f(/^Alacena - /),
  });

  pasos.push({
    id: 'der-7',
    titulo: 'Puertas, bisagras y botones',
    intro: 'La puerta del módulo de la mesa y la de la alacena llevan dos bisagras cada una, más un botón push.',
    hacer: [
      'Cazoleta 35 mm, 12 mm de profundidad, centro a 22,5 mm del canto.',
      'Dos bisagras por puerta, a 100 mm de cada punta (60 mm en la alacena, que es baja).',
      'Botones push del diámetro de la ficha. Las medidas van en la tabla.',
    ],
    piezas: [...f(/^Puerta del módulo/), ...f(/^Alacena - puerta/)],
    tablas: [tablaBotones(data, G)],
    ojo: ['Los montantes de 15 mm son muy angostos para la placa de la bisagra. Probá una antes de comprar todas.'],
  });

  pasos.push({
    id: 'der-8',
    titulo: 'Mesa plegable',
    intro: 'La tapa de la mesa se abre hacia el centro de la van y queda al nivel de la tapa del módulo.',
    hacer: [
      'Bisagra de piano de 1000 mm entre la tapa y el frente del módulo.',
      'Par de soportes plegables: sostienen la tapa abierta.',
      'Pasador o cierre para la mesa plegada.',
    ],
    piezas: f(/^Tapa de la mesa/),
  });

  pasos.push({
    id: 'der-9',
    titulo: 'Fijar a la van y revisar',
    intro: 'Todo el mueble queda fijo al piso, a la pared derecha y al cierre trasero.',
    hacer: [
      'Escuadras L entre la base y el piso (tornillos a los listones del piso, con butilo).',
      'Escuadras L al costado de pared y al fondo de la alacena, con remaches o autoperforantes.',
      'Probá cajones, puertas y la mesa abierta y cerrada.',
      'Revisá que la cama abierta no choque con la mesa abierta.',
    ],
    piezas: [],
  });

  return {
    grupo: G,
    titulo: 'Mueble derecho',
    resumen: [
      `Mueble contra la pared derecha: ${de.largo} mm de largo y ${de.profundidad} mm de profundidad, con dos cajones, un módulo con puerta, alacena arriba y una mesa plegable.`,
      'Apoya sobre el pasarruedas derecho y esquiva el arco.',
    ],
    lista: listaDe(data, G),
    pasos,
    esperar: ['Altura del listón del piso.', 'Bisagras compradas y probadas contra el contrachapado.'],
  };
}

export function armarTutorial(data, plan, cfg, e3) {
  const cortes = indiceCortes(plan, cfg);
  const muebles = [trasero(data, plan, cfg, e3, cortes), cama(data, plan, cfg, e3, cortes), derecho(data, plan, cfg, e3, cortes)];
  // Datos para la portada de cada mueble: cuántas maderas lleva y cuántos herrajes hay que comprar
  for (const m of muebles) {
    m.cantidadPiezas = data.partes.filter((x) => x.grupo === m.grupo).length;
    m.cantidadHerrajes = m.lista.herrajes.reduce((t, h) => t + (h.cantidad || 0), 0);
  }
  return { generales: generales(cfg), muebles };
}

export const MUEBLES_TUTORIAL = GRUPOS;
