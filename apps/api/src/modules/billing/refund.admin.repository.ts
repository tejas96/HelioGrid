import { creditNoteDocumentWorkflow } from '@heliogrid/contracts/workflows';
import {
  creditNote,
  creditNoteSequence,
  type Db,
  type DbTransaction,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionStateHistory,
  tenant,
  uuidv7,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type BillingState,
  creditNoteArtefactOf,
  type MarketPack,
  type MinorUnits,
  minorUnits,
  type Tier,
} from '@heliogrid/domain';
import { creditNoteNumber, fiscalYearOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';
import { recordAuditEntry } from '../audit/audit.public';
import type { OwnerAct } from './cancellation.admin.repository';
import { invoiceTotalOf } from './invoice.admin.repository';

/** The states a refund already paid at the gateway can still end and note. */
const REFUNDABLE_AFTER: ReadonlySet<BillingState> = new Set(['active', 'past_due', 'cancelled']);

/** The company's first payment and what it paid for: the one charge a refund can pay back. */
export interface FirstPayment {
  readonly subscriptionId: string;
  readonly state: BillingState;
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  readonly gatewayRef: string | null;
  readonly marketCode: string;
  readonly chargeRef: string;
  readonly amount: MinorUnits;
  readonly paidAt: number;
  readonly invoiceId: string;
  readonly timeZone: string;
  /** The end of the cycle it paid for: an upgrade's charge inside that cycle pays through it too. */
  readonly paysThrough: number;
}

/** A charge a refund pays back, and the invoice its credit note stands against. */
export interface RefundedCharge {
  readonly chargeRef: string;
  readonly amount: MinorUnits;
  readonly invoiceId: string;
}

/** A proration paid back at the gateway, and the refund's ref there. */
export interface ProrationRefund {
  readonly invoiceId: string;
  readonly gatewayRefundRef: string;
}

/** What a refund came to: its credit note, and the outbox event that makes the note's PDF. */
export interface Refunded {
  readonly creditNoteNumber: string;
  /** One per credit note issued now; empty on a retry that found them issued. */
  readonly eventIds: readonly string[];
}

/**
 * The refund's reads and its one transaction (`M12-47`), on the admin path as every billing move
 * is. The first payment is the company's earliest by when it happened: only that cycle refunds.
 */
@Injectable()
export class RefundAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The company's first payment with its invoice; `null` before any charge. */
  async firstPaymentOf(tenantId: string): Promise<FirstPayment | null> {
    const [row] = await this.db
      .select({
        subscriptionId: subscription.id,
        state: subscription.state,
        tier: subscription.tier,
        cycle: subscription.cycle,
        gatewayRef: subscription.gatewayRef,
        marketCode: tenant.marketCode,
        chargeRef: subscriptionPayment.gatewayChargeRef,
        amount: subscriptionPayment.amountMinor,
        paidAt: subscriptionPayment.occurredAt,
        invoiceId: subscriptionInvoice.id,
        timeZone: tenant.timezone,
        paysThrough: subscriptionPayment.paysThrough,
      })
      .from(subscriptionPayment)
      .innerJoin(subscription, eq(subscription.id, subscriptionPayment.subscriptionId))
      .innerJoin(
        subscriptionInvoice,
        and(
          eq(subscriptionInvoice.tenantId, subscriptionPayment.tenantId),
          eq(subscriptionInvoice.paymentId, subscriptionPayment.id),
        ),
      )
      .innerJoin(tenant, eq(tenant.id, subscriptionPayment.tenantId))
      .where(eq(subscriptionPayment.tenantId, tenantId))
      .orderBy(asc(subscriptionPayment.occurredAt), asc(subscriptionPayment.id))
      .limit(1);
    if (row === undefined) return null;
    return {
      ...row,
      amount: minorUnits(row.amount),
      paidAt: row.paidAt.getTime(),
      paysThrough: row.paysThrough.getTime(),
    };
  }

  /**
   * The upgrades' part-cycle charges paid inside the first cycle (`M12-48`): the first cycle's
   * refund pays them back too (`M12-47`). Each pays through the cycle's own end.
   */
  async prorationsOf(tenantId: string, paid: FirstPayment): Promise<RefundedCharge[]> {
    const rows = await this.db
      .select({
        chargeRef: subscriptionPayment.gatewayChargeRef,
        amount: subscriptionPayment.amountMinor,
        invoiceId: subscriptionInvoice.id,
      })
      .from(subscriptionPayment)
      .innerJoin(
        subscriptionInvoice,
        and(
          eq(subscriptionInvoice.tenantId, subscriptionPayment.tenantId),
          eq(subscriptionInvoice.paymentId, subscriptionPayment.id),
        ),
      )
      .where(
        and(
          eq(subscriptionPayment.tenantId, tenantId),
          eq(subscriptionPayment.subscriptionId, paid.subscriptionId),
          eq(subscriptionPayment.paysThrough, new Date(paid.paysThrough)),
          eq(subscriptionInvoice.kind, 'proration'),
        ),
      )
      .orderBy(asc(subscriptionPayment.occurredAt), asc(subscriptionPayment.id));
    return rows.map((row) => ({ ...row, amount: minorUnits(row.amount) }));
  }

  /**
   * The database half, after the gateway paid the money back: the row is `cancelled` with its paid
   * period ended now, the invoice `refunded`, and its credit note issued with its own number, the
   * note's PDF event and the audit entry — in one transaction holding the row `FOR UPDATE`. A
   * retry finds the invoice refunded and answers the note already issued. The money is already
   * back, so a row that moved since the window was read — cancelled from another tab, or a charge
   * failed — is still ended and noted (`REFUNDABLE_AFTER`). `null`: the row is dead, and nothing
   * was written.
   */
  async record(
    tenantId: string,
    paid: FirstPayment,
    refund: {
      readonly gatewayRefundRef: string;
      readonly pack: MarketPack;
      readonly prorations: readonly ProrationRefund[];
    },
    act: OwnerAct,
  ): Promise<Refunded | null> {
    return this.db.transaction(async (tx) => {
      const [held] = await tx
        .select({ state: subscription.state })
        .from(subscription)
        .where(and(eq(subscription.tenantId, tenantId), eq(subscription.id, paid.subscriptionId)))
        .for('update');
      const issued = await creditNoteOf(tx, tenantId, paid.invoiceId);
      if (issued !== null) return { creditNoteNumber: issued, eventIds: [] };
      if (held === undefined || !REFUNDABLE_AFTER.has(held.state)) return null;
      const at = new Date(act.now);
      await tx
        .update(subscription)
        .set({ state: 'cancelled', stateEnteredAt: at, paidPeriodEnd: at })
        .where(eq(subscription.id, paid.subscriptionId));
      await tx.insert(subscriptionStateHistory).values({
        tenantId,
        subscriptionId: paid.subscriptionId,
        state: 'cancelled',
        cause: 'refunded',
        enteredAt: at,
      });
      const first = await refundInvoice(tx, tenantId, paid.invoiceId, refund, act);
      const eventIds = [first.eventId];
      // Every note rides this transaction, so a retry finds all of them issued or none.
      for (const proration of refund.prorations) {
        const noted = await refundInvoice(
          tx,
          tenantId,
          proration.invoiceId,
          {
            gatewayRefundRef: proration.gatewayRefundRef,
            pack: refund.pack,
          },
          act,
        );
        eventIds.push(noted.eventId);
      }
      return { creditNoteNumber: first.number, eventIds };
    });
  }
}

/**
 * One invoice paid back: `refunded`, its credit note issued, the note's PDF event and the audit
 * entry, on the caller's transaction.
 */
async function refundInvoice(
  tx: DbTransaction,
  tenantId: string,
  invoiceId: string,
  refund: { readonly gatewayRefundRef: string; readonly pack: MarketPack },
  act: OwnerAct,
): Promise<{ readonly number: string; readonly eventId: string }> {
  await tx
    .update(subscriptionInvoice)
    .set({ status: 'refunded' })
    .where(and(eq(subscriptionInvoice.tenantId, tenantId), eq(subscriptionInvoice.id, invoiceId)));
  const note = await issueCreditNote(tx, tenantId, invoiceId, refund, act.now);
  const eventId = uuidv7();
  await recordOutboxEvent(tx, tenantId, creditNoteDocumentWorkflow, {
    eventId,
    tenantId,
    creditNoteId: note.id,
  });
  await recordAuditEntry(tx, {
    tenantId,
    eventType: 'billing.refund_issued',
    actorKind: 'tenant_user',
    actorRef: act.actorUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: 'credit_note',
    subjectRef: note.id,
    changePayload: null,
  });
  return { number: note.number, eventId };
}

/** The number of the credit note already issued against an invoice; `null` when there is none. */
async function creditNoteOf(
  tx: DbTransaction,
  tenantId: string,
  invoiceId: string,
): Promise<string | null> {
  const [note] = await tx
    .select({ number: creditNote.number })
    .from(creditNote)
    .where(and(eq(creditNote.tenantId, tenantId), eq(creditNote.invoiceId, invoiceId)))
    .limit(1);
  return note?.number ?? null;
}

/**
 * The scheme's credit note against the invoice, for its whole total (`M12-47`), numbered in the
 * market's credit-note series. The counter row is taken last and in this transaction, so a
 * rollback hands the number back and the series runs without a gap.
 */
async function issueCreditNote(
  tx: DbTransaction,
  tenantId: string,
  invoiceId: string,
  refund: { readonly gatewayRefundRef: string; readonly pack: MarketPack },
  now: number,
): Promise<{ readonly id: string; readonly number: string }> {
  const { pack } = refund;
  const amount = await invoiceTotalOf(tx, invoiceId);
  const fiscalYear = fiscalYearOf(now, pack.formats.timeZone, pack.tax.fiscalYearStartMonth);
  const [taken] = await tx
    .insert(creditNoteSequence)
    .values({ marketCode: pack.market, fiscalYear, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [creditNoteSequence.marketCode, creditNoteSequence.fiscalYear],
      set: { lastNumber: sql`${creditNoteSequence.lastNumber} + 1` },
    })
    .returning({ lastNumber: creditNoteSequence.lastNumber });
  if (taken === undefined)
    throw new Error(`no credit note number for ${pack.market} ${fiscalYear}`);
  const id = uuidv7();
  const number = creditNoteNumber(fiscalYear, taken.lastNumber);
  await tx.insert(creditNote).values({
    id,
    tenantId,
    invoiceId,
    marketCode: pack.market,
    number,
    artefact: creditNoteArtefactOf(pack.tax.platformRegistration !== null),
    amountMinor: amount,
    currencyCode: pack.formats.currency,
    gatewayRefundRef: refund.gatewayRefundRef,
    issuedAt: new Date(now),
  });
  return { id, number };
}
