import { useState } from 'react';

import { useGameStore } from '@store/useGameStore';
import { ProfileIcon } from '@ui/components/ProfileIcon';

import { toGradeTitle } from './utilities';

const PRACTICE_OPERATIONS = ['+', '-', '*', '/'] as const;

/**
 * Renders the home dashboard with quick-mode launch tiles for regular play and practice mode.
 */
export function HomeOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const grade = useGameStore((state) => state.grade);
  const practiceOperation = useGameStore((state) => state.practiceOperation);
  const selectPracticeOperation = useGameStore((state) => state.selectPracticeOperation);

  const [now] = useState(() => Date.now());

  const handleStartRegularPlay = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => startGame({ mode: 'regular' }));
  };

  const handleStartPracticeMode = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => {
      startGame({ mode: 'practice', practiceOperation });
    });
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel home-report-panel" data-testid="home-mode-select">
        <div className="home-report-header">
          <ProfileIcon label={`${toGradeTitle(grade)} icon`} size={120} />

          <div className="home-report-copy">
            <p className="home-report-eyebrow">Mission Control</p>
            <h1>{activeUsername ?? 'Ghost'}</h1>
            <h4 className="menu-subtitle">{toGradeTitle(grade)} on duty</h4>
            <p className="home-report-window">{new Date(now).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="home-quick-actions" data-testid="home-practice-controls">
          <article className="home-mode-tile" data-testid="home-regular-play-tile">
            <h2>Regular Play</h2>
            <p>Campaign defense runs with the normal stage flow.</p>
            <button
              type="button"
              data-testid="home-regular-play-button"
              className="secondary-button"
              onClick={handleStartRegularPlay}
            >
              Start Regular Play
            </button>
          </article>

          <article className="home-mode-tile" data-testid="home-practice-tile">
            <h2>Practice Mode</h2>
            <p>Train one operation at a time without a campaign cap.</p>

            <div className="practice-operation-picker" aria-label="Practice operation selector">
              {PRACTICE_OPERATIONS.map((operation) => (
                <button
                  key={operation}
                  type="button"
                  className={operation === practiceOperation ? 'practice-operation-button practice-operation-button--active' : 'practice-operation-button'}
                  data-testid={`practice-operation-${operation}`}
                  onClick={() => selectPracticeOperation(operation)}
                  aria-pressed={operation === practiceOperation}
                >
                  {operation}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-testid="home-practice-start-button"
              className="secondary-button"
              onClick={handleStartPracticeMode}
            >
              Start Practice Mode
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}
