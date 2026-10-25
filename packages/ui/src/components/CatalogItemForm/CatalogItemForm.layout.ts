import type { ComponentKind } from '@heliogrid/domain';

/** One field of the spec block: a figure, one of the three lists, or the inverter's MPPT window. */
export type SpecCell =
  | { readonly path: string; readonly as: 'number'; readonly precision?: number }
  | { readonly path: 'technology'; readonly as: 'technology' }
  | { readonly path: 'phases'; readonly as: 'phases' }
  | { readonly path: 'chemistry'; readonly as: 'chemistry' }
  /** `mppt.minV` and `mppt.maxV` as one `RangeField`. */
  | { readonly path: 'mppt.window'; readonly as: 'window' };

/** One row of the grid: its column count and the cells it holds (a row may leave columns empty). */
export interface SpecRow {
  readonly columns: number;
  readonly cells: readonly SpecCell[];
}

export interface SpecLayout {
  /** The 1536 rows. */
  readonly wide: readonly SpecRow[];
  /** The 375 rows: pairs, a lone field full width. */
  readonly narrow: readonly SpecRow[];
  /** The optional fields, after *Optional*: their columns at each width. */
  readonly optional: {
    readonly wide: number;
    readonly narrow: number;
    readonly cells: readonly SpecCell[];
  };
}

const n = (path: string, precision?: number): SpecCell =>
  precision === undefined ? { path, as: 'number' } : { path, as: 'number', precision };
const row = (columns: number, ...cells: SpecCell[]): SpecRow => ({ columns, cells });
const TECHNOLOGY: SpecCell = { path: 'technology', as: 'technology' };
const PHASES: SpecCell = { path: 'phases', as: 'phases' };
const CHEMISTRY: SpecCell = { path: 'chemistry', as: 'chemistry' };
const WINDOW: SpecCell = { path: 'mppt.window', as: 'window' };
const WARRANTY = { wide: 2, narrow: 1, cells: [n('warrantyYears')] } as const;

/**
 * Each kind's spec block as its locked board lays it out (`.design/M01/SCR-M01-16-*`): the panel,
 * inverter and battery as drawn; the micro-inverter and the optimiser, which no frame draws,
 * composed from the inverter's parts — one rated figure, then the warranty under *Optional*.
 */
export const SPEC_LAYOUT: Readonly<Record<ComponentKind, SpecLayout>> = {
  panel: {
    wide: [
      row(2, n('watt'), TECHNOLOGY),
      row(2, n('lengthMm'), n('widthMm')),
      row(4, n('vocV', 1), n('vmpV', 1), n('iscA', 2), n('impA', 2)),
      row(2, n('tempCoeffVocPct', 2)),
    ],
    narrow: [
      row(2, n('watt'), TECHNOLOGY),
      row(2, n('lengthMm'), n('widthMm')),
      row(2, n('vocV', 1), n('vmpV', 1)),
      row(2, n('iscA', 2), n('impA', 2)),
      row(1, n('tempCoeffVocPct', 2)),
    ],
    optional: {
      wide: 4,
      narrow: 2,
      cells: [n('tempCoeffPmaxPct', 2), n('bifacialityPct'), n('warrantyYears'), n('weightKg', 1)],
    },
  },
  inverter: {
    wide: [
      row(2, n('acKw', 1), PHASES),
      row(2, n('maxDcV'), n('efficiencyPct', 1)),
      row(3, n('mppt.count'), n('mppt.stringsPerMppt'), n('mppt.maxCurrentA')),
      row(2, WINDOW),
    ],
    narrow: [
      row(2, n('acKw', 1), PHASES),
      row(2, n('maxDcV'), n('efficiencyPct', 1)),
      row(2, n('mppt.count'), n('mppt.stringsPerMppt')),
      row(1, n('mppt.maxCurrentA')),
      row(1, WINDOW),
    ],
    optional: WARRANTY,
  },
  battery: {
    wide: [
      row(2, n('usableKwh', 1), n('nominalV', 1)),
      row(2, CHEMISTRY, n('powerKw', 1)),
      row(2, n('cycleLife'), n('weightKg')),
      row(3, n('widthMm'), n('depthMm'), n('heightMm')),
    ],
    narrow: [
      row(2, n('usableKwh', 1), n('nominalV', 1)),
      row(2, CHEMISTRY, n('powerKw', 1)),
      row(2, n('cycleLife'), n('weightKg')),
      row(2, n('widthMm'), n('depthMm')),
      row(1, n('heightMm')),
    ],
    optional: WARRANTY,
  },
  micro_inverter: {
    wide: [row(2, n('ratedAcW'))],
    narrow: [row(1, n('ratedAcW'))],
    optional: WARRANTY,
  },
  optimiser: {
    wide: [row(2, n('ratedInputW'))],
    narrow: [row(1, n('ratedInputW'))],
    optional: WARRANTY,
  },
};
