import { describe, expect, it } from 'vitest';
import {
  type CatalogReleaseSnapshot,
  changeKindOf,
  readReleaseSnapshot,
} from '../../src/catalog/release';
import type { PanelSpec } from '../../src/catalog/specs';
import { minorUnits } from '../../src/money/minor-units';

const PANEL: PanelSpec = {
  kind: 'panel',
  watt: 550,
  technology: 'bifacial',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 49.9,
  vmpV: 41.9,
  iscA: 14.0,
  impA: 13.13,
  tempCoeffVocPct: -0.26,
};

const ownItem = (over: Partial<Extract<CatalogReleaseSnapshot, { kind: 'own_item' }>> = {}) =>
  ({
    kind: 'own_item',
    brand: 'Waaree',
    model: 'Bi-55-550 Bifacial',
    spec: PANEL,
    certifications: [{ scheme: 'DCR', reference: null }],
    preferred: false,
    archived: false,
    rate: { amount: minorUnits(1375000), currency: 'INR', effectiveOn: '2026-10-01' },
    ...over,
  }) satisfies CatalogReleaseSnapshot;

const override = (over: Partial<Extract<CatalogReleaseSnapshot, { kind: 'override' }>> = {}) =>
  ({
    kind: 'override',
    taxPct: null,
    hidden: false,
    preferred: false,
    rate: null,
    ...over,
  }) satisfies CatalogReleaseSnapshot;

describe('changeKindOf — what one release line says about one item (M01-43)', () => {
  it('an item with no earlier line is added', () => {
    expect(changeKindOf(null, ownItem())).toBe('added');
    expect(changeKindOf(null, override())).toBe('added');
  });

  it('an own SKU archived since its last line is archived, whatever else moved', () => {
    expect(changeKindOf(ownItem(), ownItem({ archived: true, preferred: true }))).toBe('archived');
  });

  it.each([
    [
      'the rate',
      ownItem(),
      ownItem({
        rate: { amount: minorUnits(1400000), currency: 'INR', effectiveOn: '2026-10-05' },
      }),
    ],
    ['a cleared rate', ownItem(), ownItem({ rate: null })],
    ['the spec', ownItem(), ownItem({ spec: { ...PANEL, watt: 555 } })],
    ['a certification', ownItem(), ownItem({ certifications: [] })],
    ['an unarchive', ownItem({ archived: true }), ownItem()],
    ['an override tax', override(), override({ taxPct: '18.00' })],
    ['an override hidden', override(), override({ hidden: true })],
    ['a cleared override', override({ taxPct: '18.00', hidden: true }), override()],
  ])('%s moved → changed', (_what, before, after) => {
    expect(changeKindOf(before, after)).toBe('changed');
  });

  it('two equal sides write no line, whatever order their keys arrive in', () => {
    const same = ownItem();
    const reordered = {
      rate: same.rate,
      archived: false,
      preferred: false,
      certifications: [{ reference: null, scheme: 'DCR' }],
      spec: { ...PANEL },
      model: same.model,
      brand: same.brand,
      kind: 'own_item',
    } satisfies CatalogReleaseSnapshot;
    expect(changeKindOf(same, reordered)).toBeNull();
    expect(changeKindOf(override(), override())).toBeNull();
  });

  it('a zero tax override is a change from an unset one, never read as unset', () => {
    expect(changeKindOf(override(), override({ taxPct: '0.00' }))).toBe('changed');
  });
});

describe('readReleaseSnapshot — a stored line read whole, its amount re-minted (F1-07)', () => {
  it('mints the stored number as minor units and keeps every other field', () => {
    const stored = {
      ...override({ taxPct: '18.00' }),
      rate: { amount: 1375000, currency: 'INR', effectiveOn: '2026-10-01' },
    };
    expect(readReleaseSnapshot(stored)).toEqual(
      override({
        taxPct: '18.00',
        rate: { amount: minorUnits(1375000), currency: 'INR', effectiveOn: '2026-10-01' },
      }),
    );
  });

  it('a cleared rate reads as none', () => {
    expect(readReleaseSnapshot(override()).rate).toBeNull();
  });

  it('refuses a stored amount that is not a whole number of minor units', () => {
    const stored = {
      ...override(),
      rate: { amount: 13750.5, currency: 'INR', effectiveOn: '2026-10-01' },
    };
    expect(() => readReleaseSnapshot(stored)).toThrow(RangeError);
  });
});
