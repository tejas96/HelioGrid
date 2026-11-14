import { describe, expect, it } from 'vitest';
import {
  type ProposalActFailureLike,
  proposalActFailureWords,
} from '../src/copy/proposal-screens-words';
import { createTranslator } from '../src/runtime';

async function wordsOf(failure: ProposalActFailureLike) {
  const { t } = await createTranslator('en');
  return proposalActFailureWords(t, failure);
}

describe('proposalActFailureWords — a refused act says why where the person acted (F8-36)', () => {
  it.each<[string, string, string]>([
    ['a proposal refusal domain names', 'not_generated', 'Not done. Generate the proposal first.'],
    [
      'a version past the latest, or none at all (M08-50)',
      'version_unknown',
      'Not done. That version is not on this proposal.',
    ],
    [
      'a version already in force, or an older one (M08-50)',
      'version_already_in_force',
      'Not done. That version is already in force, or a newer one is.',
    ],
    [
      'a refusal a newer server learned',
      'a_newer_refusal',
      'Not done. The proposal does not allow it now.',
    ],
  ])('%s', async (_, refusal, sentence) => {
    expect(await wordsOf({ kind: 'refused', refusal })).toBe(sentence);
  });
});
