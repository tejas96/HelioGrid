import { describe, expect, it } from 'vitest';
import { dayPart } from '../../src/shell/day-part';

describe('dayPart — the part of the day a greeting names', () => {
  it('names morning, afternoon and evening at their edges', () => {
    expect(dayPart(5)).toBe('morning');
    expect(dayPart(11.99)).toBe('morning');
    expect(dayPart(12)).toBe('afternoon');
    expect(dayPart(16.99)).toBe('afternoon');
    expect(dayPart(17)).toBe('evening');
    expect(dayPart(21.99)).toBe('evening');
  });

  it('greets the small hours neutrally', () => {
    expect(dayPart(22)).toBe('late');
    expect(dayPart(0)).toBe('late');
    expect(dayPart(4.99)).toBe('late');
  });
});
