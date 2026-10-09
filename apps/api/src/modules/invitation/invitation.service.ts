import {
  type CreateHeaders,
  type CreateInvitation,
  type Invitation,
  type InvitationLanding,
  invitationContract,
  type ListInvitationsQuery,
  type Paginated,
  type SessionProjection,
} from '@heliogrid/contracts';
import { uuidv7 } from '@heliogrid/db/uuid';
import { type InvitationStatus, invitationStatus } from '@heliogrid/domain';
import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashSecret } from '../../common/auth/secrets';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { AuthService } from '../auth/auth.public';
import { MarketPackService } from '../market/market.public';
import { InvitationAdminRepository, type LandingRow } from './invitation.admin.repository';
import { inviteLinkSecret } from './invitation.message.service';
import { InvitationRepository, type InvitationRow } from './invitation.repository';

/**
 * The team invite (`M01-12`, `M01-13`): the send, the Team list, the revoke, and the invited
 * person's side — the landing, the one-step join, the decline and the one-tap ask for a fresh
 * link. Every decision about what an invite IS now is domain's; this orders the reads and the
 * writes, and hands the text to the worker's run once the send has committed.
 */
@Injectable()
export class InvitationService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(InvitationRepository) private readonly scoped: InvitationRepository,
    @Inject(InvitationAdminRepository) private readonly crossTenant: InvitationAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
  ) {}

  async create(
    tenantId: string,
    body: CreateInvitation,
    headers: CreateHeaders,
    act: Act,
  ): Promise<Invitation> {
    const route = invitationContract.create;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    // A number no market's rail reaches is refused before anything is stored (`F1-49`).
    await this.markets.deliverablePack(body.phoneE164);
    const id = uuidv7();
    const toSend = { ...body, id, tokenHash: hashSecret(inviteLinkSecret(id)) };
    const sent = await this.scoped.create(tenantId, toSend, act, key, uuidv7());
    switch (sent.outcome) {
      case 'created':
      case 'replayed':
      case 'key-reused': {
        const made = this.replies.rowOf(sent, route, tenantId);
        // After the commit, never inside it: the sweep starts the run if this start is lost.
        if (made.eventId !== null) await this.dispatcher.dispatchNow(made.eventId);
        return toInvitation(made.invitation, act.now);
      }
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
    const row = await this.landingRow(token, now, LANDS);
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
    const row = await this.landingRow(token, now, JOINS);
    if (row.status === 'expired') {
      throw new ContractException(
        'INVITE_EXPIRED',
        'This invite has run out. Ask to be invited again.',
        HttpStatus.CONFLICT,
      );
    }
    if (session.actor.phoneE164 !== row.phoneE164) {
      // An answered invite lands nowhere for anyone but the person it let in.
      if (row.status === 'accepted') throw new NotFoundException('This invite no longer lands.');
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

  /** The row behind a link in one of the states `lands`, as it is NOW; every other state is not-found. */
  private async landingRow<S extends InvitationStatus>(
    token: string,
    now: number,
    lands: readonly S[],
  ): Promise<Omit<LandingRow, 'status'> & { status: S }> {
    const row = await this.crossTenant.byTokenHash(hashSecret(token));
    const status =
      row === null
        ? null
        : invitationStatus({ status: row.status, expiresAt: row.expiresAt.getTime() }, now);
    if (row === null || !isOneOf(status, lands)) {
      throw new NotFoundException('This invite no longer lands.');
    }
    return { ...row, status };
  }
}

/** What the link shows: a live invite, or one that has run out. */
const LANDS = ['pending', 'expired'] as const;
/** What the join reaches: those, and an answered one its own person may be repeating. */
const JOINS = [...LANDS, 'accepted'] as const;

function isOneOf<S extends InvitationStatus>(
  status: InvitationStatus | null,
  states: readonly S[],
): status is S {
  return (states as readonly (InvitationStatus | null)[]).includes(status);
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
