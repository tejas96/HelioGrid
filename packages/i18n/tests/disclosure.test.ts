import { RULED_DISCLOSURES } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { disclosureLead, disclosureLine } from '../src/copy/disclosure';
import { createTranslator } from '../src/runtime';

/**
 * `F8-20`, `F8-22`, `F8-28` — the lines a `Disclosure` prints. The English below is copied from the
 * PRD rows and the rulings, NOT from the catalog, so a line that drifts fails here. The staleness
 * line and the four leads are the design system's drawn words, ruled at `T-FPLAT-073`'s `/start`.
 */
const LINE = {
  'indicative-basis':
    'Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures.',
  'remote-survey':
    'Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access.',
  structure:
    'This is a material estimate and a visual model, not a structural check. An engineer must verify the structure.',
  staleness:
    'The prices and the subsidy in this document were current on the issue date. Both change, so confirm them before you pay.',
} as const;

const LEAD = {
  'indicative-basis': 'Indicative',
  'remote-survey': 'Surveyed remotely',
  structure: 'Not a structural certification',
  staleness: 'Prices and subsidy move',
} as const;

describe('the disclosure lines', () => {
  it('prints each ruled line in English as its row gives it, and translated in Hindi and Marathi', async () => {
    const english = await createTranslator('en');
    const hindi = await createTranslator('hi');
    const marathi = await createTranslator('mr');
    for (const kind of RULED_DISCLOSURES) {
      expect(disclosureLine(english.t, kind)).toBe(LINE[kind]);
      expect(disclosureLead(english.t, kind)).toBe(LEAD[kind]);
      for (const words of [disclosureLine, disclosureLead]) {
        /* A missing translation falls back to English and would still print a line. */
        expect(words(hindi.t, kind)).toMatch(/\p{Script=Devanagari}/u);
        expect(words(marathi.t, kind)).toMatch(/\p{Script=Devanagari}/u);
        expect(words(marathi.t, kind)).not.toBe(words(hindi.t, kind));
      }
    }
  });
});
