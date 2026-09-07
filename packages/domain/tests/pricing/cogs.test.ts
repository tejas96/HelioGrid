import { describe, expect, it } from 'vitest';
import { minorUnits } from '../../src/money/minor-units';
import { clearsCogsFloor, metersBelowCogsFloor } from '../../src/pricing/cogs';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import type { MeterOverage, PriceBookPack, WorstCaseCogs } from '../../src/pricing/pack';

/** A cost figure to measure a rate against. What it SAYS is untested — only what it costs. */
function costing(amount: number): WorstCaseCogs {
  return { amount: minorUnits(amount), source: 'a test figure, verified by nobody' };
}

/** The IN book with one meter's overage swapped, so a violation can be injected in isolation. */
function bookWhere(overage: Partial<PriceBookPack['overage']>): PriceBookPack {
  return { ...IN_PRICE_BOOK, overage: { ...IN_PRICE_BOOK.overage, ...overage } };
}

/** ₹1.00 of worst-case cost, whose floor is therefore ₹1.40. */
const ONE_RUPEE_OF_COST = costing(100);
const ITS_FLOOR = 140;

describe('clearsCogsFloor — a rate is judged at the floor, not near it (BM-17)', () => {
  it.each([
    { rate: ITS_FLOOR, clears: true, why: 'exactly on the floor clears it — ≥40%, not >40%' },
    { rate: ITS_FLOOR - 1, clears: false, why: 'one paisa under the floor is an invalid row' },
    { rate: ITS_FLOOR + 1, clears: true, why: 'a paisa of headroom clears' },
    { rate: 1_000, clears: true, why: 'far above the floor clears' },
    { rate: 100, clears: false, why: 'a rate at cost is margin-zero, which the law forbids' },
    { rate: 0, clears: false, why: 'a free unit that costs money never clears' },
  ])('$why', ({ rate, clears }) => {
    expect(clearsCogsFloor(minorUnits(rate), ONE_RUPEE_OF_COST)).toBe(clears);
  });

  it('clears at any rate where the unit costs nothing — there is no floor to hold', () => {
    expect(clearsCogsFloor(minorUnits(0), costing(0))).toBe(true);
  });
});

describe('metersBelowCogsFloor — which rows a book got wrong (BM-17, BM-41)', () => {
  it('finds nothing wrong with the IN book — every published rate clears its floor', () => {
    expect(metersBelowCogsFloor(IN_PRICE_BOOK)).toEqual([]);
  });

  it.each([
    { meter: 'voice_minutes', rate: 600 },
    { meter: 'ai_roof_detections', rate: 1_000 },
    { meter: 'tracked_field_seats', rate: 9_900 },
  ] as const)('names $meter when its rate drops a paisa below the floor', ({ meter, rate }) => {
    const underpriced: MeterOverage = {
      kind: 'per_unit',
      rate: minorUnits(rate),
      worstCaseCogs: costing(rate),
      draft: false,
    };
    expect(metersBelowCogsFloor(bookWhere({ [meter]: underpriced }))).toEqual([meter]);
  });

  it('names a per-channel meter ONCE however many of its channels fail (BM-21)', () => {
    const bothChannelsUnderpriced: MeterOverage = {
      kind: 'per_channel',
      draft: true,
      channels: [
        {
          channel: 'whatsapp',
          billableUnit: 'conversation',
          rate: minorUnits(150),
          worstCaseCogs: costing(150),
        },
        {
          channel: 'sms',
          billableUnit: 'message',
          rate: minorUnits(35),
          worstCaseCogs: costing(35),
        },
      ],
    };
    expect(metersBelowCogsFloor(bookWhere({ marketing_sends: bothChannelsUnderpriced }))).toEqual([
      'marketing_sends',
    ]);
  });

  it('names a per-channel meter when a SINGLE channel fails — every channel must clear', () => {
    const emailUnderpriced: MeterOverage = {
      kind: 'per_channel',
      draft: true,
      channels: [
        {
          channel: 'whatsapp',
          billableUnit: 'conversation',
          rate: minorUnits(150),
          worstCaseCogs: costing(107),
        },
        {
          channel: 'email',
          billableUnit: 'message',
          rate: minorUnits(10),
          worstCaseCogs: costing(10),
        },
      ],
    };
    expect(metersBelowCogsFloor(bookWhere({ marketing_sends: emailUnderpriced }))).toEqual([
      'marketing_sends',
    ]);
  });

  it('never names storage — a ceiling has no rate to hold above a floor (BM-20)', () => {
    expect(metersBelowCogsFloor(bookWhere({ storage: { kind: 'ceiling' } }))).toEqual([]);
  });

  it('names every failing meter at once, in the meter list’s own order (BM-16)', () => {
    const atCost = (rate: number): MeterOverage => ({
      kind: 'per_unit',
      rate: minorUnits(rate),
      worstCaseCogs: costing(rate),
      draft: false,
    });
    expect(
      metersBelowCogsFloor(
        bookWhere({ voice_minutes: atCost(600), tracked_field_seats: atCost(9_900) }),
      ),
    ).toEqual(['voice_minutes', 'tracked_field_seats']);
  });
});

describe('the IN book’s own headroom above the floor (BM-26)', () => {
  it.each([
    { meter: 'voice minutes', rate: 600, cost: 428, floor: 599 },
    { meter: 'AI roof detections', rate: 1_000, cost: 714, floor: 1_000 },
    { meter: 'WhatsApp conversations', rate: 150, cost: 107, floor: 150 },
    { meter: 'SMS messages', rate: 35, cost: 25, floor: 35 },
    { meter: 'email messages', rate: 10, cost: 7, floor: 10 },
    { meter: 'tracked seat-months', rate: 9_900, cost: 7_071, floor: 9_899 },
  ])('holds $meter at $rate paise against a floor of $floor', ({ rate, cost, floor }) => {
    expect(rate).toBeGreaterThanOrEqual(floor);
    expect(clearsCogsFloor(minorUnits(floor), costing(cost))).toBe(true);
    expect(clearsCogsFloor(minorUnits(floor - 1), costing(cost))).toBe(false);
  });
});
