import { describe, expect, it } from 'vitest';
import { nextOpenGroup } from '../../src/notifications/centre-acts';

describe('nextOpenGroup — one type group open at a time (SCR-SHELL-03)', () => {
  it.each([
    ['nothing open, tap Sales → Sales opens', null, 'sales', 'sales'],
    ['Sales open, tap Sales → it closes', 'sales', 'sales', null],
    ['Sales open, tap Delivery → Delivery replaces it', 'sales', 'delivery', 'delivery'],
  ] as const)('%s', (_, open, tapped, next) => {
    expect(nextOpenGroup<string>(open, tapped)).toBe(next);
  });
});
