import { DDAController, HeatState, MathTier, type MetricSample } from '../DDAController';

describe('DDAController', () => {
  const getInternalDDA = (dda: DDAController) => dda as unknown as {
    calculatePerformanceRating: (samples: MetricSample[]) => number;
    updateHeatState: (rating: number) => void;
    currentHeatState: HeatState;
    fallSpeedMultiplier: number;
    adjustVelocityAndDensity: (rating: number) => void;
    highPerformanceWindowsCount: number;
    currentMathTier: MathTier;
    adjustMathComplexity: (rating: number) => void;
    cooloffRemainingMeteors: number;
  };
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
    const internalDda = getInternalDDA(dda);

    expect(internalDda.calculatePerformanceRating([])).toBe(0.5);
    internalDda.updateHeatState(0.35);
    expect(internalDda.currentHeatState).toBe(HeatState.STRUGGLING);
    internalDda.updateHeatState(0.5);
    expect(internalDda.currentHeatState).toBe(HeatState.BALANCED);
    internalDda.updateHeatState(0.8);
    expect(internalDda.currentHeatState).toBe(HeatState.FLOW);

    internalDda.fallSpeedMultiplier = 2.5;
    internalDda.adjustVelocityAndDensity(0.95);
    expect(internalDda.fallSpeedMultiplier).toBe(2.2);

    internalDda.fallSpeedMultiplier = 0.1;
    internalDda.adjustVelocityAndDensity(0.05);
    expect(internalDda.fallSpeedMultiplier).toBe(0.5);

    internalDda.highPerformanceWindowsCount = 1;
    internalDda.currentMathTier = MathTier.TIER_2_ADVANCED_ADD_MULT;
    internalDda.adjustMathComplexity(0.5);
    expect(internalDda.highPerformanceWindowsCount).toBe(0);
  });

  it('applies panic slowdown and heat-state multipliers for critical and overdrive states', () => {
    const critical = new DDAController({ windowSize: 5 });
    const criticalInternal = getInternalDDA(critical);
    criticalInternal.currentHeatState = HeatState.CRITICAL;
    criticalInternal.fallSpeedMultiplier = 1;

    expect(critical.getMeteorTickSpeed(0.9)).toBeCloseTo(42, 5);

    const overdrive = new DDAController({ windowSize: 5 });
    const overdriveInternal = getInternalDDA(overdrive);
    overdriveInternal.currentHeatState = HeatState.OVERDRIVE;
    overdriveInternal.fallSpeedMultiplier = 1;

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
      const internalDda = getInternalDDA(dda);
      internalDda.currentHeatState = heatState;
      internalDda.cooloffRemainingMeteors = 2;

      expect(dda.getDifficultyState().maxActiveMeteors).toBe(expectedMax);
      expect(dda.getDifficultyState().mathTier).toBe(MathTier.TIER_1_BASIC_ADD_SUB);
    }
  });

  it('drops tier on severe struggles and promotes after sustained high performance', () => {
    const struggling = new DDAController({ windowSize: 5, startingMathTier: MathTier.TIER_3_DIV_MIXED_DOUBLE });
    const strugglingInternal = getInternalDDA(struggling);
    strugglingInternal.adjustMathComplexity(0.2);
    expect(strugglingInternal.currentMathTier).toBe(MathTier.TIER_2_ADVANCED_ADD_MULT);

    const rising = new DDAController({ windowSize: 5, startingMathTier: MathTier.TIER_2_ADVANCED_ADD_MULT });
    const risingInternal = getInternalDDA(rising);
    risingInternal.highPerformanceWindowsCount = 1;
    risingInternal.adjustMathComplexity(0.8);
    expect(risingInternal.currentMathTier).toBe(MathTier.TIER_3_DIV_MIXED_DOUBLE);

    risingInternal.adjustMathComplexity(0.8);
    expect(risingInternal.currentMathTier).toBe(MathTier.TIER_3_DIV_MIXED_DOUBLE);
  });
});
