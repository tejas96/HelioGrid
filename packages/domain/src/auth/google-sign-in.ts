/**
 * The Google door as the device runs it (`M01-02`): a convenience sign-in onto the SAME
 * phone-identity account. Google's sheet hands the device a token; the server signs a linked
 * login straight in, and an unlinked one runs the phone step, whose code is the proof the link
 * needs. These are the shapes both doors name; the moves are `loginReducer`'s.
 */

/** What Google's sheet hands the device: the token the server checks, and the email it shows. */
export interface GoogleToken {
  readonly idToken: string;
  /** The value the device put in Google's request, when it put one; the server matches it. */
  readonly nonce: string | null;
  /** Read off the device's own Google user for the linking tile — never sent, never trusted. */
  readonly email: string;
}

/** How Google's sheet closed. A cancel is silent (`SCR-M01-01` decision 11); a failure has its frame. */
export type GoogleSheetResult =
  | { readonly kind: 'token'; readonly token: GoogleToken }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'failed' };

/**
 * How a Google sign-in ended. `not-linked` sends the person to the phone step; `phone-taken` is
 * a code that matched for a number another Google login already holds; the verify words are a
 * link's code refused; `failed` is everything else the door cannot act on — a token refused, Google
 * unreachable, the login linked to another number, or no answer — one frame for all of them.
 */
export type GoogleOutcome =
  | 'signed-in'
  | 'not-linked'
  | 'phone-taken'
  | 'mismatch'
  | 'expired'
  | 'invalidated'
  | 'locked'
  | 'failed';

/** A Google sign-in's answer, with the tries left on the link's code, counted as a verify counts them. */
export interface GoogleResult {
  readonly outcome: GoogleOutcome;
  readonly triesLeft: number;
}

/** What a Google sign-in left on the door: nothing, the failure frame, or the taken-phone frame. */
export type GoogleEnded = 'failed' | 'phone-taken';
