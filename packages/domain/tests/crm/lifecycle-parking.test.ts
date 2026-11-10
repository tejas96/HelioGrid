import { describe, expect, it } from 'vitest';
import { flagDormant, snooze, wake, wakeNow } from '../../src/crm/lifecycle-parking';
import { CONTEXT, leadAt, nextOf, refusalOf } from './lead-fixture';

describe('snooze — a mandatory wake date after today (M02-51)', () => {
  it.each([
    ['2026-11-10', null],
    ['2027-01-01', null],
    ['2026-11-09', 'wake_date_not_future'],
    ['2026-11-08', 'wake_date_not_future'],
    [null, 'wake_date_not_future'],
    ['tomorrow', 'wake_date_not_future'],
    ['2026-11-1', 'wake_date_not_future'],
  ] as const)('a wake date of %s is refused for %s', (wakeOn, refusal) => {
    expect(refusalOf(snooze(leadAt({ stage: 'contacted' }), wakeOn, CONTEXT.today))).toBe(refusal);
  });

  it('a snooze parks the lead at its stage with one state move', () => {
    expect(snooze(leadAt({ stage: 'contacted' }), '2026-11-20', CONTEXT.today)).toMatchObject({
      next: { stage: 'contacted', state: 'snoozed', wakeOn: '2026-11-20' },
      transitions: [{ moveKind: 'lifecycle_state', from: null, to: 'snoozed', cause: 'manual' }],
      raisesTask: null,
    });
  });

  it('snoozing a snoozed lead moves its date and writes no transition', () => {
    const lead = leadAt({ state: 'snoozed', wakeOn: '2026-11-12' });
    expect(snooze(lead, '2026-11-30', CONTEXT.today)).toMatchObject({
      next: { state: 'snoozed', wakeOn: '2026-11-30' },
      transitions: [],
    });
  });

  it.each([
    ['dormant', null],
    ['disqualified', 'lead_closed'],
    ['lost', 'lead_closed'],
    ['junk', 'lead_closed'],
  ] as const)('a %s lead is refused for %s', (state, refusal) => {
    expect(refusalOf(snooze(leadAt({ state }), '2026-11-20', CONTEXT.today))).toBe(refusal);
  });
});

describe('wake — the 09:00 sweep returns a snoozed lead with a follow-up task (M02-51)', () => {
  it.each([
    ['2026-11-10', null],
    ['2026-11-09', null],
    ['2026-11-01', null],
    ['2026-11-11', 'not_due'],
  ] as const)(
    'a lead to wake on %s, swept on 10 November, is refused for %s',
    (wakeOn, refusal) => {
      expect(refusalOf(wake(leadAt({ state: 'snoozed', wakeOn }), '2026-11-10'))).toBe(refusal);
    },
  );

  it('the wake clears the state and the date, keeps the stage and raises its task', () => {
    const lead = leadAt({ stage: 'survey', state: 'snoozed', wakeOn: '2026-11-10' });
    expect(wake(lead, '2026-11-10')).toEqual({
      kind: 'moved',
      next: { ...lead, state: null, wakeOn: null },
      transitions: [{ moveKind: 'lifecycle_state', from: 'snoozed', to: null, cause: 'wake' }],
      raisesTask: 'snooze_wake',
    });
  });

  it.each([null, 'dormant', 'lost'] as const)('a %s lead is not snoozed', (state) => {
    expect(refusalOf(wake(leadAt({ state }), '2026-11-10'))).toBe('not_snoozed');
    expect(refusalOf(wakeNow(leadAt({ state })))).toBe('not_snoozed');
  });
});

describe('wakeNow — a person takes the lead back early, with no task', () => {
  it('wakes before the date, cause manual, nothing raised', () => {
    expect(wakeNow(leadAt({ state: 'snoozed', wakeOn: '2026-12-01' }))).toMatchObject({
      next: { state: null, wakeOn: null },
      transitions: [{ cause: 'manual', from: 'snoozed', to: null }],
      raisesTask: null,
    });
  });
});

describe('flagDormant — the sweep, on an active lead at an open stage (M02-52)', () => {
  it.each([
    ['new', null, null],
    ['negotiating', null, null],
    ['won', null, 'not_open'],
    ['contacted', 'dormant', 'not_open'],
    ['contacted', 'snoozed', 'not_open'],
    ['contacted', 'junk', 'not_open'],
  ] as const)('a %s lead in %s is refused for %s', (stage, state, refusal) => {
    expect(refusalOf(flagDormant(leadAt({ stage, state })))).toBe(refusal);
  });

  it('flags without moving the stage, as automation', () => {
    expect(flagDormant(leadAt({ stage: 'proposal' }))).toMatchObject({
      next: { stage: 'proposal', state: 'dormant' },
      transitions: [{ moveKind: 'lifecycle_state', to: 'dormant', cause: 'automation' }],
    });
    expect(nextOf(flagDormant(leadAt({}))).stage).toBe('new');
  });
});
