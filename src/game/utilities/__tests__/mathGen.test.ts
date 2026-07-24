/**
 * Unit tests for mathGen utility
 * Tests the math expression generation logic
 */
import { generateMath, getOperationForStage } from '../mathGen';

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
  });
});
