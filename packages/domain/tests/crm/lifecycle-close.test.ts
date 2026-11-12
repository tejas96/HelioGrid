import { describe, expect, it } from 'vitest';
import { disqualify, junk, markLost, reopen, resurface } from '../../src/crm/lifecycle-close';
import { DISQUALIFY_REASONS, LOST_REASONS } from '../../src/crm/vocabulary';
import { CLOSED_BY_PRIYA, CONTEXT, leadAt, nextOf, refusalOf } from './lead-fixture';

describe('disqualify — one of the six reasons, no timer (M02-42, M02-53)', () => {
  it.each(DISQUALIFY_REASONS)('%s closes the lead at its stage and records the close', (reason) => {
    expect(disqualify(leadAt({ stage: 'contacted' }), reason, CONTEXT)).toMatchObject({
      next: {
        stage: 'contacted',
        state: 'disqualified',
        close: { state: 'disqualified', reason, ...CLOSED_BY_PRIYA },
      },
      transitions: [{ moveKind: 'lifecycle_state', from: null, to: 'disqualified' }],
      raisesTask: null,
    });
  });

  it.each([
    ['snoozed', null],
    ['dormant', null],
    ['disqualified', 'lead_closed'],
    ['lost', 'lead_closed'],
    ['junk', 'lead_closed'],
  ] as const)('a %s lead is refused for %s', (state, refusal) => {
    expect(refusalOf(disqualify(leadAt({ state }), 'budget', CONTEXT))).toBe(refusal);
  });

  it('a snoozed lead loses its wake date when it is closed', () => {
    const lead = leadAt({ state: 'snoozed', wakeOn: '2026-11-20' });
    expect(nextOf(disqualify(lead, 'unreachable', CONTEXT)).wakeOn).toBeNull();
    expect(nextOf(junk(lead, CONTEXT)).wakeOn).toBeNull();
    expect(nextOf(markLost(lead, { reason: 'price' }, CONTEXT)).wakeOn).toBeNull();
  });
});

describe('reopen — the prior stage, counted, the close kept (M02-56)', () => {
  it.each([
    ['lost', null],
    ['disqualified', null],
    ['dormant', null],
    ['junk', null],
    ['snoozed', 'not_reopenable'],
    [null, 'not_reopenable'],
  ] as const)('a %s lead is refused for %s', (state, refusal) => {
    expect(refusalOf(reopen(leadAt({ state, reopenCount: 2 })))).toBe(refusal);
  });

  it('counts every reopen and ends the close’s timers, never the close', () => {
    const lost = leadAt({
      stage: 'proposal',
      state: 'lost',
      resurfaceOn: '2027-01-15',
      noCallUntil: '2027-05-09',
      close: { state: 'lost', reason: 'postponed', ...CLOSED_BY_PRIYA },
      reopenCount: 2,
    });
    expect(nextOf(reopen(lost))).toEqual({
      ...lost,
      state: null,
      resurfaceOn: null,
      noCallUntil: null,
      reopenCount: 3,
    });
  });
});

describe('junk — out of every queue, never deleted (M02-55)', () => {
  it('closes with who and when, and no reason', () => {
    expect(nextOf(junk(leadAt({ ownerId: null }), CONTEXT))).toMatchObject({
      stage: 'new',
      state: 'junk',
      close: { state: 'junk', ...CLOSED_BY_PRIYA },
    });
  });

  it.each(['disqualified', 'lost', 'junk'] as const)('a %s lead is not junked again', (state) => {
    expect(refusalOf(junk(leadAt({ state }), CONTEXT))).toBe('lead_closed');
  });
});

describe('markLost — one of the seven, with its rule (M02-54)', () => {
  it.each(LOST_REASONS.filter((reason) => reason !== 'postponed'))(
    '%s closes the lead with no resurface date',
    (reason) => {
      const next = nextOf(markLost(leadAt({ stage: 'negotiating' }), { reason }, CONTEXT));
      expect(next).toMatchObject({ stage: 'negotiating', state: 'lost', resurfaceOn: null });
      expect(next.close).toEqual({ state: 'lost', reason, ...CLOSED_BY_PRIYA });
    },
  );

  it.each([
    ['2026-11-10', null],
    ['2026-11-09', 'resurface_date_not_future'],
    ['2026-10-01', 'resurface_date_not_future'],
    [null, 'resurface_date_not_future'],
    [undefined, 'resurface_date_not_future'],
  ] as const)('postponed to %s is refused for %s', (resurfaceOn, refusal) => {
    const result = markLost(leadAt({}), { reason: 'postponed', resurfaceOn }, CONTEXT);
    expect(refusalOf(result)).toBe(refusal);
    if (refusal === null) expect(nextOf(result).resurfaceOn).toBe(resurfaceOn);
  });

  it.each([
    ['not_interested', '2027-05-09'],
    ['price', null],
    ['chose_competitor', null],
  ] as const)('%s holds calls back until %s', (reason, noCallUntil) => {
    expect(nextOf(markLost(leadAt({}), { reason }, CONTEXT)).noCallUntil).toBe(noCallUntil);
  });

  it.each([
    [null, 'reason_not_listed'],
    ['renting', 'reason_not_listed'],
  ] as const)('a reason of %s is refused for %s', (reason, refusal) => {
    expect(refusalOf(markLost(leadAt({}), { reason }, CONTEXT))).toBe(refusal);
  });

  it('a closed lead is not lost again', () => {
    expect(refusalOf(markLost(leadAt({ state: 'junk' }), { reason: 'price' }, CONTEXT))).toBe(
      'lead_closed',
    );
  });
});

describe('a won lead is a project — no close act reaches it (M07-62)', () => {
  const won = leadAt({ stage: 'won' });
  it.each([
    ['markLost', () => markLost(won, { reason: 'price' }, CONTEXT)],
    ['disqualify', () => disqualify(won, 'budget', CONTEXT)],
    ['junk', () => junk(won, CONTEXT)],
  ] as const)('%s on a won lead is refused as not open', (_act, act) => {
    expect(refusalOf(act())).toBe('not_open');
  });

  it.each([
    ['negotiating', null],
    ['proposal', null],
  ] as const)('a lead at %s is still open to a loss', (stage, refusal) => {
    expect(refusalOf(markLost(leadAt({ stage }), { reason: 'price' }, CONTEXT))).toBe(refusal);
  });
});

describe('resurface — the 09:00 sweep returns a postponed loss with a task (M02-54)', () => {
  const postponed = leadAt({
    stage: 'proposal',
    state: 'lost',
    resurfaceOn: '2027-01-15',
    close: { state: 'lost', reason: 'postponed', ...CLOSED_BY_PRIYA },
  });

  it.each([
    ['2027-01-15', null],
    ['2027-01-16', null],
    ['2027-01-14', 'not_due'],
  ] as const)('swept on %s it is refused for %s', (today, refusal) => {
    expect(refusalOf(resurface(postponed, today))).toBe(refusal);
  });

  it('returns at its stage, the close kept and no reopen counted', () => {
    expect(resurface(postponed, '2027-01-15')).toEqual({
      kind: 'moved',
      next: { ...postponed, state: null, resurfaceOn: null },
      transitions: [{ moveKind: 'lifecycle_state', from: 'lost', to: null, cause: 'wake' }],
      raisesTask: 'resurface',
    });
  });

  it.each([
    leadAt({ state: 'lost', close: { state: 'lost', reason: 'price', ...CLOSED_BY_PRIYA } }),
    leadAt({ state: null, resurfaceOn: '2027-01-15' }),
    leadAt({ state: 'snoozed', wakeOn: '2027-01-15' }),
  ])('a lead with no postponed loss is refused — %#', (lead) => {
    expect(refusalOf(resurface(lead, '2027-01-15'))).toBe('not_postponed');
  });
});
