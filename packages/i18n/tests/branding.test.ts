/**
 * The Branding page's chosen words (`SCR-M01-18`), against the real catalogs: the standing line by
 * what is known of the last save, the logo's refusal by its file, and the letterhead's bounds. Every
 * Hindi and Marathi line is a draft for the native review.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import {
  brandingLogoRefusal,
  brandingStandingLine,
  letterheadRefusalWords,
} from '../src/copy/branding';
import { createTranslator } from '../src/runtime';

let en: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  ({ t: en } = await createTranslator('en'));
});
const AT = Date.parse('2026-08-12T10:30:00.000Z');
const formats = { date: () => '12 Aug 2026' };

describe('brandingStandingLine — the line under the title', () => {
  it('the standing line names who and when', () => {
    expect(
      brandingStandingLine(en, { kind: 'saved', at: AT, name: 'Rajesh Kulkarni' }, formats),
    ).toBe('Saved and in force · Rajesh Kulkarni, 12 Aug 2026');
  });

  it.each([
    [
      'a save with no name names the date alone',
      { kind: 'saved', at: AT, name: null },
      'Saved and in force · 12 Aug 2026',
    ],
    [
      'an empty name reads as none',
      { kind: 'saved', at: AT, name: '' },
      'Saved and in force · 12 Aug 2026',
    ],
    ['an api that does not say', { kind: 'saved-unknown' }, 'Saved and in force'],
    [
      'a company that never saved',
      { kind: 'never-set' },
      'Nothing set yet · platform defaults in force',
    ],
  ] as const)('%s', (_what, standing, line) => {
    expect(brandingStandingLine(en, standing, formats)).toBe(line);
  });
});

describe('brandingLogoRefusal — the declined file by its name, never its size', () => {
  it.each([
    [['size', 'width'], 'suryodaya-banner.png', 'suryodaya-banner.png is too large.'],
    [['type'], 'logo.gif', 'logo.gif is not a PNG or JPG.'],
    [['width'], 'mark.png', 'mark.png is too narrow.'],
    [['size'], null, 'That file is too large.'],
  ] as const)('%o of %s → %s', (missed, file, words) => {
    expect(
      brandingLogoRefusal(en, { missed: [...missed], megabytes: 3.4, widthPx: 320 }, file),
    ).toBe(words);
  });

  it('says nothing when nothing was refused', () => {
    expect(brandingLogoRefusal(en, null, 'logo.png')).toBeNull();
  });
});

describe('letterheadRefusalWords — the field states its bound', () => {
  it.each([
    ['too-many-lines', 'lines', 'Up to 6 lines'],
    ['too-long', 'tagline', 'Up to 120 characters on a line'],
    ['too-long', 'footerNote', 'Up to 200 characters on a line'],
    [null, 'lines', null],
  ] as const)('%s on %s → %s', (refusal, field, words) => {
    expect(letterheadRefusalWords(en, refusal, field)).toBe(words);
  });
});
