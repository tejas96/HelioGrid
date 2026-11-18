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
/** The inbox's address (`SCR-M02-02`): under the Leads door, as the phone's link is. */
export const LEAD_INBOX_PATH = `/${DOOR_SEGMENT.leads}/inbox`;

/** One lead's page, which a queued lead's name, My Day and the dashboard open (`SCR-M02-04`). */
export const leadPath = (leadId: string): string => `/${DOOR_SEGMENT.leads}/${leadId}`;

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

/** One proposal's page after it is built (`SCR-M06-18`); `share` opens its share sheet on arrival. */
export const proposalPath = (proposalId: string, share = false): string =>
  `${DOOR_PATH.proposals}/${proposalId}${share ? '?share=1' : ''}`;

/**
 * The builder a draft, or a proposal's next version, is worked in (`SCR-M06-02`); a step rides
 * `?step=`, so Back and forward walk the steps.
 */
export const proposalBuilderPath = (proposalId: string, step?: string): string =>
  `${proposalPath(proposalId)}/build${step === undefined ? '' : `?step=${encodeURIComponent(step)}`}`;

/** A proposal's document (`SCR-M06-17`): its newest version, or the one named. */
export const proposalDocumentPath = (proposalId: string, version?: number): string =>
  `${proposalPath(proposalId)}/document${version === undefined ? '' : `?v=${version}`}`;

/** A proposal's versions (`SCR-M06-16`). */
export const proposalVersionsPath = (proposalId: string): string =>
  `${proposalPath(proposalId)}/versions`;

/** A deal's named links (`SCR-M06-20`). */
export const proposalLinksPath = (proposalId: string): string =>
  `${proposalPath(proposalId)}/links`;

/** A design's own page — where the studio opens (`SCR-M05-02`). */
export const designPath = (designId: string): string => `/designs/${designId}`;

/** The Site details a design starts with (`SCR-M05-01`). */
export const designSitePath = (designId: string): string => `${designPath(designId)}/site`;

/** One lead's page, opened on its *Mark won* sheet — a proposal's *Confirm won* (`M07-62`). */
export const leadWonPath = (leadId: string): string => `${leadPath(leadId)}?won=1`;
