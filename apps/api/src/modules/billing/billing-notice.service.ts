import { MESSAGE_DELIVERY, type MessageDelivery } from '@heliogrid/contracts';
import {
  BILLING_NOTICES,
  type BillingNotice,
  billingNoticeMessage,
  disclosesForfeiture,
  type MarketPack,
  nextNotice,
  protectionEndsAt,
  pushDueAt,
  SETTINGS_SEGMENT,
  type UiLanguage,
} from '@heliogrid/domain';
import { billingNoticeWords } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { MarketPackService } from '../market/market.public';
import {
  type NoticeWords,
  NotificationPushService,
  renderedInEveryLanguage,
  type TenantQuietHours,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import {
  BillingNoticeAdminRepository,
  type NoticeStanding,
  type NoticeVerdict,
  type ToldNotice,
} from './billing-notice.admin.repository';
import {
  BillingNoticeCandidatesAdminRepository,
  type NoticeCandidate,
} from './billing-notice-candidates.admin.repository';

/** At most this many ladders per run, so one run stays inside its step's timeout. */
const NOTICE_BATCH = 100;

type WordsOf = (
  notice: BillingNotice,
  whileProtected: boolean,
) => (language: UiLanguage) => NoticeWords;

/**
 * The billing notices (`M12-39`–`M12-42`): every run tells each ladder the notice that has fallen
 * due — in the app and by push to the company's EPC Owners, then by the market's SMS text. Which
 * notice, and whether it is true now, is domain's; this reads, asks and writes.
 *
 * A notice is told outside the company's quiet window only (`F6-14`): its push is then due when it
 * is written and leaves at once. The SMS leaves after the commit, best effort like the push: a
 * carrier's refusal is logged by the notice, never the phone, and fails nothing.
 */
@Injectable()
export class BillingNoticeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingNoticeCandidatesAdminRepository)
    private readonly candidates: BillingNoticeCandidatesAdminRepository,
    @Inject(BillingNoticeAdminRepository) private readonly notices: BillingNoticeAdminRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(MESSAGE_DELIVERY) private readonly delivery: MessageDelivery,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BillingNoticeService.name);
  }

  /** The result is the workflow's contract: a running worker reads exactly this count. */
  async tellDue(now: number): Promise<{ told: number }> {
    const candidates = await this.candidates.candidates(now, NOTICE_BATCH);
    if (candidates.length === 0) return { told: 0 };
    const wordsOf = await everyNoticeWords();
    const packs = await this.markets.currentPacks();
    let told = 0;
    for (const candidate of candidates) {
      const pack = packs.find((one) => one.market === candidate.marketCode);
      if (pack === undefined) throw new Error(`no published pack for ${candidate.marketCode}`);
      if (await this.lookAt(candidate, now, wordsOf, pack)) told += 1;
    }
    return { told };
  }

  private async lookAt(
    candidate: NoticeCandidate,
    now: number,
    wordsOf: WordsOf,
    pack: MarketPack,
  ): Promise<boolean> {
    const quietHours = await this.settings.quietHoursOf(candidate.tenantId);
    const told = await this.notices.look(
      candidate,
      now,
      (standing) => verdictOf(standing, now, quietHours, pack),
      wordsOf,
      quietHours,
    );
    if (told === null) return false;
    await this.push.deliverAfterCommit(candidate.tenantId, told.notificationIds, new Date(now));
    await this.text(told, pack);
    return true;
  }

  private async text(told: ToldNotice, pack: MarketPack): Promise<void> {
    const link = `${ENV.WEB_ORIGIN}/more/${SETTINGS_SEGMENT.billing}`;
    for (const owner of told.owners) {
      const message = billingNoticeMessage(
        pack.callingRules,
        told.notice,
        told.whileProtected,
        owner.language,
        { company: told.companyName, link },
      );
      if (message === null) return;
      try {
        await this.delivery.send({ phoneE164: owner.phoneE164, channel: 'sms', message });
      } catch (error) {
        const cause = error instanceof Error ? error.name : 'unknown';
        this.logger.warn(
          { dunningEventId: told.eventId, cause },
          'the carrier refused a billing notice',
        );
      }
    }
  }
}

/**
 * The domain's notice, held to the quiet window, with the forfeiture a protected company is told
 * (`M12-41`): protection runs `priceProtectionMonths` from signup (`BM-42`).
 */
function verdictOf(
  standing: NoticeStanding,
  now: number,
  quietHours: TenantQuietHours,
  pack: MarketPack,
): NoticeVerdict {
  const { tell, lookAgainAt } = nextNotice(standing.clock, standing.lastToldDueAt, now);
  if (tell === null) return { kind: 'look again', at: lookAgainAt };
  const tellable = pushDueAt('standard', now, quietHours.window, quietHours.timezone);
  if (tellable > now) return { kind: 'look again', at: tellable };
  const protectedUntil = protectionEndsAt(
    standing.signedUpAt,
    pack.priceBook.priceProtectionMonths,
  );
  return {
    kind: 'tell',
    notice: tell.notice,
    dueAt: tell.dueAt,
    whileProtected: disclosesForfeiture(tell.notice) && now < protectedUntil,
    lookAgainAt,
  };
}

/** Every notice's words in every language, rendered before any transaction holds a lock. */
async function everyNoticeWords(): Promise<WordsOf> {
  const rendered = await Promise.all(
    BILLING_NOTICES.flatMap((notice) =>
      [false, true].map(async (whileProtected) => ({
        key: `${notice}:${whileProtected}`,
        wordsIn: await renderedInEveryLanguage((t) =>
          billingNoticeWords(t, notice, whileProtected),
        ),
      })),
    ),
  );
  return (notice, whileProtected) => {
    const found = rendered.find((one) => one.key === `${notice}:${whileProtected}`);
    if (found === undefined) throw new Error(`no words for the ${notice} notice`);
    return found.wordsIn;
  };
}
