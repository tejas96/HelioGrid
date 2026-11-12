import { type DbTransaction, projectDocument, projectInstallStep } from '@heliogrid/db';
import { checklistForDeal, type MarketPack } from '@heliogrid/domain';

/** The checklist and the install steps, seeded ONCE from the pack in force (`M08-05`). */
export async function seed(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  pack: MarketPack,
  segment: 'residential' | 'commercial',
  now: Date,
): Promise<void> {
  const rows = checklistForDeal(pack.formats.documentChecklist, pack.subsidy, segment);
  if (rows.length > 0) {
    await tx.insert(projectDocument).values(
      rows.map((row, position) => ({
        tenantId,
        projectId,
        rowKey: row.row,
        position,
        state: 'pending' as const,
        changedAt: now,
      })),
    );
  }
  const steps = pack.formats.installSteps;
  if (steps.length > 0) {
    await tx
      .insert(projectInstallStep)
      .values(
        steps.map((step, position) => ({ tenantId, projectId, stepKey: step.step, position })),
      );
  }
}
