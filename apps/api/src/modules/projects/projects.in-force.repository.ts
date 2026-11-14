import { type DbTransaction, project, projectTranche, type TenantPool } from '@heliogrid/db';
import { mayPutVersionInForce } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { recordActivity } from '../crm/crm.public';
import { versionById } from '../proposals/proposals.public';
import type { ProjectReader } from './internal/reader';
import type { ActContext, StepOutcome } from './projects.act-kit.repository';
import { done, forbidden, refusedWith } from './projects.act-kit.repository';
import {
  type InForceFacts,
  type InForcePlan,
  inForceFactsOf,
  inForcePlanOf,
  inForceRefusalOf,
} from './projects.in-force-facts.repository';
import type { LockedProject } from './projects.lock.repository';
import { projectScopeWhere } from './projects.scope.repository';
import { markSignedProposalPutInForce } from './projects.won-basis.repository';

/**
 * *Put version N in force* (`M08-50`, `M11-14`): the lead's owner or the project's manager records
 * that the customer agreed. The project then runs on that version — its value and its plan — every
 * receipt stays where it is, and the earlier schedule's unpaid parts keep their rows, marked.
 */
export function putVersionInForce(context: ActContext, version: number) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    const { tenantId, projectId } = locked;
    const facts = await inForceFactsOf(tx, tenantId, projectId, version);
    if (facts === null) return refusedWith('project_closed');
    // Who may is decided on what the lock holds: a lead handed on while this waited is no longer theirs.
    if (!mayPutVersionInForce(context.mover.userId, facts)) return forbidden();
    const refusal = inForceRefusalOf(facts);
    if (refusal !== null) return refusedWith(refusal);
    if (facts.asked === null) return refusedWith('version_unknown');
    const now = new Date(context.act.now);
    const plan = await inForcePlanOf(tx, tenantId, projectId, facts.asked);
    await rewriteSchedule(tx, locked, plan, {
      now,
      by: context.mover.userId,
      replacedVersionId: facts.inForce?.versionId ?? null,
    });
    await tx
      .update(project)
      .set({ proposalVersionId: facts.asked.versionId, finalValueMinor: facts.asked.payable })
      .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
    await markSignedProposalPutInForce(tx, tenantId, projectId, {
      userId: context.mover.userId,
      at: now,
    });
    await recordAuditEntry(
      tx,
      memberAct(
        'proposals.version_put_in_force',
        tenantId,
        { kind: 'proposal_version', ref: facts.asked.versionId },
        context.act,
      ),
    );
    await recordActivity(tx, {
      tenantId,
      customerId: locked.customerId,
      leadId: locked.leadId,
      kind: 'proposal_version_in_force',
      body: {
        proposalId: facts.proposalId ?? '',
        number: await numberOf(tx, tenantId, facts.asked.versionId),
        version: facts.asked.version,
        projectId,
      },
      actor: { kind: 'person', userId: context.mover.userId },
      capturedAt: context.capturedAt,
    });
    return done();
  };
}

/**
 * The schedule as the version in force leaves it (`M11-14`): the unpaid parts replaced — marked with
 * who put the version in force and the version they belonged to — kept parts re-amounted, and the
 * new parts after every position any part holds.
 */
async function rewriteSchedule(
  tx: DbTransaction,
  { tenantId, projectId }: LockedProject,
  plan: InForcePlan,
  replaced: { readonly now: Date; readonly by: string; readonly replacedVersionId: string | null },
): Promise<void> {
  if (plan.replaced.length > 0) {
    await tx
      .update(projectTranche)
      .set({
        replacedAt: replaced.now,
        replacedBy: replaced.by,
        replacedVersionId: replaced.replacedVersionId,
      })
      .where(and(eq(projectTranche.tenantId, tenantId), inArray(projectTranche.id, plan.replaced)));
  }
  for (const part of plan.kept.filter((one) => one.amount !== one.was)) {
    await tx
      .update(projectTranche)
      .set({ amountMinor: part.amount })
      .where(and(eq(projectTranche.tenantId, tenantId), eq(projectTranche.id, part.id)));
  }
  if (plan.made.parts.length > 0) {
    await tx.insert(projectTranche).values(
      plan.made.parts.map((part, index) => ({
        tenantId,
        projectId,
        position: plan.lastPosition + index + 1,
        label: part.label,
        shareBasisPoints: part.share,
        amountMinor: part.amount,
        dueOnStage: part.dueOnStage,
        source: 'proposal_version' as const,
        createdAt: replaced.now,
      })),
    );
  }
}

async function numberOf(
  tx: DbTransaction,
  tenantId: string,
  versionId: string,
): Promise<string | null> {
  return (await versionById(tx, tenantId, versionId))?.number ?? null;
}

@Injectable()
export class ProjectsInForceRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * What putting a version in force would do, for a project the reader reaches. `null` answers
   * 404; `forbidden` is a reader who is neither the lead's owner nor the project's manager.
   */
  preview(
    reader: ProjectReader,
    projectId: string,
    version: number,
  ): Promise<
    | { readonly kind: 'forbidden' }
    | { readonly kind: 'plan'; readonly facts: InForceFacts; readonly plan: InForcePlan }
    | null
  > {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [reached] = await tx
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.tenantId, tenantId),
            eq(project.id, projectId),
            projectScopeWhere(reader.scope, reader.actorId),
          ),
        );
      if (reached === undefined) return null;
      const facts = await inForceFactsOf(tx, tenantId, projectId, version);
      if (facts === null || facts.asked === null) return null;
      if (!mayPutVersionInForce(reader.actorId, facts)) return { kind: 'forbidden' };
      return {
        kind: 'plan',
        facts,
        plan: await inForcePlanOf(tx, tenantId, projectId, facts.asked),
      };
    });
  }
}
