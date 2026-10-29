import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * The four things a long-form explanation can be, plus `note`.
 *
 * - `formula` — `M05-72`'s *formula in words*.
 * - `assumption` — `MS6-47`'s "nominal — engineer to confirm".
 * - `boundary` — `MS7-22`'s model boundary, *stated in the surface that uses it*.
 * - `exclusion` — what the figure leaves out.
 */
export type DerivationKind = 'formula' | 'assumption' | 'boundary' | 'exclusion' | 'note';

export interface DerivationPart {
  kind: DerivationKind;
  text: ReactNode;
  /** Overrides the kind's own heading. */
  label?: TranslatedText;
}

/**
 * Each kind's heading in the reader's language — `@heliogrid/i18n`'s `derivationWords(t).kinds`.
 * A part with no `label` of its own is headed by its kind's word.
 */
export type DerivationKindWords = Readonly<Record<DerivationKind, TranslatedText>>;

export interface DerivationProps {
  /** What number this explains — "Mounting rail · line 12". Also its key in the print appendix. */
  label?: ReactNode;
  /** The trigger words. Short by obligation: it sits on a table line forty times. */
  summary: TranslatedText;
  parts: DerivationPart[];
  /** The kinds' headings — `derivationWords(t).kinds`. */
  kindWords: DerivationKindWords;
  /** `cell` (default) — a 12px trigger under a value. `block` — a section under a headline figure. */
  variant?: 'cell' | 'block';
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  id?: string;
}

export interface DerivationGroupProps {
  children?: ReactNode;
  /**
   * `single` (default) — one open at a time, so forty lines can never become forty panels.
   *
   * `many` — each panel owns itself. **For the two-or-three-explanation surfaces** where comparing
   * the explanations side by side *is* the reading and the 40-line constraint is not present.
   * Opt-in, per group.
   *
   * Neither mode is an `openAll`: there is no control that opens a panel the reader did not open.
   */
  mode?: 'single' | 'many';
  /**
   * `appendix` (default) — on paper the explanations leave the lines and print **once**, as a
   * numbered appendix keyed to each `label`; the inline panels become screen-only. `inline` prints
   * them in place.
   */
  printAs?: 'appendix' | 'inline';
  /** The print appendix's heading — `derivationWords(t).appendixTitle`. */
  appendixTitle: TranslatedText;
}

/** The kinds, in the order an explanation reads them. Their headings are the caller's words. */
export const DERIVATION_KINDS: readonly DerivationKind[] = [
  'formula',
  'assumption',
  'boundary',
  'exclusion',
  'note',
];

/**
 * A serialised identity for a `parts` array — the effect dependency that stops an inline array
 * literal from re-registering on every render.
 */
export function partsKey(parts: DerivationPart[] | undefined): string {
  return (parts ?? [])
    .map((part) => `${part.kind}|${typeof part.text === 'string' ? part.text : ''}`)
    .join('~');
}

/** The kind headings' serialised identity — so a language change re-registers the appendix. */
export function kindWordsKey(kindWords: DerivationKindWords): string {
  return DERIVATION_KINDS.map((kind) => kindWords[kind]).join('~');
}
