import { describe, expect, it } from 'vitest';
import { billedQuantityOf } from '../../src/commerce/overage';
import { addOnVerdict, overageAddOns } from '../../src/commerce/overage-amounts';
import type { TierLimit } from '../../src/commerce/tiers';
import type { BilledLedgerMeter } from '../../src/commerce/usage';
import { minorUnits } from '../../src/money/minor-units';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import type { PriceBookPack } from '../../src/pricing/pack';
import { IN_PAYMENT_RAILS } from '../../src/rails/pack';

const VOICE_RATE = 600; // ₹6 a minute (BM-41)
const DETECTION_RATE = 1_000; // ₹10 a detection (BM-41)

function voiceAddOns(allowance: TierLimit | undefined, seconds: number) {
  const allowances = new Map<BilledLedgerMeter, TierLimit>();
  if (allowance !== undefined) allowances.set('voice_minutes', allowance);
  return overageAddOns(IN_PRICE_BOOK, allowances, new Map([['voice_minutes', seconds]]));
}

describe('overage add-ons (M12-35)', () => {
  it.each([
    { seconds: 0, minutes: 0 },
    { seconds: 59, minutes: 0 },
    { seconds: 60, minutes: 1 },
    { seconds: 7_859, minutes: 130 },
  ])(
    'voice seconds bill as whole minutes rounded down: $seconds s is $minutes min',
    ({ seconds, minutes }) => {
      expect(billedQuantityOf('voice_minutes', seconds)).toBe(minutes);
    },
  );

  it.each([
    { allowance: 100, seconds: 6_059, quantity: 0 },
    { allowance: 100, seconds: 6_060, quantity: 1 },
    { allowance: 0, seconds: 7_859, quantity: 130 },
  ])(
    '$seconds s against $allowance min bills $quantity min at the book rate',
    ({ allowance, seconds, quantity }) => {
      const lines = voiceAddOns(allowance, seconds);
      if (quantity === 0) {
        expect(lines).toEqual([]);
        return;
      }
      expect(lines).toEqual([
        {
          meter: 'voice_minutes',
          used: allowance + quantity,
          allowance,
          quantity,
          rate: minorUnits(VOICE_RATE),
          amount: minorUnits(quantity * VOICE_RATE),
        },
      ]);
    },
  );

  it('voice seconds bill as whole minutes rounded down, and an unlimited, custom or draft meter bills nothing', () => {
    expect(voiceAddOns('unlimited', 1_000_000)).toEqual([]);
    expect(voiceAddOns('custom', 1_000_000)).toEqual([]);
    expect(voiceAddOns(undefined, 1_000_000)).toEqual([]);
    // Seats and sends are draft in the IN book (BM-26): used far past a zero allowance, no line.
    const lines = overageAddOns(
      IN_PRICE_BOOK,
      new Map<BilledLedgerMeter, TierLimit>([
        ['tracked_field_seats', 0],
        ['marketing_sends', 0],
        ['ai_roof_detections', 30],
      ]),
      new Map<BilledLedgerMeter, number>([
        ['tracked_field_seats', 9_000_000],
        ['marketing_sends', 500],
        ['ai_roof_detections', 32],
      ]),
    );
    expect(lines).toEqual([
      {
        meter: 'ai_roof_detections',
        used: 32,
        allowance: 30,
        quantity: 2,
        rate: minorUnits(DETECTION_RATE),
        amount: minorUnits(2 * DETECTION_RATE),
      },
    ]);
  });

  it('refuses a sellable meter whose billed unit is not ruled', () => {
    const { voice_minutes: voice, marketing_sends: sends } = IN_PRICE_BOOK.overage;
    if (voice.kind !== 'per_unit' || sends.kind !== 'per_channel') {
      throw new Error('the IN book bills voice per unit and sends per channel');
    }
    const seatsSold: PriceBookPack = {
      ...IN_PRICE_BOOK,
      overage: { ...IN_PRICE_BOOK.overage, tracked_field_seats: { ...voice, draft: false } },
    };
    expect(() =>
      overageAddOns(seatsSold, new Map([['tracked_field_seats', 0]]), new Map()),
    ).toThrow(/no ruled billed unit/);
    const sendsSold: PriceBookPack = {
      ...IN_PRICE_BOOK,
      overage: { ...IN_PRICE_BOOK.overage, marketing_sends: { ...sends, draft: false } },
    };
    expect(() => overageAddOns(sendsSold, new Map(), new Map())).toThrow(/per channel/);
  });

  const UPI = IN_PAYMENT_RAILS.mandateTypes[0];
  const PRO_MONTH = 999_900;
  it.each([
    { waiting: 0, addOn: 500_100, verdict: 'add' },
    { waiting: 0, addOn: 500_101, verdict: 'over_cap' },
    { waiting: 300_000, addOn: 200_100, verdict: 'add' },
    { waiting: 300_000, addOn: 200_101, verdict: 'wait' },
  ])(
    'a Pro debit with $waiting waiting takes a $addOn add-on under the UPI cap: $verdict',
    ({ waiting, addOn, verdict }) => {
      if (UPI === undefined) throw new Error('the IN pack declares UPI AutoPay');
      expect(addOnVerdict(UPI, minorUnits(PRO_MONTH), minorUnits(waiting), minorUnits(addOn))).toBe(
        verdict,
      );
    },
  );

  it('a rail with no cap takes any add-on', () => {
    const card = IN_PAYMENT_RAILS.mandateTypes[1];
    if (card === undefined) throw new Error('the IN pack declares the card e-mandate');
    expect(
      addOnVerdict(card, minorUnits(PRO_MONTH), minorUnits(PRO_MONTH), minorUnits(PRO_MONTH)),
    ).toBe('add');
  });
});
