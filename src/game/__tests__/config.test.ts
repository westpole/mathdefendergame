import {
  GAME_CONFIG,
  getDangerZoneOffset,
  getMeteorSpawnPadding,
} from '../config';

describe('game config', () => {
  describe('getDangerZoneOffset', () => {
    it('scales the legacy danger zone height to the current canvas height in the happy path', () => {
      expect(getDangerZoneOffset(700)).toBe(100);
      expect(getDangerZoneOffset(900)).toBe(Math.round((100 / 700) * 900));
    });

    it('handles zero and invalid canvas sizes in the fail path', () => {
      expect(getDangerZoneOffset(0)).toBe(0);
      expect(getDangerZoneOffset(-100)).toBe(Math.round((-100 * 100) / 700));
      expect(Number.isNaN(getDangerZoneOffset(Number.NaN))).toBe(true);
    });
  });

  describe('getMeteorSpawnPadding', () => {
    it('uses the proportional layout spacing on wider canvases in the happy path', () => {
      expect(getMeteorSpawnPadding(300)).toBe(40);
      expect(getMeteorSpawnPadding(700)).toBe(60);
    });

    it('enforces the minimum padding on narrow or invalid canvas widths in the fail path', () => {
      expect(getMeteorSpawnPadding(0)).toBe(40);
      expect(getMeteorSpawnPadding(-250)).toBe(40);
      expect(Number.isNaN(getMeteorSpawnPadding(Number.NaN))).toBe(true);
    });
  });

  describe('grade requirements', () => {
    it('defines the per-operation requirements for each grade in the happy path', () => {
      expect(GAME_CONFIG.grades.trainee.requirements).toEqual({});
      expect(GAME_CONFIG.grades.cadet.requirements).toEqual({ '+': 250, '-': 150 });
      expect(GAME_CONFIG.grades.commander.requirements).toEqual({ '+': 750, '-': 550, '*': 250 });
      expect(GAME_CONFIG.grades['major-general'].requirements).toEqual({ '+': 1250, '-': 1050, '*': 550, '/': 250 });
    });

    it('never lowers a requirement from one grade to the next in the fail path', () => {
      const ops = ['+', '-', '*', '/'] as const;

      GAME_CONFIG.gradeOrder.slice(1).forEach((grade, index) => {
        const previous: Partial<Record<string, number>> = GAME_CONFIG.grades[GAME_CONFIG.gradeOrder[index]].requirements;
        const current: Partial<Record<string, number>> = GAME_CONFIG.grades[grade].requirements;

        for (const op of ops) {
          if (previous[op] !== undefined) {
            expect(current[op]).toBeGreaterThan(previous[op] as number);
          }
        }
      });
    });
  });
});
