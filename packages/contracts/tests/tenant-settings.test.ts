import { describe, expect, it } from 'vitest';
import { calendarDateSchema, hexColourSchema, trancheLineSchema } from '../src';
import { packLabelSchema, richTextValueSchema } from '../src/document-content';

describe('a per-language value on the wire — English required, a stranger language refused (F3-05)', () => {
  it.each([[{ en: 'Standard' }], [{ en: 'Standard', hi: 'मानक', mr: 'मानक' }]])(
    'accepts %o',
    (label) => {
      expect(packLabelSchema.safeParse(label).success).toBe(true);
    },
  );

  it.each([[{ hi: 'मानक' }], [{ en: 'Standard', fr: 'Standard' }], [{ en: '' }], [{}]])(
    'refuses %o',
    (label) => {
      expect(packLabelSchema.safeParse(label).success).toBe(false);
    },
  );
});

describe('rich text on the wire — a block list, never HTML (M06-51)', () => {
  it('accepts every block kind and refuses an unknown one', () => {
    expect(
      richTextValueSchema.safeParse({
        version: 1,
        blocks: [
          { type: 'h', spans: [{ text: 'Terms', b: true }] },
          { type: 'ul', items: [[{ text: 'one' }], [{ text: 'two', href: 'https://x.y' }]] },
          { type: 'logo' },
        ],
      }).success,
    ).toBe(true);
    expect(
      richTextValueSchema.safeParse({ version: 1, blocks: [{ type: 'html', html: '<b>' }] })
        .success,
    ).toBe(false);
    expect(richTextValueSchema.safeParse({ version: 2, blocks: [] }).success).toBe(false);
  });
});

describe('the small shapes at their edges', () => {
  it.each([
    ['#abc', true],
    ['#AABBCC', true],
    ['#abcd', false],
    ['red', false],
  ])('a colour %s is %s', (value, ok) => {
    expect(hexColourSchema.safeParse(value).success).toBe(ok);
  });

  it.each([
    ['2026-08-15', true],
    ['2026-02-29', false],
    ['2028-02-29', true],
    ['15-08-2026', false],
  ])('a day %s is %s', (value, ok) => {
    expect(calendarDateSchema.safeParse(value).success).toBe(ok);
  });

  it('binds a tranche to a chain stage in two-decimal percent, never the terminal', () => {
    const line = { label: { en: 'On signing' }, percent: '10.00', dueOnStage: 'won' };
    expect(trancheLineSchema.safeParse(line).success).toBe(true);
    expect(trancheLineSchema.safeParse({ ...line, dueOnStage: 'cancelled' }).success).toBe(false);
    expect(trancheLineSchema.safeParse({ ...line, percent: '10' }).success).toBe(false);
    expect(trancheLineSchema.safeParse({ ...line, percent: '100.01' }).success).toBe(false);
  });
});
