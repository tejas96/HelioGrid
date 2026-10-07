import type { TenantScopedDb } from '@heliogrid/db';
import { type SQL, sql } from 'drizzle-orm';
import type { ItemRate } from './catalog.rates.repository';

/** The entry a run wrote for a row, and the entry in force on the same item just before it. */
export interface WrittenRate {
  readonly applied: ItemRate;
  readonly before: ItemRate | null;
}

interface WrittenRateRow extends Record<string, unknown> {
  readonly id: string;
  readonly on: ItemRate['on'];
  readonly amount: string | null;
  readonly currency: string;
  readonly effectiveOn: string;
  readonly sequence: number;
  readonly beforeAmount: string | null;
  readonly beforeCurrency: string | null;
  readonly beforeOn: string | null;
  readonly beforeSequence: number | null;
}

/**
 * Each entry by id with the entry in force on its item just before it: the newest on the same
 * item ordered before it by date, then sequence — the order `ratesInForce` reads the ledger in.
 * Exact because the ledger is append-only and a run never backdates (`T-M01-030f` D3). One
 * statement; an entry first on its item has nothing before it.
 */
export async function writtenRates(
  tx: TenantScopedDb,
  tenantId: string,
  entryIds: readonly string[],
): Promise<Map<string, WrittenRate>> {
  if (entryIds.length === 0) return new Map();
  const ids = sql.join(
    entryIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const entries = await tx.execute<WrittenRateRow>(sql`
    select e.id,
      case when e.tenant_catalog_item_id is null then 'override' else 'own_item' end as "on",
      e.rate_amount::text as amount, e.currency_code as currency,
      e.entry_date::text as "effectiveOn", e.sequence::float8 as sequence,
      b.rate_amount::text as "beforeAmount", b.currency_code as "beforeCurrency",
      b.entry_date::text as "beforeOn", b.sequence::float8 as "beforeSequence"
    from catalog_rate_entry e
    left join lateral (${entryBefore(sql`tenant_catalog_item_id`)}) own on true
    left join lateral (${entryBefore(sql`tenant_catalog_override_id`)}) over on true
    cross join lateral (select coalesce(own.id, over.id) as id) found
    left join catalog_rate_entry b on b.id = found.id
    where e.tenant_id = ${tenantId} and e.id in (${ids})`);
  return new Map(entries.map((entry) => [entry.id, writtenRateOf(entry)]));
}

function writtenRateOf(entry: WrittenRateRow): WrittenRate {
  const { on, amount, currency, effectiveOn, sequence } = entry;
  const { beforeAmount, beforeCurrency, beforeOn, beforeSequence } = entry;
  return {
    applied: { on, amount, currency, effectiveOn, sequence },
    before:
      beforeCurrency === null || beforeOn === null || beforeSequence === null
        ? null
        : {
            on,
            amount: beforeAmount,
            currency: beforeCurrency,
            effectiveOn: beforeOn,
            sequence: beforeSequence,
          },
  };
}

/**
 * The newest entry on `e`'s item ordered before `e`, by one parent column: a top-1 read in the
 * order of that column's `(tenant, parent, entry_date desc, sequence desc)` index. One query per
 * column, since an `or` across the two parents reads neither index in order.
 */
function entryBefore(parent: SQL) {
  return sql`
    select p.id from catalog_rate_entry p
    where p.tenant_id = e.tenant_id and p.${parent} = e.${parent}
      and (p.entry_date, p.sequence) < (e.entry_date, e.sequence)
    order by p.entry_date desc, p.sequence desc
    limit 1`;
}
