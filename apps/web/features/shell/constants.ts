import { DOOR_SEGMENT, type ShellDoor } from '@heliogrid/domain';

/**
 * The URL of each door the shell opens, over the address domain gives it. Until its module lands,
 * each one is the `[door]` placeholder; a module's own route then wins, since Next matches a fixed
 * segment first.
 */
export const DOOR_PATH: Record<ShellDoor, string> = {
  leads: `/${DOOR_SEGMENT.leads}`,
  proposals: `/${DOOR_SEGMENT.proposals}`,
  projects: `/${DOOR_SEGMENT.projects}`,
  people: `/${DOOR_SEGMENT.people}`,
  campaigns: `/${DOOR_SEGMENT.campaigns}`,
  more: `/${DOOR_SEGMENT.more}`,
  add_lead: `/${DOOR_SEGMENT.add_lead}`,
  start_survey: `/${DOOR_SEGMENT.start_survey}`,
  search: `/${DOOR_SEGMENT.search}`,
};
