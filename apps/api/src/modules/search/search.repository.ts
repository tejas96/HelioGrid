import type { SearchResults } from '@heliogrid/contracts';
import {
  contact,
  customer,
  type DbTransaction,
  lead,
  type TenantPool,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import {
  type SearchQuery as AskedQuery,
  rankSearchHits,
  SEARCH_MATCHES,
  type SearchMatch,
  visibilityIn,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, exists, isNull, type SQL, sql } from 'drizzle-orm';
import { prefixQueryOf } from '../../common/db/prefix-query';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  type LeadReader,
  leadCustomerJoin,
  leadOwner,
  leadScopeWhere,
  memberNameOf,
} from '../crm/crm.public';

/** The groups this module reads itself; the catalog's is the catalog module's own read. */
export type RecordGroups = Omit<SearchResults, 'catalog'>;

/** A group with nothing found. */
export const noHits = { total: 0, items: [] };

/** How a record matches the query: by each of domain's ranked ways, or `null` where none applies. */
type MatchClauses = Readonly<Record<SearchMatch, SQL | null>>;

/** What a phone query asks of the stored numbers: the whole number, and how they begin. */
interface PhoneAsk {
  readonly exact: string | null;
  readonly prefix: string | null;
}

function phoneAskOf(asked: AskedQuery): PhoneAsk {
  return {
    exact: asked.phone?.e164 ?? null,
    // A stored number holds `+` and digits only, so the prefix carries no `like` wildcard.
    prefix: asked.phone === null ? null : `${asked.phone.e164Prefix}%`,
  };
}

/** The matches as one `where`, and their rank in domain's order (`SEARCH_MATCHES`) for `order by`. */
function rankedMatch(clauses: MatchClauses): { readonly any: SQL; readonly rank: SQL } | null {
  const present = SEARCH_MATCHES.flatMap((match, rank) => {
    const clause = clauses[match];
    return clause === null ? [] : [{ clause, rank }];
  });
  if (present.length === 0) return null;
  // Literal places, not parameters: an untyped parameter would make the CASE text-valued.
  const whens = present.map(
    ({ clause, rank }) => sql`when ${clause} then ${sql.raw(String(rank))}`,
  );
  return {
    any: sql`(${sql.join(
      present.map(({ clause }) => clause),
      sql` or `,
    )})`,
    rank: sql`case ${sql.join(whens, sql` `)} else ${sql.raw(String(SEARCH_MATCHES.length))} end`,
  };
}

/** A customer's own number or one of their contacts' — `held` is the comparison on the number. */
function heldNumber(tenantId: string, held: (column: SQL) => SQL): SQL {
  return sql`(${held(sql`${customer.phoneE164}`)} or exists (
    select 1 from ${contact} k where k.tenant_id = ${tenantId} and k.customer_id = ${customer.id}
      and ${held(sql`k.phone_e164`)}))`;
}

/**
 * The customers a query finds, as one id set each arm of which an index serves — the stored
 * number's and a contact's by prefix, name and city by the `simple` terms — and how each ranks.
 */
function customerMatchOf(tenantId: string, asked: AskedQuery) {
  const phone = phoneAskOf(asked);
  const words = prefixQueryOf(asked.terms);
  const arms: SQL[] = [];
  if (phone.prefix !== null) {
    arms.push(
      sql`select ${customer.id} from ${customer} where ${customer.tenantId} = ${tenantId} and ${customer.phoneE164} like ${phone.prefix}`,
      sql`select ${contact.customerId} from ${contact} where ${contact.tenantId} = ${tenantId} and ${contact.phoneE164} like ${phone.prefix}`,
    );
  }
  if (words !== null) {
    arms.push(
      sql`select ${customer.id} from ${customer} where ${customer.tenantId} = ${tenantId} and ${customer.search} @@ to_tsquery('simple', ${words})`,
    );
  }
  const ranked = rankedMatch({
    exact_phone:
      phone.exact === null
        ? null
        : heldNumber(tenantId, (number) => sql`${number} = ${phone.exact}`),
    phone_prefix:
      phone.prefix === null
        ? null
        : heldNumber(tenantId, (number) => sql`${number} like ${phone.prefix}`),
    name_or_city: words === null ? null : sql`${customer.search} @@ to_tsquery('simple', ${words})`,
  });
  if (ranked === null) return null;
  return {
    where: sql`${customer.id} in (${sql.join(arms, sql` union `)})`,
    rank: ranked.rank,
  };
}

/** A customer's contacts' numbers, for domain's ranking of the rows read. */
const contactPhones = sql<string[]>`array(select k.phone_e164 from ${contact} k
  where k.tenant_id = ${customer.tenantId} and k.customer_id = ${customer.id})`;

/**
 * The global search's own groups (`F6-24`, RFC decision 18) on the runtime pool: leads in the
 * reader's lead scope, junk ones too with their state (`M02-55`); customers with a lead in that
 * scope and never a merged one; team members within the people-records scope. Each group counts
 * with its own `where` and ranks by domain's order, newest first within a rank.
 */
@Injectable()
export class SearchRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async records(reader: LeadReader, asked: AskedQuery, limit: number): Promise<RecordGroups> {
    const match = customerMatchOf(reader.tenantId, asked);
    if (match === null) return { leads: noHits, customers: noHits, people: noHits };
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => ({
      leads: await leadsFound(tx, reader, asked, match, limit),
      customers: await customersFound(tx, reader, asked, match, limit),
      people: await peopleFound(tx, reader, asked, limit),
    }));
  }
}

type CustomerMatch = NonNullable<ReturnType<typeof customerMatchOf>>;

async function leadsFound(
  tx: DbTransaction,
  reader: LeadReader,
  asked: AskedQuery,
  match: CustomerMatch,
  limit: number,
): Promise<RecordGroups['leads']> {
  const where = and(
    eq(lead.tenantId, reader.tenantId),
    leadScopeWhere(reader.scope, reader.actorId),
    match.where,
  );
  const rows = await tx
    .select({
      id: lead.id,
      name: customer.name,
      phoneE164: customer.phoneE164,
      city: customer.city,
      stage: lead.stage,
      state: lead.lifecycleState,
      source: lead.source,
      ownerName: memberNameOf(leadOwner),
      contactPhones,
    })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .where(where)
    .orderBy(match.rank, desc(lead.createdAt), desc(lead.id))
    .limit(limit);
  const [total] = await tx
    .select({ n: count() })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .where(where);
  const ranked = rankSearchHits(rows, asked, candidateOfCustomer);
  return { total: total?.n ?? 0, items: ranked.map(({ contactPhones: _, ...row }) => row) };
}

async function customersFound(
  tx: DbTransaction,
  reader: LeadReader,
  asked: AskedQuery,
  match: CustomerMatch,
  limit: number,
): Promise<RecordGroups['customers']> {
  const leadInScope = exists(
    tx
      .select({ id: lead.id })
      .from(lead)
      .where(
        and(
          eq(lead.tenantId, customer.tenantId),
          eq(lead.customerId, customer.id),
          leadScopeWhere(reader.scope, reader.actorId),
        ),
      ),
  );
  const where = and(
    eq(customer.tenantId, reader.tenantId),
    isNull(customer.mergedInto),
    match.where,
    leadInScope,
  );
  const rows = await tx
    .select({
      id: customer.id,
      name: customer.name,
      phoneE164: customer.phoneE164,
      city: customer.city,
      contactPhones,
    })
    .from(customer)
    .where(where)
    .orderBy(match.rank, desc(customer.createdAt), desc(customer.id))
    .limit(limit);
  const [total] = await tx.select({ n: count() }).from(customer).where(where);
  const ranked = rankSearchHits(rows, asked, candidateOfCustomer);
  return { total: total?.n ?? 0, items: ranked.map(({ contactPhones: _, ...row }) => row) };
}

/**
 * Active team members by name or number, within the people-records scope (`F2-14`): every member
 * at `all`, only the searcher at `own`, none at `none`. A member reads by name alone.
 */
async function peopleFound(
  tx: DbTransaction,
  reader: LeadReader,
  asked: AskedQuery,
  limit: number,
): Promise<RecordGroups['people']> {
  const { scope } = visibilityIn(reader.roles, 'people');
  if (scope === 'none') return noHits;
  const phone = phoneAskOf(asked);
  const words = prefixQueryOf(asked.terms);
  const ranked = rankedMatch({
    exact_phone: phone.exact === null ? null : sql`${userAccount.phoneE164} = ${phone.exact}`,
    phone_prefix: phone.prefix === null ? null : sql`${userAccount.phoneE164} like ${phone.prefix}`,
    name_or_city:
      words === null
        ? null
        : sql`to_tsvector('simple', coalesce(${userAccount.name}, '')) @@ to_tsquery('simple', ${words})`,
  });
  if (ranked === null) return noHits;
  const where = and(
    eq(tenantMembership.tenantId, reader.tenantId),
    eq(tenantMembership.status, 'active'),
    scope === 'all' ? undefined : eq(userAccount.id, reader.actorId),
    ranked.any,
  );
  const name = memberNameOf(userAccount);
  const rows = await tx
    .select({ userId: userAccount.id, name, phoneE164: userAccount.phoneE164 })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(where)
    .orderBy(ranked.rank, asc(name), asc(userAccount.id))
    .limit(limit);
  const [total] = await tx
    .select({ n: count() })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(where);
  const hits = rankSearchHits(rows, asked, (row) => ({
    phonesE164: [row.phoneE164],
    name: row.name ?? '',
    city: null,
  }));
  return {
    total: total?.n ?? 0,
    items: hits.map((row) => ({ userId: row.userId, name: row.name ?? row.phoneE164 })),
  };
}

function candidateOfCustomer(row: {
  readonly phoneE164: string;
  readonly contactPhones: readonly string[];
  readonly name: string | null;
  readonly city: string | null;
}) {
  return {
    phonesE164: [row.phoneE164, ...row.contactPhones],
    name: row.name ?? '',
    city: row.city,
  };
}
