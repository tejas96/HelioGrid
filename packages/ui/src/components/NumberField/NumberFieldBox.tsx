import type { KeyboardEvent } from 'react';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import type { NumberDraftState } from './NumberField.state';

const MINUS = 'M5 12h14';
const PLUS = 'M12 5v14M5 12h14';

function StepIcon({ d }: { d: string }) {
  return (
    <Icon size="sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d={d} strokeLinecap="round" />
      </svg>
    </Icon>
  );
}

/** Enter commits, Escape cancels, and the arrows nudge only where a nudge is the grammar. */
function onNumberKey(
  e: KeyboardEvent<HTMLInputElement>,
  draft: NumberDraftState,
  steppers: boolean,
) {
  if (e.key === 'Enter') {
    e.preventDefault();
    draft.commit();
    return;
  }
  if (e.key === 'Escape') {
    draft.cancel();
    e.currentTarget.blur();
    return;
  }
  if (!steppers) return;
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    draft.nudge(e.key === 'ArrowUp' ? 1 : -1);
  }
}

export interface NumberFieldBoxProps {
  id: string;
  draft: NumberDraftState;
  steppers: boolean;
  density: 'expressive' | 'functional';
  disabled: boolean;
  /** Refusal or error — the inset danger ring, which the focus ring is drawn ON TOP of. */
  danger: boolean;
  label?: string;
  unit?: string;
  currency: boolean;
  describedBy?: string;
}

/** The control itself: the two nudge targets, the figure, and the unit suffix. */
export function NumberFieldBox({
  id,
  draft,
  steppers,
  density,
  disabled,
  danger,
  label,
  unit,
  currency,
  describedBy,
}: NumberFieldBoxProps) {
  const name = label ?? 'value';
  return (
    <div
      className="hg-number-field-box"
      data-density={density}
      data-steppers={steppers}
      data-disabled={disabled}
      data-focus={draft.focus}
      data-danger={danger}
    >
      {steppers ? (
        <Pressable
          className="hg-number-field-step"
          disabled={disabled}
          accessibilityLabel={`Decrease ${name}`}
          onPress={() => draft.nudge(-1)}
        >
          <StepIcon d={MINUS} />
        </Pressable>
      ) : null}
      <input
        id={id}
        className="hg-number-field-input"
        data-steppers={steppers}
        inputMode="decimal"
        value={draft.draft}
        disabled={disabled}
        aria-invalid={danger ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => draft.setDraft(e.target.value)}
        onFocus={draft.onFocus}
        onBlur={draft.onBlur}
        onKeyDown={(e) => onNumberKey(e, draft, steppers)}
      />
      {/* `unit` is the suffix for "m" and "kWp"; under `currency` the market pack owns the
          adornment and this port has no pack, so nothing is printed rather than a guess. */}
      {unit !== undefined && !currency ? (
        <span className="hg-number-field-unit">{unit}</span>
      ) : null}
      {steppers ? (
        <Pressable
          className="hg-number-field-step"
          disabled={disabled}
          accessibilityLabel={`Increase ${name}`}
          onPress={() => draft.nudge(1)}
        >
          <StepIcon d={PLUS} />
        </Pressable>
      ) : null}
    </div>
  );
}
