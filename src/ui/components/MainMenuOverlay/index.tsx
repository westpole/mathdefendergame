import { startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

export function MainMenuOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel">
        <h1>{activeUsername ?? 'Commander'}</h1>
        <h4 className="menu-subtitle">Commander on duty</h4>
        <p className="menu-subtitle">Start as Trainee and rank up by score.</p>
        <div className="menu-actions">
          <button
            className="menu-button menu-button--student"
            data-testid="start-defense-button"
            onClick={() => startGame()}
            type="button"
          >
            Start Defense
          </button>
        </div>
      </div>
    </div>
  );
}
