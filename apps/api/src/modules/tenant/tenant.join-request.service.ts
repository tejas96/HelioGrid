import type { JoinRequest, RequestedCompany, SessionProjection } from '@heliogrid/contracts';
import { formatPhone, UI_LANGUAGES, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, joinRequestNotice, type Translator } from '@heliogrid/i18n';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackService } from '../market/market.public';
import { NotificationPushService } from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { TenantAdminRepository } from './tenant.admin.repository';
import { JoinRequestRepository, type NoticeWords } from './tenant.join-request.repository';

/**
 * The join request (`M01-09`): someone signing up asks the company they typed to add them. The
 * company is matched again here from the typed name and city — never taken from the caller — and
 * the oldest match is the one the steer named. The request is a notice to each of its active EPC
 * Owners and nothing else; the invite the owner then sends is the answer.
 */
@Injectable()
export class JoinRequestService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TenantAdminRepository) private readonly crossTenant: TenantAdminRepository,
    @Inject(JoinRequestRepository) private readonly joins: JoinRequestRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(JoinRequestService.name);
  }

  async request(
    session: SessionProjection,
    body: JoinRequest,
    now: Date,
  ): Promise<RequestedCompany> {
    if (session.membership !== null) {
      throw new ConflictException('You already belong to a company.');
    }
    const [company] = await this.crossTenant.similar(body.companyName, body.city);
    if (company === undefined) {
      throw new NotFoundException('No company has this name and city.');
    }
    const pack = await this.markets.currentPackOf(company.marketCode);
    const asker = { name: body.name, phone: formatPhone(pack.formats, session.actor.phoneE164) };
    const wordsIn = await renderedInEveryLanguage((translate) =>
      joinRequestNotice(translate, asker, company.companyName),
    );
    const written = await this.joins.notifyOwners(
      company.id,
      session.actor.userId,
      wordsIn,
      await this.settings.quietHoursOf(company.id),
      now,
    );
    for (const id of written) await this.pushAfterCommit(company.id, id, now);
    return { companyName: company.companyName, city: company.city };
  }

  /**
   * The notices are committed, so a push that cannot go out never turns the answer into a
   * failure: a retry would find them written and send no push at all (`F6-06`, the record is the
   * truth). Logged by the notice's id alone.
   */
  private async pushAfterCommit(
    tenantId: string,
    notificationId: string,
    now: Date,
  ): Promise<void> {
    try {
      await this.push.deliver(tenantId, notificationId, now);
    } catch (error) {
      this.logger.warn({ notificationId, err: error }, 'join request push failed after commit');
    }
  }
}

/**
 * The notice rendered once per language before the write, so the transaction picks each owner's
 * without loading a catalog while it holds its locks.
 */
async function renderedInEveryLanguage(
  render: (translate: Translator['t']) => NoticeWords,
): Promise<(language: UiLanguage) => NoticeWords> {
  const rendered = await Promise.all(
    UI_LANGUAGES.map(async (language) => ({
      language,
      words: render((await createTranslator(language)).t),
    })),
  );
  return (language) => {
    const found = rendered.find((one) => one.language === language);
    if (found === undefined) throw new Error(`no words were rendered in ${language}`);
    return found.words;
  };
}
