import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { NumberOptions } from '../../utils/format';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceRead, SurfaceState } from '../UnavailableNote/UnavailableNote.types';

/**
 * **What a `provenance` prop accepts**, here as everywhere: the full spec object or a bare tier.
 * `renderProvenance` resolves both — which is why nothing in this folder renders a `provenance`
 * value directly.
 */
export type CompareProvenanceSpec = ProvenanceProps | ProvenanceTierSpec;

export interface CompareOption {
  key: string;
  /** The column heading — "Variant B", "Growth plan": the option's own name. */
  name: string;
  subtitle?: TranslatedText;
  /**
   * **The option in force.** Not the same fact as selected — you choose the one you are moving
   * *to* — so it is a word in its own pill.
   */
  current?: boolean;
  /** Facts that can be true together, rendered by `MarkRow`. */
  marks?: ReactNode | ReactNode[];
  /** `{ [attribute key]: value }` — a number the pack formats, or a ready node. */
  values?: Record<string, ReactNode | number>;
}

export interface CompareAttribute<Opt extends CompareOption = CompareOption> {
  key: string;
  /** The row label, pinned at the left edge. This is the thing the reader holds still. */
  label: TranslatedText;
  /** Second line under the label — "years", "kWp", "₹ per kWh": the market pack's unit. */
  unit?: string;
  /** Reads the value off an option when it isn't in `option.values`. */
  value?: (option: Opt) => ReactNode | number;
  /** Formats a numeric value. Otherwise the market pack does. */
  format?: (v: number) => string;
  money?: boolean;
  compact?: boolean;
  numberOptions?: NumberOptions;
  numeric?: boolean;
  mono?: boolean;
  strong?: boolean;
  /**
   * Which direction is better, and the **only** thing that marks a row's best value — with the
   * word "Best", never colour alone. Numbers only, and a tie marks nothing: guessing which of two
   * equal values wins is confident nonsense.
   */
  better?: 'higher' | 'lower';
  /** A tier for this row's figures, rendered under the label by `renderProvenance`. */
  provenance?: CompareProvenanceSpec;
  /**
   * **What this row's absence is called**, when an option has no value for it — "Not included",
   * "Not measured on this variant". Rendered by `NamedGap` in the cell; the fallback is the words'
   * `notStated`, a statement about the *data* that invents nothing about the option. Never an
   * em-dash, which says *nothing here* and leaves the reader guessing which kind of nothing.
   */
  gapLabel?: TranslatedText;
}

/** `@heliogrid/i18n`'s `compareGridWords`: the words the grid draws and speaks of its own. */
export interface CompareGridWords {
  /** A row's best value is marked with this word, never colour alone. */
  readonly best: TranslatedText;
  /** The pinned column's heading, spoken only. */
  readonly attribute: TranslatedText;
  /** The choice row's heading, spoken only. */
  readonly chooseOption: TranslatedText;
  /** A row's named gap when the row names none. */
  readonly notStated: TranslatedText;
  /** The loading form's name. */
  readonly loading: TranslatedText;
  /** The option axis's name — "Compare 3 options". */
  readonly compare: (count: number) => TranslatedText;
  /** Where the reader is on an axis that overflows — `where` is "2" or "2–3"; the caller's note. */
  readonly position: (where: string, count: number, note?: string) => TranslatedText;
  readonly previousOption: TranslatedText;
  readonly nextOption: TranslatedText;
  /** The phone's choice, named with its option — "Choose: Variant B". */
  readonly optionNamed: (word: string, option: string) => TranslatedText;
}

export interface CompareGridProps<Opt extends CompareOption = CompareOption> {
  /** The rows. `MS4-30`'s eleven computed comparison columns are eleven of these. */
  attributes: CompareAttribute<Opt>[];
  /** The columns — 2 to 4 options, and the snap rendering holds four. */
  options: Opt[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  /** The choice's words, and the pills for the selected option and the option in force. */
  selectLabel: TranslatedText;
  selectedLabel: TranslatedText;
  currentLabel: TranslatedText;
  /** Overline above the grid, and the accessible name of the matrix. */
  caption?: TranslatedText;
  /** One provenance statement for the whole comparison, in the footer. */
  provenance?: CompareProvenanceSpec;
  /** A quiet footer line beside the position readout. */
  note?: TranslatedText;
  /**
   * Option column width. Default 196.
   *
   * The pinned label column takes `labelWidth` (128), leaving a `375 − 128 = 247px` option track
   * at phone width: **one whole column and a 51px sliver of the next**. The sliver is not a
   * shortfall — it is what makes the snap readable: a variant is visibly *arriving*, and the label
   * it lines up against never moves. A caller who needs two whole columns narrows the pair
   * (`columnWidth={110} labelWidth={112}`); the component will not make that trade on its own.
   */
  columnWidth?: number;
  /** Pinned attribute-column width. Default 128 — see `columnWidth` for what that leaves at 375px. */
  labelWidth?: number;
  /**
   * The system's five. `unavailable` is rendered by `UnavailableNote` — neutral, and no retry.
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  emptyTitle: TranslatedText;
  emptyMessage?: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unavailableTitle: TranslatedText;
  unavailableMessage?: TranslatedText;
  density?: 'expressive' | 'functional';
  words: CompareGridWords;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** Where the reader is on the option axis: the whole columns on screen, of how many. */
export interface AxisPosition {
  scrollable: boolean;
  first: number;
  last: number;
  count: number;
  note?: TranslatedText;
}

export interface CompareGridFooterProps extends AxisPosition {
  onStep: (direction: number) => void;
  words: CompareGridWords;
}

export interface CompareGridStatePanelProps {
  state: SurfaceState;
  emptyTitle: TranslatedText;
  emptyMessage?: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  unavailableTitle: TranslatedText;
  unavailableMessage?: TranslatedText;
  words: CompareGridWords;
  /** The grid's frame, which stays while a failed read reloads. */
  focusAfter: FocusAfter;
}
