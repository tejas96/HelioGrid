import {
  type OwnerDashboard,
  type SetTarget,
  TARGET_MONTH_NOT_CURRENT,
} from '@heliogrid/contracts';
import {
  daysFrom,
  localDate,
  MS_PER_DAY,
  minorUnits,
  WIN_RATE_WINDOW_DAYS,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { ForbiddenException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { minorUnitsOnField } from '../../common/errors/minor-units-on-field';
import { ProjectsPaymentsService } from '../projects/projects.public';
import { SettingsService } from '../settings/settings.public';
import { DashboardsRepository } from './dashboards.repository';
import { DashboardsTargetRepository } from './dashboards.target.repository';
import { firstDayOf, monthOf } from './internal/clock';
import type { DashboardReader } from './internal/reader';

const HOUR_MS = MS_PER_DAY / 24;

/**
 * The owner dashboard (`SCR-M13-01`, `M13-14`): what needs you, cash, won, the target, the
 * pipeline and win/loss — the company's for the EPC Owner, the team's for a Sales Manager
 * (`M13-07`). Cash is Money due's own figures for the same reader (`M13-16`), so the two screens
 * never disagree; every money figure is worked out here, on the server (`F4-04`).
 */
@Injectable()
export class DashboardsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(DashboardsRepository) private readonly reads: DashboardsRepository,
    @Inject(DashboardsTargetRepository) private readonly targets: DashboardsTargetRepository,
    @Inject(ProjectsPaymentsService) private readonly payments: ProjectsPaymentsService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async owner(reader: DashboardReader, now: number): Promise<OwnerDashboard> {
    const { tenantId } = reader.leads;
    const [pack, { timezone }] = await Promise.all([
      this.settings.packOf(tenantId),
      this.settings.quietHoursOf(tenantId),
    ]);
    const today = localDate(now, timezone);
    const month = monthOf(today);
    // The late group alone, its longest-late part first: the tiles still count every group.
    const due = await this.payments.moneyDue(
      reader.projects,
      { page: 1, limit: 1, group: 'late' },
      now,
    );
    const facts = await this.reads.ownerFacts(reader, { now, timeZone: timezone, month });
    const decimal = (amount: number) =>
      minorUnitsToDecimal(minorUnits(amount), pack.formats.minorUnitDigits);
    const daysSince = (since: Date) => daysFrom(localDate(since.getTime(), timezone), today);
    const won = (period: { count: number; amountMinor: number }) => ({
      count: period.count,
      amount: decimal(period.amountMinor),
    });
    const { medianMinor: median, count: wonInWindow } = facts.wonInWindow;
    const oldestLate = due.rows.items[0];
    const { oldest: blocked } = facts.blockedOnUs;
    return {
      scope: reader.companyWide ? 'company' : 'team',
      today,
      month,
      currencyCode: due.currencyCode,
      needsYou: {
        unassigned: {
          count: facts.unassigned.count,
          oldestHours:
            facts.unassigned.oldest === null
              ? null
              : Math.floor((now - facts.unassigned.oldest.getTime()) / HOUR_MS),
        },
        paymentsLate: {
          count: due.groups.late.count,
          amount: due.groups.late.amount,
          oldestDays: oldestLate === undefined ? null : daysFrom(oldestLate.dueOn, today),
          oldestProjectId: oldestLate?.projectId ?? null,
        },
        blockedOnUs: {
          count: facts.blockedOnUs.count,
          oldest:
            blocked === null
              ? null
              : {
                  projectId: blocked.projectId,
                  name: blocked.name,
                  days: daysFrom(blocked.startedOn, today),
                },
        },
        waitingLongest: facts.waitingLongest.map((one) => ({
          leadId: one.leadId,
          name: one.name,
          stage: one.stage,
          days: daysSince(one.since),
        })),
        myOverdueTasks: facts.myOverdueTasks,
      },
      cash: {
        collectedThisMonth: due.collectedThisMonth,
        collectedLastMonth: decimal(facts.collectedLastMonth),
        toCollect: due.toCollect,
        late: due.groups.late,
      },
      won: {
        thisMonth: won(facts.wonThisMonth),
        lastMonth: won(facts.wonLastMonth),
        median: median === null ? null : { amount: decimal(median), of: wonInWindow },
      },
      target: facts.target === null ? null : { amount: decimal(facts.target) },
      canSetTarget: reader.companyWide,
      pipeline: [...facts.pipeline],
      winLoss: {
        windowDays: WIN_RATE_WINDOW_DAYS,
        won: wonInWindow,
        lost: facts.lostInWindow.reduce((sum, one) => sum + one.count, 0),
        lostReasons: [...facts.lostInWindow],
      },
    };
  }

  /**
   * Sets or clears the company target for the current month (`M13-17`) — the EPC Owner's alone:
   * a team-scoped reader sees the company target and never moves it.
   */
  async setTarget(
    reader: DashboardReader,
    body: SetTarget,
    act: Act,
  ): Promise<{ target: { amount: string } | null }> {
    if (!reader.companyWide) {
      throw new ForbiddenException('Only a company-wide reader sets the company target.');
    }
    const { tenantId } = reader.leads;
    const [pack, { timezone }] = await Promise.all([
      this.settings.packOf(tenantId),
      this.settings.quietHoursOf(tenantId),
    ]);
    if (body.month !== monthOf(localDate(act.now, timezone))) {
      throw new ContractException(
        TARGET_MONTH_NOT_CURRENT,
        'The dashboard sets this month’s target only.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const digits = pack.formats.minorUnitDigits;
    const amount = body.amount === null ? null : minorUnitsOnField(body.amount, digits, 'amount');
    const stored = await this.targets.save(tenantId, firstDayOf(body.month), amount, act);
    return { target: stored === null ? null : { amount: minorUnitsToDecimal(stored, digits) } };
  }
}
