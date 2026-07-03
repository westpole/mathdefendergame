import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { Difficulty } from '../../types';

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
