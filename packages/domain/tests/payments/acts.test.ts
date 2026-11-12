import { describe, expect, it } from 'vitest';
import {
  amountAgainstLeft,
  refusalToRecord,
  refusalToReverse,
  refusalToWaive,
} from '../../src/payments/acts';

describe('refusalToRecord — when money that arrived is not recorded', () => {
  const ok = {
    state: 'due',
    modeKnown: true,
    receivedOn: '2026-11-12',
    today: '2026-11-12',
    referenceUsed: false,
  } as const;
  it.each([
    ['a due part', ok, null],
    ['an upcoming part paid early', { ...ok, state: 'upcoming' }, null],
    ['a received part paid again', { ...ok, state: 'received' }, null],
    ['a waived part', { ...ok, state: 'waived' }, 'tranche_waived'],
    ['a mode the market does not declare', { ...ok, modeKnown: false }, 'mode_unknown'],
    ['a day before today', { ...ok, receivedOn: '2026-11-11' }, null],
    ['tomorrow', { ...ok, receivedOn: '2026-11-13' }, 'date_in_future'],
    ['a reference already on a receipt', { ...ok, referenceUsed: true }, 'reference_used'],
  ] as const)('%s', (_, payment, refusal) => {
    expect(refusalToRecord(payment)).toBe(refusal);
  });
});

describe('refusalToReverse — a payment, once, with its reason (M11-46)', () => {
  it.each([
    ['a payment with a reason', 'payment', false, 'Wrong project', null],
    ['a reversal', 'reversal', false, 'again', 'not_a_payment'],
    ['a payment reversed already', 'payment', true, 'again', 'already_reversed'],
    ['no reason', 'payment', false, '', 'reason_needed'],
    ['only spaces', 'payment', false, '   ', 'reason_needed'],
  ] as const)('%s', (_, kind, reversed, reason, refusal) => {
    expect(refusalToReverse({ kind, reversed, reason })).toBe(refusal);
  });
});

describe('refusalToWaive — terminal, with a reason, while money is owed (M11-49)', () => {
  it.each([
    ['a due part', 'due', 'Customer discount', null],
    ['a part paid in part', 'part_received', 'Settled', null],
    ['an upcoming part', 'upcoming', 'Dropped from scope', null],
    ['a received part', 'received', 'why', 'tranche_received'],
    ['a waived part', 'waived', 'why', 'tranche_waived'],
    ['no reason', 'due', ' ', 'reason_needed'],
  ] as const)('%s', (_, state, reason, refusal) => {
    expect(refusalToWaive(state, reason)).toBe(refusal);
  });
});

describe('amountAgainstLeft — what the record sheet says while the amount is typed (M11-36)', () => {
  it.each([
    ['exactly what is left', 50_000, '50000.00', 'matches'],
    ['a paisa under', 49_999.99, '50000.00', 'less'],
    ['a paisa over', 50_000.01, '50000.00', 'more'],
    ['nothing typed', null, '50000.00', null],
    ['zero typed: nothing to say', 0, '50000.00', null],
  ] as const)('%s', (_, typed, left, said) => {
    expect(amountAgainstLeft(typed, left, 2)).toBe(said);
  });
});
