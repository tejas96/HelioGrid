import type { TeamActAnswer } from './team-acts';

/**
 * What an answer to an invite send means (`M01-12`, `SCR-M01-07`), read once for both apps and
 * both lives of the screen (Law 11). A refusal the screen draws is told apart by its code, never
 * its status alone: 422 is both a number no market covers and a reused creation key.
 *
 * `sent` it landed · `already_member` the number is on the team · `already_invited` it has a live
 * invite · `not_covered` no market can message it · `cap` the company's 24-hour cap is reached ·
 * `signed_out` a 401 — the session store ends the session when its refresh is refused; a screen
 * still says nothing went out, for the 401 it does not end · `forbidden` the reader
 * no longer invites · `failed` nothing usable came back, so the form keeps its values and says so.
 */
export type InviteOutcome =
  | 'sent'
  | 'already_member'
  | 'already_invited'
  | 'not_covered'
  | 'cap'
  | 'signed_out'
  | 'forbidden'
  | 'failed';

/** The refusals the form itself draws, in place of the send. */
export type InviteRefusal = Extract<
  InviteOutcome,
  'already_member' | 'already_invited' | 'not_covered' | 'cap'
>;

const REFUSAL_OF_CODE: Readonly<Record<string, InviteRefusal>> = {
  ALREADY_MEMBER: 'already_member',
  ALREADY_INVITED: 'already_invited',
  DOMAIN_RULE_VIOLATION: 'not_covered',
  INVITE_CAP_REACHED: 'cap',
};

export function inviteOutcome(answer: TeamActAnswer): InviteOutcome {
  if (answer === null) return 'failed';
  const { status, code } = answer;
  if (status >= 200 && status < 300) return 'sent';
  if (status === 401) return 'signed_out';
  if (status === 403) return 'forbidden';
  return REFUSAL_OF_CODE[code] ?? 'failed';
}

/** The refusal each outcome draws on the form, or null for one that draws none. */
const REFUSAL_OF_OUTCOME: Readonly<Record<InviteOutcome, InviteRefusal | null>> = {
  sent: null,
  already_member: 'already_member',
  already_invited: 'already_invited',
  not_covered: 'not_covered',
  cap: 'cap',
  signed_out: null,
  forbidden: null,
  failed: null,
};

export function inviteRefusal(outcome: InviteOutcome): InviteRefusal | null {
  return REFUSAL_OF_OUTCOME[outcome];
}

/** The number is already on Team — a member, or a live invite: the role list goes, the way on is another number. */
export function numberOnTeam(refusal: InviteRefusal | null): boolean {
  return refusal === 'already_member' || refusal === 'already_invited';
}

/** Nothing can be sent while this refusal stands, so the invite's expiry is not said. */
export function sendsNothing(refusal: InviteRefusal | null): boolean {
  return numberOnTeam(refusal) || refusal === 'cap';
}
