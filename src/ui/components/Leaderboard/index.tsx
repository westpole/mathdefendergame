import { useEffect, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import type { Difficulty } from '../../../types';

interface LeaderboardProps {
  initialDifficulty: Difficulty;
  limit: number;
}

const tabs: Difficulty[] = ['child', 'student', 'adult'];

export function Leaderboard({ initialDifficulty, limit }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Difficulty>(initialDifficulty);
  const difficultyScores = useGameStore((state) => state.leaderboard[activeTab]);
  const scores = difficultyScores.slice(0, limit);

  useEffect(() => {
    setActiveTab(initialDifficulty);
  }, [initialDifficulty]);

  return (
    <div className="overlay-content">
      <ul className="view-tabs">
        {tabs.map((tab) => (
          <li
            key={tab}
            className={tab === activeTab ? 'view-tab is-active' : 'view-tab'}
            onClick={() => setActiveTab(tab)}
          >{tab}</li>
        ))}
      </ul>

      {scores.length === 0 ? (
        <div className="board-empty">No scores yet.</div>
      ) : (
        <div className="table-wrapper">
          <div className="table-header">
            <div className="table-row">
              <span>Name</span>
              <span>Score</span>
              <span>Acc%</span>
            </div>
          </div>
          <div className="table-body">
            {scores.map((entry) => (
              <div className="table-row" key={entry.key}>
                <span className="table-cell name">{entry.name.slice(0, 12)}</span>
                <span className="table-cell score">{entry.score ?? 0}</span>
                <span className="table-cell accuracy">{entry.perfScore ? `${entry.perfScore}%` : 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
