// Madera que ya está comprada y cortada: se muestra de otro color en el 3D (botón «Lo que tenemos y lo que falta»).
// Es la lista inicial; se puede cambiar desde la tarjeta de cada pieza (casilla «Ya la tenemos») y se guarda en la nube.
// Las piezas que salen de otra (las varillas móviles salen de las ranuras de su placa) cuentan como que ya están si la
// pieza de la que salen ya está.
// Sube cada vez que se agregan maderas a la lista inicial: un guardado de una versión anterior las recibe una sola vez.
export const STOCK_VERSION = 3;

// Sube cuando cambia la numeración de las piezas (los ids que guarda el proyecto, como los colores pastel, dejan de coincidir).
// 2: las tres tapas del mueble trasero pasan a ser una sola (TRA-14) y la madera de 5 mm del pasarruedas es CAM-33.
export const IDS_VERSION = 2;
// Pasa un id guardado con la numeración anterior a la actual; devuelve null si esa pieza ya no existe.
export function idMigrado(id) {
  const m = /^(TRA|CAM)-(\d+)$/.exec(id);
  if (!m) return id;
  const n = Number(m[2]);
  const con = (pref, k) => `${pref}-${String(k).padStart(2, '0')}`;
  if (m[1] === 'TRA') return n === 15 || n === 16 ? null : n > 16 ? con('TRA', n - 2) : id;
  return n >= 33 ? con('CAM', n + 1) : id;
}
export const TENEMOS_INICIAL = [
  'CAM-01', 'CAM-02', 'CAM-03', 'CAM-04', 'CAM-05', 'CAM-06', 'CAM-07',
  // Listones de 30x30 (14) y de 45x45 (4): todos cortados
  'CAM-11', 'CAM-13', 'CAM-15', 'CAM-16', 'CAM-17', 'CAM-18', 'CAM-19',
  'CAM-20', 'CAM-21', 'CAM-22', 'CAM-23',
  'CAM-24', 'CAM-25', 'CAM-26', 'CAM-27', 'CAM-28', 'CAM-29', 'CAM-30',
  'CAM-31', 'CAM-32',
  // Cama terminada: las tres puertas ya están (las varillas, CAM-08 y 09, cuentan por salir de las placas). Falta solo la madera
  // de 5 mm sobre el pasarruedas izquierdo (CAM-33), que es nueva.
  'CAM-10', 'CAM-12', 'CAM-14',
];
