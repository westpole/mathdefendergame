import { Leaderboard } from '../Leaderboard';

export function HighScoreOverlay() {
  return (
    <div className="overlay-screen overlay-screen--interactive">
      <div className="menu-page-layout">
        <section className="overlay-panel menu-page-panel">
          <div className="menu-page-header">
            <h1>HIGH SCORES</h1>
          </div>
          <Leaderboard initialDifficulty="child" limit={10} />
        </section>
      </div>
    </div>
  );
}
