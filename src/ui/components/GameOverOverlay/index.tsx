import { useState } from 'react';
import { returnToMenu } from '../../../phaserGame';
import { useGameStore } from '../../../store/useGameStore';

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
    <div className="grid-container">
      <div className="contentBox">
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
          <label className="field-label" htmlFor="leaderboard-name">Save result</label>
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
              Cancel
            </button>
            <button className="primary-button" onClick={saveAndReturn} type="button">
              Save
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
