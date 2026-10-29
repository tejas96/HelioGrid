import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { fieldBox } from '../../primitives/FieldBox';
import { StatusMark } from '../../primitives/StatusMark';
import { useFocusRequest } from '../../primitives/use-focus-request';
import { renderOverride } from '../FieldOverride';
import { renderAttribution } from '../ValueSource';
import { useCommitDraft } from './commit-draft';
import type { InputNote as Note } from './Input.logic';
import { inputNote, ringTone } from './Input.logic';
import type { InputProps } from './Input.types';

interface WebInputProps extends InputProps {
  className?: string;
  /** Lands on the column wrapper, as the DS does. */
  style?: CSSProperties;
}

/**
 * Borderless input: a well (`FieldBox`) that takes the system focus ring and an inset verdict ring.
 *
 * Opt-in commit-once mode (MS12-26 / MS3-26): with `commitOnBlur`, the field keeps a local draft and
 * calls `onCommit` ONCE on blur or Enter — never per keystroke. Empty never commits; the field
 * restores the last committed value. Escape cancels the edit. Default behaviour is unchanged.
 *
 * This is a TEXT field, so `onCommit` always hands back a string. Numeric entry — clamping, refusal,
 * precision, friendly correction — belongs to `NumberField`.
 */
export function Input({
  label,
  labelSpokenOnly = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  density = 'expressive',
  error,
  success,
  helper,
  disabled = false,
  mono = false,
  leading = null,
  trailing = null,
  commitOnBlur = false,
  onCommit,
  focusRequest,
  override,
  attribution,
  id,
  className,
  style,
}: WebInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const control = useRef<HTMLInputElement>(null);
  useFocusRequest(control, focusRequest);
  const { focus, setFocus, commit, cancel, shown, change, leave } = useCommitDraft(
    value,
    commitOnBlur,
    onCommit,
    onChange,
  );

  const note = inputNote({ error, success, helper });
  const tone = ringTone(note);
  /* FieldOverride owns the marker/superseded-value/reset line and ValueSource owns the layer line.
     Resolving the override first is also the mutual-exclusion test: whatever it returns is what
     occupies the slot, and attribution only speaks when the slot is empty. */
  const overrideNode = renderOverride(override);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      cancel();
      event.currentTarget.blur();
    }
  };

  return (
    <div className={classNames('hg-input', className)} style={style}>
      {label === undefined ? null : (
        <label
          className={classNames('hg-input-label', labelSpokenOnly ? 'hg-spoken-only' : undefined)}
          htmlFor={fieldId}
        >
          {label}
        </label>
      )}
      <div
        className="hg-input-shell"
        data-density={density}
        {...fieldBox({ focused: focus, tone, disabled, density })}
      >
        {leading}
        <input
          ref={control}
          className="hg-input-control"
          data-mono={mono ? 'true' : undefined}
          id={fieldId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={shown}
          onChange={(event) => change(event.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={leave}
          onKeyDown={commitOnBlur ? handleKeyDown : undefined}
        />
        {trailing}
      </div>
      {/* One override treatment, three hosts (M05-72). Directly under the value, above helper/error. */}
      {overrideNode}
      {/* Attribution is the un-overridden case and never renders beside the override line. */}
      {overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null}
      <InputNote note={note} />
    </div>
  );
}

/** The line under the field (`inputNote`). Success is words with the success mark, never a ring. */
function InputNote({ note }: { note: Note | null }) {
  if (note === null) {
    return null;
  }
  if (note.kind === 'error') {
    return <span className="hg-input-error">{note.text}</span>;
  }
  if (note.kind === 'success') {
    return <StatusMark className="hg-input-success" tone="success" label={note.text} />;
  }
  return <span className="hg-input-helper">{note.text}</span>;
}
