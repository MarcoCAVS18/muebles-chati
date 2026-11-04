// Barra del visor 3D: vista actual, herramientas en píldora oscura (modos, cotas, colores, opciones) y la acción principal.
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nombreGrupo } from '../i18n/util.js';
import { Icono } from './Icono.jsx';
import { ROLES, ESTADOS } from '../engine/colores.js';
import { colorTornillo, nombreCortoTornillo } from '../engine/uniones.js';

const MODOS = [
  { clave: 'armado', icono: 'cubo' },
  { clave: 'abierto', icono: 'puerta' },
  { clave: 'explotado', icono: 'cubos' },
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
  const { t } = useTranslation();
  return (
    <ul className="leyenda" aria-label={t('barra3d.significadoColores')}>
      {Object.entries(ROLES).map(([k, r]) => (
        <li key={k}>
          <i style={{ background: r.color }} />
          {t(`roles.${k}`, { defaultValue: r.nombre })}
        </li>
      ))}
    </ul>
  );
}

// Leyenda de los dos colores de la madera: la que ya tenemos y la que falta (con cuántas piezas son)
export function LeyendaEstado({ cuentas }) {
  const { t } = useTranslation();
  return (
    <ul className="leyenda" aria-label={t('barra3d.significadoColores')}>
      {Object.entries(ESTADOS).map(([k, e]) => (
        <li key={k}>
          <i style={{ background: e.color }} />
          {t(`estados.${k}`, { defaultValue: e.nombre })}
          {cuentas ? ` (${cuentas[k]})` : ''}
        </li>
      ))}
    </ul>
  );
}

// Leyenda de los tornillos del 3D: un color por tipo, con cuántos hay
export function LeyendaTornillos({ cuentas }) {
  const { t } = useTranslation();
  return (
    <ul className="leyenda" aria-label={t('barra3d.tiposTornillo')}>
      {cuentas.map((c) => (
        <li key={`${c.d}|${c.largo}`}>
          <i style={{ background: colorTornillo(c.largo) }} />
          {nombreCortoTornillo(c.d, c.largo)} ({c.cantidad})
        </li>
      ))}
    </ul>
  );
}

export default function Barra3D({
  vistas, vista, cambiarVista, modo, elegirModo, cotas, setCotas, colores, setColores, estado, setEstado, cuentasEstado,
  capas, grupos, visibles, setVisibles, camaTexto, camaAbierta, setCamaAbierta, abierto, setAbierto, explosion, setExplosion,
  derecha,
}) {
  const { t } = useTranslation();
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
      <label className="pill pill-vista" title={t('barra3d.cambiarVista')}>
        <Icono n="camara" />
        <select value={vista.clave} onChange={(e) => cambiarVista(e.target.value)} aria-label={t('barra3d.vista')}>
          {Object.entries(vistas).map(([k, v]) => (
            <option key={k} value={k}>
              {t(`vistas.${k}`, { defaultValue: v.nombre })}
            </option>
          ))}
        </select>
        <Icono n="abajo" />
      </label>

      <div className="pill pill-barra" role="toolbar" aria-label={t('barra3d.herramientas')}>
        {MODOS.map((m) => (
          <Boton key={m.clave} icono={m.icono} nombre={t(`barra3d.modos.${m.clave}`)} activo={modo === m.clave} onClick={() => elegirModo(m.clave)} />
        ))}
        <span className="sep" aria-hidden="true" />
        <Boton icono="cotas" nombre={t('barra3d.cotas')} activo={cotas} onClick={() => setCotas(!cotas)} />
        <Boton icono="paleta" nombre={t('barra3d.coloresRol')} activo={colores && !estado} onClick={() => { setEstado(false); setColores(!colores || estado); }} />
        <Boton icono="check" nombre={t('barra3d.tenemosFalta')} activo={estado} onClick={() => setEstado(!estado)} />
        <span className="sep" aria-hidden="true" />
        <Boton icono="ajustes" nombre={t('barra3d.opciones')} activo={abiertaOp} expandido={abiertaOp} onClick={() => setAbiertaOp(!abiertaOp)} />
      </div>

      <div className="hud-derecha">{derecha}</div>

      {abiertaOp && (
        <div className="pop-opciones" role="dialog" aria-label={t('barra3d.opciones3d')}>
          <h4>{t('barra3d.queMostrar')}</h4>
          <div className="chips">
            {grupos.map((g) => (
              <Chip key={g} activo={visibles[g]} onClick={() => setVisibles({ ...visibles, [g]: !visibles[g] })}>
                {nombreGrupo(t, g)}
              </Chip>
            ))}
            {capas.map((c) => (
              <Chip key={c.etiqueta} activo={c.valor} onClick={() => c.poner(!c.valor)}>
                {c.etiqueta}
              </Chip>
            ))}
          </div>
          <h4>{t('barra3d.movimiento')}</h4>
          <label className="barrita">
            <span>{t('barra3d.cajonesPuertas')}</span>
            <input type="range" min="0" max="1" step="0.05" value={abierto} onChange={(e) => setAbierto(parseFloat(e.target.value))} />
          </label>
          <label className="barrita">
            <span>{camaTexto}</span>
            <input type="range" min="0" max="1" step="0.05" value={camaAbierta} onChange={(e) => setCamaAbierta(parseFloat(e.target.value))} />
          </label>
          <label className="barrita">
            <span>{t('barra3d.explotada')}</span>
            <input type="range" min="0" max="1" step="0.05" value={explosion} onChange={(e) => setExplosion(parseFloat(e.target.value))} />
          </label>
          {(colores || estado) && (
            <>
              <h4>{t('barra3d.colores')}</h4>
              {estado ? <LeyendaEstado cuentas={cuentasEstado} /> : <Leyenda />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
