import { type DbTransaction, design } from '@heliogrid/db';
import { and, count, eq } from 'drizzle-orm';

/**
 * How many designs a lead holds — the lead page's count beside its Designs section. The designs
 * themselves are the studio module's to read and write; the lead page only counts them.
 */
export async function designCountOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<number> {
  const [row] = await tx
    .select({ designs: count() })
    .from(design)
    .where(and(eq(design.tenantId, tenantId), eq(design.leadId, leadId)));
  return row?.designs ?? 0;
}
