import { beforeEach, describe, expect, it } from 'vitest';

import i18n from '../../i18n/config';

describe('i18n configuration', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('updates the document language metadata and translations when the locale changes', async () => {
    await i18n.changeLanguage('uk');

    expect(i18n.t('ui.regularPlay')).toBe('Звичайна гра');
    expect(document.documentElement.lang).toBe('uk');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
