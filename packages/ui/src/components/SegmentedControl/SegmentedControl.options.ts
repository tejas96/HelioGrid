import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

/** A bare string is `{value, label}` — the design system's own shorthand, in one declaration. */
export function normalise(options: SegmentedControlProps['options']): SegmentedOption[] {
  return options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
}

/**
 * Mirrors `!spec` at the design system's own call sites: a segment is "reasoned" only when there is
 * something to say, and that is what keeps it `aria-disabled` and focusable rather than natively
 * `disabled` (law 9). The sentence itself is `ActionReason`'s and the marks are `MarkRow`'s.
 */
export function hasReason(option: SegmentedOption): boolean {
  const spec = option.disabledReason;
  return spec !== undefined && spec !== null && spec !== false && spec !== '';
}
