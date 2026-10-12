/**
 * What one bar stands for while a list's record loads: `row` a closed section's header, `panel` a
 * section that will open with its fields. A size is a name, never a number from the caller, so two
 * screens cannot draw the same wait at two heights.
 */
export type LoadingBarSize = 'row' | 'panel';

export interface LoadingBarsProps {
  /** Required words — what is loading. A busy region with no name tells a screen reader nothing. */
  label: string;
  /** One bar per part of the list, in the list's order. */
  bars: readonly LoadingBarSize[];
}
