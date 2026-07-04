import { startGame } from '../../../phaserGame';

const difficulties = [
  { key: 'child', label: 'Child', className: 'menu-button menu-button--child' },
  { key: 'student', label: 'Student', className: 'menu-button menu-button--student' },
  { key: 'adult', label: 'Adult', className: 'menu-button menu-button--adult' },
] as const;

export function MainMenuOverlay() {
  return (
    <div className="overlay-screen overlay-screen--interactive">
      <div className="menu-layout">
        <section className="overlay-panel menu-hero">
          <h1>MATH DEFENDER</h1>
          <h4 className="menu-subtitle">Defend your base from the meteor storm by solving math problems!</h4>
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
        </section>
      </div>
    </div>
  );
}
