// Cama extensible de 71 a 120 cm, armada como la del instructivo (paso 10): dos módulos, uno de 120 cm (cabecera)
// y otro de 60 cm (pie), que juntos hacen 180 cm. Cada módulo es una caja abierta de plywood con un costado del lado
// del pasillo que lleva una ventana grande de esquinas redondeadas; esa ventana es el hueco del cajón. El frente del
// pie tiene otra ventana. La plataforma son las mismas placas, con ranuras de esquinas redondeadas cortadas en la
// madera (no hay varillas). Cada placa se corta de una lámina de 120 cm: 71 cm quedan de placa y el sobrante de 49 cm es
// su bandeja. Debajo de cada placa hay una bandeja con las mismas ranuras, que se tira hacia el pasillo
// sobre correderas y agranda la cama: las ranuras de la bandeja quedan en línea con las de la placa y el dibujo sigue.
// Frente al mueble trasero queda un hueco libre bajo la cama (cama.huecoMueble) para sacar el cajón de bidones.
import { cajon } from './cajon.js';
import { disposicionTrasero } from './disposicion.js';

export function cama(ctx, G) {
  const { cfg, t } = ctx;
  const { van, cama: ca, trasero: tr } = cfg;
  const ra = ca.ranura;
  const ve = ca.ventana;

  const x0 = ca.x0;
  const x1 = ca.x0 + ca.ancho; // borde del pasillo con la cama cerrada (71 cm)
  const zCab = van.largo - (tr.profundidadL ?? tr.profundidad); // frente de la sección izquierda del mueble trasero (la L)
  const arcoIni = van.archInicio;
  const arcoFin = van.archInicio + van.archLargo;
  const xArco = van.archIntrusion + 5; // lo que cruza el pasarruedas arranca después de él
  const sobreArco = (z0, z1) => z1 > arcoIni && z0 < arcoFin;
  const zPie = zCab - ca.largo; // extremo trasero de la cama
  const yT = ca.plataforma; // cara superior de la plataforma
  const yB = yT - t; // cara inferior de la plataforma
  const zCentro = zCab - ca.largoCabecera; // unión de los dos módulos
  const L = ca.ancho;
  const R = ca.radio;
  const c = 13; // luz que ocupa una corredera a cada lado
  const hol = 1.5; // mitad de la luz entre las dos placas
  const bw = ca.bandejaAncho; // ancho de cada bandeja: el sobrante de la placa (al abrir queda toda afuera, sostenida por las correderas)
  const xb0 = x1 - bw;
  const yPl = yB - 1 - t; // cara de abajo de las bandejas: 1 mm debajo de la placa fija
  const yPan = yPl - 4; // los costados del pasillo llegan hasta justo debajo de las bandejas, que salen por encima
  const sh = ve.apoyoCajon; // listón en el que se atornilla la corredera de cada cajón

  ctx.layout.cama = { x0, x1, zPie, zCab, yT, zCentro, extension: ca.extension };

  const P = (nombre, x, y, z, sx, sy, sz, extra = {}) => ctx.parte({ grupo: G, nombre, x, y, z, sx, sy, sz, ...extra });
  const LST = (nombre, x, y, z, sx, sy, sz, extra = {}) =>
    ctx.parte({ grupo: G, nombre, tipo: 'liston', mat: 'l30x30', x, y, z, sx, sy, sz, ...extra });
  const LST45 = (nombre, x, y, z, sx, sy, sz, extra = {}) =>
    ctx.parte({ grupo: G, nombre, tipo: 'liston', mat: 'l45x45', x, y, z, sx, sy, sz, ...extra });

  // Recorte de la placa de la cabecera para el cajón del gas: al sacar la garrafa el cajón se tira entero
  // sobre el escalón que queda frente a la cocina y su frente alto pasa por encima del plano de la cama.
  // Es un rectángulo en la esquina del lado de la cocina (el colchón lleva el mismo recorte).
  const bar = disposicionTrasero(cfg).K.barridoGas;
  const recorte = bar.x0 < x1 && bar.z0 < zCab ? { x0: Math.max(x0 + 100, bar.x0), x1, z0: bar.z0, z1: zCab } : null;
  ctx.layout.cama.recorte = recorte;

  // ---- Ranuras de la plataforma ----
  // Rejilla de ranuras de una placa: centrada en su largo (z). Las bandejas usan las mismas posiciones en z.
  const rejilla = (zIni, largo) => {
    const paso = ra.ancho + ra.costilla;
    const n = Math.max(1, Math.floor((largo - 2 * ra.margen + ra.costilla) / paso));
    const total = n * ra.ancho + (n - 1) * ra.costilla;
    const z0 = zIni + (largo - total) / 2;
    return Array.from({ length: n }, (_, k) => [z0 + k * paso, z0 + k * paso + ra.ancho]);
  };
  // Pasa las ranuras a huecos de la pieza (a = x desde su borde, b = z desde su borde). Donde hay un recorte se acortan.
  const huecosRanura = (px, pz, anchoPieza, lista, recortes = null) =>
    lista
      .map(([za, zb]) => {
        let a1 = anchoPieza - ra.margen;
        if (recortes && zb > recortes.z0 && za < recortes.z1) a1 = Math.min(a1, recortes.x0 - px - ra.margen);
        return { tipo: 'ranura', a0: ra.margen, a1, b0: za - pz, b1: zb - pz, r: ra.radio };
      })
      .filter((h) => h.a1 - h.a0 > 150);

  // ---- Placas de la plataforma (esquinas redondeadas y ranuras) ----
  const zPlacaCab = zCentro + hol;
  const largoPlacaCab = zCab - zPlacaCab;
  const largoPlacaPie = zCentro - hol - zPie;
  const rejCab = rejilla(zPlacaCab, largoPlacaCab);
  const rejPie = rejilla(zPie, largoPlacaPie);
  const huecosCab = huecosRanura(x0, zPlacaCab, L, rejCab, recorte);
  const nombreCab = recorte
    ? `Placa de la cabecera (esquinas R${R}, ${huecosCab.length} ranuras, recorte de ${Math.round(recorte.x1 - recorte.x0)} x ${Math.round(recorte.z1 - recorte.z0)} mm para el cajón del gas)`
    : `Placa de la cabecera (esquinas R${R}, ${huecosCab.length} ranuras)`;
  P(nombreCab, x0, yB, zPlacaCab, L, t, largoPlacaCab, { radio: R, huecos: huecosCab, ...(recorte ? { recorte } : {}) });
  const huecosPie = huecosRanura(x0, zPie, L, rejPie);
  P(`Placa del pie (esquinas R${R}, ${huecosPie.length} ranuras)`, x0, yB, zPie, L, t, largoPlacaPie, { radio: R, huecos: huecosPie });

  // ---- Bahías de los módulos: entre el frente del pie, el panel central y la guía de la cabecera ----
  const zPanel = zCentro - t / 2;
  const hueco = ca.huecoMueble ?? 430;
  const zG2 = zCab - hueco;
  const bahiaPie = { z0: zPie + t, z1: zPanel };
  const bahiaCab = { z0: zPanel + t, z1: zG2 };

  // Ventana de un costado: el alto va desde el zócalo hasta el cabezal; el ancho deja el hueco del cajón con su luz
  const altoVentana = yPan - ve.cabezal - ve.zocalo;
  const rV = Math.min(ve.radio, altoVentana / 2 - 1);
  const anchoCajon = (b) => b.z1 - b.z0 - 2 * (sh + c); // caja del cajón: entre los listones de las correderas
  const ventanaDe = (b, zPieza) => {
    const ancho = anchoCajon(b) + 10;
    const zc = (b.z0 + b.z1) / 2;
    return { tipo: 'ventana', a0: ve.zocalo, a1: ve.zocalo + altoVentana, b0: zc - ancho / 2 - zPieza, b1: zc + ancho / 2 - zPieza, r: rV };
  };

  // ---- Módulo del pie (60): frente con ventana y costado del pasillo con ventana ----
  const anchoFrente = x1 - t - x0;
  P('Frente del pie (ventana de esquinas redondeadas)', x0, 0, zPie, anchoFrente, yB, t, {
    huecos: [{ tipo: 'ventana', a0: 70, a1: anchoFrente - 70, b0: ve.zocalo, b1: ve.zocalo + altoVentana, r: rV }],
  });
  P('Costado del pasillo - módulo del pie, 60 (ventana)', x1 - t, 0, zPie, t, yPan, zCentro - zPie, {
    huecos: [ventanaDe(bahiaPie, zPie)],
    lado: 1,
  });

  // ---- Módulo de la cabecera (120): costado del pasillo con ventana sobre el cajón; el resto queda libre ----
  P('Costado del pasillo - módulo de la cabecera, 120 (ventana)', x1 - t, 0, zCentro, t, yPan, zG2 + t - zCentro, {
    huecos: [ventanaDe(bahiaCab, zCentro)],
    lado: 1,
  });

  // Panel central: separa los módulos y es guía de las bandejas y de los cajones de los dos lados
  const xPanel = sobreArco(zPanel, zPanel + t) ? xArco : x0;
  P('Panel central de apoyo (guía)', xPanel, 0, zPanel, x1 - t - xPanel, yB, t);
  // Guía de la cabecera: cierra el hueco libre que queda bajo la cama frente al mueble trasero.
  // En ese hueco salen el cajón de bidones y las puertas bajas del mueble.
  P('Guía de la cabecera (al fondo del hueco libre)', x1 - 560, 0, zG2, 560 - t, yB, t);

  // ---- Bandejas extensibles: las mismas ranuras que la placa, en línea con ellas ----
  const zonaCab = { z0: bahiaCab.z0 + c, z1: bahiaCab.z1 - c };
  const zonaPie = { z0: bahiaPie.z0 + c, z1: bahiaPie.z1 - c };
  const bandeja = (nombre, z, rej) => {
    const largo = z.z1 - z.z0;
    const lista = rej.filter(([za, zb]) => za >= z.z0 + 30 && zb <= z.z1 - 30);
    const huecos = huecosRanura(xb0, z.z0, bw, lista);
    P(`Bandeja extensible ${nombre} (esquinas R${R}, ${huecos.length} ranuras)`, xb0, yPl, z.z0, bw, t, largo, { radio: R, ext: true, huecos });
    return largo;
  };
  const largoBandCab = bandeja('de la cabecera', zonaCab, rejCab);
  const largoBandPie = bandeja('del pie', zonaPie, rejPie);

  // ---- Cajones en los huecos de los costados: el frente llena la ventana ----
  const yFrente = ve.zocalo + 3;
  const altoFrente = altoVentana - 6;
  const yCaj = yFrente + 5;
  const altoCaj = altoFrente - 10;
  const cajonEnVentana = (nombre, b, fondo) => {
    const ancho = anchoCajon(b);
    const z0 = b.z0 + sh + c;
    cajon(ctx, { grupo: G, nombre, x: x1 - t - fondo, y: yCaj, z: z0, ancho, alto: altoCaj, fondo, dir: 'x+', pisoGrueso: true });
    P(`Frente ${nombre.toLowerCase()}`, x1 - t, yFrente, z0 - 2, t, altoFrente, ancho + 4, { redondeo: rV - 3, lado: 1, color: '#d3b27c' });
    // Listones donde se atornillan las correderas, uno a cada lado
    const yL = yCaj + altoCaj / 2 - sh / 2;
    LST45(`Listón de las correderas ${nombre.toLowerCase()} (lado trasero)`, x1 - t - fondo, yL, b.z0, fondo, sh, sh);
    LST45(`Listón de las correderas ${nombre.toLowerCase()} (lado delantero)`, x1 - t - fondo, yL, b.z1 - sh, fondo, sh, sh);
    // Botón push al centro del frente, hacia el pasillo
    ctx.boton({ grupo: G, nombre: `Frente ${nombre.toLowerCase()}`, eje: 'x+', x: x1, y: yFrente + altoFrente / 2, z: z0 + ancho / 2 });
    return ancho;
  };
  const anchoCajCab = cajonEnVentana('Cajón de la cabecera', bahiaCab, ca.cajonCabecera.fondo);
  const anchoCajPie = cajonEnVentana('Cajón del pie', bahiaPie, ca.cajonPie.fondo);

  // ---- Apoyos de las placas fijas: largueros y listones de pared (esquivan el pasarruedas) ----
  const xLarguero = xb0 - 35;
  LST('Larguero de apoyo (pie)', xLarguero, yB - 30, bahiaPie.z0, 30, 30, bahiaPie.z1 - bahiaPie.z0);
  LST('Larguero de apoyo (cabecera)', xLarguero, yB - 30, bahiaCab.z0, 30, 30, bahiaCab.z1 - bahiaCab.z0);
  LST('Larguero sobre el hueco libre', xLarguero, yB - 30, zG2 + t, 30, 30, zCab - 30 - zG2 - t);
  // Sobre el pasarruedas la placa apoya directamente en él (con fieltro): ahí no hay listón de pared
  const lw = (nombre, z0, z1) => {
    if (z1 - z0 > 100) LST(nombre, x0, yB - 30, z0, 30, 30, z1 - z0);
  };
  lw('Listón de pared (pie)', bahiaPie.z0 + 5, Math.min(bahiaPie.z1 - 5, arcoIni - 10));
  lw('Listón de pared (cabecera, después del arco)', arcoFin + 10, zCab - 30);

  // Unión al frente del mueble trasero: va en el travesaño que queda entre los frentes bajos
  // (que terminan antes del listón) y los altos (que empiezan sobre la cama)
  const xUnion = Math.min(x1, tr.divisor1); // solo hasta donde llega la sección izquierda del mueble
  LST('Listón de unión a la cabecera', x0, yB - 30, zCab - 30, xUnion - x0, 30, 30);

  // ---- Refuerzos al piso: como en el instructivo, 4 tornillos de 25 mm por módulo (2 refuerzos con 2 tornillos) ----
  // Quedan al piso, bajo los cajones (que empiezan 3 mm más arriba) y esquivan el pasarruedas
  const refuerzo = (nombre, zA, xDesde) => LST45(nombre, xDesde, 0, zA, x1 - t - 2 - xDesde, sh, sh);
  const desde = (zA, xMin = x0) => (sobreArco(zA, zA + sh) ? Math.max(xArco, xMin) : xMin);
  refuerzo('Refuerzo de piso del módulo del pie (frente)', bahiaPie.z0, desde(bahiaPie.z0));
  refuerzo('Refuerzo de piso del módulo del pie (unión)', bahiaPie.z1 - sh, desde(bahiaPie.z1 - sh));
  refuerzo('Refuerzo de piso del módulo de la cabecera (unión)', bahiaCab.z0, desde(bahiaCab.z0));
  refuerzo('Refuerzo de piso del módulo de la cabecera (guía)', bahiaCab.z1 - sh, desde(bahiaCab.z1 - sh, x1 - 560));

  // ---- Uniones ----
  ctx.unir(G, 'cola_tornillo', 2 * L, 'Placas con panel central, largueros y listones');
  ctx.unir(G, 'cola_tornillo', 2 * (yB + L), 'Frente del pie con sus costados y el panel central');
  ctx.unir(G, 'cola_tornillo', 4 * yPan, 'Costados del pasillo con el frente, el panel central y la guía');
  ctx.unir(G, 'cola_tornillo', 2 * (yB + 560), 'Guías con refuerzos de piso y largueros');
  ctx.unir(G, 'cola_tornillo', 4 * bw, 'Bandejas con sus correderas');
  ctx.unir(G, 'directo', 0, 'Placas fijas atornilladas desde arriba a los apoyos (se pueden levantar)', {
    herraje: 'Tornillo avellanado 4x40 mm (placas de la cama)',
    cantidad: 24,
  });
  ctx.unir(G, 'directo', 0, 'Módulo del pie (60) unido al de la cabecera (120) con dos tornillos de 25 mm, como en el instructivo', {
    herraje: 'Tornillo 4x25 mm (unión de los dos módulos)',
    cantidad: 2,
  });
  ctx.unir(G, 'directo', 0, 'Refuerzos de piso atornillados a la van: 4 tornillos de 25 mm por módulo', {
    herraje: 'Tornillo autoperforante 4,8x25 mm (refuerzos al piso)',
    cantidad: 8,
  });
  ctx.unir(G, 'directo', 0, 'Listón de unión al frente del mueble trasero', {
    herraje: 'Tornillo aglomerado 4x50 mm (cama al mueble trasero)',
    cantidad: 10,
  });
  ctx.unir(G, 'pared', ca.largo, 'Listones contra la pared izquierda');
  ctx.anclaje(G, 'Piso de la van', 'Refuerzos de piso, 2 tornillos de 25 mm cada uno (4 por módulo)', 8, 'Sellar los agujeros');
  ctx.anclaje(G, 'Mueble trasero', 'Listón de unión atornillado al travesaño del frente del mueble', 2, 'Entre los frentes bajos y los altos');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L en el listón de pared del pie', 2, 'Remache o autoperforante');

  // ---- Herrajes ----
  ctx.herraje(G, 'Par de correderas de carga 500 mm (100 kg, extensión total)', 2, 'Una por bandeja: una corredera a cada lado');
  ctx.herraje(G, 'Retén o traba para bandejas', 2, 'Para que no salgan solas al frenar');
  ctx.herrajeBotones(G); // un botón push en cada frente de cajón
  ctx.herraje(G, 'Tirador embutido para las bandejas', 2, 'Una agarradera al borde de cada bandeja: el borde de 15 mm es muy fino para un botón push');
  ctx.herraje(G, 'Fresadora con fresa de radio o plantilla y lijadora', 1, `Para las esquinas R${R} de las placas y bandejas y para pulir los calados`);
  ctx.herraje(G, 'Caladora, taladro con broca de 10 mm y plantilla de las ranuras y de las ventanas', 1, `Ranuras ${ra.ancho} mm de ancho con esquinas R${ra.radio}; ventanas con esquinas R${ve.radio}`);
  ctx.herraje(G, 'Fieltro o goma antivibración 5 mm', 2, `Entre las placas y los pasarruedas (${(van.archLargo / 1000).toFixed(1)} m cada uno)`);

  // La placa y su bandeja salen de la misma lámina
  const hojaA = cfg.materiales.estructura.hojaA;
  if (L + bw > hojaA) ctx.aviso(`La placa (${L} mm) y su bandeja (${bw} mm) no salen de una misma lámina de ${hojaA} mm.`);
  // Control de que las bandejas entren en la van al abrir
  if (x1 + ca.extension > van.ancho) ctx.aviso('La cama extendida no entra: la extensión supera el ancho de la van.');
  if (largoBandCab < 300 || largoBandPie < 300) ctx.aviso('Una bandeja quedó muy corta: revisar el largo de las placas.');
  if (anchoCajCab < 250 || anchoCajPie < 250) ctx.aviso('Un cajón de la cama quedó muy angosto: revisar el largo de las placas o los listones de las correderas.');
  if (altoVentana < 150) ctx.aviso('Las ventanas de los costados quedaron muy bajas: revisar la altura de la plataforma.');
}
