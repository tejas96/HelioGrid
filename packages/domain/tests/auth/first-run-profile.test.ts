import { describe, expect, it } from 'vitest';
import {
  type FirstRunProfileEvent,
  type FirstRunProfileState,
  firstRunProfileFrame,
  firstRunProfileReducer,
  firstRunProfileStart,
} from '../../src/auth/first-run-profile';

const PNG = { contentType: 'image/png', byteSize: 1_000, picture: 'blob:a' };

function run(events: readonly FirstRunProfileEvent[], name = 'Anjali Kulkarni') {
  return events.reduce(firstRunProfileReducer, firstRunProfileStart(name));
}

describe('the name the person saves', () => {
  it.each([
    ['empty', '', 'empty-pressed', 'editing'],
    ['one space', ' ', 'empty-pressed', 'editing'],
    ['a name', 'Anjali', 'normal', 'saving-name'],
  ] as const)('a %s name pressed → %s, phase %s', (_, name, kind, phase) => {
    const state = run([{ type: 'name-typed', name }, { type: 'save' }]);
    expect(firstRunProfileFrame(state).kind).toBe(kind);
    expect(state.phase).toBe(phase);
  });

  it.each([
    [120, 120],
    [121, 120],
    [119, 119],
  ])('a name typed %i characters long keeps %i', (typed, kept) => {
    const state = run([{ type: 'name-typed', name: 'a'.repeat(typed) }]);
    expect(state.name).toHaveLength(kept);
  });

  it('an emptied field reads empty before the act, and the pressed refusal clears once a name is typed', () => {
    const emptied = run([{ type: 'name-typed', name: '' }]);
    expect(firstRunProfileFrame(emptied).kind).toBe('empty');
    const typed = firstRunProfileReducer(firstRunProfileReducer(emptied, { type: 'save' }), {
      type: 'name-typed',
      name: 'A',
    });
    expect(firstRunProfileFrame(typed).kind).toBe('normal');
  });

  it('a second press while the name is out sends nothing new', () => {
    const saving = run([{ type: 'save' }]);
    expect(firstRunProfileReducer(saving, { type: 'save' })).toBe(saving);
    expect(firstRunProfileFrame(saving).busy).toBe(true);
  });

  it('a name refused → error-save with the name kept; the act tries again', () => {
    const refused = run([{ type: 'save' }, { type: 'name-ended', saved: false }]);
    expect(firstRunProfileFrame(refused).kind).toBe('error-save');
    expect(refused.name).toBe('Anjali Kulkarni');
    expect(firstRunProfileReducer(refused, { type: 'save' }).phase).toBe('saving-name');
  });

  it('a name emptied after a refused save answers on the field, not the old banner', () => {
    const state = run([
      { type: 'save' },
      { type: 'name-ended', saved: false },
      { type: 'name-typed', name: '' },
      { type: 'save' },
    ]);
    expect(firstRunProfileFrame(state).kind).toBe('empty-pressed');
  });

  it('a photo chosen or removed after a refused save keeps the refusal', () => {
    const refused = run([{ type: 'save' }, { type: 'name-ended', saved: false }]);
    for (const event of [
      { type: 'photo-chosen', image: PNG },
      { type: 'photo-removed' },
    ] as const) {
      expect(firstRunProfileFrame(firstRunProfileReducer(refused, event)).kind).toBe('error-save');
    }
  });

  it('the photo is not changed while the name is out', () => {
    const saving = run([{ type: 'photo-chosen', image: PNG }, { type: 'save' }]);
    expect(firstRunProfileReducer(saving, { type: 'photo-removed' })).toBe(saving);
  });

  it('a name saved with no photo is done', () => {
    expect(run([{ type: 'save' }, { type: 'name-ended', saved: true }]).phase).toBe('done');
  });
});

describe('the photo', () => {
  it.each([
    ['png at the limit', 'image/png', 2_000_000, 'photo-added'],
    ['png one byte over', 'image/png', 2_000_001, 'photo-refused'],
    ['jpeg', 'image/jpeg', 10, 'photo-added'],
    ['gif', 'image/gif', 10, 'photo-refused'],
  ] as const)('a %s → %s', (_, contentType, byteSize, kind) => {
    const state = run([{ type: 'photo-chosen', image: { ...PNG, contentType, byteSize } }]);
    expect(firstRunProfileFrame(state).kind).toBe(kind);
  });

  it('a refused photo names what it missed and the size as shown', () => {
    const big = run([{ type: 'photo-chosen', image: { ...PNG, byteSize: 3_000_001 } }]).photo;
    const gif = run([{ type: 'photo-chosen', image: { ...PNG, contentType: 'image/gif' } }]).photo;
    expect(big).toEqual({ kind: 'refused', missed: 'size', megabytes: 3.1 });
    expect(gif).toMatchObject({ kind: 'refused', missed: 'type' });
  });

  it('a refused photo is never sent: the save sends the name and is done', () => {
    const state = run([
      { type: 'photo-chosen', image: { ...PNG, contentType: 'image/gif' } },
      { type: 'save' },
      { type: 'name-ended', saved: true },
    ]);
    expect(state.phase).toBe('done');
  });

  it('Remove brings the initials back', () => {
    const state = run([{ type: 'photo-chosen', image: PNG }, { type: 'photo-removed' }]);
    expect(state.photo).toEqual({ kind: 'none' });
    expect(firstRunProfileFrame(state).kind).toBe('normal');
  });

  it('a chosen photo goes after the name, and its save is done', () => {
    const named = run([
      { type: 'photo-chosen', image: PNG },
      { type: 'save' },
      { type: 'name-ended', saved: true },
    ]);
    expect(named.phase).toBe('saving-photo');
    expect(firstRunProfileReducer(named, { type: 'photo-ended', saved: true }).phase).toBe('done');
  });

  describe('a photo refused at the store, the confirm or the pointer', () => {
    const failed: FirstRunProfileState = run([
      { type: 'photo-chosen', image: PNG },
      { type: 'save' },
      { type: 'name-ended', saved: true },
      { type: 'photo-ended', saved: false },
    ]);

    it('→ error-photo: the name reads saved and the act continues without it', () => {
      const frame = firstRunProfileFrame(failed);
      expect(frame).toMatchObject({ kind: 'error-photo', act: 'continue', nameSaved: true });
      expect(frame.photoAct).toBe('retry');
    });

    it('the retry sends the photo alone', () => {
      expect(firstRunProfileReducer(failed, { type: 'retry-photo' }).phase).toBe('saving-photo');
    });

    it('Continue without a photo is done', () => {
      expect(firstRunProfileReducer(failed, { type: 'save' }).phase).toBe('done');
    });

    it('a name typed again is saved again before the photo', () => {
      const typed = firstRunProfileReducer(failed, { type: 'name-typed', name: 'Anjali K' });
      expect(firstRunProfileFrame(typed).act).toBe('save');
      expect(firstRunProfileReducer(typed, { type: 'save' }).phase).toBe('saving-name');
    });
  });
});

describe('arriving', () => {
  it('with no name yet the screen waits and its act refuses', () => {
    const waiting = firstRunProfileStart(null);
    expect(firstRunProfileFrame(waiting).kind).toBe('loading');
    expect(firstRunProfileReducer(waiting, { type: 'save' })).toBe(waiting);
    const arrived = firstRunProfileReducer(waiting, { type: 'arrived', name: 'Anjali' });
    expect(firstRunProfileFrame(arrived).kind).toBe('normal');
  });

  it('nothing is heard once done', () => {
    const done = run([{ type: 'save' }, { type: 'name-ended', saved: true }]);
    expect(firstRunProfileReducer(done, { type: 'name-typed', name: 'x' })).toBe(done);
  });
});
