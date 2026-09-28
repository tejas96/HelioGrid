import { type TenantPool, type TenantScopedDb, tenantMembership } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** How a coach-mark write ended: the count now stored, or why nothing moved. */
export type CoachMarksOutcome =
  | { readonly outcome: 'done' | 'lower'; readonly count: number }
  | { readonly outcome: 'not-found' };

/**
 * The caller's OWN membership row, inside the tenant transaction and found by its unique key —
 * the company the session acts under and the person it belongs to. No id arrives from the wire,
 * so no caller can name another person's row.
 */
@Injectable()
export class MyMembershipRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** How many first-run coach marks the person has passed here (`M01-16`); null when they hold no membership. */
  async coachMarksPassed(tenantId: string, userId: string): Promise<number | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => coachMarksOf(tx, tenantId, userId));
  }

  /**
   * Raises the count to `count` in ONE conditional statement, so two devices or two taps can
   * never move it down: a write that waited on another judges the row as that one left it. A
   * count below the stored one changes nothing and says so.
   */
  async passCoachMarks(
    tenantId: string,
    userId: string,
    count: number,
  ): Promise<CoachMarksOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [raised] = await tx
        .update(tenantMembership)
        .set({ coachMarksDismissed: count })
        .where(
          and(ownMembership(tenantId, userId), lte(tenantMembership.coachMarksDismissed, count)),
        )
        .returning({ count: tenantMembership.coachMarksDismissed });
      if (raised) return { outcome: 'done', count: raised.count };
      const stored = await coachMarksOf(tx, tenantId, userId);
      return stored === null ? { outcome: 'not-found' } : { outcome: 'lower', count: stored };
    });
  }
}

function ownMembership(tenantId: string, userId: string) {
  return and(eq(tenantMembership.tenantId, tenantId), eq(tenantMembership.userAccountId, userId));
}

async function coachMarksOf(
  tx: TenantScopedDb,
  tenantId: string,
  userId: string,
): Promise<number | null> {
  const [row] = await tx
    .select({ count: tenantMembership.coachMarksDismissed })
    .from(tenantMembership)
    .where(ownMembership(tenantId, userId))
    .limit(1);
  return row?.count ?? null;
}
