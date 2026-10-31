// Uniones entre piezas: detecta dónde se tocan dos maderas y define cómo se unen (cola, tornillo, largo, separación,
// desde qué cara se atornilla y dónde va cada tornillo). Todo sale de la geometría de las piezas en la posición cerrada.
//
// Reglas (las mismas del instructivo):
//  - Cara contra canto (una pieza de hasta 20 mm de espesor apoyada sobre el canto de otra): se atornilla desde la cara
//    de la pieza fina hacia adentro del canto. El tornillo atraviesa la pieza fina y entra al menos 25 mm en el canto
//    (20 mm si la pieza fina es una tapa de 9 mm).
//  - Cara contra cara (dos piezas finas, una sobre la otra): cola y tornillo corto que entra 10 mm o más en la segunda.
//    Se atornilla desde la pieza que no se ve (o desde la que no queda tapada).
//  - Todas llevan cola PVA, salvo las placas de la cama, que se atornillan sin cola para poder levantarlas.
//  - Primer tornillo a 30 mm del extremo y después uno cada 150 mm (120 mm en cajones, 200 mm en las placas de la cama).
//
// No se unen por acá: las piezas que se mueven (cama que sale, varillas, cajones respecto de su mueble), las que cuelgan
// de bisagras y lo que une un mueble con otro. Eso va en los herrajes y en "Dónde van enganchados".

const EJES = ['x', 'y', 'z'];
const TOL = 0.6; // mm: dos maderas se tocan si sus caras están a menos de esto
const FINA = 20; // hasta este espesor una pieza puede ser la que se atraviesa con el tornillo
const CATALOGO = [16, 20, 25, 30, 35, 40, 45, 50, 60];
const MARGEN = 30; // primer tornillo a 30 mm del extremo
const MIN_LADO = 8; // un contacto más angosto que esto no es una unión
const MIN_AREA = 300; // mm2

const tam = (p, e) => (e === 'x' ? p.sx : e === 'y' ? p.sy : p.sz);
const ini = (p, e) => p[e];
const fin = (p, e) => p[e] + tam(p, e);
const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');

// Qué papel tiene cada pieza en las uniones
const esBisagra = (p) => !!p.bisagraAbajo || /^(Puerta|Alacena - puerta|Tapa de la mesa plegable)/i.test(p.nombre);
const esVista = (p) => /^(Frente|Puerta|Tapa|Costado)/i.test(p.nombre);
const esDesmontable = (p) => /^Placa (de la|del)/i.test(p.nombre);
// Un cajón es su caja y su frente: la clave sirve para saber si dos piezas son del mismo cajón
const claveCajon = (p) => {
  if (/^Cajón .* - (lateral|trasera|delantera|piso)/i.test(p.nombre)) return p.nombre.replace(/ - .*$/, '').toLowerCase();
  if (/^Frente cajón/i.test(p.nombre)) return p.nombre.replace(/^Frente /i, '').toLowerCase();
  return null;
};

function motivoSinUnion(a, b) {
  if (a.grupo !== b.grupo) return 'El empalme entre muebles va en "Dónde van enganchados"';
  if (a.salidaDe || b.salidaDe) return 'Las varillas cuelgan del listón de unión y de las correderas';
  if (!!a.ext !== !!b.ext) return 'Una de las dos se mueve con la cama: no se atornillan entre sí';
  if (a.ext && b.ext) return 'Las piezas que salen con la cama se atornillan según Herrajes';
  if (esBisagra(a) || esBisagra(b)) return 'Va colgada con bisagras (ver Herrajes)';
  const ca = claveCajon(a);
  const cb = claveCajon(b);
  if ((ca || cb) && ca !== cb) return 'El cajón corre sobre sus correderas: no se une al mueble';
  return null;
}

// Para saber si la cara por donde se atornilla queda tapada por otra pieza
function quienTapa(partes, a, b, punto) {
  // Un cajón se arma afuera del mueble: solo lo tapan las piezas de su propio cajón
  const kc = claveCajon(a) || claveCajon(b);
  for (const q of partes) {
    if (q === a || q === b) continue;
    if (kc && claveCajon(q) !== kc) continue;
    if (
      punto.x > q.x + 0.1 &&
      punto.x < q.x + q.sx - 0.1 &&
      punto.y > q.y + 0.1 &&
      punto.y < q.y + q.sy - 0.1 &&
      punto.z > q.z + 0.1 &&
      punto.z < q.z + q.sz - 0.1
    ) {
      return q;
    }
  }
  return null;
}

function elegirLargo(tCara, prof, clase, penFija) {
  const penMin = penFija || (clase === 'cara-cara' ? 10 : tCara <= 10 ? 20 : 25);
  const maxL = tCara + prof - 3; // que la punta no asome por el otro lado
  const minL = tCara + penMin;
  const entran = CATALOGO.filter((L) => L >= minL && L <= maxL);
  if (entran.length) return { L: clase === 'cara-cara' ? entran[entran.length - 1] : entran[0], corto: false };
  const alguno = CATALOGO.filter((L) => L <= maxL);
  const L = alguno.length ? alguno[alguno.length - 1] : CATALOGO[0];
  return { L, corto: L - tCara < Math.min(penMin, 18) };
}

const nombreTornillo = (d, L) => `Tornillo aglomerado ${d === 3.5 ? '3,5' : '4'}x${L} mm`;

// Posiciones del tornillo sobre el rectángulo de contacto: una o dos líneas a lo largo del lado largo
function repartir(rect, esp) {
  const { u0, u1, v0, v1 } = rect;
  const du = u1 - u0;
  const dv = v1 - v0;
  const largoEnU = du >= dv;
  const L = largoEnU ? du : dv;
  const S = largoEnU ? dv : du;
  const l0 = largoEnU ? u0 : v0;
  const s0 = largoEnU ? v0 : u0;
  if (L < 30 || S < MIN_LADO) return { pos: [], L, S, n: 0, paso: 0, lineas: 0 };
  const m = MARGEN;
  let n = L < 90 ? 1 : Math.max(2, Math.ceil((L - 2 * m) / esp) + 1);
  if (n > 1 && (L - 2 * m) / (n - 1) < 60) n = 1;
  const paso = n > 1 ? (L - 2 * m) / (n - 1) : 0;
  const lineas = S > 90 ? 2 : 1;
  const offs = lineas === 1 ? [s0 + S / 2] : [s0 + 30, s0 + S - 30];
  const pos = [];
  for (const so of offs) {
    for (let i = 0; i < n; i++) {
      const lo = n === 1 ? l0 + L / 2 : l0 + m + i * paso;
      pos.push(largoEnU ? [lo, so] : [so, lo]);
    }
  }
  return { pos, L, S, n, paso, lineas };
}

export function calcularUniones(data) {
  const partes = data.partes;
  const juntas = [];
  const sinUnion = [];
  let contador = 0;

  for (let i = 0; i < partes.length; i++) {
    for (let j = i + 1; j < partes.length; j++) {
      const a = partes[i];
      const b = partes[j];
      for (const e of EJES) {
        const [u, v] = EJES.filter((k) => k !== e);
        const ou = Math.min(fin(a, u), fin(b, u)) - Math.max(ini(a, u), ini(b, u));
        const ov = Math.min(fin(a, v), fin(b, v)) - Math.max(ini(a, v), ini(b, v));
        const oe = Math.min(fin(a, e), fin(b, e)) - Math.max(ini(a, e), ini(b, e));
        if (Math.abs(oe) > TOL || ou < MIN_LADO || ov < MIN_LADO || ou * ov < MIN_AREA) continue;
        const rect = { u, v, u0: Math.max(ini(a, u), ini(b, u)), u1: Math.min(fin(a, u), fin(b, u)), v0: Math.max(ini(a, v), ini(b, v)), v1: Math.min(fin(a, v), fin(b, v)) };
        const plano = Math.abs(fin(a, e) - ini(b, e)) <= TOL ? fin(a, e) : ini(a, e); // coordenada del contacto
        const motivo = motivoSinUnion(a, b);
        if (motivo) {
          sinUnion.push({ a: a.id, b: b.id, motivo });
          continue;
        }
        const finaA = tam(a, e) <= FINA;
        const finaB = tam(b, e) <= FINA;
        if (!finaA && !finaB) {
          sinUnion.push({ a: a.id, b: b.id, motivo: 'Se tocan por el canto: se sostienen por las otras uniones' });
          continue;
        }
        const clase = finaA && finaB ? 'cara-cara' : 'cara-canto';
        // Las placas de la cama se pueden levantar: se atornillan desde arriba a sus apoyos y nunca por el canto
        const placa = [a, b].find(esDesmontable);
        if (placa && (e !== 'y' || (clase === 'cara-canto' && (finaA ? a : b) !== placa))) {
          sinUnion.push({ a: a.id, b: b.id, motivo: 'La placa se puede levantar: se apoya, se atornilla solo desde arriba a sus apoyos' });
          continue;
        }
        const candidatos = clase === 'cara-cara' ? [[a, b], [b, a]] : [finaA ? [a, b] : [b, a]];
        const opciones = candidatos.map(([cara, canto]) => {
          // La cara está del lado negativo del contacto si termina donde está el contacto
          const dir = Math.abs(fin(cara, e) - plano) <= TOL ? 1 : -1;
          const entrada = dir === 1 ? ini(cara, e) : fin(cara, e);
          const tCara = tam(cara, e);
          const prof = tam(canto, e);
          // Un canto de menos de 12 mm no aguanta un tornillo de 4: solo se pega. En los cajones, el piso de 9 mm entre los
          // laterales lleva igual tornillos de 3,5 pretaladrados (3,5x30, como en el instructivo)
          const cantoFino = Math.min(rect.u1 - rect.u0, rect.v1 - rect.v0) < 12;
          const delPiso = cantoFino && (claveCajon(cara) || claveCajon(canto));
          const lg = elegirLargo(tCara, prof, clase, delPiso ? 15 : 0);
          const d = tCara >= 12 && !delPiso ? 4 : 3.5;
          const esp = claveCajon(cara) ? 120 : esDesmontable(cara) || esDesmontable(canto) ? 200 : tCara <= 10 ? 120 : 150;
          const rep = cantoFino && !delPiso ? { pos: [], L: Math.max(rect.u1 - rect.u0, rect.v1 - rect.v0), S: 0, n: 0, paso: 0, lineas: 0 } : repartir(rect, esp);
          const puntos = rep.pos.map(([pu, pv]) => ({ [e]: entrada, [u]: pu, [v]: pv }));
          const tapa = puntos.length ? quienTapa(partes, a, b, { ...puntos[0], [e]: entrada - dir * 0.8 }) : null;
          const castigo = (esVista(cara) ? 4 : 0) + (tapa ? 3 : 0) + (lg.corto ? 2 : 0) + (e === 'y' && dir === 1 ? 0.5 : 0); // de arriba es lo más cómodo
          return { cara, canto, dir, entrada, tCara, prof, lg, d, esp, rep, puntos, tapa, castigo, cantoFino };
        });
        opciones.sort((p, q) => p.castigo - q.castigo);
        const o = opciones[0];
        const desmontable = esDesmontable(a) || esDesmontable(b);
        contador++;
        const L = o.lg.L;
        juntas.push({
          id: `U-${String(contador).padStart(3, '0')}`,
          grupo: o.cara.grupo,
          cara: o.cara.id,
          canto: o.canto.id,
          clase,
          eje: e,
          sentido: o.dir,
          plano,
          rect,
          cola: !desmontable,
          largoCola: Math.round(o.rep.L),
          desmontable,
          tornillo: { d: o.d, largo: L, nombre: nombreTornillo(o.d, L), cabeza: 'avellanada' },
          cantidad: o.puntos.length,
          lineas: o.rep.lineas,
          paso: Math.round(o.rep.paso),
          margen: o.rep.n > 1 ? MARGEN : null,
          pretaladro: { pasante: o.d, guia: o.d - 1, prof: L - o.tCara },
          entran: L - o.tCara,
          corto: o.lg.corto,
          cantoFino: o.cantoFino,
          tapadaPor: o.tapa ? o.tapa.id : null,
          puntos: o.puntos,
        });
      }
    }
  }

  // Resumen por pieza: lo que se une con cada una y qué papel tiene en la unión
  const porPieza = {};
  const nota = (p) =>
    p.salidaDe
      ? `Sale de la placa ${p.salidaDe}: cuelga del listón de unión y de las correderas (ver Herrajes).`
      : esBisagra(p)
        ? 'Va colgada con bisagras (ver Herrajes); no se atornilla a las vecinas.'
        : p.ext
          ? 'Sale con la cama: se une según los herrajes y las uniones de la cama.'
          : claveCajon(p) && /^Frente cajón/i.test(p.nombre)
            ? 'El frente se atornilla a la delantera del cajón desde adentro de la caja.'
            : '';
  for (const p of partes) porPieza[p.id] = { juntas: [], nota: nota(p) };
  for (const j of juntas) {
    porPieza[j.cara].juntas.push({ junta: j, papel: 'cara', otra: j.canto });
    porPieza[j.canto].juntas.push({ junta: j, papel: 'canto', otra: j.cara });
  }

  const tornillos = [];
  for (const j of juntas) {
    for (const pt of j.puntos) tornillos.push({ x: pt.x, y: pt.y, z: pt.z, eje: j.eje, sentido: j.sentido, largo: j.tornillo.largo, d: j.tornillo.d, junta: j.id, cara: j.cara, canto: j.canto });
  }

  return { juntas, porPieza, sinUnion, tornillos };
}

// Texto de una unión para la ficha de una pieza
const CARAS = {
  x: { 1: 'la cara del lado de la pared izquierda', '-1': 'la cara del lado del pasillo' },
  y: { 1: 'la cara de abajo', '-1': 'la cara de arriba' },
  z: { 1: 'la cara de la puerta trasera', '-1': 'la cara de la cabina' },
};

export function describirUnion(j) {
  // sentido = hacia dónde avanza el tornillo; la cara de entrada queda del lado contrario
  const lado = CARAS[j.eje][String(j.sentido)];
  const cola = j.cola ? 'cola + ' : '';
  const n = j.cantidad;
  const sep = j.cantidad > 1 && j.paso ? `, uno cada ${j.paso} mm` : '';
  const lin = j.lineas === 2 ? ' en 2 hileras' : '';
  if (!n) return { cola, tornillos: '', lado, texto: j.cola ? 'solo cola' : 'sin fijación' };
  const tornillos = `${n} ${n === 1 ? 'tornillo' : 'tornillos'} ${fmt(j.tornillo.d)}x${j.tornillo.largo}${lin}${sep}`;
  return { cola, tornillos, lado, texto: `${cola}${tornillos}` };
}

// Un color por tipo de tornillo (diámetro y largo) para el 3D y su leyenda
const COLORES_TORNILLO = { 25: '#2f7ddc', 30: '#12a37f', 35: '#8e5cd9', 40: '#e08a1e', 45: '#d6409f', 50: '#c43d2b', 60: '#6b4f2a' };
export const colorTornillo = (largo) => COLORES_TORNILLO[largo] || '#555555';

export const nombreCortoTornillo = (d, largo) => `${fmt(d)}x${largo}`;

// Cuántos tornillos hay de cada tipo (para la leyenda del 3D)
export function cuentaTornillos(tornillos) {
  const c = new Map();
  for (const t of tornillos) {
    const k = `${t.d}|${t.largo}`;
    const prev = c.get(k) || { d: t.d, largo: t.largo, cantidad: 0 };
    prev.cantidad += 1;
    c.set(k, prev);
  }
  return [...c.values()].sort((a, b) => a.largo - b.largo || a.d - b.d);
}

export const _interno = { fmt };
