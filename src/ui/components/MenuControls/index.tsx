import { useState } from 'react';

import menuCloseIcon from '@assets/menu-close.svg';
import menuIcon from '@assets/menu.svg';

import { MenuList } from './MenuList';

/**
 * Displays the game menu toggle and opens the navigation menu overlay.
 *
 * The component tracks the menu's open state and renders the list of available
 * actions when the user expands the menu.
 */
export function MenuControls() {
  const [isOpen, setIsOpen] = useState(false);

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
        <MenuList setIsOpen={setIsOpen} />
      )}
    </div>
  );
}
