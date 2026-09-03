import type { ReactNode } from 'react';
import type { NumberOptions } from '../../utils/format';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';

/**
 * **What a `provenance` prop accepts**, here as everywhere: the full spec object, a bare tier
 * string, or a ready node. `renderProvenance` resolves all three — which is why nothing in this
 * folder renders a `provenance` value directly.
 */
export type CompareProvenanceSpec = ProvenanceProps | ProvenanceTierSpec | ReactNode;

export interface CompareOption {
  key: string;
  /** The column heading — "Variant B", "Growth plan". */
  name: string;
  subtitle?: string;
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
  label: string;
  /** Second line under the label — "years", "kWp", "₹ per kWh". */
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
   * "Not measured on this variant". Rendered by `NamedGap` in the cell; the fallback is "Not
   * stated", a statement about the *data* that invents nothing about the option. Never an em-dash,
   * which says *nothing here* and leaves the reader guessing which kind of nothing.
   */
  gapLabel?: string;
}

export interface CompareGridProps<Opt extends CompareOption = CompareOption> {
  /** The rows. `MS4-30`'s eleven computed comparison columns are eleven of these. */
  attributes: CompareAttribute<Opt>[];
  /** The columns — 2 to 4 options, and the snap rendering holds four. */
  options: Opt[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  selectLabel?: string;
  selectedLabel?: string;
  currentLabel?: string;
  /** Overline above the grid, and the accessible name of the matrix. */
  caption?: string;
  /** One provenance statement for the whole comparison, in the footer. */
  provenance?: CompareProvenanceSpec;
  /** A quiet footer line beside the position readout. */
  note?: string;
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
  /** The system's five. `unavailable` is rendered by `UnavailableNote` — neutral, and no retry. */
  state?: SurfaceState;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  density?: 'expressive' | 'functional';
}
