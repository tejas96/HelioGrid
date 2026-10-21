import { inviteDeclinedNotice, reinviteRequestedNotice, type Translator } from '@heliogrid/i18n';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hashSecret } from '../../common/auth/secrets';
import {
  type NoticeWords,
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { InvitationAdminRepository } from './invitation.admin.repository';
import {
  type AnswerNotice,
  InvitationAnswersAdminRepository,
} from './invitation.answers.admin.repository';

type NoticeOf = (translate: Translator['t'], invitee: string, company: string) => NoticeWords;

/**
 * The invited person's two answers on the landing (`M01.2` S1.wrong.1, S1.wrong.2): the decline
 * tells the company's EPC Owners, and the ask on a run-out link tells whoever sent it. The words
 * are rendered in every language before the write, and the push goes after the commit.
 */
@Injectable()
export class InvitationAnswersService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(InvitationAdminRepository) private readonly landings: InvitationAdminRepository,
    @Inject(InvitationAnswersAdminRepository)
    private readonly answers: InvitationAnswersAdminRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
  ) {}

  async decline(token: string, now: number): Promise<void> {
    const tokenHash = hashSecret(token);
    const answered = await this.answers.decline(
      tokenHash,
      now,
      await this.noticeOf(tokenHash, inviteDeclinedNotice),
    );
    if (answered.outcome === 'not-found') throw gone();
    if (answered.outcome === 'not-pending') {
      throw new ConflictException('This invite is not open any more.');
    }
    await this.push.deliverAfterCommit(answered.tenantId, answered.notified, new Date(now));
  }

  async requestReinvite(token: string, now: number): Promise<void> {
    const tokenHash = hashSecret(token);
    const answered = await this.answers.requestReinvite(
      tokenHash,
      now,
      await this.noticeOf(tokenHash, reinviteRequestedNotice),
    );
    if (answered.outcome === 'not-found') throw gone();
    if (answered.outcome === 'not-expired')
      throw new ConflictException('This invite is still open.');
    await this.push.deliverAfterCommit(answered.tenantId, answered.notified, new Date(now));
  }

  /**
   * The notice for the company behind the link, named for the invitee as the inviter typed them.
   * Rendered before the answer's transaction, because no catalog may load while its lock is held.
   */
  private async noticeOf(tokenHash: string, words: NoticeOf): Promise<AnswerNotice> {
    const row = await this.landings.byTokenHash(tokenHash);
    if (row === null) throw gone();
    return {
      wordsIn: await renderedInEveryLanguage((translate) =>
        words(translate, row.inviteeName, row.companyName),
      ),
      quietHours: await this.settings.quietHoursOf(row.tenantId),
    };
  }
}

function gone(): NotFoundException {
  return new NotFoundException('This invite no longer lands.');
}
