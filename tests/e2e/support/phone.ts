import { randomInt } from 'node:crypto';

/**
 * A mobile number no one has used, so a spec never meets another spec's account or company, nor
 * the developer's own (R11), and never shares a number's code caps. Indian, as every tenant is in
 * V1: ten digits from 91, so every run types a national number that begins with the dial code's
 * digits, which a field must never strip as a second +91. Never ending 0000, which the development
 * delivery refuses by design.
 */
export function freshMobile(): { national: string; e164: string } {
  let national = '';
  do {
    national = `91${randomInt(0, 100_000_000).toString().padStart(8, '0')}`;
  } while (national.endsWith('0000'));
  return { national, e164: `+91${national}` };
}
