/** The most phases a timeline holds (`M01-52`); the wire refuses more. */
export const TIMELINE_PHASE_LIMIT = 20;

/** The longest a phase's name may be — the wire's label bound. */
export const PHASE_NAME_LIMIT = 120;

/**
 * One phase of the customer-facing project timeline (`M01-52`): a name and one sentence, in the
 * tenant's own words — one value each, shown as written (`F3-10`). The platform's phases are
 * catalog copy (`packages/i18n` `documentDefaults`), in the reader's words until the tenant saves.
 */
export interface TimelinePhase {
  readonly name: string;
  readonly description: string;
}
