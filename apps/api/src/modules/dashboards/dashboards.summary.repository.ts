import { monthlySummary, type TenantPool, tenant } from '@heliogrid/db';
import { type MinorUnits, type UiLanguage, type WinRate, winRateOf } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { collectedIn } from '../projects/projects.public';
import { lostIn, wonIn, wonValuesSince } from './dashboards.figures.repository';
import {
  firstDayOf,
  type Month,
  monthSpan,
  summaryMonthDue,
  windowStartOf,
} from './internal/clock';
import { COMPANY_REPORTS, readsCompanyWide } from './internal/reader';

/** The month just ended, company-wide, as the summary states it (`M13-21`). */
export interface MonthFigures {
  readonly month: Month;
  readonly timeZone: string;
  readonly collectedMinor: number;
  readonly won: { readonly count: number; readonly amountMinor: MinorUnits };
  readonly lostCount: number;
  readonly winRate: WinRate;
}

/** How the summary is worded: rendered per language from its figures, held by quiet hours. */
export interface SummaryWords {
  readonly wordsFor: (figures: MonthFigures) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly quietHours: TenantQuietHours;
}

/** One company's summary run: whether it was written now, and the notices whose pushes follow. */
export interface WrittenSummary {
  readonly written: boolean;
  readonly notified: readonly string[];
}

const NOT_WRITTEN: WrittenSummary = { written: false, notified: [] };

/** Every lead of the company: the summary reads the whole company's figures. */
const EVERY_LEAD = sql`true`;

/**
 * The owner's monthly summary for one company (`M13-21`), in ONE transaction: the month's claim,
 * then its figures and one in-app notice to each company-wide reader. The claim commits with the
 * notices, so a failed run leaves none and runs again; a second run finds it and writes nothing.
 */
@Injectable()
export class DashboardsSummaryRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  summarise(tenantId: string, now: number, words: SummaryWords): Promise<WrittenSummary> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [company] = await tx
        .select({ timeZone: tenant.timezone })
        .from(tenant)
        .where(eq(tenant.id, tenantId));
      if (company === undefined) throw new Error(`no company ${tenantId} to summarise`);
      const month = summaryMonthDue(now, company.timeZone);
      if (month === null) return NOT_WRITTEN;
      const claimed = await tx
        .insert(monthlySummary)
        .values({ tenantId, month: firstDayOf(month), writtenAt: new Date(now) })
        .onConflictDoNothing()
        .returning({ month: monthlySummary.month });
      if (claimed.length === 0) return NOT_WRITTEN;
      const span = monthSpan(month, company.timeZone);
      const windowStart = windowStartOf(now, company.timeZone);
      const lostThen = await lostIn(tx, tenantId, EVERY_LEAD, span);
      const lostInWindow = await lostIn(tx, tenantId, EVERY_LEAD, { from: windowStart });
      const wonInWindow = await wonValuesSince(tx, tenantId, undefined, windowStart);
      const figures: MonthFigures = {
        month,
        timeZone: company.timeZone,
        collectedMinor: await collectedIn(tx, tenantId, undefined, month),
        won: await wonIn(tx, tenantId, undefined, span),
        lostCount: totalOf(lostThen),
        winRate: winRateOf(wonInWindow.length, totalOf(lostInWindow)),
      };
      // The figures are the whole company's, so a team-scoped reader of reports is not told them.
      const recipients = await recipientsFor(
        tx,
        tenantId,
        'monthly_summary',
        { ownerUserId: null, assigneeUserId: null, awaits: COMPANY_REPORTS },
        async (candidate) => readsCompanyWide(candidate.roles),
      );
      const notified = await recordNotificationsTo(
        tx,
        recipients,
        {
          tenantId,
          type: 'monthly_summary',
          subjectKind: 'tenant',
          subjectRef: tenantId,
          emittedAt: new Date(now),
        },
        await words.wordsFor(figures),
        words.quietHours,
      );
      return { written: true, notified };
    });
  }
}

function totalOf(counted: readonly { count: number }[]): number {
  return counted.reduce((sum, one) => sum + one.count, 0);
}
