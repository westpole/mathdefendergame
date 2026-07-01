import { startGame } from '../../phaserGame';
import { Leaderboard } from './Leaderboard';

const difficulties = [
  { key: 'child', label: 'Child', className: 'menu-button menu-button--child' },
  { key: 'student', label: 'Student', className: 'menu-button menu-button--student' },
  { key: 'adult', label: 'Adult', className: 'menu-button menu-button--adult' },
] as const;

const rules = [
  'Type the answer and press Enter.',
  'Escape exits the run back to menu.',
  'You have 10 lives for retries.',
  'The base shield absorbs 5 meteor hits.',
  'A destroyed base costs 1 life.',
  'Perfect stages earn 1 bonus life.',
  'Progress through 28 stages of operations.',
];

export function MainMenuOverlay() {
  return (
    <div className="overlay-screen overlay-screen--interactive">
      <div className="menu-layout">
        <section className="overlay-panel menu-hero">
          <h1>MATH DEFENDER</h1>
          <p>React now owns the menu layer while Phaser stays focused on meteor gameplay.</p>
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

        <section className="overlay-panel menu-rules">
          <h2>Rules</h2>
          <ul className="rules-list">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section className="overlay-panel menu-board">
          <h2>High Scores</h2>
          <Leaderboard initialDifficulty="child" limit={10} />
        </section>
      </div>
    </div>
  );
}
