import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { ComplianceFloor } from '../ComplianceFloor';
import { Calendar } from '../DatePicker/Calendar';
import { parse } from '../DatePicker/calendar-grid';
import type { CalendarValue, DayMarker, ISODate } from '../DatePicker/DatePicker.types';
import { useFormat } from '../MarketProvider/market-context';
import type { DateSetProps } from './DateSet.types';
import { DateSetList } from './DateSetList';
import { floorFor, refusalMessage } from './date-set-floor';

/** Own-width, never viewport (law 4): grid and list side by side above 640px of THIS component. */
const BREAK = 640;

interface WebDateSetProps extends DateSetProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * TWO KINDS OF HOLIDAY, AND ONLY ONE OF THEM IS THE TENANT'S TO DELETE (`SCR-M07-06`). `M07-12`
 * permits "narrower windows and extra holidays only, NEVER WIDER" — the tenant may add, may remove
 * their own, and may never remove a pack-supplied one.
 *
 * In the LIST there is nothing to try: the row states the floor permanently and carries no delete.
 * In the GRID the date is a real cell, so it is `aria-disabled`, stays focusable, and activating it
 * renders the refusal in words under the calendar and announces it politely. The attempt is
 * answered where it was made; it is never silently ignored, and never a tooltip.
 */
export function DateSet({
  entries = [],
  onAdd,
  onRemove,
  packName = 'Market pack',
  floor,
  label = 'Holiday calendar',
  listLabel = 'Holidays this year',
  addLabel = 'Tap a date to add a holiday',
  emptyMessage = 'No holidays yet. Tap a date to add one.',
  min,
  max,
  month,
  onMonthChange,
  onFormChange,
  density = 'expressive',
  className,
  style,
}: WebDateSetProps) {
  const mkt = useFormat();
  const wrapRef = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(true);
  const [own, setOwn] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<ISODate | null>(null);
  const [say, setSay] = useState('');

  useEffect(() => {
    const el = wrapRef.current;
    if (el === null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver((records) => {
      const width = records[0]?.contentRect.width;
      if (width === undefined) {
        return;
      }
      setOwn(width);
      setWide(width >= BREAK);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (own !== null) {
      onFormChange?.({ stacked: !wide, width: own });
    }
  }, [wide, own, onFormChange]);

  const sorted = useMemo(() => [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)), [entries]);
  const dates = sorted.map((e) => e.date);
  const locked = sorted.filter((e) => e.origin === 'pack').map((e) => e.date);
  const byDate = useMemo(() => new Map(sorted.map((e) => [e.date, e])), [sorted]);
  const markers = useMemo<Record<string, DayMarker>>(
    () =>
      Object.fromEntries(
        sorted.map((e) => [e.date, { tone: 'holiday' as const, label: e.name ?? 'Holiday' }]),
      ),
    [sorted],
  );

  const onBlocked = (key: ISODate) => {
    setBlocked(key);
    setSay(`${mkt.date(parse(key) ?? key)} is supplied by the ${packName} and cannot be removed.`);
  };

  /* Calendar hands back the whole set; the difference is the act. Only additions can arrive here —
     a pack date's removal was refused in the grid, and a tenant date's removal is the row button. */
  const toggle = (next: CalendarValue) => {
    const list = Array.isArray(next) ? next : [];
    const added = list.filter((d) => !dates.includes(d));
    const removed = dates.filter((d) => !list.includes(d));
    const first = added[0];
    if (first !== undefined && onAdd !== undefined) {
      setBlocked(null);
      setSay(`${mkt.date(parse(first) ?? first)} added.`);
      onAdd(first);
      return;
    }
    const gone = removed[0];
    if (gone === undefined || onRemove === undefined) {
      return;
    }
    if (byDate.get(gone)?.origin === 'pack') {
      onBlocked(gone);
      return;
    }
    setSay(`${mkt.date(parse(gone) ?? gone)} removed.`);
    onRemove(gone);
  };

  const blockedEntry = blocked === null ? undefined : byDate.get(blocked);

  return (
    <section
      ref={wrapRef}
      aria-label={label}
      className={classNames('hg-date-set', className)}
      style={style}
    >
      <span className="hg-date-set-announce" role="status" aria-live="polite">
        {say}
      </span>
      <div className="hg-date-set-layout" data-stacked={wide ? undefined : 'true'}>
        <div className="hg-date-set-grid">
          <Calendar
            mode="set"
            value={dates}
            onChange={toggle}
            lockedDates={locked}
            onBlocked={onBlocked}
            markers={markers}
            min={min}
            max={max}
            month={month}
            onMonthChange={onMonthChange}
            density={density}
          />
          <p className="hg-date-set-add-label">{addLabel}</p>
          {/* The refusal, where the attempt was made. Same sentence the row already carries. */}
          {blocked === null ? null : (
            <div className="hg-date-set-refusal">
              <ComplianceFloor
                variant="refusal"
                {...floorFor(blockedEntry, packName, floor)}
                message={refusalMessage(packName)}
              />
            </div>
          )}
        </div>
        <DateSetList
          entries={sorted}
          mkt={mkt}
          packName={packName}
          floor={floor}
          listLabel={listLabel}
          emptyMessage={emptyMessage}
          blocked={blocked}
          density={density}
          onRemove={
            onRemove === undefined
              ? undefined
              : (date, spokenName) => {
                  setSay(`${spokenName} removed.`);
                  onRemove(date);
                }
          }
        />
      </div>
    </section>
  );
}
