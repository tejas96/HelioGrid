import { UI_LANGUAGES } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { ENERGY_SOURCE_WORD, energySourceLabel } from '../src/copy/energy-source';
import { createTranslator } from '../src/runtime';

/**
 * `F8-08` — the two source labels are fixed copy, and the database name and the tolerance inside
 * them are never translated.
 */
describe('energySourceLabel', () => {
  it('reads the fixed English copy (F8-08)', async () => {
    const { t } = await createTranslator('en');
    expect(energySourceLabel(t, { kind: 'record', databases: ['SARAH3'] })).toBe(
      'Real · PVGIS (SARAH3)',
    );
    expect(energySourceLabel(t, { kind: 'record', databases: ['SARAH3', 'ERA5'] })).toBe(
      'Real · PVGIS (SARAH3, ERA5)',
    );
    expect(energySourceLabel(t, { kind: 'estimate' })).toBe('Built-in estimate ±10%');
  });

  it('prints each database once, in ladder order, however the source was gathered (F8-24)', async () => {
    const { t } = await createTranslator('en');
    expect(energySourceLabel(t, { kind: 'record', databases: ['ERA5', 'SARAH3', 'SARAH3'] })).toBe(
      'Real · PVGIS (SARAH3, ERA5)',
    );
  });

  it.each(UI_LANGUAGES)(
    'names the database and the tolerance unchanged in every language (F8-08)',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(energySourceLabel(t, { kind: 'record', databases: ['SARAH3', 'ERA5'] })).toContain(
        'PVGIS (SARAH3, ERA5)',
      );
      expect(energySourceLabel(t, { kind: 'estimate' })).toContain('±10%');
      /* A catalog that wrote the number instead of its slot would still print ±10% above; a
         tolerance it was never given catches it. */
      expect(t(ENERGY_SOURCE_WORD.estimate, { tolerance: 7 })).toContain('±7%');
    },
  );
});
