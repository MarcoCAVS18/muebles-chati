// Switch de idioma del header: ES, EN y SV.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IDIOMAS } from '../i18n/index.js';

export default function SelectorIdioma() {
  const { t, i18n } = useTranslation();
  const actual = i18n.resolvedLanguage || i18n.language;
  return (
    <div className="idiomas" role="group" aria-label={t('idioma.etiqueta')}>
      {IDIOMAS.map((l) => (
        <button key={l} type="button" lang={l} className={l === actual ? 'on' : ''} aria-pressed={l === actual} title={t(`idioma.${l}`)} onClick={() => i18n.changeLanguage(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
