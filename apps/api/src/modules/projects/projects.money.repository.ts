import {
  type DbTransaction,
  projectPayment,
  projectStageTransition,
  projectTranche,
  trancheRequestShare,
  userAccount,
} from '@heliogrid/db';
import { dueSinceOf, type ProjectStage, type StageArrival } from '@heliogrid/domain';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { memberNameOf } from '../crm/crm.public';

/*
 * The facts a project's money is read from (`M11-10`): its parts, what the ledger holds against
 * each, who last shared each part's request, and the stage history that says when each fell due.
 * Nothing here works out a figure — `internal/money.ts` does, on the server.
 */

export interface PartFacts {
  readonly id: string;
  readonly projectId: string;
  readonly position: number;
  readonly label: string;
  readonly shareBasisPoints: number;
  readonly amountMinor: number;
  readonly dueOnStage: ProjectStage;
  readonly waived: {
    readonly by: { readonly userId: string; readonly name: string };
    readonly at: Date;
    readonly reason: string;
  } | null;
  /** Payments less reversals against this part, in minor units. */
  readonly receivedMinor: number;
  readonly lastShared: { readonly by: { userId: string; name: string }; readonly at: Date } | null;
  /** The instant it fell due, or null while it is not due. */
  readonly dueSince: number | null;
}

/** Each project's parts, oldest position first; a project with no schedule has none. */
export async function partFactsOf(
  tx: DbTransaction,
  tenantId: string,
  projectIds: readonly string[],
): Promise<ReadonlyMap<string, readonly PartFacts[]>> {
  const byProject = new Map<string, PartFacts[]>();
  if (projectIds.length === 0) return byProject;
  const ids = [...projectIds];
  const waiver = alias(userAccount, 'waiver');
  const [parts, received, shares, arrivals] = await Promise.all([
    tx
      .select({
        id: projectTranche.id,
        projectId: projectTranche.projectId,
        position: projectTranche.position,
        label: projectTranche.label,
        share: projectTranche.shareBasisPoints,
        amount: projectTranche.amountMinor,
        dueOnStage: projectTranche.dueOnStage,
        waivedAt: projectTranche.waivedAt,
        waivedBy: projectTranche.waivedBy,
        waivedByName: memberNameOf(waiver),
        waiveReason: projectTranche.waiveReason,
      })
      .from(projectTranche)
      .leftJoin(waiver, eq(waiver.id, projectTranche.waivedBy))
      .where(and(eq(projectTranche.tenantId, tenantId), inArray(projectTranche.projectId, ids)))
      .orderBy(asc(projectTranche.projectId), asc(projectTranche.position)),
    tx
      .select({
        trancheId: projectPayment.trancheId,
        received: sql<string>`sum(${projectPayment.amountMinor})`,
        paid: sql<boolean>`bool_or(${projectPayment.kind} = 'payment')`,
      })
      .from(projectPayment)
      .where(and(eq(projectPayment.tenantId, tenantId), inArray(projectPayment.projectId, ids)))
      .groupBy(projectPayment.trancheId),
    tx
      .selectDistinctOn([trancheRequestShare.trancheId], {
        trancheId: trancheRequestShare.trancheId,
        at: trancheRequestShare.sharedAt,
        by: trancheRequestShare.sharedBy,
        name: memberNameOf(userAccount),
      })
      .from(trancheRequestShare)
      .innerJoin(projectTranche, eq(projectTranche.id, trancheRequestShare.trancheId))
      .leftJoin(userAccount, eq(userAccount.id, trancheRequestShare.sharedBy))
      .where(
        and(
          eq(trancheRequestShare.tenantId, tenantId),
          eq(projectTranche.tenantId, tenantId),
          inArray(projectTranche.projectId, ids),
        ),
      )
      .orderBy(trancheRequestShare.trancheId, desc(trancheRequestShare.sharedAt)),
    tx
      .select({
        projectId: projectStageTransition.projectId,
        to: projectStageTransition.toStage,
        at: projectStageTransition.movedAt,
      })
      .from(projectStageTransition)
      .where(
        and(
          eq(projectStageTransition.tenantId, tenantId),
          inArray(projectStageTransition.projectId, ids),
        ),
      )
      .orderBy(asc(projectStageTransition.movedAt), asc(projectStageTransition.id)),
  ]);
  const receivedOf = new Map(received.map((row) => [row.trancheId, row]));
  const shareOf = new Map(shares.map((row) => [row.trancheId, row]));
  const arrivalsOf = new Map<string, StageArrival[]>();
  for (const arrival of arrivals) {
    const list = arrivalsOf.get(arrival.projectId) ?? [];
    list.push({ to: arrival.to, at: arrival.at.getTime() });
    arrivalsOf.set(arrival.projectId, list);
  }
  for (const part of parts) {
    const facts = factsOfPart(
      part,
      receivedOf.get(part.id),
      shareOf.get(part.id),
      arrivalsOf.get(part.projectId) ?? [],
    );
    const list = byProject.get(part.projectId) ?? [];
    list.push(facts);
    byProject.set(part.projectId, list);
  }
  return byProject;
}

interface PartRow {
  readonly id: string;
  readonly projectId: string;
  readonly position: number;
  readonly label: string;
  readonly share: number;
  readonly amount: number;
  readonly dueOnStage: ProjectStage;
  readonly waivedAt: Date | null;
  readonly waivedBy: string | null;
  readonly waivedByName: string | null;
  readonly waiveReason: string | null;
}

/** One part's facts: its ledger total, its last share, and when its stage made it due. */
function factsOfPart(
  part: PartRow,
  ledger: { readonly received: string; readonly paid: boolean } | undefined,
  share: { readonly at: Date; readonly by: string; readonly name: string | null } | undefined,
  arrivals: readonly StageArrival[],
): PartFacts {
  const held = share !== undefined || ledger?.paid === true;
  return {
    id: part.id,
    projectId: part.projectId,
    position: part.position,
    label: part.label,
    shareBasisPoints: part.share,
    amountMinor: part.amount,
    dueOnStage: part.dueOnStage,
    waived:
      part.waivedAt === null || part.waivedBy === null || part.waiveReason === null
        ? null
        : {
            by: { userId: part.waivedBy, name: part.waivedByName ?? '' },
            at: part.waivedAt,
            reason: part.waiveReason,
          },
    receivedMinor: Number(ledger?.received ?? 0),
    lastShared:
      share === undefined
        ? null
        : { by: { userId: share.by, name: share.name ?? '' }, at: share.at },
    dueSince: part.dueOnStage === 'cancelled' ? null : dueSinceOf(part.dueOnStage, arrivals, held),
  };
}
