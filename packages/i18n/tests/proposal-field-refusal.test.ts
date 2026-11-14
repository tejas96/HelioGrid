import { describe, expect, it } from 'vitest';
import { proposalFieldRefusalWords } from '../src/copy/proposal-builder-refusals';
import { createTranslator } from '../src/runtime';

const failed = (code: string | null, paths: readonly string[]) => ({
  kind: 'failed',
  failure: null,
  code,
  message: 'The server’s own sentence.',
  details: paths.map((path) => ({ path, issue: 'any' })),
});

describe('proposalFieldRefusalWords — a refusal the server names by its field, said there (F8-36)', () => {
  it.each([
    [
      'a fourth brand in a section (M06-27)',
      failed('DOMAIN_RULE_VIOLATION', ['fields.components']),
      'Up to 3 brands. Remove one to add another.',
    ],
    ['a rule broken at another field', failed('DOMAIN_RULE_VIOLATION', ['fields.terms']), null],
    [
      'the parts named under another code',
      failed('VALIDATION_FAILED', ['fields.components']),
      null,
    ],
    ['no field named', failed('DOMAIN_RULE_VIOLATION', []), null],
    ['a refusal domain names', { kind: 'refused', refusal: 'lead_closed' }, null],
    [
      'an amount the device held, past the wire’s whole digits',
      { kind: 'refused', refusal: 'amount_too_large' },
      'Too large to record — an amount has at most 12 digits before the point.',
    ],
    ['nothing at all', null, null],
  ])('%s', async (_, failure, words) => {
    const { t } = await createTranslator('en');
    expect(proposalFieldRefusalWords(t, failure)).toBe(words);
  });
});
