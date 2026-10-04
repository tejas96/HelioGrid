/**
 * The Google door's one rule (`M01-02`): a Google login is a convenience door onto the SAME
 * phone-identity account, linked once and never a second account. What the caller knows before
 * any code is checked decides the road:
 * - `session` — the login is linked, and no other phone is named: sign in as its account.
 * - `subject-taken` — the login is linked, but the device names a different phone to link.
 * - `not-linked` — the login is linked to nothing and no phone is named: run the phone step.
 * - `bind` — the login is linked to nothing and a phone is named: the code for that phone is
 *   the proof, and the bind happens only once it matches.
 * A phone whose account already holds another login is found by the bind itself, after the code
 * matched — the front door never says which number holds which login before the phone is proven.
 */
export type GoogleBindingRoad = 'session' | 'subject-taken' | 'not-linked' | 'bind';

export interface GoogleBindingFacts {
  /** The phone of the account this Google login is linked to, or null when it is linked to none. */
  readonly linkedPhoneE164: string | null;
  /** The phone the device asks to link, read from its code request, or null when it names none. */
  readonly requestedPhoneE164: string | null;
}

export function googleBindingRoad(facts: GoogleBindingFacts): GoogleBindingRoad {
  const { linkedPhoneE164, requestedPhoneE164 } = facts;
  if (linkedPhoneE164 !== null) {
    return requestedPhoneE164 === null || requestedPhoneE164 === linkedPhoneE164
      ? 'session'
      : 'subject-taken';
  }
  return requestedPhoneE164 === null ? 'not-linked' : 'bind';
}

/**
 * How a bind ended once the code matched: done, or why nothing changed. The code is spent only
 * when it is `bound` — a refused bind leaves it usable for the phone door.
 */
export type GoogleBindOutcome = 'bound' | 'code-spent' | 'phone-taken' | 'subject-taken';
