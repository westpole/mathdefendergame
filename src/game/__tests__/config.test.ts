import {
  GAME_CONFIG,
  getDangerZoneOffset,
  getMeteorSpawnPadding,
  resolveGradeFromScore,
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

  describe('resolveGradeFromScore', () => {
    it('promotes players to the highest grade unlocked by their score in the happy path', () => {
      expect(resolveGradeFromScore(0)).toBe('trainee');
      expect(resolveGradeFromScore(GAME_CONFIG.grades.trainee.thresholdScore)).toBe('trainee');
      expect(resolveGradeFromScore(GAME_CONFIG.grades.cadet.thresholdScore)).toBe('cadet');
      expect(resolveGradeFromScore(GAME_CONFIG.grades.commander.thresholdScore)).toBe('commander');
      expect(resolveGradeFromScore(GAME_CONFIG.grades['major-general'].thresholdScore)).toBe('major-general');
      expect(resolveGradeFromScore(350)).toBe('cadet');
      expect(resolveGradeFromScore(750)).toBe('commander');
      expect(resolveGradeFromScore(10_000)).toBe('major-general');
    });

    it('falls back to trainee for out-of-range or invalid scores in the fail path', () => {
      expect(resolveGradeFromScore(-1)).toBe('trainee');
      expect(resolveGradeFromScore(Number.NaN)).toBe('trainee');
      expect(resolveGradeFromScore(Number.NEGATIVE_INFINITY)).toBe('trainee');
    });
  });
});
