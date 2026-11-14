import { describe, expect, it } from 'vitest';
import { planCountsOf } from '../src/copy/proposal-builder-check-said';

const capped = (used?: number, limit?: number) => ({
  kind: 'billing' as const,
  blocked: {
    reason: 'cap',
    resetsAt: null,
    ...(used === undefined ? {} : { used }),
    ...(limit === undefined ? {} : { limit }),
  },
});

describe('planCountsOf — "40 of 40" at the plan’s limit (T-M06-028)', () => {
  it.each([
    [
      'the refusal’s own count, for any reader',
      null,
      capped(40, 40),
      { planCounts: { used: 40, limit: 40 } },
    ],
    [
      'the refusal’s count over the usage read',
      { used: 39, limit: 40 },
      capped(40, 40),
      { planCounts: { used: 40, limit: 40 } },
    ],
    [
      'a refusal with no count falls back to the usage read',
      { used: 40, limit: 40 },
      capped(),
      { planCounts: { used: 40, limit: 40 } },
    ],
    ['a refusal with half a count is no count', null, capped(40), {}],
    ['a plan with no limit prints none', { used: 12, limit: null }, null, {}],
    ['nothing read prints none', null, null, {}],
  ])('%s', (_, plan, failure, counts) => {
    expect(planCountsOf(plan, failure)).toEqual(counts);
  });
});
