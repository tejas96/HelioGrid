import { randomUUID } from 'node:crypto';
import type { MarkWon, ProjectBoard, ProjectDetail } from '@heliogrid/contracts';
import {
  file,
  project,
  projectBlocker,
  projectCrewMember,
  projectDocument,
  projectFile,
  projectInstallStep,
  projectStageTransition,
  tenantCounter,
} from '@heliogrid/db';
import { checklistForDeal, IN_PACK, type ProjectStage } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { dayFromToday } from '../crm/lead-work';
import {
  aCapture,
  aPhone,
  type Caller,
  type CrmWorld,
  captured,
  openCrmWorld,
  retryKey,
  type Staffed,
  type Team,
} from '../crm/support';
import type { Reply } from '../support/http';

export { dayFromToday } from '../crm/lead-work';
export { aStaffedCompany, type Caller, ownLead, preset } from '../crm/support';

/*
 * One projects proof's world: the CRM world (its companies, people and their bearers), and the
 * project rows it made removed before the CRM rows they point at — a project names its lead, its
 * customer and its people, so `unseed` could not remove those while one stands.
 */

export type ProjectsWorld = CrmWorld;

export async function openProjectsWorld(staffed: readonly Staffed<Team>[]): Promise<ProjectsWorld> {
  const world = await openCrmWorld(staffed);
  const companies = staffed.map((one) => one.company.tenantId);
  return {
    ...world,
    async close() {
      await removeProjectsOf(world, companies);
      await world.close();
    },
  };
}

/** Every project row these companies own, children first. */
async function removeProjectsOf(world: CrmWorld, companies: readonly string[]): Promise<void> {
  const db = world.pools.admin.db;
  for (const table of [
    projectFile,
    projectCrewMember,
    projectInstallStep,
    projectDocument,
    projectBlocker,
    projectStageTransition,
    project,
    tenantCounter,
  ]) {
    await db.delete(table).where(inArray(table.tenantId, [...companies]));
  }
}

/** The chain a hand walks from Won up to the stage before handover, on a deal with no incentive. */
export const TO_COMMISSIONED: readonly ProjectStage[] = [
  'material_ordered',
  'dispatched',
  'installation',
  'electrical_metering',
  'utility_inspection',
  'commissioned',
];

export const now = () => new Date().toISOString();

/** The refusal an act answered with, read off its envelope. */
export interface Refused {
  readonly error: {
    readonly code: string;
    readonly facts?: { readonly refusal: string };
    readonly details?: readonly { readonly path: string }[];
  };
}

export const refusalOf = (reply: Reply<unknown>) => (reply.body as Refused).error.facts?.refusal;

/** What Mark won seeds from the IN pack: a deal's checklist rows by kind, and the install steps. */
export const seededRowsOf = (segment: 'residential' | 'commercial'): number =>
  checklistForDeal(IN_PACK.formats.documentChecklist, IN_PACK.subsidy, segment).length;
export const SEEDED_STEPS = IN_PACK.formats.installSteps.length;

/** The install date a win promises: a month out. */
const INSTALL_IN_DAYS = 30;
/** A SHA-256 checksum written in hex. */
const SHA256_HEX_LENGTH = 64;

/** A *Mark won* body: a final value, an install date a month out, and the manager given. */
export const aWin = (managerId: string, typed: Partial<MarkWon> = {}): MarkWon => ({
  capturedAt: now(),
  finalValue: '450000.00',
  expectedInstallOn: dayFromToday(INSTALL_IN_DAYS),
  managerId,
  ...typed,
});

/** A fresh lead captured by `caller`, of the segment given. */
export async function aLead(
  caller: Caller,
  segment: 'residential' | 'commercial' = 'residential',
): Promise<string> {
  return (await captured(caller, aCapture(aPhone(), { segment }))).lead.id;
}

/** *Mark won* as sent, whatever it answers. */
export function markWon(caller: Caller, leadId: string, body: MarkWon, key = retryKey()) {
  return caller.call<{ projectId: string; number: string }>(
    'POST',
    `/leads/${leadId}/won`,
    body,
    key,
  );
}

/** A lead captured and won by `caller`, managed by `managerId`: the project it made. */
export async function aWonProject(
  caller: Caller,
  managerId: string,
  segment: 'residential' | 'commercial' = 'residential',
): Promise<{ projectId: string; number: string; leadId: string }> {
  const leadId = await aLead(caller, segment);
  const reply = await markWon(caller, leadId, aWin(managerId));
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`mark won: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return { ...reply.body, leadId };
}

/** One project act as sent, whatever it answers. */
export function actOn(
  caller: Caller,
  projectId: string,
  verb: string,
  body: Record<string, unknown> = {},
): Promise<Reply<ProjectDetail>> {
  return caller.call<ProjectDetail>('POST', `/projects/${projectId}/${verb}`, {
    capturedAt: now(),
    ...body,
  });
}

/** One project act that must succeed: the project as it then stands. */
export async function acted(
  caller: Caller,
  projectId: string,
  verb: string,
  body: Record<string, unknown> = {},
): Promise<ProjectDetail> {
  const reply = await actOn(caller, projectId, verb, body);
  if (reply.status !== HttpStatus.OK) {
    throw new Error(`${verb}: expected 200, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/**
 * Forward taps through each stage given, in order — Dispatched through its own sheet, naming
 * `crew` (none while the company has no one on the installation team).
 */
export async function walk(
  caller: Caller,
  projectId: string,
  stages: readonly ProjectStage[],
  crew: readonly string[] = [],
): Promise<ProjectDetail | null> {
  let last: ProjectDetail | null = null;
  for (const to of stages) {
    last =
      to === 'dispatched'
        ? await acted(caller, projectId, 'dispatch', { crew, leftOn: dayFromToday(0) })
        : await acted(caller, projectId, 'move', { to });
  }
  return last;
}

export function detailOf(caller: Caller, projectId: string) {
  return caller.call<ProjectDetail>('GET', `/projects/${projectId}`);
}

export async function boardOf(caller: Caller): Promise<ProjectBoard> {
  const reply = await caller.call<ProjectBoard>('GET', '/projects/board');
  if (reply.status !== HttpStatus.OK) throw new Error(`board: got ${reply.status}`);
  return reply.body;
}

/**
 * A stored file on a project or a lead, written on the admin path as the file module's complete
 * leaves it — the upload itself is that module's proof; this one proves what putting it on its
 * record does. `uploaded: false` is a declared file whose bytes never came.
 */
export async function aStoredFile(
  world: ProjectsWorld,
  tenantId: string,
  subject: { readonly kind: 'project' | 'lead'; readonly ref: string },
  uploaded = true,
): Promise<string> {
  const id = randomUUID();
  const at = new Date();
  await world.pools.admin.db.insert(file).values({
    id,
    tenantId,
    subjectKind: subject.kind,
    subjectRef: subject.ref,
    provider: 'local',
    externalId: `${subject.kind}-proof/${id}`,
    contentType: 'application/pdf',
    byteSize: 1,
    checksumSha256: '0'.repeat(SHA256_HEX_LENGTH),
    declaredAt: at,
    uploadedAt: uploaded ? at : null,
  });
  return id;
}
