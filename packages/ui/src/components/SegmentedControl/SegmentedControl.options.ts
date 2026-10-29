import { reasonText } from '../ActionReason/ActionReason.logic';
import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

/**
 * Mirrors `!spec` at the design system's own call sites: a segment is "reasoned" only when there is
 * something to say, and that is what keeps it `aria-disabled` and focusable rather than natively
 * `disabled` (law 9). The sentence itself is `ActionReason`'s and the marks are `MarkRow`'s.
 */
export function hasReason(option: SegmentedOption): boolean {
  return reasonText(option.disabledReason) !== null;
}

/** The off segments that say why — each one's sentence is drawn under the control. */
export function reasonedOptions(options: SegmentedOption[]): SegmentedOption[] {
  return options.filter((option) => option.disabled === true && hasReason(option));
}

/** Where the active pill sits — the first segment when no option holds the value. */
export function selectedIndex(options: SegmentedOption[], value: string): number {
  return Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
}

/**
 * A NAMED OR ERRORED CONTROL IS A FIELD — a `radiogroup` of `radio`s on both halves. Without a name
 * or an error it is a view switcher, a row of buttons.
 */
export function isFieldControl({
  label,
  ariaLabel,
  error,
}: Pick<SegmentedControlProps, 'label' | 'ariaLabel' | 'error'>): boolean {
  return label !== undefined || ariaLabel !== undefined || error !== undefined;
}
