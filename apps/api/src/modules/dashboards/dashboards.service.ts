import {
  type OwnerDashboard,
  type SetTarget,
  TARGET_MONTH_NOT_CURRENT,
} from '@heliogrid/contracts';
import {
  basisPointsToPercent,
  daysFrom,
  type FormatPack,
  type LeadStage,
  localDate,
  MS_PER_DAY,
  minorUnits,
  type OpenProposalValue,
  type ProvenanceTier,
  WIN_RATE_WINDOW_DAYS,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, pipelineForecast, sumMinorUnits } from '@heliogrid/domain/server';
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
 * The tier the forecast carries (`F8-01`, `F8-04`): a sum is as weak as its weakest member, and
 * every payable of a proposal built with no design behind it is a typed figure — `assumed`
 * (`F8-21`). It rises only when a designed proposal's derived payable can stand behind it.
 */
const FORECAST_TIER: ProvenanceTier = 'assumed';

/**
 * The weighted pipeline (`M13-03`): domain's `pipelineForecast` at the market's own likelihoods —
 * a projection, expected and not promised, built from open proposals alone, so it can never be in
 * a total with Won. `null` where the market gives no likelihood at all.
 */
function forecastOf(
  formats: FormatPack,
  open: readonly OpenProposalValue[],
  decimal: (amount: number) => string,
): NonNullable<OwnerDashboard['forecast']> | null {
  if (formats.proposal === null) return null;
  const weighed = pipelineForecast(formats.proposal, formats.minorUnitDigits, open);
  return {
    expected: decimal(weighed.expected),
    tier: FORECAST_TIER,
    count: weighed.count,
    stages: weighed.stages.map((row) => ({
      stage: row.stage,
      count: row.count,
      total: decimal(row.total),
      likelihoodPercent: basisPointsToPercent(row.likelihood),
      expected: decimal(row.expected),
    })),
  };
}

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
    /** What a stage's open proposals are worth; `null` for a stage no proposal prices (`M13-14`). */
    const stageValue = (stage: LeadStage) => {
      const priced = facts.openByStage.filter((one) => one.stage === stage);
      return priced.length === 0
        ? null
        : decimal(sumMinorUnits(priced.map((one) => minorUnits(one.payableMinor))));
    };
    const forecast = forecastOf(pack.formats, facts.openProposals, decimal);
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
          leadIds: facts.unassigned.leadIds,
          suggested: facts.unassigned.suggested,
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
        proposalsUnopened: {
          count: facts.proposalsUnopened.count,
          oldest:
            facts.proposalsUnopened.oldest === null
              ? null
              : {
                  proposalId: facts.proposalsUnopened.oldest.proposalId,
                  name: facts.proposalsUnopened.oldest.name,
                  days: daysSince(facts.proposalsUnopened.oldest.sharedAt),
                },
        },
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
      pipeline: facts.pipeline.map((row) => ({ ...row, value: stageValue(row.stage) })),
      ...(forecast === null ? {} : { forecast }),
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
