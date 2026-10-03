import type { ShellDoor } from '@heliogrid/domain';

/**
 * The URL of each door the shell opens. Until its module lands, each one is the `[door]`
 * placeholder; a module's own route then wins, since Next matches a fixed segment first.
 */
export const DOOR_PATH: Record<ShellDoor, string> = {
  leads: '/leads',
  proposals: '/proposals',
  projects: '/projects',
  people: '/people',
  campaigns: '/campaigns',
  more: '/more',
  add_lead: '/add-lead',
  start_survey: '/start-survey',
  search: '/search',
};
