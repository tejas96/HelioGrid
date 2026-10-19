import { MS_PER_DAY } from '../../src/format/zone';
import type { RosterInvite, RosterMember } from '../../src/tenancy/team-roster';

/* 31 Aug 2026, 09:20 in Asia/Kolkata — the boards' clock. */
export const NOW = Date.parse('2026-08-31T03:50:00Z');
export const VIEWER = 'u-rajesh';
let serial = 0;

export function member(name: string, over: Partial<RosterMember> = {}): RosterMember {
  serial += 1;
  return {
    membershipId: `m-${serial}`,
    userId: `u-${serial}`,
    name,
    phoneE164: `+9198000000${String(serial).padStart(2, '0')}`,
    roles: ['sales_executive'],
    status: 'active',
    lastActiveAt: '2026-08-30T10:00:00Z',
    ...over,
  };
}

export function invite(
  name: string,
  sentDaysAgo: number,
  over: Partial<RosterInvite> = {},
): RosterInvite {
  serial += 1;
  const sentAt = NOW - sentDaysAgo * MS_PER_DAY;
  return {
    id: `i-${serial}`,
    inviteeName: name,
    phoneE164: `+9197000000${String(serial).padStart(2, '0')}`,
    roles: ['survey_engineer'],
    status: 'pending',
    sentAt: new Date(sentAt).toISOString(),
    expiresAt: new Date(sentAt + 7 * MS_PER_DAY).toISOString(),
    ...over,
  };
}
