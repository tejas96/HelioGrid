import samples from './built-in-yield.fixture.json';

/**
 * What the source of record answered for a point 0.2° away from a district's own point — the
 * table's proof that a site anywhere in the district reads within the label's ±10%. DATA ONLY:
 * the answers are in `built-in-yield.fixture.json`: PVGIS 5.3 asked on 2026-11-13, every tenth district.
 */
export interface OffCentreSample {
  readonly area: string;
  readonly district: string;
  /** Twelve months, kWh for 1 kWp at zero loss, as recorded off-centre. */
  readonly recorded: readonly number[];
}

export const OFF_CENTRE_SAMPLES: readonly OffCentreSample[] = samples;
