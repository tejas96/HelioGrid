import {
  type Db,
  membershipRole,
  tenant,
  tenantMembership,
  userAccount,
  withTenantTransaction,
} from '@heliogrid/db';
import {
  acceptsAdministration,
  keepsControl,
  type MembershipStatus,
  type RolePreset,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';
import { type TenantRow, tenantColumns } from './tenant.admin.repository';

export interface MemberRow {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: MembershipStatus;
  readonly lastActiveAt: Date | null;
}

/**
 * How a guarded transition ended (`F2-19`, `F2-20`): the row as it now stands, or the one reason
 * it was refused — no such person in this company, a person who is not active, or a change that
 * would leave the company without its last EPC Owner.
 */
export type TransitionOutcome =
  | { readonly outcome: 'done'; readonly member: MemberRow }
  | { readonly outcome: 'not-found' | 'not-active' | 'last-owner' };

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The tenant-facing reads and the tenant-scoped writes, on the runtime pool inside the tenant
 * transaction: the tenant's own row through its policy, the roster through the membership
 * policy — which is also what lets `user_account` rows show for members and nobody else — and
 * the two guarded transitions of role administration.
 */
@Injectable()
export class TenantRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  async me(tenantId: string): Promise<TenantRow | null> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .select(tenantColumns())
        .from(tenant)
        .where(eq(tenant.id, tenantId))
        .limit(1);
      return row ?? null;
    });
  }

  /** The roster page, most recently active first; the count runs over the SAME where. */
  async members(
    tenantId: string,
    page: { limit: number; offset: number },
  ): Promise<{ items: MemberRow[]; totalCount: number }> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const where = eq(tenantMembership.tenantId, tenantId);
      const rows = await memberQuery(tx)
        .where(where)
        .orderBy(sql`${tenantMembership.lastActiveAt} desc nulls last`, desc(tenantMembership.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(tenantMembership).where(where);
      return { items: await withRoles(tx, tenantId, rows), totalCount: total?.n ?? 0 };
    });
  }

  /**
   * Replaces the presets one person holds — the whole set, old → new (`M01-20`) — provided the
   * company still keeps control afterwards (`F2-19`).
   */
  async assignRoles(
    tenantId: string,
    membershipId: string,
    roles: readonly RolePreset[],
  ): Promise<TransitionOutcome> {
    return this.transition(tenantId, membershipId, async (tx, othersHold) => {
      if (!keepsControl([...othersHold, ...roles])) return 'last-owner';
      await tx
        .delete(membershipRole)
        .where(
          and(eq(membershipRole.tenantId, tenantId), eq(membershipRole.membershipId, membershipId)),
        );
      // The wire carries a list; the table holds a SET (one row per preset), so a repeated
      // preset is written once rather than tripping the unique key.
      await tx
        .insert(membershipRole)
        .values([...new Set(roles)].map((rolePreset) => ({ tenantId, membershipId, rolePreset })));
      await tx
        .update(tenantMembership)
        .set({ authorizationVersion: nextAuthorizationVersion() })
        .where(and(eq(tenantMembership.tenantId, tenantId), eq(tenantMembership.id, membershipId)));
      return 'done';
    });
  }

  /** Ends a person's access — deactivated, never deleted (`F2-20`) — under the same guard. */
  async deactivate(tenantId: string, membershipId: string): Promise<TransitionOutcome> {
    return this.transition(tenantId, membershipId, async (tx, othersHold) => {
      if (!keepsControl(othersHold)) return 'last-owner';
      await tx
        .update(tenantMembership)
        .set({ status: 'deactivated', authorizationVersion: nextAuthorizationVersion() })
        .where(and(eq(tenantMembership.tenantId, tenantId), eq(tenantMembership.id, membershipId)));
      return 'done';
    });
  }

  /**
   * One guarded transition, in ONE transaction: the tenant lock, the subject's standing, every
   * preset the OTHER active members hold, the change, and the row as it now stands. The lock
   * serialises role administration per tenant, so two concurrent removals cannot each see the
   * other owner and both pass. Its key is a hash, so two tenants can share one — which costs
   * one administrator a wait and can never cost a wrong answer.
   */
  private async transition(
    tenantId: string,
    membershipId: string,
    change: (tx: Tx, othersHold: readonly RolePreset[]) => Promise<'done' | 'last-owner'>,
  ): Promise<TransitionOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const subjectWhere = and(
        eq(tenantMembership.tenantId, tenantId),
        eq(tenantMembership.id, membershipId),
      );
      const [subject] = await tx
        .select({ status: tenantMembership.status })
        .from(tenantMembership)
        .where(subjectWhere)
        .limit(1);
      if (!subject) return { outcome: 'not-found' };
      if (!acceptsAdministration(subject.status)) return { outcome: 'not-active' };
      const othersHold = await tx
        .select({ rolePreset: membershipRole.rolePreset })
        .from(membershipRole)
        .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
        .where(
          and(
            eq(membershipRole.tenantId, tenantId),
            eq(tenantMembership.status, 'active'),
            ne(tenantMembership.id, membershipId),
          ),
        );
      const outcome = await change(
        tx,
        othersHold.map((row) => row.rolePreset),
      );
      if (outcome === 'last-owner') return { outcome };
      const [member] = await withRoles(tx, tenantId, await memberQuery(tx).where(subjectWhere));
      if (!member) throw new Error('the membership vanished inside its own transaction');
      return { outcome: 'done', member };
    });
  }
}

/** The roster's columns, joined to the account under its own policy. */
function memberQuery(tx: Tx) {
  return tx
    .select({
      membershipId: tenantMembership.id,
      userId: userAccount.id,
      name: userAccount.name,
      phoneE164: userAccount.phoneE164,
      status: tenantMembership.status,
      lastActiveAt: tenantMembership.lastActiveAt,
    })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId));
}

/** Every preset each row's membership holds, in one read over the membership index. */
async function withRoles(
  tx: Tx,
  tenantId: string,
  rows: readonly Omit<MemberRow, 'roles'>[],
): Promise<MemberRow[]> {
  const ids = rows.map((row) => row.membershipId);
  const held =
    ids.length === 0
      ? []
      : await tx
          .select({
            membershipId: membershipRole.membershipId,
            rolePreset: membershipRole.rolePreset,
          })
          .from(membershipRole)
          .where(
            and(eq(membershipRole.tenantId, tenantId), inArray(membershipRole.membershipId, ids)),
          )
          // The enum's declaration order IS the matrix order (`F2-25`), so chips render as F2 lists them.
          .orderBy(membershipRole.rolePreset);
  return rows.map((row) => ({
    ...row,
    roles: held.filter((r) => r.membershipId === row.membershipId).map((r) => r.rolePreset),
  }));
}

/**
 * Every change to what a person may do moves the version on, so a token minted before it is
 * refused at its next request (`admit`, `F2-17`) — compared, never trusted for its remaining life.
 */
function nextAuthorizationVersion() {
  return sql`${tenantMembership.authorizationVersion} + 1`;
}
