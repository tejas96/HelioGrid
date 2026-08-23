import type { CSSProperties, KeyboardEvent } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderOverride } from '../FieldOverride';
import { renderAttribution } from '../ValueSource';
import { useCommitDraft } from './commit-draft';
import type { InputProps } from './Input.types';

interface WebInputProps extends InputProps {
  className?: string;
  /** Lands on the column wrapper, as the DS does. */
  style?: CSSProperties;
}

/**
 * Borderless input. No border at rest — e1 shadow. Focus = 2px accent ring, no border appears.
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
  override,
  attribution,
  id,
  className,
  style,
}: WebInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { draft, setDraft, focus, setFocus, commit, cancel } = useCommitDraft(
    value,
    commitOnBlur,
    onCommit,
  );

  const ring = error !== undefined ? 'error' : success === true ? 'success' : undefined;
  /* FieldOverride owns the marker/superseded-value/reset line and ValueSource owns the layer line.
     Resolving the override first is also the mutual-exclusion test: whatever it returns is what
     occupies the slot, and attribution only speaks when the slot is empty. */
  const overrideNode = renderOverride(override);

  const handleChange = (next: string) => {
    if (commitOnBlur) {
      setDraft(next);
      return;
    }
    onChange?.(next);
  };

  const handleBlur = () => {
    setFocus(false);
    if (commitOnBlur) {
      commit();
    }
  };

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
        <label className="hg-input-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div
        className="hg-input-shell"
        data-density={density}
        data-ring={ring}
        data-focus={focus ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        {leading}
        <input
          className="hg-input-control"
          data-mono={mono ? 'true' : undefined}
          id={fieldId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={commitOnBlur ? draft : (value ?? '')}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={handleBlur}
          onKeyDown={commitOnBlur ? handleKeyDown : undefined}
        />
        {trailing}
      </div>
      {/* One override treatment, three hosts (M05-72). Directly under the value, above helper/error. */}
      {overrideNode}
      {/* Attribution is the un-overridden case and never renders beside the override line. */}
      {overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null}
      <InputNote error={error} helper={helper} />
    </div>
  );
}

/** The line under the field. An error replaces the helper — never both, never a tint alone. */
function InputNote({ error, helper }: { error?: string; helper?: string }) {
  if (error !== undefined) {
    return <span className="hg-input-error">{error}</span>;
  }
  if (helper !== undefined) {
    return <span className="hg-input-helper">{helper}</span>;
  }
  return null;
}
