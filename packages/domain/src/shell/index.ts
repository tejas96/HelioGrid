/**
 * The app shell's own facts (`docs/tasks/SHELL.md`): which home is in force and which presets'
 * work is composed inside it, what the arc bar's raised centre does and which lists sit beside
 * it, per preset. Pure tables and pure derivations — the words are `packages/i18n`'s.
 */

export type { CentreVerb } from './centre-verb';
export { CENTRE_VERB_REQUIRES, CENTRE_VERBS, centreVerbFor } from './centre-verb';
export type { ComposedHome } from './home';
export { composedHome, HOME_LADDER, homeFor, homesOf } from './home';
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
