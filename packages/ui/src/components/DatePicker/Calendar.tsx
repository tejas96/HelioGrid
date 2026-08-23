import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { CalendarCell, CalendarNav, CalendarSkeleton } from './CalendarChrome';
import { iso, monthCells, monthStart, parse } from './calendar-grid';
import { inRange, isDisabledDate, isSelected, nextValue } from './calendar-selection';
import type { CalendarProps } from './DatePicker.types';

interface WebCalendarProps extends CalendarProps {
  className?: string;
  style?: CSSProperties;
}

function initialView(value: CalendarProps['value']): Date {
  if (Array.isArray(value)) {
    return monthStart(parse(value[0]) ?? new Date());
  }
  if (value !== undefined && typeof value === 'object') {
    return monthStart(parse(value.from) ?? new Date());
  }
  return monthStart(parse(typeof value === 'string' ? value : null) ?? new Date());
}

/**
 * Month grid. The market pack supplies the month and day names, the field order and the first
 * column (India starts Sunday). 44px cells at BOTH densities — functional means removing chrome,
 * not squeezing air out of a target.
 */
export function Calendar({
  value,
  onChange,
  mode = 'single',
  month,
  onMonthChange,
  min,
  max,
  markers = {},
  disabledDates = [],
  density = 'expressive',
  lockedDates = [],
  onBlocked,
  state = 'ready',
  emptyMessage,
  footer = null,
  className,
  style,
}: WebCalendarProps) {
  const mkt = useFormat();
  const [innerMonth, setInnerMonth] = useState(() => initialView(value));
  const controlled = parse(month);
  const view = controlled === null ? innerMonth : monthStart(controlled);

  /* A `month` WITH NO `onMonthChange` IS A PINNED VIEW, AND A PINNED VIEW DRAWS NO MONTH ARROWS:
     `view` reads `month` while `setView` writes `innerMonth`, so the two 44px arrows would move
     nothing. Either own the month or don't pass it. */
  const pinned = month !== undefined && onMonthChange === undefined;
  useEffect(() => {
    if (pinned) {
      console.warn(
        'Calendar: `month` was passed without `onMonthChange`, so the view is pinned and the month arrows are not drawn. Hold the month in state and pass both, or pass neither.',
      );
    }
  }, [pinned]);

  const setView = (d: Date) => {
    if (onMonthChange === undefined) {
      setInnerMonth(d);
      return;
    }
    onMonthChange(iso(d));
  };

  const cells = monthCells(view, mkt.firstDayOfWeek);
  const narrowDays = mkt.weekdayNames('narrow');
  const longDays = mkt.weekdayNames('long');
  const todayIso = iso(new Date());

  const pick = (d: Date) => {
    if (isDisabledDate(d, min, max, disabledDates)) {
      return;
    }
    if (mode === 'set' && lockedDates.includes(iso(d))) {
      /* A locked date is aria-disabled and focusable, so this is reachable: the attempt is handed to
         the caller, which names the floor. Silently doing nothing would be the tooltip's failure. */
      onBlocked?.(iso(d));
      return;
    }
    onChange?.(nextValue(mode, value, d));
  };

  return (
    <div className={classNames('hg-calendar', className)} data-density={density} style={style}>
      <div className="hg-calendar-head">
        {pinned ? null : (
          <CalendarNav
            dir={-1}
            label="Previous month"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          />
        )}
        <div
          className="hg-calendar-title"
          data-pinned={pinned ? 'true' : undefined}
          aria-live={pinned ? undefined : 'polite'}
        >
          {mkt.monthYear(view)}
        </div>
        {pinned ? null : (
          <CalendarNav
            dir={1}
            label="Next month"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          />
        )}
      </div>

      {state === 'loading' ? (
        <CalendarSkeleton />
      ) : state === 'empty' ? (
        <p className="hg-calendar-empty">{emptyMessage ?? 'No records for this month.'}</p>
      ) : (
        <>
          {/* The grid roles ride on divs, not table elements: the month is laid out with CSS grid
              (`repeat(7, 1fr)` plus a 320px floor) so that no caller can squeeze a day cell under
              the 44px touch floor, which a table's own layout algorithm would not guarantee. */}
          {/* biome-ignore lint/a11y/useSemanticElements: see above — CSS-grid layout, ARIA roles. */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: a static header row is not a target. */}
          <div className="hg-calendar-weekdays" role="row">
            {narrowDays.map((day, i) => (
              // biome-ignore lint/a11y/useSemanticElements: see above.
              // biome-ignore lint/a11y/useFocusableInteractive: a column header is not a target.
              <div
                key={longDays[i] ?? day}
                role="columnheader"
                aria-label={longDays[i]}
                className="hg-calendar-weekday"
              >
                {day}
              </div>
            ))}
          </div>
          {/* biome-ignore lint/a11y/useSemanticElements: see above — CSS-grid layout, ARIA roles. */}
          <div className="hg-calendar-grid" role="grid">
            {cells.map((d, i) =>
              d === null ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: a leading blank has no identity but its slot.
                <span key={`blank-${i}`} />
              ) : (
                <CalendarCell
                  key={iso(d)}
                  date={d}
                  selected={isSelected(mode, value, d)}
                  between={inRange(mode, value, d)}
                  disabled={isDisabledDate(d, min, max, disabledDates)}
                  locked={mode === 'set' && lockedDates.includes(iso(d))}
                  today={iso(d) === todayIso}
                  marker={markers[iso(d)]}
                  spokenDate={mkt.date(d)}
                  onPick={pick}
                />
              ),
            )}
          </div>
        </>
      )}
      {footer === null ? null : <div className="hg-calendar-footer">{footer}</div>}
    </div>
  );
}
