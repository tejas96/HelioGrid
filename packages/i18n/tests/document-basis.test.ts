import { describe, expect, it } from 'vitest';
import { BASIS_LINE_WORD } from '../src/copy/document-basis';
import { createTranslator } from '../src/runtime';

/**
 * `F8-20` / `F8-22` — the basis lines are fixed copy. The English below is copied character for
 * character from `docs/prd/foundations/F8-data-honesty.md`, NOT from the catalog, so a catalog id
 * that drifts from the PRD fails here rather than passing against itself.
 */
const VERBATIM = {
  indicative:
    'Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures.',
  imageryBasis:
    'Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access.',
} as const;

describe('the basis lines', () => {
  it('prints both basis lines verbatim in English and translated in Hindi and Marathi', async () => {
    const english = await createTranslator('en');
    const hindi = await createTranslator('hi');
    const marathi = await createTranslator('mr');
    for (const line of ['indicative', 'imageryBasis'] as const) {
      expect(english.t(BASIS_LINE_WORD[line])).toBe(VERBATIM[line]);
      /* A missing translation falls back to English and would still print a line. */
      expect(hindi.t(BASIS_LINE_WORD[line])).toMatch(/\p{Script=Devanagari}/u);
      expect(marathi.t(BASIS_LINE_WORD[line])).toMatch(/\p{Script=Devanagari}/u);
      expect(marathi.t(BASIS_LINE_WORD[line])).not.toBe(hindi.t(BASIS_LINE_WORD[line]));
    }
  });
});
