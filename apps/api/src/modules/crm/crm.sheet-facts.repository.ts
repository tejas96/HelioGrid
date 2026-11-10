import type { DedupeMatchWire } from '@heliogrid/contracts';
import { contact, customer, type DbTransaction, lead } from '@heliogrid/db';
import { dedupeSheetOf } from '@heliogrid/domain';
import { and, asc, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { leadCustomerJoin, leadOwner, memberNameOf } from './crm.lead-columns.repository';
import { leadScopeWhere } from './crm.scope.repository';
import type { LeadReader } from './internal/reader';

/*
 * Who a number belongs to and the dedupe sheet's facts about them (`M02-07`, `M02-08`, `M02-10`),
 * read once for every place a number meets an existing customer — quick add's match and the import
 * preview's duplicates.
 */

/**
 * Which of a customer's leads stands for them on the dedupe sheet: an open lead before a closed one,
 * then the newest.
 */
export const CURRENT_LEAD_FIRST = [
  asc(sql`coalesce(${lead.lifecycleState} in ('disqualified', 'lost', 'junk'), false)`),
  desc(lead.createdAt),
  desc(lead.id),
];

/**
 * The customers holding any of these numbers — their own number or a contact's — never a merged
 * one: a subquery of `(customer_id, phone_e164)` to select from under an alias.
 */
export function holdersOf(tenantId: string, phones: readonly string[]): SQL {
  const numbers = sql.join(
    phones.map((phone) => sql`${phone}`),
    sql`, `,
  );
  return sql`(
    select ${customer.id} as customer_id, ${customer.phoneE164} as phone_e164 from ${customer}
    where ${customer.tenantId} = ${tenantId} and ${customer.phoneE164} in (${numbers})
      and ${customer.mergedInto} is null
    union
    select k.customer_id, k.phone_e164 from ${contact} k join ${customer} holder on holder.id = k.customer_id
    where k.tenant_id = ${tenantId} and k.phone_e164 in (${numbers}) and holder.merged_into is null
  )`;
}

/**
 * For each of these numbers someone holds, the customer whose lead stands for it on the sheet —
 * the one `phoneMatchOf` would show — in one read. The caller bounds the list (`inBatches`).
 */
export async function currentHoldersOf(
  tx: DbTransaction,
  tenantId: string,
  phones: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (phones.length === 0) return new Map();
  const rows = await tx.execute<{ phone_e164: string; customer_id: string }>(sql`
    select distinct on (held.phone_e164) held.phone_e164, ${lead.customerId} as customer_id
    from ${holdersOf(tenantId, phones)} held
    join ${lead} on ${lead.customerId} = held.customer_id and ${lead.tenantId} = ${tenantId}
    order by held.phone_e164, ${sql.join(CURRENT_LEAD_FIRST, sql`, `)}`);
  return new Map(rows.map((row) => [row.phone_e164, row.customer_id]));
}

/**
 * What the sheet reads of a lead and its customer, the reader's scope deciding `inScope`; read
 * `from lead` with its customer joined (`leadCustomerJoin`) and its owner left-joined (`leadOwner`).
 */
export function sheetFactColumns(reader: LeadReader) {
  return {
    customerId: customer.id,
    leadId: lead.id,
    name: customer.name,
    city: customer.city,
    ownerName: memberNameOf(leadOwner),
    stage: lead.stage,
    lastContactAt: lead.lastActivityAt,
    inScope: sql<boolean>`${leadScopeWhere(reader.scope, reader.actorId)}`,
  };
}

/** A row read with `sheetFactColumns`. */
interface SheetFactRow {
  readonly customerId: string;
  readonly leadId: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly ownerName: string | null;
  readonly stage: DedupeMatchWire['stage'];
  readonly lastContactAt: Date;
  readonly inScope: boolean;
}

/** One lead's facts as this reader may see them: only the three outside their scope (`M02-08`). */
export function sheetFactsOf(top: SheetFactRow, reader: LeadReader): DedupeMatchWire {
  const { record } = dedupeSheetOf(
    { ...top, lastContactAt: top.lastContactAt.getTime() },
    reader.roles,
  );
  const shared = {
    leadId: top.leadId,
    ownerName: record.ownerName,
    stage: record.stage,
    lastContactAt: top.lastContactAt.toISOString(),
  };
  return record.kind === 'visible'
    ? {
        kind: 'visible',
        ...shared,
        customerId: top.customerId,
        name: record.name,
        city: record.city,
      }
    : { kind: 'out_of_scope', ...shared };
}

/**
 * The sheet's facts of each customer's current lead, in one read — a page of the import preview's
 * duplicates (`M02-20`). A customer without a lead names none.
 */
export async function sheetFactsOfCustomers(
  tx: DbTransaction,
  reader: LeadReader,
  customerIds: readonly string[],
): Promise<ReadonlyMap<string, DedupeMatchWire>> {
  if (customerIds.length === 0) return new Map();
  const rows = await tx
    .selectDistinctOn([lead.customerId], sheetFactColumns(reader))
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .where(and(eq(lead.tenantId, reader.tenantId), inArray(lead.customerId, [...customerIds])))
    .orderBy(lead.customerId, ...CURRENT_LEAD_FIRST);
  return new Map(rows.map((row) => [row.customerId, sheetFactsOf(row, reader)]));
}
