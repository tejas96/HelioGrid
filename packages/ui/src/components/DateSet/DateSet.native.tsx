import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useMemo, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ComplianceFloor } from '../ComplianceFloor/ComplianceFloor.native';
import { Calendar } from '../DatePicker/Calendar.native';
import { parse } from '../DatePicker/calendar-grid';
import type { CalendarValue, ISODate } from '../DatePicker/DatePicker.types';
import { useFormat } from '../MarketProvider/market-context';
import { dateSetView } from './DateSet.logic';
import type { DateSetProps } from './DateSet.types';
import { DateSetList } from './DateSetList.native';
import { floorFor } from './date-set-floor';
import { useDateSetRoom } from './use-date-set-room';

/** Own-width, never viewport (law 4). onLayout is RN's ResizeObserver. */

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
  packName,
  floor,
  label,
  listLabel,
  addLabel,
  emptyMessage,
  words,
  floorWords,
  calendarWords,
  min,
  max,
  month,
  onMonthChange,
  onFormChange,
  density = 'expressive',
  style,
}: NativeDateSetProps) {
  const mkt = useFormat();
  const { wide, measure } = useDateSetRoom(onFormChange);
  const [blocked, setBlocked] = useState<ISODate | null>(null);

  const onLayout = (event: LayoutChangeEvent) => measure(event.nativeEvent.layout.width);

  const { sorted, dates, locked, byDate, markers } = useMemo(
    () => dateSetView(entries, words.holiday),
    [entries, words.holiday],
  );

  const onBlocked = (key: ISODate) => setBlocked(key);

  /* The web half states every act into a visually-hidden live span. RN has no off-screen text
     node, so the same sentence is spoken directly — one announcement per act, the same channel
     ReorderList already uses. The REFUSAL is not announced here: it becomes visible content
     under the grid, inside a polite live region, which is stronger than a passing sentence. */
  const say = (sentence: TranslatedText) => AccessibilityInfo.announceForAccessibility(sentence);
  const spokenDate = (key: ISODate) => mkt.date(parse(key) ?? key);

  const toggle = (next: CalendarValue) => {
    const list = Array.isArray(next) ? next : [];
    const added = list.filter((d) => !dates.includes(d));
    const removed = dates.filter((d) => !list.includes(d));
    const first = added[0];
    if (first !== undefined && onAdd !== undefined) {
      setBlocked(null);
      say(words.added(spokenDate(first)));
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
    say(words.removed(spokenDate(gone)));
    onRemove(gone);
  };

  const blockedEntry = blocked === null ? undefined : byDate.get(blocked);

  return (
    /* The web half is a `<section aria-label>` — a named REGION — so the native half takes the
       region role rather than `accessible`, which would fold the grid's day cells and the list's
       delete buttons into one element nobody could reach. */
    <View
      role="region"
      collapsable={false}
      accessibilityLabel={label}
      onLayout={onLayout}
      style={[styles.section, style]}
    >
      <View style={[styles.layout, wide ? styles.layoutWide : null]}>
        <View style={[styles.grid, wide ? styles.gridWide : null]}>
          <Calendar
            words={calendarWords}
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
                {...floorFor(blockedEntry, packName, floor, words, floorWords)}
                message={words.refusal(packName)}
              />
            </View>
          )}
        </View>
        <View style={wide ? styles.listWide : null}>
          <DateSetList
            entries={sorted}
            mkt={mkt}
            packName={packName}
            floor={floor}
            words={words}
            floorWords={floorWords}
            listLabel={listLabel}
            emptyMessage={emptyMessage}
            blocked={blocked}
            density={density}
            onRemove={
              onRemove === undefined
                ? undefined
                : (date, spokenName) => {
                    say(words.removed(spokenName));
                    onRemove(date);
                  }
            }
          />
        </View>
      </View>
    </View>
  );
}
