import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/** Expressive = the 28px "+N" pill; functional = the dense 24px one. Matches `Chip`. */
export type ChipGroupDensity = 'expressive' | 'functional';

/**
 * The "+N" control's words, in the reader's language — `@heliogrid/i18n`'s `chipGroupWords(t, noun)`,
 * with the group's own noun (`label`) in them.
 */
export interface ChipGroupWords {
  /** The open control's visible words — *Show fewer*. */
  showFewer: TranslatedText;
  /** The open control's spoken name — *Show fewer roles*. */
  showFewerSpoken: TranslatedText;
  /** The closed control's spoken name — *Show 2 more roles (5 in total)*. */
  showMore: (hidden: number, total: number) => TranslatedText;
}

interface ChipGroupFields {
  /** The chips themselves — `Chip`, `Badge`, `StatusChip`, in the caller's order. */
  children?: ReactNode;
  /** The group's noun — "roles", "schemes". Becomes the accessible name. */
  label?: TranslatedText;
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

/**
 * How many render whole before the rest collapse behind one "+N" (default 3). `0` never collapses,
 * so it alone draws no "+N" control and needs no `words`.
 */
export type ChipGroupProps = ChipGroupFields &
  ({ max: 0; words?: ChipGroupWords } | { max?: number; words: ChipGroupWords });

export interface MarkRowProps {
  children?: ReactNode;
  gap?: number;
}
