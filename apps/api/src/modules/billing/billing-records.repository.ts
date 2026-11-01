import {
  creditNote,
  dunningEvent,
  invoiceLine,
  invoiceLineTax,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionStateHistory,
  type TenantPool,
  type TenantScopedDb,
} from '@heliogrid/db';
import {
  basisPoints,
  type MinorUnits,
  minorUnits,
  type StoredInvoiceLine,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

export interface PageWindow {
  readonly limit: number;
  readonly offset: number;
}

export interface DocumentSearch {
  readonly q?: string;
  readonly status?: 'paid' | 'failed';
}

/** One invoice or credit note; the invoice it bills against names its plan and, for a note, its total. */
export interface DocumentRow {
  readonly id: string;
  readonly document: 'invoice' | 'credit_note';
  readonly number: string;
  readonly status: string | null;
  readonly issuedAt: Date;
  readonly invoiceId: string;
  /** A credit note's own amount; null on an invoice, whose total is its lines'. */
  readonly amountMinor: MinorUnits | null;
  readonly hasPdf: boolean;
}

/** An issued invoice's stored lines, and the plan its plan line sold. */
export interface StoredInvoice {
  readonly lines: StoredInvoiceLine[];
  readonly planPriceId: string | null;
}

/**
 * Billing's records (`M12-46`, `SCR-M12-02`), on the tenant pool: the policy and the predicate both,
 * so a company reads only its own. Each list is ordered by its key then id, and counted over the
 * SAME where (apps/api/CLAUDE.md, List endpoints).
 */
@Injectable()
export class BillingRecordsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Invoices and credit notes newest first, each chip's count under the same search. */
  async documents(tenantId: string, search: DocumentSearch, page: PageWindow) {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await documentsOf(tx, tenantId, search)
        .orderBy(sql`issued_at desc`, sql`id desc`)
        .limit(page.limit)
        .offset(page.offset);
      const all = documentsOf(tx, tenantId, { q: search.q }).as('documents');
      const [counted] = await tx
        .select({
          all: count(),
          paid: sql<number>`count(*) filter (where ${all.status} = 'paid')`.mapWith(Number),
          failed: sql<number>`count(*) filter (where ${all.status} = 'failed')`.mapWith(Number),
        })
        .from(all);
      const counts = {
        all: counted?.all ?? 0,
        paid: counted?.paid ?? 0,
        failed: counted?.failed ?? 0,
      };
      const items: DocumentRow[] = rows.map((row) => ({
        ...row,
        amountMinor: row.amountMinor === null ? null : minorUnits(row.amountMinor),
      }));
      return { items, counts, totalCount: counts[search.status ?? 'all'] };
    });
  }

  /** Each invoice's stored lines and taxes by invoice id, in two reads for the whole set. */
  async storedInvoices(
    tenantId: string,
    invoiceIds: readonly string[],
  ): Promise<ReadonlyMap<string, StoredInvoice>> {
    if (invoiceIds.length === 0) return new Map();
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const lines = await tx
        .select({
          id: invoiceLine.id,
          invoiceId: invoiceLine.invoiceId,
          planPriceId: invoiceLine.planPriceId,
          taxable: invoiceLine.taxableMinor,
          rate: invoiceLine.rateBasisPoints,
        })
        .from(invoiceLine)
        .where(
          and(eq(invoiceLine.tenantId, tenantId), inArray(invoiceLine.invoiceId, [...invoiceIds])),
        )
        .orderBy(invoiceLine.invoiceId, invoiceLine.position);
      const taxes =
        lines.length === 0
          ? []
          : await tx
              .select({
                lineId: invoiceLineTax.lineId,
                code: invoiceLineTax.code,
                amount: invoiceLineTax.amountMinor,
              })
              .from(invoiceLineTax)
              .where(
                and(
                  eq(invoiceLineTax.tenantId, tenantId),
                  inArray(
                    invoiceLineTax.lineId,
                    lines.map((line) => line.id),
                  ),
                ),
              )
              .orderBy(invoiceLineTax.lineId, invoiceLineTax.code);
      const stored = new Map<string, StoredInvoice>();
      for (const line of lines) {
        const invoice = stored.get(line.invoiceId) ?? { lines: [], planPriceId: null };
        invoice.lines.push({
          taxableAmount: minorUnits(line.taxable),
          rateBasisPoints: line.rate === null ? null : basisPoints(line.rate),
          components: taxes
            .filter((tax) => tax.lineId === line.id)
            .map((tax) => ({ code: tax.code, amount: minorUnits(tax.amount) })),
        });
        stored.set(line.invoiceId, {
          lines: invoice.lines,
          planPriceId: invoice.planPriceId ?? line.planPriceId,
        });
      }
      return stored;
    });
  }

  /** The notices told, newest first, with the payment that cleared each. */
  async reminders(tenantId: string, page: PageWindow) {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = eq(dunningEvent.tenantId, tenantId);
      const items = await tx
        .select({
          id: dunningEvent.id,
          notice: dunningEvent.notice,
          firedAt: dunningEvent.firedAt,
          clearedAt: dunningEvent.clearedAt,
          paidAt: subscriptionPayment.occurredAt,
        })
        .from(dunningEvent)
        .leftJoin(
          subscriptionPayment,
          and(
            eq(subscriptionPayment.tenantId, dunningEvent.tenantId),
            eq(subscriptionPayment.id, dunningEvent.clearedByPayment),
          ),
        )
        .where(where)
        .orderBy(desc(dunningEvent.firedAt), desc(dunningEvent.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(dunningEvent).where(where);
      return { items, totalCount: total?.n ?? 0 };
    });
  }

  /** Every state any of the company's subscriptions entered, newest written first (`id`). */
  async history(tenantId: string, page: PageWindow) {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = eq(subscriptionStateHistory.tenantId, tenantId);
      const items = await tx
        .select({
          id: subscriptionStateHistory.id,
          state: subscriptionStateHistory.state,
          cause: subscriptionStateHistory.cause,
          enteredAt: subscriptionStateHistory.enteredAt,
        })
        .from(subscriptionStateHistory)
        .where(where)
        .orderBy(desc(subscriptionStateHistory.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(subscriptionStateHistory).where(where);
      return { items, totalCount: total?.n ?? 0 };
    });
  }
}

/** A number holding the search, as typed: `%` and `_` match themselves. */
function numberHolds(column: Parameters<typeof ilike>[0], q: string): SQL {
  return ilike(column, `%${q.replace(/[\\%_]/g, (character) => `\\${character}`)}%`);
}

/**
 * Both kinds of document as one list on `*_tenant_issued_idx`. A status asks for invoices alone:
 * a credit note has none.
 */
function documentsOf(tx: TenantScopedDb, tenantId: string, search: DocumentSearch) {
  const invoices = tx
    .select({
      id: subscriptionInvoice.id,
      document: sql<'invoice' | 'credit_note'>`'invoice'`.as('document'),
      number: subscriptionInvoice.number,
      status: sql<string | null>`${subscriptionInvoice.status}::text`.as('status'),
      issuedAt: subscriptionInvoice.issuedAt,
      invoiceId: sql<string>`${subscriptionInvoice.id}`.as('invoice_id'),
      amountMinor: sql<number | null>`null::bigint`.mapWith(Number).as('amount_minor'),
      hasPdf: sql<boolean>`${subscriptionInvoice.pdfFileId} is not null`.as('has_pdf'),
    })
    .from(subscriptionInvoice)
    .where(
      and(
        eq(subscriptionInvoice.tenantId, tenantId),
        search.q === undefined ? undefined : numberHolds(subscriptionInvoice.number, search.q),
        search.status === undefined ? undefined : eq(subscriptionInvoice.status, search.status),
      ),
    );
  const notes = tx
    .select({
      id: creditNote.id,
      document: sql<'invoice' | 'credit_note'>`'credit_note'`.as('document'),
      number: creditNote.number,
      status: sql<string | null>`null::text`.as('status'),
      issuedAt: creditNote.issuedAt,
      invoiceId: sql<string>`${creditNote.invoiceId}`.as('invoice_id'),
      amountMinor: sql<number | null>`${creditNote.amountMinor}`.mapWith(Number).as('amount_minor'),
      hasPdf: sql<boolean>`${creditNote.pdfFileId} is not null`.as('has_pdf'),
    })
    .from(creditNote)
    .where(
      and(
        eq(creditNote.tenantId, tenantId),
        search.q === undefined ? undefined : numberHolds(creditNote.number, search.q),
        // A status chip holds invoices alone; no credit note matches one.
        search.status === undefined ? undefined : sql`false`,
      ),
    );
  return invoices.unionAll(notes);
}
