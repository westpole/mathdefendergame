import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { ScreenView } from '@store/types';
import { useGameStore } from '@store/useGameStore';
import { Select } from '@ui/components/Select';
import { LANGUAGE_OPTIONS } from '@ui/constants';

/**
 * Props for the menu list overlay.
 */
interface MenuListProps {
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * A single selectable menu entry.
 */
type MenuItem = { id: string; labelKey: string } & (
  | { type: 'view'; view: ScreenView }
  | { type: 'start' }
  | { type: 'logoff' }
);

/**
 * A titled group of related menu entries.
 */
interface MenuSection {
  id: string;
  titleKey: string;
  items: readonly MenuItem[];
}

// Untitled blocks rendered outside the sections: Home at the top, Log off at the bottom.
const HOME_ITEM: MenuItem = { id: 'home', labelKey: 'ui.home', type: 'view', view: 'home' };

const LOGOFF_ITEM: MenuItem = { id: 'logoff', labelKey: 'ui.logOff', type: 'logoff' };

const MENU_SECTIONS: readonly MenuSection[] = [
  {
    id: 'game',
    titleKey: 'ui.menuSectionGame',
    items: [
      { id: 'play', labelKey: 'ui.regularPlay', type: 'start' },
      { id: 'practice', labelKey: 'ui.practiceMode', type: 'view', view: 'practice-select' },
    ],
  },
  {
    id: 'reports',
    titleKey: 'ui.menuSectionReports',
    items: [
      { id: 'achievements', labelKey: 'ui.achievements', type: 'view', view: 'achievements' },
      { id: 'weekly-report', labelKey: 'ui.weeklyReport', type: 'view', view: 'weekly-report' },
      { id: 'performance', labelKey: 'ui.performance', type: 'view', view: 'performance' },
    ],
  },
  {
    id: 'tools',
    titleKey: 'ui.menuSectionTools',
    items: [
      { id: 'profile', labelKey: 'ui.profile', type: 'view', view: 'profile' },
      { id: 'settings', labelKey: 'ui.settings', type: 'view', view: 'settings' },
      { id: 'rules', labelKey: 'ui.rules', type: 'view', view: 'rules' },
    ],
  },
];

/**
 * Props for a single menu option button.
 */
interface MenuOptionProps {
  item: MenuItem;
  label: string;
  isCurrent: boolean;
  onSelect: (item: MenuItem) => void;
}

/**
 * Renders one menu entry as a menuitem button, marking the active screen view as the current page.
 *
 * @param props - The entry, its translated label, active state, and selection handler.
 */
function MenuOption({ item, label, isCurrent, onSelect }: MenuOptionProps) {
  return (
    <button
      aria-current={isCurrent ? 'page' : undefined}
      className="secondary-button menu-option"
      data-testid={`menu-option-${item.id}`}
      onClick={() => onSelect(item)}
      role="menuitem"
      type="button"
    >
      {label}
    </button>
  );
}

/**
 * Renders the menu options for navigation, starting a game, and logging out.
 * Options are grouped into titled sections (Game, Reports, Tools) between an untitled top
 * block (language, Home) and an untitled bottom block (Log off).
 * Practice Mode opens the practice operation selector instead of starting a run directly.
 *
 * @param props - Controls the menu visibility after a user makes a selection.
 */
export function MenuList({ setIsOpen }: MenuListProps) {
  const { t, i18n } = useTranslation();
  const activeView = useGameStore((state) => state.screenView);
  const languageLabelId = useId();
  const sectionBaseId = useId();

  const handleMenuSelect = (item: MenuItem) => {
    if (item.type === 'start') {
      void import('@game/scenes/UIScene').then(({ startGame }) => startGame({ mode: 'regular' }));
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

  const renderItem = (item: MenuItem) => (
    <MenuOption
      key={item.id}
      isCurrent={item.type === 'view' && activeView === item.view}
      item={item}
      label={t(item.labelKey)}
      onSelect={handleMenuSelect}
    />
  );

  return (
    <div className="menu-overlay" data-testid="menu-overlay">
      <div className="menu-panel" data-testid="menu-options" id="menu-options" role="menu">
        <div className="menu-language-picker">
          <label className="field-label" id={languageLabelId}>
            {t('ui.language')}
          </label>
          <Select
            id="menu-language-select"
            labelId={languageLabelId}
            onChange={(nextLanguage) => {
              void i18n.changeLanguage(nextLanguage);
            }}
            options={LANGUAGE_OPTIONS}
            value={i18n.resolvedLanguage ?? 'en'}
          />
        </div>
        <div className="menu-options">{renderItem(HOME_ITEM)}</div>
        {MENU_SECTIONS.map((section) => {
          const titleId = `${sectionBaseId}-${section.id}`;

          return (
            <div
              key={section.id}
              aria-labelledby={titleId}
              className="menu-section"
              data-section={section.id}
              data-testid={`menu-section-${section.id}`}
              role="group"
            >
              <span className="menu-section__title" id={titleId}>
                {t(section.titleKey)}
              </span>
              <div className="menu-options">{section.items.map(renderItem)}</div>
            </div>
          );
        })}
        <div className="menu-options menu-options--footer">{renderItem(LOGOFF_ITEM)}</div>
      </div>
    </div>
  );
}
