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
