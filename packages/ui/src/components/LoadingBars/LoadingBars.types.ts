import type { TranslatedText } from '@heliogrid/contracts';
/**
 * What one bar stands for while a list's record loads: `row` a closed section's header, `panel` a
 * section that will open with its fields, `control` a switch or one control row (40px —
 * `SCR-M01-18`'s editor switch), `line` one line of a list of phrases — a mark and the
 * phrase beside it (`SCR-M01-10`, `m-loading`), `option` one option card — its mark, its title and
 * its description (`SCR-M01-13`, `m-loading`; two description lines in a narrow room, one in a
 * wide one), `count` one count in a tile, a caption-high box holding a short pill (`SCR-M01-14`,
 * `m-loading`). A size is a name, never a number from the caller, so two screens cannot draw the same
 * wait at two heights.
 */
export type LoadingBarSize = 'row' | 'panel' | 'control' | 'line' | 'option' | 'count';

interface LoadingBarsBase {
  /** One bar per part of the list, in the list's order. */
  bars: readonly LoadingBarSize[];
}

/**
 * Either the bars are the busy region and carry its name, or they sit inside a busy region the
 * caller already named — one wait, announced once. A busy region with no name tells a screen
 * reader nothing, so one of the two is always said.
 */
export type LoadingBarsProps = LoadingBarsBase &
  (
    | {
        /** Required words — what is loading. */
        label: TranslatedText;
        inBusyRegion?: never;
      }
    | { inBusyRegion: true; label?: never }
  );
