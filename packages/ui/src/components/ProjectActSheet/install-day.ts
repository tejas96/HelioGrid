import type { InstallDayFacts } from './ProjectActSheet.types';

/** The crew's days on site: halves allowed, as the contract takes them (`changeProjectSchema`). */
export const INSTALL_DAYS = { min: 0.5, max: 60, step: 0.5, precision: 1 } as const;

/** What the form holds, as the act sends it: an emptied field clears its fact. */
export function installDayOf(typed: {
  readonly time: string;
  readonly days: number | null;
  /** The disturbance as `useTypedDraft` gives it: trimmed, an emptied field `null`. */
  // biome-ignore lint/plugin/copy-prop-type: the manager's own sentence, sent as typed — a fact
  readonly note: string | null;
  readonly lead: string;
}): InstallDayFacts {
  return {
    startTime: typed.time === '' ? null : typed.time,
    durationDays: typed.days,
    disturbance: typed.note,
    crewLeadId: typed.lead === '' ? null : typed.lead,
  };
}
