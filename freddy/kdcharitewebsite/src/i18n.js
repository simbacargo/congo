// ─── i18n SETUP ──────────────────────────────────────────────────────────────
// react-i18next configured for English / French / Swahili. Language is detected
// from localStorage → <html lang> → browser, and persisted to localStorage so a
// visitor's choice survives reloads. English is the fallback for any missing key.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'sw', label: 'Kiswahili', short: 'SW' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      sw: { translation: sw },
    },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kdc-lang',
    },
    interpolation: { escapeValue: false }, // React already escapes
  });

// Keep <html lang> in sync for accessibility + SEO.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language || 'en';

export default i18n;
