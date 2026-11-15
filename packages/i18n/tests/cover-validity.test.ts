import type { ProposalDraftValueSet } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { proposalCoverWords } from '../src/copy/proposal-document-cover';
import { createTranslator } from '../src/runtime';

/*
 * The cover's validity line (`M06-15`) prints the days the server read off the terms — never a
 * guess from the reader's language. Only what the cover's words read is filled in.
 */
function coverOf(validityDays: number | null): ProposalDraftValueSet {
  return {
    fields: { system: { capacityKw: null }, company: { proposalType: 'customer_owns' } },
    deal: { segment: 'residential', area: null },
    money: null,
    preparedBy: { name: 'Rahul Patil', phoneE164: null },
    validityDays,
  } as unknown as ProposalDraftValueSet;
}

const format = { number: String, amount: String, phone: String };

describe('the cover’s validity line', () => {
  it.each([
    ['en', 'Valid for 30 days'],
    ['hi', /30/],
    ['mr', /30/],
  ] as const)('a %s reader of terms stating 30 days reads the line', async (language, line) => {
    const { t } = await createTranslator(language);
    const words = proposalCoverWords(t, { snapshot: coverOf(30), format, taxName: 'GST' });
    expect(words.cover.validity).toMatch(line);
  });

  it('a company’s own terms print none', async () => {
    const { t } = await createTranslator('hi');
    const words = proposalCoverWords(t, { snapshot: coverOf(null), format, taxName: 'GST' });
    expect(words.cover.validity).toBeUndefined();
  });
});
