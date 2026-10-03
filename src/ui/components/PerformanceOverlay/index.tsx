import { useMemo } from 'react';

import { useGameStore } from '@store/useGameStore';
import {
  buildPerformanceRows,
  selectActiveProfileHistory,
} from '@store/selectors/performance';

import { formatAccuracy, formatSpeed } from './utilities';

/**
 * Displays operator performance metrics for the active profile.
 *
 * This overlay reads performance history from the shared store and derives a
 * per-operation summary for the selected profile. It intentionally keeps the
 * presentation layer thin; all shaping and calculation logic lives in the store
 * selectors to keep the component easier to test and reason about.
 */
export function PerformanceOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const history = useGameStore(selectActiveProfileHistory);

  // buildPerformanceRows is memoized because it depends on historical data that
  // can change whenever a new run completes, but we do not want to recreate the
  // derived row objects on every render.
  const rows = useMemo(() => buildPerformanceRows(history), [history]);

  // Some profiles may have no completed runs yet. This gate keeps the empty state
  // clear and avoids rendering an empty table with no meaningful data.
  const hasPerformanceData = rows.some((row) => row.attempts > 0);

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="performance-overlay">
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
          // This empty state should read naturally in tests and when the player first
          // opens the overlay before any runs have been recorded.
          <div className="performance-empty-state" role="status">
            Complete a run to unlock operator performance insights.
          </div>
        )}
      </section>
    </div>
  );
}
