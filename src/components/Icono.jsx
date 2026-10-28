// Íconos de línea de la barra de navegación del celular.
import React from 'react';

const TRAZOS = {
  cubo: ['M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z', 'M3 7.5l9 4.5 9-4.5', 'M12 12v9'],
  regla: ['M3 17 17 3l4 4L7 21l-4-4Z', 'M7 13l2 2', 'M10 10l2 2', 'M13 7l2 2'],
  lista: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  hoja: ['M3 4h18v16H3Z', 'M3 12h18', 'M12 4v8', 'M8 12v8'],
  llave: ['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z'],
  rayo: ['M13 2 4 14h7l-1 8 9-12h-7l1-8Z'],
  carrito: ['M3 4h2l2.4 11h10.2l2-8H6', 'M9 20h.01', 'M17 20h.01'],
  libro: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z', 'M4 19a2 2 0 0 0 2 2h13', 'M9 8h6', 'M9 12h4'],
  izq: ['M15 5l-7 7 7 7'],
  der: ['M9 5l7 7-7 7'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  aviso: ['M12 4 3 20h18L12 4Z', 'M12 10v4', 'M12 17h.01'],
  abajo: ['M6 9l6 6 6-6'],
  arriba: ['M6 15l6-6 6 6'],
  cerrar: ['M6 6l12 12', 'M18 6 6 18'],
  bandera: ['M6 21V4', 'M6 4h11l-2.5 4L17 12H6'],
  martillo: ['M13 4l7 7-3 3-7-7 3-3Z', 'M10 9 3.5 15.5a2 2 0 0 0 2.8 2.8L12.8 11.8'],
  puerta: ['M4 21h16', 'M6 21V4.5A1.5 1.5 0 0 1 7.5 3h8A1.5 1.5 0 0 1 17 4.5V21', 'M17 6.5l3.2 1.3v12', 'M13.5 12.5h.01'],
  cubos: ['M3.5 3.5h7v7h-7Z', 'M13.5 3.5h7v7h-7Z', 'M8.5 13.5h7v7h-7Z'],
  paleta: ['M12 3a9 9 0 1 0 0 18c1.3 0 1.9-.8 1.9-1.7 0-1.3-1.1-1.5-1.1-2.7 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z', 'M7.5 11.2h.01', 'M10 7.6h.01', 'M14.5 7.6h.01'],
  cotas: ['M3 7v10', 'M21 7v10', 'M3 12h18', 'M6.5 9 3 12l3.5 3', 'M17.5 9 21 12l-3.5 3'],
  ajustes: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'M15 4.5v5', 'M9 14.5v5'],
  camara: ['M4 8h3l1.5-2h7L17 8h3v11H4Z', 'M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z'],
};

export function Icono({ n }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(TRAZOS[n] || []).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
