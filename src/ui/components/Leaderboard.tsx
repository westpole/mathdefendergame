import { useEffect, useState } from 'react';
import { CookieManager } from '../../cookieManager';
import type { Difficulty } from '../../types';

interface LeaderboardProps {
  initialDifficulty: Difficulty;
  limit: number;
}

const tabs: Difficulty[] = ['child', 'student', 'adult'];

export function Leaderboard({ initialDifficulty, limit }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Difficulty>(initialDifficulty);

  useEffect(() => {
    setActiveTab(initialDifficulty);
  }, [initialDifficulty]);

  const scores = CookieManager.getScores(activeTab).slice(0, limit);

  return (
    <div className="board-card">
      <div className="board-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? 'board-tab is-active' : 'board-tab'}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {scores.length === 0 ? (
        <p className="board-empty">No scores yet.</p>
      ) : (
        <div className="board-table">
          <div className="board-row board-row--header">
            <span>Name</span>
            <span>Score</span>
            <span>Acc%</span>
          </div>
          {scores.map((entry) => (
            <div className="board-row" key={entry.key}>
              <span>{entry.name.slice(0, 12)}</span>
              <span className="board-score">{entry.score}</span>
              <span className="board-accuracy">{entry.perfScore}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
