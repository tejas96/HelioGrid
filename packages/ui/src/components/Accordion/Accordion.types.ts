import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/**
 * The same vocabulary `Stepper` uses one component over (`M05-03`): the state is a word, not a colour.
 * `errors` sets `aria-invalid` on the header, marks the state word — the caller's *3 to fix* — and its
 * dot in the danger tone, and **opens the section** — a system that refuses a save must
 * not then hide which of eight sections to fix (`M07-19`). The section takes no tint: it is a heading
 * on the page, and its body may hold a field (`F7-49`). Every other word reads beside the title
 * (`standingPlace`), a marked state's with a dot before it.
 */
export type AccordionItemState = 'default' | 'done' | 'empty' | 'errors';

/**
 * A section, and where it stands. `stateLabel` is the state's word — *Done*, *Empty*, *3 to fix*, or a
 * screen's own vocabulary (`M06-27`'s Selected) — in the reader's language. The standing (the word
 * and its dot) is drawn only when the word is given.
 */
export interface AccordionItem {
  key: string;
  title: TranslatedText;
  /** Right-aligned micro text — a count, a status ("12 items"). **Not a tier**, and not a total. */
  meta?: TranslatedText;
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
  /** How many things in an `errors` section need fixing — the count the caller's `stateLabel` says. */
  errorCount?: number;
  stateLabel?: TranslatedText;
  /**
   * The tier for a figure this section header summarises (`F8-01` / `F8-07`) — beside the meta, which
   * is where the figure already is. Keeps tiers out of `meta` as free text.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  content: ReactNode;
}

/** The three states that carry a word and a mark. `default` carries neither unless asked to. */
export type AccordionMarkedState = Exclude<AccordionItemState, 'default'>;

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

/** The word the header prints — always the caller's, so a marked state keeps its mark beside it. */
export function accordionStateWord(item: AccordionItem): TranslatedText | undefined {
  return item.stateLabel;
}

/**
 * Where the header prints the word. A section in errors says so at the row's end, in the danger
 * tone; every other standing reads beside the title. Both halves place the word by this one rule,
 * so a section cannot stand in two places on two platforms.
 */
export type StandingPlace = 'title' | 'end';

export function standingPlace(item: AccordionItem): StandingPlace {
  return item.state === 'errors' ? 'end' : 'title';
}

/** The marked states only — `default` has no mark, so its word (if any) renders unmarked. */
export function markedState(item: AccordionItem): AccordionMarkedState | undefined {
  return item.state !== undefined && item.state !== 'default' ? item.state : undefined;
}
