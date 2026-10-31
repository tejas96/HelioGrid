import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import { platformInvoice } from '../../src/tax/platform-invoice';
import { platformSaleTotal } from '../../src/tax/platform-sale';

const OURS = { registrationType: 'IN_GST', value: '27AAACH7409R1ZV' };
const REGISTERED = { ...IN_PACK, tax: { ...IN_PACK.tax, platformRegistration: OURS } };
const SAME_STATE = { registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' };
const OTHER_STATE = { registrationType: 'IN_GST', value: '29ABCDE1234F1Z5' };
const STARTER_MONTH = minorUnits(199_900);

describe('platformInvoice — one platform invoice’s money and parties (M12-44, M12-45)', () => {
  it('an unregistered platform issues a plain invoice with no tax', () => {
    const invoice = platformInvoice(IN_PACK, [STARTER_MONTH], SAME_STATE);
    expect(invoice).toEqual({
      currency: 'INR',
      lines: [{ taxableAmount: 199_900, rateBasisPoints: null, components: [] }],
      supplierRegistration: null,
      recipientRegistration: SAME_STATE,
      supplierPlace: null,
      recipientPlace: null,
      serviceCode: null,
      totalAmount: 199_900,
    });
  });

  it.each([
    {
      name: 'a company in the platform’s state pays CGST and SGST',
      company: SAME_STATE,
      place: '27',
      components: [
        { code: 'CGST', amount: 17_991 },
        { code: 'SGST', amount: 17_991 },
      ],
    },
    {
      name: 'a company in another state pays IGST',
      company: OTHER_STATE,
      place: '29',
      components: [{ code: 'IGST', amount: 35_982 }],
    },
    {
      name: 'a company that gave no GSTIN sits at the platform’s place',
      company: null,
      place: '27',
      components: [
        { code: 'CGST', amount: 17_991 },
        { code: 'SGST', amount: 17_991 },
      ],
    },
    {
      name: 'a company whose registration names no place sits at the platform’s place',
      company: { registrationType: 'XX_UNKNOWN', value: '1234' },
      place: '27',
      components: [
        { code: 'CGST', amount: 17_991 },
        { code: 'SGST', amount: 17_991 },
      ],
    },
  ])(
    'a registered platform splits the tax by where the company is registered: $name',
    ({ company, place, components }) => {
      const invoice = platformInvoice(REGISTERED, [STARTER_MONTH], company);
      expect(invoice.supplierRegistration).toEqual(OURS);
      expect(invoice.recipientRegistration).toEqual(company);
      expect(invoice.supplierPlace).toBe('27');
      expect(invoice.recipientPlace).toBe(place);
      expect(invoice.serviceCode).toBe('998434');
      expect(invoice.lines).toEqual([
        { taxableAmount: 199_900, rateBasisPoints: 1800, components },
      ]);
      expect(invoice.totalAmount).toBe(235_882);
    },
  );

  it('a scheme whose registrations name no place splits every invoice as one place', () => {
    const noPlace = {
      ...REGISTERED,
      tax: {
        ...REGISTERED.tax,
        registrationTypes: REGISTERED.tax.registrationTypes.map((type) => ({
          ...type,
          placeAt: null,
          name: null,
        })),
      },
    };
    const invoice = platformInvoice(noPlace, [STARTER_MONTH], null);
    expect(invoice.supplierPlace).toBeNull();
    expect(invoice.recipientPlace).toBeNull();
    expect(invoice.lines[0]?.components.map((component) => component.code)).toEqual([
      'CGST',
      'SGST',
    ]);
  });

  it.each([
    { name: 'unregistered', pack: IN_PACK },
    { name: 'registered', pack: REGISTERED },
  ])('the invoice total is what the plan collects: $name', ({ pack }) => {
    const prices = [0, 1, 199_900, 1_999_000, 4_999_000].map(minorUnits);
    for (const company of [null, SAME_STATE, OTHER_STATE]) {
      for (const price of prices) {
        expect(platformInvoice(pack, [price], company).totalAmount).toBe(
          platformSaleTotal(pack, price),
        );
      }
    }
  });
});
