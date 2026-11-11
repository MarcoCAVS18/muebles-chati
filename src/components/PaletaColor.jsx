// Barra de colores pastel: aparece al elegir una madera con un clic y le pone un color propio (se guarda con el proyecto).
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PASTELES } from '../engine/colores.js';

export default function PaletaColor({ id, actual, elegir, estado }) {
  const { t } = useTranslation();
  const actualMin = actual ? actual.toLowerCase() : '';
  return (
    <div className="paleta" role="group" aria-label={t('paleta.titulo')}>
      <span className="paleta-titulo">{t('paleta.titulo')}</span>
      <div className="paleta-colores">
        {PASTELES.map((c) => {
          const nombre = t(`paleta.colores.${c.id}`);
          const activo = actualMin === c.color;
          return (
            <button
              key={c.id}
              type="button"
              className={`paleta-color${activo ? ' activo' : ''}`}
              style={{ background: c.color }}
              title={nombre}
              aria-label={t('paleta.pintar', { color: nombre })}
              aria-pressed={activo}
              onClick={() => elegir(id, activo ? null : c.color)}
            />
          );
        })}
      </div>
      {actual && (
        <button type="button" className="paleta-quitar" onClick={() => elegir(id, null)} title={t('paleta.quitarAyuda')}>
          {t('paleta.quitar')}
        </button>
      )}
      {estado && <span className="paleta-aviso">{t('paleta.avisoEstado')}</span>}
    </div>
  );
}
