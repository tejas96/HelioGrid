import { formatDate, formatTime, IN_FORMATS } from '@heliogrid/domain';

/** The days a loss postponed on Thursday 12 November 2026 comes back on, as Lead Detail hands them. */
export const LOST_POSTPONE = {
  week: '2026-11-19',
  month: '2026-12-12',
  threeMonths: '2027-02-12',
} as const;

/** The first day a picked date may take: the day after that Thursday. */
export const LOST_FIRST_DAY = '2026-11-13';

/** A day and the 09:00 wake as the Indian pack writes them in English — the note's two values. */
export function lostNoteValues(day: string): { day: string; time: string } {
  return { day: formatDate(IN_FORMATS, day, 'en'), time: formatTime(IN_FORMATS, '09:00') };
}
