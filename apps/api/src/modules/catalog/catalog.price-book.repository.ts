import {
  priceBookRate,
  priceBookVersion,
  type TenantPool,
  type TenantScopedDb,
  userAccount,
} from '@heliogrid/db';
import type { AuthoredPerLanguage, PriceBookRateBasis } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, max, type SQL, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';

/** A rate as stored: the amount is the column's numeric text, in its version's currency. */
export interface StoredRate {
  readonly name: AuthoredPerLanguage<string>;
  readonly basis: PriceBookRateBasis;
  readonly amount: string;
}

/** A version as the list and the one-version read name it; the margin is the column's text. */
export interface VersionSummary {
  readonly id: string;
  readonly number: number;
  readonly publishedAt: Date;
  readonly publishedBy: { readonly id: string; readonly name: string | null };
  readonly note: string;
  readonly defaultMarginPct: string;
  readonly currencyCode: string;
  readonly rateCount: number;
  readonly active: boolean;
}

export interface VersionToPublish {
  readonly note: string;
  readonly defaultMarginPct: string;
  readonly currencyCode: string;
  readonly rates: readonly StoredRate[];
}

/**
 * The price book on the runtime pool (`M01-48`): versions and their rates are append-only, so
 * nothing here updates or deletes. A publish holds the tenant's price-book lock, so two publishes
 * at once land one after the other with the next two numbers (§M01.5 edge cases).
 */
@Injectable()
export class CatalogPriceBookRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The version in force — the highest number — with its rates, or null before the first publish. */
  async newest(
    tenantId: string,
  ): Promise<{ readonly version: VersionSummary; readonly rates: readonly StoredRate[] } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [version] = await summariesOf(tx, tenantId, undefined, { limit: 1, offset: 0 });
      return version === undefined
        ? null
        : { version, rates: await ratesOf(tx, tenantId, version.id) };
    });
  }

  /** A page of versions, newest first, counted with the same tenant predicate. */
  async page(
    tenantId: string,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{ readonly versions: readonly VersionSummary[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const versions = await summariesOf(tx, tenantId, undefined, page);
      const [total] = await tx
        .select({ value: count() })
        .from(priceBookVersion)
        .where(eq(priceBookVersion.tenantId, tenantId));
      return { versions, totalCount: total?.value ?? 0 };
    });
  }

  /** One version and its rates, or null when this tenant has no such version. */
  async version(
    tenantId: string,
    id: string,
  ): Promise<{ readonly version: VersionSummary; readonly rates: readonly StoredRate[] } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [version] = await summariesOf(tx, tenantId, eq(priceBookVersion.id, id), {
        limit: 1,
        offset: 0,
      });
      return version === undefined ? null : { version, rates: await ratesOf(tx, tenantId, id) };
    });
  }

  async publish(
    tenantId: string,
    toPublish: VersionToPublish,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<string>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: priceBookVersion.id, fingerprint: priceBookVersion.creationFingerprint })
          .from(priceBookVersion)
          .where(
            and(eq(priceBookVersion.tenantId, tenantId), eq(priceBookVersion.creationKey, key.key)),
          )
          .limit(1);
        if (made) return replayOf(made.id, made.fingerprint, key);
      }
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`price-book:${tenantId}`}))`);
      const [newest] = await tx
        .select({ number: max(priceBookVersion.versionNumber) })
        .from(priceBookVersion)
        .where(eq(priceBookVersion.tenantId, tenantId));
      const [version] = await tx
        .insert(priceBookVersion)
        .values({
          tenantId,
          versionNumber: (newest?.number ?? 0) + 1,
          defaultMarginPct: toPublish.defaultMarginPct,
          currencyCode: toPublish.currencyCode,
          note: toPublish.note,
          publishedAt: new Date(act.now),
          publishedBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: priceBookVersion.id });
      if (!version) throw new Error('price_book_version insert returned no row');
      if (toPublish.rates.length > 0) {
        await tx.insert(priceBookRate).values(
          toPublish.rates.map((rate, position) => ({
            tenantId,
            priceBookVersionId: version.id,
            position,
            ...rate,
          })),
        );
      }
      await recordAuditEntry(
        tx,
        memberAct(
          'price_book.version_published',
          tenantId,
          { kind: 'price_book_version', ref: version.id },
          act,
        ),
      );
      return { outcome: 'created', row: version.id };
    });
  }
}

/**
 * Versions newest first, each with its publisher's name, its rate count and whether it is the one
 * in force. The count and the newest number are index-backed subqueries on `(tenant_id, …)`.
 */
async function summariesOf(
  tx: TenantScopedDb,
  tenantId: string,
  only: SQL | undefined,
  page: { readonly limit: number; readonly offset: number },
): Promise<VersionSummary[]> {
  const rows = await tx
    .select({
      id: priceBookVersion.id,
      number: priceBookVersion.versionNumber,
      publishedAt: priceBookVersion.publishedAt,
      publisherId: priceBookVersion.publishedBy,
      publisherName: userAccount.name,
      note: priceBookVersion.note,
      defaultMarginPct: priceBookVersion.defaultMarginPct,
      currencyCode: priceBookVersion.currencyCode,
      rateCount: sql<number>`(
        select count(*) from ${priceBookRate}
        where ${priceBookRate.tenantId} = ${tenantId}
          and ${priceBookRate.priceBookVersionId} = ${priceBookVersion.id}
      )::int`,
      active: sql<boolean>`${priceBookVersion.versionNumber} = (
        select max(newest.version_number) from ${priceBookVersion} as newest
        where newest.tenant_id = ${tenantId}
      )`,
    })
    .from(priceBookVersion)
    .leftJoin(userAccount, eq(userAccount.id, priceBookVersion.publishedBy))
    .where(and(eq(priceBookVersion.tenantId, tenantId), only))
    .orderBy(desc(priceBookVersion.versionNumber), desc(priceBookVersion.id))
    .limit(page.limit)
    .offset(page.offset);
  return rows.map(({ publisherId, publisherName, ...row }) => ({
    ...row,
    publishedBy: { id: publisherId, name: publisherName },
  }));
}

/** One version's rates in the order they were published. */
async function ratesOf(
  tx: TenantScopedDb,
  tenantId: string,
  versionId: string,
): Promise<StoredRate[]> {
  return tx
    .select({ name: priceBookRate.name, basis: priceBookRate.basis, amount: priceBookRate.amount })
    .from(priceBookRate)
    .where(
      and(eq(priceBookRate.tenantId, tenantId), eq(priceBookRate.priceBookVersionId, versionId)),
    )
    .orderBy(asc(priceBookRate.position));
}
