// Detección de pantalla chica y táctil, y doble toque / doble clic sobre un mismo elemento.
import { useEffect, useRef, useState } from 'react';

// Celulares, tablets en vertical y celulares apaisados: se usa la versión con barra de navegación abajo
export const CONSULTA_MOVIL = '(max-width: 1100px), (max-height: 500px)';

// Pantalla sin mouse (el "pasá el mouse" no existe: se toca)
export const TACTIL = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: none)').matches;

export function useMedia(consulta) {
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(consulta).matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(consulta);
    const f = () => setOk(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [consulta]);
  return ok;
}

export const useEsMovil = () => useMedia(CONSULTA_MOVIL);

// Devuelve una función que dice si este toque es el segundo seguido sobre el mismo elemento.
// Sirve igual para el mouse y para el dedo (el evento dblclick no es confiable en los celulares).
// Se usa la hora en que se hizo el toque (event.timeStamp) y no la hora en que se procesa: si el celular
// estaba dibujando un cuadro, el segundo toque llega tarde pero la distancia entre los dos es la real.
export function useDobleToque(ms = 450) {
  const ultimo = useRef({ id: '', t: 0 });
  return (id, hora) => {
    const ahora = typeof hora === 'number' && hora > 0 ? hora : performance.now();
    const doble = ultimo.current.id === id && ahora - ultimo.current.t >= 0 && ahora - ultimo.current.t < ms;
    ultimo.current = { id: doble ? '' : id, t: ahora };
    return doble;
  };
}
