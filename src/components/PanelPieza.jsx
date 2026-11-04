// Tarjeta del modo pieza: nombre, medidas, cortes y botones para pasar a la pieza anterior o siguiente.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { nombreGrupo } from '../i18n/util.js';
import { describirPieza, COLOR_CORTE, fmt } from '../engine/enfoque.js';
import { TACTIL } from '../util/pantalla.js';
import { describirUnion } from '../engine/uniones.js';
import { COLOR_ATRAVIESA, COLOR_RECIBE } from './Enfoque.jsx';

const LEYENDA = ['medida', 'recto', 'redondo', 'arco'];

const fmtN = (n) => String(n).replace('.', ',');

export default function PanelPieza({ partes, uniones, id, cfg, invertir, setInvertir, verContexto, setVerContexto, tenemos, alternarTenemos, ir, salir }) {
  const { t } = useTranslation();
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
          <span className="enfoque-grupo">{nombreGrupo(t, p.grupo)}</span>
        </div>
        <button className="enfoque-salir" onClick={salir} title={t('pieza.volver')}>
          {TACTIL ? t('pieza.salir') : t('pieza.salirEsc')}
        </button>
      </div>

      <div className="enfoque-cuerpo" key={`c-${p.id}`}>
        <div className="enfoque-medidas">
          <div>
            <span>{t('pieza.largo')}</span>
            <b>{fmt(d.largo)}</b>
          </div>
          <div>
            <span>{t('pieza.ancho')}</span>
            <b>{fmt(d.ancho)}</b>
          </div>
          <div>
            <span>{t('pieza.espesor')}</span>
            <b>{fmt(d.espesor)}</b>
          </div>
          <div className="enfoque-material">
            <span>{t('pieza.material')}</span>
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
          <h5>{t('pieza.comoSeUne')}</h5>
          {uni.nota && <p>{uni.nota}</p>}
          <ul>
            {uni.juntas.map(({ junta: j, papel, otra }) => {
              const desc = describirUnion(j, t);
              const pret = j.pretaladro;
              const detalle =
                !j.cantidad
                  ? t('pieza.sinTornillo')
                  : papel === 'cara'
                    ? t('pieza.seAtornilla', { lado: desc.lado, pasante: fmtN(pret.pasante) })
                    : t('pieza.recibe', { cara: j.cara, guia: fmtN(pret.guia), prof: fmt(pret.prof) });
              return (
                <li key={`${j.id}${papel}`}>
                  <i style={{ background: j.cantidad ? (papel === 'cara' ? COLOR_ATRAVIESA : COLOR_RECIBE) : '#b9aaff' }} />
                  <div>
                    <b>{otra}</b> {nombreDe(otra)}: {desc.texto}
                    <span>
                      {detalle}
                      {j.desmontable ? t('pieza.sinCola') : ''}
                      {j.tapadaPor && papel === 'cara' ? t('pieza.atornillarAntes', { pieza: j.tapadaPor }) : ''}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="enfoque-fila enfoque-nav">
        <button onClick={() => ir(-1)} title={t('pieza.anterior')}>
          ◀ {ant.id}
        </button>
        <span className="enfoque-cuenta">
          {t('pieza.cuenta', { n: i + 1, total: partes.length })}
        </span>
        <button onClick={() => ir(1)} title={t('pieza.siguiente')}>
          {sig.id} ▶
        </button>
        <button className="enfoque-sec" onClick={() => setInvertir(!invertir)} title={t('pieza.darVueltaTitulo')}>
          {t('pieza.darVuelta')}
        </button>
        <label className="enfoque-contexto">
          <input type="checkbox" checked={verContexto} onChange={(e) => setVerContexto(e.target.checked)} />
          {t('pieza.verFondo')}
        </label>
        <label className="enfoque-contexto" title={p.salidaDe ? t('pieza.tenemosSale', { origen: p.salidaDe }) : t('pieza.tenemosMarcar')}>
          <input type="checkbox" checked={tenemos.has(p.salidaDe || p.id)} disabled={!!p.salidaDe} onChange={() => alternarTenemos(p.id)} />
          {t('pieza.yaLaTenemos')}
        </label>
      </div>

      <div className="enfoque-leyenda">
        {LEYENDA.map((k) => (
          <span key={k}>
            <i style={{ background: COLOR_CORTE[k] }} />
            {t(`pieza.leyenda.${k}`)}
          </span>
        ))}
        {uni && uni.juntas.some((x) => x.junta.cantidad > 0) && (
          <>
            <span>
              <i style={{ background: COLOR_ATRAVIESA }} />
              {t('pieza.leyenda.atraviesa')}
            </span>
            <span>
              <i style={{ background: COLOR_RECIBE }} />
              {t('pieza.leyenda.pretaladro')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
