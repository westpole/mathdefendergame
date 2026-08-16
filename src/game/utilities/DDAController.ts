// ============================================================================
// Types & Enums
// ============================================================================

export enum HeatState {
  CRITICAL = 'CRITICAL',
  STRUGGLING = 'STRUGGLING',
  BALANCED = 'BALANCED',
  FLOW = 'FLOW',
  OVERDRIVE = 'OVERDRIVE',
}

export enum MathTier {
  TIER_1_BASIC_ADD_SUB = 1,       // e.g., 4 + 5, 9 - 3
  TIER_2_ADVANCED_ADD_MULT = 2,    // e.g., 14 + 8, 6 x 7
  TIER_3_DIV_MIXED_DOUBLE = 3,     // e.g., 42 / 6, 23 - 15
  TIER_4_ORDER_OF_OPERATIONS = 4,  // e.g., 3 + 4 x 2, x - 7 = 12
}

export interface MetricSample {
  isCorrect: boolean;
  latencyMs: number;
  baseHit: boolean;
}

export interface DDAConfiguration {
  windowSize: number;            // Number of samples per evaluation window (e.g., 5)
  targetLatencyMs: number;       // Ideal response speed threshold (e.g., 2000ms)
  dampingFactorAlpha: number;    // Smoothing factor for speed EMA (e.g., 0.15)
  weightAccuracy: number;        // w1 (e.g., 0.5)
  weightLatency: number;         // w2 (e.g., 0.3)
  weightBaseSafety: number;      // w3 (e.g., 0.2)
  baseFallSpeedPxSec: number;    // Default base meteor speed
  startingMathTier: MathTier;
}

export interface DifficultyState {
  heatState: HeatState;
  mathTier: MathTier;
  fallSpeedMultiplier: number;
  maxActiveMeteors: number;
  effectiveFallSpeed: number;
  isCooloffActive: boolean;
}

// ============================================================================
// DDA Controller Class
// ============================================================================

export class DDAController {
  private config: DDAConfiguration;
  private sampleBuffer: MetricSample[] = [];

  // System State
  private currentHeatState: HeatState = HeatState.BALANCED;
  private currentMathTier: MathTier = MathTier.TIER_1_BASIC_ADD_SUB;
  private fallSpeedMultiplier: number = 1.0;
  private highPerformanceWindowsCount: number = 0;

  // Cooloff & Safeguard States
  private cooloffRemainingMeteors: number = 0;

  constructor(customConfig?: Partial<DDAConfiguration>) {
    this.config = {
      windowSize: 5,
      targetLatencyMs: 2000,
      dampingFactorAlpha: 0.15,
      weightAccuracy: 0.5,
      weightLatency: 0.3,
      weightBaseSafety: 0.2,
      baseFallSpeedPxSec: 100,
      startingMathTier: MathTier.TIER_1_BASIC_ADD_SUB,
      ...customConfig,
    };

    this.currentMathTier = this.config.startingMathTier;
  }

  /**
   * Record a resolved meteor interaction (correct answer, wrong answer, or impact).
   */
  public recordSample(sample: MetricSample): void {
    if (this.cooloffRemainingMeteors > 0) {
      this.cooloffRemainingMeteors--;
    }

    this.sampleBuffer.push(sample);

    // Evaluate whenever the buffer reaches window size
    if (this.sampleBuffer.length >= this.config.windowSize) {
      this.evaluatePerformanceWindow();
      this.sampleBuffer = []; // Clear window
    }
  }

  /**
   * Main evaluation logic run every N meteors.
   */
  private evaluatePerformanceWindow(): void {
    const P = this.calculatePerformanceRating(this.sampleBuffer);

    // Update Heat State based on Performance Rating (P)
    this.updateHeatState(P);

    // Adjust Levers
    this.adjustMathComplexity(P);
    this.adjustVelocityAndDensity(P);
  }

  /**
   * Computes normalized P value (0.0 to 1.0)
   */
  private calculatePerformanceRating(samples: MetricSample[]): number {
    const total = samples.length;
    if (total === 0) return 0.5;

    // 1. Accuracy Score (A)
    const correctCount = samples.filter((s) => s.isCorrect).length;
    const accuracy = correctCount / total;

    // 2. Normalized Latency Score (L_norm)
    const latencyEligibleSamples = samples.filter((s) => !s.baseHit);
    const avgLatency = latencyEligibleSamples.length > 0
      ? latencyEligibleSamples.reduce((sum, s) => sum + s.latencyMs, 0) / latencyEligibleSamples.length
      : this.config.targetLatencyMs * 2;
    const latencyScore = Math.max(
      0,
      Math.min(
        1.0,
        1.0 - (avgLatency - this.config.targetLatencyMs) / this.config.targetLatencyMs
      )
    );

    // 3. Base Safety Penalty (S_impact)
    const hitBase = samples.some((s) => s.baseHit);
    const safetyScore = hitBase ? 0.0 : 1.0;

    // Weighted Performance Vector P
    const P =
      this.config.weightAccuracy * accuracy +
      this.config.weightLatency * latencyScore +
      this.config.weightBaseSafety * safetyScore;

    return Math.max(0.0, Math.min(1.0, P));
  }

  /**
   * Transitions the Heat State machine based on performance.
   */
  private updateHeatState(P: number): void {
    if (P < 0.2) {
      this.currentHeatState = HeatState.CRITICAL;
      this.triggerCognitiveCooloff(); // Trigger safety window on severe failure
    } else if (P < 0.4) {
      this.currentHeatState = HeatState.STRUGGLING;
    } else if (P < 0.75) {
      this.currentHeatState = HeatState.BALANCED;
    } else if (P < 0.9) {
      this.currentHeatState = HeatState.FLOW;
    } else {
      this.currentHeatState = HeatState.OVERDRIVE;
    }
  }

  /**
   * Lever A: Adjusts Cognitive Load (Math Complexity)
   */
  private adjustMathComplexity(P: number): void {
    // Drop Tier immediately if struggling severely
    if (P < 0.3) {
      this.highPerformanceWindowsCount = 0;
      if (this.currentMathTier > MathTier.TIER_1_BASIC_ADD_SUB) {
        this.currentMathTier--;
      }
      return;
    }

    // Require sustained high performance over 2 windows to elevate Tier
    if (P >= 0.75) {
      this.highPerformanceWindowsCount++;
      if (
        this.highPerformanceWindowsCount >= 2 &&
        this.currentMathTier < MathTier.TIER_4_ORDER_OF_OPERATIONS
      ) {
        this.currentMathTier++;
        this.highPerformanceWindowsCount = 0; // Reset counter
      }
    } else {
      this.highPerformanceWindowsCount = 0;
    }
  }

  /**
   * Lever B: Adjusts Physical Load (Velocity & Density) using EMA
   */
  private adjustVelocityAndDensity(P: number): void {
    const targetP = 0.6; // Desired baseline target performance
    const alpha = this.config.dampingFactorAlpha;

    // Exponential Moving Average speed adjustment
    this.fallSpeedMultiplier =
      this.fallSpeedMultiplier * (1 + alpha * (P - targetP));

    // Clamp speed multiplier to safe boundaries (0.5x to 2.2x)
    this.fallSpeedMultiplier = Math.max(0.5, Math.min(2.2, this.fallSpeedMultiplier));
  }

  /**
   * Safeguard 1: Triggers a low-intensity "breath" window after high error rates.
   */
  private triggerCognitiveCooloff(): void {
    this.cooloffRemainingMeteors = 5; // Force next 5 meteors to be easy
  }

  /**
   * Safeguard 2: Panic Slowdown for low-hanging meteors near the base.
   * @param normalizedY Height percentage from top (0.0 = top spawn, 1.0 = base impact)
   * @returns Adjusted speed for this specific meteor update tick.
   */
  public getMeteorTickSpeed(normalizedY: number): number {
    let speed = this.config.baseFallSpeedPxSec * this.fallSpeedMultiplier;

    // Apply Heat State modifier
    if (this.currentHeatState === HeatState.CRITICAL) speed *= 0.6;
    if (this.currentHeatState === HeatState.OVERDRIVE) speed *= 1.35;

    // Panic Slowdown: If meteor reaches bottom 20% without resolution
    if (normalizedY >= 0.8) {
      speed *= 0.7; // 30% speed reduction for clutch saves
    }

    return speed;
  }

  /**
   * Returns current effective difficulty state for Spawner and HUD systems.
   */
  public getDifficultyState(): DifficultyState {
    const isCoolingOff = this.cooloffRemainingMeteors > 0;

    let activeMaxMeteors = 3;
    switch (this.currentHeatState) {
      case HeatState.CRITICAL: activeMaxMeteors = 2; break;
      case HeatState.STRUGGLING: activeMaxMeteors = 3; break;
      case HeatState.BALANCED: activeMaxMeteors = 4; break;
      case HeatState.FLOW: activeMaxMeteors = 5; break;
      case HeatState.OVERDRIVE: activeMaxMeteors = 6; break;
    }

    return {
      heatState: this.currentHeatState,
      // Force Tier 1 math during cooloff
      mathTier: isCoolingOff ? MathTier.TIER_1_BASIC_ADD_SUB : this.currentMathTier,
      fallSpeedMultiplier: this.fallSpeedMultiplier,
      maxActiveMeteors: activeMaxMeteors,
      effectiveFallSpeed: this.config.baseFallSpeedPxSec * this.fallSpeedMultiplier,
      isCooloffActive: isCoolingOff,
    };
  }
}
