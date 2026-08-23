import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ComplianceFloor } from '../ComplianceFloor/ComplianceFloor.native';
import { Calendar } from '../DatePicker/Calendar.native';
import { parse } from '../DatePicker/calendar-grid';
import type { CalendarValue, DayMarker, ISODate } from '../DatePicker/DatePicker.types';
import { useFormat } from '../MarketProvider/market-context';
import type { DateSetProps } from './DateSet.types';
import { DateSetList } from './DateSetList.native';
import { floorFor, refusalMessage } from './date-set-floor';

/** Own-width, never viewport (law 4). onLayout is RN's ResizeObserver. */
const BREAK = 640;

interface NativeDateSetProps extends DateSetProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  section: { minWidth: 0 },
  layout: { gap: 18 },
  layoutWide: { flexDirection: 'row', gap: 22, alignItems: 'flex-start' },
  grid: { minWidth: 0 },
  gridWide: { width: 360 },
  listWide: { flex: 1, minWidth: 0 },
  addLabel: { marginTop: theme.spacing['sp-2'], marginHorizontal: theme.spacing['sp-0-5'] },
  refusal: { marginTop: theme.spacing['sp-2'] },
});

/**
 * Same law as the web half: the tenant may add, may remove their own, and may never remove a
 * pack-supplied date. In the LIST there is nothing to try; in the GRID the cell answers the attempt
 * in words — the same `ComplianceFloor` refusal the web half draws, wrapped in a polite live region
 * rather than a visually-hidden live span: RN has no off-screen text node, and a live region is the
 * platform's own answer to the same requirement.
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
  style,
}: NativeDateSetProps) {
  const mkt = useFormat();
  const [wide, setWide] = useState(true);
  const [own, setOwn] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<ISODate | null>(null);

  useEffect(() => {
    if (own !== null) {
      onFormChange?.({ stacked: !wide, width: own });
    }
  }, [wide, own, onFormChange]);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setOwn(width);
    setWide(width >= BREAK);
  };

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

  const onBlocked = (key: ISODate) => setBlocked(key);

  /* The web half states every act into a visually-hidden live span. RN has no off-screen text
     node, so the same sentence is spoken directly — one announcement per act, the same channel
     ReorderList already uses. The REFUSAL is not announced here: it becomes visible content
     under the grid, inside a polite live region, which is stronger than a passing sentence. */
  const say = (sentence: string) => AccessibilityInfo.announceForAccessibility(sentence);
  const spokenDate = (key: ISODate) => mkt.date(parse(key) ?? key);

  const toggle = (next: CalendarValue) => {
    const list = Array.isArray(next) ? next : [];
    const added = list.filter((d) => !dates.includes(d));
    const removed = dates.filter((d) => !list.includes(d));
    const first = added[0];
    if (first !== undefined && onAdd !== undefined) {
      setBlocked(null);
      say(`${spokenDate(first)} added.`);
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
    say(`${spokenDate(gone)} removed.`);
    onRemove(gone);
  };

  const blockedEntry = blocked === null ? undefined : byDate.get(blocked);

  return (
    /* The web half is a `<section aria-label>` — a named REGION — so the native half takes the
       region role rather than `accessible`, which would fold the grid's day cells and the list's
       delete buttons into one element nobody could reach. */
    <View
      role="region"
      accessibilityLabel={label}
      onLayout={onLayout}
      style={[styles.section, style]}
    >
      <View style={[styles.layout, wide ? styles.layoutWide : undefined]}>
        <View style={[styles.grid, wide ? styles.gridWide : undefined]}>
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
          <View style={styles.addLabel}>
            <Text variant="caption" color="tertiary">
              {addLabel}
            </Text>
          </View>
          {blocked === null ? null : (
            <View accessibilityLiveRegion="polite" style={styles.refusal}>
              <ComplianceFloor
                variant="refusal"
                {...floorFor(blockedEntry, packName, floor)}
                message={refusalMessage(packName)}
              />
            </View>
          )}
        </View>
        <View style={wide ? styles.listWide : undefined}>
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
                    say(`${spokenName} removed.`);
                    onRemove(date);
                  }
            }
          />
        </View>
      </View>
    </View>
  );
}
