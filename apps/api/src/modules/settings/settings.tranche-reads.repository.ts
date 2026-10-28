import {
  type TenantScopedDb,
  trancheTemplate,
  trancheTemplateLine,
  userAccount,
} from '@heliogrid/db';
import {
  basisPoints,
  isTrancheDueStage,
  type ProjectChainStage,
  type TrancheTemplate,
} from '@heliogrid/domain';
import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { type LastSave, lastSaveOf } from './internal/wire';

/**
 * Every template with its lines in order, oldest first — or one template by id. Two reads
 * over the tenant index, never one per template. `dueOnStage` is stored text validated on the
 * way in, so it reads back as the chain stage it was written as.
 */
export async function trancheTemplatesOf(
  tx: TenantScopedDb,
  tenantId: string,
  onlyId?: string,
): Promise<readonly TrancheTemplate[]> {
  const rows = await tx
    .select({
      id: trancheTemplate.id,
      name: trancheTemplate.name,
      isDefault: trancheTemplate.isDefault,
      archived: trancheTemplate.archived,
      changedAt: trancheTemplate.changedAt,
    })
    .from(trancheTemplate)
    .where(
      onlyId === undefined
        ? eq(trancheTemplate.tenantId, tenantId)
        : and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, onlyId)),
    )
    .orderBy(asc(trancheTemplate.createdAt), asc(trancheTemplate.id));
  const ids = rows.map((row) => row.id);
  const lines =
    ids.length === 0
      ? []
      : await tx
          .select({
            trancheTemplateId: trancheTemplateLine.trancheTemplateId,
            position: trancheTemplateLine.position,
            label: trancheTemplateLine.label,
            shareBasisPoints: trancheTemplateLine.shareBasisPoints,
            dueOnStage: trancheTemplateLine.dueOnStage,
          })
          .from(trancheTemplateLine)
          .where(
            and(
              eq(trancheTemplateLine.tenantId, tenantId),
              inArray(trancheTemplateLine.trancheTemplateId, ids),
            ),
          )
          .orderBy(asc(trancheTemplateLine.position));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    archived: row.archived,
    changed: row.changedAt !== null,
    lines: lines
      .filter((line) => line.trancheTemplateId === row.id)
      .map((line) => ({
        label: line.label,
        share: basisPoints(line.shareBasisPoints),
        dueOnStage: dueStageOf(line.dueOnStage),
      })),
  }));
}

/**
 * The newest create or save across the tenant's templates, and who made it — `null` while only
 * the seeded, untouched splits exist. Archive, restore and make-default never move it. Read
 * inside the tenant's rows, a few dozen at most.
 */
export async function trancheTemplatesLastSave(
  tx: TenantScopedDb,
  tenantId: string,
): Promise<LastSave | null> {
  const [last] = await tx
    .select({
      at: trancheTemplate.changedAt,
      byId: trancheTemplate.changedBy,
      byName: userAccount.name,
    })
    .from(trancheTemplate)
    .leftJoin(userAccount, eq(userAccount.id, trancheTemplate.changedBy))
    .where(and(eq(trancheTemplate.tenantId, tenantId), isNotNull(trancheTemplate.changedAt)))
    .orderBy(desc(trancheTemplate.changedAt), desc(trancheTemplate.id))
    .limit(1);
  return last?.at == null ? null : lastSaveOf({ ...last, at: last.at });
}

/** A stored stage was validated on the way in; a value outside the chain is a corrupted row, said loudly. */
function dueStageOf(stored: string): ProjectChainStage {
  if (!isTrancheDueStage(stored)) throw new Error(`tranche line bound to unknown stage ${stored}`);
  return stored;
}
