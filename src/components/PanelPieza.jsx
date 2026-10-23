// Tarjeta del modo pieza: nombre, medidas, cortes y botones para pasar a la pieza anterior o siguiente.
import React from 'react';
import { describirPieza, COLOR_CORTE, fmt } from '../engine/enfoque.js';
import { TACTIL } from '../util/pantalla.js';

const LEYENDA = [
  ['medida', 'Medidas'],
  ['recto', 'Corte recto a 90°'],
  ['redondo', 'Esquina redondeada'],
  ['arco', 'Arco o recorte'],
];

export default function PanelPieza({ partes, id, cfg, invertir, setInvertir, verContexto, setVerContexto, ir, salir }) {
  const i = partes.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const p = partes[i];
  const d = describirPieza(p, cfg);
  const ant = partes[(i - 1 + partes.length) % partes.length];
  const sig = partes[(i + 1) % partes.length];
  return (
    <div className="enfoque">
      <div className="enfoque-fila">
        <div className="enfoque-titulo" key={p.id}>
          <span className="enfoque-id">{p.id}</span>
          <b>{p.nombre}</b>
          <span className="enfoque-grupo">{p.grupo}</span>
        </div>
        <button className="enfoque-salir" onClick={salir} title="Volver al mueble completo">
          {TACTIL ? 'Salir' : 'Salir (Esc)'}
        </button>
      </div>

      <div className="enfoque-cuerpo" key={`c-${p.id}`}>
        <div className="enfoque-medidas">
          <div>
            <span>Largo</span>
            <b>{fmt(d.largo)}</b>
          </div>
          <div>
            <span>Ancho</span>
            <b>{fmt(d.ancho)}</b>
          </div>
          <div>
            <span>Espesor</span>
            <b>{fmt(d.espesor)}</b>
          </div>
          <div className="enfoque-material">
            <span>Material</span>
            <b>{d.material}</b>
          </div>
        </div>
        <ul className="enfoque-cortes">
          {d.lineas.map((l, k) => (
            <li key={k}>
              <i style={{ background: COLOR_CORTE[l.tipo] }} />
              {l.texto}
            </li>
          ))}
        </ul>
      </div>

      <div className="enfoque-fila enfoque-nav">
        <button onClick={() => ir(-1)} title="Pieza anterior (flecha izquierda)">
          ◀ {ant.id}
        </button>
        <span className="enfoque-cuenta">
          {i + 1} de {partes.length}
        </span>
        <button onClick={() => ir(1)} title="Pieza siguiente (flecha derecha)">
          {sig.id} ▶
        </button>
        <button className="enfoque-sec" onClick={() => setInvertir(!invertir)} title="Ver la otra cara de la pieza">
          Dar vuelta
        </button>
        <label className="enfoque-contexto">
          <input type="checkbox" checked={verContexto} onChange={(e) => setVerContexto(e.target.checked)} />
          Ver el mueble de fondo
        </label>
      </div>

      <div className="enfoque-leyenda">
        {LEYENDA.map(([k, t]) => (
          <span key={k}>
            <i style={{ background: COLOR_CORTE[k] }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
