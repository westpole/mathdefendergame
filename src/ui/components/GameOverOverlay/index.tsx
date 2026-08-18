import { startGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

export function GameOverOverlay() {
  const score = useGameStore((state) => state.score);
  const correctCount = useGameStore((state) => state.correctCount);
  const incorrectCount = useGameStore((state) => state.incorrectCount);
  const finalPerfScore = useGameStore((state) => state.finalPerfScore);

  const handleStartNewGame = () => {
    startGame();
  };

  return (
    <div className="grid-container">
      <div className="contentBox">
        <section className="overlay-panel gameover-panel accent-danger">
          <div className="overlay-header">
            <h1>Game Over</h1>
          </div>

          <div className="stats-grid">
            <span>Total Score</span>
            <strong>{score}</strong>
            <span>Correct</span>
            <strong>{correctCount}</strong>
            <span>Incorrect</span>
            <strong>{incorrectCount}</strong>
            <span>Accuracy</span>
            <strong>{finalPerfScore.toFixed(2)}%</strong>
          </div>

          <div className="action-row center-content">
            <button className="primary-button" onClick={handleStartNewGame} type="button">
              Start new game
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
