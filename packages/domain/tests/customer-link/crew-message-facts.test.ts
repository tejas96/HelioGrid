import { describe, expect, it } from 'vitest';
import { crewMessageMissing } from '../../src/customer-link/crew-message-facts';

const DAY = {
  on: '2026-11-15',
  startTime: '09:00',
  durationDays: 1.5,
  disturbance: 'Power off for an hour',
  crewLead: { userId: 'u-1', name: 'Ramesh', phoneE164: '+919822000001' },
} as const;
/* What to expect is the message's own words, beside the facts this reads: absent, nothing is missing. */
const QUIET = { ...DAY, disturbance: null };

describe('crewMessageMissing — the crew message states who, when and how long, or is not offered (F5-68)', () => {
  it.each<[string, Parameters<typeof crewMessageMissing>[0], number, readonly string[]]>([
    ['every fact set', DAY, 2, []],
    ['no disturbance is fine: nothing to expect', QUIET, 2, []],
    ['no start time', { ...DAY, startTime: null }, 2, ['start_time']],
    ['no days', { ...DAY, durationDays: null }, 2, ['duration']],
    ['no crew lead', { ...DAY, crewLead: null }, 2, ['crew_lead']],
    ['no crew dispatched', DAY, 0, ['crew']],
    ['an older api sends no facts', undefined, 2, ['start_time', 'duration', 'crew_lead']],
  ])('%s', (_case, day, crew, missing) => {
    expect(crewMessageMissing(day, crew)).toEqual(missing);
  });
});
