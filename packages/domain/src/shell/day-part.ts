/**
 * The part of the day a greeting names, from the hour on the device (hours since midnight, e.g.
 * 9.25 for 09:15). Morning 5–12, afternoon 12–17, evening 17–22; the small hours get a neutral
 * hello. Domain reads no clock: the caller passes the hour.
 */
export const DAY_PARTS = ['morning', 'afternoon', 'evening', 'late'] as const;
export type DayPart = (typeof DAY_PARTS)[number];

export function dayPart(hours: number): DayPart {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'late';
}
