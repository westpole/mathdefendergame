import { formatAccuracy, formatSpeed } from '../utilities';

describe('Performance utility formatters', () => {
  it('formats accuracy values as rounded percentages', () => {
    expect(formatAccuracy(87.5)).toBe('88%');
    expect(formatAccuracy(71.4)).toBe('71%');
    expect(formatAccuracy(100)).toBe('100%');
  });

  it('formats speed values with one decimal place and a seconds suffix', () => {
    expect(formatSpeed(1.04)).toBe('1.0s');
    expect(formatSpeed(2.75)).toBe('2.8s');
    expect(formatSpeed(0)).toBe('0.0s');
  });
});
