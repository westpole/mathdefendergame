import { DDAController, HeatState, MathTier } from '../DDAController';

describe('DDAController', () => {
  it('reaches overdrive on sustained high performance', () => {
    const dda = new DDAController({ windowSize: 5 });

    for (let i = 0; i < 5; i++) {
      dda.recordSample({ isCorrect: true, latencyMs: 200, baseHit: false });
    }

    expect(dda.getDifficultyState().heatState).toBe(HeatState.OVERDRIVE);
  });

  it('does not allow base-hit samples to inflate latency score', () => {
    const dda = new DDAController({
      windowSize: 5,
      weightAccuracy: 0,
      weightLatency: 1,
      weightBaseSafety: 0,
      targetLatencyMs: 1000,
    });

    for (let i = 0; i < 5; i++) {
      dda.recordSample({ isCorrect: false, latencyMs: 0, baseHit: true });
    }

    expect(dda.getDifficultyState().heatState).toBe(HeatState.CRITICAL);
  });

  it('promotes math tier after two strong windows', () => {
    const dda = new DDAController({ windowSize: 5 });

    for (let i = 0; i < 10; i++) {
      dda.recordSample({ isCorrect: true, latencyMs: 250, baseHit: false });
    }

    expect(dda.getDifficultyState().mathTier).toBe(MathTier.TIER_2_ADVANCED_ADD_MULT);
  });

  it('activates and expires cooloff window', () => {
    const dda = new DDAController({ windowSize: 5 });

    for (let i = 0; i < 5; i++) {
      dda.recordSample({ isCorrect: false, latencyMs: 9000, baseHit: true });
    }

    expect(dda.getDifficultyState().isCooloffActive).toBe(true);

    for (let i = 0; i < 5; i++) {
      dda.recordSample({ isCorrect: true, latencyMs: 1000, baseHit: false });
    }

    expect(dda.getDifficultyState().isCooloffActive).toBe(false);
  });

  it('keeps speed multiplier within clamp bounds', () => {
    const dda = new DDAController({ windowSize: 5 });

    for (let i = 0; i < 40; i++) {
      for (let j = 0; j < 5; j++) {
        dda.recordSample({ isCorrect: false, latencyMs: 9000, baseHit: true });
      }
    }

    expect(dda.getDifficultyState().fallSpeedMultiplier).toBeGreaterThanOrEqual(0.5);

    for (let i = 0; i < 40; i++) {
      for (let j = 0; j < 5; j++) {
        dda.recordSample({ isCorrect: true, latencyMs: 100, baseHit: false });
      }
    }

    expect(dda.getDifficultyState().fallSpeedMultiplier).toBeLessThanOrEqual(2.2);
  });
});
