/**
 * The app shell's own facts (`docs/tasks/SHELL.md`): what the arc bar's raised centre does and
 * which lists sit beside it, per preset. Pure tables — the ladder that picks the preset is
 * `T-M13-006`'s, and the words are `packages/i18n`'s.
 */

export type { CentreVerb } from './centre-verb';
export { CENTRE_VERB_REQUIRES, CENTRE_VERBS, centreVerbFor } from './centre-verb';
export type {
  StandingDestination,
  StandingDestinationSet,
  WorkDestination,
} from './standing-destinations';
export {
  standingDestinationsFor,
  WORK_DESTINATION_DOMAIN,
  WORK_DESTINATIONS,
} from './standing-destinations';
