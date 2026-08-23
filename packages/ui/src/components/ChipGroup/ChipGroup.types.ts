import type { ReactNode } from 'react';

/** Expressive = the 28px "+N" pill; functional = the dense 24px one. Matches `Chip`. */
export type ChipGroupDensity = 'expressive' | 'functional';

export interface ChipGroupProps {
  /** The chips themselves — `Chip`, `Badge`, `StatusChip`, in the caller's order. */
  children?: ReactNode;
  /** How many render whole before the rest collapse behind one "+N". `0` never collapses. */
  max?: number;
  /** The group's noun — "roles", "schemes". Becomes the accessible name and the "+N" label. */
  label?: string;
  /**
   * What zero chips renders. Nothing by default, and **never an error** (`M01-34`). Two answers,
   * and a hand-rolled grey line is neither: `null` where the law says no badges at all, or
   * `<NamedGap scale="cell" gap="No flags" />` where the absence should be **named** — that is the
   * system's one treatment for an absent cell value.
   */
  empty?: ReactNode;
  /** `false` where the rest must not be reachable (a print band). The count still shows. */
  expandable?: boolean;
  defaultExpanded?: boolean;
  density?: ChipGroupDensity;
  gap?: number;
}

export interface MarkRowProps {
  children?: ReactNode;
  gap?: number;
}
