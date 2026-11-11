import {
  customer,
  type DbTransaction,
  project,
  projectDocument,
  projectInstallStep,
  projectStageTransition,
  tenant,
} from '@heliogrid/db';
import {
  type CalendarDate,
  type DocumentState,
  type LastMove,
  localDate,
  type ProjectStage,
  type ProjectStanding,
} from '@heliogrid/domain';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { ProjectReader } from './internal/reader';
import { projectScopeWhere } from './projects.scope.repository';

/*
 * The project an act works on: LOCKED for the rest of the caller's transaction, then read in the
 * reader's scope, so two acts on one project apply one after the other and the second decides on
 * what the first left — the second of two people tapping *Move* is told it already moved
 * (ruling 2026-11-10). A project act locks only its project; *Mark won* locks the lead first.
 */

export interface LockedProject {
  readonly tenantId: string;
  readonly projectId: string;
  readonly leadId: string;
  readonly customerId: string;
  /** How the project reads in a notice: its customer's name, else the number they called from. */
  readonly name: string;
  readonly stage: ProjectStage;
  readonly incentiveApplies: boolean;
  readonly managerId: string;
  readonly timeZone: string;
  /** The company day the project entered the stage it stands in. */
  readonly enteredOn: CalendarDate;
}

/** The project in this company and the reader's scope, locked; `null` answers 404. */
export async function lockProjectInScope(
  tx: DbTransaction,
  reader: ProjectReader,
  projectId: string,
): Promise<LockedProject | null> {
  await tx
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.tenantId, reader.tenantId), eq(project.id, projectId)))
    .for('update');
  const [row] = await tx
    .select({
      leadId: project.leadId,
      customerId: project.customerId,
      customerName: customer.name,
      phoneE164: customer.phoneE164,
      stage: project.stage,
      incentiveApplies: project.incentiveApplies,
      managerId: project.managerId,
      stageEnteredAt: project.stageEnteredAt,
      timeZone: tenant.timezone,
    })
    .from(project)
    .innerJoin(tenant, eq(tenant.id, project.tenantId))
    .innerJoin(
      customer,
      and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
    )
    .where(
      and(
        eq(project.tenantId, reader.tenantId),
        eq(project.id, projectId),
        projectScopeWhere(reader.scope, reader.actorId),
      ),
    );
  if (row === undefined) return null;
  return {
    tenantId: reader.tenantId,
    projectId,
    leadId: row.leadId,
    customerId: row.customerId,
    name: row.customerName ?? row.phoneE164,
    stage: row.stage,
    incentiveApplies: row.incentiveApplies,
    managerId: row.managerId,
    timeZone: row.timeZone,
    enteredOn: localDate(row.stageEnteredAt.getTime(), row.timeZone),
  };
}

export function standingOfLocked(locked: LockedProject): ProjectStanding {
  return { stage: locked.stage, incentiveApplies: locked.incentiveApplies };
}

/** The company's day at the act's moment — a wait cannot start after it. */
export function todayOfLocked(locked: LockedProject, act: Act): CalendarDate {
  return localDate(act.now, locked.timeZone);
}

/** The project's last move, as undo reads it. */
export async function lastMoveOf(
  tx: DbTransaction,
  locked: LockedProject,
): Promise<LastMove | null> {
  const [last] = await tx
    .select({
      from: projectStageTransition.fromStage,
      to: projectStageTransition.toStage,
      cause: projectStageTransition.cause,
      by: projectStageTransition.movedBy,
      at: projectStageTransition.movedAt,
    })
    .from(projectStageTransition)
    .where(
      and(
        eq(projectStageTransition.tenantId, locked.tenantId),
        eq(projectStageTransition.projectId, locked.projectId),
      ),
    )
    .orderBy(desc(projectStageTransition.movedAt), desc(projectStageTransition.id))
    .limit(1);
  if (last === undefined || last.from === null) return null;
  return { from: last.from, to: last.to, cause: last.cause, by: last.by, at: last.at.getTime() };
}

/** The checklist rows' states and the ticks, as proof reads them. */
export async function proofFactsOf(
  tx: DbTransaction,
  locked: LockedProject,
): Promise<{
  readonly documents: readonly { readonly row: string; readonly state: DocumentState }[];
  readonly ticked: number;
  readonly total: number;
}> {
  const [documents, steps] = await Promise.all([
    tx
      .select({ row: projectDocument.rowKey, state: projectDocument.state })
      .from(projectDocument)
      .where(
        and(
          eq(projectDocument.tenantId, locked.tenantId),
          eq(projectDocument.projectId, locked.projectId),
        ),
      )
      .orderBy(asc(projectDocument.position)),
    tx
      .select({ tickedAt: projectInstallStep.tickedAt })
      .from(projectInstallStep)
      .where(
        and(
          eq(projectInstallStep.tenantId, locked.tenantId),
          eq(projectInstallStep.projectId, locked.projectId),
        ),
      ),
  ]);
  return {
    documents,
    ticked: steps.filter((step) => step.tickedAt !== null).length,
    total: steps.length,
  };
}

/** The company day the project last arrived at `stage` — the ledger's latest move into it. */
export async function arrivalDayOf(
  tx: DbTransaction,
  locked: LockedProject,
  stage: ProjectStage,
): Promise<CalendarDate | null> {
  const [arrival] = await tx
    .select({ on: projectStageTransition.enteredOn })
    .from(projectStageTransition)
    .where(
      and(
        eq(projectStageTransition.tenantId, locked.tenantId),
        eq(projectStageTransition.projectId, locked.projectId),
        eq(projectStageTransition.toStage, stage),
      ),
    )
    .orderBy(desc(projectStageTransition.movedAt), desc(projectStageTransition.id))
    .limit(1);
  return arrival?.on ?? null;
}
