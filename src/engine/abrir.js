// Modo "Abierto": cómo se mueve cada pieza cuando se abren los cajones y las puertas.
// Todo sale de los botones push: el botón dice hacia dónde sale el frente (eje) y de qué lado queda la manija,
// o sea que la bisagra está del lado contrario. Medidas en milímetros, en las coordenadas de la van.

const EJE = { x: 0, y: 1, z: 2 };
const GIRO_PUERTA = (100 * Math.PI) / 180;
const GIRO_TAPA = Math.PI / 2; // la puerta con bisagras abajo queda horizontal
const RECORRIDO_MAX = 240;

// Une el frente con las maderas de su caja: "Frente cajón de cocina 1" y "Cajón de cocina 1 - lateral" son el mismo cajón
export function llaveCajon(nombre) {
  const n = nombre.toLowerCase();
  const frente = n.match(/^frente (cajón .+)$/);
  const caja = n.match(/^(cajón .+?) - (lateral|trasera|piso del cajón|delantera)/);
  const k = frente ? frente[1] : caja ? caja[1] : null;
  return k;
}

// Devuelve { porParte, porDeco }: para cada id, un cajón { tipo, v } (desplazamiento total en mm)
// o una puerta { tipo, pivote: [x, z], giro } (giro en radianes alrededor del eje vertical) o una tapa que baja
// { tipo: 'tapa', pivote: [x, y], giro } (giro alrededor de un eje horizontal paralelo a z).
export function planAbrir(data) {
  const porParte = {};
  const porDeco = {};
  for (const d of data.decos) {
    if (d.forma !== 'boton') continue;
    const nombre = d.nombre.replace(/^Botón push: /, '');
    const frente = data.partes.find((p) => p.nombre === nombre);
    if (!frente) continue;
    const eje = EJE[d.eje[0]];
    const signo = d.eje[1] === '+' ? 1 : -1;
    const llave = llaveCajon(nombre);

    if (llave) {
      const miembros = data.partes.filter((p) => llaveCajon(p.nombre) === llave);
      const costado = miembros.find((p) => /- lateral/.test(p.nombre));
      const fondo = costado ? [costado.sx, costado.sy, costado.sz][eje] : 300;
      const v = [0, 0, 0];
      v[eje] = signo * Math.min(fondo / 2, RECORRIDO_MAX);
      const mov = { tipo: 'cajon', v };
      for (const p of miembros) porParte[p.id] = mov;
      porDeco[d.id] = mov;
      continue;
    }

    // Puerta con las bisagras abajo (cama): gira sobre el borde de abajo, por la cara de adentro, y baja hacia afuera.
    // pivote = [x, y] de un eje horizontal paralelo a z
    if (frente.bisagraAbajo && eje === 0) {
      const xp = signo > 0 ? frente.x : frente.x + frente.sx;
      const mov = { tipo: 'tapa', pivote: [xp, frente.y], giro: -signo * GIRO_TAPA };
      porParte[frente.id] = mov;
      porDeco[d.id] = mov;
      continue;
    }

    // Puerta: la bisagra queda en el borde más lejos del botón
    const a = eje === 2 ? 0 : 2;
    const pos = [frente.x, frente.y, frente.z];
    const med = [frente.sx, frente.sy, frente.sz];
    const botonA = [d.x, d.y, d.z][a] + [d.sx, d.sy, d.sz][a] / 2;
    const bisagraEnMin = botonA > pos[a] + med[a] / 2;
    const libre = [0, 0, 0];
    libre[a] = bisagraEnMin ? 1 : -1;
    const afuera = [0, 0, 0];
    afuera[eje] = signo;
    const giro = Math.sign(libre[2] * afuera[0] - libre[0] * afuera[2]) * GIRO_PUERTA;
    const p3 = [0, 0, 0];
    p3[a] = bisagraEnMin ? pos[a] : pos[a] + med[a];
    p3[eje] = pos[eje] + med[eje] / 2;
    const mov = { tipo: 'puerta', pivote: [p3[0], p3[2]], giro };
    porParte[frente.id] = mov;
    porDeco[d.id] = mov;
  }
  return { porParte, porDeco };
}
