import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { CalendarCell, CalendarNav, CalendarSkeleton } from './CalendarChrome';
import { iso, monthGridOf } from './calendar-grid';
import { dayPicker, dayStateOf } from './calendar-selection';
import type { CalendarProps } from './DatePicker.types';
import { useCalendarMonth } from './use-calendar-month';

interface WebCalendarProps extends CalendarProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Month grid. The market pack supplies the month and day names, the field order and the first
 * column (India starts Sunday). 44px cells at BOTH densities — functional means removing chrome,
 * not squeezing air out of a target.
 */
export function Calendar({
  words,
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
  const { view, pinned, stepMonth } = useCalendarMonth({ value, month, onMonthChange });
  const rules = { mode, value, min, max, disabledDates, lockedDates };

  const { cells, narrowDays, longDays, todayIso } = monthGridOf(view, mkt);

  const pick = dayPicker(rules, onChange, onBlocked);

  return (
    <div className={classNames('hg-calendar', className)} data-density={density} style={style}>
      <div className="hg-calendar-head">
        {pinned ? null : (
          <CalendarNav dir={-1} label={words.previousMonth} onClick={() => stepMonth(-1)} />
        )}
        <div
          className="hg-calendar-title"
          data-pinned={pinned ? 'true' : undefined}
          aria-live={pinned ? undefined : 'polite'}
        >
          {mkt.monthYear(view)}
        </div>
        {pinned ? null : (
          <CalendarNav dir={1} label={words.nextMonth} onClick={() => stepMonth(1)} />
        )}
      </div>

      {state === 'loading' ? (
        <CalendarSkeleton label={words.loading} />
      ) : state === 'empty' ? (
        <p className="hg-calendar-empty">{emptyMessage ?? words.noRecords}</p>
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
                  {...dayStateOf(rules, d, todayIso)}
                  marker={markers[iso(d)]}
                  spokenDate={mkt.date(d)}
                  onPick={pick}
                  words={words}
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
