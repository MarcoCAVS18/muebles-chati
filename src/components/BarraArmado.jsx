// Barra del armado animado: qué está pasando, play y pausa, pieza anterior y siguiente, velocidad y cámara automática.
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icono } from './Icono.jsx';
import { describirUnion } from '../engine/uniones.js';
import { VELOCIDADES, useReproductor } from '../util/reproductor.js';

export default function BarraArmado({ rep, data }) {
  const { t } = useTranslation();
  const est = useReproductor(rep);
  const seq = est.seq;
  const partes = useMemo(() => new Map(data.partes.map((p) => [p.id, p])), [data]);
  const juntas = useMemo(() => new Map(data.juntas.map((j) => [j.id, j])), [data]);
  // La línea de tiempo se mueve sola mientras se reproduce (un par de veces por segundo alcanza)
  const [, tic] = useState(0);
  useEffect(() => {
    if (!est.playing) return undefined;
    const id = setInterval(() => tic((n) => n + 1), 120);
    return () => clearInterval(id);
  }, [est.playing]);
  if (!est.activo || !seq) return null;

  const ev = seq.eventos[est.indice];
  const nombre = (id) => (partes.get(id) ? partes.get(id).nombre.replace(/\s*\(.*$/, '') : '');
  const piezasHechas = seq.eventos.slice(0, est.indice + 1).filter((e) => e.tipo === 'pieza').length;
  const paso = seq.pasos.find((p) => p.paso === ev.paso);
  const numeroPaso = paso ? paso.paso + 1 : 0;

  let texto = '';
  if (ev.tipo === 'pieza') {
    const base = { id: ev.id, nombre: nombre(ev.id) };
    if (ev.modo === 'flota') texto = t('armadoAnim.flota', base);
    else if (ev.con.length) texto = t('armadoAnim.llega', { ...base, con: ev.con.map((c) => `${c} ${nombre(c)}`).slice(0, 2).join(', ') });
    else texto = t('armadoAnim.llegaSola', base);
  } else {
    const j = juntas.get(ev.juntas[0]);
    if (j) {
      const d = describirUnion(j, t);
      texto = t('armadoAnim.tornillos', { texto: d.texto, cara: j.cara, canto: j.canto, lado: d.lado });
      if (ev.juntas.length > 1) texto += ` ${t('armadoAnim.masUniones', { count: ev.juntas.length - 1 })}`;
    }
  }

  const [a, b] = est.rango;
  const iPaso = seq.pasos.findIndex((p) => p.id === est.pasoId);
  const siguiente = est.fin && est.pasoId && seq.pasos[iPaso + 1] ? seq.pasos[iPaso + 1].id : null;
  return (
    <div className="arm-barra" role="region" aria-label={t('armadoAnim.region')}>
      <div className="arm-texto">
        <span className="arm-chip">{t('armadoAnim.paso', { n: numeroPaso, total: seq.totalPasos })}</span>
        <span className="arm-chip claro">{t('armadoAnim.pieza', { n: piezasHechas, total: seq.piezas })}</span>
        <p>{est.fin ? t(est.pasoId ? 'armadoAnim.finPaso' : 'armadoAnim.finMueble') : texto.charAt(0).toUpperCase() + texto.slice(1)}</p>
      </div>

      <input
        className="arm-tiempo"
        type="range"
        min={a}
        max={b}
        step="0.05"
        value={Math.min(b, Math.max(a, rep.t))}
        onChange={(e) => rep.irA(Number(e.target.value))}
        aria-label={t('armadoAnim.linea')}
      />

      <div className="arm-controles">
        <div className="arm-grupo">
          {!est.pasoId && (
            <button className="arm-boton" onClick={() => rep.anteriorPaso()} aria-label={t('armadoAnim.pasoAnterior')} title={t('armadoAnim.pasoAnterior')}>
              <Icono n="pasoIzq" />
            </button>
          )}
          <button className="arm-boton" onClick={() => rep.anteriorPieza()} aria-label={t('armadoAnim.piezaAnterior')} title={t('armadoAnim.piezaAnterior')}>
            <Icono n="saltoIzq" />
          </button>
          <button className="arm-boton principal" onClick={() => rep.alternar()} aria-label={est.playing ? t('armadoAnim.pausa') : t('armadoAnim.jugar')}>
            <Icono n={est.playing ? 'pausa' : est.fin ? 'repetir' : 'play'} />
          </button>
          <button className="arm-boton" onClick={() => rep.siguientePieza()} aria-label={t('armadoAnim.piezaSiguiente')} title={t('armadoAnim.piezaSiguiente')}>
            <Icono n="saltoDer" />
          </button>
          {!est.pasoId && (
            <button className="arm-boton" onClick={() => rep.siguientePaso()} aria-label={t('armadoAnim.pasoSiguiente')} title={t('armadoAnim.pasoSiguiente')}>
              <Icono n="pasoDer" />
            </button>
          )}
        </div>

        <div className="arm-grupo arm-vel" role="group" aria-label={t('armadoAnim.velocidad')}>
          {VELOCIDADES.map((v) => (
            <button key={v} className={`arm-chico${est.vel === v ? ' activo' : ''}`} onClick={() => rep.velocidad(v)} aria-pressed={est.vel === v}>
              {v}x
            </button>
          ))}
        </div>

        <div className="arm-grupo">
          <button className={`arm-chico${est.seguir ? ' activo' : ''}`} onClick={() => rep.seguir(!est.seguir)} aria-pressed={est.seguir} title={t('armadoAnim.camaraAyuda')}>
            <Icono n="camara" />
            {t('armadoAnim.camara')}
          </button>
          {siguiente && (
            <button className="arm-chico activo" onClick={() => rep.abrir(seq, siguiente)}>
              {t('armadoAnim.verSiguiente')}
              <Icono n="der" />
            </button>
          )}
          <button className="arm-boton" onClick={() => rep.cerrar()} aria-label={t('armadoAnim.cerrar')} title={t('armadoAnim.cerrar')}>
            <Icono n="cerrar" />
          </button>
        </div>
      </div>
    </div>
  );
}
