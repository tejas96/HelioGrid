import { useEffect, useId, useState } from 'react';
import { commitEnd } from './RangeField.logic';

export interface RangeEndBoxProps {
  label: string;
  value: number;
  /** This end's own window — the other end is the bound it may not cross. */
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onCommit: (value: number) => void;
}

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
  const [draft, setDraft] = useState(String(value));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setDraft(String(value));
  }, [value, focus]);

  const commit = () => {
    const next = commitEnd(draft, min, max, step);
    if (next === null) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <span className="hg-range-end">
      <label className="hg-range-end-label" htmlFor={id}>
        {label}
      </label>
      <span className="hg-range-end-box" data-disabled={disabled} data-focus={focus}>
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
