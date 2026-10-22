import {
  type FirstRunProfileEvent,
  firstRunProfileFrame,
  firstRunProfileReducer,
  firstRunProfileStart,
} from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { type FirstRunProfileWords, firstRunProfileWords } from '../src/copy/first-run-profile';
import { createTranslator } from '../src/runtime';

/** First-Run Profile's words (`SCR-M01-09`): the board's, word for word, the pronoun ruled out (ruling 15). */
const FACTS = {
  inviterName: 'Rajesh Kulkarni',
  invitedName: 'Anjali Kulkarni',
  companyName: 'Suryodaya Solar',
};
const PNG = { contentType: 'image/png', byteSize: 1_000, picture: 'blob:a' };

let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

function wordsAfter(...events: readonly FirstRunProfileEvent[]): FirstRunProfileWords {
  const state = events.reduce(firstRunProfileReducer, firstRunProfileStart(FACTS.invitedName));
  return firstRunProfileWords(t, firstRunProfileFrame(state), FACTS);
}

const savedThenPhotoFailed = [
  { type: 'photo-chosen', image: PNG },
  { type: 'save' },
  { type: 'name-ended', saved: true },
  { type: 'photo-ended', saved: false },
] as const;

describe('the name helper', () => {
  it.each([
    ['normal', [], 'Rajesh typed this when inviting you — change it if you like.'],
    [
      'empty',
      [{ type: 'name-typed', name: '' }],
      'Rajesh had typed Anjali Kulkarni; type the name your team should use.',
    ],
  ] as const)('%s reads the inviter by first name, no pronoun', (_, events, helper) => {
    expect(wordsAfter(...events).name.helper).toBe(helper);
  });

  it('an empty name pressed says so on the field', () => {
    expect(wordsAfter({ type: 'name-typed', name: '' }, { type: 'save' }).name.error).toBe(
      'Your name is empty — type the name your team should call you.',
    );
  });
});

describe('the act and the refusals', () => {
  it.each([
    ['normal', [], 'Save and continue', null],
    [
      'error-photo',
      savedThenPhotoFailed,
      'Continue without a photo',
      'Saved. Your team sees this name now.',
    ],
  ] as const)('%s → %s', (_, events, act, success) => {
    const words = wordsAfter(...events);
    expect(words.act).toBe(act);
    expect(words.name.success).toBe(success);
  });

  it('error-photo: the retry act, and each width its own line', () => {
    const { photo } = wordsAfter(...savedThenPhotoFailed);
    expect(photo.choosePhone).toBe('Try the photo again');
    expect(photo.error).toEqual({
      title: 'That photo did not upload',
      phone: 'You can add one later in Profile & preferences.',
      wide: 'Try again, or add one later.',
    });
  });

  it('error-save: the banner, nothing lost', () => {
    const words = wordsAfter({ type: 'save' }, { type: 'name-ended', saved: false });
    expect(words.saveFailed).toEqual({
      title: 'Your profile did not save',
      line: 'Nothing was lost — press Save and continue to try again.',
    });
  });

  it.each([
    ['a gif', { ...PNG, contentType: 'image/gif' }, 'Needs a PNG or JPG'],
    ['3 MB', { ...PNG, byteSize: 3_000_000 }, '3 MB · needs 2 MB or less'],
  ])('a refused photo — %s — reads the logo line', (_, image, line) => {
    const { error } = wordsAfter({ type: 'photo-chosen', image }).photo;
    expect(error).toEqual({ title: 'That photo cannot be used', phone: line, wide: line });
  });

  it('loading states why the act waits', () => {
    const words = firstRunProfileWords(t, firstRunProfileFrame(firstRunProfileStart(null)), FACTS);
    expect(words.actReason).toBe('Your name is still arriving.');
  });
});

describe('the reasons never change by state', () => {
  it('the phone and 1536 each say why, naming the company', () => {
    const words = wordsAfter();
    expect(words.reasons[0]).toBe('Suryodaya Solar sees this name beside everything you do.');
    expect(words.about.pages[1]).toBe('A photo helps teammates recognise you on a shared job.');
    expect(words.reasons[1]).toBe('A photo helps teammates recognise you.');
    expect(wordsAfter({ type: 'save' }, { type: 'name-ended', saved: false }).reasons).toEqual(
      words.reasons,
    );
  });
});
