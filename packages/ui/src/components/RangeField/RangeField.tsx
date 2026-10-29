import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { RangeEndBox } from './RangeEndBox';
import {
  formatEnd,
  pinnedPair,
  rangeIsAny,
  rangeReadout,
  reportRange,
  resolveRange,
  roundToStep,
  thumbName,
} from './RangeField.logic';
import type { RangeFieldProps, RangeValue } from './RangeField.types';

interface WebRangeFieldProps extends RangeFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Two ways in, one value out: the track is the coarse gesture and the two boxes are the exact
 * one. `onInput` fires live during a drag, `onCommit` once when it ends, and the typed boxes
 * commit on blur or Enter only.
 *
 * The ends cannot cross — dragging the low thumb past the high one PINS it rather than swapping
 * the handles under the user's finger.
 */
export function RangeField({
  value = null,
  onInput,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  hint,
  error,
  format,
  boxes = true,
  boxLabels,
  disabled = false,
  anyLabel,
  className,
  style,
}: WebRangeFieldProps) {
  const [lo, hi] = resolveRange(value, min, max);
  const span = max - min || 1;
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;
  const isAny = rangeIsAny([lo, hi], min, max);
  const shown = rangeReadout({ lo, hi, min, max, anyLabel, unit, format });

  const set = (next: RangeValue, live: boolean) => reportRange(next, live, { onInput, onCommit });
  const dragLo = (v: number, live: boolean) =>
    set(pinnedPair('lo', roundToStep(v, step), [lo, hi]), live);
  const dragHi = (v: number, live: boolean) =>
    set(pinnedPair('hi', roundToStep(v, step), [lo, hi]), live);

  return (
    <div className={classNames('hg-range', className)} style={style}>
      {label !== undefined || !boxes ? (
        <div className="hg-range-head">
          {label !== undefined ? <span className="hg-range-label">{label}</span> : null}
          <span className="hg-range-readout" data-any={isAny}>
            {shown}
          </span>
        </div>
      ) : null}
      <div className="hg-range-track">
        <span className="hg-range-rail" aria-hidden="true" />
        <span
          className="hg-range-fill"
          aria-hidden="true"
          data-disabled={disabled}
          style={{ left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%` }}
        />
        <input
          className="hg-range-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          disabled={disabled}
          aria-label={thumbName(label, boxLabels[0])}
          aria-valuetext={formatEnd(lo, format, unit)}
          onChange={(e) => dragLo(Number(e.target.value), true)}
          onPointerUp={(e) => dragLo(Number(e.currentTarget.value), false)}
          onKeyUp={(e) => dragLo(Number(e.currentTarget.value), false)}
          onBlur={(e) => dragLo(Number(e.currentTarget.value), false)}
        />
        <input
          className="hg-range-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          disabled={disabled}
          aria-label={thumbName(label, boxLabels[1])}
          aria-valuetext={formatEnd(hi, format, unit)}
          onChange={(e) => dragHi(Number(e.target.value), true)}
          onPointerUp={(e) => dragHi(Number(e.currentTarget.value), false)}
          onKeyUp={(e) => dragHi(Number(e.currentTarget.value), false)}
          onBlur={(e) => dragHi(Number(e.currentTarget.value), false)}
        />
      </div>
      {boxes ? (
        <div className="hg-range-boxes">
          <RangeEndBox
            label={boxLabels[0]}
            value={lo}
            min={min}
            max={hi}
            step={step}
            unit={unit}
            disabled={disabled}
            onCommit={(v) => set([v, hi], false)}
          />
          <span className="hg-range-dash" aria-hidden="true">
            {'–'}
          </span>
          <RangeEndBox
            label={boxLabels[1]}
            value={hi}
            min={lo}
            max={max}
            step={step}
            unit={unit}
            disabled={disabled}
            onCommit={(v) => set([lo, v], false)}
          />
        </div>
      ) : null}
      {error !== undefined ? (
        <p className="hg-range-error" role="alert">
          {error}
        </p>
      ) : hint !== undefined ? (
        <p className="hg-range-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/** True when a pair still covers its whole span, so a filter count never counts it. */
RangeField.isAny = rangeIsAny;
