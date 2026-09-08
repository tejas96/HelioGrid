/**
 * What a person is inside ONE company (`M01-18`, `F2-20`). The status lives on the membership,
 * never on the account: a person deactivated in one company stays active in another, and an
 * account with no membership is a signup that verified and has not yet created its company
 * (`M01-10`). A readonly tuple, so contracts derives its `z.enum` and the migration mirrors the
 * pgEnum from this one list.
 */
export const MEMBERSHIP_STATUSES = ['invited', 'active', 'deactivated'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
