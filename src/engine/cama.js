// Cama extensible de 90 a 120 cm: plataforma de placas de plywood con esquinas redondeadas,
// pegada a la pared izquierda y a la cabecera (mueble trasero). Debajo de cada placa hay una
// bandeja que se tira hacia el pasillo sobre correderas de carga y agranda la cama.
// Abajo hay dos cajones grandes y al pie la caja con arco. Frente al mueble trasero queda un hueco
// libre bajo la cama (cama.huecoMueble) para sacar el cajón de bidones y abrir las puertas bajas.
import { cajon } from './cajon.js';

export function cama(ctx, G) {
  const { cfg, t } = ctx;
  const { van, cama: ca, trasero: tr } = cfg;

  const x0 = ca.x0;
  const x1 = ca.x0 + ca.ancho; // borde del pasillo con la cama cerrada (90 cm)
  const zCab = van.largo - (tr.profundidadL ?? tr.profundidad); // frente de la sección izquierda del mueble trasero (la L)
  const arcoIni = van.archInicio;
  const arcoFin = van.archInicio + van.archLargo;
  const xArco = van.archIntrusion + 5; // las guías que cruzan el pasarruedas arrancan después de él
  const sobreArco = (z0, z1) => z1 > arcoIni && z0 < arcoFin;
  const zPie = zCab - ca.largo; // extremo trasero de la cama
  const yT = ca.plataforma; // cara superior de la plataforma
  const yB = yT - t; // cara inferior de la plataforma
  const zCentro = zCab - ca.largoCabecera; // división entre placas
  const L = ca.ancho;
  const R = ca.radio;
  const c = 13; // luz que ocupa una corredera de carga a cada lado
  const hol = 1.5; // mitad de la luz entre las dos placas
  const bw = ca.bandejaAncho; // ancho de cada bandeja (se queda 200 mm debajo de la placa al abrir)
  const xb0 = x1 - bw;

  ctx.layout.cama = { x0, x1, zPie, zCab, yT, zCentro, extension: ca.extension };

  const P = (nombre, x, y, z, sx, sy, sz, extra = {}) => ctx.parte({ grupo: G, nombre, x, y, z, sx, sy, sz, ...extra });
  const LST = (nombre, x, y, z, sx, sy, sz, extra = {}) =>
    ctx.parte({ grupo: G, nombre, tipo: 'liston', mat: 'l30x30', x, y, z, sx, sy, sz, ...extra });

  // Placas de la plataforma (esquinas redondeadas, se cortan con fresadora o caladora)
  P(`Placa de la cabecera (esquinas R${R})`, x0, yB, zCentro + hol, L, t, zCab - zCentro - hol, { radio: R });
  P(`Placa del pie (esquinas R${R})`, x0, yB, zPie, L, t, zCentro - hol - zPie, { radio: R });

  // Caja del pie con la abertura en arco (visto desde la puerta trasera)
  const arcoAncho = 340;
  const aX0 = x0 + 430;
  const aX1 = aX0 + arcoAncho;
  const aY0 = 60;
  const radioArco = arcoAncho / 2;
  const aCy = yB - 15 - radioArco; // centro del arco: deja 15 mm hasta la placa
  P('Frente del pie - izquierdo', x0, 0, zPie, aX0 - x0, yB, t);
  P('Frente del pie - derecho', aX1, 0, zPie, x1 - aX1, yB, t);
  P('Frente del pie - bajo la abertura', aX0, 0, zPie, aX1 - aX0, aY0, t);
  P('Frente del pie - sobre la abertura (calar arco)', aX0, aCy, zPie, aX1 - aX0, yB - aCy, t);
  ctx.deco({ grupo: G, nombre: 'Arco de la abertura', forma: 'arco', cx: (aX0 + aX1) / 2, cy: aCy, z: zPie - 0.6, radio: radioArco, sz: 0.8 });
  ctx.herraje(G, `Plantilla de arco R${radioArco} mm`, 1, 'Marcar el arco en la pieza sobre la abertura y calar con caladora');
  const zInt = Math.min(zPie + 385, arcoIni - 10); // fondo de la caja (termina antes del pasarruedas)
  P('Lateral izquierdo de la caja del pie', x0, 0, zPie + t, t, yB, zInt - zPie - t);
  P('Lateral derecho de la caja del pie', x1 - t, 0, zPie + t, t, yB, zInt - zPie - 2 * t);
  // Panel interior: además de cerrar la caja, es la guía de la bandeja y del cajón del pie
  P('Panel interior de la caja del pie (guía)', x0 + t, 0, zInt - t, L - t, yB, t);

  // Panel central: divide las placas y es guía de la bandeja y del cajón de los dos lados
  const zPanel = zCentro - t / 2;
  const xPanel = sobreArco(zPanel, zPanel + t) ? xArco : x0;
  P('Panel central de apoyo (guía)', xPanel, 0, zPanel, x1 - xPanel, yB, t);

  // Guía de la cabecera: cierra el hueco libre que queda bajo la cama frente al mueble trasero.
  // En ese hueco salen el cajón de bidones y las puertas bajas del mueble.
  const hueco = ca.huecoMueble ?? 430;
  const zG2 = zCab - hueco;
  P('Guía de la cabecera (al fondo del hueco libre)', x1 - 560, 0, zG2, 560, yB, t);

  // Zonas de las bandejas y de los cajones: entre guías, con la luz de las correderas
  const zonaCab = { z0: zPanel + t + c, z1: zG2 - c };
  const zonaPie = { z0: zInt + c, z1: zPanel - c };

  const bandeja = (nombre, z) => {
    const largo = z.z1 - z.z0;
    const yPl = yB - 1 - t; // 1 mm por debajo de la placa fija
    P(`Bandeja extensible ${nombre} (esquinas R${R})`, xb0, yPl, z.z0, bw, t, largo, { radio: R, ext: true });
    LST(`Listón de la bandeja ${nombre} (lado trasero)`, xb0, yPl - 30, z.z0, bw, 30, 30, { ext: true });
    LST(`Listón de la bandeja ${nombre} (lado delantero)`, xb0, yPl - 30, z.z1 - 30, bw, 30, 30, { ext: true });
    return largo;
  };
  const largoBandCab = bandeja('de la cabecera', zonaCab);
  const largoBandPie = bandeja('del pie', zonaPie);

  // Cajones bajo la cama, se tiran hacia el pasillo (x+)
  const yCaj = 20;
  const cajonConFrente = (nombre, zona, fondo, alto) => {
    const ancho = zona.z1 - zona.z0;
    cajon(ctx, { grupo: G, nombre, x: x1 - t - fondo, y: yCaj, z: zona.z0, ancho, alto, fondo, dir: 'x+' });
    P(`Frente ${nombre.toLowerCase()}`, x1 - t, yCaj - 5, zona.z0 - 2, t, alto + 10, ancho + 4);
    // Agarradera ovalada del frente (visual)
    ctx.deco({
      grupo: G,
      nombre: `Agarradera ${nombre.toLowerCase()}`,
      x: x1 - 0.6,
      y: yCaj + alto / 2 - 15,
      z: zona.z0 + ancho / 2 - 70,
      sx: 1.2,
      sy: 30,
      sz: 140,
    });
  };
  cajonConFrente('Cajón de la cabecera', zonaCab, ca.cajonCabecera.fondo, ca.cajonCabecera.alto);
  cajonConFrente('Cajón del pie', zonaPie, ca.cajonPie.fondo, ca.cajonPie.alto);

  // Apoyos de las placas fijas: largueros y listones de pared (esquivan el pasarruedas)
  const xLarguero = xb0 - 35;
  LST('Larguero de apoyo (cabecera)', xLarguero, yB - 30, zPanel + t, 30, 30, zG2 - zPanel - t);
  LST('Larguero sobre el hueco libre', xLarguero, yB - 30, zG2 + t, 30, 30, zCab - 30 - zG2 - t);
  LST('Larguero de apoyo (pie)', xLarguero, yB - 30, zInt, 30, 30, zPanel - zInt);
  // Sobre el pasarruedas la placa apoya directamente en él (con fieltro): ahí no hay listón de pared
  const lw = (nombre, z0, z1) => {
    if (z1 - z0 > 100) LST(nombre, x0, yB - 30, z0, 30, 30, z1 - z0);
  };
  lw('Listón de pared (pie)', zInt + 5, Math.min(zPanel - 5, arcoIni - 10));
  lw('Listón de pared (cabecera, después del arco)', arcoFin + 10, zCab - 30);

  // Unión al frente del mueble trasero: va en el travesaño que queda entre los frentes bajos
  // (que terminan antes del listón) y los altos (que empiezan sobre la cama)
  const xUnion = Math.min(x1, tr.divisor1); // solo hasta donde llega la sección izquierda del mueble
  LST('Listón de unión a la cabecera', x0, yB - 30, zCab - 30, xUnion - x0, 30, 30);

  // Uniones
  ctx.unir(G, 'cola_tornillo', 2 * L, 'Placas con panel central, largueros y listones');
  ctx.unir(G, 'cola_tornillo', 2 * (yB + L), 'Caja del pie: frentes, laterales y panel interior');
  ctx.unir(G, 'cola_tornillo', 2 * (yB + 560), 'Guías con piso y largueros');
  ctx.unir(G, 'cola_tornillo', 4 * bw, 'Bandejas con sus listones');
  ctx.unir(G, 'directo', 0, 'Placas fijas atornilladas desde arriba a los apoyos (se pueden levantar)', {
    herraje: 'Tornillo avellanado 4x40 mm (placas de la cama)',
    cantidad: 24,
  });
  ctx.unir(G, 'directo', 0, 'Listón de unión al frente del mueble trasero', {
    herraje: 'Tornillo aglomerado 4x50 mm (cama al mueble trasero)',
    cantidad: 10,
  });
  ctx.unir(G, 'piso', 2 * L, 'Frente del pie, panel central y guías al piso de la van');
  ctx.unir(G, 'pared', ca.largo, 'Caja del pie y listones contra la pared izquierda');
  ctx.anclaje(G, 'Piso de la van', 'Escuadras L en el frente del pie, el panel central y las guías', 6, 'Sellar los agujeros');
  ctx.anclaje(G, 'Mueble trasero', 'Listón de unión atornillado al travesaño del frente del mueble', 2, 'Entre los frentes bajos y los altos');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L en la caja del pie', 2, 'Remache o autoperforante');

  // Herrajes
  ctx.herraje(G, 'Par de correderas de carga 500 mm (100 kg, extensión total)', 2, 'Una por bandeja: una corredera a cada lado');
  ctx.herraje(G, 'Retén o traba para bandejas', 2, 'Para que no salgan solas al frenar');
  ctx.herraje(G, 'Tirador embutido o agarradera ovalada', 4, 'Dos frentes de cajón y dos bandejas');
  ctx.herraje(G, 'Fresadora con fresa de radio o plantilla y lijadora', 1, `Para las esquinas R${R} de las placas y las bandejas`);
  ctx.herraje(G, 'Fieltro o goma antivibración 5 mm', 2, `Entre las placas y los pasarruedas (${(van.archLargo / 1000).toFixed(1)} m cada uno)`);

  // Control de que las bandejas entren en la van al abrir
  if (x1 + ca.extension > van.ancho) ctx.aviso('La cama extendida no entra: la extensión supera el ancho de la van.');
  if (largoBandCab < 300 || largoBandPie < 300) ctx.aviso('Una bandeja quedó muy corta: revisar el largo de las placas.');
}
