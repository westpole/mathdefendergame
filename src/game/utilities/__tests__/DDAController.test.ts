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

  it('covers the empty-sample, heat-state transitions, and clamp reset branches', () => {
    const dda = new DDAController({ windowSize: 5 });

    expect((dda as any).calculatePerformanceRating([])).toBe(0.5);
    (dda as any).updateHeatState(0.35);
    expect((dda as any).currentHeatState).toBe(HeatState.STRUGGLING);
    (dda as any).updateHeatState(0.5);
    expect((dda as any).currentHeatState).toBe(HeatState.BALANCED);
    (dda as any).updateHeatState(0.8);
    expect((dda as any).currentHeatState).toBe(HeatState.FLOW);

    (dda as any).fallSpeedMultiplier = 2.5;
    (dda as any).adjustVelocityAndDensity(0.95);
    expect((dda as any).fallSpeedMultiplier).toBe(2.2);

    (dda as any).fallSpeedMultiplier = 0.1;
    (dda as any).adjustVelocityAndDensity(0.05);
    expect((dda as any).fallSpeedMultiplier).toBe(0.5);

    (dda as any).highPerformanceWindowsCount = 1;
    (dda as any).currentMathTier = MathTier.TIER_2_ADVANCED_ADD_MULT;
    (dda as any).adjustMathComplexity(0.5);
    expect((dda as any).highPerformanceWindowsCount).toBe(0);
  });

  it('applies panic slowdown and heat-state multipliers for critical and overdrive states', () => {
    const critical = new DDAController({ windowSize: 5 });
    (critical as any).currentHeatState = HeatState.CRITICAL;
    (critical as any).fallSpeedMultiplier = 1;

    expect(critical.getMeteorTickSpeed(0.9)).toBeCloseTo(42, 5);

    const overdrive = new DDAController({ windowSize: 5 });
    (overdrive as any).currentHeatState = HeatState.OVERDRIVE;
    (overdrive as any).fallSpeedMultiplier = 1;

    expect(overdrive.getMeteorTickSpeed(0.1)).toBeCloseTo(135, 5);
  });

  it('maps every heat state to its effective meteor density and cooloff tier', () => {
    const cases = [
      [HeatState.CRITICAL, 2],
      [HeatState.STRUGGLING, 3],
      [HeatState.BALANCED, 4],
      [HeatState.FLOW, 5],
      [HeatState.OVERDRIVE, 6],
    ] as const;

    for (const [heatState, expectedMax] of cases) {
      const dda = new DDAController({ windowSize: 5 });
      (dda as any).currentHeatState = heatState;
      (dda as any).cooloffRemainingMeteors = 2;

      expect(dda.getDifficultyState().maxActiveMeteors).toBe(expectedMax);
      expect(dda.getDifficultyState().mathTier).toBe(MathTier.TIER_1_BASIC_ADD_SUB);
    }
  });

  it('drops tier on severe struggles and promotes after sustained high performance', () => {
    const struggling = new DDAController({ windowSize: 5, startingMathTier: MathTier.TIER_3_DIV_MIXED_DOUBLE });
    (struggling as any).adjustMathComplexity(0.2);
    expect((struggling as any).currentMathTier).toBe(MathTier.TIER_2_ADVANCED_ADD_MULT);

    const rising = new DDAController({ windowSize: 5, startingMathTier: MathTier.TIER_2_ADVANCED_ADD_MULT });
    (rising as any).highPerformanceWindowsCount = 1;
    (rising as any).adjustMathComplexity(0.8);
    expect((rising as any).currentMathTier).toBe(MathTier.TIER_3_DIV_MIXED_DOUBLE);

    (rising as any).adjustMathComplexity(0.8);
    expect((rising as any).currentMathTier).toBe(MathTier.TIER_3_DIV_MIXED_DOUBLE);
  });
});
