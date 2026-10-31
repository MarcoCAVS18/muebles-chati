// Convierte las uniones del modelo en cantidades de tornillos, escuadras y cola. Las uniones entre piezas salen de
// uniones.js (cada tornillo con su largo); acá quedan las que no son de pieza contra pieza (piso, pared, herrajes sueltos).
import { describirUnion } from './uniones.js';

const REGLAS = {
  cola: {
    espaciado: 0,
    herraje: null,
    nota: '',
  },
  cola_tornillo: {
    espaciado: 150,
    herraje: 'Tornillo aglomerado 4x40 mm',
    nota: 'Con cola PVA D3 en cada unión. Pre-taladrar con 3 mm en contrachapado.',
  },
  cajon: {
    espaciado: 120,
    herraje: 'Tornillo 3,5x30 mm (cajones)',
    nota: 'Con cola PVA. Escuadrar la caja antes de que seque.',
  },
  piso: {
    espaciado: 250,
    herraje: 'Tornillo 5x50 mm (al listón del piso)',
    nota: 'Sellar cada agujero con butilo o sellador antes de atornillar.',
  },
  pared: {
    espaciado: 400,
    herraje: 'Escuadra L 40x40 mm (pared)',
    nota: 'Cada escuadra lleva 2 tornillos autoperforantes o remaches.',
  },
};

export function resumenFijaciones(uniones, anclajes, juntas = []) {
  const totales = new Map();
  const sumar = (nombre, cantidad, nota) => {
    const prev = totales.get(nombre) || { nombre, cantidad: 0, nota };
    prev.cantidad += cantidad;
    totales.set(nombre, prev);
  };

  const porGrupo = {};
  // Uniones de pieza contra pieza: un renglón por tornillo distinto, con la nota del pretaladro
  for (const j of juntas) {
    if (!j.cantidad) continue;
    const nota = j.cola
      ? 'Con cola PVA D3 en cada unión. Pretaladrar: pasante y avellanado en la pieza de cara, guía fina en el canto.'
      : 'Sin cola, para poder levantar la placa. Pretaladrar y avellanar.';
    sumar(j.tornillo.nombre, j.cantidad, nota);
    (porGrupo[j.grupo] = porGrupo[j.grupo] || []).push({ grupo: j.grupo, tipo: 'calculada', largo: j.largoCola, detalle: describirUnion(j).texto, cantidad: j.cantidad, herrajeNombre: j.tornillo.nombre });
  }
  for (const u of uniones) {
    let cantidad;
    let nombre;
    let nota;
    if (u.tipo === 'cola') {
      // Solo cola: no suma tornillos (los lleva otra unión)
      (porGrupo[u.grupo] = porGrupo[u.grupo] || []).push({ ...u, cantidad: 0, herrajeNombre: null });
      continue;
    }
    if (u.tipo === 'directo') {
      cantidad = u.cantidad;
      nombre = u.herraje;
      nota = '';
    } else {
      const regla = REGLAS[u.tipo];
      cantidad = Math.ceil(u.largo / regla.espaciado) + 1;
      nombre = regla.herraje;
      nota = regla.nota;
    }
    sumar(nombre, cantidad, nota);
    if (u.tipo === 'pared') {
      sumar('Tornillo autoperforante 4,8x19 mm (escuadras)', cantidad * 2, 'Alternativa: remache ciego 4,8 mm');
    }
    (porGrupo[u.grupo] = porGrupo[u.grupo] || []).push({ ...u, cantidad, herrajeNombre: nombre });
  }

  // Margen del 10 % por tornillos que se pasan o se rompen
  const lista = [...totales.values()].map((f) => ({ ...f, cantidad: Math.ceil(f.cantidad * 1.1) }));
  const metrosDeCola =
    (uniones.reduce((s, u) => (['cola', 'cola_tornillo', 'cajon'].includes(u.tipo) ? s + u.largo : s), 0) +
      juntas.reduce((s, j) => (j.cola ? s + j.largoCola : s), 0)) /
    1000;
  lista.push({
    nombre: 'Cola PVA D3 (botella de 750 g)',
    cantidad: Math.max(1, Math.ceil(metrosDeCola / 25)),
    nota: `Unos ${Math.round(metrosDeCola)} m de unión encolada`,
  });
  lista.push({
    nombre: 'Butilo en cartucho / sellador para agujeros del piso',
    cantidad: 1,
    nota: 'Para sellar cada tornillo que atraviesa hacia el piso',
  });

  return { totales: lista, porGrupo, anclajes };
}
