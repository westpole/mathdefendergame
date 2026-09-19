import {
  GAME_CONFIG,
  getDangerZoneOffset,
  getMeteorSpawnPadding,
  resolveGradeFromScore,
} from '../config';

describe('game config', () => {
  describe('getDangerZoneOffset', () => {
    it('scales the legacy danger zone height to the current canvas height', () => {
      expect(getDangerZoneOffset(700)).toBe(100);
      expect(getDangerZoneOffset(900)).toBe(Math.round((100 / 700) * 900));
    });
  });

  describe('getMeteorSpawnPadding', () => {
    it('enforces the minimum spawn padding on narrow canvases', () => {
      expect(getMeteorSpawnPadding(300)).toBe(40);
    });

    it('scales spawn padding proportionally on wide canvases', () => {
      expect(getMeteorSpawnPadding(700)).toBe(60);
    });
  });

  describe('resolveGradeFromScore', () => {
    it('keeps scores below the first threshold at trainee', () => {
      expect(resolveGradeFromScore(-1)).toBe('trainee');
    });

    it('promotes grades at each configured threshold boundary', () => {
      expect(resolveGradeFromScore(GAME_CONFIG.grades.trainee.thresholdScore)).toBe('trainee');
      expect(resolveGradeFromScore(GAME_CONFIG.grades.cadet.thresholdScore)).toBe('cadet');
      expect(resolveGradeFromScore(GAME_CONFIG.grades.commander.thresholdScore)).toBe('commander');
      expect(resolveGradeFromScore(GAME_CONFIG.grades['major-general'].thresholdScore)).toBe('major-general');
    });

    it('uses the highest matching threshold for in-between and high scores', () => {
      expect(resolveGradeFromScore(350)).toBe('cadet');
      expect(resolveGradeFromScore(750)).toBe('commander');
      expect(resolveGradeFromScore(10_000)).toBe('major-general');
    });
  });
});