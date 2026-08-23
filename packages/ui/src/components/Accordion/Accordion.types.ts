import type { ReactNode } from 'react';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/**
 * The same vocabulary `Stepper` uses one component over (`M05-03`): the state is a word, not a colour.
 * `errors` shows "N to fix" from `errorCount`, sets `aria-invalid` on the header, tints the section,
 * and **opens the section** — a system that refuses a save must not then hide which of eight sections
 * to fix (`M07-19`). A tinted section steps its quiet lines (`meta`, the chevron) up to
 * `--text-secondary`, because `--text-tertiary` measures 4.48 on `--danger-bg`: a state tint never
 * costs the reader a word.
 */
export type AccordionItemState = 'default' | 'done' | 'empty' | 'errors';

export interface AccordionItem {
  key: string;
  title: string;
  /** Right-aligned micro text — a count, a status ("12 items"). **Not a tier**, and not a total. */
  meta?: string;
  /**
   * The sum this section's own lines come to (`M05-71`'s *own total*) — mono, tabular, right of the
   * meta. Law 16's rule holds here: `total` is a **sum of the parts shown**, never a denominator, a
   * target or a record count.
   */
  total?: ReactNode;
  /**
   * Marks the header carries — `Badge`, `StatusChip`, a compliance `ChipGroup`. `F7-12` needs a label
   * **plus** a mark, and a string slot cannot hold one. Rendered through `MarkRow`, so several marks
   * stay separately readable.
   */
  marks?: ReactNode | ReactNode[];
  /** A header action — `M05-71`'s "Refresh from design". A **sibling** of the toggle, never inside it. */
  action?: ReactNode;
  state?: AccordionItemState;
  /** `errors` → "3 to fix". */
  errorCount?: number;
  /** Replaces the state's default word, for a section vocabulary of the screen's own (`M06-27`). */
  stateLabel?: string;
  /**
   * The tier for a figure this section header summarises (`F8-01` / `F8-07`) — beside the meta, which
   * is where the figure already is. Keeps tiers out of `meta` as free text.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Controlled: a key (single) or array of keys (multiple). */
  value?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  multiple?: boolean;
  defaultOpen?: string[];
  /** A section that **becomes** errored opens itself; the user may collapse it again. Default true. */
  openWithErrors?: boolean;
  density?: 'expressive' | 'functional';
}

/** The three states that carry a word and a mark. `default` carries neither unless asked to. */
export type AccordionMarkedState = Exclude<AccordionItemState, 'default'>;

/** True for the one state whose tint becomes a third background under the quiet lines. */
export function isTinted(state: AccordionItemState | undefined): boolean {
  return state === 'errors';
}

/**
 * The word the header prints. `stateLabel` always wins, so a screen with its own section vocabulary
 * (`M06-27`'s Selected / Empty) replaces the default without losing the mark.
 */
export function accordionStateWord(item: AccordionItem): string | undefined {
  if (item.stateLabel !== undefined) return item.stateLabel;
  if (item.state === 'errors') {
    return item.errorCount !== undefined && item.errorCount > 0
      ? `${item.errorCount} to fix`
      : 'Needs fixing';
  }
  if (item.state === 'done') return 'Done';
  if (item.state === 'empty') return 'Empty';
  return undefined;
}

/** The marked states only — `default` has no mark, so its word (if any) renders unmarked. */
export function markedState(item: AccordionItem): AccordionMarkedState | undefined {
  return item.state !== undefined && item.state !== 'default' ? item.state : undefined;
}
