import { useMemo } from 'react';

import { useGameStore } from '@store/useGameStore';
import {
  buildPerformanceRows,
  selectActiveProfileHistory,
} from '@store/selectors/performance';

function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`;
}

function formatSpeed(value: number): string {
  return `${value.toFixed(1)}s`;
}

export function PerformanceOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const history = useGameStore(selectActiveProfileHistory);
  const rows = useMemo(() => buildPerformanceRows(history), [history]);
  const hasPerformanceData = rows.some((row) => row.attempts > 0);

  return (
    <div className="grid-container" data-testid="performance-overlay">
      <div className="contentBox">
        <section className="overlay-panel menu-page-panel performance-panel">
          <div className="overlay-header">
            <h1>PERFORMANCE</h1>
          </div>

          <p className="menu-subtitle performance-subtitle">
            Performance by operator for {activeUsername ?? 'Ghost'} based on completed runs.
          </p>

          {hasPerformanceData ? (
            <div className="performance-table-shell">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th scope="col">Operation Type</th>
                    <th scope="col">Accuracy (%)</th>
                    <th scope="col">Avg Speed (sec)</th>
                    <th scope="col">Mastery Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.operation}>
                      <th scope="row">{row.label}</th>
                      <td>{formatAccuracy(row.accuracy)}</td>
                      <td>{formatSpeed(row.avgSpeedSeconds)}</td>
                      <td>{row.masteryRating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="performance-empty-state" role="status">
              Complete a run to unlock operator performance insights.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
