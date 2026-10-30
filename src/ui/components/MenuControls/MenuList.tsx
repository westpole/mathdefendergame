import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';

/**
 * Props for the menu list overlay.
 */
interface MenuListProps {
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * Renders the menu options for navigation, starting a game, and logging out.
 *
 * @param props - Controls the menu visibility after a user makes a selection.
 */
export function MenuList({ setIsOpen }: MenuListProps) {
  const { t, i18n } = useTranslation();
  const activeView = useGameStore((state) => state.screenView);
  const practiceOperation = useGameStore((state) => state.practiceOperation);

  const menuItems = [
    { id: 'home', label: t('ui.home'), type: 'view', view: 'home' },
    { id: 'play', label: t('ui.regularPlay'), type: 'start', mode: 'regular' },
    { id: 'practice', label: t('ui.practiceMode'), type: 'start', mode: 'practice' },
    { id: 'weekly-report', label: t('ui.weeklyReport'), type: 'view', view: 'weekly-report' },
    { id: 'profile', label: t('ui.profile'), type: 'view', view: 'profile' },
    { id: 'settings', label: t('ui.settings'), type: 'view', view: 'settings' },
    { id: 'performance', label: t('ui.performance'), type: 'view', view: 'performance' },
    { id: 'rules', label: t('ui.rules'), type: 'view', view: 'rules' },
    { id: 'logoff', label: t('ui.logOff'), type: 'logoff' },
  ] as const;

  const handleMenuSelect = (item: (typeof menuItems)[number]) => {
    if (item.type === 'start') {
      void import('@game/scenes/UIScene').then(({ startGame }) => {
        startGame({
          mode: item.mode ?? 'regular',
          practiceOperation: item.mode === 'practice' ? practiceOperation : undefined,
        });
      });
      setIsOpen(false);
      return;
    }

    if (item.type === 'logoff') {
      void import('@game/scenes/UIScene').then(({ logOff }) => logOff());
      setIsOpen(false);
      return;
    }

    void import('@game/scenes/UIScene').then(({ openScreenView }) => openScreenView(item.view));
    setIsOpen(false);
  };

  return (
    <div className="menu-overlay" data-testid="menu-overlay">
      <div className="menu-panel" data-testid="menu-options" id="menu-options" role="menu">
        <div className="menu-language-picker">
          <label className="field-label" htmlFor="menu-language-select">
            {t('ui.language')}
          </label>
          <select
            id="menu-language-select"
            aria-label={t('ui.selectLanguage')}
            className="text-input"
            value={i18n.resolvedLanguage ?? 'en'}
            onChange={(event) => {
              void i18n.changeLanguage(event.target.value);
            }}
          >
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </div>
        <div className="menu-options">
          {menuItems.map((item) => (
            <button
              key={item.id}
              aria-current={item.type === 'view' && activeView === item.view ? 'page' : undefined}
              className="secondary-button menu-option"
              data-testid={`menu-option-${item.id}`}
              onClick={() => handleMenuSelect(item)}
              role="menuitem"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
