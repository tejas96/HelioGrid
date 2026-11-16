import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { rovingTargetOf } from '../../primitives/press-keys';
import { clampCount } from '../../utils/count';
import { renderActionReason } from '../ActionReason';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { renderMarks } from '../ChipGroup';
import {
  hasReason,
  isChosen,
  isFieldControl,
  reasonedOptions,
  selectedIndex,
} from './SegmentedControl.options';
import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebSegmentedControlProps extends SegmentedControlProps {
  className?: string;
  style?: CSSProperties;
}

/** `fill` as the attribute its CSS keys on: present only when the track runs its holder's width. */
function fillMark(fill: boolean): 'true' | undefined {
  return fill ? 'true' : undefined;
}

/** Arrow keys skip the natively-disabled segments — those are not focusable to land on. */
function unreachable(options: SegmentedOption[]) {
  return (index: number) => {
    const candidate = options[index];
    return candidate !== undefined && candidate.disabled === true && !hasReason(candidate);
  };
}

/**
 * Pill segmented control on a sunken track; the active accent wash springs between segments.
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
  ariaLabel,
  error,
  iconOnly = false,
  fill = false,
  className,
  style,
}: WebSegmentedControlProps) {
  const index = selectedIndex(options, value);
  const autoId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reasoned = reasonedOptions(options);
  const isField = isFieldControl({ label, ariaLabel, error });
  const wrapped = isField || reasoned.length > 0;

  const onKeyDown = (from: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = rovingTargetOf(event.key, from, options.length, 'both', unreachable(options));
    if (target === null) {
      return;
    }
    event.preventDefault();
    refs.current[target]?.focus();
    const option = options[target];
    if (option !== undefined && option.disabled !== true) {
      onChange?.(option.value);
    }
  };

  const pillStyle: StyleVars = {
    '--hg-segmented-control-index': index,
    '--hg-segmented-control-count': options.length,
    ...(wrapped ? undefined : style),
  };

  const pill = (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: runtime radiogroup owns them
    <div
      role={isField ? 'radiogroup' : wrapped ? 'group' : undefined}
      aria-labelledby={label === undefined ? undefined : `${autoId}-lbl`}
      aria-label={label === undefined ? ariaLabel : undefined}
      aria-invalid={error === undefined ? undefined : true}
      aria-describedby={error === undefined ? undefined : `${autoId}-err`}
      className={classNames('hg-segmented-control-pill', wrapped ? undefined : className)}
      data-fill={fillMark(fill)}
      data-error={error === undefined ? undefined : 'true'}
      style={pillStyle}
    >
      {isChosen(options, value) ? <span className="hg-segmented-control-indicator" /> : null}
      {options.map((option, position) => (
        <Segment
          key={option.value}
          option={option}
          active={option.value === value}
          isField={isField}
          iconOnly={iconOnly}
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
    <div
      className={classNames('hg-segmented-control', className)}
      data-fill={fillMark(fill)}
      style={style}
    >
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
  iconOnly: boolean;
  roving: boolean;
  reasonId: string | undefined;
  buttonRef: (element: HTMLButtonElement | null) => void;
  onKeyDown: ((event: KeyboardEvent<HTMLButtonElement>) => void) | undefined;
  onSelect: () => void;
}

/** An icon segment: named by its words, and tipped with them (`Tip`). */
const ICON_SEGMENT = (words: string) => ({
  className: 'hg-segmented-control-segment hg-tip',
  'aria-label': words,
  'data-tip': words,
  'data-icon': 'true',
});

function Segment({
  option,
  active,
  isField,
  iconOnly,
  roving,
  reasonId,
  buttonRef,
  onKeyDown,
  onSelect,
}: SegmentProps) {
  const off = option.disabled === true;
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
      data-active={active ? 'true' : undefined}
      {...(iconOnly ? ICON_SEGMENT(option.label) : { className: 'hg-segmented-control-segment' })}
      onClick={() => {
        if (!off) {
          onSelect();
        }
      }}
    >
      {off ? <OffGlyph /> : null}
      <SegmentFace option={option} active={active} iconOnly={iconOnly} />
    </button>
  );
}

/** What a segment shows: its icon, its words unless the icon stands for them, its count, its marks. */
function SegmentFace({
  option,
  active,
  iconOnly,
}: {
  option: SegmentedOption;
  active: boolean;
  iconOnly: boolean;
}) {
  const words =
    option.lang === undefined ? option.label : <span lang={option.lang}>{option.label}</span>;
  return (
    <>
      {option.glyph === undefined ? null : (
        <ShellGlyph name={option.glyph} size="md" tone={active ? 'primary' : 'secondary'} />
      )}
      {iconOnly ? null : words}
      {option.count === undefined ? null : (
        <span className="hg-segmented-control-count">
          {clampCount(option.count, option.countMax)}
        </span>
      )}
      {renderMarks(option.marks)}
    </>
  );
}

/**
 * Off-ness is a GLYPH, not a colour step. Every non-active segment already lacks the accent wash,
 * and no colour clears 4.5:1 on `--canvas-sunken` while still reading as "off" — so the
 * circle-minus is the second channel, and the label keeps `--text-secondary`.
 */
function OffGlyph() {
  return (
    <span className="hg-segmented-control-off-glyph">
      <ShellGlyph name="minus-circle" size="dense" tone="current" />
    </span>
  );
}
