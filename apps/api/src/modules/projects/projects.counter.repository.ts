import { type DbTransaction, tenantCounter } from '@heliogrid/db';
import type { TenantCounterKind } from '@heliogrid/domain';
import { and, eq, sql } from 'drizzle-orm';

/*
 * A company's own number series (`M08-03`, `M11-41`): projects and receipts are numbered by the
 * server from the company's counter, inside the transaction that makes the record, so two at once
 * take turns and never collide.
 */

/**
 * Holds the company's counter row of `kind` until the transaction ends, so two creates take
 * turns on it — the company's first too: the row is made, at 0, before it is locked.
 */
export async function lockCounter(
  tx: DbTransaction,
  tenantId: string,
  kind: TenantCounterKind,
): Promise<void> {
  await tx.insert(tenantCounter).values({ tenantId, kind, lastNumber: 0 }).onConflictDoNothing();
  await tx
    .select({ lastNumber: tenantCounter.lastNumber })
    .from(tenantCounter)
    .where(and(eq(tenantCounter.tenantId, tenantId), eq(tenantCounter.kind, kind)))
    .for('update');
}

/** The company's next number of `kind`: the counter row created at 1 or bumped. */
export async function nextNumber(
  tx: DbTransaction,
  tenantId: string,
  kind: TenantCounterKind,
): Promise<number> {
  const [next] = await tx
    .insert(tenantCounter)
    .values({ tenantId, kind, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [tenantCounter.tenantId, tenantCounter.kind],
      set: { lastNumber: sql`${tenantCounter.lastNumber} + 1` },
    })
    .returning({ lastNumber: tenantCounter.lastNumber });
  if (next === undefined) throw new Error(`the ${kind} counter returned no number`);
  return next.lastNumber;
}
