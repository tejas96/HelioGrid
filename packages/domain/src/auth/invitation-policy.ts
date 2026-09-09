/**
 * A team invitation (`M01-12`, `M01-13`): its states, how long it lives and the one cap on
 * sending, as numbers and decisions both platforms obey. Time enters as `now: number`, epoch
 * milliseconds; nothing here reads a clock or a store.
 *
 * `expired` is a READING, never a write: a pending invitation past its expiry reads as expired,
 * so the row and the clock can never disagree. A readonly tuple, so contracts derives its
 * `z.enum` and the migration mirrors the pgEnum from this one list.
 */
export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** `M01-12` — an invitation lives seven days from the send; the Team screen derives its expiry from this. */
export const INVITATION_EXPIRY_DAYS = 7;
/** `M01-04` — invite sends are capped per tenant per day. */
export const INVITATIONS_PER_TENANT_PER_DAY = 50;

const MS_PER_DAY = 24 * 60 * 60 * 1_000;

/** When an invitation sent at `sentAt` stops being acceptable. */
export function invitationExpiresAt(sentAt: number): number {
  return sentAt + INVITATION_EXPIRY_DAYS * MS_PER_DAY;
}

/** The instant the cap's window opens: every send since counts, whatever became of it. */
export function invitationsSince(now: number): number {
  return now - MS_PER_DAY;
}

/** Whether a tenant that sent `sentSince` invitations in the window may send another (`M01-04`). */
export function inviteCapReached(sentSince: number): boolean {
  return sentSince >= INVITATIONS_PER_TENANT_PER_DAY;
}

/** An invitation as the store holds it: the written state, and when a pending one runs out. */
export interface InvitationLife {
  readonly status: InvitationStatus;
  readonly expiresAt: number;
}

/** The state an invitation is in NOW: a pending one past its expiry reads as expired. */
export function invitationStatus(life: InvitationLife, now: number): InvitationStatus {
  return life.status === 'pending' && now >= life.expiresAt ? 'expired' : life.status;
}

/**
 * Where the link in the invite message lands (`M01-13`) — one path the message composer and the
 * web route share, so the two can never point at different places.
 */
export function inviteLandingPath(token: string): string {
  return `/invite/${token}`;
}
