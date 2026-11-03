// Madera que ya está comprada y cortada: se muestra de otro color en el 3D (botón «Lo que tenemos y lo que falta»).
// Es la lista inicial; se puede cambiar desde la tarjeta de cada pieza (casilla «Ya la tenemos») y se guarda en la nube.
// Las piezas que salen de otra (las varillas móviles salen de las ranuras de su placa) cuentan como que ya están si la
// pieza de la que salen ya está.
// Sube cada vez que se agregan maderas a la lista inicial: un guardado de una versión anterior las recibe una sola vez.
export const STOCK_VERSION = 2;
export const TENEMOS_INICIAL = [
  'CAM-01', 'CAM-02', 'CAM-03', 'CAM-04', 'CAM-05', 'CAM-06', 'CAM-07',
  // Listones de 30x30 (14) y de 45x45 (4): todos cortados
  'CAM-11', 'CAM-13', 'CAM-15', 'CAM-16', 'CAM-17', 'CAM-18', 'CAM-19',
  'CAM-20', 'CAM-21', 'CAM-22', 'CAM-23',
  'CAM-24', 'CAM-25', 'CAM-26', 'CAM-27', 'CAM-28', 'CAM-29', 'CAM-30',
  'CAM-31', 'CAM-32',
];
