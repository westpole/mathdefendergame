import { describe, expect, it } from 'vitest';

import { normalizeOperationHistoryStats } from '../normalizeOperationHistoryStats';

describe('normalizeOperationHistoryStats', () => {
  it('normalizes valid operation stats for each math operator into the canonical shape', () => {
    const rawStats = {
      '+': { attempts: 5, incorrect: 1, avgTimeMs: 230 },
      '-': { attempts: 2, incorrect: 0, avgTimeMs: 480 },
      '*': { attempts: 4, incorrect: 2, avgTimeMs: 160 },
      '/': { attempts: 3, incorrect: 1, avgTimeMs: 330 },
    };

    expect(normalizeOperationHistoryStats(rawStats)).toEqual({
      '+': { attempts: 5, incorrect: 1, avgTimeMs: 230 },
      '-': { attempts: 2, incorrect: 0, avgTimeMs: 480 },
      '*': { attempts: 4, incorrect: 2, avgTimeMs: 160 },
      '/': { attempts: 3, incorrect: 1, avgTimeMs: 330 },
    });
  });

  it('returns a zeroed stats map for invalid raw input and skips malformed operator buckets', () => {
    expect(normalizeOperationHistoryStats(null)).toEqual({
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    });

    expect(normalizeOperationHistoryStats('bad-input')).toEqual({
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    });

    const rawStats = {
      '+': { attempts: 1, incorrect: 0, avgTimeMs: 100 },
      '-': 'bad',
      '*': { attempts: 'bad', incorrect: 2, avgTimeMs: 220 },
      '/': { attempts: 3, incorrect: 1, avgTimeMs: null },
    };

    expect(normalizeOperationHistoryStats(rawStats)).toEqual({
      '+': { attempts: 1, incorrect: 0, avgTimeMs: 100 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 2, avgTimeMs: 220 },
      '/': { attempts: 3, incorrect: 1, avgTimeMs: 0 },
    });
  });
});
