/**
 * The app shell's own facts (`docs/tasks/SHELL.md`): which home is in force and which presets'
 * work is composed inside it, what the arc bar's raised centre does and which lists sit beside
 * it, per preset, which first-run coach marks show and how many there may be, all of it as one view, whether a phone's version meets the server's minimum, and how the ask (`F7-46`)
 * pages. Pure tables and pure derivations — the words are `packages/i18n`'s.
 */

export type { CentreVerb } from './centre-verb';
export { CENTRE_VERB_REQUIRES, CENTRE_VERBS, centreVerbFor } from './centre-verb';
export type { ClientVersion, StorePlatform } from './client-version';
export { isBelowMinimum, parseClientVersion, STORE_PLATFORMS } from './client-version';
export type { FirstRunMark, MarkedControls } from './coach-marks';
export { FIRST_RUN_COACH_MARKS, firstRunMarksFor, marksToShow } from './coach-marks';
export type {
  ExplainerMove,
  ExplainerPagerWords,
  ExplainerPages,
  ExplainerPaging,
  ExplainerView,
} from './explainer';
export {
  capExplainerPages,
  EXPLAINER_MAX_PAGES,
  explainerPageAfter,
  explainerView,
} from './explainer';
export type { ComposedHome } from './home';
export { composedHome, HOME_LADDER, homeFor, homesOf } from './home';
export type { ShellView } from './shell-view';
export { shellViewFor } from './shell-view';
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
