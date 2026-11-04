// Idiomas de la app: español (por defecto), inglés y sueco. El idioma elegido queda en el navegador.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.js';
import en from './en.js';
import sv from './sv.js';

export const IDIOMAS = ['es', 'en', 'sv'];
const CLAVE = 'chata-idioma';

function inicial() {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    if (IDIOMAS.includes(guardado)) return guardado;
  } catch {
    // sin almacenamiento del navegador: arranca en español
  }
  return 'es';
}

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en }, sv: { translation: sv } },
  lng: inicial(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// El idioma de la página y su título siguen al idioma elegido
function aplicar(lng) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.title = i18n.t('app.titulo');
  }
  try {
    window.localStorage.setItem(CLAVE, lng);
  } catch {
    // sin almacenamiento: queda solo en esta visita
  }
}
aplicar(i18n.language);
i18n.on('languageChanged', aplicar);

export default i18n;
