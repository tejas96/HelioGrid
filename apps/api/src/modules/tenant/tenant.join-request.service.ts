import type { JoinRequest, RequestedCompany, SessionProjection } from '@heliogrid/contracts';
import { formatPhone } from '@heliogrid/domain';
import { joinRequestNotice } from '@heliogrid/i18n';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketPackService } from '../market/market.public';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { TenantAdminRepository } from './tenant.admin.repository';
import { JoinRequestRepository } from './tenant.join-request.repository';

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
  ) {}

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
    await this.push.deliverAfterCommit(company.id, written, now);
    return { companyName: company.companyName, city: company.city };
  }
}
