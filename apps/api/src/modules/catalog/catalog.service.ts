import {
  type CatalogItemsQuery,
  type CatalogItemWire,
  type CatalogOverrideWrite,
  type CreateHeaders,
  catalogContract,
  type OwnCatalogItemCreate,
  type OwnCatalogItemWrite,
  type Paginated,
  type RateEntryWire,
  type RateEntryWrite,
  type ResolvedCatalogItemWire,
  type RoleSet,
} from '@heliogrid/contracts';
import { badgedSchemes, can, certificationVerdict, localDate } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { CatalogPricesRepository } from './catalog.prices.repository';
import { CatalogRatesRepository } from './catalog.rates.repository';
import { CatalogRepository } from './catalog.repository';
import { CatalogSliceRepository } from './catalog.slice.repository';
import { resolvedOf } from './internal/resolve-input';
import { prefixTermsOf } from './internal/search-terms';
import { type MoneyView, rateEntryWire, resolvedWire } from './internal/wire';
import {
  admitWrite,
  MANAGE_CATALOG,
  rateToAppend,
  refused,
  refusedOrKeyed,
  type Scope,
} from './internal/write-checks';

/** No draft table exists yet: the studio's and M06's slices add the query (decision 15). */
const OPEN_DRAFTS_BEFORE_THE_STUDIO = 0;

/**
 * The catalog a tenant sees and writes (`M01-33` … `M01-44`): every item through the one
 * resolver, money shown only to its readers (ruling 1A), and every write admitted by the grant
 * first (decision 12) — Finance reads prices and changes nothing; adding an own SKU is also
 * `add_own_catalog_items`'s.
 */
@Injectable()
export class CatalogService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogSliceRepository) private readonly slice: CatalogSliceRepository,
    @Inject(CatalogRepository) private readonly items: CatalogRepository,
    @Inject(CatalogPricesRepository) private readonly prices: CatalogPricesRepository,
    @Inject(CatalogRatesRepository) private readonly rates: CatalogRatesRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async list(
    tenantId: string,
    roles: RoleSet,
    query: CatalogItemsQuery,
    now: number,
  ): Promise<Paginated<ResolvedCatalogItemWire>> {
    const scope = await this.scopeOf(tenantId, now);
    const { limit, page, q, preferred, archived, ...narrowing } = query;
    const { rows, totalCount } = await this.slice.page(
      tenantId,
      scope.marketCode,
      { ...narrowing, terms: prefixTermsOf(q), preferred, archived: archived ?? false },
      { limit, offset: (page - 1) * limit, pricedOn: scope.resolve.pricedOn },
    );
    const money = moneyFor(roles, scope);
    return {
      items: rows.map((row) => resolvedWire(resolvedOf(row, scope.resolve), money)),
      totalCount,
    };
  }

  async item(tenantId: string, roles: RoleSet, id: string, now: number): Promise<CatalogItemWire> {
    const scope = await this.scopeOf(tenantId, now);
    const row = await this.slice.item(tenantId, scope.marketCode, id, scope.resolve.pricedOn);
    if (row === null) throw refused({ outcome: 'not-found' });
    return {
      ...resolvedWire(resolvedOf(row, scope.resolve), moneyFor(roles, scope)),
      openDraftCount: OPEN_DRAFTS_BEFORE_THE_STUDIO,
    };
  }

  async createItem(
    tenantId: string,
    roles: RoleSet,
    body: OwnCatalogItemCreate,
    headers: CreateHeaders,
    act: Act,
  ): Promise<CatalogItemWire> {
    const { rate, ...form } = body;
    // A price is written only by whoever may read one (b14, §M01.4): the add grant adds unpriced.
    if (rate !== undefined || !can(roles, 'onboarding.add_own_catalog_items')) admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const item = ownItemOf(form, scope);
    const entry = rate === undefined ? null : rateToAppend(rate, scope, 'rate.');
    const route = catalogContract.createItem;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const keyed = await this.items.createOwnItem(tenantId, item, entry, act, key);
    return this.item(tenantId, roles, this.replies.rowOf(keyed, route, tenantId), act.now);
  }

  async saveItem(
    tenantId: string,
    roles: RoleSet,
    id: string,
    body: OwnCatalogItemWrite,
    act: Act,
  ): Promise<CatalogItemWire> {
    admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const refusal = await this.items.saveOwnItem(
      tenantId,
      scope.marketCode,
      id,
      ownItemOf(body, scope),
      act,
    );
    if (refusal !== null) throw refused(refusal);
    return this.item(tenantId, roles, id, act.now);
  }

  async setArchived(
    tenantId: string,
    roles: RoleSet,
    id: string,
    archived: boolean,
    act: Act,
  ): Promise<CatalogItemWire> {
    admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const refusal = await this.items.setArchived(tenantId, scope.marketCode, id, archived, act);
    if (refusal !== null) throw refused(refusal);
    return this.item(tenantId, roles, id, act.now);
  }

  async saveOverride(
    tenantId: string,
    roles: RoleSet,
    id: string,
    body: CatalogOverrideWrite,
    headers: CreateHeaders,
    act: Act,
  ): Promise<CatalogItemWire> {
    admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const { rate, ...patch } = body;
    const entry = rate === undefined ? null : rateToAppend(rate, scope, 'rate.');
    const route = catalogContract.saveOverride;
    // The item id is in the fingerprint: one key replayed on another item is another request.
    const key = creationKeyOf(headers, act.actorUserId, route, { id, ...body });
    const outcome = await this.prices.saveOverride(
      tenantId,
      scope.marketCode,
      id,
      patch,
      entry,
      act,
      key,
    );
    return this.item(
      tenantId,
      roles,
      refusedOrKeyed(outcome, this.replies, route, tenantId),
      act.now,
    );
  }

  async clearOverride(
    tenantId: string,
    roles: RoleSet,
    id: string,
    act: Act,
  ): Promise<CatalogItemWire> {
    admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const today = { effectiveOn: scope.resolve.pricedOn, currency: scope.currencyCode };
    const refusal = await this.prices.clearOverride(tenantId, scope.marketCode, id, today, act);
    if (refusal !== null) throw refused(refusal);
    return this.item(tenantId, roles, id, act.now);
  }

  async recordRate(
    tenantId: string,
    roles: RoleSet,
    id: string,
    body: RateEntryWrite,
    headers: CreateHeaders,
    act: Act,
  ): Promise<CatalogItemWire> {
    admitWrite(roles);
    const scope = await this.scopeOf(tenantId, act.now);
    const entry = rateToAppend(body, scope, '');
    const route = catalogContract.recordRate;
    const key = creationKeyOf(headers, act.actorUserId, route, { id, ...body });
    const outcome = await this.prices.recordRate(tenantId, scope.marketCode, id, entry, act, key);
    return this.item(
      tenantId,
      roles,
      refusedOrKeyed(outcome, this.replies, route, tenantId),
      act.now,
    );
  }

  async rateEntries(
    tenantId: string,
    id: string,
    page: { readonly limit: number; readonly page: number },
    now: number,
  ): Promise<Paginated<RateEntryWire>> {
    const scope = await this.scopeOf(tenantId, now);
    const ledger = await this.prices.rateParentOf(tenantId, scope.marketCode, id);
    if ('outcome' in ledger) throw refused(ledger);
    if (ledger.parent === null) return { items: [], totalCount: 0 };
    const offset = (page.page - 1) * page.limit;
    const { entries, totalCount } = await this.rates.history(tenantId, ledger.parent, {
      limit: page.limit,
      offset,
    });
    const digits = scope.resolve.minorUnitDigits;
    return { items: entries.map((entry) => rateEntryWire(entry, digits)), totalCount };
  }

  /** The tenant's market, currency and day, and its market's pack, as every act reads them. */
  async scopeOf(tenantId: string, now: number): Promise<Scope> {
    const tenant = await this.slice.tenantOf(tenantId);
    if (tenant === null) throw new Error('the guard admitted a catalog route with no company');
    const pack = (await this.markets.currentPacks()).find(
      (candidate) => candidate.market === tenant.marketCode,
    );
    if (pack === undefined) throw new Error(`no pack is published for market ${tenant.marketCode}`);
    return {
      ...tenant,
      certificationSchemes: pack.certificationSchemes,
      formats: pack.formats,
      resolve: {
        pricedOn: localDate(now, tenant.timezone),
        badgedSchemes: badgedSchemes(pack.certificationSchemes),
        minorUnitDigits: pack.formats.minorUnitDigits,
      },
    };
  }
}

function moneyFor(roles: RoleSet, scope: Scope): MoneyView {
  return { visible: can(roles, MANAGE_CATALOG), minorUnitDigits: scope.resolve.minorUnitDigits };
}

/** The form as stored, each claim held to the market's evidence rule first (`F1-19`, `F1-44`). */
function ownItemOf(form: OwnCatalogItemWrite, scope: Scope): OwnCatalogItemWrite {
  form.certifications.forEach((claim, index) => {
    const verdict = certificationVerdict(scope.certificationSchemes, claim);
    if (verdict === 'held') return;
    const field = verdict === 'undeclared' ? 'scheme' : 'reference';
    throw new ContractException(
      'DOMAIN_RULE_VIOLATION',
      'This market does not hold that certification as entered.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      [{ path: `certifications.${index}.${field}`, issue: verdict }],
    );
  });
  return form;
}
