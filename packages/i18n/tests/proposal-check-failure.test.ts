import { describe, expect, it } from 'vitest';
import { builderCheckFailureWords } from '../src/copy/proposal-builder-check-said';
import { proposalStepNames } from '../src/copy/proposal-builder-frame';
import { proposalStepWords } from '../src/copy/proposal-builder-steps';
import { createTranslator } from '../src/runtime';

/** A fourth brand, refused by the server at the parts (`M06-27`), as the draft queue keeps it. */
const FOURTH_BRAND = {
  kind: 'failed',
  failure: null,
  code: 'DOMAIN_RULE_VIOLATION',
  message: 'The server’s own sentence.',
  details: [{ path: 'fields.components', issue: 'any' }],
} as const;

describe('builderCheckFailureWords — why Generate came back undone, said on the Check sheet', () => {
  it.each([
    [
      'a refused value on a step names the step and why',
      'components',
      'Not saved in Components: Up to 3 brands. Remove one to add another.',
    ],
    [
      'a refused value no step owns says only why',
      null,
      'Up to 3 brands. Remove one to add another.',
    ],
  ] as const)('%s', async (_, step, words) => {
    const { t } = await createTranslator('en');
    const said = { names: proposalStepNames(t), shared: proposalStepWords(t) };
    const failure = { kind: 'refused_field', step, failure: FOURTH_BRAND } as const;
    expect(builderCheckFailureWords(t, failure, said)).toBe(words);
  });

  it('a value not yet saved keeps the field’s own retry words', async () => {
    const { t } = await createTranslator('en');
    const said = { names: proposalStepNames(t), shared: proposalStepWords(t) };
    expect(builderCheckFailureWords(t, { kind: 'unsaved' }, said)).toBe(said.shared.notSaved);
  });
});
