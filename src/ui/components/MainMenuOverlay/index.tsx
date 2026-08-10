import { startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

const difficulties = [
  { key: 'child', label: 'Child', className: 'menu-button menu-button--child' },
  { key: 'student', label: 'Student', className: 'menu-button menu-button--student' },
  { key: 'adult', label: 'Adult', className: 'menu-button menu-button--adult' },
] as const;

export function MainMenuOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel">
        <h1>{activeUsername ?? 'Commander'}</h1>
        <h4 className="menu-subtitle">Commander on duty</h4>
        <p className="menu-subtitle">Select difficulty to begin your defense mission.</p>
        <div className="menu-actions">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.key}
              className={difficulty.className}
              onClick={() => startGame(difficulty.key)}
              type="button"
            >
              {difficulty.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
