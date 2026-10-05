import type { LoginProvider } from '../common';

/**
 * The port a provider's ID token is checked through (`M01-02`): signed by the provider, for one
 * of this product's clients, not expired, and carrying the nonce the device sent when it sent one.
 * The adapter holds the provider's key set; the caller holds the binding rule. Only the subject
 * leaves — the provider's stable account id the link is keyed on, never the email, which can
 * change.
 */
export type IdentityVerdict =
  | { readonly kind: 'verified'; readonly subject: string }
  | { readonly kind: 'refused' }
  /** The provider's keys could not be fetched; the token was neither accepted nor refused. */
  | { readonly kind: 'unavailable' };

export interface IdentityProvider {
  verify(
    idToken: string,
    audiences: readonly string[],
    nonce: string | undefined,
  ): Promise<IdentityVerdict>;
}

/**
 * Every provider's checker and the client ids its tokens must name. A `Record` over the provider
 * list, so a provider added there without a checker does not compile. `audiences` is `undefined`
 * when the environment sets none: that provider's door refuses every token.
 */
export type IdentityProviders = Record<
  LoginProvider,
  { readonly checker: IdentityProvider; readonly audiences: readonly string[] | undefined }
>;

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const IDENTITY_PROVIDERS = Symbol.for('heliogrid.IdentityProviders');
