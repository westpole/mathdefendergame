import { useGameStore } from '@store/useGameStore';
import { logOff, openScreenView, startGame } from '@game/scenes/UIScene';

const menuItems = [
  { id: 'home', label: 'Home', type: 'view', view: 'home' },
  { id: 'play', label: 'Play Game', type: 'start' },
  { id: 'profile', label: 'Profile', type: 'view', view: 'profile' },
  { id: 'performance', label: 'Performance', type: 'view', view: 'performance' },
  { id: 'rules', label: 'Rules', type: 'view', view: 'rules' },
  { id: 'logoff', label: 'Log off', type: 'logoff' },
] as const;

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
  const activeView = useGameStore((state) => state.screenView);

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

    openScreenView(item.view);
    setIsOpen(false);
  };

  return (
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
  );
}
