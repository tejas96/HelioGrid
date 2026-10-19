import { describe, expect, it } from 'vitest';
import { announcesSave } from '../../src/tenancy/company-profile-life';

describe('announcesSave — a save that came back says so only in settings, and only when it wrote', () => {
  it.each([
    { life: 'settings', logoRefused: false, says: true, why: 'settings, written — the toast' },
    {
      life: 'settings',
      logoRefused: true,
      says: false,
      why: 'settings, logo refused — its refusal is the answer',
    },
    { life: 'setup', logoRefused: false, says: false, why: 'setup — the next step is the answer' },
    { life: 'setup', logoRefused: true, says: false, why: 'setup, logo refused — the refusal' },
  ] as const)('$why', ({ life, logoRefused, says }) => {
    expect(announcesSave(life, logoRefused)).toBe(says);
  });
});
