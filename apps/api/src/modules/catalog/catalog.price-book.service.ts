import {
  type CreateHeaders,
  type Paginated,
  type PaginationQuery,
  type PriceBookActiveWire,
  type PriceBookPublish,
  type PriceBookRateWire,
  type PriceBookVersionHeadWire,
  type PriceBookVersionSummaryWire,
  type PriceBookVersionWire,
  priceBookContract,
  type RoleSet,
} from '@heliogrid/contracts';
import { basisPointsToPercent, PLATFORM_DEFAULT_MARGIN } from '@heliogrid/domain';
import { minorUnitsOfDecimal, minorUnitsToDecimal } from '@heliogrid/domain/server';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import {
  CatalogPriceBookRepository,
  type StoredRate,
  type VersionSummary,
} from './catalog.price-book.repository';
import { CatalogService } from './catalog.service';
import { admitWrite, amountAtScale } from './internal/write-checks';

/**
 * The price book (`M01-48`): a tenant's non-catalog rates as immutable versions, the newest in
 * force. Every read is the catalog's money grant's — the route's door admits Finance's limited
 * cell — and the publish is the outright grant's (§M01.5).
 */
@Injectable()
export class CatalogPriceBookService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogPriceBookRepository) private readonly book: CatalogPriceBookRepository,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  /**
   * The rate card in force. Before a company's first publish there is no version: no rates and the
   * platform default margin (§M01.5, owner ruling 1A), in the company's own currency.
   */
  async active(tenantId: string, now: number): Promise<PriceBookActiveWire> {
    const scope = await this.catalog.scopeOf(tenantId, now);
    const newest = await this.book.newest(tenantId);
    if (newest === null) {
      return {
        version: null,
        defaultMarginPct: basisPointsToPercent(PLATFORM_DEFAULT_MARGIN),
        currencyCode: scope.currencyCode,
        rates: [],
      };
    }
    return {
      version: headWire(newest.version),
      defaultMarginPct: newest.version.defaultMarginPct,
      currencyCode: newest.version.currencyCode,
      rates: newest.rates.map((rate) => rateWire(rate, scope.resolve.minorUnitDigits)),
    };
  }

  async versions(
    tenantId: string,
    page: PaginationQuery,
  ): Promise<Paginated<PriceBookVersionSummaryWire>> {
    const { versions, totalCount } = await this.book.page(tenantId, {
      limit: page.limit,
      offset: (page.page - 1) * page.limit,
    });
    return { items: versions.map(summaryWire), totalCount };
  }

  async version(tenantId: string, id: string, now: number): Promise<PriceBookVersionWire> {
    const found = await this.book.version(tenantId, id);
    if (found === null) {
      throw new NotFoundException('That price-book version is not in this company’s price book.');
    }
    const digits = (await this.catalog.scopeOf(tenantId, now)).resolve.minorUnitDigits;
    return {
      ...summaryWire(found.version),
      currencyCode: found.version.currencyCode,
      rates: found.rates.map((rate) => rateWire(rate, digits)),
    };
  }

  /** A new version, now the one in force: the whole rate set, scaled to the company's currency. */
  async publish(
    tenantId: string,
    roles: RoleSet,
    body: PriceBookPublish,
    headers: CreateHeaders,
    act: Act,
  ): Promise<PriceBookVersionHeadWire> {
    admitWrite(roles);
    const scope = await this.catalog.scopeOf(tenantId, act.now);
    const digits = scope.resolve.minorUnitDigits;
    const rates = body.rates.map((rate, index) => ({
      ...rate,
      amount: amountAtScale(rate.amount, digits, `rates.${index}.`),
    }));
    const route = priceBookContract.publish;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const outcome = await this.book.publish(
      tenantId,
      {
        note: body.note,
        defaultMarginPct: body.defaultMarginPct,
        currencyCode: scope.currencyCode,
        rates,
      },
      act,
      key,
    );
    const found = await this.book.version(tenantId, this.replies.rowOf(outcome, route, tenantId));
    if (found === null) throw new Error('a published price-book version reads back as absent');
    return headWire(found.version);
  }
}

function headWire(version: VersionSummary): PriceBookVersionHeadWire {
  return {
    id: version.id,
    number: version.number,
    publishedAt: version.publishedAt.toISOString(),
    publishedBy: version.publishedBy,
    note: version.note,
  };
}

function summaryWire(version: VersionSummary): PriceBookVersionSummaryWire {
  return {
    ...headWire(version),
    defaultMarginPct: version.defaultMarginPct,
    rateCount: version.rateCount,
    active: version.active,
  };
}

/** A stored rate as the panel shows it: the column's decimal scaled to the currency's digits. */
function rateWire(rate: StoredRate, minorUnitDigits: number): PriceBookRateWire {
  return {
    name: rate.name,
    basis: rate.basis,
    amount: minorUnitsToDecimal(minorUnitsOfDecimal(rate.amount, minorUnitDigits), minorUnitDigits),
  };
}
