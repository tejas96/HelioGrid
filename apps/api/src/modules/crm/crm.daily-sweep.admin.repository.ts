import { crmDailySweep, type Db, tenant } from '@heliogrid/db';
import { CRM_WAKE_TIME, clockTimeHhmm } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notExists, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * The companies the CRM's 09:00 sweep owes a run (`M02-49`), on the ADMIN pool: the
 * one read that crosses companies, naming each by id alone. Every lead it touches is touched in that
 * company's own transaction on the runtime pool (`crm.daily-sweep.repository.ts`).
 */
@Injectable()
export class CrmDailySweepAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Companies whose clock reads 09:00 or later and that hold no sweep for that day, at most
   * `limit`: each claims its day as it runs, so the next run takes the rest.
   */
  async dueTenants(now: number, limit: number): Promise<string[]> {
    // ISO text: a `Date` bound into raw SQL is sent as its locale string, which Postgres refuses.
    const localNow = sql`(${new Date(now).toISOString()}::timestamptz at time zone ${tenant.timezone})`;
    const rows = await this.db
      .select({ id: tenant.id })
      .from(tenant)
      .where(
        and(
          sql`${localNow}::time >= ${clockTimeHhmm(CRM_WAKE_TIME)}::time`,
          notExists(
            this.db
              .select({ tenantId: crmDailySweep.tenantId })
              .from(crmDailySweep)
              .where(
                and(
                  eq(crmDailySweep.tenantId, tenant.id),
                  sql`${crmDailySweep.localDate} = ${localNow}::date`,
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
