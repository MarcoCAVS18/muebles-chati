// Perfil de la separación metálica y de los asientos detrás del mueble trasero, medido por Marco el 18/11 con una tanza
// vertical que marca el plano del fondo plano actual del mueble (z = van.largo). Es igual en todo el ancho.
//
// Cada par es [altura desde el piso terminado (mm), profundidad libre hasta la tanza (mm)]: cuánto espacio hay entre el
// fondo plano y lo que hay de verdad a esa altura. De 0 a 255 mm es la parte metálica; en 300 mm el valor es el hueco
// que queda entre la separación y el asiento (no se diseña); de ahí para arriba son los asientos, que tocan la tanza
// a 817 mm y se alejan de nuevo más arriba (esa zona queda por encima del mueble, que mide 850 mm).
export const PERFIL_MAMPARO = [
  [0, 216],
  [100, 202],
  [200, 122.5],
  [255, 108],
  [300, 270],
  [400, 132.5],
  [500, 87.5],
  [600, 58],
  [700, 27],
  [800, 3],
  [817, 0],
  [900, 22.5],
  [1000, 38.5],
];
