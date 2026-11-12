import { formatMoney, formatMonthYear, formatNumber, minorUnits } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { monthlySummaryNotice } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  NotificationPushService,
  renderedInEveryLanguageWith,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { DashboardsSummaryAdminRepository } from './dashboards.summary.admin.repository';
import { DashboardsSummaryRepository, type MonthFigures } from './dashboards.summary.repository';
import { monthSpan } from './internal/clock';

/** At most this many companies per run, so one run stays inside its step's timeout. */
const SUMMARY_BATCH = 200;

/** A basis point is a hundredth of a percent. */
const BASIS_POINTS_PER_PERCENT = 100;

/**
 * The owner's monthly summary (`M13-21`): every run writes, for each company whose clock has
 * passed 09:00 on the first of a month, one in-app summary of the month just ended — once per
 * company and month. One company's failure is logged by its id and leaves its month unclaimed, so
 * the next run tries it again and every other company is summarised meanwhile.
 */
@Injectable()
export class DashboardsSummaryService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(DashboardsSummaryAdminRepository)
    private readonly due: DashboardsSummaryAdminRepository,
    @Inject(DashboardsSummaryRepository) private readonly summaries: DashboardsSummaryRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DashboardsSummaryService.name);
  }

  /** The result is the workflow's contract: a running worker reads exactly this count. */
  async summariseDueTenants(now: number): Promise<{ summarised: number }> {
    let summarised = 0;
    for (const tenantId of await this.due.dueTenants(now, SUMMARY_BATCH)) {
      try {
        if (await this.summariseTenant(tenantId, now)) summarised += 1;
      } catch (error) {
        this.logger.warn(
          { tenantId, err: error },
          'a company’s monthly summary failed; it runs again',
        );
      }
    }
    return { summarised };
  }

  /**
   * One company's summary at `now`; `false` when its clock is not past 09:00 on the first, or the
   * month is already summarised. The money reads in the company's market format.
   */
  async summariseTenant(tenantId: string, now: number): Promise<boolean> {
    const [{ formats }, quietHours] = await Promise.all([
      this.settings.packOf(tenantId),
      this.settings.quietHoursOf(tenantId),
    ]);
    const money = (amount: number) =>
      formatMoney(formats, minorUnitsToDecimal(minorUnits(amount), formats.minorUnitDigits));
    const wordsFor = (figures: MonthFigures) => {
      const clock = { ...formats, timeZone: figures.timeZone };
      const monthStart = monthSpan(figures.month, figures.timeZone).from.getTime();
      const { winRate } = figures;
      return renderedInEveryLanguageWith((translate, language) =>
        monthlySummaryNotice(translate, {
          month: formatMonthYear(clock, monthStart, language),
          collected: money(figures.collectedMinor),
          wonCount: figures.won.count,
          wonAmount: money(figures.won.amountMinor),
          lostCount: figures.lostCount,
          rate:
            winRate.kind === 'too_few'
              ? null
              : formatNumber(formats, winRate.basisPoints / BASIS_POINTS_PER_PERCENT, {
                  maximumFractionDigits: 0,
                }),
        }),
      );
    };
    const { written, notified } = await this.summaries.summarise(tenantId, now, {
      wordsFor,
      quietHours,
    });
    await this.push.deliverAfterCommit(tenantId, notified, new Date(now));
    return written;
  }
}
