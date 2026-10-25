import { describe, expect, it } from 'vitest';
import {
  type BrandingSaved,
  brandingChanged,
  brandingDraftOf,
  brandingEdit,
  brandingSendable,
  brandingStanding,
  brandingWriteOf,
  letterheadFieldRefusal,
  letterheadLinesOf,
  letterheadLinesRefusal,
} from '../../src/branding/branding-draft';

const NEVER_SET: BrandingSaved = { brandColour: null, letterhead: null, logoFileId: null };
const LOGO = '0199d3a0-7c1e-7b7a-9d7e-4f6a2b8c1d3e';
const SAVED: BrandingSaved = {
  brandColour: '#0D7A4F',
  letterhead: {
    tagline: { en: 'Rooftop solar since 2011', hi: 'रूफटॉप सोलर, 2011 से' },
    lines: [{ en: '+91 98200 41123' }, { en: 'hello@suryodaya.in' }],
    footerNote: null,
  },
  logoFileId: LOGO,
};

describe('brandingDraftOf — the saved set as the fields hold it', () => {
  it('opens the English slot of each part, the lines one per line', () => {
    expect(brandingDraftOf(SAVED)).toEqual({
      brandColour: '#0D7A4F',
      tagline: 'Rooftop solar since 2011',
      lines: '+91 98200 41123\nhello@suryodaya.in',
      footerNote: '',
      logoFileId: LOGO,
    });
  });

  it('opens a company that never saved as empty fields and the platform colour', () => {
    expect(brandingDraftOf(NEVER_SET)).toEqual({
      brandColour: null,
      tagline: '',
      lines: '',
      footerNote: '',
      logoFileId: null,
    });
  });
});

describe('brandingChanged — what raises the act bar', () => {
  it('an edit marks the draft changed', () => {
    const draft = brandingDraftOf(SAVED);
    expect(brandingChanged(SAVED, draft)).toBe(false);
    expect
      .soft(brandingChanged(SAVED, brandingEdit(draft, { kind: 'colour', value: '#B3401F' })))
      .toBe(true);
    expect
      .soft(brandingChanged(SAVED, brandingEdit(draft, { kind: 'tagline', value: 'Solar' })))
      .toBe(true);
    expect
      .soft(brandingChanged(SAVED, brandingEdit(draft, { kind: 'footerNote', value: 'Thanks' })))
      .toBe(true);
    expect.soft(brandingChanged(SAVED, brandingEdit(draft, { kind: 'logoRemoved' }))).toBe(true);
    expect
      .soft(brandingChanged(SAVED, brandingEdit(draft, { kind: 'logoStored', fileId: 'other' })))
      .toBe(true);
  });

  it.each([
    ['the same colour in lower case', { kind: 'colour', value: '#0d7a4f' }],
    [
      'a blank line added under the lines',
      { kind: 'lines', value: '+91 98200 41123\nhello@suryodaya.in\n  \n' },
    ],
    [
      'the tagline with spaces around it',
      { kind: 'tagline', value: '  Rooftop solar since 2011 ' },
    ],
  ] as const)('reads %s as no change', (_what, edit) => {
    expect(brandingChanged(SAVED, brandingEdit(brandingDraftOf(SAVED), edit))).toBe(false);
  });

  it('reads a colour half typed as no change until it is a colour', () => {
    const typing = brandingEdit(brandingDraftOf(SAVED), { kind: 'colour', value: '#B340' });
    expect(brandingChanged(SAVED, typing)).toBe(false);
    expect(brandingSendable(typing)).toBe(false);
  });
});

describe('letterheadLinesOf and its refusal — six lines at most', () => {
  it('the lines field keeps six and drops blanks', () => {
    expect(letterheadLinesOf(' one \n\n two\n   \nthree')).toEqual(['one', 'two', 'three']);
  });

  it.each([
    [0, null],
    [5, null],
    [6, null],
    [7, 'too-many-lines'],
  ])('%i lines → %s', (count, refusal) => {
    const text = Array.from({ length: count }, (_, at) => `line ${at + 1}`).join('\n');
    expect(letterheadLinesRefusal(text)).toBe(refusal);
  });

  it.each([
    [200, null],
    [201, 'too-long'],
  ])('a line of %i characters → %s', (length, refusal) => {
    expect(letterheadLinesRefusal('x'.repeat(length))).toBe(refusal);
  });

  it.each([
    ['tagline', 120, null],
    ['tagline', 121, 'too-long'],
    ['footerNote', 200, null],
    ['footerNote', 201, 'too-long'],
  ] as const)('%s at %i characters → %s', (field, length, refusal) => {
    expect(letterheadFieldRefusal(field, 'x'.repeat(length))).toBe(refusal);
  });
});

describe('brandingWriteOf — the one write Save sends', () => {
  it('replaces the English slot and keeps every other language stored', () => {
    const draft = brandingEdit(brandingDraftOf(SAVED), {
      kind: 'tagline',
      value: 'Solar for homes',
    });
    expect(brandingWriteOf(SAVED, draft).letterhead?.tagline).toEqual({
      en: 'Solar for homes',
      hi: 'रूफटॉप सोलर, 2011 से',
    });
  });

  it('a stored line keeps its other languages only while its English stays the same line', () => {
    const translated: BrandingSaved = {
      ...SAVED,
      letterhead: {
        tagline: null,
        lines: [
          { en: 'Pune office', hi: 'पुणे कार्यालय' },
          { en: 'hello@suryodaya.in', hi: 'hello@suryodaya.in' },
        ],
        footerNote: null,
      },
    };
    const draft = brandingEdit(brandingDraftOf(translated), {
      kind: 'lines',
      value: 'hello@suryodaya.in\nMumbai office',
    });
    expect(brandingWriteOf(translated, draft).letterhead?.lines).toEqual([
      { en: 'hello@suryodaya.in', hi: 'hello@suryodaya.in' },
      { en: 'Mumbai office' },
    ]);
  });

  it('a removed logo writes null', () => {
    const draft = brandingEdit(brandingDraftOf(SAVED), { kind: 'logoRemoved' });
    expect(brandingWriteOf(SAVED, draft)).toMatchObject({ logoFileId: null });
  });

  it('leaves the logo out when the draft never moved it, so the stored one is kept', () => {
    expect(brandingWriteOf(SAVED, brandingDraftOf(SAVED))).not.toHaveProperty('logoFileId');
  });

  it('writes an untouched company as nothing set, never the platform colour', () => {
    expect(brandingWriteOf(NEVER_SET, brandingDraftOf(NEVER_SET))).toEqual({
      brandColour: null,
      letterhead: null,
    });
  });

  it('clears a letterhead emptied after it was saved', () => {
    const emptied = ['tagline', 'lines', 'footerNote'].reduce(
      (draft, kind) => brandingEdit(draft, { kind, value: '' } as never),
      brandingDraftOf(SAVED),
    );
    expect(brandingWriteOf(SAVED, emptied).letterhead).toEqual({
      tagline: null,
      lines: [],
      footerNote: null,
    });
  });
});

describe('brandingStanding — the line under the title', () => {
  const at = '2026-08-12T10:30:00.000Z';

  it.each([
    [
      'a save with a name',
      SAVED,
      { at, by: { name: 'Rajesh Kulkarni' } },
      { kind: 'saved', at: Date.parse(at), name: 'Rajesh Kulkarni' },
    ],
    [
      'a save made before the saver was kept',
      SAVED,
      { at, by: null },
      { kind: 'saved', at: Date.parse(at), name: null },
    ],
    ['a company that never saved', NEVER_SET, null, { kind: 'never-set' }],
    [
      'a logo from the profile and no branding save',
      { ...NEVER_SET, logoFileId: LOGO },
      null,
      { kind: 'saved-unknown' },
    ],
  ] as const)('%s', (_what, saved, changed, standing) => {
    expect(brandingStanding(saved, changed)).toEqual(standing);
  });

  it.each([
    ['holding a colour', { ...NEVER_SET, brandColour: '#0D7A4F' }, { kind: 'saved-unknown' }],
    ['holding nothing', NEVER_SET, { kind: 'never-set' }],
  ] as const)(
    "the standing line reads an old api's answer by what it holds: %s",
    (_what, saved, standing) => {
      expect(brandingStanding(saved, undefined)).toEqual(standing);
    },
  );
});

describe('brandingSendable — what Save may send', () => {
  const draft = brandingDraftOf(SAVED);
  it.each([
    ['the saved set', draft, true],
    ['the platform colour untouched', { ...draft, brandColour: null }, true],
    ['a colour half typed', { ...draft, brandColour: '#B340' }, false],
    ['seven lines', { ...draft, lines: '1\n2\n3\n4\n5\n6\n7' }, false],
    ['a tagline too long', { ...draft, tagline: 'x'.repeat(121) }, false],
    ['a foot note too long', { ...draft, footerNote: 'x'.repeat(201) }, false],
  ] as const)('%s → %s', (_what, held, sendable) => {
    expect(brandingSendable(held)).toBe(sendable);
  });
});
