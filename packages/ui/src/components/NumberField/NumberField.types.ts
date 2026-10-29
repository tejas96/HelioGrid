import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FieldOverrideSpec } from '../FieldOverride/FieldOverride.types';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance/Provenance.types';
import type { ValueSourceLevel, ValueSourceSpec } from '../ValueSource/ValueSource.types';

export type NumberFieldCommits = 'on-leave' | 'as-typed';

/** What a refusal names: the figure typed, whether it is money, and the bounds it broke. */
export interface NumberRefusalFacts {
  readonly figure: string;
  readonly money: boolean;
  readonly min?: string;
  readonly max?: string;
}

/**
 * Every word the field says on its own, in the reader's language (`packages/i18n`'s
 * `numberFieldWords`). Required: the field holds no word of its own. A bound arrives as the field
 * prints it — the figure and its unit, "0.3 m".
 */
export interface NumberFieldWords {
  /** The − button's name — *Decrease {name}*, or *Decrease value* when the field has no name. */
  decrease: (name: string | undefined) => TranslatedText;
  /** The + button's name — *Increase {name}*, or *Increase value*. */
  increase: (name: string | undefined) => TranslatedText;
  /** A clamp up to the floor — *Rounded up to the 0.3 m minimum.* */
  roundedUp: (bound: string) => TranslatedText;
  /** A clamp down to the ceiling — *Capped at the 50 m maximum.* */
  capped: (bound: string) => TranslatedText;
  /** The constraint a refusal states — *12 can't be recorded — the amount has to be 1 or more.* */
  refused: (facts: NumberRefusalFacts) => TranslatedText;
}

/**
 * Number entry. Commits once on blur or Enter; empty or invalid never commits (the last good value
 * is restored). Escape cancels the edit.
 *
 * **Out-of-range has two behaviours and the caller picks one.** `outOfRange="clamp"` (default) is the
 * dimension answer — the nearest legal value is committed and the field says so rather than snapping
 * silently. `outOfRange="refuse"` is the money answer (`SCR-M11-03`): nothing is committed, the
 * constraint is stated in place, and `refusalPath` names the reversal. Same rule `TimeField` applies
 * to a calling window.
 *
 * **Money mode is `currency` plus `outOfRange="refuse"`**, and it also drops the steppers.
 */
export interface NumberFieldProps {
  /** Every word the field says on its own — see `NumberFieldWords`. */
  words: NumberFieldWords;
  /**
   * Each new number moves focus into the field — the caller's way to land a person on the first
   * field a refused form names. Leave it unset and the field never takes focus on its own.
   */
  focusRequest?: number;
  /**
   * The figure, or none: with no `value` the field is UNSET — an empty box beside its unit, never
   * `0`. A figure nobody declared has no tier that could qualify it (`F8-01`), which is why this
   * port does not take the design system's `0` default. An empty draft committed on an unset field
   * leaves it unset; `onCommit` only ever receives a figure.
   */
  value?: number;
  /** Fires once, on blur or Enter. Never per keystroke, unless `commits` is `as-typed`. */
  onCommit?: (value: number) => void;
  /**
   * The person emptied a field that held a figure — a price taken away (`M01-37`). Without it an
   * empty draft restores the last figure, as before.
   */
  onClear?: () => void;
  /**
   * When a figure reaches `onCommit`. `on-leave` (default): once the field is left. `as-typed`:
   * also each figure the draft would commit, while it is typed; the draft stays as typed. For a
   * screen whose way on cannot wait for the field to be left: on touch a tap on a button does not
   * leave a field, and a number pad has no Done key. As typed, Escape has nothing to take back —
   * the figure was already reported — and a field with a bound reports the bound until the draft
   * is inside it.
   */
  commits?: NumberFieldCommits;
  min?: number;
  max?: number;
  /** The nudge size. Meaningless with `steppers={false}`, which is money's default. Default 1. */
  step?: number;
  /** Decimal places applied on commit. */
  precision?: number;
  label?: TranslatedText;
  /**
   * The label is spoken and not shown — a row of fields whose column already names them
   * (`SCR-M01-15`'s version rows). The field keeps its accessible name.
   */
  labelSpokenOnly?: boolean;
  /**
   * The input's accessible name **when no visible `label` is drawn** — a repeated line that labels
   * its column once (`SCR-M01-20`: *"Share of Second instalment"*). The stepper buttons take the
   * same name. Ignored when `label` is set.
   */
  ariaLabel?: TranslatedText;
  unit?: string;
  hint?: TranslatedText;
  disabled?: boolean;
  density?: 'expressive' | 'functional';
  /** Overrides the generated "Rounded up to the 0.3 m minimum." correction line. */
  correctionMessage?: TranslatedText;
  /**
   * **The caller's validation failure — this field is why the gate refused.** Danger ring, danger
   * words under the field, `aria-invalid`, and it survives focus: the component never sets or clears
   * it, because a gate's verdict is only revised by re-running the gate.
   *
   * **Not a correction and not a refusal.** `correctionMessage` is what the field *did* with your
   * input ("Rounded up to the 0.3 m minimum"); `outOfRange="refuse"` is what it *refused* to do with
   * it. Both are announced (`role="status"` / `role="alert"`). An `error` is about a value that may be
   * **perfectly typeable and still be the reason Generate would not run**, so it is *described*
   * rather than announced. Precedence in the message slot: refusal → error → correction → hint.
   */
  error?: ReactNode;
  /**
   * Display the amount in the active market's currency and grouping (F1 / F3-20). The field is
   * EDITED as a plain number and the committed value is always a number — formatting never leaks
   * into it. `unit` stays the suffix for "m" and "kWp" and is ignored here.
   *
   * It also **defaults `steppers` to false**: a payment is not arrived at by pressing +.
   *
   * The pack's symbol adornment and grouping are NOT rendered in this port — see the folder's
   * port notes; `@heliogrid/ui` has no market pack to read them from.
   */
  currency?: boolean;
  /**
   * **What happens to a value outside `min`/`max`.**
   *
   * `clamp` (default) — the dimension behaviour: the nearest legal value is committed and the field
   * says so rather than snapping silently.
   *
   * `refuse` — **nothing is committed.** The last good value is restored, the constraint is stated in
   * place in danger words, and `refusalPath` names the honest route (`SCR-M11-03`). An amount is a
   * **record of something that happened**, so a clamp writes a figure the person did not type.
   */
  outOfRange?: OutOfRangeMode;
  /** Replaces the whole generated refusal sentence, constraint included. */
  refusalMessage?: ReactNode;
  /**
   * **The honest path, named after the constraint** — the caller's words, because only they know the
   * domain route: *"A wrong amount is recorded and then reversed, never edited."* The component owns
   * the constraint clause and stops there.
   */
  refusalPath?: ReactNode;
  /**
   * The +/− buttons and the ArrowUp/ArrowDown nudge. Defaults to `!currency`: **`step` and stepper
   * buttons are a dimension's grammar**, and nobody arrives at a received payment by pressing + eleven
   * times. With them the figure sits centred between them; without, it starts at the left in
   * `Input`'s sans face, an amount in the mono face (`F7-09`), and the unit closes the field.
   */
  steppers?: boolean;
  /**
   * The provenance of a pre-filled value (MS1-01) — "from survey, 12 Mar", or the estimated tier on
   * SCR-M01-16's engine-extracted specifications. Renders directly under the field, above the hint.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /**
   * A person replaced a derived default (`M05-72`, `MS10-13`, `M05-65`). One treatment, rendered by
   * `FieldOverride`: the marker, the superseded value and the reset, in that order, **directly under
   * the field and above its provenance line**, which is a different axis and keeps its own slot.
   */
  override?: FieldOverrideSpec | ReactNode;
  /**
   * **Which layer supplied this value** (`SCR-M01-15`) — rendered by `ValueSource` in the same place
   * the override line uses. **Mutually exclusive with `override`, and the field enforces it:** an
   * overridden value's own line already says "yours, not the layer's", and two markers under one
   * number make the reader work out which is speaking.
   */
  attribution?: ValueSourceSpec | ValueSourceLevel | ReactNode;
}

export type OutOfRangeMode = 'clamp' | 'refuse';
