import { useId } from 'react';
import { fieldBox } from '../../primitives/FieldBox';
import type { RangeEndBoxProps } from './RangeField.types';
import { useEndDraft } from './use-end-draft';

/** Compact commit-once numeric box. 44px target; the value it holds is one end of the range. */
export function RangeEndBox({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled = false,
  onCommit,
}: RangeEndBoxProps) {
  const id = useId();
  const { draft, setDraft, focus, setFocus, commit } = useEndDraft({
    value,
    min,
    max,
    step,
    onCommit,
  });

  return (
    <span className="hg-range-end">
      <label className="hg-range-end-label" htmlFor={id}>
        {label}
      </label>
      <span
        className="hg-range-end-box"
        {...fieldBox({ focused: focus, disabled, density: 'functional' })}
      >
        <input
          id={id}
          className="hg-range-end-input"
          inputMode="decimal"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setDraft(String(value));
              e.currentTarget.blur();
            }
          }}
        />
        {unit !== undefined ? <span className="hg-range-end-unit">{unit}</span> : null}
      </span>
    </span>
  );
}
