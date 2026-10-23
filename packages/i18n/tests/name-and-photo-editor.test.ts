import {
  type FirstRunProfileEvent,
  firstRunProfileFrame,
  firstRunProfileReducer,
  profileEditorStart,
} from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type NameAndPhotoEditorWords,
  nameAndPhotoEditorWords,
} from '../src/copy/name-and-photo-editor';
import { createTranslator } from '../src/runtime';

/** The *Edit name* editor's words (`SCR-M01-11`): the board's, word for word, and ruling 4's. */
const SAVED = 'https://store.example/photo';
const PNG = { contentType: 'image/png', byteSize: 1_000, picture: 'blob:a' };

let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

function wordsAfter(
  saved: string | null,
  ...events: readonly FirstRunProfileEvent[]
): NameAndPhotoEditorWords {
  const state = events.reduce(
    firstRunProfileReducer,
    profileEditorStart('Anjali Joshi', { held: saved !== null, picture: saved }),
  );
  return nameAndPhotoEditorWords(t, firstRunProfileFrame(state));
}

const failedWrite = [
  { type: 'save' },
  { type: 'photo-ended', saved: false },
] as const satisfies readonly FirstRunProfileEvent[];

describe('the editor', () => {
  it('opens titled as the board draws it, the act Save', () => {
    const words = wordsAfter(null);
    expect(words.title).toBe('Your name and photo');
    expect(words.close).toBe('Close');
    expect(words.act).toBe('Save');
    expect(words.photo.choosePhone).toBe('Add a photo');
    expect(words.photo.chooseWide).toBe('Choose a photo');
    expect(words.name.error).toBeNull();
    expect(words.saveFailed).toBeNull();
  });

  it('a cleared name pressed answers on the field', () => {
    const words = wordsAfter(SAVED, { type: 'name-typed', name: '' }, { type: 'save' });
    expect(words.name.error).toBe('Your name is empty — type the name your team should call you.');
  });

  it('a refused name shows the banner', () => {
    const words = wordsAfter(
      null,
      { type: 'name-typed', name: 'Anjali Kulkarni' },
      { type: 'save' },
      { type: 'name-ended', saved: false },
    );
    expect(words.saveFailed).toEqual({
      title: 'Your name did not save',
      line: 'Press Save to try again.',
    });
  });

  it.each([
    [
      'an upload',
      [{ type: 'photo-chosen', image: PNG }],
      'That photo did not upload',
      'Try again, or add one later.',
    ],
    [
      'a removal',
      [{ type: 'photo-removed' }],
      'Your photo was not removed',
      'Try again, or remove it later.',
    ],
  ] as const)(
    'a failed %s names itself, the act Done and the retry its own',
    (_, before, title, line) => {
      const words = wordsAfter(SAVED, ...before, ...failedWrite);
      expect(words.photo.error).toEqual({ title, line });
      expect(words.act).toBe('Done');
      expect(words.photo.choosePhone).toBe('Try the photo again');
      expect(words.name.success).toBe('Saved. Your team sees this name now.');
    },
  );

  it('a photo the device refused reads the limit line', () => {
    const words = wordsAfter(null, {
      type: 'photo-chosen',
      image: { contentType: 'image/png', byteSize: 3_000_000, picture: null },
    });
    expect(words.photo.error?.title).toBe('That photo cannot be used');
    expect(words.photo.error?.line).toMatch(/2/);
  });
});
