import { useState } from 'react';
import { returnToMenu } from '../../../phaserGame';
import { useGameStore } from '../../../store/useGameStore';
import { Leaderboard } from '../Leaderboard';

export function GameOverOverlay() {
  const difficulty = useGameStore((state) => state.difficulty);
  const score = useGameStore((state) => state.score);
  const correctCount = useGameStore((state) => state.correctCount);
  const incorrectCount = useGameStore((state) => state.incorrectCount);
  const finalPerfScore = useGameStore((state) => state.finalPerfScore);
  const saveScore = useGameStore((state) => state.saveScore);
  const [name, setName] = useState('');

  const saveAndReturn = () => {
    saveScore(name.trim() || 'Anonymous', score, finalPerfScore, difficulty);
    returnToMenu();
  };

  return (
    <div className="overlay-screen overlay-screen--interactive overlay-screen--dimmed">
      <div className="gameover-layout">
        <section className="overlay-panel gameover-panel accent-danger">
          <h2>Game Over</h2>
          <div className="stats-grid">
            <span>Difficulty</span>
            <strong>{difficulty}</strong>
            <span>Total Score</span>
            <strong>{score}</strong>
            <span>Correct</span>
            <strong>{correctCount}</strong>
            <span>Incorrect</span>
            <strong>{incorrectCount}</strong>
            <span>Accuracy</span>
            <strong>{finalPerfScore.toFixed(2)}%</strong>
          </div>
          <label className="field-label" htmlFor="leaderboard-name">Name for leaderboard</label>
          <input
            id="leaderboard-name"
            className="text-input"
            maxLength={10}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            value={name}
          />
          <div className="action-row">
            <button className="secondary-button" onClick={returnToMenu} type="button">
              Menu (No Save)
            </button>
            <button className="primary-button" onClick={saveAndReturn} type="button">
              Save & Menu
            </button>
          </div>
        </section>

        <section className="overlay-panel gameover-board">
          <h2>High Scores</h2>
          <Leaderboard initialDifficulty={difficulty} limit={14} />
        </section>
      </div>
    </div>
  );
}
