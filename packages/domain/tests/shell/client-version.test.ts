import { describe, expect, it } from 'vitest';
import { isBelowMinimum, parseClientVersion } from '../../src/shell/client-version';

function minimum(text: string) {
  const parsed = parseClientVersion(text);
  if (parsed === null) throw new Error(`test minimum ${text} does not parse`);
  return parsed;
}

describe('isBelowMinimum — the server-declared minimum a phone must meet (F4-36)', () => {
  it.each([
    { sent: '1.9', floor: '1.10', below: true },
    { sent: '1.10', floor: '1.10', below: false },
    { sent: '1.10.0', floor: '1.10', below: false },
    { sent: '1.11', floor: '1.10', below: false },
    { sent: '1.10', floor: '1.9', below: false },
    { sent: '2', floor: '1.99.99', below: false },
    { sent: '1.99.99', floor: '2', below: true },
    { sent: '1.0', floor: '1.0.1', below: true },
    { sent: '1.0.1', floor: '1.0.1', below: false },
    { sent: '0.9.9', floor: '1', below: true },
  ])(
    'a version is below the minimum only when a part is numerically lower',
    ({ sent, floor, below }) => {
      expect(isBelowMinimum(sent, minimum(floor))).toBe(below);
    },
  );

  it.each(['1.10-beta', '', ' 1.10', 'v1.10', '1..10', '1.10.0.0', '1.10,1.10', '1234567890.0'])(
    'an unreadable version is below any minimum',
    (sent) => {
      expect(isBelowMinimum(sent, minimum('0'))).toBe(true);
    },
  );
});

describe('parseClientVersion — the grammar a minimum is written in', () => {
  it.each(['1', '1.10', '1.10.3', '0.0.0'])('reads %j', (text) => {
    expect(parseClientVersion(text)).not.toBeNull();
  });

  it.each(['', 'one', '1.10-beta', '-1', '1.10.3.4'])('refuses %j', (text) => {
    expect(parseClientVersion(text)).toBeNull();
  });
});
