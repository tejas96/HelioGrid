import {
  type AssignRolesRefusal,
  grantLine,
  ROLE_PRESETS,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { apiErrorMessageId } from '../src/copy/api-error';
import {
  assignRolesRefusalWords,
  assignRolesShown,
  assignRolesWords,
  grantLineWords,
} from '../src/copy/assign-roles';
import type { TextPart } from '../src/copy/list-join';
import { createTranslator } from '../src/runtime';

const [OWNER, , , SURVEY, DESIGN, , , INSTALL, , FINANCE, OPERATIONS] = ROLE_PRESETS;

async function lineFor(roles: readonly RolePreset[], reader: UiLanguage = 'en') {
  const { t } = await createTranslator(reader);
  return grantLineWords(t, 'Vikram', grantLine(roles).speakers);
}

const text = (parts: readonly TextPart[]) => parts.map((part) => part.text).join('');
const strong = (parts: readonly TextPart[]) =>
  parts.filter((part) => part.strong).map((part) => part.text);

describe('grantLineWords — the boards, word for word', () => {
  it.each<[string, readonly RolePreset[], string, readonly string[]]>([
    [
      'one clause stands alone',
      [OWNER],
      'Vikram can run the whole business.',
      ['run the whole business'],
    ],
    ['two take the and', [SURVEY, DESIGN], 'Vikram can survey and design.', ['survey', 'design']],
    [
      'm-default',
      [SURVEY, DESIGN, INSTALL],
      'Vikram can survey, design and install.',
      ['survey', 'design', 'install'],
    ],
    [
      'm-live-after',
      [SURVEY, DESIGN, INSTALL, FINANCE, OPERATIONS],
      'Vikram can survey, design, install, handle money and run operations.',
      ['survey', 'design', 'install', 'handle money', 'run operations'],
    ],
  ])('%s', async (_, roles, sentence, clauses) => {
    const line = await lineFor(roles);
    expect(text(line.parts)).toBe(sentence);
    expect(strong(line.parts)).toEqual(clauses);
    expect(line.none).toBe(false);
  });

  it('no presets (m-empty)', async () => {
    const line = await lineFor([]);
    expect(text(line.parts)).toBe('Vikram would hold no presets.');
    expect(strong(line.parts)).toEqual([]);
    expect(line.none).toBe(true);
  });

  it('a covered preset says nothing: EPC Owner speaks alone', async () => {
    expect(text((await lineFor([OWNER, DESIGN])).parts)).toBe('Vikram can run the whole business.');
  });
});

describe('grantLineWords — Hindi and Marathi put the verb after the list', () => {
  const vikram = [SURVEY, DESIGN, INSTALL] as const;

  it.each<[UiLanguage, string, string]>([
    ['hi', 'Vikram ', 'सकते हैं।'],
    ['mr', 'Vikram ', 'शकतात.'],
  ])('%s', async (reader, opening, verb) => {
    const line = await lineFor(vikram, reader);
    const sentence = text(line.parts);
    expect(sentence.startsWith(opening)).toBe(true);
    expect(sentence.endsWith(verb)).toBe(true);
    expect(strong(line.parts)).toHaveLength(3);
    const lastClause = strong(line.parts).at(-1) ?? '';
    expect(sentence.indexOf(verb)).toBeGreaterThan(sentence.indexOf(lastClause));
  });

  it.each<UiLanguage>(['hi', 'mr'])(
    '%s: one and two clauses join in the language',
    async (reader) => {
      const one = text((await lineFor([SURVEY], reader)).parts);
      const two = text((await lineFor([SURVEY, DESIGN], reader)).parts);
      expect(one).not.toMatch(/ and /u);
      expect(two).toMatch(reader === 'hi' ? / और /u : / आणि /u);
    },
  );
});

describe('assignRolesWords — the rows and their locks', () => {
  it('twelve rows in F2 order, a lock reason only on a locked row', async () => {
    const { t } = await createTranslator('en');
    const words = assignRolesWords(t, {
      firstName: 'Rajesh',
      companyName: 'Suryodaya Solar',
      locks: { epc_owner: 'sole-owner' },
    });
    expect(words.rows).toHaveLength(12);
    expect(words.rows[0]?.title).toBe('EPC Owner');
    expect(words.rows[0]?.lockReason).toBe(
      'Suryodaya Solar must keep one EPC Owner, so make someone else one first.',
    );
    expect(words.rows.slice(1).every((row) => row.lockReason === null)).toBe(true);
    expect(words.saveOff('unchanged')).toBe('Tick or clear a preset first.');
    expect(words.saveOff('empty')).toBe('Tick at least one preset.');
    expect(words.saveOff('gone')).toBe(
      'Rajesh is no longer active on this team, so nothing changed.',
    );
    expect(words.saveOff(null)).toBeNull();
    expect(words.loading).toBe("Loading Rajesh's presets");
  });

  it('your own EPC Owner names its own reason', async () => {
    const { t } = await createTranslator('en');
    const words = assignRolesWords(t, {
      firstName: 'Rajesh',
      companyName: 'Suryodaya Solar',
      locks: { epc_owner: 'own-admin' },
    });
    expect(words.rows[0]?.lockReason).toBe(
      "You can't remove your own EPC Owner — another EPC Owner can.",
    );
  });

  it.each<UiLanguage>(['hi', 'mr'])('%s has every word', async (reader) => {
    const { t } = await createTranslator(reader);
    const en = assignRolesWords((await createTranslator('en')).t, {
      firstName: 'R',
      companyName: 'S',
      locks: { epc_owner: 'own-admin' },
    });
    const words = assignRolesWords(t, {
      firstName: 'R',
      companyName: 'S',
      locks: { epc_owner: 'own-admin' },
    });
    expect(words.save).not.toBe(en.save);
    expect(words.gives).not.toBe(en.gives);
    expect(words.rows[0]?.lockReason).not.toBe(en.rows[0]?.lockReason);
  });
});

describe('assignRolesShown — one person, as both screens hand it on', () => {
  it('Vikram, nothing changed (m-default)', async () => {
    const { t } = await createTranslator('en');
    const shown = assignRolesShown(t, {
      name: 'Vikram Deshpande',
      status: 'active',
      companyName: 'Suryodaya Solar',
      picked: [SURVEY, DESIGN, INSTALL],
      locks: {},
      saveOff: 'unchanged',
      refusal: null,
    });
    expect(shown.status).toBe('Active');
    expect(text(shown.grant.parts)).toBe('Vikram can survey, design and install.');
    expect(shown.grant.speakers).toEqual([SURVEY, DESIGN, INSTALL]);
    expect(shown.saveOffReason).toBe('Tick or clear a preset first.');
    expect(shown.refusal).toBeNull();
  });

  it('Vikram, the save failed (m-error)', async () => {
    const { t } = await createTranslator('en');
    const shown = assignRolesShown(t, {
      name: 'Vikram Deshpande',
      status: 'active',
      companyName: 'Suryodaya Solar',
      picked: [SURVEY, DESIGN, INSTALL, FINANCE],
      locks: {},
      saveOff: null,
      refusal: { kind: 'failed' },
    });
    expect(shown.refusal).toEqual({
      title: "Vikram's roles weren't saved",
      body: 'Nothing changed for Vikram — try Save again.',
    });
  });
});

describe('assignRolesRefusalWords — why a save did not land', () => {
  const facts = { firstName: 'Vikram', companyName: 'Suryodaya Solar' };

  it.each<[AssignRolesRefusal, string | null, string]>([
    [
      { kind: 'failed' },
      "Vikram's roles weren't saved",
      'Nothing changed for Vikram — try Save again.',
    ],
    [
      { kind: 'gone' },
      "Vikram's roles weren't saved",
      'Vikram is no longer active on this team, so nothing changed.',
    ],
    [
      { kind: 'last-owner' },
      "Vikram's roles weren't saved",
      'Suryodaya Solar must keep one EPC Owner, so make someone else one first.',
    ],
    [
      { kind: 'own-admin' },
      "Vikram's roles weren't saved",
      "You can't remove your own EPC Owner — another EPC Owner can.",
    ],
    [
      { kind: 'unconfirmed', failure: 'no_connection' },
      null,
      'HelioGrid could not be reached, from your side or ours. If you were saving, check whether it saved before trying again.',
    ],
    [
      { kind: 'unconfirmed', failure: 'no_answer' },
      null,
      'HelioGrid did not answer in time. If you were saving, check whether it saved before trying again.',
    ],
  ])('%o', async (refusal, title, body) => {
    const { t } = await createTranslator('en');
    expect(assignRolesRefusalWords(t, refusal, facts)).toEqual({ title, body });
  });

  it('the api refuses your own EPC Owner in the lock’s own words — one catalog entry', () => {
    expect(apiErrorMessageId('OWN_ADMIN')).toBe(
      "You can't remove your own EPC Owner — another EPC Owner can.",
    );
  });

  it.each<UiLanguage>(['hi', 'mr'])('%s has every word', async (reader) => {
    const en = (await createTranslator('en')).t;
    const { t } = await createTranslator(reader);
    for (const kind of ['failed', 'gone'] as const) {
      const ours = assignRolesRefusalWords(t, { kind }, facts);
      const english = assignRolesRefusalWords(en, { kind }, facts);
      expect(ours.title).not.toBe(english.title);
      expect(ours.body).not.toBe(english.body);
      expect(ours.body).toContain('Vikram');
    }
  });
});
