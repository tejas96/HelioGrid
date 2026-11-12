import type { ProjectMoneyGlance } from '@heliogrid/contracts';
import { type DbTransaction, project } from '@heliogrid/db';
import { moneyScopeOf } from '@heliogrid/domain';
import { and, eq, inArray } from 'drizzle-orm';
import { glanceOf, type MoneyFormat, stoodPartsOf } from './internal/money';
import type { ProjectReader } from './internal/reader';
import { partFactsOf } from './projects.money.repository';
import { projectScopeWhere } from './projects.scope.repository';

/**
 * Each project's money at a glance (`M11-43`, `M11-53`) — the board's money reason and the
 * project's Money card — for the projects whose money the reader may see; a project they reach
 * only as crew is absent (`M11-56`). A project with no schedule reads all zero (`M11-15`).
 */
export async function moneyGlancesOf(
  tx: DbTransaction,
  reader: ProjectReader,
  projectIds: readonly string[],
  format: MoneyFormat,
): Promise<ReadonlyMap<string, ProjectMoneyGlance>> {
  const glances = new Map<string, ProjectMoneyGlance>();
  if (projectIds.length === 0) return glances;
  const visible = await tx
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.tenantId, reader.tenantId),
        inArray(project.id, [...projectIds]),
        projectScopeWhere(moneyScopeOf(reader.scope), reader.actorId),
      ),
    );
  const ids = visible.map((row) => row.id);
  const facts = await partFactsOf(tx, reader.tenantId, ids);
  for (const id of ids) glances.set(id, glanceOf(stoodPartsOf(facts.get(id) ?? []), format));
  return glances;
}

/** One project's money at a glance, or null when the reader may not see its money. */
export async function moneyGlanceOf(
  tx: DbTransaction,
  reader: ProjectReader,
  projectId: string,
  format: MoneyFormat,
): Promise<ProjectMoneyGlance | null> {
  return (await moneyGlancesOf(tx, reader, [projectId], format)).get(projectId) ?? null;
}
