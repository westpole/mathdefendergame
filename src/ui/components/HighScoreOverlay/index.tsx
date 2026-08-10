import { Leaderboard } from '@ui/components/Leaderboard';

export function HighScoreOverlay() {
  return (
    <div className="grid-container" data-testid="high-score-overlay">
      <div className="contentBox">
        <section className="overlay-panel menu-page-panel">
          <div className="overlay-header">
            <h1>HIGH SCORES</h1>
          </div>
          <Leaderboard initialDifficulty="child" limit={10} />
        </section>
      </div>
    </div>
  );
}
