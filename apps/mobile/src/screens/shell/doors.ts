import type { CentreVerb, StandingDestination } from '@heliogrid/domain';

/** The placeholder routes the shell opens, until each module's own screen replaces one. */
// biome-ignore lint/plugin/app-vocabulary: the phone's own route names; whether app routing vocabulary stays here is owed (docs/tasks/deferred.md, app vocabulary row)
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
// biome-ignore lint/plugin/app-vocabulary: maps a domain word to the phone's own route; ruling owed (docs/tasks/deferred.md, app vocabulary row)
export const DESTINATION_ROUTE: Record<Exclude<StandingDestination, 'home'>, DoorRoute> = {
  leads: 'Leads',
  proposals: 'Proposals',
  projects: 'Projects',
  people: 'People',
  campaigns: 'Campaigns',
  more: 'More',
};

/** Where the add action goes, per verb (`M02-06`: one tap to quick add). */
// biome-ignore lint/plugin/app-vocabulary: maps a domain word to the phone's own route; ruling owed (docs/tasks/deferred.md, app vocabulary row)
export const VERB_ROUTE: Record<CentreVerb, DoorRoute> = {
  add_lead: 'QuickAddLead',
  start_survey: 'StartSurvey',
};
