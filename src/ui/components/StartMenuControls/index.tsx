import { useState } from 'react';

import { openMenuView } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

const menuItems = [
  { label: 'Play Game', view: 'home' },
  { label: 'High Score', view: 'high-score' },
  { label: 'Rules', view: 'rules' },
] as const;

export function StartMenuControls() {
  const activeView = useGameStore((state) => state.menuView);
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuSelect = (view: (typeof menuItems)[number]['view']) => {
    openMenuView(view);
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
              key={item.view}
              aria-current={activeView === item.view ? 'page' : undefined}
              className="secondary-button start-menu-option"
              data-testid={`menu-option-${item.view}`}
              onClick={() => handleMenuSelect(item.view)}
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
