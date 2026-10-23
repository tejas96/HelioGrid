import { type TenantPool, type TenantScopedDb, tenantMembership, userAccount } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** My own membership as the shell and the role card read it. */
export interface MyMembershipRow {
  readonly coachMarksDismissed: number;
  /** Who last set my roles; null for the founder (`SCR-M01-10` ruling 15). */
  readonly rolesSetByName: string | null;
}

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

  /**
   * The first-run coach marks the person has passed here (`M01-16`) and who last set their roles;
   * null when they hold no membership. The setter is a member of this company, so the
   * membership-armed `user_account` policy lets the tenant read their name.
   */
  async read(tenantId: string, userId: string): Promise<MyMembershipRow | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          coachMarksDismissed: tenantMembership.coachMarksDismissed,
          rolesSetByName: userAccount.name,
        })
        .from(tenantMembership)
        .leftJoin(userAccount, eq(userAccount.id, tenantMembership.rolesSetByUserId))
        .where(ownMembership(tenantId, userId))
        .limit(1);
      return row ?? null;
    });
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
