import { startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';
import type { Grade } from '@shared/types';

import { gradeIcons } from '../gradeIcons';

function toGradeTitle(grade: Grade): string {
  return grade
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function HomeOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const grade = useGameStore((state) => state.grade);

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel">
        <div className="grade-icon-wrap">
          <img
            src={gradeIcons[grade]}
            alt={`${toGradeTitle(grade)} icon`}
            className="grade-icon"
            width={256}
          />
        </div>

        <h1>{activeUsername ?? 'Ghost'}</h1>
        <h4 className="menu-subtitle">{toGradeTitle(grade)} on duty</h4>
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
