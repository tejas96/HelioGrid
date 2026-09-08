import { z } from 'zod';
import { roleSetSchema, uuidSchema } from './common';

/**
 * The HelioGrid session PROJECTION — the shape every guard, repository, screen and contract
 * sees, and the reason replacing or upgrading the identity provider changes none of them.
 *
 * It is deliberately NOT the provider's session. HelioGrid owns user_account, sessions,
 * tenants, memberships and roles; a wrapped identity library owns only its own tables. This
 * type is where the two are joined, once, at the boundary — so a provider upgrade is a
 * mapping change in one adapter rather than a sweep through every handler.
 *
 * Authored before its first consumer on purpose: the roadmap sequences requirements → contract
 * → schema → implementation, and a projection invented alongside its first handler is a
 * projection shaped by that handler. `T-M01-025` lands the guard, the resolver and the tables.
 */

/**
 * Who is acting. `userId` is HelioGrid's identifier for the person, not the provider's — the
 * provider's id is FROZEN at the boundary (a stable representation chosen once) so provider
 * storage shapes never reach product packages.
 */
export const actorSchema = z.object({
  userId: uuidSchema,
  /**
   * E.164. The person is phone-keyed: any placeholder email a provider requires stays
   * internal, unique, non-deliverable, and absent from product identity and copy.
   */
  phoneE164: z.string(),
  displayName: z.string(),
});
export type Actor = z.infer<typeof actorSchema>;

/**
 * The membership the request is acting UNDER. Tenancy never travels on the wire
 * (`packages/contracts/CLAUDE.md`) — it is resolved here from the verified session, which is
 * exactly why this projection exists rather than a tenant header.
 */
export const membershipSchema = z.object({
  tenantId: uuidSchema,
  /** Every preset held in THIS tenant. Stacking is the design (F2-10); OR is the check (F2-11). */
  roles: roleSetSchema,
  /**
   * Bumped whenever anything that changes what this person may do changes — a role granted or
   * removed, membership suspended, tenant switched, session revoked.
   *
   * It exists so a cached or token-carried claim can be REJECTED rather than trusted for its
   * remaining lifetime. Without it, "revocation takes effect within ten minutes" is a hope
   * about token expiry; with it, it is a comparison.
   */
  authorizationVersion: z.number().int().nonnegative(),
});
export type Membership = z.infer<typeof membershipSchema>;

/** When this session stops being usable, and what last kept it alive. */
export const sessionExpirySchema = z.object({
  expiresAt: z.string().datetime(),
  /**
   * Server-authoritative last FOREGROUND authenticated use. Background
   * refresh, push handling and scheduled work must never write it: the seven-day mobile idle
   * clock is only meaningful if background traffic cannot reset it.
   */
  lastForegroundActivityAt: z.string().datetime().nullable(),
});
export type SessionExpiry = z.infer<typeof sessionExpirySchema>;

export const sessionProjectionSchema = z.object({
  actor: actorSchema,
  /**
   * `null` for a verified account with no company yet — the abandoned signup that resumes at
   * the company step (`M01-10`). Every tenant-scoped route refuses such a session; the signup
   * and profile routes are exactly the ones that accept it.
   */
  membership: membershipSchema.nullable(),
  expiry: sessionExpirySchema,
});
export type SessionProjection = z.infer<typeof sessionProjectionSchema>;

/**
 * What the API token carries, and NOTHING more (`M01-07`): who, which session, and the
 * membership acted under. The guard compares `membership.authorizationVersion` to the row on
 * every call, so a token is never trusted for its remaining life. `exp` is the JWT's own claim
 * and is not restated here.
 */
export const sessionClaimsSchema = z.object({
  sub: uuidSchema,
  sid: uuidSchema,
  membership: membershipSchema.nullable(),
});
export type SessionClaims = z.infer<typeof sessionClaimsSchema>;
