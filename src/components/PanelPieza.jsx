// Tarjeta del modo pieza: nombre, medidas, cortes y botones para pasar a la pieza anterior o siguiente.
import React from 'react';
import { describirPieza, COLOR_CORTE, fmt } from '../engine/enfoque.js';
import { TACTIL } from '../util/pantalla.js';
import { describirUnion } from '../engine/uniones.js';
import { COLOR_ATRAVIESA, COLOR_RECIBE } from './Enfoque.jsx';

const LEYENDA = [
  ['medida', 'Medidas'],
  ['recto', 'Corte recto a 90°'],
  ['redondo', 'Esquina redondeada'],
  ['arco', 'Arco, recorte o calado'],
];

const fmtN = (n) => String(n).replace('.', ',');

export default function PanelPieza({ partes, uniones, id, cfg, invertir, setInvertir, verContexto, setVerContexto, tenemos, alternarTenemos, ir, salir }) {
  const i = partes.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const p = partes[i];
  const d = describirPieza(p, cfg);
  const ant = partes[(i - 1 + partes.length) % partes.length];
  const sig = partes[(i + 1) % partes.length];
  const uni = uniones ? uniones[p.id] : null;
  const nombreDe = (otra) => {
    const q = partes.find((x) => x.id === otra);
    return q ? q.nombre.replace(/\s*\(.*$/, '') : '';
  };
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

      {uni && (uni.juntas.length > 0 || uni.nota) && (
        <div className="enfoque-uniones" key={`u-${p.id}`}>
          <h5>Cómo se une</h5>
          {uni.nota && <p>{uni.nota}</p>}
          <ul>
            {uni.juntas.map(({ junta: j, papel, otra }) => {
              const t = describirUnion(j);
              const pret = j.pretaladro;
              const detalle =
                !j.cantidad
                  ? 'No lleva tornillo: el contacto es corto o el canto es muy fino. Se pega y se aprieta con sargento.'
                  : papel === 'cara'
                    ? `Se atornilla desde ${t.lado} de esta pieza. Pretaladro Ø${fmtN(pret.pasante)} mm pasante con avellanado.`
                    : `Recibe los tornillos de ${j.cara}. Pretaladro guía Ø${fmtN(pret.guia)} mm, ${fmt(pret.prof)} mm de profundidad.`;
              return (
                <li key={`${j.id}${papel}`}>
                  <i style={{ background: j.cantidad ? (papel === 'cara' ? COLOR_ATRAVIESA : COLOR_RECIBE) : '#b9aaff' }} />
                  <div>
                    <b>{otra}</b> {nombreDe(otra)}: {t.texto}
                    <span>
                      {detalle}
                      {j.desmontable ? ' Sin cola: la placa se puede levantar.' : ''}
                      {j.tapadaPor && papel === 'cara' ? ` Atornillá antes de poner ${j.tapadaPor}: después queda tapada.` : ''}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
        <label className="enfoque-contexto" title={p.salidaDe ? `Sale de ${p.salidaDe}: cuenta como que la tenemos si tenemos esa` : 'Marcar si esta madera ya está comprada y cortada'}>
          <input type="checkbox" checked={tenemos.has(p.salidaDe || p.id)} disabled={!!p.salidaDe} onChange={() => alternarTenemos(p.id)} />
          Ya la tenemos
        </label>
      </div>

      <div className="enfoque-leyenda">
        {LEYENDA.map(([k, t]) => (
          <span key={k}>
            <i style={{ background: COLOR_CORTE[k] }} />
            {t}
          </span>
        ))}
        {uni && uni.juntas.some((x) => x.junta.cantidad > 0) && (
          <>
            <span>
              <i style={{ background: COLOR_ATRAVIESA }} />
              Tornillo que atraviesa la pieza
            </span>
            <span>
              <i style={{ background: COLOR_RECIBE }} />
              Pretaladro en el canto
            </span>
          </>
        )}
      </div>
    </div>
  );
}
