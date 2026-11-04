import type {
  BillingUsage,
  BillingUsageEvents,
  BillingUsageEventsQuery,
  BillingUsageSignals,
} from '@heliogrid/contracts';
import {
  type BillingStandingFacts,
  billedQuantityOf,
  bundleUsageStep,
  CAP_HELD_STEPS,
  cappedUsageStep,
  type EntitlementKey,
  type MarketPack,
  overageBillsOn,
  storageUsageStep,
  type TierLimit,
  UnbillableMeter,
  type UsageStep,
} from '@heliogrid/domain';
import { overageAddOns, sumMinorUnits } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { BillingHomeRepository } from './billing-home.repository';
import { BillingHomeService, standingWire } from './billing-home.service';
import { EntitlementService } from './entitlement.service';
import { decimalOf } from './internal/billing-sale';
import { cycleEnd } from './internal/cycle-end';
import { planIncludesOf } from './internal/plan-includes';
import { type UsageCycle, usageCycleOf } from './internal/usage-window';
import type { UsageWindow } from './usage.repository';
import { UsageService } from './usage.service';

const iso = (moment: Date | number) => new Date(moment).toISOString();

/** Ledger seconds in one billed voice minute — the unit `billedQuantityOf` turns the total by. */
const SECONDS_PER_MINUTE = 60;

/**
 * No proposal or project exists before `M06` and `M08` land (Law 9), so none is counted: zero is
 * the truth today. Each module's task replaces this with its own count and the `fullSince` its
 * gate reads (`T-M06`, `T-M08`, *Usage screen (T-M12-004)*).
 */
const NOT_COUNTED_YET = 0;

/** The steps a person who is not the Owner may see, by name only (`M12-56`). */
const SIGNALLED: ReadonlySet<string> = new Set(CAP_HELD_STEPS);

/**
 * The usage screen (`SCR-M12-04`): this cycle's rollups against the company's limits, read by the
 * same queries the gates and the invoice read (`M12-34`) — `billedRollupOf`, the storage gauge and
 * `EntitlementService.limitsOf` — and extra charges worked out by `overageAddOns`, the function
 * the overage sweep bills by (`M12-35`), so the screen and the next invoice cannot differ.
 */
@Injectable()
export class BillingUsageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingHomeService) private readonly home: BillingHomeService,
    @Inject(BillingHomeRepository) private readonly rows: BillingHomeRepository,
    @Inject(UsageService) private readonly usage: UsageService,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
  ) {}

  async usageOf(tenantId: string, now: number): Promise<BillingUsage> {
    const { row, facts, pack, publishedAt } = await this.home.readStanding(tenantId, now);
    const cycle = await usageCycleOf(this.rows, tenantId, row, now);
    const window = soFarOf(cycle, now);
    const limits = await this.limitsOf(tenantId);
    const voice = await this.voiceOf(tenantId, { pack, facts, limits, window, cycle }, now);
    const gauge = await this.usage.latestStorageGauge(tenantId);
    const storageLimit = limits.get('storage_gb') ?? null;
    const otp = await this.usage.costRollupOf(tenantId, ['otp_delivery'], window);
    return {
      standing: standingWire(facts),
      currencyCode: pack.formats.currency,
      priceListPublishedAt: publishedAt,
      cycle: { from: iso(cycle.from), resetsAt: iso(cycle.resetsAt) },
      proposals: counted(limits.get('proposals_per_cycle') ?? null, cycle, now),
      activeProjects: counted(limits.get('active_projects') ?? null, cycle, now),
      designCeilingKw: limits.get('design_ceiling_kw') ?? null,
      voice: voice.wire,
      storage: {
        usedBytes: gauge?.gaugeBytes ?? null,
        takenAt: gauge === null ? null : iso(gauge.takenAt),
        limitGb: storageLimit,
        usage: wireStep(storageUsageStep(gauge?.gaugeBytes ?? 0, storageLimit ?? 'unlimited')),
      },
      otpCodes: otp.get('otp_delivery') ?? 0,
      extraCharges: extraChargesWire(pack, facts, voice.extra),
    };
  }

  /**
   * Voice minutes this cycle: the billed minutes, the book's rate, what they owe so far — `null`
   * on a trial, which pays nothing (`M12-52`) — and where they stand: a trial's cap climbs the cap
   * ladder, a plan's bundle charges past itself.
   */
  private async voiceOf(
    tenantId: string,
    held: {
      readonly pack: MarketPack;
      readonly facts: BillingStandingFacts;
      readonly limits: ReadonlyMap<EntitlementKey, TierLimit>;
      readonly window: UsageWindow;
      readonly cycle: UsageCycle;
    },
    now: number,
  ) {
    const { pack, facts, limits, window, cycle } = held;
    const onTrial = facts.state === 'trialing' || facts.state === 'expired';
    const seconds =
      (await this.usage.billedRollupOf(tenantId, ['voice_minutes'], window)).get('voice_minutes') ??
      0;
    const usedMinutes = billedQuantityOf('voice_minutes', seconds);
    const voiceLimit = limits.get('voice_minutes') ?? null;
    // Only a live paid company is collected from, so only it shows what it owes (D395).
    const extra = facts.state === 'active' ? extraChargesOf(pack, voiceLimit, seconds) : null;
    const step = onTrial
      ? await this.trialVoiceStep(tenantId, window, { usedMinutes, voiceLimit }, cycle, now)
      : bundleUsageStep(usedMinutes, voiceLimit ?? 'unlimited');
    const wire: BillingUsage['voice'] = {
      usedMinutes,
      limit: voiceLimit,
      rate: onTrial ? null : planIncludesOf(pack, facts.tier).voiceMinuteRate,
      soFar: extra === null ? null : decimalOf(pack, extra),
      usage: wireStep(step),
    };
    return { wire, extra };
  }

  /** Which meter is at its cap or paused, by name alone: the figures stay the Owner's (`M12-56`). */
  async signalsOf(tenantId: string, now: number): Promise<BillingUsageSignals> {
    const usage = await this.usageOf(tenantId, now);
    const meters = [
      { meter: 'proposals', usage: usage.proposals.usage },
      { meter: 'active_projects', usage: usage.activeProjects.usage },
      { meter: 'voice_minutes', usage: usage.voice.usage },
      { meter: 'storage', usage: usage.storage.usage },
    ] as const;
    return { signals: meters.filter((each) => SIGNALLED.has(each.usage.step)) };
  }

  /** One page of a meter's ledger rows this cycle, newest first (`M12-36`). */
  async eventsOf(
    tenantId: string,
    query: BillingUsageEventsQuery,
    now: number,
  ): Promise<BillingUsageEvents> {
    const { row } = await this.home.readStanding(tenantId, now);
    const cycle = await usageCycleOf(this.rows, tenantId, row, now);
    const { rows, totalCount } = await this.usage.eventsOf(
      tenantId,
      query.meter,
      soFarOf(cycle, now),
      { limit: query.limit, offset: (query.page - 1) * query.limit },
    );
    return {
      items: rows.map((each) => ({
        id: each.id,
        occurredAt: iso(each.occurredAt),
        quantity: each.quantity,
        person: each.person,
      })),
      totalCount,
      cycle: { from: iso(cycle.from), resetsAt: iso(cycle.resetsAt) },
    };
  }

  /**
   * A trial's voice minutes are a cap (`BM-41`: 15 minutes), so they climb the cap ladder; the
   * grace counts from the moment the ledger's running total reached the cap.
   */
  private async trialVoiceStep(
    tenantId: string,
    window: UsageWindow,
    voice: { readonly usedMinutes: number; readonly voiceLimit: TierLimit | null },
    cycle: UsageCycle,
    now: number,
  ): Promise<UsageStep> {
    const { usedMinutes, voiceLimit } = voice;
    const limit = voiceLimit ?? 'unlimited';
    const full = typeof limit === 'number' && usedMinutes >= limit && usedMinutes > 0;
    const fullSince = full
      ? await this.usage.fullSinceOf(
          tenantId,
          'voice_minutes',
          window,
          Math.max(limit * SECONDS_PER_MINUTE, 1),
        )
      : null;
    return cappedUsageStep({
      used: usedMinutes,
      limit,
      fullSince: fullSince?.getTime() ?? null,
      cycleEndsAt: cycle.resetsAt.getTime(),
      now,
    });
  }

  /** The company's limits as the gates hold them; a key with no row has no limit to show. */
  private async limitsOf(tenantId: string): Promise<ReadonlyMap<EntitlementKey, TierLimit>> {
    const rows = await this.entitlements.limitsOf(tenantId);
    return new Map([...(rows?.values() ?? [])].map((each) => [each.key, each.limit]));
  }
}

/**
 * The cycle so far, never past its own end: in the days after a paid period ends and before the
 * next is paid (`M12-05`'s buffer), new use belongs to the next period, as the sweep reckons it.
 */
function soFarOf(cycle: UsageCycle, now: number): UsageWindow {
  return { from: cycle.from, to: new Date(Math.min(now, cycle.resetsAt.getTime())) };
}

/** A count the cap ladder reads; not counted yet, so it stands clear. */
function counted(limit: TierLimit | null, cycle: UsageCycle, now: number) {
  return {
    used: NOT_COUNTED_YET,
    limit,
    usage: wireStep(
      cappedUsageStep({
        used: NOT_COUNTED_YET,
        limit: limit ?? 'unlimited',
        fullSince: null,
        cycleEndsAt: cycle.resetsAt.getTime(),
        now,
      }),
    ),
  };
}

/**
 * What this cycle's minutes owe past the allowance, at the book's published rate — `overageAddOns`,
 * the sweep's own function, over the same total. A book the product cannot bill by bills nothing,
 * as the sweep passes it over, so the screen shows nothing either.
 */
function extraChargesOf(pack: MarketPack, voiceLimit: TierLimit | null, voiceSeconds: number) {
  if (voiceLimit === null) return null;
  try {
    const addOns = overageAddOns(
      pack.priceBook,
      new Map([['voice_minutes', voiceLimit]]),
      new Map([['voice_minutes', voiceSeconds]]),
    );
    return addOns.length === 0 ? null : sumMinorUnits(addOns.map((each) => each.amount));
  } catch (unbillable) {
    if (unbillable instanceof UnbillableMeter) return null;
    throw unbillable;
  }
}

/** Extra charges and the payment that carries them, on a paid `active` row only (`M12-35`). */
function extraChargesWire(
  pack: MarketPack,
  facts: BillingStandingFacts,
  total: ReturnType<typeof extraChargesOf>,
): BillingUsage['extraCharges'] {
  const { state, collection, paidPeriodEnd, cycle } = facts;
  if (total === null || state !== 'active') return null;
  if (collection === null || paidPeriodEnd === null || cycle === null) return null;
  const billsOn = overageBillsOn(collection, {
    paidPeriodEnd,
    nextPeriodEnd: cycleEnd(paidPeriodEnd, cycle),
  });
  return { total: decimalOf(pack, total), billsOn: iso(billsOn) };
}

function wireStep(step: UsageStep): BillingUsage['voice']['usage'] {
  return {
    step: step.step,
    pausesAt: step.pausesAt === null ? null : iso(step.pausesAt),
    resetsAt: step.resetsAt === null ? null : iso(step.resetsAt),
  };
}
