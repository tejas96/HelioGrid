import { describe, expect, it } from 'vitest';
import { parseCatalogSpec } from '../../src/catalog/specs';

/** The fields a parse refused, or none — the one thing every gate below decides. */
function failedFields(raw: unknown): readonly string[] {
  const parsed = parseCatalogSpec(raw);
  return parsed.ok ? [] : parsed.failedFields;
}

/** The path to every number in a spec, nested ones included (`mppt.maxV`). */
function figurePaths(value: unknown, path: readonly string[] = []): readonly (readonly string[])[] {
  if (typeof value === 'number') return [path];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => figurePaths(child, [...path, key]));
}

/** A copy of a spec with the value at one path replaced. */
function withFigure(value: unknown, path: readonly string[], figure: number): unknown {
  const [key, ...rest] = path;
  if (key === undefined || value === null || typeof value !== 'object') return figure;
  const record = Object.fromEntries(Object.entries(value));
  return { ...record, [key]: withFigure(record[key], rest, figure) };
}

/** Waaree Bi-55-550 as its datasheet states it (the POC's `panels.ts`). */
const PANEL = {
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
  bifacialityPct: 70,
  warrantyYears: 30,
  weightKg: 31.5,
} as const;

/** Sungrow SG8.0RT (the POC's `inverters.ts`). */
const INVERTER = {
  kind: 'inverter',
  acKw: 8,
  phases: 3,
  mppt: { count: 2, minV: 140, maxV: 1000, maxCurrentA: 26, stringsPerMppt: 2 },
  maxDcV: 1100,
  efficiencyPct: 98.3,
  warrantyYears: 10,
} as const;

/** Tata Power Solar LFP 5.1 kWh (the POC's `batteries.ts`). */
const BATTERY = {
  kind: 'battery',
  usableKwh: 5.12,
  nominalV: 51.2,
  chemistry: 'lfp',
  powerKw: 2.5,
  cycleLife: 6000,
  warrantyYears: 10,
  widthMm: 480,
  depthMm: 250,
  heightMm: 620,
  weightKg: 48,
} as const;

const MICRO_INVERTER = { kind: 'micro_inverter', ratedAcW: 400, warrantyYears: 25 } as const;
const OPTIMISER = { kind: 'optimiser', ratedInputW: 440 } as const;

describe('parseCatalogSpec — the envelope every catalog item carries (MS4-13, MS4-23, M01-45)', () => {
  it.each([PANEL, INVERTER, BATTERY, MICRO_INVERTER, OPTIMISER])(
    'a datasheet-true $kind parses to itself',
    (spec) => {
      expect(parseCatalogSpec(spec)).toEqual({ ok: true, spec });
    },
  );

  it.each([
    [MICRO_INVERTER, 'ratedAcW'],
    [OPTIMISER, 'ratedInputW'],
  ] as const)(
    'micro_inverter and optimiser are component kinds, each parsing and gating its own envelope',
    (spec, power) => {
      expect(failedFields(spec)).toEqual([]);
      expect(failedFields({ ...spec, [power]: 0 })).toEqual([power]);
    },
  );

  it.each([
    ['NaN', { ...PANEL, watt: Number.NaN }, ['watt']],
    ['Infinity', { ...PANEL, watt: Number.POSITIVE_INFINITY }, ['watt']],
    ['a numeric string', { ...PANEL, watt: '550' }, ['watt']],
    ['null', { ...PANEL, tempCoeffVocPct: null }, ['tempCoeffVocPct']],
    ['a missing field', { ...PANEL, vocV: undefined }, ['vocV']],
    ['an unknown technology', { ...PANEL, technology: 'perovskite' }, ['technology']],
    ['a nested NaN', { ...INVERTER, mppt: { ...INVERTER.mppt, maxV: Number.NaN } }, ['mppt.maxV']],
    ['an unknown kind', { ...PANEL, kind: 'wind_turbine' }, ['kind']],
    [
      "another kind's envelope",
      { ...PANEL, kind: 'inverter' },
      ['acKw', 'phases', 'mppt', 'maxDcV', 'efficiencyPct'],
    ],
    ['no envelope at all', null, ['']],
  ] as const)('each malformed value is refused at its field path (%s)', (_, raw, fields) => {
    expect(failedFields(raw)).toEqual(fields);
  });

  it.each([
    ['length = width', { ...PANEL, lengthMm: PANEL.widthMm }, ['lengthMm']],
    ['Voc = Vmp', { ...PANEL, vocV: PANEL.vmpV }, ['vocV']],
    ['Isc = Imp', { ...PANEL, iscA: PANEL.impA }, ['iscA']],
    ['a zero Voc coefficient', { ...PANEL, tempCoeffVocPct: 0 }, ['tempCoeffVocPct']],
    ['a zero watt', { ...PANEL, watt: 0 }, ['watt']],
    ['MPPT max V = min V', { ...INVERTER, mppt: { ...INVERTER.mppt, maxV: 140 } }, ['mppt.maxV']],
    ['a 100% efficiency', { ...INVERTER, efficiencyPct: 100 }, ['efficiencyPct']],
  ] as const)('equal values fail a strictly-greater gate (%s)', (_, raw, fields) => {
    expect(failedFields(raw)).toEqual(fields);
  });

  it.each(
    [PANEL, INVERTER, BATTERY, MICRO_INVERTER, OPTIMISER].flatMap((spec) =>
      figurePaths(spec).map((path) => [spec.kind, path.join('.'), spec, path] as const),
    ),
  )('a zero, NaN or infinite figure is refused at its field (%s %s)', (_, field, spec, path) => {
    for (const figure of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(failedFields(withFigure(spec, path, figure))).toContain(field);
    }
  });

  it('a key this code does not know is dropped, not refused', () => {
    expect(parseCatalogSpec({ ...PANEL, almm: true, priceInr: 13750, glassMm: 3.2 })).toEqual({
      ok: true,
      spec: PANEL,
    });
  });
});

describe('the panel gates hold at their edges (MS4-13)', () => {
  it.each([
    [{ lengthMm: 1135 }, []],
    [{ lengthMm: 1133 }, ['lengthMm']],
    [{ vocV: 41.91 }, []],
    [{ vocV: 41.8 }, ['vocV']],
    [{ iscA: 13.14 }, []],
    [{ iscA: 13.0 }, ['iscA']],
    [{ tempCoeffVocPct: -0.01 }, []],
    [{ tempCoeffVocPct: 0.01 }, ['tempCoeffVocPct']],
    [{ tempCoeffPmaxPct: -0.29 }, []],
    [{ tempCoeffPmaxPct: 0 }, ['tempCoeffPmaxPct']],
    [{ bifacialityPct: 100 }, []],
    [{ bifacialityPct: 100.1 }, ['bifacialityPct']],
    [{ weightKg: -1 }, ['weightKg']],
  ] as const)('%o → %o', (change, fields) => {
    expect(failedFields({ ...PANEL, ...change })).toEqual(fields);
  });
});

describe('the inverter gates hold at their edges (MS4-23)', () => {
  it.each([
    [{ phases: 1 }, []],
    [{ phases: 2 }, ['phases']],
    [{ maxDcV: 1000 }, []],
    [{ maxDcV: 999 }, ['maxDcV']],
    [{ efficiencyPct: 99.99 }, []],
    [{ mppt: { ...INVERTER.mppt, count: 1.5 } }, ['mppt.count']],
  ] as const)('%o → %o', (change, fields) => {
    expect(failedFields({ ...INVERTER, ...change })).toEqual(fields);
  });
});

describe('the battery gates hold at their edges', () => {
  it.each([
    [{ chemistry: 'lead_acid' }, []],
    [{ chemistry: 'lithium' }, ['chemistry']],
    [{ cycleLife: 0.5 }, ['cycleLife']],
  ] as const)('%o → %o', (change, fields) => {
    expect(failedFields({ ...BATTERY, ...change })).toEqual(fields);
  });
});
