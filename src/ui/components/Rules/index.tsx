import { useTranslation } from 'react-i18next';

const ruleKeys = [
  'ui.rulesTypeAnswerPressEnter',
  'ui.rulesPressEscapeMenu',
  'ui.rulesBeginWithLives',
  'ui.rulesBaseShieldPoints',
  'ui.rulesReachStreakReward',
  'ui.rulesClearStagesToWin',
] as const;

/**
 * Rules overlay component displaying the game rules.
 */
export function RulesOverlay() {
  const { t } = useTranslation();

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="rules-overlay">
      <div className="overlay-panel">
        <div className="menu-page-header">
          <h1>{t('ui.rulesTitle')}</h1>
        </div>
        <ul className="rules-list rules-list--page">
          {ruleKeys.map((ruleKey) => (
            <li key={ruleKey}>{t(ruleKey)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
