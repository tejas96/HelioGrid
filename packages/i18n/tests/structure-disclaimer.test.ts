import { describe, expect, it } from 'vitest';
import { STRUCTURE_DISCLAIMER } from '../src/copy/structure-disclaimer';
import { createTranslator } from '../src/runtime';

/**
 * `F8-28` — the statement every structure-bearing output carries. The PRD fixes its content, not its
 * text; the English below is the wording ruled at `T-FPLAT-030`'s `/start`, copied from the ticket
 * and NOT from the catalog, so a catalog id that drifts from the ruling fails here.
 */
const RULED =
  'This is a material estimate and a visual model, not a structural check. An engineer must verify the structure.';

describe('the structure disclaimer', () => {
  it('prints the structure disclaimer in English, Hindi and Marathi (F8-28)', async () => {
    const english = await createTranslator('en');
    const hindi = await createTranslator('hi');
    const marathi = await createTranslator('mr');
    expect(english.t(STRUCTURE_DISCLAIMER)).toBe(RULED);
    /* A missing translation falls back to English and would still print a line. */
    expect(hindi.t(STRUCTURE_DISCLAIMER)).toMatch(/\p{Script=Devanagari}/u);
    expect(marathi.t(STRUCTURE_DISCLAIMER)).toMatch(/\p{Script=Devanagari}/u);
    expect(marathi.t(STRUCTURE_DISCLAIMER)).not.toBe(hindi.t(STRUCTURE_DISCLAIMER));
  });
});
