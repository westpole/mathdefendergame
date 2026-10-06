/**
 * Unit tests for mathGen utility
 * Tests the math expression generation logic
 */
import { generateMath, getOperationForStage, getOperationsForTier } from '../mathGen';
import { MathTier } from '../DDAController';

function evaluateExpression(text: string): number {
  const tokens = text.trim().split(' ');
  if (tokens.length === 3) {
    const left = Number(tokens[0]);
    const op = tokens[1];
    const right = Number(tokens[2]);
    return applyOperation(left, op, right);
  }

  if (tokens.length === 5) {
    const a = Number(tokens[0]);
    const op1 = tokens[1];
    const b = Number(tokens[2]);
    const op2 = tokens[3];
    const c = Number(tokens[4]);

    if (op2 === '*' || op2 === '/') {
      const rightSide = applyOperation(b, op2, c);
      return applyOperation(a, op1, rightSide);
    }

    const leftSide = applyOperation(a, op1, b);
    return applyOperation(leftSide, op2, c);
  }

  throw new Error(`Unexpected expression format: ${text}`);
}

function applyOperation(left: number, op: string, right: number): number {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    default:
      throw new Error(`Unsupported operation: ${op}`);
  }
}

describe('MathGen', () => {
  describe('generate', () => {
    it('should generate expressions for stage 1 (addition only)', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMath(1);
        expect(result.op).toBe('+');
        expect(result.answer).toBeGreaterThanOrEqual(1);
        expect(result.answer).toBeLessThanOrEqual(100);
      }
    });

    it('should return a valid expression object', () => {
      const result = generateMath(1);
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.answer).toBeDefined();
      expect(result.op).toBeDefined();
    });

    it('should return a numeric answer', () => {
      const result = generateMath(1);
      expect(typeof result.answer).toBe('number');
      expect(Number.isInteger(result.answer)).toBe(true);
    });

    it('should generate different expressions on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const result = generateMath(1);
        results.add(result.text);
      }
      // Should have at least some variety (not all identical)
      expect(results.size).toBeGreaterThan(1);
    });

    it('should use subtraction for stages 5-8', () => {
      const result = generateMath(6);
      expect(result.op).toBe('-');
      expect(result.answer).toBeGreaterThanOrEqual(0);
    });

    it('should use multiplication for stages 13-16', () => {
      const result = generateMath(14);
      expect(result.op).toBe('*');
      expect(result.answer).toBeGreaterThanOrEqual(0);
    });

    it('should use division for stages 17-20', () => {
      const result = generateMath(18);
      expect(result.op).toBe('/');
      expect(result.answer).toBeGreaterThanOrEqual(0);
    });

    it('should include multiplication in tier 2 generation', () => {
      let sawMultiplication = false;
      for (let i = 0; i < 50; i++) {
        const result = generateMath(25, MathTier.TIER_2_ADVANCED_ADD_MULT);
        if (result.op === '*') {
          sawMultiplication = true;
          break;
        }
      }

      expect(sawMultiplication).toBe(true);
    });

    it('should include division in tier 3 generation', () => {
      let sawDivision = false;
      for (let i = 0; i < 60; i++) {
        const result = generateMath(25, MathTier.TIER_3_DIV_MIXED_DOUBLE);
        if (result.op === '/') {
          sawDivision = true;
          break;
        }
      }

      expect(sawDivision).toBe(true);
    });

    it('should generate precedence expression in tier 4 when stage allows mixed operators', () => {
      const result = generateMath(25, MathTier.TIER_4_ORDER_OF_OPERATIONS);
      const tokens = result.text.split(' ');

      expect(tokens).toHaveLength(5);
      expect(['+', '-']).toContain(tokens[1]);
      expect(['*', '/']).toContain(tokens[3]);
      expect(evaluateExpression(result.text)).toBe(result.answer);
    });

    it('should expose the full tier operation matrix and the fallback tier mapping', () => {
      expect(getOperationsForTier(MathTier.TIER_4_ORDER_OF_OPERATIONS)).toEqual(['+', '-', '*', '/']);
      expect(getOperationsForTier(0 as MathTier)).toEqual(['+', '-']);
    });

    it('should generate precedence expressions with multiplication before addition', () => {
      const randomSpy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0);

      const result = generateMath(25, MathTier.TIER_4_ORDER_OF_OPERATIONS);

      expect(result.text).toBe('10 + 2 * 2');
      expect(result.answer).toBe(14);
      expect(result.op).toBe('*');
      randomSpy.mockRestore();
    });

    it('should fallback to valid stage operation when tier 4 is requested early', () => {
      const result = generateMath(1, MathTier.TIER_4_ORDER_OF_OPERATIONS);
      expect(result.op).toBe('+');
      expect(evaluateExpression(result.text)).toBe(result.answer);
    });
  });

  describe('getOperationForStage', () => {
    it('should return addition for early stages', () => {
      expect(getOperationForStage(1)).toEqual(['+']);
      expect(getOperationForStage(4)).toEqual(['+']);
    });

    it('should return subtraction for stages 5-8', () => {
      expect(getOperationForStage(6)).toEqual(['-']);
    });

    it('should return mixed operations for stages 9-12', () => {
      expect(getOperationForStage(10)).toEqual(['+', '-']);
    });

    it('should return multiplication for stages 13-16', () => {
      expect(getOperationForStage(14)).toEqual(['*']);
    });

    it('should return all operations for advanced stages', () => {
      const ops = getOperationForStage(25);
      expect(ops).toEqual(['+', '-', '*', '/']);
    });

    it('should cover the remaining stage operation ranges and fallback selections', () => {
      expect(getOperationForStage(5)).toEqual(['-']);
      expect(getOperationForStage(9)).toEqual(['+', '-']);
      expect(getOperationForStage(13)).toEqual(['*']);
      expect(getOperationForStage(17)).toEqual(['/']);
      expect(getOperationForStage(22)).toEqual(['*', '/']);

      const fallback = generateMath(1, MathTier.TIER_4_ORDER_OF_OPERATIONS);
      expect(['+', '-', '*', '/']).toContain(fallback.op);
      expect(evaluateExpression(fallback.text)).toBe(fallback.answer);
    });
  });
});
