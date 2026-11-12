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

/** A settings row's address: under the door that opens the list (`M01-61`, `SETTINGS_SEGMENT`). */
export const settingsRowPath = (segment: string): string => `${DOOR_PATH.more}/${segment}`;

/** One project's page (`SCR-M08-02`): the board, a project notice and *Mark won* open it. */
export const projectPath = (projectId: string): string => `${DOOR_PATH.projects}/${projectId}`;

/** The query a project's address carries to open asking about its early proof (the board's *To do*). */
export const EARLY_PROOF_ASK = 'early-proof';

/** One project's page, opened asking about its early proof in that proof's own sheet. */
export const projectEarlyProofPath = (projectId: string): string =>
  `${projectPath(projectId)}?ask=${EARLY_PROOF_ASK}`;

/** A project's whole checklist (`SCR-M08-03`). */
export const projectDocumentsPath = (projectId: string): string =>
  `${projectPath(projectId)}/documents`;

/** A project's install steps, its crew and how the crew gets in (`SCR-M08-04`). */
export const projectStepsPath = (projectId: string): string => `${projectPath(projectId)}/steps`;

/** A project's payments (`SCR-M11-02`); `collect` opens a part's collect sheet on arrival. */
export const projectPaymentsPath = (projectId: string, collect?: string): string =>
  `${projectPath(projectId)}/payments${collect === undefined ? '' : `?collect=${collect}`}`;

/** A project's handover (`SCR-M08-06`). */
export const projectHandoverPath = (projectId: string): string =>
  `${projectPath(projectId)}/handover`;
