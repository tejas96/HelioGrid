/**
 * The sign-in providers the door accepts beside the phone (`M01-02`). Each is a convenience door
 * onto the SAME phone-identity account; adding one is a value here and its token checker in the
 * api's registry — the route, the table and the rule below never name a provider.
 */
export const LOGIN_PROVIDERS = ['google'] as const;
export type LoginProvider = (typeof LOGIN_PROVIDERS)[number];

/**
 * The provider door's one rule (`M01-02`): a provider login is linked once to a phone-identity
 * account and never makes a second one. What the caller knows before any code is checked decides
 * the road:
 * - `session` — the login is linked, and no other phone is named: sign in as its account.
 * - `linked-elsewhere` — the login is linked, but the device names a different phone to link.
 * - `not-linked` — the login is linked to nothing and no phone is named: run the phone step.
 * - `bind` — the login is linked to nothing and a phone is named: the code for that phone is
 *   the proof, and the bind happens only once it matches.
 * A phone whose account already holds a login of this provider is found by the bind itself,
 * after the code matched — the front door never says which number holds which login before the
 * phone is proven.
 */
export type LoginBindingRoad = 'session' | 'linked-elsewhere' | 'not-linked' | 'bind';

export interface LoginBindingFacts {
  /** The phone of the account this login is linked to, or null when it is linked to none. */
  readonly linkedPhoneE164: string | null;
  /** The phone the device asks to link, read from its code request, or null when it names none. */
  readonly requestedPhoneE164: string | null;
}

export function loginBindingRoad(facts: LoginBindingFacts): LoginBindingRoad {
  const { linkedPhoneE164, requestedPhoneE164 } = facts;
  if (linkedPhoneE164 !== null) {
    return requestedPhoneE164 === null || requestedPhoneE164 === linkedPhoneE164
      ? 'session'
      : 'linked-elsewhere';
  }
  return requestedPhoneE164 === null ? 'not-linked' : 'bind';
}

/**
 * How a bind ended once the code matched: done, or why nothing changed. The code is spent only
 * when it is `bound` — a refused bind leaves it usable for the phone door.
 */
export type LoginBindOutcome = 'bound' | 'code-spent' | 'phone-taken' | 'linked-elsewhere';
