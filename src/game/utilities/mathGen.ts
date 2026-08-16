/**
 * Phaser Game Utilities - Math Generation
 *
 * This module provides utility functions for generating math expressions based on the current game stage.
 * It supports addition, subtraction, multiplication, and division operations, with increasing complexity as the stage progresses.
 *
 * The `generateMath` function returns a `MathExpression` object containing the expression text, the correct answer, and the operation used.
 * The operations are determined by the current stage, with specific operations unlocked at certain stages.
 */

import type { MathExpression } from '@shared/types';
import { MathTier } from './DDAController';

export function getOperationForStage(stage: number): string[] {
  if (stage <= 4) return ['+'];
  if (stage <= 8) return ['-'];
  if (stage <= 12) return ['+', '-'];
  if (stage <= 16) return ['*'];
  if (stage <= 20) return ['/'];
  if (stage <= 24) return ['*', '/'];
  return ['+', '-', '*', '/'];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCommonOperations(stageOps: string[], tierOps: string[]): string[] {
  return stageOps.filter((op) => tierOps.includes(op));
}

function getOperationsForTier(mathTier: MathTier): string[] {
  switch (mathTier) {
    case MathTier.TIER_1_BASIC_ADD_SUB:
      return ['+', '-'];
    case MathTier.TIER_2_ADVANCED_ADD_MULT:
      return ['+', '-', '*'];
    case MathTier.TIER_3_DIV_MIXED_DOUBLE:
      return ['+', '-', '*', '/'];
    case MathTier.TIER_4_ORDER_OF_OPERATIONS:
      return ['+', '-', '*', '/'];
    default:
      return ['+', '-'];
  }
}

function generateTwoTermExpression(op: string, mathTier: MathTier): MathExpression {
  const maxOperand = mathTier >= MathTier.TIER_2_ADVANCED_ADD_MULT ? 150 : 99;
  let a = 0, b = 0, res = 0;

  switch (op) {
    case '+':
      res = randomInt(1, maxOperand);
      a = randomInt(0, res);
      b = res - a;
      break;
    case '-':
      a = randomInt(1, maxOperand);
      b = randomInt(0, a);
      res = a - b;
      break;
    case '*':
      a = randomInt(2, mathTier >= MathTier.TIER_2_ADVANCED_ADD_MULT ? 15 : 12);
      b = randomInt(1, Math.max(1, Math.floor(maxOperand / a)));
      res = a * b;
      break;
    case '/':
      b = randomInt(2, 12);
      res = randomInt(1, Math.max(1, Math.floor(maxOperand / b)));
      a = res * b;
      if (a === 0) {
        a = b;
        res = 1;
      }
      break;
  }

  return { text: `${a} ${op} ${b}`, answer: res, op };
}

function generateOrderOfOperationsExpression(stageOps: string[]): MathExpression {
  const outerOps = getCommonOperations(stageOps, ['+', '-']);
  const innerOps = getCommonOperations(stageOps, ['*', '/']);

  // If the stage restrictions do not allow true precedence expressions, fallback.
  if (outerOps.length === 0 || innerOps.length === 0) {
    const fallbackOps = stageOps;
    const fallbackOp = fallbackOps[Math.floor(Math.random() * fallbackOps.length)] ?? '+';
    return generateTwoTermExpression(fallbackOp, MathTier.TIER_3_DIV_MIXED_DOUBLE);
  }

  const outerOp = outerOps[Math.floor(Math.random() * outerOps.length)];
  const innerOp = innerOps[Math.floor(Math.random() * innerOps.length)];

  const a = randomInt(10, 99);
  let b = 0;
  let c = 0;
  let innerResult = 0;

  if (innerOp === '*') {
    b = randomInt(2, 15);
    c = randomInt(2, 12);
    innerResult = b * c;
  } else {
    c = randomInt(2, 12);
    innerResult = randomInt(2, 30);
    b = innerResult * c;
  }

  const answer = outerOp === '+' ? a + innerResult : a - innerResult;
  return {
    text: `${a} ${outerOp} ${b} ${innerOp} ${c}`,
    answer,
    op: innerOp,
  };
}

export function generateMath(stage: number, mathTier: MathTier = MathTier.TIER_1_BASIC_ADD_SUB): MathExpression {
  const stageOps = getOperationForStage(stage);

  if (mathTier === MathTier.TIER_4_ORDER_OF_OPERATIONS) {
    return generateOrderOfOperationsExpression(stageOps);
  }

  const tierOps = getOperationsForTier(mathTier);
  const commonOps = getCommonOperations(stageOps, tierOps);
  const ops = commonOps.length > 0 ? commonOps : stageOps;
  const op = ops[Math.floor(Math.random() * ops.length)] ?? '+';

  return generateTwoTermExpression(op, mathTier);
}
