import { type DbTransaction, projectTranche, proposalVersion, userAccount } from '@heliogrid/db';
import type { ProjectStage } from '@heliogrid/domain';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { memberNameOf } from '../crm/crm.public';

/*
 * The plans a newer version put in force replaced (`T-M06-025`, `M11-14`): a replaced part keeps
 * its row, so the earlier schedule stays readable. One put-in-force replaces its parts at one
 * moment, so a plan is the parts that left together, under the version they belonged to.
 */

export interface EarlierPlanFacts {
  readonly version: number | null;
  readonly replacedAt: Date;
  readonly replacedBy: { readonly userId: string; readonly name: string } | null;
  readonly parts: readonly {
    readonly id: string;
    readonly label: string;
    readonly amountMinor: number;
    readonly dueOnStage: ProjectStage;
  }[];
}

/** The project's replaced parts, newest replaced first, each plan's parts in their order. */
export async function earlierPlansOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
): Promise<EarlierPlanFacts[]> {
  const rows = await tx
    .select({
      id: projectTranche.id,
      label: projectTranche.label,
      amountMinor: projectTranche.amountMinor,
      dueOnStage: projectTranche.dueOnStage,
      replacedAt: projectTranche.replacedAt,
      replacedBy: projectTranche.replacedBy,
      replacerName: memberNameOf(userAccount),
      version: proposalVersion.version,
    })
    .from(projectTranche)
    .leftJoin(userAccount, eq(userAccount.id, projectTranche.replacedBy))
    .leftJoin(
      proposalVersion,
      and(
        eq(proposalVersion.id, projectTranche.replacedVersionId),
        eq(proposalVersion.tenantId, projectTranche.tenantId),
      ),
    )
    .where(
      and(
        eq(projectTranche.tenantId, tenantId),
        eq(projectTranche.projectId, projectId),
        isNotNull(projectTranche.replacedAt),
      ),
    )
    .orderBy(desc(projectTranche.replacedAt), asc(projectTranche.position), asc(projectTranche.id));
  const plans: EarlierPlanFacts[] = [];
  for (const row of rows) {
    const replacedAt = row.replacedAt ?? new Date(0);
    const last = plans.at(-1);
    const part = {
      id: row.id,
      label: row.label,
      amountMinor: row.amountMinor,
      dueOnStage: row.dueOnStage,
    };
    if (last !== undefined && last.replacedAt.getTime() === replacedAt.getTime()) {
      plans[plans.length - 1] = { ...last, parts: [...last.parts, part] };
      continue;
    }
    plans.push({
      version: row.version,
      replacedAt,
      replacedBy:
        row.replacedBy === null ? null : { userId: row.replacedBy, name: row.replacerName ?? '' },
      parts: [part],
    });
  }
  return plans;
}
