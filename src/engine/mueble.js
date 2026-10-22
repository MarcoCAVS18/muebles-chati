// Mueble bajo modular (izquierdo y derecho) y alacena superior.
import { cajon } from './cajon.js';

// p.lado: 'izq' (pared en x = 0) o 'der' (pared en x = ancho de la van)
// p.x0: esquina mínima en x del mueble. p.z0: inicio en z.
export function mueble(ctx, p) {
  const { grupo, lado, x0, z0, profundidad: D, largo: L, alto: H, zocalo: Z, bahias } = p;
  const { t, tb } = ctx;
  const eq = ctx.cfg.equipos;
  const Dc = D - t; // profundidad de la carcasa (sin frentes)
  const hi = H - 2 * t - Z; // alto interior libre
  const X = (off, sx) => (lado === 'izq' ? x0 + off : x0 + D - off - sx);
  const par = (nombre, off, sx, y, sy, z, sz, mat = 'estructura') =>
    ctx.parte({ grupo, nombre, mat, x: X(off, sx), y, z, sx, sy, sz });
  const altoFrente = H - t - Z - 3;
  const dirCajon = lado === 'izq' ? 'x+' : 'x-';

  // Carcasa
  par('Lateral', 0, Dc, 0, H - t, z0, t);
  par('Lateral', 0, Dc, 0, H - t, z0 + L - t, t);
  par('Trasera (contra la pared)', 0, tb, 0, H - t, z0 + t, L - 2 * t, 'fondo');
  par('Base', tb, Dc - tb, Z, t, z0 + t, L - 2 * t);
  par('Zócalo frontal', Dc, t, 0, Z, z0 + t, L - 2 * t);

  const n = bahias.length;
  const suma = bahias.slice(0, -1).reduce((s, b) => s + b.largo, 0);
  const resto = L - 2 * t - (n - 1) * t - suma;
  const limites = [z0]; // inicios de cada tapa superior
  let zc = z0 + t;

  const largos = bahias.map((b, i) => (i === n - 1 ? resto : b.largo));
  largos.forEach((lb, i) => {
    if (i < n - 1) {
      par('Divisor', tb, Dc - tb, Z + t, hi, zc + lb, t);
      limites.push(zc + lb + t / 2);
    }
    zc += lb + t;
  });
  limites.push(z0 + L);

  zc = z0 + t;
  bahias.forEach((b, i) => {
    const lb = largos[i];
    const zTop = limites[i];
    const largoTop = limites[i + 1] - limites[i];
    const zFrente = zc - t / 2 + 1.5;
    const largoFrente = lb + t - 3;
    const etiqueta = `Bahía ${i + 1} (${b.tipo})`;

    if (b.tipo === 'nevera') {
      par('Tapa de heladera (abatible)', 0, D, H - t, t, zTop, largoTop);
      par('Frente fijo heladera', Dc, t, Z, altoFrente, zFrente, largoFrente);
      ctx.herraje(grupo, 'Bisagra de piano 400 mm (tapa heladera)', 1);
      ctx.herraje(grupo, 'Rejilla de ventilación 100 mm (heladera)', 2, 'Compresor necesita entrada y salida de aire');
      ctx.herraje(grupo, 'Soporte de tapa (compás o pistón de gas)', 1);
      if (lb < 420) ctx.aviso(`${grupo}: la bahía de heladera (${lb} mm) es angosta para una heladera de compresor de 40 L.`);
      ctx.equipo({
        grupo,
        nombre: 'Heladera 12 V (hueco)',
        color: '#6fa8dc',
        x: X(tb + 10, Dc - tb - 20),
        y: Z + t,
        z: zc + 5,
        sx: Dc - tb - 20,
        sy: hi - 10,
        sz: lb - 10,
        nota: 'Modelo aún sin elegir. Debe ser de apertura superior y poco profunda.',
      });
    } else if (b.tipo === 'cajones') {
      par('Tapa', 0, D, H - t, t, zTop, largoTop);
      const nC = b.n || 2;
      const hs = hi / nC;
      const hf = (altoFrente - (nC - 1) * 3) / nC;
      const Dd = Math.floor((Dc - tb - 20) / 50) * 50;
      const offAtras = Dc - 10 - Dd;
      for (let k = 0; k < nC; k++) {
        par(`Frente de cajón ${k + 1}`, Dc, t, Z + k * (hf + 3), hf, zFrente, largoFrente);
        cajon(ctx, {
          grupo,
          nombre: `Cajón ${k + 1} (${etiqueta})`,
          x: X(offAtras, Dd),
          y: Z + t + k * hs + 5,
          z: zc + 13,
          ancho: lb - 26,
          alto: hs - 15,
          fondo: Dd,
          dir: dirCajon,
        });
        ctx.herraje(grupo, 'Tirador', 1, `Cajón ${k + 1}`);
      }
    } else if (b.tipo === 'electrico') {
      par('Tapa', 0, D, H - t, t, zTop, largoTop);
      par('Puerta eléctrica', Dc, t, Z, altoFrente, zFrente, largoFrente);
      ctx.herraje(grupo, 'Bisagra cazoleta 35 mm', 2, 'Puerta eléctrica');
      ctx.herraje(grupo, 'Tirador', 1, 'Puerta eléctrica');
      const bat = eq.bateria;
      const dc = eq.dcdc;
      const fu = eq.fusibles;
      const yEstante = Z + t + bat.y + 25;
      if (lb < bat.z + 20) ctx.aviso(`${grupo}: la bahía eléctrica (${lb} mm) no alcanza para la batería (${bat.z} mm de ancho).`);
      if (Dc - tb < bat.x + 10) ctx.aviso(`${grupo}: la profundidad interior no alcanza para la batería (${bat.x} mm).`);
      par('Estante eléctrico', tb, Dc - tb, yEstante, t, zc, lb);
      ctx.equipo({
        grupo,
        nombre: 'Batería LiFePO4 100 Ah',
        color: '#2e7d32',
        x: X(tb + 10, bat.x),
        y: Z + t,
        z: zc + (lb - bat.z) / 2,
        sx: bat.x,
        sy: bat.y,
        sz: bat.z,
        nota: 'Ir fijada con correa o tope de listón. Cerca del DC-DC para cables cortos.',
      });
      ctx.equipo({
        grupo,
        nombre: 'Cargador DC-DC 40 A',
        color: '#e69138',
        x: X(tb + 10, dc.x),
        y: yEstante + t,
        z: zc + 5,
        sx: dc.x,
        sy: dc.y,
        sz: Math.min(dc.z, lb - 10),
        nota: 'Con espacio alrededor para disipar calor.',
      });
      ctx.equipo({
        grupo,
        nombre: 'Caja de fusibles',
        color: '#cc0000',
        x: X(tb + 10 + dc.x + 10, fu.x),
        y: yEstante + t,
        z: zc + 5,
        sx: fu.x,
        sy: fu.y,
        sz: Math.min(fu.z, lb - 10),
        nota: 'Distribución de los circuitos de 12 V.',
      });
      ctx.herraje(grupo, 'Pasacables / prensaestopas (paso por mamparo)', 2);
    } else if (b.tipo === 'pileta') {
      par('Encimera con corte de pileta', 0, D, H - t, t, zTop, largoTop);
      par('Puerta bajo pileta', Dc, t, Z, altoFrente, zFrente, largoFrente);
      ctx.herraje(grupo, 'Bisagra cazoleta 35 mm', 2, 'Puerta bajo pileta');
      ctx.herraje(grupo, 'Tirador', 1, 'Puerta bajo pileta');
      ctx.herraje(grupo, 'Pileta de acero inoxidable (zinc)', 1, `Corte aprox. ${eq.pileta.x} x ${eq.pileta.z} mm: usar la plantilla del fabricante`);
      ctx.herraje(grupo, 'Grifo con cuello', 1);
      ctx.herraje(grupo, 'Sifón y manguera de desagüe', 1);
      if (lb < eq.pileta.z + 40) ctx.aviso(`${grupo}: la bahía (${lb} mm) queda justa para la pileta (${eq.pileta.z} mm).`);
      ctx.equipo({
        grupo,
        nombre: 'Pileta (zinc)',
        color: '#b0bec5',
        x: X(30, eq.pileta.x),
        y: H - eq.pileta.y,
        z: zc + (lb - eq.pileta.z) / 2,
        sx: eq.pileta.x,
        sy: eq.pileta.y,
        sz: eq.pileta.z,
        nota: 'Cortar la encimera con la plantilla que trae la pileta. Sellar el canto del corte.',
      });
      ctx.equipo({
        grupo,
        nombre: 'Tanque de agua 20 L',
        color: '#4fc3f7',
        x: X(tb + 20, eq.tanque.x),
        y: Z + t,
        z: zc + 10,
        sx: eq.tanque.x,
        sy: eq.tanque.y,
        sz: Math.min(eq.tanque.z, lb - 20),
        nota: 'Con bomba 12 V al lado. Dejar acceso para vaciarlo.',
      });
    } else {
      par('Tapa', 0, D, H - t, t, zTop, largoTop);
      par('Puerta', Dc, t, Z, altoFrente, zFrente, largoFrente);
      ctx.herraje(grupo, 'Bisagra cazoleta 35 mm', 2, 'Puerta');
      ctx.herraje(grupo, 'Tirador', 1, 'Puerta');
    }
    zc += lb + t;
  });

  // Uniones y anclajes de la carcasa
  ctx.unir(grupo, 'cola_tornillo', 2 * Dc, 'Laterales con base');
  ctx.unir(grupo, 'cola_tornillo', 2 * D, 'Laterales con tapas');
  ctx.unir(grupo, 'cola_tornillo', (n - 1) * 2 * Dc, 'Divisores con base y tapas');
  ctx.unir(grupo, 'cola_tornillo', 2 * H, 'Trasera con laterales');
  ctx.unir(grupo, 'cola_tornillo', L, 'Zócalo frontal');
  ctx.unir(grupo, 'piso', L + 2 * Dc, 'Base del mueble contra los listones del piso');
  ctx.unir(grupo, 'pared', L, 'Trasera contra la pared de la van');
  ctx.anclaje(
    grupo,
    'Base - piso',
    'Atornillar la base y los laterales a los listones del piso (5x50 mm), después de sellar los agujeros con butilo.',
    Math.ceil((L + 2 * Dc) / 250) + 1,
    'Que cada tornillo caiga sobre un listón, no sobre el aislante'
  );
  ctx.anclaje(
    grupo,
    'Trasera - pared',
    'Escuadras L 40x40 con tornillo autoperforante o remache a la chapa, en las costillas de la pared.',
    Math.ceil(L / 400) + 1,
    'Confirmar que no haya cables por detrás antes de perforar'
  );
}

// Alacena superior con puerta abatible hacia arriba.
export function alacena(ctx, p) {
  const { grupo, lado, x0, z0, profundidad: D, largo: L, y0, alto: A } = p;
  const { t, tb } = ctx;
  if (A < 120) {
    ctx.aviso(`${grupo}: no hay altura suficiente para la alacena (${Math.round(A)} mm).`);
    return;
  }
  const Dc = D - t;
  const X = (off, sx) => (lado === 'izq' ? x0 + off : x0 + D - off - sx);
  const par = (nombre, off, sx, y, sy, z, sz, mat = 'estructura') =>
    ctx.parte({ grupo, nombre: `Alacena - ${nombre}`, mat, x: X(off, sx), y, z, sx, sy, sz });

  par('Lateral', 0, Dc, y0, A, z0, t);
  par('Lateral', 0, Dc, y0, A, z0 + L - t, t);
  par('Tapa superior', 0, Dc, y0 + A - t, t, z0 + t, L - 2 * t);
  par('Piso', 0, Dc, y0, t, z0 + t, L - 2 * t);
  par('Trasera', 0, tb, y0 + t, A - 2 * t, z0 + t, L - 2 * t, 'fondo');
  par('Puerta (abre hacia arriba)', Dc, t, y0, A, z0, L);

  ctx.herraje(grupo, 'Bisagra de piano 500 mm (puerta alacena)', 1);
  ctx.herraje(grupo, 'Pistón de gas 60 N (puerta alacena)', 2);
  ctx.herraje(grupo, 'Tirador', 1, 'Puerta alacena');
  ctx.unir(grupo, 'cola_tornillo', 4 * Dc + 2 * A, 'Alacena: laterales, tapa y piso');
  ctx.unir(grupo, 'pared', L, 'Alacena contra la pared');
  ctx.anclaje(
    grupo,
    'Alacena - pared',
    'Escuadras L 40x40 al costillar de la pared y tornillos hacia el mueble bajo si queda alineada.',
    Math.ceil(L / 300) + 1,
    'Es una pieza liviana, pero lleva golpes de ruta: no escatimar fijaciones'
  );
}
