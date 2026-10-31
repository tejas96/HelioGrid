import { basisPoints, formatMinorUnits, IN_PACK, minorUnits } from '@heliogrid/domain';
import { createTranslator } from '@heliogrid/i18n';
import { describe, expect, it } from 'vitest';
import { invoiceDocumentHtml } from '../../src/modules/billing/internal/invoice-document.html';
import type { InvoiceForDocument } from '../../src/modules/billing/invoice-document.admin.repository';

/**
 * The invoice's page from what an invoice stored (`M12-44`, `M12-35`): every line in words, the
 * tax by code and the total summed from the stored lines — never worked out again from a pack.
 */

/** GST on the platform's sale, 18% (`F1-28`). */
const RATE_BASIS_POINTS = 1800;
const RATE = basisPoints(RATE_BASIS_POINTS);
/** Growth monthly, ex-tax: ₹2,999.00, and its CGST and SGST halves of 9%. */
const PLAN_PAISE = 299_900;
const PLAN = minorUnits(PLAN_PAISE);
const PLAN_HALF_TAX_PAISE = 26_991;
const PLAN_HALF_TAX = minorUnits(PLAN_HALF_TAX_PAISE);
/** 120 voice minutes past the bundle at ₹4.50 each: ₹540.00, and its halves. */
const MINUTES_PAST = 120;
const MINUTE_RATE_PAISE = 450;
const MINUTE_RATE = minorUnits(MINUTE_RATE_PAISE);
const OVERAGE_PAISE = 54_000;
const OVERAGE = minorUnits(OVERAGE_PAISE);
const OVERAGE_HALF_TAX_PAISE = 4_860;
const OVERAGE_HALF_TAX = minorUnits(OVERAGE_HALF_TAX_PAISE);
/** What the page must sum: each half once, the subtotal, and the total — ₹4,176.02. */
const HALF_TAX_SUM_PAISE = 31_851;
const HALF_TAX_SUM = minorUnits(HALF_TAX_SUM_PAISE);
const SUBTOTAL_PAISE = 353_900;
const SUBTOTAL = minorUnits(SUBTOTAL_PAISE);
const TOTAL_PAISE = 417_602;
const TOTAL = minorUnits(TOTAL_PAISE);
/** Maharashtra's state code: supplier and company in one state. */
const MAHARASHTRA = '27';

const INVOICE: InvoiceForDocument = {
  marketCode: 'IN',
  number: '1979-80/000042',
  issuedAt: new Date('1979-06-03T06:01:00Z'),
  paysThrough: new Date('1979-07-03T06:00:00Z'),
  supplierRegistration: { type: 'IN_GST', value: '27AAACH7409R1ZV' },
  recipientRegistration: { type: 'IN_GST', value: '27ABCDE1234F1Z5' },
  recipientPlace: MAHARASHTRA,
  serviceCode: IN_PACK.tax.platformSale.serviceCode,
  company: {
    name: 'Suntech Solar',
    address: '14 Lake Road',
    postalCode: '411001',
    city: 'Pune',
    language: 'en',
    timeZone: 'Asia/Kolkata',
  },
  lines: [
    {
      sells: { kind: 'plan', tier: 'growth', cycle: 'monthly' },
      taxableAmount: PLAN,
      rateBasisPoints: RATE,
      components: [
        { code: 'CGST', amount: PLAN_HALF_TAX },
        { code: 'SGST', amount: PLAN_HALF_TAX },
      ],
    },
    {
      sells: {
        kind: 'overage',
        meter: 'voice_minutes',
        quantity: MINUTES_PAST,
        unitRate: MINUTE_RATE,
      },
      taxableAmount: OVERAGE,
      rateBasisPoints: RATE,
      components: [
        { code: 'CGST', amount: OVERAGE_HALF_TAX },
        { code: 'SGST', amount: OVERAGE_HALF_TAX },
      ],
    },
  ],
};

const money = (amount: ReturnType<typeof minorUnits>) => formatMinorUnits(IN_PACK.formats, amount);
const taxRow = (code: string) =>
  `<th colspan="2">${code}</th><td class="figure"><span class="mono">${money(HALF_TAX_SUM)}</span>`;

describe('the invoice page', () => {
  it('prints every line, each tax code once with its sum, and the total to the paisa', async () => {
    const html = invoiceDocumentHtml(INVOICE, IN_PACK, await createTranslator('en'));

    expect(html).toContain('Growth plan, billed monthly');
    expect(html).toContain(
      `Voice minutes: ${MINUTES_PAST} beyond the bundle at ${money(MINUTE_RATE)} each`,
    );
    expect(html).toContain(money(OVERAGE));
    expect(html).toContain(taxRow('CGST'));
    expect(html).toContain(taxRow('SGST'));
    expect(html).toContain(money(SUBTOTAL));
    expect(html).toContain(money(TOTAL));
    expect(html).toContain(`Place of supply: <span class="mono">${MAHARASHTRA}</span>`);
  });

  it('refuses to print for a pack that names no supplier', async () => {
    const unnamed = { ...IN_PACK, tax: { ...IN_PACK.tax, platformSupplier: null } };
    const translator = await createTranslator('en');

    expect(() => invoiceDocumentHtml(INVOICE, unnamed, translator)).toThrow(/names no supplier/);
  });
});
