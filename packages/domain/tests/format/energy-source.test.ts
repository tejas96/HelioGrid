import { describe, expect, it } from 'vitest';
import { type EnergySource, energySourceOf } from '../../src/format/energy-source';

/**
 * `F8-08`–`F8-10` — an energy figure says which data it came from, and a figure computed from
 * several never reads as the source of record while any of them came from the fallback.
 */

const ESTIMATE: EnergySource = { kind: 'estimate' };
const SARAH3: EnergySource = { kind: 'record', databases: ['SARAH3'] };
const ERA5: EnergySource = { kind: 'record', databases: ['ERA5'] };

describe('energySourceOf', () => {
  it.each([
    { sources: [SARAH3, ESTIMATE] },
    { sources: [ESTIMATE, ERA5] },
    { sources: [ESTIMATE] },
    { sources: [ERA5, ESTIMATE, SARAH3] },
  ])('a figure computed from the fallback carries the fallback (F8-10)', ({ sources }) => {
    expect(energySourceOf(sources)).toEqual({ kind: 'estimate' });
  });

  /* LITERAL lists, so a reorder of the database tuple turns this table red rather than moving
     with it — the order is the order every label prints. */
  it.each([
    { sources: [SARAH3], databases: ['SARAH3'] },
    { sources: [ERA5, SARAH3], databases: ['SARAH3', 'ERA5'] },
    { sources: [SARAH3, ERA5], databases: ['SARAH3', 'ERA5'] },
    { sources: [ERA5, ERA5, SARAH3, ERA5], databases: ['SARAH3', 'ERA5'] },
    {
      sources: [{ kind: 'record', databases: ['ERA5', 'SARAH3'] }, ERA5] as const,
      databases: ['SARAH3', 'ERA5'],
    },
  ])(
    'a figure computed from two databases names each once, in ladder order (F8-08)',
    ({ sources, databases }) => {
      expect(energySourceOf(sources)).toEqual({ kind: 'record', databases });
    },
  );

  it('a figure no irradiance fed carries no source', () => {
    expect(energySourceOf([])).toBeNull();
  });

  it('a source of record names at least one database (F8-08)', () => {
    // @ts-expect-error — a record naming no database would print `Real · PVGIS ()`.
    const namesNothing: EnergySource = { kind: 'record', databases: [] };
    expect(namesNothing.kind).toBe('record');
  });
});
