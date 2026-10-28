import { type KeyboardEvent, useRef } from 'react';
import { fieldBox } from '../../primitives/FieldBox';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import { useFocusRequest } from '../../primitives/use-focus-request';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { NumberDraftState } from './NumberField.state';

function StepIcon({ glyph }: { glyph: ShellGlyphName }) {
  return (
    <Icon size="sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <ShellGlyphMarks name={glyph} />
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
  /** The input's own name — set only when no `label` names it (`NumberFieldProps.ariaLabel`). */
  ariaLabel?: string;
  unit?: string;
  currency: boolean;
  describedBy?: string;
  /** `NumberFieldProps.focusRequest`. */
  focusRequest?: number;
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
  ariaLabel,
  unit,
  currency,
  describedBy,
  focusRequest,
}: NumberFieldBoxProps) {
  const control = useRef<HTMLInputElement>(null);
  useFocusRequest(control, focusRequest);
  const name = label ?? ariaLabel ?? 'value';
  return (
    <div
      className="hg-number-field-box"
      data-density={density}
      data-steppers={steppers}
      {...fieldBox({
        focused: draft.focus,
        tone: danger ? 'error' : 'none',
        disabled,
        density,
      })}
    >
      {steppers ? (
        <Pressable
          className="hg-number-field-step"
          disabled={disabled}
          accessibilityLabel={`Decrease ${name}`}
          onPress={() => draft.nudge(-1)}
        >
          <StepIcon glyph="minus" />
        </Pressable>
      ) : null}
      <input
        ref={control}
        id={id}
        className="hg-number-field-input"
        data-steppers={steppers}
        data-currency={currency}
        inputMode="decimal"
        value={draft.draft}
        disabled={disabled}
        aria-label={ariaLabel}
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
          <StepIcon glyph="plus" />
        </Pressable>
      ) : null}
    </div>
  );
}
