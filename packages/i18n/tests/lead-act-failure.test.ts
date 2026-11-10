import type { LeadActFailure, UiLanguage } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { leadActFailureWords } from '../src/copy/lead-act-failure';
import { createTranslator } from '../src/runtime';

async function wordsOf(failure: LeadActFailure, reader: UiLanguage = 'en') {
  const { t } = await createTranslator(reader);
  return leadActFailureWords(t, failure);
}

const failed = (code: string | undefined, message = 'The server’s own sentence.') =>
  ({ kind: 'failed', failure: null, code, message }) as const;

describe('leadActFailureWords — an act that came back undone says why where the person acted', () => {
  it.each<[string, LeadActFailure, string]>([
    [
      'a call-back to a wrong or do-not-call number (M02-44)',
      { kind: 'not_diallable' },
      'No call-back added. This number is marked wrong or do-not-call.',
    ],
    [
      'a refusal domain names',
      { kind: 'refused', refusal: 'not_snoozed' },
      'Not woken. The lead is not snoozed any more.',
    ],
    [
      'a refusal a newer server learned',
      { kind: 'refused', refusal: 'a_newer_refusal' },
      'Not done. The lead is not open.',
    ],
    [
      'no readable answer, never claimed as failed (F8-36)',
      { kind: 'failed', failure: 'no_answer', code: undefined, message: '' },
      'HelioGrid did not answer in time. If you were saving, check whether it saved before trying again.',
    ],
    ['a code with words of its own', failed('FORBIDDEN'), "You don't have access to do that."],
    ['a code with none, shown as sent', failed('A_NEWER_CODE'), 'The server’s own sentence.'],
  ])('%s', async (_, failure, sentence) => {
    expect(await wordsOf(failure)).toBe(sentence);
  });

  it.each(['hi', 'mr'] as const)(
    'the number that may not be called is said in %s',
    async (reader) => {
      const english = await wordsOf({ kind: 'not_diallable' });
      const translated = await wordsOf({ kind: 'not_diallable' }, reader);
      expect(translated).not.toBe(english);
      expect(translated).not.toBe('');
    },
  );
});
