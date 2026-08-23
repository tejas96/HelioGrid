import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderProvenance } from '../Provenance';
import type { SliderProps } from './Slider.types';
import { clampToRange, fillPercent, formatValue } from './slider-math';

interface WebSliderProps extends SliderProps {
  className?: string;
  style?: CSSProperties;
}

interface StepButtonProps {
  disabled: boolean;
  glyph: string;
  label: string;
  onPress: () => void;
}

/** A 44px minus/plus either side of the track. */
function StepButton({ disabled, glyph, label, onPress }: StepButtonProps) {
  return (
    <button
      className="hg-slider-step"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={glyph} />
      </svg>
    </button>
  );
}

/**
 * Slider with stepper buttons. The step-wide law (MS3-27): a drag reports live via `onInput` and
 * commits exactly once via `onCommit`, so one drag is one undo entry. A component with a single
 * callback forces every studio screen to invent its own debounce, and they diverge.
 */
export function Slider({
  value = 0,
  onInput,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  hint,
  format,
  steppers = true,
  disabled = false,
  provenance,
  density = 'expressive',
  id,
  className,
  style,
}: WebSliderProps) {
  const autoId = useId();
  const sid = id ?? autoId;
  const percent = fillPercent(value, min, max);
  const shown = formatValue(value, unit, format);
  const named = label ?? 'value';

  const live = (next: number) => onInput?.(clampToRange(next, min, max, step));
  const commit = (next: number) => onCommit?.(clampToRange(next, min, max, step));
  const nudge = (direction: number) => {
    const next = clampToRange(value + direction * step, min, max, step);
    live(next);
    commit(next);
  };
  /* A props object, a tier spec or a ready node — `Provenance`'s own resolver decides, at the
     12px type floor. `"unmarked"` comes back null and the slot collapses. */
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  return (
    <div className={classNames('hg-slider', className)} style={style}>
      {label !== undefined || unit !== undefined || hint !== undefined ? (
        <div className="hg-slider-head" data-density={density}>
          <label className="hg-slider-label" htmlFor={sid}>
            {label}
          </label>
          <span className="hg-slider-value" data-disabled={disabled}>
            {shown}
          </span>
        </div>
      ) : null}
      <div className="hg-slider-row">
        {steppers ? (
          <StepButton
            disabled={disabled || value <= min}
            glyph="M5 12h14"
            label={`Decrease ${named}`}
            onPress={() => nudge(-1)}
          />
        ) : null}
        <div className="hg-slider-track">
          {/* The unfilled rail carries --track-edge: an OUTSET hairline in field mode, `none`
              otherwise. Not the inset --control-edge — on 6px that reads as a filled track. */}
          <span className="hg-slider-rail" aria-hidden="true" />
          <span
            className="hg-slider-fill"
            aria-hidden="true"
            data-disabled={disabled}
            style={{ width: `${percent}%` }}
          />
          <input
            className="hg-slider-range"
            id={sid}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            aria-valuetext={shown}
            onChange={(event) => live(Number(event.target.value))}
            onPointerUp={(event) => commit(Number(event.currentTarget.value))}
            onKeyUp={(event) => commit(Number(event.currentTarget.value))}
            onBlur={(event) => commit(Number(event.currentTarget.value))}
          />
        </div>
        {steppers ? (
          <StepButton
            disabled={disabled || value >= max}
            glyph="M12 5v14M5 12h14"
            label={`Increase ${named}`}
            onPress={() => nudge(1)}
          />
        ) : null}
      </div>
      {provenanceNode === null ? null : (
        <div className="hg-slider-provenance">{provenanceNode}</div>
      )}
      {hint !== undefined ? <p className="hg-slider-hint">{hint}</p> : null}
    </div>
  );
}
