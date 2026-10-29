import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { NamedGapSpec } from '../NamedGap/NamedGap.types';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance/Provenance.types';

/** `pair` — label and value on one line inside a reading measure. `lead` — full width: the mark,
 *  the row's word leading the line, the value flowing on from it and wrapping under the word. */
export type FactForm = 'pair' | 'lead';

/** What a row actually rendered: the pair, the one-line-that-wraps flow, or the stacked list. */
export type FactShape = 'pair' | 'flow' | 'stack';

export type FactDensity = 'expressive' | 'functional';

/** Why a group took its form: `fits` (measured, every value on one line), `measured` (a value would
 *  have wrapped), `declared` (a caller's `long`, a long string or a stacked list), `floor` (the box
 *  is under `leadBelow`), `forced` (the caller's `form`). */
export type FactReason = 'fits' | 'measured' | 'declared' | 'floor' | 'forced';

/** A standalone row's answer, as `FactRowProps.onFormChange` reports it. */
export interface FactRowForm {
  form: FactForm;
  shape: FactShape;
  width: number;
  hasMark: boolean;
}

/** A group's answer, as `FactRowsProps.onFormChange` reports it. */
export interface FactRowsForm {
  form: FactForm;
  width: number;
  hasMark: boolean;
  reason: FactReason;
}

export interface FactRowProps {
  /** The row's word. Sentence case, no trailing colon — the arrangement already says it is a label. */
  label: TranslatedText;
  /** A short value (a number, a date, a name, a state) or a long one. Nodes welcome. */
  value?: ReactNode;
  /** A list of values. Short items are joined on the line with a middle dot; items long enough to
   *  need a line each stack instead; see `stack`. */
  values?: ReactNode[];
  /** `true` gives every item its own line under the word, `false` joins them on it. Auto: stacks
   *  when any item is a string longer than `longAt`. */
  stack?: boolean;
  /** `true` forces the full-width form, `false` keeps the pair. Auto: a long string value or a
   *  stacked list declares itself long; everything else is measured. */
  long?: boolean;
  /** The optional leading mark — never the only carrier of a fact. Where any row in a group has
   *  one, every row in that group reserves the column, so the words keep one left edge. */
  mark?: ReactNode;
  /** Under the value, in the value's own column, in `pair`; inline at the end of the line in
   *  `lead`. Never a ready node: a caller's element could print a fifth tier (`F8-03`). */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /** A named absence in the value's place. Takes the place of `provenance`: passing both drops
   *  the tier and warns. */
  gap?: NamedGapSpec;
  /** Named in the gap action's accessible label. Defaults to this row's own label. */
  fieldName?: TranslatedText;
  density?: FactDensity;
  /** The reading measure in characters for a standalone row's `pair` form. Inside a `FactRows`
   *  the group owns it. */
  measure?: number;
  /** The floor, not the switch: a box narrower than this cannot hold a pair (default 240). A box
   *  not laid out yet measures 0, which is not a measurement and never reaches this floor. */
  leadBelow?: number;
  /** A string value longer than this declares itself long without being measured. Default 32. */
  longAt?: number;
  form?: FactForm | 'auto';
  /** Fires when a standalone row's answer changes. In a group, listen on the group. */
  onFormChange?: (info: FactRowForm) => void;
}

export interface FactRowsProps {
  children?: ReactNode;
  /** Names the set for a screen reader — "Site details". */
  label?: TranslatedText;
  density?: FactDensity;
  /** The reading measure in characters for the `pair` form. Never a percentage of the region. */
  measure?: number;
  /** The floor, not the switch — default 240, and unreachable by an unmeasured (0-width) box. */
  leadBelow?: number;
  longAt?: number;
  form?: FactForm | 'auto';
  /** Fires when the group's answer changes, with the reason for it. */
  onFormChange?: (info: FactRowsForm) => void;
}

/** The ground a fact row is rendered on: `inherit` takes the ground's ink (a tinted banner),
 *  label and value both `currentColor`, separated by weight instead of by colour. */
export type FactInkKind = 'inherit' | 'default';

export interface FactInkProps {
  ink?: FactInkKind;
  children?: ReactNode;
}
