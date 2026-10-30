// Cama extensible de 71 a 120 cm, armada como la del instructivo (paso 10): dos módulos, uno de 120 cm (cabecera)
// y otro de 60 cm (pie), que juntos hacen 180 cm de pared a pared del mueble trasero. Cada módulo es una caja abierta de
// plywood con un costado FIJO del lado del pasillo (CAM-04 y CAM-05): un marco cerrado de 4 lados con una ventana de
// esquinas redondeadas, que lleva la puerta del módulo. La puerta baja hasta el piso (bisagras abajo, como la Standard
// Sliding Bed B120) y deja ver el hueco de guardado, sin cajones ni correderas. Las dos tapas de los extremos (frente del pie y guía de la
// cabecera) llegan hasta la cara de arriba de la cama; el panel central de apoyo llega hasta abajo de las placas.
//
// Por afuera de cada costado fijo va un PORTAL (una U invertida de la altura de la cama: dos patas y un travesaño) que
// sale con las varillas: se atornilla al lomo móvil y a las puntas de los listones de las correderas, y sus patas son la
// base de la extensión. Cerrada, el portal queda delante de la puerta (que sale por el calado de abajo) y suma 15 mm al
// ancho de la cama; abierta, el costado y la puerta se quedan en su lugar. Los listones de las correderas pasan por
// encima del costado fijo, que por eso llega 5 mm más abajo que ellos y no hasta la placa.
//
// La plataforma son dos placas en peine (CAM-01 y CAM-02): cada una se corta con ranuras abiertas hacia el pasillo. Los
// pedazos que salen de las ranuras son las varillas móviles; unidas por un lomo, se tiran hacia el pasillo sobre
// correderas y la cama pasa de 71 a 120 cm. Cerrada parece una sola placa plana; abierta, queda una varilla móvil
// intercalada entre cada dedo de la placa fija.
import { peineFijo, peineMovil, repartoPeine } from './peine.js';
import { portalU } from './siluetas.js';

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
  const sh = ve.apoyoCajon; // sección del listón de los refuerzos de piso
  const margenV = ve.margen ?? 58; // lo que deja la ventana a cada lado, contra el frente, el panel central y la guía

  // Peine: lomo fijo contra la pared, lomo móvil del lado del pasillo y las varillas entre los dos
  const lomo = ca.lomo ?? 60;
  const lomoM = ca.lomoMovil ?? 80;
  const luz = ca.luzVarilla ?? 2; // luz de cada varilla dentro de su ranura, a cada lado
  const xl = x0 + lomo; // fondo de las ranuras
  const xs = x1 - lomoM; // punta de los dedos fijos y cara interior del lomo móvil
  const xr = xl + luz; // punta de atrás de las varillas
  // Las correderas van al listón de 30 x 30 de las varillas: no pueden medir más de 30 mm de alto
  const hCorr = Math.max(30, ca.alturaCorredera ?? 30);
  // El costado fijo del pasillo llega hasta 5 mm debajo de los listones de 30 x 30 de las correderas (que pasan por encima)
  // y el portal que sale con las varillas llega hasta la cara de arriba de la cama; los dos quedan 5 mm sobre el piso
  const yPan = yB;
  const luzPiso = 5;
  const luzListones = 5;
  const yCostado = yPan - 30 - luzListones; // borde de arriba del costado fijo

  // Tapas de los extremos, panel central y bahías de los módulos
  const zPanel = zCentro - t / 2;
  const bahiaPie = { z0: zPie + t, z1: zPanel };
  const bahiaCab = { z0: zPanel + t, z1: zCab - t };
  const placaPie = { z0: zPie + t, z1: zCentro - hol };
  const placaCab = { z0: zCentro + hol, z1: zCab - t };
  // Zona de las varillas móviles de cada módulo (de la primera a la última, sin contar la luz). Con ranura.ancho, ranuras y dedos
  // miden eso y la zona sale de la cantidad de ranuras, centrada en la placa: los dos extremos de la placa dejan la misma madera.
  // Con ranura.ancho en 0 ocupa la bahía menos lo que ocupa una corredera a cada lado y el ancho sale del reparto
  const nPie = ca.varillasPie ?? 3;
  const nCab = ca.varillasCabecera ?? 6;
  const zonaDe = (nombre, bahia, placa, n) => {
    const reparto = { z0: bahia.z0 + c, z1: bahia.z1 - c };
    if (!(ra.ancho > 0)) return reparto;
    const total = ra.ancho * (n + (n - 1) * (ra.dedo ?? 1)); // de la pared de la primera ranura a la de la última
    const lateral = (placa.z1 - placa.z0 - total) / 2; // madera que queda a cada lado de la placa
    if (lateral < 0) {
      ctx.aviso(`Las ${n} ranuras de ${ra.ancho} mm no entran en la placa del ${nombre}: bajar el ancho de la ranura o la cantidad de varillas.`);
      return reparto;
    }
    if (lateral < 25) ctx.aviso(`Las ranuras del ${nombre} dejan solo ${Math.round(lateral * 10) / 10} mm de madera a cada lado de la placa: usar ranuras más angostas o menos varillas.`);
    const centro = (placa.z0 + placa.z1) / 2;
    return { z0: centro - total / 2 + luz, z1: centro + total / 2 - luz };
  };
  const zonaPie = zonaDe('pie', bahiaPie, placaPie, nPie);
  const zonaCab = zonaDe('de la cabecera', bahiaCab, placaCab, nCab);

  ctx.layout.cama = { x0, x1, zPie, zCab, yT, yB, yPan, yCostado, zCentro, extension: ca.extension, recorte: null };

  const P = (nombre, x, y, z, sx, sy, sz, extra = {}) => ctx.parte({ grupo: G, nombre, x, y, z, sx, sy, sz, ...extra });
  const LST = (nombre, x, y, z, sx, sy, sz, extra = {}) =>
    ctx.parte({ grupo: G, nombre, tipo: 'liston', mat: 'l30x30', x, y, z, sx, sy, sz, ...extra });
  const LST45 = (nombre, x, y, z, sx, sy, sz, extra = {}) =>
    ctx.parte({ grupo: G, nombre, tipo: 'liston', mat: 'l45x45', x, y, z, sx, sy, sz, ...extra });

  // ---- Placas en peine y varillas móviles ----
  // Cantidad de varillas por módulo (y de ranuras): 3 en el de 60 y 6 en el de 120, todas de 100 mm. El dedo fijo mide lo mismo que la ranura
  const repPie = repartoPeine({ z0: zonaPie.z0, z1: zonaPie.z1, n: nPie, proporcion: ra.dedo ?? 1, luz });
  const repCab = repartoPeine({ z0: zonaCab.z0, z1: zonaCab.z1, n: nCab, proporcion: ra.dedo ?? 1, luz });
  if (!repPie || !repCab) {
    ctx.aviso('No se pudo repartir las varillas de la cama: cada módulo necesita al menos 2.');
    return;
  }
  const largoDedo = xs - xl;

  const datosPeine = (rep, tipo) => ({
    tipo,
    n: rep.n,
    ancho: rep.ancho,
    costilla: rep.fw,
    ranuras: rep.ranuras,
    xl,
    xs,
    lomo,
    lomoM,
    luz,
    anchoVarilla: rep.ancho - 2 * luz,
    largoDedo,
  });
  const placa = (nombreMod, pl, rep) => {
    const f = peineFijo({ x0, x1, zmin: pl.z0, zmax: pl.z1, xl, xs, ranuras: rep.ranuras, ancho: rep.ancho, costilla: rep.fw, R, rs: ra.radio });
    return P(`Placa ${nombreMod} (peine fijo: esquinas R${R}, ${rep.n} ranuras abiertas al pasillo)`, x0, yB, pl.z0, L, t, pl.z1 - pl.z0, {
      perfil: { ...f, ...datosPeine(rep, 'fijo') },
    });
  };
  const idPlacaCab = placa('de la cabecera', placaCab, repCab);
  const idPlacaPie = placa('del pie', placaPie, repPie);

  // ---- Módulo del pie (60): tapa del extremo con ventana y costado del pasillo con ventana ----
  const altoVentana = yCostado - ve.cabezal - ve.zocalo;
  const rV = Math.min(ve.radio, altoVentana / 2 - 1);
  const anchoPuerta = (b) => b.z1 - b.z0 - 2 * margenV; // ancho de la puerta que cierra la ventana (sin luz)
  const ventanaDe = (b, zPieza) => {
    const ancho = anchoPuerta(b) + 10;
    const zc = (b.z0 + b.z1) / 2;
    return { tipo: 'ventana', a0: ve.zocalo - luzPiso, a1: ve.zocalo - luzPiso + altoVentana, b0: zc - ancho / 2 - zPieza, b1: zc + ancho / 2 - zPieza, r: rV };
  };
  const anchoFrente = x1 - t - x0;
  // La ventana del frente del pie empieza sobre el refuerzo de piso de 45 mm que tiene detrás: ahí se atornillan las bisagras
  const yVentanaF = sh - 3;
  const altoVentanaF = ve.zocalo + altoVentana - yVentanaF;
  const rVF = Math.min(ve.radio, altoVentanaF / 2 - 1);
  const margenF = 70;
  const anchoVentanaF = anchoFrente - 2 * margenF;
  P('Frente del pie (ventana de esquinas redondeadas)', x0, 0, zPie, anchoFrente, yT, t, {
    huecos: [{ tipo: 'ventana', a0: margenF, a1: anchoFrente - margenF, b0: yVentanaF, b1: yVentanaF + altoVentanaF, r: rVF }],
  });
  // Costado fijo: marco cerrado de 4 lados con la ventana de la puerta del módulo (llega 5 mm bajo los listones de las correderas)
  const costadoFijo = (nombre, bahia, z0, z1) =>
    P(`Costado del pasillo - módulo ${nombre} (fijo, con ventana)`, x1 - t, luzPiso, z0, t, yCostado - luzPiso, z1 - z0, {
      huecos: [ventanaDe(bahia, z0)],
    });
  costadoFijo('del pie, 60', bahiaPie, zPie, zCentro);

  // ---- Módulo de la cabecera (120): costado del pasillo con ventana y su puerta, hasta el mueble trasero ----
  costadoFijo('de la cabecera, 120', bahiaCab, zCentro, zCab);

  // Panel central: separa los módulos y es guía de las varillas de los dos lados
  const xPanel = sobreArco(zPanel, zPanel + t) ? xArco : x0;
  P('Panel central de apoyo (guía)', xPanel, 0, zPanel, x1 - t - xPanel, yB, t);
  // Guía de la cabecera: tapa del otro extremo, contra el frente del mueble trasero; llega al plano de la cama
  const xGuia = sobreArco(zCab - t, zCab) ? xArco : x0;
  P('Guía de la cabecera (tapa del extremo)', xGuia, 0, zCab - t, x1 - t - xGuia, yT, t);

  // ---- Varillas móviles: las que salen de las ranuras de cada placa, unidas por el lomo ----
  const movil = (nombreMod, pl, rep, idPlaca) => {
    const f = peineMovil({ x1, zmin: pl.z0, zmax: pl.z1, xr, xs, ranuras: rep.ranuras, ancho: rep.ancho, luz, R, rr: ra.radio });
    const zB0 = rep.ranuras[0] + luz;
    const zB1 = rep.ranuras[rep.n - 1] + rep.ancho - luz;
    return P(
      `Varillas móviles ${nombreMod} (${rep.n} varillas de ${Math.round((rep.ancho - 2 * luz) * 10) / 10} mm con su lomo: salen de las ranuras de la placa)`,
      xr,
      yB,
      zB0,
      x1 - xr,
      t,
      zB1 - zB0,
      { perfil: { ...f, ...datosPeine(rep, 'movil'), placa: idPlaca }, ext: true, salidaDe: idPlaca }
    );
  };
  movil('de la cabecera', placaCab, repCab, idPlacaCab);
  movil('del pie', placaPie, repPie, idPlacaPie);

  // ---- Puertas en las ventanas: bajan hasta el piso con bisagras de cazoleta en el borde de abajo ----
  // Cada puerta cierra su ventana con 3 mm de luz y queda FIJA en la caja, en el costado fijo (que no se mueve): la cama se
  // extiende y la puerta sigue colgada de su listón. Las puertas de los costados llevan las bisagras en un listón de 30 x 30
  // fijo en la caja, a ras del borde de abajo de la ventana; la del frente del pie las lleva sobre el refuerzo de piso que
  // tiene detrás. Con la cama cerrada salen por el calado del portal; con la cama abierta quedan al aire, bajo la extensión.
  const yFrente = ve.zocalo + 3;
  const altoFrente = altoVentana - 6;
  const puertaEnVentana = (nombre, b) => {
    const ancho = anchoPuerta(b);
    const z0 = b.z0 + margenV;
    const aAg = altoFrente - 18; // la agarradera queda a 18 mm del borde de arriba
    P(`Puerta del módulo ${nombre} (bisagras abajo)`, x1 - t, yFrente, z0 - 2, t, altoFrente, ancho + 4, {
      redondeo: rV - 3,
      lado: 1,
      color: '#d3b27c',
      bisagraAbajo: true,
      huecos: [{ tipo: 'agarradera', a0: aAg - 24, a1: aAg, b0: (ancho + 4) / 2 - 50, b1: (ancho + 4) / 2 + 50, r: 11 }],
    });
    // El listón queda fijo entre los dos refuerzos de piso de su módulo (tope contra cada uno, 10 mm sobre el piso)
    LST(`Listón de las bisagras (${nombre})`, x1 - t - 30, ve.zocalo - 30, b.z0 + sh, 30, 30, b.z1 - b.z0 - 2 * sh);
    // Botón push al centro de la puerta, hacia el pasillo
    ctx.boton({ grupo: G, nombre: `Puerta del módulo ${nombre} (bisagras abajo)`, eje: 'x+', x: x1, y: yFrente + altoFrente / 2, z: z0 + ancho / 2 });
    return ancho;
  };
  const anchoCajCab = puertaEnVentana('de la cabecera', bahiaCab);
  const anchoCajPie = puertaEnVentana('del pie', bahiaPie);
  // Puerta del frente del pie (hacia la puerta trasera de la van): baja hacia atrás
  {
    const yP = yVentanaF + 3;
    const altoP = altoVentanaF - 6;
    const anchoP = anchoVentanaF - 6;
    const aAg = altoP - 18;
    P('Puerta del frente del pie (bisagras abajo)', x0 + margenF + 3, yP, zPie, anchoP, altoP, t, {
      redondeo: rVF - 3,
      color: '#d3b27c',
      bisagraAbajo: true,
      huecos: [{ tipo: 'agarradera', a0: anchoP / 2 - 50, a1: anchoP / 2 + 50, b0: aAg - 24, b1: aAg, r: 11 }],
    });
    ctx.boton({ grupo: G, nombre: 'Puerta del frente del pie (bisagras abajo)', eje: 'z-', x: x0 + margenF + 3 + anchoP / 2, y: yP + altoP / 2, z: zPie });
  }

  // ---- Apoyos de las placas fijas: largueros y listones de pared (esquivan el pasarruedas) ----
  // Los largueros llegan hasta las correderas de las varillas: pasan entre los listones que cuelgan de las puntas
  const xL2 = xr + ca.extension - 25; // bajo la punta de atrás de las varillas con la cama abierta
  const xL1 = Math.round((xl + xL2) / 2 / 5) * 5; // al medio, entre el lomo y el segundo
  const margenL = 33; // el listón de la corredera (30) y 3 mm de luz
  const larguero = (nombre, x, zona) => LST(nombre, x, yB - 30, zona.z0 + margenL, 30, 30, zona.z1 - zona.z0 - 2 * margenL);
  larguero('Larguero de apoyo (pie)', xL1, zonaPie);
  larguero('Larguero de apoyo (cabecera)', xL1, zonaCab);
  larguero('Larguero de las puntas (pie)', xL2, zonaPie);
  // Sobre el pasarruedas la placa apoya directamente en él (con fieltro): ahí no hay listón de pared
  const lw = (nombre, z0, z1) => {
    if (z1 - z0 > 100) LST(nombre, x0, yB - 30, z0, 30, 30, z1 - z0);
  };
  lw('Listón de pared (pie)', bahiaPie.z0 + 5, Math.min(bahiaPie.z1 - 5, arcoIni - 10));
  lw('Listón de pared (cabecera, después del arco)', arcoFin + 10, bahiaCab.z1 - 5);

  // ---- Refuerzos al piso: como en el instructivo, 4 tornillos de 25 mm por módulo (2 refuerzos con 2 tornillos) ----
  // Quedan al piso, bajo las puertas, y esquivan el pasarruedas
  const refuerzo = (nombre, zA, xDesde) => LST45(nombre, xDesde, 0, zA, x1 - t - xDesde, sh, sh);
  const desde = (zA, xMin = x0) => (sobreArco(zA, zA + sh) ? Math.max(xArco, xMin) : xMin);
  refuerzo('Refuerzo de piso del módulo del pie (frente)', bahiaPie.z0, desde(bahiaPie.z0));
  refuerzo('Refuerzo de piso del módulo del pie (unión)', bahiaPie.z1 - sh, desde(bahiaPie.z1 - sh));
  refuerzo('Refuerzo de piso del módulo de la cabecera (unión)', bahiaCab.z0, desde(bahiaCab.z0));
  refuerzo('Refuerzo de piso del módulo de la cabecera (tapa)', bahiaCab.z1 - sh, desde(bahiaCab.z1 - sh));

  // Lo que sigue se agrega al final para no mover los ids de las demás piezas.
  larguero('Larguero de las puntas (cabecera)', xL2, zonaCab);
  // Lo que cuelga de las varillas y se mueve con ellas: dos listones con las correderas (uno en cada punta) y un listón de
  // unión bajo el empalme de las varillas con el lomo. Los listones de las correderas pasan por encima del costado fijo y
  // terminan contra la cara de adentro del portal (el travesaño, que queda a la altura de los listones), que sale con ellos.
  const xCorr0 = x1 - 500; // la corredera mide 500 mm y termina contra el portal
  const movibles = (nombreMod, zona) => {
    LST(`Listón de la corredera (${nombreMod}, lado del frente)`, xCorr0, yB - 30, zona.z0, 500, 30, 30, { ext: true });
    LST(`Listón de la corredera (${nombreMod}, lado del fondo)`, xCorr0, yB - 30, zona.z1 - 30, 500, 30, 30, { ext: true });
  };
  movibles('pie', zonaPie);
  movibles('cabecera', zonaCab);
  const union = (nombreMod, zona) =>
    LST(`Listón de unión de las varillas (${nombreMod})`, xs - 15, yB - 30, zona.z0 + margenL, 30, 30, zona.z1 - zona.z0 - 2 * margenL, { ext: true });
  union('pie', zonaPie);
  union('cabecera', zonaCab);
  // Portal que sale con las varillas: va por afuera del costado fijo (suma 15 mm al ancho), de la altura de la cama
  // (a ras de las varillas) y 5 mm sobre el piso. Sus dos patas son la base de la extensión y su calado de abajo (del
  // tamaño de la ventana del costado) deja salir la puerta del módulo; el travesaño tapa la franja sobre el costado.
  const portal = (nombre, bahia, z0, z1) => {
    const v = ventanaDe(bahia, z0);
    return P(`Portal del pasillo - módulo ${nombre} (U invertida, sale con la cama)`, x1, luzPiso, z0, t, yT - luzPiso, z1 - z0, {
      silueta: portalU({ w: z1 - z0, h: yT - luzPiso, n0: v.b0, n1: v.b1, a1: v.a1, r: v.r }),
      ext: true,
    });
  };
  portal('del pie, 60', bahiaPie, zPie, zCentro);
  portal('de la cabecera, 120', bahiaCab, zCentro, zCab);

  // ---- Uniones ----
  ctx.unir(G, 'cola_tornillo', 2 * L, 'Placas con panel central, largueros y listones');
  ctx.unir(G, 'cola_tornillo', 2 * (yT + L), 'Frente del pie con sus costados y el panel central');
  ctx.unir(G, 'cola_tornillo', 4 * (yCostado - luzPiso), 'Costados fijos del pasillo con las tapas del módulo (frente del pie, panel central y guía) y con los refuerzos de piso');
  ctx.unir(G, 'cola_tornillo', 2 * (zonaPie.z1 - zonaPie.z0 + zonaCab.z1 - zonaCab.z0), 'Portales con el lomo móvil y con las puntas de los listones de las correderas');
  ctx.unir(G, 'directo', 0, 'Cada portal, atornillado al canto del lomo móvil (uno cada 150 mm) y a las puntas de los dos listones de las correderas', {
    herraje: 'Tornillo avellanado 4x40 mm (portales al lomo y a los listones)',
    cantidad: Math.ceil((zonaPie.z1 - zonaPie.z0) / 150) + 1 + Math.ceil((zonaCab.z1 - zonaCab.z0) / 150) + 1 + 8,
  });
  ctx.unir(G, 'cola_tornillo', 2 * (yB + 560), 'Guías con refuerzos de piso y largueros');
  ctx.unir(G, 'cola_tornillo', 4 * sh, 'Listones de las bisagras de las puertas, de testa contra los refuerzos de piso de sus puntas');
  ctx.unir(G, 'cola_tornillo', 2 * (zonaPie.z1 - zonaPie.z0 + zonaCab.z1 - zonaCab.z0), 'Varillas con el listón de unión');
  ctx.unir(G, 'directo', 0, 'Cada varilla, atornillada al listón de unión desde arriba (2 tornillos avellanados por varilla)', {
    herraje: 'Tornillo avellanado 4x30 mm (varillas al listón de unión)',
    cantidad: 2 * (repPie.n + repCab.n),
  });
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
  ctx.unir(G, 'directo', 0, 'Guía de la cabecera atornillada al frente del mueble trasero', {
    herraje: 'Tornillo aglomerado 4x50 mm (cama al mueble trasero)',
    cantidad: 10,
  });
  ctx.unir(G, 'pared', ca.largo, 'Listones contra la pared izquierda');
  ctx.anclaje(G, 'Piso de la van', 'Refuerzos de piso, 2 tornillos de 25 mm cada uno (4 por módulo)', 8, 'Sellar los agujeros');
  ctx.anclaje(G, 'Mueble trasero', 'Guía de la cabecera atornillada a los montantes y al travesaño del frente del mueble', 2, 'La cama termina contra ese frente');
  ctx.anclaje(G, 'Pared izquierda', 'Escuadras L en el listón de pared del pie', 2, 'Remache o autoperforante');

  // ---- Herrajes ----
  ctx.herraje(
    G,
    'Par de correderas de carga 500 mm (100 kg, extensión total)',
    2,
    `Una por módulo: una corredera a cada lado de las varillas. Van al listón de 30 x 30 de las varillas: no pueden medir más de ${hCorr} mm de alto, y los portales del pasillo salen con ellas`
  );
  ctx.herraje(G, 'Retén o traba para las varillas', 2, 'Para que no salgan solas al frenar');
  ctx.herrajeBotones(G); // un botón push en cada puerta
  ctx.herraje(G, 'Bisagra de cazoleta 35 mm (puertas de la cama)', 7, 'Tres en la puerta de la cabecera, dos en la del pie y dos en la del frente del pie, sobre el borde de abajo: la puerta baja hasta el piso al abrir. Se atornillan al listón de las bisagras (o al refuerzo de piso en el frente del pie)');
  ctx.herraje(G, 'Tirador embutido para las varillas', 2, 'Una agarradera al borde del lomo móvil: el borde de 15 mm es muy fino para un botón push');
  ctx.herraje(G, 'Cinta adhesiva de teflón (PTFE) 25 mm', 1, 'Sobre los largueros y el borde del pasarruedas, donde deslizan las varillas');
  ctx.herraje(G, 'Fresadora con fresa de radio o plantilla y lijadora', 1, `Para las esquinas R${R} de las placas y las varillas y para pulir las ranuras`);
  ctx.herraje(
    G,
    'Caladora, taladro con broca de 10 mm y plantilla de las ranuras y de las ventanas',
    1,
    `Ranuras de ${Math.round(repPie.ancho)} a ${Math.round(repCab.ancho)} mm de ancho con el fondo R${ra.radio}; las varillas salen de ellas con ${luz} mm de luz a cada lado; ventanas con esquinas R${ve.radio}`
  );
  ctx.herraje(
    G,
    'Fieltro o goma antivibración 5 mm',
    2,
    `Entre las placas y los pasarruedas (${(van.archLargo / 1000).toFixed(1)} m cada uno): sube la placa de ${van.archAltoIzq ?? van.archAlto} a ${yB} mm`
  );

  // ---- Controles ----
  if (x1 + t + ca.extension > van.ancho) ctx.aviso('La cama extendida no entra: la extensión, con el portal, supera el ancho de la van.');
  if (ca.extension > 500) ctx.aviso(`La extensión (${ca.extension} mm) es más que el recorrido de una corredera de 500 mm.`);
  const cruce = xs - (xr + ca.extension);
  if (cruce < 50) ctx.aviso(`Con la cama abierta las varillas apenas entran ${Math.round(cruce)} mm entre los dedos de la placa: tienen que quedar al menos 50 mm intercaladas.`);
  if (largoDedo < ca.extension + 50) ctx.aviso('Los dedos de la placa son más cortos que la extensión: revisar el lomo fijo y el lomo móvil.');
  if (anchoCajCab < 250 || anchoCajPie < 250) ctx.aviso('La puerta de un módulo de la cama quedó muy angosta: revisar el largo de las placas o el margen de la ventana.');
  if (altoVentana < 150) ctx.aviso('Las ventanas de los costados quedaron muy bajas: revisar la altura de la plataforma o el alto de las correderas.');
  if (repPie.fw < 35 || repCab.fw < 35) ctx.aviso('Los dedos de la placa quedaron muy finos (menos de 35 mm): revisar la cantidad de varillas.');
  if (repPie.ancho > 120 || repCab.ancho > 120) ctx.aviso('Las varillas quedaron muy anchas (más de 120 mm): revisar la cantidad de varillas.');
}
