import {
  type CreateInvitation,
  type Invitation,
  type InvitationLanding,
  type ListInvitationsQuery,
  MESSAGE_DELIVERY,
  type MessageDelivery,
  type Paginated,
  type SessionProjection,
} from '@heliogrid/contracts';
import { invitationStatus, inviteLandingPath, platformMessage } from '@heliogrid/domain';
import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashSecret, randomSecret } from '../../common/auth/secrets';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { ENV } from '../../config/env';
import { AuthService } from '../auth/auth.public';
import { MarketPackService } from '../market/market.public';
import { InvitationAdminRepository, type LandingRow } from './invitation.admin.repository';
import { InvitationRepository, type InvitationRow } from './invitation.repository';

/** The carrier refused the message; the transaction it interrupted has rolled the invite back. */
class DeliveryRefused extends Error {}

/**
 * The team invite (`M01-12`, `M01-13`): the send on the platform rail, the Team list, the revoke,
 * and the invited person's side — the landing, the one-step join, the decline and the one-tap ask
 * for a fresh link. Every decision about what an invite IS now is domain's; this orders the reads,
 * the writes and the message around them.
 */
@Injectable()
export class InvitationService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(InvitationRepository) private readonly scoped: InvitationRepository,
    @Inject(InvitationAdminRepository) private readonly crossTenant: InvitationAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(MESSAGE_DELIVERY) private readonly delivery: MessageDelivery,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async create(tenantId: string, body: CreateInvitation, act: Act): Promise<Invitation> {
    const pack = await this.markets.deliverablePack(body.phoneE164);
    const token = randomSecret();
    const link = `${ENV.WEB_ORIGIN}${inviteLandingPath(token)}`;
    const sent = await this.scoped
      .create(tenantId, { ...body, tokenHash: hashSecret(token) }, act, async (facts) => {
        const message = platformMessage(pack.callingRules, 'team_invite', facts.defaultLanguage, {
          inviter: facts.inviterName,
          company: facts.companyName,
          link,
        });
        try {
          await this.delivery.send({ phoneE164: body.phoneE164, channel: 'sms', message });
        } catch (cause) {
          throw new DeliveryRefused('the carrier refused the invite', { cause });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DeliveryRefused) {
          throw new ContractException(
            'INVITE_DELIVERY_FAILED',
            'The invite could not be sent. Try again in a moment.',
            HttpStatus.BAD_GATEWAY,
          );
        }
        throw error;
      });
    switch (sent.outcome) {
      case 'done':
        return toInvitation(sent.invitation, act.now);
      case 'already-member':
        throw new ContractException(
          'ALREADY_MEMBER',
          'This number is already on your team.',
          HttpStatus.CONFLICT,
        );
      case 'already-invited':
        throw new ContractException(
          'ALREADY_INVITED',
          'An invite already went to this number and is still open.',
          HttpStatus.CONFLICT,
        );
      case 'capped':
        throw new ContractException(
          'INVITE_CAP_REACHED',
          'Your company has sent today’s invites. Try again tomorrow.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
    }
  }

  async list(
    tenantId: string,
    query: ListInvitationsQuery,
    now: number,
  ): Promise<Paginated<Invitation>> {
    const page = await this.scoped.list(
      tenantId,
      { status: query.status },
      { limit: query.limit, offset: (query.page - 1) * query.limit },
      now,
    );
    return { items: page.items.map((row) => toInvitation(row, now)), totalCount: page.totalCount };
  }

  async revoke(tenantId: string, id: string, act: Act): Promise<Invitation> {
    const result = await this.scoped.revoke(tenantId, id, act);
    switch (result.outcome) {
      case 'done':
        return toInvitation(result.invitation, act.now);
      case 'not-found':
        throw new NotFoundException('That invite is not this team’s.');
      case 'not-pending':
        throw new ConflictException('That invite was already answered.');
    }
  }

  /** What the link shows: a live or a run-out invite; anything else lands nowhere (`M01-13`). */
  async landing(token: string, now: number): Promise<InvitationLanding> {
    const row = await this.landingRow(token, now);
    return {
      inviterName: row.inviterName ?? '',
      companyName: row.companyName,
      phoneE164: row.phoneE164,
      roles: [...row.roles],
      status: row.status,
    };
  }

  /**
   * The one-step join (`M01-13`), on the session the invite's own phone opened: the membership and
   * its roles in one transaction, then the session moves to the company and the token carries it.
   */
  async accept(
    session: SessionProjection,
    sessionId: string,
    token: string,
    now: number,
  ): Promise<{ projection: SessionProjection; token: { token: string; expiresAt: number } }> {
    const row = await this.landingRow(token, now);
    if (row.status === 'expired') {
      throw new ContractException(
        'INVITE_EXPIRED',
        'This invite has run out. Ask to be invited again.',
        HttpStatus.CONFLICT,
      );
    }
    if (session.actor.phoneE164 !== row.phoneE164) {
      throw new ForbiddenException('This invite is for a different phone number.');
    }
    const joined = await this.crossTenant.accept(hashSecret(token), session.actor.userId, now);
    switch (joined.outcome) {
      case 'done':
        return this.auth.adoptTenant(sessionId, session.actor.userId, joined.tenantId, now);
      case 'not-pending':
        throw new NotFoundException('This invite no longer lands.');
      case 'already-member':
        throw new ConflictException('You are already on this team.');
    }
  }

  async decline(token: string, now: number): Promise<void> {
    const { outcome } = await this.crossTenant.decline(hashSecret(token), now);
    if (outcome === 'not-found') throw new NotFoundException('This invite no longer lands.');
    if (outcome === 'not-pending') throw new ConflictException('This invite is not open any more.');
  }

  async requestReinvite(token: string, now: number): Promise<void> {
    const { outcome } = await this.crossTenant.requestReinvite(hashSecret(token), now);
    if (outcome === 'not-found') throw new NotFoundException('This invite no longer lands.');
    if (outcome === 'not-expired') throw new ConflictException('This invite is still open.');
  }

  /** The row behind a link that still lands, with what it is NOW; every other state is not-found. */
  private async landingRow(
    token: string,
    now: number,
  ): Promise<Omit<LandingRow, 'status'> & { status: 'pending' | 'expired' }> {
    const row = await this.crossTenant.byTokenHash(hashSecret(token));
    const status =
      row === null
        ? null
        : invitationStatus({ status: row.status, expiresAt: row.expiresAt.getTime() }, now);
    if (row === null || (status !== 'pending' && status !== 'expired')) {
      throw new NotFoundException('This invite no longer lands.');
    }
    return { ...row, status };
  }
}

function toInvitation(row: InvitationRow, now: number): Invitation {
  return {
    id: row.id,
    inviteeName: row.inviteeName,
    phoneE164: row.phoneE164,
    roles: [...row.roles],
    status: invitationStatus({ status: row.status, expiresAt: row.expiresAt.getTime() }, now),
    inviterUserId: row.inviterUserId,
    sentAt: row.sentAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}
