import { describe, expect, it } from 'vitest';
import {
  type BillingStripInput,
  billingStripAudienceOf,
  billingStripFactOf,
  type StripSignal,
  TRIAL_CHIP_PROMINENT_DAYS,
} from '../../src/commerce/billing-strip';
import { MS_PER_DAY } from '../../src/format/zone';

const NOW = Date.parse('2026-09-15T10:00:00Z');
const daysAgo = (days: number) => NOW - days * MS_PER_DAY;
const daysAhead = (days: number) => NOW + days * MS_PER_DAY;

const input = (over: Partial<BillingStripInput> = {}): BillingStripInput => ({
  phase: 'active',
  stateEnteredAt: daysAgo(30),
  trialEndsAt: null,
  signals: [],
  audience: 'owner',
  now: NOW,
  ...over,
});

const cap = (step: StripSignal['step'], meter = 'proposals'): StripSignal => ({
  meter,
  step,
  pausesAt: step === 'grace' ? daysAhead(3) : null,
  resetsAt: step === 'paused' ? daysAhead(12) : null,
});

describe('billingStripFactOf — one strip, the broadest true fact (SCR-SHELL-06, M12-06, M12-39)', () => {
  it('days 0–3 speak the early rung, day 4 the metered pause, day 6 the final warning, day 7 the halt', () => {
    const early = (day: number) =>
      billingStripFactOf(input({ phase: 'past_due_full_function', stateEnteredAt: daysAgo(day) }));
    const paused = (day: number) =>
      billingStripFactOf(input({ phase: 'past_due_metered_paused', stateEnteredAt: daysAgo(day) }));
    expect(early(0)).toEqual({ kind: 'dunning', rung: 'early', day: 0 });
    expect(early(3)).toEqual({ kind: 'dunning', rung: 'early', day: 3 });
    expect(paused(4)).toEqual({ kind: 'dunning', rung: 'metered', day: 4 });
    expect(paused(5)).toEqual({ kind: 'dunning', rung: 'metered', day: 5 });
    expect(paused(6)).toEqual({ kind: 'dunning', rung: 'final', day: 6 });
    expect(billingStripFactOf(input({ phase: 'halted' }))).toEqual({ kind: 'halted' });
  });

  it('a past-due strip reaches only the Owner and the managers; a halt reaches everyone (M12-40, M12-56)', () => {
    const pastDue = { phase: 'past_due_metered_paused' as const, stateEnteredAt: daysAgo(4) };
    expect(billingStripFactOf(input({ ...pastDue, audience: 'manager' })).kind).toBe('dunning');
    expect(billingStripFactOf(input({ ...pastDue, audience: 'member' }))).toEqual({ kind: 'none' });
    expect(billingStripFactOf(input({ phase: 'halted', audience: 'member' }))).toEqual({
      kind: 'halted',
    });
  });

  it('the trial chip is subtle at D-8 and prominent from D-7', () => {
    const trial = (days: number) =>
      billingStripFactOf(input({ phase: 'trialing', trialEndsAt: daysAhead(days) }));
    expect(trial(8)).toEqual({ kind: 'trial_chip', daysLeft: 8 });
    expect(trial(TRIAL_CHIP_PROMINENT_DAYS)).toEqual({
      kind: 'trial_prominent',
      daysLeft: 7,
      endsAt: daysAhead(7),
    });
    // The last hours of a trial still read as one day left, never zero.
    expect(trial(0.25)).toMatchObject({ kind: 'trial_prominent', daysLeft: 1 });
    expect(billingStripFactOf(input({ phase: 'expired', trialEndsAt: daysAgo(1) }))).toEqual({
      kind: 'expired',
    });
  });

  it('a cap at 80% draws no strip, at 100% the grace strip, after the grace the paused strip', () => {
    expect(billingStripFactOf(input({ signals: [cap('warning')] }))).toEqual({ kind: 'none' });
    expect(billingStripFactOf(input({ signals: [cap('overage', 'voice_minutes')] }))).toEqual({
      kind: 'none',
    });
    expect(billingStripFactOf(input({ signals: [cap('grace')] }))).toEqual({
      kind: 'cap',
      ...cap('grace'),
    });
    expect(billingStripFactOf(input({ signals: [cap('paused')] }))).toEqual({
      kind: 'cap',
      ...cap('paused'),
    });
  });

  it('state before cap, and the most severe cap first', () => {
    const halted = input({ phase: 'halted', signals: [cap('paused')] });
    expect(billingStripFactOf(halted)).toEqual({ kind: 'halted' });
    const two = input({ signals: [cap('grace'), cap('paused', 'storage')] });
    expect(billingStripFactOf(two)).toMatchObject({ kind: 'cap', meter: 'storage' });
    // A cap that reached 100% outranks the quiet chip; the D-7 strip outranks a cap.
    const chip = input({ phase: 'trialing', trialEndsAt: daysAhead(10), signals: [cap('grace')] });
    expect(billingStripFactOf(chip)).toMatchObject({ kind: 'cap' });
    const late = input({ phase: 'trialing', trialEndsAt: daysAhead(3), signals: [cap('grace')] });
    expect(billingStripFactOf(late)).toMatchObject({ kind: 'trial_prominent' });
  });

  it('an active company with nothing at its cap draws nothing', () => {
    expect(billingStripFactOf(input())).toEqual({ kind: 'none' });
  });
});

describe('billingStripAudienceOf — who the strip speaks to (M12-40, M12-56)', () => {
  it('the Owner, a manager, or any other member', () => {
    expect(billingStripAudienceOf(['epc_owner'])).toBe('owner');
    expect(billingStripAudienceOf(['sales_manager'])).toBe('manager');
    expect(billingStripAudienceOf(['project_manager', 'finance'])).toBe('manager');
    expect(billingStripAudienceOf(['sales_executive'])).toBe('member');
  });
});
