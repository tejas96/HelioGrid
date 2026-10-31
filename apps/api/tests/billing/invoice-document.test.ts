import { randomUUID } from 'node:crypto';
import {
  businessProfile,
  file,
  orchestrationOutbox,
  storageGaugeSnapshot,
  subscription,
  subscriptionInvoice,
  taxRegistration,
  tenant,
} from '@heliogrid/db';
import {
  type ChargeSucceeded,
  formatMinorUnits,
  IN_PACK,
  type MarketPack,
  MS_PER_DAY,
  minorUnits,
  successEffect,
  type UiLanguage,
} from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { and, eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ChargeAdminRepository } from '../../src/modules/billing/charge.admin.repository';
import { InvoiceDocumentAdminRepository } from '../../src/modules/billing/invoice-document.admin.repository';
import { InvoiceDocumentService } from '../../src/modules/billing/invoice-document.service';
import { UsageAdminRepository } from '../../src/modules/billing/usage.admin.repository';
import { FileDocumentService } from '../../src/modules/file/file.documents.service';
import { FileRepository } from '../../src/modules/file/file.repository';
import { MemoryObjectStore } from '../../src/modules/file/internal/object-store.memory';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { marketsOf, publishIndiaPack } from '../support/market';
import { aPlan, collectedFor, entitlementServiceOf } from './support';

/**
 * The invoice PDF (`M12-44`, `M12-45`), against a migrated database: the issue hands the work to
 * the outbox in its own transaction, and the workflow's two api steps write the page and keep the
 * PDF once. The render between them is the worker's (`apps/worker/tests/documents`); here a fixed
 * PDF stands in for its output. Every moment sits in 1979, a fiscal year no other suite issues in.
 */

const skip = skipWithoutDatabase(
  'INVOICE DOCUMENT PROOF',
  'The invoice PDF, its page and its one file row are UNPROVEN in this run.',
);

const PAID_AT = Date.parse('1979-06-03T06:00:00Z');
const PERIOD_DAYS = 30;
const PAYS_THROUGH = PAID_AT + PERIOD_DAYS * MS_PER_DAY;
/** The payment is recorded a minute after the gateway took it. */
const MS_PER_MINUTE = 60_000;
const ISSUED_AT = PAID_AT + MS_PER_MINUTE;
const TRIAL_END_FAR_AWAY = Date.parse('2100-01-01T00:00:00Z');
const OURS = { registrationType: 'IN_GST', value: '27AAACH7409R1ZV' };
const REGISTERED: MarketPack = { ...IN_PACK, tax: { ...IN_PACK.tax, platformRegistration: OURS } };
const THEIRS = '29ABCDE1234F1Z5';
/** What the renderer hands back: the bytes of a PDF, whatever it prints. */
const A_PDF = Buffer.from('%PDF-1.7\n%stand-in for the renderer\n').toString('base64');
const A_LATER_PDF = Buffer.from('%PDF-1.7\n%rendered again, a moment later\n').toString('base64');
const SUPPLIER = IN_PACK.tax.platformSupplier;

describe.skipIf(skip)('the invoice PDF (M12-44, M12-45)', () => {
  let pools: ReturnType<typeof openPools>;
  let companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  const documentsOf = (store = new MemoryObjectStore()) =>
    new InvoiceDocumentService(
      new InvoiceDocumentAdminRepository(pools.admin.db),
      marketsOf(pools),
      new FileDocumentService(new FileRepository(pools.tenants), store),
    );

  /** A Growth-monthly company in Bengaluru whose charge has landed on `pack`; its invoice's id. */
  async function aPaidInvoice(
    pack: MarketPack,
    { language = 'en' }: { readonly language?: UiLanguage } = {},
  ): Promise<{ tenantId: string; invoiceId: string }> {
    const company = aCompany(`Suntech Solar ${randomUUID()}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    const { tenantId } = company;
    await pools.admin.db
      .update(tenant)
      .set({ defaultLanguage: language })
      .where(eq(tenant.id, tenantId));
    await pools.admin.db.insert(businessProfile).values({
      tenantId,
      address: '14 <Lake> Road & Co',
      postalCode: '560001',
      createdAt: new Date(PAID_AT),
      updatedAt: new Date(PAID_AT),
    });
    await pools.admin.db.insert(taxRegistration).values({
      tenantId,
      registrationType: 'IN_GST',
      value: THEIRS,
      createdAt: new Date(PAID_AT),
    });
    const [held] = await pools.admin.db
      .insert(subscription)
      .values({
        tenantId,
        state: 'active',
        stateEnteredAt: new Date(PAID_AT - MS_PER_DAY),
        trialEndsAt: new Date(TRIAL_END_FAR_AWAY),
        paidPeriodEnd: new Date(PAID_AT - MS_PER_DAY),
        createdAt: new Date(PAID_AT - MS_PER_DAY),
        ...(await aPlan(pools.admin.db)),
      })
      .returning({ id: subscription.id });
    if (held === undefined) throw new Error('the subscription was not seeded');
    const charge = {
      subscriptionId: held.id,
      chargeRef: `charge_${randomUUID()}`,
      occurredAt: PAID_AT,
      paysThrough: PAYS_THROUGH,
      amount: collectedFor('growth', 'monthly'),
      currencyCode: 'INR',
    } satisfies ChargeSucceeded;
    await new ChargeAdminRepository(pools.admin.db).recordSuccess(
      charge,
      ISSUED_AT,
      (standing) => successEffect(standing, charge),
      entitlementServiceOf(pools).bookLimitsOf(pack),
      pack,
    );
    const [invoice] = await pools.admin.db
      .select({ id: subscriptionInvoice.id })
      .from(subscriptionInvoice)
      .where(eq(subscriptionInvoice.subscriptionId, held.id));
    if (invoice === undefined) throw new Error('the charge issued no invoice');
    return { tenantId, invoiceId: invoice.id };
  }

  it('a landed charge’s invoice gets one PDF, and the step run twice stores one', async () => {
    const { tenantId, invoiceId } = await aPaidInvoice(IN_PACK);
    const events = await pools.admin.db
      .select({ workflow: orchestrationOutbox.workflow, payload: orchestrationOutbox.payload })
      .from(orchestrationOutbox)
      .where(eq(orchestrationOutbox.tenantId, tenantId));
    expect(events.filter((event) => event.workflow === 'invoiceDocument')).toEqual([
      { workflow: 'invoiceDocument', payload: expect.objectContaining({ tenantId, invoiceId }) },
    ]);

    const store = new MemoryObjectStore();
    const documents = documentsOf(store);
    // Issued while the platform holds no registration: a plain invoice that says no tax is charged.
    const plain = (await documents.page({ tenantId, invoiceId }))?.html ?? '';
    expect(plain).toContain('<h1>Invoice</h1>');
    expect(plain).toContain('No tax is charged on this invoice.');
    expect(plain).not.toContain('IGST');
    expect(plain).not.toContain(OURS.value);
    // The company's own registration still prints: it was captured at conversion.
    expect(plain).toContain(THEIRS);
    const first = await documents.attach({ tenantId, invoiceId, pdfBase64: A_PDF }, ISSUED_AT);
    // A second render differs byte for byte; the bytes the row describes stay stored.
    const again = await documents.attach(
      { tenantId, invoiceId, pdfBase64: A_LATER_PDF },
      ISSUED_AT,
    );

    expect([first, again]).toEqual([{ attached: true }, { attached: false }]);
    const kept = await pools.admin.db
      .select({ id: file.id, uploadedBy: file.uploadedBy, contentType: file.contentType })
      .from(file)
      .where(and(eq(file.tenantId, tenantId), eq(file.subjectRef, invoiceId)));
    expect(kept).toEqual([
      { id: expect.any(String), uploadedBy: null, contentType: 'application/pdf' },
    ]);
    const [pointed] = await pools.admin.db
      .select({ pdfFileId: subscriptionInvoice.pdfFileId })
      .from(subscriptionInvoice)
      .where(eq(subscriptionInvoice.id, invoiceId));
    expect(pointed?.pdfFileId).toBe(kept[0]?.id);
    const [stored] = await pools.admin.db
      .select({ key: file.externalId })
      .from(file)
      .where(eq(file.id, kept[0]?.id ?? ''));
    expect(Buffer.from(await store.read(stored?.key ?? '')).toString('base64')).toBe(A_PDF);
    // Made once: the next run finds its PDF and writes no page.
    expect(await documents.page({ tenantId, invoiceId })).toBeNull();
  });

  it('the PDF names the supplier, the company, every line, the tax by code and the total, in the company’s language', async () => {
    const { tenantId, invoiceId } = await aPaidInvoice(REGISTERED, { language: 'hi' });

    const page = await documentsOf().page({ tenantId, invoiceId });

    const html = page?.html ?? '';
    expect(html).toContain('<html lang="hi">');
    expect(html).toContain('कर इनवॉइस');
    expect(html).toContain(SUPPLIER?.legalName ?? 'the pack names no supplier');
    expect(html).toContain('GSTIN');
    expect(html).toContain(OURS.value);
    expect(html).toContain(THEIRS);
    // The company's typed address is escaped, never markup.
    expect(html).toContain('14 &lt;Lake&gt; Road &amp; Co');
    expect(html).toContain('Growth प्लान, मासिक बिल');
    // Karnataka buys from Maharashtra: IGST alone, its amount and the total to the paisa.
    const list = collectedFor('growth', 'monthly');
    const total = platformSaleTotal(REGISTERED, list);
    expect(html).toContain('IGST');
    expect(html).not.toContain('CGST');
    expect(html).toContain(formatMinorUnits(IN_PACK.formats, list));
    expect(html).toContain(formatMinorUnits(IN_PACK.formats, minorUnits(total - list)));
    expect(html).toContain(formatMinorUnits(IN_PACK.formats, total));
    expect(html).toContain(IN_PACK.tax.platformSale.serviceCode);
  });

  it('a pack changed after issue changes no PDF already made', async () => {
    // Issued while registered; the published pack the page reads holds no registration.
    const { tenantId, invoiceId } = await aPaidInvoice(REGISTERED);

    const html = (await documentsOf().page({ tenantId, invoiceId }))?.html ?? '';

    expect(html).toContain('Tax invoice');
    expect(html).toContain(OURS.value);
    expect(html).toContain('IGST');
    expect(html).not.toContain('No tax is charged on this invoice.');
  });

  it('an invoice’s PDF counts nothing on the company’s storage meter', async () => {
    const { tenantId, invoiceId } = await aPaidInvoice(IN_PACK);
    await documentsOf().attach({ tenantId, invoiceId, pdfBase64: A_PDF }, ISSUED_AT);

    await new UsageAdminRepository(pools.admin.db).weigh(
      [tenantId],
      '1979-06-04',
      new Date(ISSUED_AT),
    );

    const [weighed] = await pools.admin.db
      .select({ gaugeBytes: storageGaugeSnapshot.gaugeBytes })
      .from(storageGaugeSnapshot)
      .where(eq(storageGaugeSnapshot.tenantId, tenantId));
    expect(weighed?.gaugeBytes).toBe(0);
  });
});
