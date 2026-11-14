import type { SearchResults } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, proposal } from '@heliogrid/db';
import { type SearchQuery as AskedQuery, proposalStandingOf } from '@heliogrid/domain';
import { proposalNumberOf } from '@heliogrid/domain/server';
import { and, count, desc, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import { type LeadReader, leadCustomerJoin, leadScopeWhere } from '../crm/crm.public';
import { dealWon } from '../proposals/proposals.public';

type ProposalHits = NonNullable<SearchResults['proposals']>;

/** A term that names a proposal as its number is written — `PRP-0042`, `prp42` — and its sequence. */
const NUMBER_TERM = /^prp-?0*(\d{1,9})$/;

/** The proposal sequences the query names by number, if any. */
function numbersAsked(asked: AskedQuery): readonly number[] {
  return asked.terms.flatMap((term) => {
    const sequence = NUMBER_TERM.exec(term)?.[1];
    return sequence === undefined ? [] : [Number(sequence)];
  });
}

/**
 * Proposals (`F6-20`, `F6-22`), on the leads the reader's scope reaches — a proposal follows its
 * lead's visibility. Found by its customer's name, number or city, by its own number, and by the
 * words people still type for a priced offer, which domain's `asksForProposals` reads as a query
 * alias and nothing shows: alone they find every one the reader reaches; beside other words,
 * `customers` is matched on those words. Newest first within a rank.
 */
export async function proposalsFound(
  tx: DbTransaction,
  reader: LeadReader,
  asked: AskedQuery,
  customers: { readonly where: SQL; readonly rank: SQL } | null,
  limit: number,
): Promise<ProposalHits> {
  const numbers = numbersAsked(asked);
  const byNumber = numbers.length === 0 ? null : inArray(proposal.number, [...numbers]);
  const named = customers !== null || byNumber !== null;
  if (!(asked.asksForProposals || named)) return { total: 0, items: [] };
  // The word alone asks for every proposal; beside other words, those words still decide.
  const found = named ? or(customers?.where, byNumber ?? undefined) : undefined;
  const where = and(
    eq(proposal.tenantId, reader.tenantId),
    leadScopeWhere(reader.scope, reader.actorId),
    found,
  );
  const won = dealWon(tx);
  const rows = await tx
    .select({
      id: proposal.id,
      number: proposal.number,
      customerName: customer.name,
      city: customer.city,
      status: proposal.status,
      latestVersion: proposal.latestVersion,
      openedAt: proposal.openedAt,
      answer: proposal.answer,
      won: sql<boolean>`${won}`,
    })
    .from(proposal)
    .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId)))
    .innerJoin(customer, leadCustomerJoin)
    .where(where)
    .orderBy(
      // Its own number named is the surest match; then the customer's rank; then the newest.
      ...(byNumber === null ? [] : [desc(byNumber)]),
      ...(customers === null ? [] : [customers.rank]),
      desc(proposal.updatedAt),
      desc(proposal.id),
    )
    .limit(limit);
  const [total] = await tx
    .select({ n: count() })
    .from(proposal)
    .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId)))
    .innerJoin(customer, leadCustomerJoin)
    .where(where);
  return {
    total: total?.n ?? 0,
    items: rows.map((row) => ({
      id: row.id,
      number: row.number === null ? null : proposalNumberOf(row.number),
      customerName: row.customerName,
      city: row.city,
      standing: proposalStandingOf({
        status: row.status,
        generated: row.latestVersion !== null,
        opened: row.openedAt !== null,
        changeAsked: row.answer === 'negotiate',
        won: row.won,
      }),
    })),
  };
}
