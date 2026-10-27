/**
 * Phaser i18n Adapter Module
 *
 * This module bridges Phaser scene code to the shared i18next instance.
 */
import type { TOptions } from 'i18next';

import i18n from '../../i18n/config';

type PhaserLanguageChangedListener = (language: string) => void;

export function tPhaser(key: string, options?: TOptions): string {
  return i18n.t(key, options);
}

export function getPhaserLanguage(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? 'en';
}

export function onPhaserLanguageChanged(listener: PhaserLanguageChangedListener): () => void {
  const handleLanguageChanged = (language: string): void => {
    listener(language);
  };

  i18n.on('languageChanged', handleLanguageChanged);

  return () => {
    i18n.off('languageChanged', handleLanguageChanged);
  };
}
