/**
 * The port a Google ID token is checked through (`M01-02`): signed by Google, for one of this
 * product's OAuth clients, not expired, and carrying the nonce the device sent when it sent one.
 * The adapter holds Google's key set; the caller holds the binding rule. Only the subject leaves
 * — the stable Google account id the binding is keyed on, never the email, which can change.
 */
export type GoogleIdentityVerdict =
  | { readonly kind: 'verified'; readonly subject: string }
  | { readonly kind: 'refused' }
  /** Google's keys could not be fetched; the token was neither accepted nor refused. */
  | { readonly kind: 'unavailable' };

export interface GoogleIdentity {
  verify(
    idToken: string,
    audiences: readonly string[],
    nonce: string | undefined,
  ): Promise<GoogleIdentityVerdict>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const GOOGLE_IDENTITY = Symbol.for('heliogrid.GoogleIdentity');
