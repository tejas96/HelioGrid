import { type DayPart, dayPart } from '@heliogrid/domain';
import { useSyncExternalStore } from 'react';

const noChange = () => () => {};

function partNow(): DayPart {
  const now = new Date();
  return dayPart(now.getHours() + now.getMinutes() / 60);
}

/**
 * The part of the day on this device, for a greeting. Null while the web renders on its server,
 * whose clock may sit in another time zone; the device's own part from the first render it draws.
 */
export function useDayPart(): DayPart | null {
  return useSyncExternalStore(noChange, partNow, () => null);
}
