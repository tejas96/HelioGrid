import { describe, expect, it } from 'vitest';
import {
  blankItemDraft,
  draftIsBlank,
  draftIsDirty,
  type ItemDraft,
  itemDraftAfter,
  itemDraftFrom,
  judgeItemDraft,
  optionalFolded,
} from '../../src/catalog/item-draft';
import type { CatalogSpec } from '../../src/catalog/specs';
import type { CertificationScheme } from '../../src/certification/pack';

const SCHEMES: readonly CertificationScheme[] = [
  { scheme: 'ALMM', evidence: 'list_reference' },
  { scheme: 'DCR', evidence: 'flag' },
];

const SAATVIK = {
  watt: 575,
  technology: 'mono_perc',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 51.6,
  vmpV: 43.4,
  iscA: 14,
  impA: 13.25,
  tempCoeffVocPct: -0.27,
};

const MPPT = {
  acKw: 5,
  phases: 1,
  maxDcV: 600,
  efficiencyPct: 97.5,
  'mppt.count': 2,
  'mppt.stringsPerMppt': 1,
  'mppt.maxCurrentA': 16,
  'mppt.minV': 80,
  'mppt.maxV': 550,
};

function filled(kind: ItemDraft['kind'], spec: Record<string, number | string>): ItemDraft {
  return Object.entries(spec).reduce(
    (draft, [path, value]) => itemDraftAfter(draft, { type: 'spec', path, value }),
    { ...blankItemDraft(kind), brand: 'Saatvik', model: 'SGP-575-BAA-HC' },
  );
}

const failuresOf = (draft: ItemDraft, priced = true) => {
  const judged = judgeItemDraft(draft, SCHEMES, { priced });
  return judged.ok ? [] : judged.failures;
};

describe('the judge', () => {
  it.each([
    ['brand', { ...filled('panel', SAATVIK), brand: '  ' }],
    ['model', { ...filled('panel', SAATVIK), model: '' }],
    [
      'spec.vocV',
      itemDraftAfter(filled('panel', SAATVIK), { type: 'spec', path: 'vocV', value: null }),
    ],
    [
      'spec.technology',
      itemDraftAfter(filled('panel', SAATVIK), { type: 'spec', path: 'technology', value: '' }),
    ],
    [
      'spec.mppt.minV',
      itemDraftAfter(filled('inverter', MPPT), { type: 'spec', path: 'mppt.minV', value: null }),
    ],
    [
      'certifications.ALMM',
      itemDraftAfter(filled('panel', SAATVIK), { type: 'scheme', scheme: 'ALMM', on: true }),
    ],
  ])('refuses an empty required field: %s', (path, draft) => {
    expect(failuresOf(draft)).toContainEqual({ path, issue: 'required' });
  });

  it.each([
    ['zero where a figure must be positive', 'panel', { ...SAATVIK, watt: 0 }, 'spec.watt'],
    ['a negative figure', 'panel', { ...SAATVIK, widthMm: -1 }, 'spec.widthMm'],
    [
      'a temperature coefficient at zero',
      'panel',
      { ...SAATVIK, tempCoeffVocPct: 0 },
      'spec.tempCoeffVocPct',
    ],
    [
      'bifaciality above 100',
      'panel',
      { ...SAATVIK, bifacialityPct: 100.5 },
      'spec.bifacialityPct',
    ],
    ['efficiency at 100', 'inverter', { ...MPPT, efficiencyPct: 100 }, 'spec.efficiencyPct'],
    ['a count that is not whole', 'inverter', { ...MPPT, 'mppt.count': 1.5 }, 'spec.mppt.count'],
  ] as const)('refuses a value outside its range: %s', (_, kind, spec, path) => {
    expect(failuresOf(filled(kind, spec))).toEqual([{ path, issue: 'invalid' }]);
  });

  it.each([
    [
      'Length equal to Width',
      'panel',
      { ...SAATVIK, lengthMm: 1134 },
      'spec.lengthMm',
      'exceeds',
      'widthMm',
    ],
    ['Length one over Width', 'panel', { ...SAATVIK, lengthMm: 1135 }, null, null, null],
    ['Voc equal to Vmp', 'panel', { ...SAATVIK, vocV: 43.4 }, 'spec.vocV', 'exceeds', 'vmpV'],
    ['Isc below Imp', 'panel', { ...SAATVIK, iscA: 13 }, 'spec.iscA', 'exceeds', 'impA'],
    [
      'MPPT high equal to low',
      'inverter',
      { ...MPPT, 'mppt.maxV': 80 },
      'spec.mppt.maxV',
      'exceeds',
      'mppt.minV',
    ],
    [
      'Max DC voltage one below MPPT high',
      'inverter',
      { ...MPPT, maxDcV: 549 },
      'spec.maxDcV',
      'atLeast',
      'mppt.maxV',
    ],
    ['Max DC voltage equal to MPPT high', 'inverter', { ...MPPT, maxDcV: 550 }, null, null, null],
  ] as const)(
    'judges each field-order gate at its edge: %s',
    (_, kind, spec, path, issue, than) => {
      const failures = failuresOf(filled(kind, spec));
      expect(failures).toEqual(path === null ? [] : [{ path, issue, than }]);
    },
  );

  it('answers the create body when every field holds', () => {
    let draft = filled('panel', { ...SAATVIK, warrantyYears: 25 });
    draft = itemDraftAfter(draft, { type: 'scheme', scheme: 'ALMM', on: true });
    draft = itemDraftAfter(draft, {
      type: 'reference',
      scheme: 'ALMM',
      value: ' List-I, S. No. 38 ',
    });
    draft = itemDraftAfter(draft, { type: 'scheme', scheme: 'DCR', on: true });
    draft = itemDraftAfter(draft, { type: 'scheme', scheme: 'OTHER', on: true });
    draft = itemDraftAfter(draft, { type: 'price', value: '15650' });
    expect(judgeItemDraft({ ...draft, brand: ' Saatvik ' }, SCHEMES, { priced: true })).toEqual({
      ok: true,
      body: {
        brand: 'Saatvik',
        model: 'SGP-575-BAA-HC',
        spec: { kind: 'panel', ...SAATVIK, warrantyYears: 25 },
        certifications: [
          { scheme: 'ALMM', reference: 'List-I, S. No. 38' },
          { scheme: 'DCR', reference: null },
        ],
        preferred: false,
        rate: { amount: '15650' },
      },
    });
  });

  it.each([
    ['a person who may not price', '15650', false],
    ['an empty price', '  ', true],
  ])('answers the create body without a rate for %s', (_, price, priced) => {
    const draft = itemDraftAfter(filled('panel', SAATVIK), { type: 'price', value: price });
    const judged = judgeItemDraft(draft, SCHEMES, { priced });
    expect(judged.ok && 'rate' in judged.body).toBe(false);
  });

  it('answers the create body for a switched-off scheme with nothing claimed', () => {
    let draft = itemDraftAfter(filled('panel', SAATVIK), {
      type: 'reference',
      scheme: 'ALMM',
      value: 'x',
    });
    draft = itemDraftAfter(draft, { type: 'scheme', scheme: 'ALMM', on: false });
    const judged = judgeItemDraft(draft, SCHEMES, { priced: true });
    expect(judged.ok && judged.body.certifications).toEqual([]);
  });
});

describe('the draft', () => {
  const SOMERA: CatalogSpec = {
    kind: 'inverter',
    acKw: 5,
    phases: 1,
    mppt: { count: 2, minV: 80, maxV: 550, maxCurrentA: 16, stringsPerMppt: 1 },
    maxDcV: 600,
    efficiencyPct: 97.5,
  };

  it('the pre-fill copies brand, model and spec only', () => {
    const draft = itemDraftFrom({ brand: 'Solis', model: 'S6-GR1P5K-M', spec: SOMERA });
    expect(draft).toEqual({
      ...blankItemDraft('inverter'),
      brand: 'Solis',
      model: 'S6-GR1P5K-M',
      spec: { ...MPPT, warrantyYears: null },
    });
    expect(judgeItemDraft(draft, SCHEMES, { priced: true })).toMatchObject({
      ok: true,
      body: { spec: SOMERA, certifications: [] },
    });
  });

  it('a new kind keeps the brand and model and starts its spec afresh', () => {
    const panel = itemDraftAfter(filled('panel', SAATVIK), { type: 'unfold' });
    const battery = itemDraftAfter(panel, { type: 'kind', kind: 'battery' });
    expect(battery.brand).toBe('Saatvik');
    expect(Object.values(battery.spec).every((value) => value === null)).toBe(true);
    expect(battery.optionalOpen).toBe(false);
    expect(itemDraftAfter(battery, { type: 'kind', kind: 'battery' })).toBe(battery);
  });

  it.each([
    ['a fresh form', blankItemDraft('panel'), true],
    [
      'a brand typed',
      itemDraftAfter(blankItemDraft('panel'), { type: 'brand', value: 'S' }),
      false,
    ],
    ['a model typed', { ...blankItemDraft('panel'), model: 'M' }, false],
    [
      'a figure typed',
      itemDraftAfter(blankItemDraft('panel'), { type: 'spec', path: 'watt', value: 5 }),
      false,
    ],
    [
      'a price typed',
      itemDraftAfter(blankItemDraft('panel'), { type: 'price', value: '1' }),
      false,
    ],
  ])('is blank: %s → %s', (_, draft, blank) => {
    expect(draftIsBlank(draft)).toBe(blank);
  });

  it('is dirty once it differs from how it opened', () => {
    const opened = blankItemDraft('panel');
    const flicked = [true, false].reduce(
      (draft, on) => itemDraftAfter(draft, { type: 'scheme', scheme: 'DCR', on }),
      opened,
    );
    expect(draftIsDirty(flicked, opened)).toBe(false);
    expect(draftIsDirty(opened, opened)).toBe(false);
    expect(draftIsDirty(itemDraftAfter(opened, { type: 'model', value: 'M' }), opened)).toBe(true);
  });

  it.each([
    ['every optional value blank', filled('panel', SAATVIK), true],
    ['one optional value set', filled('panel', { ...SAATVIK, weightKg: 27.5 }), false],
    ['unfolded by hand', itemDraftAfter(filled('panel', SAATVIK), { type: 'unfold' }), false],
  ])('folds the optional values: %s → %s', (_, draft, folded) => {
    expect(optionalFolded(draft)).toBe(folded);
  });
});
