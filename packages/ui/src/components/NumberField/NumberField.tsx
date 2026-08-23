import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderOverride } from '../FieldOverride';
import { renderProvenance } from '../Provenance';
import { renderAttribution } from '../ValueSource';
import { useNumberFieldDraft } from './NumberField.state';
import type { NumberFieldProps } from './NumberField.types';
import { NumberFieldBox } from './NumberFieldBox';
import { NumberFieldMessage } from './NumberFieldMessage';

interface WebNumberFieldProps extends NumberFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Typed dimensions in the display unit that COMMIT ONCE on blur or Enter, never per keystroke.
 * Empty or invalid never commits — the last good value returns. Escape cancels the edit.
 *
 * Money is not a dimension: `outOfRange="refuse"` writes nothing and states the constraint, and
 * `currency` drops the steppers. Precedence in the message slot: refusal → error → correction → hint.
 */
export function NumberField({
  value = 0,
  onCommit,
  min,
  max,
  step = 1,
  precision,
  label,
  unit,
  hint,
  disabled = false,
  density = 'expressive',
  currency = false,
  provenance,
  override,
  attribution,
  outOfRange = 'clamp',
  refusalMessage,
  refusalPath,
  steppers,
  correctionMessage,
  error,
  className,
  style,
}: WebNumberFieldProps) {
  const autoId = useId();
  /* A payment is not stepped. An unset `steppers` follows `currency` — the only case where the
     grammar is knowable from the props the caller already passed. */
  const showSteppers = steppers ?? !currency;
  const draft = useNumberFieldDraft({
    value,
    onCommit,
    min,
    max,
    step,
    precision,
    currency,
    unit,
    outOfRange,
    correctionMessage,
  });

  const refused =
    draft.refusal === null
      ? null
      : (refusalMessage ?? (
          <>
            {draft.refusal}
            {refusalPath}
          </>
        ));
  const danger = draft.refusal !== null || error !== undefined;
  const errId = `${autoId}-err`;
  const describedBy = error !== undefined && draft.refusal === null ? errId : undefined;

  return (
    <div className={classNames('hg-number-field', className)} style={style}>
      {label !== undefined ? (
        <label htmlFor={autoId} className="hg-number-field-label">
          {label}
        </label>
      ) : null}
      <NumberFieldBox
        id={autoId}
        draft={draft}
        steppers={showSteppers}
        density={density}
        disabled={disabled}
        danger={danger}
        label={label}
        unit={unit}
        currency={currency}
        describedBy={describedBy}
      />
      <NumberFieldSlots
        override={override}
        attribution={attribution}
        provenance={provenance}
        label={label}
      />
      <NumberFieldMessage
        errId={errId}
        refused={refused}
        error={error}
        correction={draft.correction}
        hint={hint}
      />
    </div>
  );
}

/**
 * The two lines between the box and its message, each owned by the component that draws it
 * everywhere else: `FieldOverride` for "a person replaced the derived default" (M05-72), and
 * `ValueSource` for "which layer supplied this" (SCR-M01-15).
 *
 * ONE OF THOSE TWO, NEVER BOTH — an overridden value's own line already says "yours, not the
 * layer's", and two markers under one number make the reader work out which is speaking. Resolving
 * the override first is the enforcement: whatever it returns occupies the slot.
 *
 * Provenance is a DIFFERENT AXIS and keeps its own slot below, directly under the value it
 * qualifies and above the hint — the same adjacency rule StatCard applies, so an edited number and
 * a displayed one read identically.
 */
function NumberFieldSlots({
  override,
  attribution,
  provenance,
  label,
}: Pick<NumberFieldProps, 'override' | 'attribution' | 'provenance' | 'label'>) {
  const overrideNode = renderOverride(override);
  const attributionNode =
    overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null;
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  return (
    <>
      {overrideNode === null ? null : <div className="hg-number-field-slot">{overrideNode}</div>}
      {attributionNode === null ? null : (
        <div className="hg-number-field-slot">{attributionNode}</div>
      )}
      {provenanceNode === null ? null : (
        <div className="hg-number-field-provenance">{provenanceNode}</div>
      )}
    </>
  );
}
