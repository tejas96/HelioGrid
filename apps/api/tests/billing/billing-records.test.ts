import { randomUUID } from 'node:crypto';
import {
  type BillingDocuments,
  type BillingHistory,
  type BillingReminders,
  billingDocumentsSchema,
  billingHistorySchema,
  billingRemindersSchema,
  fileDownloadSchema,
} from '@heliogrid/contracts';
import {
  type BillingState,
  MS_PER_DAY,
  minorUnits,
  PAST_DUE_GRACE_DAYS,
  type SubscriptionCause,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvoiceDocumentService } from '../../src/modules/billing/invoice-document.service';
import { skipWithoutHarness } from '../support/http';
import {
  type HomeBench as Bench,
  daysFromNow,
  decimal,
  HomeBench,
  type HomeCompany,
  iso,
} from './home-bench';
import { aPlan, collectedFor } from './support';

const skip = skipWithoutHarness(
  'BILLING RECORDS PROOF',
  'The invoices list, its PDFs, the reminders and the plan history are UNPROVEN in this run.',
);

const A_PDF = Buffer.from('%PDF-1.7\n%stand-in for the renderer\n').toString('base64');
const PLAN_TOTAL = decimal(collectedFor('growth', 'monthly'));
const REFUNDED_MINOR = 150_000;
const REFUNDED = minorUnits(REFUNDED_MINOR);
const SERIES_DIGITS = 6;

// The company's year, in days before now: a trial, two paid months, a failure and its halt.
const TRIAL_DAYS_AGO = 90;
const FIRST_PAID_DAYS_AGO = 70;
const EARLIER_FAILURE_DAYS_AGO = 50;
const SECOND_PAID_DAYS_AGO = 40;
const FAILED_DAYS_AGO = 17;
const HALTED_DAYS_AGO = FAILED_DAYS_AGO - PAST_DUE_GRACE_DAYS;
/** A charge made inside the grace undid the halt, entering `active` before the halt it undid. */
const UNDONE_DAYS_AGO = 12;
const REFUNDED_DAYS_AGO = 5;
/** The sweep clears a notice a moment after the payment that cleared it lands. */
const CLEARED_AFTER_MS = 60_000;

const at = (daysAgo: number) => daysFromNow(-daysAgo);
/** The dunning ladder's second weekly win-back, in days from the failure it began with (`M12-39`). */
const TWO_WEEKS_DAYS = 14;
const SECOND_WIN_BACK_DAYS = PAST_DUE_GRACE_DAYS + TWO_WEEKS_DAYS;
/** A page of the history shorter than the history, so the order is read across a cut. */
const HISTORY_PAGE = 4;

describe.skipIf(skip)('Billing records: invoices, reminders, history (M12-46, D3)', () => {
  let bench: Bench;
  let held: HomeCompany;
  /** Each run's own series, so a search for it finds only this company's documents. */
  const series = `Rec${randomUUID().slice(0, SERIES_DIGITS)}`;
  const docs: Record<'first' | 'second' | 'failed' | 'note', { id: string; number: string }> =
    {} as never;
  const history: string[] = [];

  beforeAll(async () => {
    bench = await HomeBench.open();
    held = await bench.aCompany('Surya Records');
    const plan = await aPlan(bench.pools.admin.db, 'growth', 'monthly');
    const halted = { enteredAt: at(HALTED_DAYS_AGO), paidPeriodEnd: at(FAILED_DAYS_AGO) };
    await bench.put(held, 'halted', halted, plan);
    const first = await bench.aPayment(
      held,
      plan,
      at(FIRST_PAID_DAYS_AGO),
      at(SECOND_PAID_DAYS_AGO),
    );
    const second = await bench.aPayment(held, plan, at(SECOND_PAID_DAYS_AGO), at(FAILED_DAYS_AGO));
    docs.first = await bench.anInvoice(held, plan, {
      status: 'refunded',
      issuedAt: at(FIRST_PAID_DAYS_AGO),
      paymentId: first,
      number: `HG/${series}/001`,
    });
    docs.second = await bench.anInvoice(held, plan, {
      status: 'paid',
      issuedAt: at(SECOND_PAID_DAYS_AGO),
      paymentId: second,
      number: `HG/${series}/002`,
    });
    docs.failed = await bench.anInvoice(held, plan, {
      status: 'failed',
      issuedAt: at(FAILED_DAYS_AGO),
      number: `HG/${series}/003`,
    });
    docs.note = await bench.aCreditNote(held, docs.first.id, REFUNDED, at(REFUNDED_DAYS_AGO));
    const entered = (state: BillingState, cause: SubscriptionCause, daysAgo: number) =>
      bench.aStateEntered(held, state, cause, at(daysAgo));
    history.push(await entered('trialing', 'trial_started', TRIAL_DAYS_AGO));
    history.push(await entered('active', 'paid', FIRST_PAID_DAYS_AGO));
    history.push(await entered('past_due', 'charge_failed', FAILED_DAYS_AGO));
    history.push(await entered('halted', 'grace_expired', HALTED_DAYS_AGO));
    history.push(await entered('active', 'paid', UNDONE_DAYS_AGO));
    await bench.aNotice(held, 'payment_failed', at(EARLIER_FAILURE_DAYS_AGO), {
      at: at(SECOND_PAID_DAYS_AGO) + CLEARED_AFTER_MS,
      paymentId: second,
    });
    await bench.aNotice(held, 'payment_failed', at(FAILED_DAYS_AGO));
    await bench.aNotice(held, 'halted', at(HALTED_DAYS_AGO));
  });

  afterAll(async () => {
    await bench?.close();
  });

  const documents = async (query: string) => {
    const reply = await bench.get<BillingDocuments>(
      `/billing/documents${query}`,
      await held.owner(),
    );
    expect(reply.status).toBe(HttpStatus.OK);
    return billingDocumentsSchema.parse(reply.body);
  };

  it('a halted company lists every invoice and signs each PDF', async () => {
    const files = bench.http.app.get(InvoiceDocumentService);
    for (const invoice of [docs.first, docs.second, docs.failed]) {
      await files.attach(
        { tenantId: held.tenantId, invoiceId: invoice.id, pdfBase64: A_PDF },
        Date.now(),
      );
    }

    const listed = await documents('');

    expect(listed.currencyCode).toBe('INR');
    expect(listed.items).toEqual([
      {
        id: docs.note.id,
        document: 'credit_note',
        number: docs.note.number,
        status: null,
        issuedAt: iso(at(REFUNDED_DAYS_AGO)),
        tier: 'growth',
        cycle: 'monthly',
        total: decimal(REFUNDED),
        hasPdf: false,
      },
      ...[
        { doc: docs.failed, status: 'failed', issued: at(FAILED_DAYS_AGO) },
        { doc: docs.second, status: 'paid', issued: at(SECOND_PAID_DAYS_AGO) },
        { doc: docs.first, status: 'refunded', issued: at(FIRST_PAID_DAYS_AGO) },
      ].map(({ doc, status, issued }) => ({
        id: doc.id,
        document: 'invoice',
        number: doc.number,
        status,
        issuedAt: iso(issued),
        tier: 'growth',
        cycle: 'monthly',
        total: PLAN_TOTAL,
        hasPdf: true,
      })),
    ]);
    expect(listed.totalCount).toBe(Object.values(docs).length);
    for (const invoice of [docs.first, docs.second, docs.failed]) {
      const signed = await bench.get(
        `/billing/documents/${invoice.id}/download-url`,
        await held.owner(),
      );
      expect(signed.status).toBe(HttpStatus.OK);
      expect(fileDownloadSchema.parse(signed.body).url).toContain(invoice.id);
    }
    // A credit note whose PDF is not made yet offers no link.
    const unmade = await bench.get(
      `/billing/documents/${docs.note.id}/download-url`,
      await held.owner(),
    );
    expect(unmade.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a search matches part of a number in any case, and each chip counts under it', async () => {
    const searched = await documents(`?q=${series.toLowerCase()}/00`);
    const paid = await documents(`?q=${series}&status=paid`);
    const failed = await documents(`?q=${series}&status=failed`);
    const none = await documents('?q=no-such-number');

    expect(searched.items.map((row) => row.number)).toEqual([
      docs.failed.number,
      docs.second.number,
      docs.first.number,
    ]);
    expect(searched.counts).toEqual({ all: 3, paid: 1, failed: 1 });
    expect(searched.totalCount).toBe(searched.items.length);
    expect(paid.items.map((row) => row.id)).toEqual([docs.second.id]);
    expect(paid.totalCount).toBe(1);
    expect(failed.items.map((row) => row.id)).toEqual([docs.failed.id]);
    expect(none).toMatchObject({
      items: [],
      totalCount: 0,
      counts: { all: 0, paid: 0, failed: 0 },
    });
  });

  it('pages run newest first and count over the whole list', async () => {
    const first = await documents('?limit=2&page=1');
    const second = await documents('?limit=2&page=2');

    expect(first.items.map((row) => row.id)).toEqual([docs.note.id, docs.failed.id]);
    expect(second.items.map((row) => row.id)).toEqual([docs.second.id, docs.first.id]);
    const all = Object.values(docs).length;
    expect([first.totalCount, second.totalCount]).toEqual([all, all]);
  });

  it('the plan history reads in the order it was written, never by when each state took effect', async () => {
    const reply = await bench.get<BillingHistory>(
      `/billing/history?limit=${HISTORY_PAGE}`,
      await held.owner(),
    );

    const read = billingHistorySchema.parse(reply.body);
    expect(read.items.map((entry) => entry.id)).toEqual(
      [...history].reverse().slice(0, HISTORY_PAGE),
    );
    expect(read.items[0]).toEqual({
      id: history[4],
      state: 'active',
      cause: 'paid',
      enteredAt: iso(at(UNDONE_DAYS_AGO)),
    });
    expect(read.totalCount).toBe(history.length);
  });

  it('the reminders show when a payment cleared each, and the next notice the ladder tells', async () => {
    const reply = await bench.get<BillingReminders>('/billing/reminders', await held.owner());

    const read = billingRemindersSchema.parse(reply.body);
    expect(
      read.items.map(({ notice, firedAt, paidAt: paid }) => ({ notice, firedAt, paid })),
    ).toEqual([
      { notice: 'halted', firedAt: iso(at(HALTED_DAYS_AGO)), paid: null },
      { notice: 'payment_failed', firedAt: iso(at(FAILED_DAYS_AGO)), paid: null },
      {
        notice: 'payment_failed',
        firedAt: iso(at(EARLIER_FAILURE_DAYS_AGO)),
        paid: iso(at(SECOND_PAID_DAYS_AGO)),
      },
    ]);
    // Halted 10 days ago: the weekly win-backs fall 14 and 21 days after the ladder's halt.
    expect(read.next).toEqual({
      notice: 'win_back',
      dueAt: iso(at(FAILED_DAYS_AGO) + SECOND_WIN_BACK_DAYS * MS_PER_DAY),
    });
    expect(read.totalCount).toBe(read.items.length);
  });
});
