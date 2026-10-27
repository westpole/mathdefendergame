import i18n from '../../../i18n/config';

import { getPhaserLanguage, onPhaserLanguageChanged, tPhaser } from '../phaserI18n';

describe('phaserI18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('reuses shared translations for Phaser', () => {
    expect(tPhaser('game.stageLost')).toBe('Stage Lost');
  });

  it('exposes the current language and supports language-change subscriptions', async () => {
    const listener = vi.fn();
    const unsubscribe = onPhaserLanguageChanged(listener);

    await i18n.changeLanguage('uk');

    expect(getPhaserLanguage()).toBe('uk');
    expect(listener).toHaveBeenCalledWith('uk');

    unsubscribe();
    await i18n.changeLanguage('en');

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
