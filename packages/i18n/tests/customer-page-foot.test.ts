import { PROPOSAL_VALIDITY_DAYS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { customerProposalWords } from '../src/copy/customer-page-proposal';
import { createTranslator } from '../src/runtime';

const facts = {
  companyName: 'Suryodaya Solar',
  customerName: 'Anil Sharma',
  customerSegment: 'residential',
  personName: null,
  personPhone: null,
} as const;

/* The customer page's foot says how long the proposal stands: the days the server read off its terms. */
describe('the customer page foot names the validity the server states', () => {
  it('the platform terms: their days after the number and version', async () => {
    const { t } = await createTranslator('en');
    const foot = customerProposalWords(t, facts).foot;
    expect(foot.version('PRP-0042', 1, PROPOSAL_VALIDITY_DAYS)).toBe(
      `PRP-0042 · version 1 · valid for ${PROPOSAL_VALIDITY_DAYS} days`,
    );
  });

  it.each(['hi', 'mr'] as const)(
    'a %s reader keeps the line, whatever language the terms were filled in',
    async (language) => {
      const { t } = await createTranslator(language);
      const line = customerProposalWords(t, facts).foot.version('PRP-0042', 1, 30);
      expect(line).toMatch(/30/);
      expect(line).not.toBe(customerProposalWords(t, facts).foot.version('PRP-0042', 1, null));
    },
  );

  it.each<[string, string | null, string]>([
    ['a number', 'PRP-0042', 'PRP-0042 · version 2'],
    ['no number yet', null, 'Version 2'],
  ])('the company’s own terms, %s: no validity', async (_case, number, line) => {
    const { t } = await createTranslator('en');
    expect(customerProposalWords(t, facts).foot.version(number, 2, null)).toBe(line);
  });
});
