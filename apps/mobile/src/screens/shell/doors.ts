import type { CentreVerb, StandingDestination } from '@heliogrid/domain';

/** The placeholder routes the shell opens, until each module's own screen replaces one. */
// biome-ignore lint/plugin/app-vocabulary: the phone's own route names, kept by hand beside the navigator until they are derived from it (docs/tasks/deferred.md D67)
export type DoorRoute =
  | 'Leads'
  | 'Proposals'
  | 'Projects'
  | 'People'
  | 'Campaigns'
  | 'More'
  | 'QuickAddLead'
  | 'StartSurvey'
  | 'Search'
  | 'Notifications';

/** Where each pill item goes. Home is the shell itself; every other is a door. */
export const DESTINATION_ROUTE: Record<Exclude<StandingDestination, 'home'>, DoorRoute> = {
  leads: 'Leads',
  proposals: 'Proposals',
  projects: 'Projects',
  people: 'People',
  campaigns: 'Campaigns',
  more: 'More',
};

/** Where the add action goes, per verb (`M02-06`: one tap to quick add). */
export const VERB_ROUTE: Record<CentreVerb, DoorRoute> = {
  add_lead: 'QuickAddLead',
  start_survey: 'StartSurvey',
};
