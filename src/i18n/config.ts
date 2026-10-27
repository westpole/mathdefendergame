import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslation from '@assets/locales/en/translation.json';
import ukTranslation from '@assets/locales/uk/translation.json';

export const supportedLanguages = ['en', 'uk'] as const;

const resources = {
  en: { translation: enTranslation },
  uk: { translation: ukTranslation },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    defaultNS: 'translation',
    ns: ['translation'],
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
    debug: import.meta.env.DEV,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'math-defender-language',
    },
  });

const syncDocumentLanguage = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const language = i18n.resolvedLanguage ?? 'en';
  const root = document.documentElement;

  root.lang = language;
  root.dir = i18n.dir(language);
};

if (typeof document !== 'undefined') {
  syncDocumentLanguage();
  i18n.on('languageChanged', syncDocumentLanguage);
}

export default i18n;
