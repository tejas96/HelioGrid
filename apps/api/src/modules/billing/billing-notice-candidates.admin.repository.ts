import { type Db, dunningEvent, subscription, tenant } from '@heliogrid/db';
import { MS_PER_DAY, TRIAL_NUDGE_LEAD_DAYS } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNotNull, lte, notExists, type SQL, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** A subscription whose ladder the sweep looks at, and the company it belongs to. */
export interface NoticeCandidate {
  readonly subscriptionId: string;
  readonly tenantId: string;
  readonly marketCode: string;
}

/**
 * Which ladders the notice sweep looks at (`M12-39`, `M12-42`). It crosses every company, so it
 * rides the admin pool; each read is bounded and walks an index — the ladders' next look by the
 * partial index on `next_due_at`, a ladder's first notice by the subscription's state.
 */
@Injectable()
export class BillingNoticeCandidatesAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * The ladders to look at now: those whose next look has come, then those with no notice yet —
   * a `past_due` row not told since it entered the state, a trial within its first nudge's lead.
   */
  async candidates(now: number, limit: number): Promise<NoticeCandidate[]> {
    const at = new Date(now);
    const looking = await this.db
      .selectDistinct(CANDIDATE)
      .from(dunningEvent)
      .innerJoin(subscription, eq(subscription.id, dunningEvent.subscriptionId))
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(and(isNotNull(dunningEvent.nextDueAt), lte(dunningEvent.nextDueAt, at)))
      .limit(limit);
    const failing = await this.db
      .select(CANDIDATE)
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(
        and(
          eq(subscription.state, 'past_due'),
          lte(subscription.stateEnteredAt, at),
          this.untoldSince(sql`${subscription.stateEnteredAt}`),
        ),
      )
      .orderBy(asc(subscription.stateEnteredAt), asc(subscription.id))
      .limit(limit);
    const trials = await this.db
      .select(CANDIDATE)
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(
        and(
          eq(subscription.state, 'trialing'),
          lte(subscription.trialEndsAt, new Date(now + TRIAL_NUDGE_LEAD_DAYS * MS_PER_DAY)),
          this.untoldSince(
            sql`${subscription.trialEndsAt} - make_interval(days => ${TRIAL_NUDGE_LEAD_DAYS})`,
          ),
        ),
      )
      .orderBy(asc(subscription.trialEndsAt), asc(subscription.id))
      .limit(limit);
    const seen = new Set<string>();
    return [...looking, ...failing, ...trials]
      .filter((row) => {
        if (seen.has(row.subscriptionId)) return false;
        seen.add(row.subscriptionId);
        return true;
      })
      .slice(0, limit);
  }

  /** The subscription holds no notice due at or after this moment. */
  private untoldSince(since: SQL): SQL {
    return notExists(
      this.db
        .select({ id: dunningEvent.id })
        .from(dunningEvent)
        .where(
          and(
            eq(dunningEvent.tenantId, subscription.tenantId),
            eq(dunningEvent.subscriptionId, subscription.id),
            gte(dunningEvent.dueAt, since),
          ),
        ),
    );
  }
}

const CANDIDATE = {
  subscriptionId: subscription.id,
  tenantId: subscription.tenantId,
  marketCode: tenant.marketCode,
};
