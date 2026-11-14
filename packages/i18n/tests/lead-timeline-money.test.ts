import { IN_FORMATS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { type LeadTimelineEntryFacts, leadTimelineEntryWords } from '../src/copy/lead-timeline';
import { createTranslator } from '../src/runtime';

const formats = {
  pack: IN_FORMATS,
  day: (date: string) => date,
  time: (hhmm: string) => hhmm,
  word: (_kind: 'stage' | 'party' | 'reason' | 'row' | 'step' | 'area', key: string) => key,
};

const billChange = (from: string | null, to: string | null) =>
  ({
    known: true,
    activity: {
      id: 'entry-1',
      kind: 'field_change',
      appliedAt: '2026-11-14T08:00:00.000Z',
      actor: { kind: 'user', name: 'Asha Patil' },
      body: { field: 'monthlyBill', from, to },
    },
  }) as unknown as LeadTimelineEntryFacts;

describe('the lead timeline prints a bill as the server wrote it, never rounded', () => {
  it.each<[string, string | null, string | null, string]>([
    ['a paisa shows on both sides', '3000.00', '3450.50', '₹3,000.00 → ₹3,450.50'],
    ['two whole amounts leave the fraction unsaid', '3000.00', '3500.00', '₹3,000 → ₹3,500'],
    ['a first bill', null, '2999.99', 'Not set → ₹2,999.99'],
  ])('%s', async (_, from, to, detail) => {
    const { t } = await createTranslator('en');
    expect(leadTimelineEntryWords(t, formats, billChange(from, to)).detail).toBe(detail);
  });
});

const generated = (payable: string) =>
  ({
    known: true,
    activity: {
      id: 'entry-2',
      kind: 'proposal_generated',
      appliedAt: '2026-11-14T08:00:00.000Z',
      actor: { kind: 'user', name: 'Asha Patil' },
      body: { proposalId: 'p1', number: 'PRP-0042', version: 2, payable },
    },
  }) as unknown as LeadTimelineEntryFacts;

describe('a generated proposal’s price on the lead timeline is never rounded', () => {
  it.each([
    ['205000.00', '₹2,05,000'],
    ['214345.50', '₹2,14,345.50'],
  ])('%s → %s', async (payable, printed) => {
    const { t } = await createTranslator('en');
    expect(leadTimelineEntryWords(t, formats, generated(payable)).detail).toBe(printed);
  });
});
