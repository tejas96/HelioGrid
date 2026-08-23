import type { ReactNode } from 'react';
import type { FieldOverrideSpec } from '../FieldOverride/FieldOverride.types';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance/Provenance.types';
import type { ValueSourceLevel, ValueSourceSpec } from '../ValueSource/ValueSource.types';

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
  /** Default 0. */
  value?: number;
  /** Fires once, on blur or Enter. Never per keystroke. */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  /** The nudge size. Meaningless with `steppers={false}`, which is money's default. Default 1. */
  step?: number;
  /** Decimal places applied on commit. */
  precision?: number;
  label?: string;
  unit?: string;
  hint?: string;
  disabled?: boolean;
  density?: 'expressive' | 'functional';
  /** Overrides the generated "Rounded up to the 0.3 m minimum." correction line. */
  correctionMessage?: string;
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
   * times. With them off the amount right-aligns, like every other figure in the product.
   */
  steppers?: boolean;
  /**
   * The provenance of a pre-filled value (MS1-01) — "from survey, 12 Mar", or the estimated tier on
   * SCR-M01-16's engine-extracted specifications. Renders directly under the field, above the hint.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
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
