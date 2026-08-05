/**
 * i18n for the SPA.
 *
 * French is the default and the source of truth — it is the working language
 * in Lubumbashi and Django's `LANGUAGE_CODE` is 'fr'. English and Swahili are
 * translations of it.
 *
 * The SPA owns its own language state (localStorage) rather than Django's
 * session-backed `set_language`, so switching costs no round trip.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import sw from "./locales/sw.json";

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "freddy.lang";

function initialLanguage(): LanguageCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored as LanguageCode;
  const browser = navigator.language.slice(0, 2);
  return LANGUAGES.some((l) => l.code === browser) ? (browser as LanguageCode) : "fr";
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    sw: { translation: sw },
  },
  lng: initialLanguage(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function setLanguage(code: LanguageCode) {
  localStorage.setItem(STORAGE_KEY, code);
  void i18n.changeLanguage(code);
  document.documentElement.lang = code;
}

document.documentElement.lang = i18n.language;

export default i18n;
