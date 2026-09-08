import type {
  CreateTenant,
  Member,
  Paginated,
  PaginationQuery,
  SessionProjection,
  Tenant,
} from '@heliogrid/contracts';
import { marketOfPhone } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { AuthService } from '../auth/auth.public';
import { MarketPackService } from '../market/market.public';
import { TenantAdminRepository, type TenantRow } from './tenant.admin.repository';
import { type MemberRow, TenantRepository } from './tenant.repository';

/**
 * Company signup and the tenant reads (`M01-01`, `M01-19`). The server assigns market and
 * currency from the owner's phone and the market's pack (`F1-07`); nothing about the company
 * beyond the three signup fields is stored here.
 */
@Injectable()
export class TenantService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TenantAdminRepository) private readonly writes: TenantAdminRepository,
    @Inject(TenantRepository) private readonly reads: TenantRepository,
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
    const created = await this.writes.createWithOwner({
      companyName: body.companyName,
      city: body.city,
      marketCode: pack.market,
      currencyCode: pack.formats.currency,
      defaultLanguage: 'en',
      timezone: pack.formats.timeZone,
      ownerUserId: session.actor.userId,
      ownerName: body.ownerName,
      now,
    });
    return this.auth.adoptTenant(sessionId, session.actor.userId, created.id, now);
  }

  async me(tenantId: string): Promise<Tenant | null> {
    const row = await this.reads.me(tenantId);
    return row === null ? null : toTenant(row);
  }

  async members(tenantId: string, query: PaginationQuery): Promise<Paginated<Member>> {
    const page = await this.reads.members(tenantId, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return { items: page.items.map(toMember), totalCount: page.totalCount };
  }

  async similar(companyName: string, city: string) {
    const rows = await this.writes.similar(companyName, city);
    return rows.map((row) => ({ tenantId: row.id, companyName: row.companyName, city: row.city }));
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
