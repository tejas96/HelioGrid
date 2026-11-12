import type { MyDay, MyDayItem, TranslatedText } from '@heliogrid/contracts';
import { daysLateOf, type MyDayBand } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { MarketFormat } from '../../utils/format';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { MenuItem } from '../Menu/Menu.types';
import type { MyDayBandRows, MyDayProps, MyDayWords } from './MyDay.types';

/** The name a task's lead goes by: its own, or "No name yet". */
export function nameOf(item: MyDayItem, words: MyDayWords): string {
  return item.lead.name ?? words.unnamed;
}

/** When a task is due, as its mark says it: how late, the time today, or the day this week. */
export function whenOf(
  item: MyDayItem,
  day: Pick<MyDay, 'timeZone'>,
  words: MyDayWords,
  format: Pick<MarketFormat, 'clockAt' | 'weekday'>,
): { readonly tone: StatusTone; readonly label: TranslatedText } {
  const dueAt = item.task.dueAt;
  switch (item.band) {
    case 'overdue':
      return {
        tone: 'danger',
        label: words.daysLate(daysLateOf(Date.parse(dueAt), Date.now(), day.timeZone)),
      };
    case 'today':
      return { tone: 'accent', label: words.dueAt(format.clockAt(dueAt)) };
    case 'week':
      return { tone: 'neutral', label: words.dueOn(format.weekday(dueAt)) };
  }
}

/**
 * The one act a task leads with: *Directions* for a booked visit with a place, else *Call* — off,
 * with its reason, when the number is do-not-call or wrong (`M02-44`).
 */
export interface MyDayLeadAct {
  readonly kind: 'call' | 'directions';
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
  /** The circle's spoken name in a row. */
  readonly spokenName: TranslatedText;
  readonly off: TranslatedText | null;
  readonly onPress: () => void;
}

export function leadActOf(
  item: MyDayItem,
  props: Pick<MyDayProps, 'words' | 'onCall' | 'onDirections'>,
): MyDayLeadAct {
  const { words } = props;
  if (item.task.kind === 'site_visit' && item.visitPlace !== null) {
    return {
      kind: 'directions',
      glyph: 'pin',
      label: words.directions,
      spokenName: words.directions,
      off: null,
      onPress: () => props.onDirections(item),
    };
  }
  return {
    kind: 'call',
    glyph: 'phone',
    label: words.call,
    spokenName: words.callName(nameOf(item, words)),
    off: item.canDial ? null : words.callOff,
    onPress: () => props.onCall(item),
  };
}

/** A band's head glyph and tone: overdue in the danger ink, today the clock, this week the calendar. */
export const BAND_HEAD: Record<
  MyDayBand,
  { readonly glyph: ShellGlyphName; readonly tone: 'danger' | 'accent' | 'secondary' }
> = {
  overdue: { glyph: 'alert-circle', tone: 'danger' },
  today: { glyph: 'clock', tone: 'accent' },
  week: { glyph: 'calendar', tone: 'secondary' },
};

/** The bands with something in them; the left column holds overdue, the right the rest. */
export function bandsShown(bands: readonly MyDayBandRows[]) {
  const shown = bands.filter((band) => band.count > 0);
  return {
    overdue: shown.filter((band) => band.band === 'overdue'),
    later: shown.filter((band) => band.band !== 'overdue'),
  };
}

/** Where the hero's task sits in the day — "1 of 17" over overdue and today — or none. */
export function positionOf(day: MyDay, words: MyDayWords): TranslatedText | null {
  const of = day.counts.overdue + day.counts.today;
  return of === 0 ? null : words.position(1, of);
}

/** Nothing to do: no task now and every band empty. */
export function isClear(props: Pick<MyDayProps, 'next' | 'asking' | 'bands'>): boolean {
  return (
    props.next === null && props.asking === null && props.bands.every((band) => band.count === 0)
  );
}

/** Why the hero's task leads, under its acts: the latest when overdue, the soonest today. */
export function whyFirstOf(item: MyDayItem, words: MyDayWords): TranslatedText | null {
  switch (item.band) {
    case 'overdue':
      return words.whyFirstLate;
    case 'today':
      return words.whyFirstToday;
    case 'week':
      return null;
  }
}

/**
 * A row's other acts behind its menu (gap 12): move it to tomorrow, or open the lead to message.
 * `glyph` is the half's own glyph, as the lead page's menu draws it.
 */
export function rowMenuItemsOf(
  item: MyDayItem,
  props: MyDayProps,
  glyph: (name: ShellGlyphName) => ReactNode,
): MenuItem[] {
  return [
    {
      key: 'move',
      label: props.words.moveToTomorrow,
      icon: glyph('calendar-clock'),
      disabled: props.sending,
      onSelect: () => props.onMoveToTomorrow(item),
    },
    {
      key: 'message',
      label: props.words.message,
      icon: glyph('chat'),
      onSelect: () => props.onMessage(item),
    },
  ];
}
