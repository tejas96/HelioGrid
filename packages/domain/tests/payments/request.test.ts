import { describe, expect, it } from 'vitest';
import { minorUnits } from '../../src/money/minor-units';
import { isUpiId, referenceKeyOf, upiIdOf } from '../../src/payments/reference';
import { chatRequestUri, receiptNumberOf, upiRequestUri } from '../../src/payments/request';

describe('upiRequestUri — exactly what the part owes, to the company (M11-25, M11-01)', () => {
  it('asks for the amount to the paisa, with the note', () => {
    expect(
      upiRequestUri({
        upiId: ' suncorp.solar@okaxis ',
        payee: 'SunCorp Solar',
        amount: minorUnits(5_000_050),
        fractionDigits: 2,
        currency: 'INR',
        note: 'PRJ-0042 · Part 2',
      }),
    ).toBe(
      'upi://pay?pa=suncorp.solar%40okaxis&pn=SunCorp%20Solar&am=50000.50&cu=INR&tn=PRJ-0042%20%C2%B7%20Part%202',
    );
  });
});

describe('chatRequestUri — the request opened in the customer’s chat, ready to send', () => {
  it.each([
    [
      'WhatsApp: the customer’s number without its plus, the message filled in',
      'whatsapp',
      'https://wa.me/919876543210?text=Pay%20%E2%82%B91%2C000%0AThanks',
    ],
    ['no chat app in the market: nothing to open', null, null],
  ] as const)('%s', (_, app, uri) => {
    expect(chatRequestUri(app, '+919876543210', 'Pay ₹1,000\nThanks')).toBe(uri);
  });
});

describe('receiptNumberOf — the company’s own series', () => {
  it.each([
    [1, 'RCPT-0001'],
    [187, 'RCPT-0187'],
    [12_345, 'RCPT-12345'],
  ])('%d is %s', (sequence, number) => {
    expect(receiptNumberOf(sequence)).toBe(number);
  });
});

describe('referenceKeyOf — one payment however its UTR is typed', () => {
  it.each([
    ['4321 8765 3390', '432187653390'],
    ['4321-8765-3390', '432187653390'],
    ['chq 001234', 'CHQ001234'],
    ['   ', null],
    ['', null],
  ])('%o reads as %o', (typed, key) => {
    expect(referenceKeyOf(typed)).toBe(key);
  });
});

describe('isUpiId — the shape of name@bank', () => {
  it.each([
    ['suncorp.solar@okaxis', true],
    ['98765-43210@ybl', true],
    [' padded@upi ', true],
    ['a@upi', false],
    ['no-at-sign', false],
    ['two@at@signs', false],
    ['name@1bank', false],
    ['', false],
  ])('%o is %o', (typed, valid) => {
    expect(isUpiId(typed)).toBe(valid);
  });
});

describe('upiIdOf — one address however its letters are typed', () => {
  it.each([
    ['Qaios@OkHdfcBank', 'qaios@okhdfcbank'],
    ['  epc@okaxis ', 'epc@okaxis'],
    ['epc@okaxis', 'epc@okaxis'],
  ])('%o is kept as %o', (typed, kept) => {
    expect(upiIdOf(typed)).toBe(kept);
  });
});
