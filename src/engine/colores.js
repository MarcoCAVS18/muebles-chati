// Colores por rol de la madera: cada pieza se pinta según lo que hace en el mueble (frente, costado, estante...).
// La paleta es la del resto de la app, para que el 3D y el diseño hablen el mismo idioma.

export const ROLES = {
  frente: { color: '#ffc63d', nombre: 'Frentes y puertas' },
  lateral: { color: '#3db8f0', nombre: 'Costados y divisores' },
  horizontal: { color: '#2fd49a', nombre: 'Bases, estantes y tapas' },
  interior: { color: '#d6cff7', nombre: 'Fondos y cajones por dentro' },
  liston: { color: '#e3b678', nombre: 'Listones y apoyos' },
};

// Dos colores para saber qué madera ya está comprada y cuál falta
export const ESTADOS = {
  tenemos: { color: '#3ddc84', nombre: 'Ya la tenemos' },
  falta: { color: '#ffb020', nombre: 'Falta' },
};

// tenemos es un Set con los ids de las maderas que ya están. Una pieza que sale de otra cuenta como que está si la otra está.
export const estadoDe = (p, tenemos) => (tenemos.has(p.salidaDe || p.id) ? 'tenemos' : 'falta');

// Primero manda el nombre (lo que la pieza es de verdad) y recién después la dirección en la que es más fina.
export function rolDe(p) {
  if (p.tipo === 'liston' || /^Apoyo bajo la base/.test(p.nombre)) return 'liston';
  if (/^Cajón .+ - (lateral|trasera|piso del cajón|delantera)/.test(p.nombre)) return 'interior';
  if (p.mat === 'fondo' || /^(Fondo|Panel trasero|Panel central|Guía)/.test(p.nombre)) return 'interior';
  if (/^(Frente|Puerta|Zócalo|Tablero)/.test(p.nombre) || / - puerta$/.test(p.nombre)) return 'frente';
  if (/^(Costado|Portal|Divisor|División|Alacena - lateral)/.test(p.nombre)) return 'lateral';
  const fino = p.sx <= p.sy && p.sx <= p.sz ? 'x' : p.sy <= p.sz ? 'y' : 'z';
  if (fino === 'y') return 'horizontal';
  if (fino === 'x') return 'lateral';
  return 'interior';
}

// Mezcla un color con el violeta de noche para sacar el tono de los cantos
export function oscurecer(hex, k = 0.5) {
  const base = [0x1d, 0x12, 0x59];
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${c.map((v, i) => Math.round(v * (1 - k) + base[i] * k).toString(16).padStart(2, '0')).join('')}`;
}

// Colores pastel para pintar a mano una madera. El id sirve para el nombre traducido (paleta.colores.<id>)
export const PASTELES = [
  { id: 'rosa', color: '#ffb7c5' },
  { id: 'coral', color: '#ffa99c' },
  { id: 'durazno', color: '#ffcba4' },
  { id: 'manteca', color: '#fff0a6' },
  { id: 'lima', color: '#d7f2a5' },
  { id: 'menta', color: '#b4ead6' },
  { id: 'aqua', color: '#a9e5e8' },
  { id: 'cielo', color: '#b9dcff' },
  { id: 'lavanda', color: '#d2c6ff' },
  { id: 'lila', color: '#ecc8f4' },
  { id: 'arena', color: '#ecdcc2' },
  { id: 'perla', color: '#e2e2ec' },
];

// Un color guardado solo sirve si es un hex de seis cifras
export const esColorValido = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
