import type { InboxActState, UiLanguage } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { bulkAssignToasts, inboxActWords } from '../src/copy/lead-inbox-acts';
import { createTranslator } from '../src/runtime';

const ASSIGN: InboxActState = {
  act: 'assign',
  assignee: { userId: 'u-1', name: 'Rajesh Jadhav' },
  returned: null,
};
const JUNK: InboxActState = { act: 'junk', assignee: null, returned: null };

async function returnedWords(act: InboxActState, code: string, reader: UiLanguage = 'en') {
  const { t } = await createTranslator(reader);
  return inboxActWords(t).returned(act, { kind: 'refused', code });
}

describe('inboxActWords — an act the server refused says why in the catalog’s words (M02-67)', () => {
  it.each([
    [ASSIGN, 'FORBIDDEN', "Not assigned — You don't have access to do that."],
    [
      ASSIGN,
      'REASSIGN_REASON_REQUIRED',
      'Not assigned — Something went wrong on our side. Try again.',
    ],
    [
      ASSIGN,
      'A_CODE_A_NEWER_SERVER_LEARNED',
      'Not assigned — Something went wrong on our side. Try again.',
    ],
    [JUNK, 'INTERNAL', 'Not binned — Something went wrong on our side. Try again.'],
  ])('%#: %s refused with %s', async (act, code, sentence) => {
    expect(await returnedWords(act, code)).toBe(sentence);
  });

  it.each(['hi', 'mr'] as const)(
    'a code with no words of its own is still read in %s',
    async (reader) => {
      const english = await returnedWords(ASSIGN, 'REASSIGN_REASON_REQUIRED');
      const translated = await returnedWords(ASSIGN, 'REASSIGN_REASON_REQUIRED', reader);
      expect(translated).not.toBe(english);
      expect(translated).not.toMatch(/[A-Za-z]{3,}/);
    },
  );

  it('someone else holding the lead names who', async () => {
    const { t } = await createTranslator('en');
    expect(inboxActWords(t).returned(ASSIGN, { kind: 'taken', owner: 'Neha Kulkarni' })).toBe(
      'Not assigned — Neha Kulkarni has it already.',
    );
  });
});

describe('bulkAssignToasts — a bulk assign’s one line (M02-29)', () => {
  it.each([
    ['no report', null, []],
    [
      'every lead given',
      { given: 3, refused: 0, name: 'Neha Kulkarni' },
      [{ id: 'bulk', tone: 'success', title: '3 leads given to Neha Kulkarni' }],
    ],
    [
      'some stayed',
      { given: 1, refused: 2, name: 'Neha Kulkarni' },
      [
        {
          id: 'bulk',
          tone: 'warning',
          title: '1 lead given to Neha Kulkarni',
          description: "2 couldn't be given — they stay, with the reason",
        },
      ],
    ],
  ] as const)('%s', async (_, report, toasts) => {
    const { t } = await createTranslator('en');
    expect(bulkAssignToasts(t, report)).toEqual(toasts);
  });
});
