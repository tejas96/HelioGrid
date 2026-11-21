import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { renderProvenance } from '../Provenance';
import type { SliderProps } from './Slider.types';
import {
  clampToRange,
  fillPercent,
  formatValue,
  markPercent,
  nudged,
  stepperOff,
} from './slider-math';

interface WebSliderProps extends SliderProps {
  className?: string;
  style?: CSSProperties;
}

interface StepButtonProps {
  disabled: boolean;
  glyph: ShellGlyphName;
  label: TranslatedText;
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
      <ShellGlyph name={glyph} size="sm" tone="current" />
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
  labelSpokenOnly = false,
  unit,
  hint,
  words,
  mark,
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
  const marked = markPercent(mark, min, max);
  const shown = formatValue(value, unit, format);

  const live = (next: number) => onInput?.(clampToRange(next, min, max, step));
  const commit = (next: number) => onCommit?.(clampToRange(next, min, max, step));
  const nudge = (direction: number) => {
    const next = nudged(value, direction, min, max, step);
    live(next);
    commit(next);
  };
  /* A props object or a bare tier — `Provenance`'s own resolver decides, at the
     12px type floor. `"unmarked"` comes back null and the slot collapses. */
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  return (
    <div className={classNames('hg-slider', className)} style={style}>
      {labelSpokenOnly ? (
        <label className="hg-spoken-only" htmlFor={sid}>
          {label}
        </label>
      ) : label !== undefined || unit !== undefined || hint !== undefined ? (
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
            disabled={stepperOff(-1, value, min, max, disabled)}
            glyph="minus"
            label={words.decrease(label)}
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
          {marked === null ? null : (
            <span className="hg-slider-mark" aria-hidden="true" style={{ left: `${marked}%` }} />
          )}
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
            disabled={stepperOff(1, value, min, max, disabled)}
            glyph="plus"
            label={words.increase(label)}
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
