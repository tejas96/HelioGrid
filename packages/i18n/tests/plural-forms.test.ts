import { UI_LANGUAGES, UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../src/languages';

/**
 * Every plural message WRITTEN in a language carries every category that language's plural rules
 * name (`F3-05`, `F3-27`) — a Hindi count with no `one` form renders the `other` sentence for one
 * thing. A message still in English is a translation gap, which this does not judge: it falls back
 * to the source string by string. Read against the REAL compiled catalogs.
 */

interface PluralNode {
  readonly kind: 'plural' | 'selectordinal';
  readonly cases: Record<string, unknown>;
}

/** Each plural node in a compiled Lingui message: `[name, 'plural' | 'selectordinal', cases]`. */
function pluralsIn(message: unknown): PluralNode[] {
  if (!Array.isArray(message)) return [];
  return message.flatMap((part: unknown): PluralNode[] => {
    if (!Array.isArray(part) || part.length !== 3) return [];
    const kind: unknown = part[1];
    const cases: unknown = part[2];
    if (typeof cases !== 'object' || cases === null) return [];
    const branches = Object.values(cases).flatMap(pluralsIn);
    const own: PluralNode[] =
      kind === 'plural' || kind === 'selectordinal' ? [{ kind, cases: { ...cases } }] : [];
    return [...own, ...branches];
  });
}

/** Each plural form a message written in `language` lacks, as `"<id>" has no <category> form`. */
async function missingForms(language: UiLanguage): Promise<{ missing: string[]; plurals: number }> {
  const [catalog, source] = await Promise.all([
    loadCatalog(language),
    loadCatalog(UI_SOURCE_LOCALE),
  ]);
  const missing: string[] = [];
  let plurals = 0;
  for (const [id, message] of Object.entries(catalog)) {
    const written =
      language === UI_SOURCE_LOCALE || JSON.stringify(message) !== JSON.stringify(source[id]);
    if (!written) continue;
    for (const { kind, cases } of pluralsIn(message)) {
      plurals += 1;
      const type = kind === 'selectordinal' ? 'ordinal' : 'cardinal';
      const needed = new Intl.PluralRules(language, { type }).resolvedOptions().pluralCategories;
      const lacking = needed.filter((category) => !(category in cases));
      if (lacking.length > 0) missing.push(`"${id}" has no ${lacking.join(', ')} form`);
    }
  }
  return { missing, plurals };
}

describe('plural forms — every category the language names (F3-05)', () => {
  it.each(UI_LANGUAGES)(
    '%s: every plural message written in it carries every category',
    async (language) => {
      expect((await missingForms(language)).missing).toEqual([]);
    },
  );

  it('reads plural messages at all — the source catalog holds at least one', async () => {
    expect((await missingForms(UI_SOURCE_LOCALE)).plurals).toBeGreaterThan(0);
  });
});
