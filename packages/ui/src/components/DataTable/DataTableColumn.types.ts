import type { ReactNode } from 'react';
import type { FieldOverrideSpec } from '../FieldOverride/FieldOverride.types';
import type { NamedGapSpec } from '../NamedGap';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { ValueSourceSpec } from '../ValueSource';

export interface DataTableColumn<Row = Record<string, unknown>> {
  key: string;
  label: string;
  /** Right-aligns, uses Geist Mono and tabular-nums. */
  numeric?: boolean;
  mono?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  muted?: boolean;
  strong?: boolean;
  /** Becomes the card title when the table stacks. Defaults to the first column. */
  primary?: boolean;
  /** Sits under the title when stacked. */
  secondary?: boolean;
  /** Sits on the title row, right-aligned, when stacked — usually the value. */
  trailing?: boolean;
  hideStacked?: boolean;
  sortable?: boolean;
  sortValue?: (row: Row) => string | number;
  render?: (row: Row) => ReactNode;
  /**
   * Provenance for this column's numbers — rendered as a **visible word** in the header and in the
   * stacked card (`F8-07`), with the dot as a second channel only. Takes a bare tier or a full
   * spec. **A column whose tier matches the table-wide `provenance` does not repeat it** — the one
   * legitimate compression of `F8-07`, because the fact is still on screen, stated once.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /**
   * **This row's figure, in this column, has its own standing** — the per-record resolver `M11-42`
   * needs: money the tenant's account confirmed and money a person says arrived are visibly
   * different things, **on every surface**. `provenance` above is column-**wide** and lands in the
   * header; a column-wide `standing` would brand all forty rows.
   *
   * The table owns the slot — directly under the value, above the validation message — on **both**
   * forms. A cell showing a **named gap** drops it: there is no figure to qualify.
   */
  provenanceFor?: (row: Row) => ProvenanceProps | ProvenanceTierSpec | null;
  /**
   * Makes this column's cells editable **in place** (`M01-41`). Requires the table's
   * `onCellCommit` — two hands on the switch, so no column becomes editable by accident.
   */
  editable?: boolean;
  /**
   * `text` (default), `number`, or `select` with `options`.
   *
   * All three take the **column header as their accessible name** — a cell has no room for a
   * visible `<label>`, so the editors carry it on the control itself.
   */
  editor?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[] | string[];
  /** The raw value the editor edits, when `render` produces something richer than the value. */
  editValue?: (row: Row) => string | number | undefined;
  /**
   * The one override treatment for this cell (`MS10-18`'s eleven editable BOM columns). Return a
   * `FieldOverrideSpec` or null; `FieldOverride` renders marker → superseded value → reset under
   * the cell's value.
   */
  override?: (row: Row) => FieldOverrideSpec | null;
  /**
   * **Which layer supplied this cell's value** (`SCR-M01-15`), rendered by `ValueSource`. Mutually
   * exclusive with `override` — the cell renders the override line for an overridden value and
   * this for an un-overridden one, never both.
   *
   * It returns the **spec**: the cell binds the column's header to it as `fieldName`, which is
   * what `SCR-M01-15` needs — "Platform catalogue" beside a bare number says which layer but not
   * which *field*, and only the table knows the column's name.
   */
  attribution?: (row: Row) => ValueSourceSpec | null;
  /**
   * **This row has no value for this column, and the cell says what is missing** — `M02-03`'s
   * named gaps. Return the sentence ("No city yet") or `null` where the value is present. Never an
   * em-dash: "—" says *nothing here*, and these rows require the product to say **what**.
   *
   * A gap **suppresses `override` and `attribution`** — nothing was superseded, and no layer
   * supplied a value that does not exist — but not the editor: on an `editable` column the editor
   * is how the gap gets filled.
   *
   * Return the sentence or a whole `NamedGapSpec`: `NamedGap` renders it at the `cell` scale with
   * the column's alignment, and a spec carries the act that fills it (`M02-03` forbids inventing
   * the value, not asking for it). Tertiary-grey words in the cell were the colour of a gap and
   * none of its behaviour.
   */
  gap?: (row: Row) => ReactNode | NamedGapSpec | null;
  /**
   * **The cell may take more than one line.** The rule a `ChipGroup` column needs: the chips wrap,
   * the row grows (`rowH` is a floor, not a cap), and the column takes the **full width** of the
   * stacked card with its label above rather than beside it.
   *
   * **It wins over the card's slots.** A `wrap` column also marked `secondary` or `trailing` is
   * rendered in the stacked card's detail list, not in that slot: the full-width label-above
   * treatment only exists there, and so does the tappability a wrap cell needs on a clickable row.
   * A `wrap` `primary` stays the card's title and takes the taps back.
   */
  wrap?: boolean;
}
