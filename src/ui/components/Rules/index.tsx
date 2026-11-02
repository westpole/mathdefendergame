import { useTranslation } from 'react-i18next';

import { GAME_CONFIG } from '@game/config';
import { isFeatureEnabled } from '@shared/featureFlags';
import { useGameStore } from '@store/useGameStore';

import { RulesSection } from './RulesSection';

const hudItems = [
  { id: 'score', labelKey: 'hud.score' },
  { id: 'stage', labelKey: 'hud.stage' },
  { id: 'baseShield', labelKey: 'hud.baseShield' },
  { id: 'lives', labelKey: 'hud.lives' },
  { id: 'streak', labelKey: 'hud.streak' },
  { id: 'answer', labelKey: 'rules.hud.answer' },
] as const;

/**
 * Rules overlay describing both game modes, lives/shield mechanics, the HUD, and pause controls.
 * Control and HUD descriptions follow the detected device type (`isMobileDevice` in the store).
 */
export function RulesOverlay() {
  const { t } = useTranslation();
  const isMobileDevice = useGameStore((state) => state.isMobileDevice);
  const device = isMobileDevice ? 'mobile' : 'desktop';
  const isStreakRewardEnabled = isFeatureEnabled('streak_reward');

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="rules-overlay" data-device={device}>
      <div className="overlay-panel rules-panel">
        <div className="menu-page-header">
          <h1>{t('ui.rulesTitle')}</h1>
        </div>

        <RulesSection id="regular-play" title={t('ui.regularPlay')}>
          <p>{t('rules.regularPlay.body', { stageCount: GAME_CONFIG.regularStageCount })}</p>
        </RulesSection>

        <RulesSection id="practice-mode" title={t('ui.practiceMode')}>
          <p>{t('rules.practiceMode.body')}</p>
        </RulesSection>

        <RulesSection id="lives-shield" title={t('rules.livesShield.title')}>
          <p>
            {t('rules.livesShield.body', {
              lives: GAME_CONFIG.initialLives,
              shield: GAME_CONFIG.stageShieldMax,
            })}
          </p>
        </RulesSection>

        {isStreakRewardEnabled && (
          <RulesSection id="extra-life" title={t('rules.extraLife.title')}>
            <p>{t('rules.extraLife.body', { streak: GAME_CONFIG.streakRewardThreshold })}</p>
          </RulesSection>
        )}

        <RulesSection id="hud" title={t('rules.hud.title')}>
          <p>{t(`rules.hud.${device}`)}</p>
          <dl className="rules-hud-list">
            {hudItems.map((item) => (
              <div key={item.id} className="rules-hud-list__item">
                <dt>{t(item.labelKey)}</dt>
                <dd>{t(`rules.hud.items.${item.id}`)}</dd>
              </div>
            ))}
          </dl>
        </RulesSection>

        <RulesSection id="pause" title={t('rules.pause.title')}>
          <p>{t(`rules.pause.${device}`)}</p>
        </RulesSection>
      </div>
    </div>
  );
}
