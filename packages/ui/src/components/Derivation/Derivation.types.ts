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
  label?: string;
}

export interface DerivationProps {
  /** What number this explains — "Mounting rail · line 12". Also its key in the print appendix. */
  label?: ReactNode;
  /** The trigger words. Short by obligation: it sits on a table line forty times. */
  summary?: ReactNode;
  parts: DerivationPart[];
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
  appendixTitle?: string;
}

/** The heading each kind carries when a part does not override it. */
export const DERIVATION_KINDS: Record<DerivationKind, { label: string }> = {
  formula: { label: 'How it is worked out' },
  assumption: { label: 'Assumed' },
  boundary: { label: 'Where the model stops' },
  exclusion: { label: 'Not included' },
  note: { label: 'Note' },
};

/**
 * A serialised identity for a `parts` array — the effect dependency that stops an inline array
 * literal from re-registering on every render.
 */
export function partsKey(parts: DerivationPart[] | undefined): string {
  return (parts ?? [])
    .map((part) => `${part.kind}|${typeof part.text === 'string' ? part.text : ''}`)
    .join('~');
}
