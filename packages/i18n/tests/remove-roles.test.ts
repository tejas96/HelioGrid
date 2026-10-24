import { ROLE_PRESETS, roleChange, type UiLanguage } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import {
  removeRolesWords,
  rolesRemovedToast,
  rolesUndoFailedToast,
} from '../src/copy/remove-roles';
import { createTranslator } from '../src/runtime';

const [OWNER, , SALES, SURVEY, DESIGN, PROJECTS, , INSTALL, , FINANCE] = ROLE_PRESETS;
const VIKRAM = 'Vikram Deshpande';

async function confirmFor(
  before: Parameters<typeof roleChange>[0],
  after: Parameters<typeof roleChange>[1],
  reader: UiLanguage = 'en',
) {
  const { t } = await createTranslator(reader);
  return removeRolesWords(t, { name: VIKRAM, change: roleChange(before, after) });
}

describe('removeRolesWords — the confirm names what leaves and what is lost (m-confirm)', () => {
  it('one preset leaving, its clause lost — the board, word for word (Decision 2A)', async () => {
    expect(await confirmFor([SURVEY, DESIGN, INSTALL], [SURVEY, INSTALL])).toEqual({
      title: 'Remove Design Engineer from Vikram?',
      go: 'Remove role',
      leave: 'Cancel',
      body: 'Once saved, Vikram can no longer design.',
      note: {
        lead: 'You can give it back at any time',
        rest: " — tick Design Engineer on Vikram's row again.",
      },
    });
  });

  it('two leaving: both named with the language’s and, the plural act and note', async () => {
    const words = await confirmFor([SURVEY, DESIGN, INSTALL], [SURVEY]);
    expect(words.title).toBe('Remove Design Engineer and Installation Team Member from Vikram?');
    expect(words.go).toBe('Remove roles');
    expect(words.body).toBe('Once saved, Vikram can no longer design and install.');
    expect(words.note.lead).toBe('You can give them back at any time');
    expect(words.note.rest).toBe(
      " — tick Design Engineer and Installation Team Member on Vikram's row again.",
    );
  });

  it('several leaving: a comma list, then and', async () => {
    const words = await confirmFor([SURVEY, DESIGN, INSTALL, FINANCE], [FINANCE]);
    expect(words.title).toBe(
      'Remove Survey Engineer, Design Engineer and Installation Team Member from Vikram?',
    );
    expect(words.body).toBe('Once saved, Vikram can no longer survey, design and install.');
  });

  it('a loss a kept preset covers says no lost line', async () => {
    const words = await confirmFor([OWNER, DESIGN], [OWNER]);
    expect(words.title).toBe('Remove Design Engineer from Vikram?');
    expect(words.body).toBeUndefined();
  });

  it('a mixed save names only what leaves', async () => {
    const words = await confirmFor([SALES, PROJECTS], [SALES, FINANCE]);
    expect(words.title).toBe('Remove Project Manager from Vikram?');
    expect(words.body).toBe('Once saved, Vikram can no longer run projects.');
  });

  it.each<UiLanguage>(['hi', 'mr'])('%s words every line, and keeps the names', async (reader) => {
    const english = await confirmFor([SURVEY, DESIGN, INSTALL], [SURVEY]);
    const words = await confirmFor([SURVEY, DESIGN, INSTALL], [SURVEY], reader);
    for (const key of ['title', 'go', 'leave', 'body'] as const) {
      expect(words[key]).not.toBe(english[key]);
    }
    expect(words.note.lead).not.toBe(english.note.lead);
    expect(words.note.rest).not.toBe(english.note.rest);
    expect(words.title).toContain('Vikram');
    expect(words.note.rest).toContain('Vikram');
  });
});

describe('rolesRemovedToast — the after-state and its undo (m-after)', () => {
  it('one removed — the board, word for word, the first name for the way back', async () => {
    const { t } = await createTranslator('en');
    expect(rolesRemovedToast(t, { name: VIKRAM, removed: [DESIGN] })).toEqual({
      tone: 'neutral',
      title: 'Design Engineer removed from Vikram Deshpande',
      description: "Tick it again on Vikram's row whenever you like.",
      undoLabel: 'Undo',
    });
  });

  it('two removed take the plural line', async () => {
    const { t } = await createTranslator('en');
    const toast = rolesRemovedToast(t, { name: VIKRAM, removed: [DESIGN, INSTALL] });
    expect(toast.title).toBe(
      'Design Engineer and Installation Team Member removed from Vikram Deshpande',
    );
    expect(toast.description).toBe("Tick them again on Vikram's row whenever you like.");
  });

  it.each<UiLanguage>(['hi', 'mr'])('%s words the toast', async (reader) => {
    const en = (await createTranslator('en')).t;
    const { t } = await createTranslator(reader);
    const facts = { name: VIKRAM, removed: [DESIGN] };
    const ours = rolesRemovedToast(t, facts);
    const english = rolesRemovedToast(en, facts);
    expect(ours.title).not.toBe(english.title);
    expect(ours.description).not.toBe(english.description);
    expect(ours.undoLabel).not.toBe(english.undoLabel);
    expect(ours.title).toContain(VIKRAM);
  });
});

describe('rolesUndoFailedToast — an undo that did not land says why', () => {
  const facts = { name: VIKRAM, removed: [DESIGN], companyName: 'Suryodaya Solar' };

  it('a failed undo: the save’s title, and the way back on the row — no Save is on screen', async () => {
    const { t } = await createTranslator('en');
    expect(rolesUndoFailedToast(t, { kind: 'failed' }, facts)).toEqual({
      tone: 'danger',
      title: "Vikram's roles weren't saved",
      description: "Tick it again on Vikram's row whenever you like.",
    });
  });

  it('a person gone meanwhile: the save’s own words', async () => {
    const { t } = await createTranslator('en');
    expect(rolesUndoFailedToast(t, { kind: 'gone' }, facts)).toEqual({
      tone: 'danger',
      title: "Vikram's roles weren't saved",
      description: 'Vikram is no longer active on this team, so nothing changed.',
    });
  });

  it('an undo nobody can confirm leads with the transport’s line alone (F8-36)', async () => {
    const { t } = await createTranslator('en');
    expect(rolesUndoFailedToast(t, { kind: 'unconfirmed', failure: 'no_answer' }, facts)).toEqual({
      tone: 'danger',
      title:
        'HelioGrid did not answer in time. If you were saving, check whether it saved before trying again.',
    });
  });
});
