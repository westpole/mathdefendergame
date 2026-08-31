import { useState } from 'react';

import menuCloseIcon from '@assets/menu-close.svg';
import menuIcon from '@assets/menu.svg';
import { logOff, openMenuView, startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

const menuItems = [
  { id: 'home', label: 'Home', type: 'view', view: 'home' },
  { id: 'play', label: 'Play Game', type: 'start' },
  { id: 'profile', label: 'Profile', type: 'view', view: 'profile' },
  { id: 'performance', label: 'Performance', type: 'view', view: 'performance' },
  { id: 'rules', label: 'Rules', type: 'view', view: 'rules' },
  { id: 'logoff', label: 'Log off', type: 'logoff' },
] as const;

export function MenuControls() {
  const activeView = useGameStore((state) => state.menuView);
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuSelect = (item: (typeof menuItems)[number]) => {
    if (item.type === 'start') {
      startGame();
      setIsOpen(false);
      return;
    }

    if (item.type === 'logoff') {
      logOff();
      setIsOpen(false);
      return;
    }

    openMenuView(item.view);
    setIsOpen(false);
  };

  return (
    <div className="menu-shell" data-testid="menu-shell">
      {!isOpen && (
        <button
          aria-controls="menu-options"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Open menu"
          className="secondary-button menu-button"
          data-testid="menu-toggle-button"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <img alt="" className="menu-icon" src={menuIcon} />
        </button>
      )}
      {isOpen && (
          <button
          aria-label="Close menu"
          className="secondary-button menu-close-button"
          data-testid="menu-close-button"
          onClick={() => setIsOpen(false)}
          type="button"
        >
          <img alt="" className="menu-icon" src={menuCloseIcon} />
        </button>
      )}

      {isOpen && (
        <div className="menu-overlay" data-testid="menu-overlay">
          <div className="menu-panel" data-testid="menu-options" id="menu-options" role="menu">
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
      )}
    </div>
  );
}
