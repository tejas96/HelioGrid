import { UI_LANGUAGES, UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../src/languages';

/**
 * Every `{slot}` name in a compiled Lingui message: a part is a string, or `[name]`, or
 * `[name, format, cases]` whose cases hold more parts. Read against the REAL compiled catalogs.
 */
function slotsIn(message: unknown): Set<string> {
  const slots = new Set<string>();
  const visitParts = (parts: unknown): void => {
    if (!Array.isArray(parts)) return;
    for (const part of parts) {
      if (!Array.isArray(part) || typeof part[0] !== 'string') continue;
      slots.add(part[0]);
      const cases: unknown = part[2];
      if (typeof cases === 'object' && cases !== null) Object.values(cases).forEach(visitParts);
    }
  };
  visitParts(message);
  return slots;
}

const sorted = (slots: Set<string>) => [...slots].sort().join(', ');

/** Each message whose translation names other slots than its English, as `"<id>": {a} ≠ {b}`. */
async function slotMismatches(language: UiLanguage): Promise<string[]> {
  const [catalog, source] = await Promise.all([
    loadCatalog(language),
    loadCatalog(UI_SOURCE_LOCALE),
  ]);
  return Object.entries(source).flatMap(([id, english]) => {
    const wanted = sorted(slotsIn(english));
    const found = sorted(slotsIn(catalog[id]));
    return wanted === found ? [] : [`"${id}": {${wanted}} ≠ {${found}}`];
  });
}

describe('translated messages keep their slots', () => {
  it.each(UI_LANGUAGES.filter((language) => language !== UI_SOURCE_LOCALE))(
    '%s: every message fills the same {slots} as its English, so no value is lost or left raw',
    async (language) => {
      expect(await slotMismatches(language)).toEqual([]);
    },
  );

  it('reads slots at all — the source catalog holds messages with slots in them', async () => {
    const source = await loadCatalog(UI_SOURCE_LOCALE);
    expect(
      Object.values(source).filter((message) => slotsIn(message).size > 0).length,
    ).toBeGreaterThan(0);
  });
});

/**
 * A message is a whole piece of copy: a sentence glued to another in code breaks the word order of
 * every language that orders it differently, and a value with no words is not copy at all.
 */
function pieceProblem(id: string): string | null {
  if (id !== id.trim()) return 'starts or ends with a space — a piece glued to another in code';
  if (!/\p{L}|\{/u.test(id)) return 'has no word and no slot — a value, not copy';
  return null;
}

describe('every message is a whole piece of copy', () => {
  it('no message id starts or ends with a space, and each holds a word or a slot', async () => {
    const source = await loadCatalog(UI_SOURCE_LOCALE);
    const problems = Object.keys(source).flatMap((id) => {
      const problem = pieceProblem(id);
      return problem === null ? [] : [`"${id}" ${problem}`];
    });
    expect(problems).toEqual([]);
  });
});
