import { describe, expect, it } from 'vitest';
import type { TrancheLine } from '../../src/commerce';
import { basisPoints } from '../../src/money';
import {
  PROPOSAL_LIMITS,
  type ProposalPhase,
  priceSheetsOf,
  proposalSheetsOf,
  timelineSheetsOf,
} from '../../src/proposals';
import { aFieldSet, withSystem } from './proposal-fixture';

/** A step at its longest: the name and the sentence each at their limits. */
const LONGEST: ProposalPhase = {
  name: 'N'.repeat(PROPOSAL_LIMITS.phaseName),
  description: 'Words '.repeat(PROPOSAL_LIMITS.phaseDescription / 6).trim(),
  durationDays: 30,
};
const SHORT: ProposalPhase = {
  name: 'Installation',
  description: 'A crew fits it.',
  durationDays: 2,
};

const steps = (count: number, phase: ProposalPhase) => Array.from({ length: count }, () => phase);
const parts = (count: number): TrancheLine[] =>
  Array.from({ length: count }, () => ({
    label: 'Part',
    share: basisPoints(Math.floor(10000 / count)),
    dueOnStage: 'dispatched',
  }));

describe('the timeline over its sheets', () => {
  it.each([
    [0, SHORT, [{ from: 0, to: 0 }]],
    [5, SHORT, [{ from: 0, to: 5 }]],
    [9, SHORT, [{ from: 0, to: 9 }]],
    [
      10,
      SHORT,
      [
        { from: 0, to: 9 },
        { from: 9, to: 10 },
      ],
    ],
    [5, LONGEST, [{ from: 0, to: 5 }]],
    [
      6,
      LONGEST,
      [
        { from: 0, to: 5 },
        { from: 5, to: 6 },
      ],
    ],
  ])('%i steps print on their sheets, never one past the room', (count, phase, sheets) => {
    expect(timelineSheetsOf(steps(count, phase))).toEqual(sheets);
  });

  it('twenty steps at their longest keep every step, in order, on four sheets', () => {
    const sheets = timelineSheetsOf(steps(20, LONGEST));
    expect(sheets.length).toBe(4);
    expect(sheets.map((sheet) => sheet.to - sheet.from).reduce((a, b) => a + b)).toBe(20);
    expect(sheets.at(-1)?.to).toBe(20);
  });
});

describe('the price page over its sheets', () => {
  it('a plan of four with no EMI is one sheet holding everything, what is included too', () => {
    expect(priceSheetsOf(aFieldSet({ payment: { templateId: null, tranches: parts(4) } }))).toEqual(
      [{ price: true, split: { from: 0, to: 4, head: true }, emi: false, included: true }],
    );
  });

  it.each([6, 7])('a plan of %i parts with the EMI on carries what does not fit', (count) => {
    const fields = {
      ...withSystem({ emi: { rate: basisPoints(950), tenureYears: 5 } }),
      payment: { templateId: null, tranches: parts(count) },
    };
    const sheets = priceSheetsOf(fields);
    expect(sheets[0]?.price).toBe(true);
    expect(sheets[0]?.split?.head).toBe(true);
    expect(sheets.some((sheet) => sheet.emi)).toBe(true);
  });

  it('twelve parts run on to a second sheet with no second head, every part printed once', () => {
    const sheets = priceSheetsOf(aFieldSet({ payment: { templateId: null, tranches: parts(12) } }));
    expect(sheets.length).toBe(2);
    expect(sheets[1]?.split?.head).toBe(false);
    expect(sheets[0]?.split?.to).toBe(sheets[1]?.split?.from);
    expect(sheets[1]?.split?.to).toBe(12);
  });

  it('the document counts every sheet the timeline and the price take', () => {
    const fields = aFieldSet({
      timeline: steps(20, LONGEST),
      payment: { templateId: null, tranches: parts(12) },
    });
    const sheets = proposalSheetsOf(['cover', 'price', 'timeline', 'bank'], fields);
    expect(sheets.filter((sheet) => sheet.page === 'price').length).toBe(2);
    expect(sheets.filter((sheet) => sheet.page === 'timeline').length).toBe(4);
  });
});
