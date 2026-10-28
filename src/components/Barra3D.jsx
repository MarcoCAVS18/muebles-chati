// Barra del visor 3D: vista actual, herramientas en píldora oscura (modos, cotas, colores, opciones) y la acción principal.
import React, { useEffect, useRef, useState } from 'react';
import { Icono } from './Icono.jsx';
import { ROLES } from '../engine/colores.js';

const MODOS = [
  { clave: 'armado', icono: 'cubo', nombre: 'Armado' },
  { clave: 'abierto', icono: 'puerta', nombre: 'Abierto' },
  { clave: 'explotado', icono: 'cubos', nombre: 'Explotado' },
];

function Boton({ icono, nombre, activo, onClick, expandido }) {
  return (
    <button type="button" className={`pb${activo ? ' on' : ''}`} onClick={onClick} aria-label={nombre} aria-pressed={expandido === undefined ? activo : undefined} aria-expanded={expandido} title={nombre}>
      <Icono n={icono} />
    </button>
  );
}

function Chip({ activo, onClick, children }) {
  return (
    <button type="button" className={`chip${activo ? ' on' : ''}`} aria-pressed={activo} onClick={onClick}>
      {children}
    </button>
  );
}

// Leyenda de los colores por rol
export function Leyenda() {
  return (
    <ul className="leyenda" aria-label="Qué significa cada color">
      {Object.values(ROLES).map((r) => (
        <li key={r.nombre}>
          <i style={{ background: r.color }} />
          {r.nombre}
        </li>
      ))}
    </ul>
  );
}

export default function Barra3D({
  vistas, vista, cambiarVista, modo, elegirModo, cotas, setCotas, colores, setColores,
  capas, grupos, visibles, setVisibles, camaTexto, camaAbierta, setCamaAbierta, abierto, setAbierto, explosion, setExplosion,
  derecha,
}) {
  const [abiertaOp, setAbiertaOp] = useState(false);
  const raiz = useRef();

  // El panel de opciones se cierra al tocar cualquier otra cosa
  useEffect(() => {
    if (!abiertaOp) return undefined;
    const fuera = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAbiertaOp(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abiertaOp]);

  return (
    <div className="hud-arriba" ref={raiz}>
      <label className="pill pill-vista" title="Cambiar la vista">
        <Icono n="camara" />
        <select value={vista.clave} onChange={(e) => cambiarVista(e.target.value)} aria-label="Vista">
          {Object.entries(vistas).map(([k, v]) => (
            <option key={k} value={k}>
              {v.nombre}
            </option>
          ))}
        </select>
        <Icono n="abajo" />
      </label>

      <div className="pill pill-barra" role="toolbar" aria-label="Herramientas del 3D">
        {MODOS.map((m) => (
          <Boton key={m.clave} icono={m.icono} nombre={m.nombre} activo={modo === m.clave} onClick={() => elegirModo(m.clave)} />
        ))}
        <span className="sep" aria-hidden="true" />
        <Boton icono="cotas" nombre="Cotas" activo={cotas} onClick={() => setCotas(!cotas)} />
        <Boton icono="paleta" nombre="Colores por rol" activo={colores} onClick={() => setColores(!colores)} />
        <span className="sep" aria-hidden="true" />
        <Boton icono="ajustes" nombre="Opciones" activo={abiertaOp} expandido={abiertaOp} onClick={() => setAbiertaOp(!abiertaOp)} />
      </div>

      <div className="hud-derecha">{derecha}</div>

      {abiertaOp && (
        <div className="pop-opciones" role="dialog" aria-label="Opciones del 3D">
          <h4>Qué mostrar</h4>
          <div className="chips">
            {grupos.map((g) => (
              <Chip key={g} activo={visibles[g]} onClick={() => setVisibles({ ...visibles, [g]: !visibles[g] })}>
                {g}
              </Chip>
            ))}
            {capas.map((c) => (
              <Chip key={c.etiqueta} activo={c.valor} onClick={() => c.poner(!c.valor)}>
                {c.etiqueta}
              </Chip>
            ))}
          </div>
          <h4>Movimiento</h4>
          <label className="barrita">
            <span>Cajones y puertas</span>
            <input type="range" min="0" max="1" step="0.05" value={abierto} onChange={(e) => setAbierto(parseFloat(e.target.value))} />
          </label>
          <label className="barrita">
            <span>{camaTexto}</span>
            <input type="range" min="0" max="1" step="0.05" value={camaAbierta} onChange={(e) => setCamaAbierta(parseFloat(e.target.value))} />
          </label>
          <label className="barrita">
            <span>Vista explotada</span>
            <input type="range" min="0" max="1" step="0.05" value={explosion} onChange={(e) => setExplosion(parseFloat(e.target.value))} />
          </label>
          {colores && (
            <>
              <h4>Colores</h4>
              <Leyenda />
            </>
          )}
        </div>
      )}
    </div>
  );
}
