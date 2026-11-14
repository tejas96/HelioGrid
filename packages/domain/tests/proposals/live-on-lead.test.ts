import { describe, expect, it } from 'vitest';
import { liveOnItsLead } from '../../src/proposals/status';

describe('liveOnItsLead — two live proposals are the collision a person settles (M06-58)', () => {
  it.each([
    ['draft', false, true],
    ['shared', false, true],
    ['accepted', false, true],
    ['declined', false, true],
    ['superseded', false, false],
    ['withdrawn', false, false],
    ['draft', true, false],
    ['shared', true, false],
    ['accepted', true, false],
  ] as const)('%s, won %s → live %s', (status, won, live) => {
    expect(liveOnItsLead(status, won)).toBe(live);
  });
});
