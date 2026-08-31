import { useState } from 'react';

import { openMenuView, startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

const menuItems = [
  { id: 'home', label: 'Home', type: 'view', view: 'home' },
  { id: 'play', label: 'Play Game', type: 'start' },
  { id: 'profile', label: 'Profile', type: 'view', view: 'profile' },
  { id: 'performance', label: 'Performance', type: 'view', view: 'performance' },
  { id: 'rules', label: 'Rules', type: 'view', view: 'rules' },
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

    openMenuView(item.view);
    setIsOpen(false);
  };

  return (
    <div className="start-menu-shell" data-testid="start-menu-shell">
      <button
        aria-controls="start-menu-options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="secondary-button start-menu-button"
        data-testid="menu-toggle-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Menu
      </button>

      {isOpen && (
        <div
          className="start-menu-options"
          data-testid="start-menu-options"
          id="start-menu-options"
          role="menu"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              aria-current={item.type === 'view' && activeView === item.view ? 'page' : undefined}
              className="secondary-button start-menu-option"
              data-testid={`menu-option-${item.id}`}
              onClick={() => handleMenuSelect(item)}
              role="menuitem"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
