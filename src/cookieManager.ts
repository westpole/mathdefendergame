import type { ScoreEntry } from './types';

export const CookieManager = {
  saveScore(name: string, score: number, perfScore: number, difficulty: string): void {
    const id = Math.floor(Math.random() * 10_000_000);
    const combined = score + perfScore;
    const data = { name, score, perfScore, combined, difficulty, date: Date.now() };
    document.cookie = `mdg_${id}=${encodeURIComponent(JSON.stringify(data))}; max-age=31536000; path=/`;
    CookieManager.cleanupScores();
  },

  getScores(difficultyFilter: string | null = null): ScoreEntry[] {
    const scores: ScoreEntry[] = [];
    const cookies = document.cookie.split(';');

    for (const c of cookies) {
      const eqIdx = c.trim().indexOf('=');
      if (eqIdx === -1) continue;
      const key = c.trim().substring(0, eqIdx);
      const val = c.trim().substring(eqIdx + 1);

      if (key.startsWith('mdg_')) {
        try {
          const parsed = JSON.parse(decodeURIComponent(val));
          if (!parsed.difficulty) parsed.difficulty = 'child';
          scores.push({ key, ...parsed } as ScoreEntry);
        } catch (e) {
          console.error('Bad cookie entry', e);
        }
      }
    }

    const sorted = scores.sort((a, b) => b.combined - a.combined);
    return difficultyFilter ? sorted.filter(s => s.difficulty === difficultyFilter) : sorted;
  },

  cleanupScores(): void {
    const allScores = CookieManager.getScores();
    const grouped: Record<string, ScoreEntry[]> = { child: [], student: [], adult: [] };

    allScores.forEach(s => {
      if (grouped[s.difficulty]) grouped[s.difficulty].push(s);
      else grouped['child'].push(s); // Fallback for unknown difficulties
    });

    Object.keys(grouped).forEach(diff => {
      const groupScores = grouped[diff];
      if (groupScores.length > 10) {
        groupScores.slice(10).forEach(item => {
          document.cookie = `${item.key}=; max-age=0; path=/`;
        });
      }
    });
  },
};
