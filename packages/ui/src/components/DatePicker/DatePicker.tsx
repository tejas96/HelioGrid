import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { Calendar } from './Calendar';
import { asRange, asSet, parse } from './calendar-grid';
import type { CalendarValue, DatePickerProps, MarketFormat } from './DatePicker.types';

interface WebDatePickerProps extends DatePickerProps {
  className?: string;
  style?: CSSProperties;
}

/** What the trigger shows: the active market's date, never a hand-spelled order. */
function triggerText(
  mode: DatePickerProps['mode'],
  value: CalendarValue | undefined,
  mkt: MarketFormat,
): string {
  if (mode === 'range') {
    const range = asRange(value);
    if (range.from === null) {
      return '';
    }
    return `${mkt.date(range.from)} – ${range.to === null ? '…' : mkt.date(range.to)}`;
  }
  if (mode === 'set') {
    const set = asSet(value);
    return set.length === 0 ? '' : `${set.length} date${set.length === 1 ? '' : 's'}`;
  }
  const single = parse(typeof value === 'string' ? value : null);
  return single === null ? '' : mkt.date(single);
}

/**
 * Borderless field that opens the calendar in an `e4` popover. The displayed date is the active
 * market's — "12 Mar 2026" under the shipped India pack, the pack's own order and language
 * elsewhere. There is no `firstDayOfWeek` prop: the week start is a market fact.
 */
export function DatePicker({
  value,
  onChange,
  mode = 'single',
  label,
  placeholder = 'Select a date',
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

  const text = triggerText(mode, value, mkt);

  return (
    <div ref={wrapRef} className={classNames('hg-date-picker', className)} style={style}>
      {label === undefined ? null : <span className="hg-date-picker-label">{label}</span>}
      <button
        type="button"
        className="hg-date-picker-trigger"
        data-density={density}
        data-error={error === undefined ? undefined : 'true'}
        data-open={open ? 'true' : undefined}
        data-empty={text === '' ? 'true' : undefined}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hg-date-picker-value">{text === '' ? placeholder : text}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="hg-date-picker-glyph"
        >
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
      {helper === undefined && error === undefined ? null : (
        <p className="hg-date-picker-note" data-error={error === undefined ? undefined : 'true'}>
          {error ?? helper}
        </p>
      )}
      {open ? (
        <div className="hg-date-picker-popover" role="dialog" aria-label={label ?? 'Choose a date'}>
          <Calendar
            value={value}
            onChange={(next) => {
              onChange?.(next);
              const closes =
                mode === 'single' ||
                (mode === 'range' && !Array.isArray(next) && typeof next === 'object' && next.to);
              if (closes) {
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
