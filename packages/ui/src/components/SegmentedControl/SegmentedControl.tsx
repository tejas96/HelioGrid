import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderActionReason } from '../ActionReason';
import { renderMarks } from '../ChipGroup';
import { hasReason, normalise } from './SegmentedControl.options';
import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebSegmentedControlProps extends SegmentedControlProps {
  className?: string;
  style?: CSSProperties;
}

/** Arrow keys skip the natively-disabled segments — those are not focusable to land on. */
function reachableIndex(items: SegmentedOption[], from: number, to: number): number {
  const count = items.length;
  const step = to > from ? 1 : -1;
  let index = ((to % count) + count) % count;
  for (let guard = 0; guard < count; guard += 1) {
    const candidate = items[index];
    if (candidate === undefined || candidate.disabled !== true || hasReason(candidate)) {
      break;
    }
    index = (((index + step) % count) + count) % count;
  }
  return index;
}

/**
 * Pill segmented control on a sunken track; the active white pill springs between segments.
 *
 * THE SEGMENT IS A 44px TARGET AROUND THE 32px PILL — the button is 44 tall and the extra 12px
 * is taken back as negative margin, so the control still renders 40px tall and the sliding
 * indicator is untouched.
 *
 * A NAMED OR ERRORED CONTROL IS A FIELD, so it is a real `radiogroup` of `radio`s: one tab
 * stop, arrow keys move the selection, `aria-checked` on each. `aria-invalid` is not supported
 * on `role="group"`, so the errored state used to announce nothing. Without `label` or `error`
 * it is a view switcher, and a row of buttons is what a view switcher is.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  error,
  className,
  style,
}: WebSegmentedControlProps) {
  const items = normalise(options);
  const index = Math.max(
    0,
    items.findIndex((option) => option.value === value),
  );
  const autoId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reasoned = items.filter((option) => option.disabled === true && hasReason(option));
  const isField = label !== undefined || error !== undefined;
  const wrapped = isField || reasoned.length > 0;

  const onKeyDown = (from: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !back) {
      return;
    }
    event.preventDefault();
    const target = reachableIndex(items, from, forward ? from + 1 : from - 1);
    refs.current[target]?.focus();
    const option = items[target];
    if (option !== undefined && option.disabled !== true) {
      onChange?.(option.value);
    }
  };

  const pillStyle: StyleVars = {
    '--hg-segmented-control-index': index,
    '--hg-segmented-control-count': items.length,
    ...(wrapped ? undefined : style),
  };

  const pill = (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: runtime radiogroup owns them
    <div
      role={isField ? 'radiogroup' : wrapped ? 'group' : undefined}
      aria-labelledby={label === undefined ? undefined : `${autoId}-lbl`}
      aria-invalid={error === undefined ? undefined : true}
      aria-describedby={error === undefined ? undefined : `${autoId}-err`}
      className={classNames('hg-segmented-control-pill', wrapped ? undefined : className)}
      data-error={error === undefined ? undefined : 'true'}
      style={pillStyle}
    >
      <span className="hg-segmented-control-indicator" />
      {items.map((option, position) => (
        <Segment
          key={option.value}
          option={option}
          active={option.value === value}
          isField={isField}
          roving={position === index}
          reasonId={
            option.disabled === true && hasReason(option)
              ? `${autoId}-r-${option.value}`
              : undefined
          }
          buttonRef={(element) => {
            refs.current[position] = element;
          }}
          onKeyDown={isField ? onKeyDown(position) : undefined}
          onSelect={() => onChange?.(option.value)}
        />
      ))}
    </div>
  );

  if (!wrapped) {
    return pill;
  }
  return (
    <div className={classNames('hg-segmented-control', className)} style={style}>
      {label === undefined ? null : (
        <span id={`${autoId}-lbl`} className="hg-segmented-control-label">
          {label}
        </span>
      )}
      {pill}
      {reasoned.map((option) => (
        <span key={option.value}>
          {renderActionReason(option.disabledReason, { id: `${autoId}-r-${option.value}` })}
        </span>
      ))}
      {error === undefined ? null : (
        <span id={`${autoId}-err`} className="hg-segmented-control-error">
          {error}
        </span>
      )}
    </div>
  );
}

interface SegmentProps {
  option: SegmentedOption;
  active: boolean;
  isField: boolean;
  roving: boolean;
  reasonId: string | undefined;
  buttonRef: (element: HTMLButtonElement | null) => void;
  onKeyDown: ((event: KeyboardEvent<HTMLButtonElement>) => void) | undefined;
  onSelect: () => void;
}

function Segment({
  option,
  active,
  isField,
  roving,
  reasonId,
  buttonRef,
  onKeyDown,
  onSelect,
}: SegmentProps) {
  const off = option.disabled === true;
  const count = option.count;
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: runtime radio owns aria-checked
    <button
      type="button"
      ref={buttonRef}
      role={isField ? 'radio' : undefined}
      aria-checked={isField ? active : undefined}
      tabIndex={isField ? (roving ? 0 : -1) : undefined}
      onKeyDown={onKeyDown}
      disabled={off && !hasReason(option)}
      aria-disabled={off ? true : undefined}
      aria-describedby={reasonId}
      className="hg-segmented-control-segment"
      data-active={active ? 'true' : undefined}
      onClick={() => {
        if (!off) {
          onSelect();
        }
      }}
    >
      {off ? <OffGlyph /> : null}
      {option.label}
      {count === undefined ? null : (
        <span className="hg-segmented-control-count">{count > 99 ? '99+' : count}</span>
      )}
      {renderMarks(option.marks)}
    </button>
  );
}

/**
 * Off-ness is a GLYPH, not a colour step. Every non-active segment already lacks the white pill,
 * and no colour clears 4.5:1 on `--canvas-sunken` while still reading as "off" — so the
 * circle-minus is the second channel, and the label keeps `--text-secondary`.
 */
function OffGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className="hg-segmented-control-off-glyph"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </svg>
  );
}
