import { type Db, monthlySummary, tenant } from '@heliogrid/db';
import { clockTimeHhmm } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notExists, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { SUMMARY_TIME } from './internal/clock';

/**
 * The companies owed their monthly summary (`M13-21`), on the ADMIN pool: the one read that
 * crosses companies, naming each by id alone. Each summary is written in that company's own
 * transaction on the runtime pool (`dashboards.summary.repository.ts`).
 */
@Injectable()
export class DashboardsSummaryAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Companies whose clock reads the first of a month at 09:00 or later and that hold no summary of
   * the month just ended, at most `limit`: each claims its month as it is written.
   */
  async dueTenants(now: number, limit: number): Promise<string[]> {
    // ISO text: a `Date` bound into raw SQL is sent as its locale string, which Postgres refuses.
    const localNow = sql`(${new Date(now).toISOString()}::timestamptz at time zone ${tenant.timezone})`;
    const rows = await this.db
      .select({ id: tenant.id })
      .from(tenant)
      .where(
        and(
          sql`extract(day from ${localNow}) = 1`,
          sql`${localNow}::time >= ${clockTimeHhmm(SUMMARY_TIME)}::time`,
          notExists(
            this.db
              .select({ tenantId: monthlySummary.tenantId })
              .from(monthlySummary)
              .where(
                and(
                  eq(monthlySummary.tenantId, tenant.id),
                  sql`${monthlySummary.month} = (date_trunc('month', ${localNow}) - interval '1 month')::date`,
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(tenant.id))
      .limit(limit);
    return rows.map((row) => row.id);
  }
}
