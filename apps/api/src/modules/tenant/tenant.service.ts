import {
  type AssignRoles,
  type CoachMarks,
  type CreateHeaders,
  type CreateTenant,
  type Member,
  type MyMembership,
  type Paginated,
  type PaginationQuery,
  type SessionProjection,
  type Tenant,
  type TenantOwners,
  tenantContract,
} from '@heliogrid/contracts';
import { marketOfPhone, ROLE_CARD_OWNERS_SHOWN, UI_SOURCE_LOCALE } from '@heliogrid/domain';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { AuthService } from '../auth/auth.public';
import { MarketPackService } from '../market/market.public';
import { TenantAdminRepository, type TenantRow } from './tenant.admin.repository';
import type { MemberRow } from './tenant.members.repository';
import { MyMembershipRepository } from './tenant.my-membership.repository';
import { TenantOwnersRepository } from './tenant.owners.repository';
import { TenantRepository, type TransitionOutcome } from './tenant.repository';

/**
 * Company signup, the tenant reads and role administration (`M01-01`, `M01-19`, `M01-20`). The
 * server assigns market and currency from the owner's phone and the market's pack (`F1-07`);
 * nothing about the company beyond the three signup fields is stored here.
 */
@Injectable()
export class TenantService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TenantAdminRepository) private readonly crossTenant: TenantAdminRepository,
    @Inject(TenantRepository) private readonly scoped: TenantRepository,
    @Inject(MyMembershipRepository) private readonly mine: MyMembershipRepository,
    @Inject(TenantOwnersRepository) private readonly ownersRead: TenantOwnersRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async create(
    session: SessionProjection,
    sessionId: string,
    body: CreateTenant,
    headers: CreateHeaders,
    now: number,
  ): Promise<{ projection: SessionProjection; token: { token: string; expiresAt: number } }> {
    const route = tenantContract.create;
    const key = creationKeyOf(headers, session.actor.userId, route, body);
    const pack = marketOfPhone(await this.markets.currentPacks(), session.actor.phoneE164);
    if (pack === null) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        'No market is authored for this phone number yet.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const keyed = await this.crossTenant.createWithOwner({
      companyName: body.companyName,
      city: body.city,
      marketCode: pack.market,
      currencyCode: pack.formats.currency,
      defaultLanguage: UI_SOURCE_LOCALE,
      timezone: pack.formats.timeZone,
      ownerUserId: session.actor.userId,
      ownerName: body.ownerName,
      now,
      key,
    });
    // A replay adopts the SAME company again and mints a fresh token: no token is ever stored.
    const created = this.replies.rowOf(keyed, route, null);
    return this.auth.adoptTenant(sessionId, session.actor.userId, created.id, now);
  }

  async me(tenantId: string): Promise<Tenant | null> {
    const row = await this.scoped.me(tenantId);
    return row === null ? null : toTenant(row);
  }

  /** My own membership's first-run count (`M01-16`) and who last set my roles (`SCR-M01-10`). */
  async myMembership(tenantId: string, userId: string): Promise<MyMembership> {
    const row = await this.mine.read(tenantId, userId);
    if (row === null) throw new NotFoundException('You are not on this team.');
    return {
      coachMarksDismissed: row.coachMarksDismissed,
      rolesSetBy: row.rolesSetByName === null ? null : { name: row.rolesSetByName },
    };
  }

  /** The company's EPC Owners by name, the first two and a count (`SCR-M01-10` ruling 15). */
  async owners(tenantId: string): Promise<TenantOwners> {
    const { names, total } = await this.ownersRead.owners(tenantId, ROLE_CARD_OWNERS_SHOWN);
    return { owners: names.map((name) => ({ name })), more: total - names.length };
  }

  /** Raises my first-run count; a count below the stored one is refused, never applied. */
  async updateMyMembership(
    tenantId: string,
    userId: string,
    body: CoachMarks,
  ): Promise<CoachMarks> {
    const written = await this.mine.passCoachMarks(tenantId, userId, body.coachMarksDismissed);
    switch (written.outcome) {
      case 'done':
        return { coachMarksDismissed: written.count };
      case 'not-found':
        throw new NotFoundException('You are not on this team.');
      case 'lower':
        throw new ContractException(
          'DOMAIN_RULE_VIOLATION',
          `You have already passed ${written.count} of the first-run tips; a passed tip stays passed.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }
  }

  async members(tenantId: string, query: PaginationQuery): Promise<Paginated<Member>> {
    const page = await this.scoped.members(tenantId, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return { items: page.items.map(toMember), totalCount: page.totalCount };
  }

  async similar(companyName: string, city: string) {
    const rows = await this.crossTenant.similar(companyName, city);
    return rows.map((row) => ({ tenantId: row.id, companyName: row.companyName, city: row.city }));
  }

  /** The presets a person holds, replaced as a whole and guarded (`M01-20`, `F2-19`). */
  async assignRoles(
    tenantId: string,
    membershipId: string,
    body: AssignRoles,
    act: Act,
  ): Promise<Member> {
    return toMember(
      admitted(await this.scoped.assignRoles(tenantId, membershipId, body.roles, act)),
    );
  }

  /** Deactivated, never deleted (`F2-20`): the row flips, then every session under this company ends. */
  async deactivateMember(tenantId: string, membershipId: string, act: Act): Promise<Member> {
    const member = admitted(await this.scoped.deactivate(tenantId, membershipId, act));
    // The revocation is this act's consequence, not an act of its own: `team.member_deactivated`
    // already records it, so the sweep writes no second entry (`F2-20`, `F2-22`).
    await this.auth.revokeSessionsUnder(tenantId, member.userId, act.now);
    return toMember(member);
  }
}

/** The row a transition produced, or its refusal as the contract declares it. */
function admitted(result: TransitionOutcome): MemberRow {
  switch (result.outcome) {
    case 'done':
      return result.member;
    case 'not-found':
      throw new NotFoundException('That person is not on this team.');
    case 'not-active':
      throw new ConflictException('Only an active person can be changed.');
    case 'last-owner':
      throw new ContractException(
        'LAST_OWNER',
        'This person is the only EPC Owner. A company always keeps at least one EPC Owner and one person who can manage the team.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    case 'own-admin':
      throw new ContractException(
        'OWN_ADMIN',
        "You can't remove your own EPC Owner — another EPC Owner can.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
  }
}

function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    companyName: row.companyName,
    city: row.city,
    marketCode: row.marketCode,
    currencyCode: row.currencyCode,
    defaultLanguage: row.defaultLanguage,
    timezone: row.timezone,
    segment: row.segment,
    typicalSystemKwp: row.typicalSystemKwp === null ? null : Number(row.typicalSystemKwp),
  };
}

function toMember(row: MemberRow): Member {
  return {
    membershipId: row.membershipId,
    userId: row.userId,
    name: row.name ?? '',
    phoneE164: row.phoneE164,
    roles: [...row.roles],
    status: row.status,
    lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
  };
}
