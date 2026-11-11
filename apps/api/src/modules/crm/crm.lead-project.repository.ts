import type { LeadDetail } from '@heliogrid/contracts';
import { type DbTransaction, project } from '@heliogrid/db';
import { projectNumberOf } from '@heliogrid/domain/server';
import { and, eq } from 'drizzle-orm';

/** The project a won lead became — one per lead (`project_tenant_lead_key`); null before the win. */
export async function projectOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<LeadDetail['project']> {
  const [won] = await tx
    .select({ id: project.id, number: project.number })
    .from(project)
    .where(and(eq(project.tenantId, tenantId), eq(project.leadId, leadId)));
  return won === undefined ? null : { id: won.id, number: projectNumberOf(won.number) };
}
