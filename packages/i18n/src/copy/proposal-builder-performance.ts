import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

/** The words of the builder's step 4: how its figures came, and what a fill still needs. */
type T = Translator['t'];

const PERFORMANCE = {
  filled: /*i18n*/ { id: 'Filled for you' },
  filledLine: /*i18n*/ { id: 'From {source} for {place}, for {size} kW' },
  filledPlaceLine: /*i18n*/ { id: 'From {source} for {place}' },
  filledSizeLine: /*i18n*/ { id: 'From {source}, for {size} kW' },
  filledSourceLine: /*i18n*/ { id: 'From {source}' },
  down: /*i18n*/ { id: '{source} did not answer' },
  downLine: /*i18n*/ {
    id: 'We used the built-in estimate. It can be {tolerance}% off. You can go on.',
  },
  none: /*i18n*/ { id: 'Not filled yet' },
  noneLine: /*i18n*/ { id: 'Set the size in System and the site’s state in Client first.' },
  needsSize: /*i18n*/ { id: 'Set the size in System first.' },
  needsState: /*i18n*/ { id: 'Set the site’s state in Client first.' },
  noEstimate: /*i18n*/ { id: 'No estimate is held for {place}. Pick another place in Client.' },
  noEstimateHere: /*i18n*/ {
    id: 'No estimate is held for this place. Pick another place in Client.',
  },
  readyLine: /*i18n*/ { id: 'Ask {source} for {place}.' },
  readySourceLine: /*i18n*/ { id: 'Ask {source}.' },
  filling: /*i18n*/ { id: 'Filling it in' },
  fillingLine: /*i18n*/ { id: 'Asking {source} for {place}' },
  fillingSourceLine: /*i18n*/ { id: 'Asking {source}' },
  reset: /*i18n*/ { id: 'Reset' },
  tryAgain: /*i18n*/ { id: 'Try {source}' },
  fill: /*i18n*/ { id: 'Fill it in' },
  changed: /*i18n*/ { id: 'The size changed to {size} kW' },
  changedNoSize: /*i18n*/ { id: 'The size changed' },
  changedLine: /*i18n*/ { id: 'Your own month figures are from the old size.' },
  resetToSource: /*i18n*/ { id: 'Reset to AI values' },
  efficiency: /*i18n*/ { id: 'System efficiency' },
  efficiencyHelper: /*i18n*/ { id: 'Losses in cable, inverter and dust. 80% is typical.' },
  months: /*i18n*/ { id: 'Month by month' },
  monthsValue: /*i18n*/ { id: 'Change a month if you know better' },
  monthField: /*i18n*/ { id: '{month}, kWh' },
} as const;

/** How step 4's figures came, as its words need it. */
export interface PerformanceStepFacts {
  readonly fill: 'source' | 'built_in' | 'none' | 'filling';
  /**
   * The source of record's name — `PVGIS`; the district or state the fill is asked for and its size
   * as text, each `null` where the draft holds none, so the words leave that part out.
   */
  readonly source: string;
  readonly place: string | null;
  readonly sizeText: string | null;
  /** The built-in estimate's tolerance, percent (`ESTIMATE_TOLERANCE_PERCENT`). */
  readonly tolerance: number;
  /** Twelve month names, January first, in the reader's words (`format.monthNames('short')`). */
  readonly monthNames: readonly string[];
  /** The figures are the person's own: the act restores the source's. */
  readonly edited: boolean;
  /** What the fill still needs: the size, the site's state; and whether the server refused the last fill. */
  readonly wants: FillWants;
}

/** What a fill needs and how its last ask went, as step 4 says it. */
export interface FillWants {
  readonly size: boolean;
  readonly state: boolean;
  readonly refused: boolean;
}

/**
 * Why step 4 is not filled, naming exactly what is missing — the size, the site's state, or both —
 * and, with both given, that the server held no estimate for the place it was last asked about.
 */
export function fillWantsLine(
  t: T,
  wants: FillWants,
  where: { readonly source: string; readonly place: string | null },
): TranslatedText {
  if (wants.size && wants.state) return t(PERFORMANCE.noneLine);
  if (wants.size) return t(PERFORMANCE.needsSize);
  if (wants.state) return t(PERFORMANCE.needsState);
  const { source, place } = where;
  if (wants.refused) {
    return place === null ? t(PERFORMANCE.noEstimateHere) : t(PERFORMANCE.noEstimate, { place });
  }
  return place === null
    ? t(PERFORMANCE.readySourceLine, { source })
    : t(PERFORMANCE.readyLine, { source, place });
}

/** What the filled figures came from: the source, and the place and size each where it is known. */
function filledLine(t: T, facts: PerformanceStepFacts): TranslatedText {
  const { source, place, sizeText: size } = facts;
  if (place === null && size === null) return t(PERFORMANCE.filledSourceLine, { source });
  if (place === null) return t(PERFORMANCE.filledSizeLine, { source, size });
  if (size === null) return t(PERFORMANCE.filledPlaceLine, { source, place });
  return t(PERFORMANCE.filledLine, { source, place, size });
}

/** Step 4's words. */
export function proposalPerformanceStepWords(t: T, facts: PerformanceStepFacts) {
  const { fill, source, place } = facts;
  const title = {
    source: PERFORMANCE.filled,
    built_in: PERFORMANCE.down,
    none: PERFORMANCE.none,
    filling: PERFORMANCE.filling,
  };
  const line =
    fill === 'source'
      ? filledLine(t, facts)
      : fill === 'built_in'
        ? t(PERFORMANCE.downLine, { tolerance: facts.tolerance })
        : fill === 'filling'
          ? place === null
            ? t(PERFORMANCE.fillingSourceLine, { source })
            : t(PERFORMANCE.fillingLine, { source, place })
          : fillWantsLine(t, facts.wants, { source, place });
  const refill =
    fill === 'built_in'
      ? t(PERFORMANCE.tryAgain, { source })
      : fill === 'none'
        ? t(PERFORMANCE.fill)
        : t(PERFORMANCE.reset);
  return {
    fillTitle: t(title[fill], { source }),
    fillLine: line,
    refill,
    efficiency: t(PERFORMANCE.efficiency),
    efficiencyHelper: t(PERFORMANCE.efficiencyHelper),
    months: t(PERFORMANCE.months),
    monthsValue: t(PERFORMANCE.monthsValue),
    monthNames: facts.monthNames.map((name) => shownAsSent(name)),
    monthField: (month: TranslatedText) => t(PERFORMANCE.monthField, { month }),
    /** The note a changed size raises over the person's own month figures (`T-M06-033`). */
    capacityChanged: {
      title:
        facts.sizeText === null
          ? t(PERFORMANCE.changedNoSize)
          : t(PERFORMANCE.changed, { size: facts.sizeText }),
      line: t(PERFORMANCE.changedLine),
      act: t(PERFORMANCE.resetToSource),
    },
  };
}
