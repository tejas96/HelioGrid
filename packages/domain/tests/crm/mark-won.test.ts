import { describe, expect, it } from 'vitest';
import { markWon } from '../../src/crm/lifecycle';
import { leadAt, refusalOf } from './lead-fixture';

describe('markWon — the deal is won from any open stage before it (M07-62, M08-02)', () => {
  it.each([
    ['new', null, null],
    ['negotiating', null, null],
    ['negotiating', 'snoozed', null],
    ['won', null, 'stage_reached'],
    ['negotiating', 'disqualified', 'lead_closed'],
    ['negotiating', 'lost', 'lead_closed'],
    ['negotiating', 'junk', 'lead_closed'],
    ['won', 'lost', 'lead_closed'],
  ] as const)('a %s lead in state %s is refused for %s', (stage, state, refusal) => {
    expect(refusalOf(markWon(leadAt({ stage, state })))).toBe(refusal);
  });

  it('moves a negotiating lead to won with one funnel transition', () => {
    expect(markWon(leadAt({ stage: 'negotiating' }))).toEqual({
      kind: 'moved',
      next: leadAt({ stage: 'won' }),
      transitions: [{ moveKind: 'funnel_stage', from: 'negotiating', to: 'won', cause: 'manual' }],
      raisesTask: null,
    });
  });

  it('returns a dormant lead first, then wins it', () => {
    expect(markWon(leadAt({ stage: 'proposal', state: 'dormant' }))).toEqual({
      kind: 'moved',
      next: leadAt({ stage: 'won', state: null }),
      transitions: [
        { moveKind: 'lifecycle_state', from: 'dormant', to: null, cause: 'automation' },
        { moveKind: 'funnel_stage', from: 'proposal', to: 'won', cause: 'manual' },
      ],
      raisesTask: null,
    });
  });
});
