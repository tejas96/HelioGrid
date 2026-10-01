import type { CentreVerb, StandingDestination } from '@heliogrid/domain';
import type { ShellGlyphName } from '@heliogrid/ui';

/** The placeholder routes the shell opens, until each module's own screen replaces one. */
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

/** Which shape stands for which destination — the export's choice. */
export const DESTINATION_GLYPH: Record<StandingDestination, ShellGlyphName> = {
  home: 'house',
  leads: 'people',
  proposals: 'document',
  projects: 'board',
  people: 'pair',
  campaigns: 'megaphone',
  more: 'dots',
};
