import { randomInt } from 'node:crypto';

/**
 * A mobile number no one has used, so a spec never meets another spec's account or company, nor
 * the developer's own (R11), and never shares a number's code caps. Indian, as every tenant is in
 * V1: ten digits from 9. Never ending 0000, which the development delivery refuses by design.
 */
export function freshMobile(): { national: string; e164: string } {
  let national = '';
  do {
    national = `9${randomInt(0, 1_000_000_000).toString().padStart(9, '0')}`;
  } while (national.endsWith('0000'));
  return { national, e164: `+91${national}` };
}
