import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { fieldBox } from '../../primitives/FieldBox';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useFormat } from '../MarketProvider/market-context';
import { useOverlayLayer } from '../Sheet/use-overlay-dismiss';
import { Calendar } from './Calendar';
import { closesPicker } from './calendar-selection';
import type { DatePickerProps } from './DatePicker.types';
import { triggerText } from './date-text';

interface WebDatePickerProps extends DatePickerProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Borderless field that opens the calendar in an `e4` popover. The displayed date is the active
 * market's — "12 Mar 2026" under the shipped India pack, the pack's own order and language
 * elsewhere. There is no `firstDayOfWeek` prop: the week start is a market fact.
 */
export function DatePicker({
  words,
  value,
  onChange,
  mode = 'single',
  label,
  placeholder = words.selectDate,
  min,
  max,
  markers,
  disabledDates,
  lockedDates,
  onBlocked,
  density = 'expressive',
  disabled = false,
  helper,
  error,
  className,
  style,
}: WebDatePickerProps) {
  const mkt = useFormat();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useOverlayLayer(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (event: MouseEvent) => {
      const node = event.target;
      if (wrapRef.current !== null && node instanceof Node && !wrapRef.current.contains(node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const text = triggerText(mode, value, mkt, words);

  return (
    <div ref={wrapRef} className={classNames('hg-date-picker', className)} style={style}>
      {label === undefined ? null : <span className="hg-date-picker-label">{label}</span>}
      <button
        type="button"
        className="hg-date-picker-trigger"
        data-density={density}
        data-empty={text === '' ? 'true' : undefined}
        {...fieldBox({
          focused: open,
          tone: error === undefined ? 'none' : 'error',
          disabled,
          density,
        })}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hg-date-picker-value">{text === '' ? placeholder : text}</span>
        <span className="hg-date-picker-glyph">
          <ShellGlyph name="calendar" size="sm" tone="current" />
        </span>
      </button>
      {helper === undefined && error === undefined ? null : (
        <p className="hg-date-picker-note" data-error={error === undefined ? undefined : 'true'}>
          {error ?? helper}
        </p>
      )}
      {open ? (
        <div
          className="hg-date-picker-popover"
          role="dialog"
          aria-label={label ?? words.chooseDate}
        >
          <Calendar
            words={words}
            value={value}
            onChange={(next) => {
              onChange?.(next);
              if (closesPicker(mode, next)) {
                setOpen(false);
              }
            }}
            mode={mode}
            min={min}
            max={max}
            markers={markers}
            disabledDates={disabledDates}
            lockedDates={lockedDates}
            onBlocked={onBlocked}
            density={density}
          />
        </div>
      ) : null}
    </div>
  );
}
