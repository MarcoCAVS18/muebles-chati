// Secuencia del armado animado. Sale de lo que ya calcula el modelo: los pasos del tutorial (qué maderas lleva cada uno)
// y las uniones (qué madera toca a cuál y dónde va cada tornillo). Si cambia una medida, la secuencia cambia con ella.
//
// Cada madera llega por una línea recta desde afuera: primero por el eje de su unión (así entra de verdad: un costado
// contra una base se desliza de costado), y si esa vía está tapada por maderas ya colocadas, por otra que esté libre.
// Las maderas que no se apoyan en nada todavía (la primera de un mueble o de un módulo) aparecen flotando y bajan.

const EPS = 0.5;
const EJE = { x: 0, y: 1, z: 2 };

// Tiempos en segundos a velocidad 1
export const TIEMPOS = {
  flota: 2.2, // aparece en el aire, se mece y baja
  desliza: 1.15, // llega deslizándose hasta tocar
  cola: 0.55, // la cola se extiende sobre el contacto antes de unir
  tornillo: 0.5, // lo que tarda un tornillo en entrar
  entreTornillos: 0.14, // separación entre un tornillo y el siguiente (se acorta si son muchos)
  topeTornillos: 2.8, // lo máximo que dura la fila de tornillos de una pieza
  descanso: 0.3, // pausa al terminar cada pieza
  pausaPaso: 0.8, // pausa al empezar un paso nuevo
};

const caja = (p) => ({ lo: [p.x, p.y, p.z], hi: [p.x + p.sx, p.y + p.sy, p.z + p.sz] });
const cruzan = (a, b) => [0, 1, 2].every((k) => a.hi[k] > b.lo[k] + EPS && b.hi[k] > a.lo[k] + EPS);
const mover = (c, d) => ({ lo: c.lo.map((v, k) => v + d[k]), hi: c.hi.map((v, k) => v + d[k]) });
const unir = (a, b) => ({ lo: a.lo.map((v, k) => Math.min(v, b.lo[k])), hi: a.hi.map((v, k) => Math.max(v, b.hi[k])) });
const mayor = (p) => Math.max(p.sx, p.sy, p.sz);

// Las salidas de emergencia, en este orden: desde arriba, desde el lado de la puerta trasera, desde los costados
const SALIDAS = [
  [0, 1, 0],
  [0, 0, -1],
  [-1, 0, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0, -1, 0],
];

// Salidas por donde una madera toca a otras ya colocadas aunque no haya tornillos entre ellas (apoyada, pegada de canto):
// si su cara de arriba toca a otra, llega desde arriba al revés, o sea desde el lado contrario al que toca.
function contactos(p, colocadas) {
  const fin = caja(p);
  const salidas = [];
  for (const q of colocadas) {
    for (let k = 0; k < 3; k++) {
      const otros = [0, 1, 2].filter((j) => j !== k);
      const rozan = otros.every((j) => fin.hi[j] > q.caja.lo[j] + EPS && q.caja.hi[j] > fin.lo[j] + EPS);
      if (!rozan) continue;
      const v = [0, 0, 0];
      if (Math.abs(fin.hi[k] - q.caja.lo[k]) <= 1) v[k] = -1;
      else if (Math.abs(fin.lo[k] - q.caja.hi[k]) <= 1) v[k] = 1;
      else continue;
      if (!salidas.some((s) => s.every((x, i) => x === v[i]))) salidas.push(v);
    }
  }
  return salidas;
}

// Distancia desde la que llega una madera: proporcional a su tamaño, ni muy pegada ni muy lejos
const distanciaDe = (p) => Math.round(Math.min(520, Math.max(280, mayor(p) * 0.4)));

// ¿Puede la madera llegar desde off sin chocar con lo ya colocado? Se mide el volumen que barre al moverse.
// Las maderas que ya se cruzan con ella en su lugar final (varillas dentro de las ranuras de una placa) no cuentan.
function camino(p, off, dist, colocadas) {
  const fin = caja(p);
  const barrido = unir(mover(fin, off.map((v) => v * dist)), fin);
  return !colocadas.some((q) => cruzan(barrido, q.caja) && !cruzan(fin, q.caja));
}

export function armarSecuencia(data, mueble) {
  const grupo = mueble.grupo;
  const partes = new Map(data.partes.filter((p) => p.grupo === grupo).map((p) => [p.id, p]));
  const juntas = data.juntas.filter((j) => j.grupo === grupo);
  const juntasDe = new Map();
  for (const j of juntas) {
    for (const id of [j.cara, j.canto]) {
      if (!juntasDe.has(id)) juntasDe.set(id, []);
      juntasDe.get(id).push(j);
    }
  }
  const otra = (j, id) => (j.cara === id ? j.canto : j.cara);

  // Una madera se arma en el último paso donde figura: el primero suele ser el de calarla y marcarla
  const pasoDe = new Map();
  mueble.pasos.forEach((paso, i) => {
    for (const r of paso.piezas || []) if (partes.has(r.id)) pasoDe.set(r.id, i);
  });

  const colocadas = []; // { id, caja } de lo que ya está en su lugar
  const puestas = new Set();
  const eventos = [];
  const pasos = [];
  let t = 0;
  let bloqueadas = 0;
  let flotantes = 0;
  let totalTornillos = 0;

  mueble.pasos.forEach((paso, i) => {
    const ids = (paso.piezas || []).map((r) => r.id).filter((id) => pasoDe.get(id) === i);
    if (!ids.length) return;
    const primero = eventos.length;
    const t0Paso = t;
    t += pasos.length ? TIEMPOS.pausaPaso : 0.4;

    // Orden dentro del paso: cada madera tiene que tocar a una ya colocada; si ninguna toca, empieza una nueva (en la lista)
    const pendientes = [...ids];
    while (pendientes.length) {
      // Toca a otra ya colocada si hay una unión con ella o si se apoyan cara contra cara
      const toca = (id) => (juntasDe.get(id) || []).some((j) => puestas.has(otra(j, id))) || contactos(partes.get(id), colocadas).length > 0;
      let k = pendientes.findIndex(toca);
      if (k < 0) k = 0;
      const [id] = pendientes.splice(k, 1);
      const p = partes.get(id);
      const apoyos = (juntasDe.get(id) || []).filter((j) => puestas.has(otra(j, id)));
      const roces = contactos(p, colocadas);

      // Desde dónde llega: primero por el eje de sus uniones, después por donde se apoya, después por cualquier lado libre
      let modo = 'desliza';
      let off = null;
      const dist = distanciaDe(p);
      if (apoyos.length || roces.length) {
        const candidatos = [];
        for (const j of apoyos) {
          const v = [0, 0, 0];
          v[EJE[j.eje]] = j.cara === id ? -j.sentido : j.sentido;
          if (!candidatos.some((c) => c.every((x, q) => x === v[q]))) candidatos.push(v);
        }
        for (const v of roces) if (!candidatos.some((c) => c.every((x, q) => x === v[q]))) candidatos.push(v);
        off = [...candidatos, ...SALIDAS].find((v) => camino(p, v, dist, colocadas));
        if (!off) {
          bloqueadas += 1;
          off = candidatos[0];
        }
      } else {
        // Sin nada donde apoyarse: aparece flotando arriba y baja
        modo = 'flota';
        flotantes += 1;
        off = [0, 1, 0];
      }

      const dur = modo === 'flota' ? TIEMPOS.flota : TIEMPOS.desliza;
      eventos.push({ tipo: 'pieza', id, paso: i, t0: t, dur, modo, off, dist: modo === 'flota' ? 460 : dist, con: apoyos.map((j) => otra(j, id)) });
      t += dur;
      colocadas.push({ id, caja: caja(p) });
      puestas.add(id);

      // Cola y tornillos con las maderas que ya estaban
      const conTornillos = apoyos.filter((j) => (j.cantidad || 0) > 0 || j.cola);
      if (conTornillos.length) {
        const n = conTornillos.reduce((s, j) => s + (j.cantidad || 0), 0);
        const hayCola = conTornillos.some((j) => j.cola && !j.desmontable);
        const sep = n > 1 ? Math.min(TIEMPOS.entreTornillos, TIEMPOS.topeTornillos / n) : 0;
        const demoraCola = hayCola ? TIEMPOS.cola : 0;
        const durT = demoraCola + Math.max(0, n - 1) * sep + (n ? TIEMPOS.tornillo : 0.2);
        eventos.push({
          tipo: 'tornillos',
          id,
          paso: i,
          t0: t,
          dur: durT,
          juntas: conTornillos.map((j) => j.id),
          n,
          cola: hayCola,
          demoraCola,
          sep,
        });
        totalTornillos += n;
        t += durT;
      }
      t += TIEMPOS.descanso;
    }
    pasos.push({ id: paso.id, titulo: paso.titulo, paso: i, t0: t0Paso, t1: t, primero, ultimo: eventos.length - 1 });
  });

  return {
    grupo,
    eventos,
    pasos,
    duracion: t,
    totalPasos: mueble.pasos.length, // los pasos del tutorial, con los de corte: así el número coincide con el de la pestaña Armado
    piezas: eventos.filter((e) => e.tipo === 'pieza').length,
    stats: { bloqueadas, flotantes, tornillos: totalTornillos },
  };
}

// A dónde mira la cámara en cada evento: el centro (mm) y a qué distancia (mm). En los tornillos se acerca.
export function focoDe(data, ev) {
  const p = data.partes.find((x) => x.id === ev.id);
  const centroPieza = [p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2];
  const diag = Math.hypot(p.sx, p.sy, p.sz);
  if (ev.tipo === 'pieza') return { c: centroPieza, d: Math.min(2600, Math.max(950, diag * 1.5 + 450)) };
  const ids = new Set(ev.juntas);
  const ts = data.tornillos.filter((q) => ids.has(q.junta));
  if (!ts.length) return { c: centroPieza, d: Math.min(1600, Math.max(750, diag * 1.1 + 350)) };
  const lo = [1e9, 1e9, 1e9];
  const hi = [-1e9, -1e9, -1e9];
  for (const q of ts) {
    [q.x, q.y, q.z].forEach((v, k) => {
      lo[k] = Math.min(lo[k], v);
      hi[k] = Math.max(hi[k], v);
    });
  }
  const c = lo.map((v, k) => (v + hi[k]) / 2);
  const dg = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  return { c, d: Math.min(1700, Math.max(650, dg * 1.2 + 520)) };
}

// Índice del evento que está pasando en el instante s (el último que ya empezó)
export function eventoEn(seq, s) {
  const ev = seq.eventos;
  let lo = 0;
  let hi = ev.length - 1;
  let r = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ev[mid].t0 <= s) {
      r = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return r;
}
