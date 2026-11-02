import type { PlanPick } from '@heliogrid/contracts';
import { type MarketPack, marketQuietHours, type UiLanguage } from '@heliogrid/domain';
import { planChangeNoticeWords } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { type NoticeWords, renderedInEveryLanguage } from '../notification/notification.public';
import { EntitlementService } from './entitlement.service';
import { PlanChangeAdminRepository } from './plan-change.admin.repository';
import {
  type DueChange,
  type PictureMoved,
  PlanChangeBoundaryAdminRepository,
} from './plan-change.boundary.admin.repository';
import { PlanChangePreviewService } from './plan-change.preview.service';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';

/** At most this many changes per run, so one run stays inside its step's timeout. */
const CHANGE_BATCH = 100;

/**
 * The paid period's end of a scheduled downgrade or cycle switch (`M12-49`, `M12-12`): the
 * billing timers apply it before the renewal is raised, so the next period bills the new plan.
 * The review is read again first; when what it blocks moved since the Owner confirmed, the Owners
 * are told, and the plan moves all the same — reading and exporting never stop (`BM-32`).
 */
@Injectable()
export class PlanChangeBoundaryService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PlanChangeBoundaryAdminRepository)
    private readonly boundary: PlanChangeBoundaryAdminRepository,
    @Inject(PlanChangeAdminRepository) private readonly changes: PlanChangeAdminRepository,
    @Inject(PlanChangePreviewService) private readonly previews: PlanChangePreviewService,
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
  ) {}

  /** Answers how many rows moved onto their scheduled plan. */
  async applyDue(now: number): Promise<number> {
    let applied = 0;
    for (const change of await this.boundary.due(now, CHANGE_BATCH)) {
      const pack = await this.markets.currentPackOf(change.marketCode);
      const moved = (await this.pictureMoved(change, now)) ? await noticeOf(change, pack) : null;
      const outcome = await this.boundary.apply(change, {
        limitsFor: this.entitlements.bookLimitsOf(pack),
        now,
        moved,
      });
      if (outcome?.applied === true) applied += 1;
    }
    return applied;
  }

  /** Whether the review, read again on the price it was confirmed on, names another digest. */
  private async pictureMoved(change: DueChange, now: number): Promise<boolean> {
    const standing = await this.changes.standingOf(change.tenantId);
    const target = (await this.prices.byIds([change.toPlanPriceId])).get(change.toPlanPriceId);
    if (standing === null || target === undefined || standing.state !== 'active') return false;
    const pick: PlanPick = { tier: change.tier, cycle: change.cycle };
    try {
      const worked = await this.previews.workOut(change.tenantId, standing, pick, now, target);
      return worked.preview.digest !== change.previewDigest;
    } catch (error) {
      // The book stopped selling the plan since: the change still applies as confirmed.
      if (error instanceof ContractException) return true;
      throw error;
    }
  }
}

/**
 * The Owners' notice, in each one's language. `system` is delivered in the app alone (its
 * registry row), so the quiet window only dates a push that never leaves: the market's window
 * stands in for the company's own, which lives in Settings — a module Billing cannot import.
 */
async function noticeOf(change: DueChange, pack: MarketPack): Promise<PictureMoved> {
  const wordsIn: (language: UiLanguage) => NoticeWords = await renderedInEveryLanguage((t) =>
    planChangeNoticeWords(t, { tier: change.tier }),
  );
  return {
    wordsIn,
    quietHours: { window: marketQuietHours(pack.callingRules), timezone: change.timezone },
  };
}
