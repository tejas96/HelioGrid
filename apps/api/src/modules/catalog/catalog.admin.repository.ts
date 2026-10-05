import {
  catalogItem,
  catalogItemCertification,
  catalogItemMarketAvailability,
  type Db,
  type DbTransaction,
  uuidv7,
} from '@heliogrid/db';
import type { PlatformCatalogItem } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { inArray, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * One platform item as the publish command states it: domain's platform item without the facts
 * the store assigns (its id, its archived flag), plus the markets it is sold in. Its kind is the
 * envelope's own (`spec.kind`), spelled once. Specs and claims, never a price (`M01-37`).
 */
export type PlatformItemToPublish = Omit<PlatformCatalogItem, 'id' | 'archived'> & {
  readonly markets: readonly string[];
};

/** What one publish wrote: the items inserted or changed, and the junction rows added. */
export interface PlatformPublishOutcome {
  readonly items: number;
  readonly availabilities: number;
  readonly certifications: number;
}

/**
 * Serialises publishers of the platform book, as the pack's lock does (`market.admin.repository.ts`).
 * Fixed forever: a changed key excludes nobody running the old one. It fits INT4.
 */
const PUBLISH_LOCK_KEY = 827_012_503;

/**
 * The ONE writer of the platform catalog (`M01-46`): it rides the admin pool because the book is
 * platform-curated reference data no tenant role may write — `app_user` holds SELECT alone.
 * Four statements for the whole list, whatever its length: one upsert on the natural key, one
 * read of the ids, one insert of the market rows and one of the claims; a re-run writes nothing,
 * and a junction row is added where absent and never removed here (curation tooling is out of
 * this slice).
 */
@Injectable()
export class CatalogAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async publishItems(
    items: readonly PlatformItemToPublish[],
    now: number,
  ): Promise<PlatformPublishOutcome> {
    if (items.length === 0) return { items: 0, availabilities: 0, certifications: 0 };
    const at = new Date(now);
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${PUBLISH_LOCK_KEY}::int4, hashtext('platform-catalog'))`,
      );
      const written = await upsertItems(tx, items, at);
      const stored = await withIds(tx, items);
      const availabilities = await addMarkets(tx, stored);
      const certifications = await addCertifications(tx, stored);
      return { items: written, availabilities, certifications };
    });
  }
}

/** An item beside the id the store holds it under. */
interface StoredItem {
  readonly id: string;
  readonly item: PlatformItemToPublish;
}

/** The one key a listed model has: its kind, brand and model, byte for byte (`F3-08`). */
function naturalKey(kind: string, brand: string, model: string): string {
  return `${kind}\u0000${brand}\u0000${model}`;
}

/**
 * Every row in one statement: inserted when new, updated only when its spec, provenance or
 * availability differs — jsonb compares structurally, so a re-ordered key is no difference — and
 * left alone otherwise, so `updated_at` moves only on a real change. The rows returned are the
 * ones written.
 */
async function upsertItems(
  tx: DbTransaction,
  items: readonly PlatformItemToPublish[],
  at: Date,
): Promise<number> {
  const changed = await tx
    .insert(catalogItem)
    .values(
      items.map((item) => ({
        id: uuidv7(),
        componentKind: item.spec.kind,
        brand: item.brand,
        model: item.model,
        spec: item.spec,
        provenanceLabel: item.provenance,
        availability: item.availability,
        archived: false,
        createdAt: at,
        updatedAt: at,
      })),
    )
    .onConflictDoUpdate({
      target: [catalogItem.componentKind, catalogItem.brand, catalogItem.model],
      set: {
        spec: sql`excluded.spec`,
        provenanceLabel: sql`excluded.provenance_label`,
        availability: sql`excluded.availability`,
        updatedAt: sql`excluded.updated_at`,
      },
      setWhere: sql`${catalogItem.spec} is distinct from excluded.spec
        or ${catalogItem.provenanceLabel} is distinct from excluded.provenance_label
        or ${catalogItem.availability} is distinct from excluded.availability`,
    })
    .returning({ id: catalogItem.id });
  return changed.length;
}

/**
 * Every listed model beside its id, read back in one statement over the natural key — the
 * parameters cast to the column's type, so the key's index serves all three columns.
 */
async function withIds(
  tx: DbTransaction,
  items: readonly PlatformItemToPublish[],
): Promise<readonly StoredItem[]> {
  const rows = await tx
    .select({
      id: catalogItem.id,
      kind: catalogItem.componentKind,
      brand: catalogItem.brand,
      model: catalogItem.model,
    })
    .from(catalogItem)
    .where(
      inArray(
        sql`(${catalogItem.componentKind}, ${catalogItem.brand}, ${catalogItem.model})`,
        items.map((item) => sql`(${item.spec.kind}::component_kind, ${item.brand}, ${item.model})`),
      ),
    );
  const idOf = new Map(rows.map((row) => [naturalKey(row.kind, row.brand, row.model), row.id]));
  return items.map((item) => {
    const id = idOf.get(naturalKey(item.spec.kind, item.brand, item.model));
    if (id === undefined) {
      throw new Error(`${item.brand} ${item.model} vanished inside its own publish`);
    }
    return { id, item };
  });
}

/** A market row for every listed item, where absent. */
async function addMarkets(tx: DbTransaction, stored: readonly StoredItem[]): Promise<number> {
  const added = await tx
    .insert(catalogItemMarketAvailability)
    .values(
      stored.flatMap(({ id, item }) =>
        item.markets.map((marketCode) => ({ catalogItemId: id, marketCode })),
      ),
    )
    .onConflictDoNothing()
    .returning({ marketCode: catalogItemMarketAvailability.marketCode });
  return added.length;
}

/** A claim row for every listed certification, where absent; a list without claims inserts nothing. */
async function addCertifications(
  tx: DbTransaction,
  stored: readonly StoredItem[],
): Promise<number> {
  const claims = stored.flatMap(({ id, item }) =>
    item.certifications.map((claim) => ({
      catalogItemId: id,
      schemeKey: claim.scheme,
      reference: claim.reference,
    })),
  );
  if (claims.length === 0) return 0;
  const added = await tx
    .insert(catalogItemCertification)
    .values(claims)
    .onConflictDoNothing()
    .returning({ schemeKey: catalogItemCertification.schemeKey });
  return added.length;
}
