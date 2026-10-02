import type { CentreVerb, StandingDestination } from '@heliogrid/domain';
import type { ShellGlyphName } from '@heliogrid/ui';

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

/** Which shape stands for which destination — the export's choice. */
// biome-ignore lint/plugin/app-vocabulary: the web shell needs this map too, so it likely moves to a package; owed (docs/tasks/deferred.md, app vocabulary row)
export const DESTINATION_GLYPH: Record<StandingDestination, ShellGlyphName> = {
  home: 'house',
  leads: 'people',
  proposals: 'document',
  projects: 'board',
  people: 'pair',
  campaigns: 'megaphone',
  more: 'dots',
};
