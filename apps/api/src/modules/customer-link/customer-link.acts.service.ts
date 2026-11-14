import { type CustomerPage, LINK_ACT_NOT_TAKEN } from '@heliogrid/contracts';
import {
  callBackWindowOf,
  type DeviceClass,
  formatPhone,
  type LinkSection,
  type ProposalAnswer,
} from '@heliogrid/domain';
import { type CustomerLinkNoticeFacts, customerLinkNotice } from '@heliogrid/i18n';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import type { LinkActOutcome, LinkNotice } from './customer-link.act-effects.repository';
import { type AcceptingSession, CustomerLinkActsRepository } from './customer-link.acts.repository';
import { CustomerLinkAsksRepository } from './customer-link.asks.repository';
import { CustomerLinkPageService } from './customer-link.page.service';
import type { PresentedToken } from './customer-link.token.admin.repository';
import type { LinkVisit } from './customer-link.visit.repository';

const noSuchLink = () => new NotFoundException('No such link.');

/** What happened on the link, less the name every notice opens with. */
type NoticeKind = CustomerLinkNoticeFacts extends infer Facts
  ? Facts extends { name: string }
    ? Omit<Facts, 'name'>
    : never
  : never;

/**
 * The customer's acts on their link (`F5-43`, `F5-52`…`F5-54`): each renders the notice it will
 * send before it takes its locks, writes in one transaction, sends the pushes after the commit,
 * and answers the page as it then stands — the acknowledgement is the page itself (`F5-48`).
 */
@Injectable()
export class CustomerLinkActsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CustomerLinkActsRepository) private readonly acts: CustomerLinkActsRepository,
    @Inject(CustomerLinkAsksRepository) private readonly asks: CustomerLinkAsksRepository,
    @Inject(CustomerLinkPageService) private readonly pages: CustomerLinkPageService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
  ) {}

  private async presented(token: string): Promise<PresentedToken> {
    const presented = await this.pages.presented(token);
    if (presented === null) throw noSuchLink();
    return presented;
  }

  /** The notice an act will send, in every language, from the deal as it stands before the act. */
  private async noticeOf(
    presented: PresentedToken,
    now: number,
    of: (visit: LinkVisit) => NoticeKind,
  ): Promise<LinkNotice> {
    const visit = await this.acts.visit(presented, now);
    if (visit === null) throw noSuchLink();
    const pack = await this.settings.packOf(presented.tenantId);
    const name = visit.customerName ?? formatPhone(pack.formats, visit.customerPhoneE164);
    const facts = { name, ...of(visit) } as CustomerLinkNoticeFacts;
    return {
      wordsIn: await renderedInEveryLanguage((translate) => customerLinkNotice(translate, facts)),
      quietHours: await this.settings.quietHoursOf(presented.tenantId),
    };
  }

  /** The page after the act, or the status the act's outcome declares. */
  private async settled(
    presented: PresentedToken,
    outcome: LinkActOutcome,
    now: number,
  ): Promise<CustomerPage> {
    if (outcome.outcome === 'gone') throw noSuchLink();
    if (outcome.outcome === 'refused') {
      throw new ContractException(
        LINK_ACT_NOT_TAKEN,
        'This was not recorded. Read the page again to see where it stands.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        undefined,
        { refusal: outcome.refusal },
      );
    }
    await this.push.deliverAfterCommit(presented.tenantId, outcome.notified, new Date(now));
    const page = await this.pages.pageOf(presented, Date.now());
    if (page === null) throw noSuchLink();
    return page;
  }

  /**
   * One open — never recorded for a member of the link's own company looking at the page
   * (`T-F5-007`), whichever company they are signed in under; a person who belongs to none of it
   * is a customer like any other.
   */
  async opened(
    token: string,
    deviceClass: DeviceClass,
    reader: string | null,
    now: number,
  ): Promise<void> {
    const presented = await this.presented(token);
    if (await this.isInsider(presented, reader)) return;
    const notice = await this.noticeOf(presented, now, (visit) => ({
      kind: 'opened',
      number: visit.served?.number ?? '',
    }));
    const notified = await this.acts.opened(presented, deviceClass, notice, now);
    await this.push.deliverAfterCommit(presented.tenantId, notified, new Date(now));
  }

  async viewed(
    token: string,
    section: LinkSection,
    seconds: number,
    reader: string | null,
    now: number,
  ): Promise<void> {
    const presented = await this.presented(token);
    if (!(await this.isInsider(presented, reader))) {
      await this.acts.viewed(presented, section, seconds, now);
    }
  }

  /** The signed-in reader belongs to the link's own company, by any of their memberships. */
  private async isInsider(presented: PresentedToken, reader: string | null): Promise<boolean> {
    return reader !== null && (await this.acts.belongsToCompany(presented, reader));
  }

  async answer(
    token: string,
    ask: {
      readonly answer: ProposalAnswer;
      readonly versionId: string;
      readonly words: string | null;
    },
    session: AcceptingSession,
    now: number,
  ): Promise<CustomerPage> {
    const presented = await this.presented(token);
    const notice = await this.noticeOf(presented, now, (visit) => {
      const number = visit.served?.number ?? '';
      if (ask.answer === 'accept') {
        return { kind: 'accepted', number, label: visit.label, contact: visit.contactName };
      }
      return ask.answer === 'decline'
        ? { kind: 'declined', number }
        : { kind: 'change', number, words: ask.words ?? '' };
    });
    const pack = await this.settings.packOf(presented.tenantId);
    const outcome = await this.acts.answer(presented, { ...ask, session, pack }, notice, now);
    return this.settled(presented, outcome, now);
  }

  async question(token: string, text: string, now: number): Promise<CustomerPage> {
    const presented = await this.presented(token);
    const notice = await this.noticeOf(presented, now, () => ({ kind: 'question', text }));
    const window = await this.windowOf(presented.tenantId);
    return this.settled(
      presented,
      await this.asks.question(presented, text, notice, window, now),
      now,
    );
  }

  async callRequest(token: string, at: string | null, now: number): Promise<CustomerPage> {
    const presented = await this.presented(token);
    const notice = await this.noticeOf(presented, now, () => ({ kind: 'call' }));
    const window = await this.windowOf(presented.tenantId);
    const namedAt = at === null ? null : Date.parse(at);
    return this.settled(
      presented,
      await this.asks.callRequest(presented, namedAt, notice, window, now),
      now,
    );
  }

  /** The market's calling window on the company's clock — when a call the customer did not time falls due. */
  private async windowOf(tenantId: string) {
    return callBackWindowOf((await this.settings.packOf(tenantId)).callingRules, null);
  }
}
