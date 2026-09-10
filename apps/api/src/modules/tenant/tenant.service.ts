import type {
  AssignRoles,
  CreateTenant,
  Member,
  Paginated,
  PaginationQuery,
  SessionProjection,
  Tenant,
} from '@heliogrid/contracts';
import { marketOfPhone, UI_SOURCE_LOCALE } from '@heliogrid/domain';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { AuthService } from '../auth/auth.public';
import { MarketPackService } from '../market/market.public';
import { TenantAdminRepository, type TenantRow } from './tenant.admin.repository';
import { type MemberRow, TenantRepository, type TransitionOutcome } from './tenant.repository';

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
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async create(
    session: SessionProjection,
    sessionId: string,
    body: CreateTenant,
    now: number,
  ): Promise<{ projection: SessionProjection; token: { token: string; expiresAt: number } }> {
    const pack = marketOfPhone(await this.markets.currentPacks(), session.actor.phoneE164);
    if (pack === null) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        'No market is authored for this phone number yet.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const created = await this.crossTenant.createWithOwner({
      companyName: body.companyName,
      city: body.city,
      marketCode: pack.market,
      currencyCode: pack.formats.currency,
      defaultLanguage: UI_SOURCE_LOCALE,
      timezone: pack.formats.timeZone,
      ownerUserId: session.actor.userId,
      ownerName: body.ownerName,
      now,
    });
    return this.auth.adoptTenant(sessionId, session.actor.userId, created.id, now);
  }

  async me(tenantId: string): Promise<Tenant | null> {
    const row = await this.scoped.me(tenantId);
    return row === null ? null : toTenant(row);
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
