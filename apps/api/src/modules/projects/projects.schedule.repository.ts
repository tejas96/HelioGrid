import {
  type DbTransaction,
  projectTranche,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import { basisPoints, isTrancheDueStage, type MinorUnits } from '@heliogrid/domain';
import { splitSchedule } from '@heliogrid/domain/server';
import { and, asc, eq } from 'drizzle-orm';

/**
 * A project's schedule, made ONCE at Mark won (ruling 2026-11-10): the final value split by the
 * company's default payment terms, inside the transaction that creates the project, so a project
 * never stands without the parts its terms promised. A company with no default terms gets no
 * parts, and the payments screen says so (`M11-15`). When proposals land, the accepted version's
 * terms make the schedule instead (`M11-09`).
 */
export async function startSchedule(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  payable: MinorUnits,
  now: Date,
): Promise<void> {
  const lines = await tx
    .select({
      label: trancheTemplateLine.label,
      share: trancheTemplateLine.shareBasisPoints,
      dueOnStage: trancheTemplateLine.dueOnStage,
    })
    .from(trancheTemplateLine)
    .innerJoin(
      trancheTemplate,
      and(
        eq(trancheTemplate.id, trancheTemplateLine.trancheTemplateId),
        eq(trancheTemplate.tenantId, tenantId),
      ),
    )
    .where(
      and(
        eq(trancheTemplateLine.tenantId, tenantId),
        eq(trancheTemplate.isDefault, true),
        eq(trancheTemplate.archived, false),
      ),
    )
    .orderBy(asc(trancheTemplateLine.position));
  if (lines.length === 0) return;
  const parts = splitSchedule(
    payable,
    lines.map((line) => ({
      label: line.label,
      share: basisPoints(line.share),
      // A line saved before its stage was checked falls due at Won, never strands its money.
      dueOnStage: isTrancheDueStage(line.dueOnStage) ? line.dueOnStage : 'won',
    })),
  );
  await tx.insert(projectTranche).values(
    parts.map((part, index) => ({
      tenantId,
      projectId,
      position: index + 1,
      label: part.label,
      shareBasisPoints: part.share,
      amountMinor: part.amount,
      dueOnStage: part.dueOnStage,
      source: 'payment_terms' as const,
      createdAt: now,
    })),
  );
}
