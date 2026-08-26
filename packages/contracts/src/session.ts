import { z } from 'zod';
import { rolePresetSchema, uuidSchema } from './common';

/**
 * The HelioGrid session PROJECTION — the shape every guard, repository, screen and contract
 * sees, and the reason replacing or upgrading the identity provider changes none of them.
 *
 * It is deliberately NOT the provider's session. Better Auth (or whatever succeeds it) owns
 * user/session/account rows; HelioGrid owns tenants, memberships and roles. This type is
 * where the two are joined, once, at the boundary — so a provider upgrade is a mapping
 * change in one adapter rather than a sweep through every handler.
 *
 * STATUS: contract-only. No handler, guard or table exists yet — the M01 slice lands those.
 * It is authored first on purpose: the roadmap sequences requirements → contract → schema →
 * implementation, and a projection invented alongside its first consumer is a projection
 * shaped by that consumer.
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
  roles: z.array(rolePresetSchema).min(1),
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
   * Server-authoritative last FOREGROUND authenticated use (owner ruling `Q71`). Background
   * refresh, push handling and scheduled work must never write it: the seven-day mobile idle
   * clock is only meaningful if background traffic cannot reset it.
   */
  lastForegroundActivityAt: z.string().datetime().nullable(),
});
export type SessionExpiry = z.infer<typeof sessionExpirySchema>;

export const sessionProjectionSchema = z.object({
  actor: actorSchema,
  membership: membershipSchema,
  expiry: sessionExpirySchema,
});
export type SessionProjection = z.infer<typeof sessionProjectionSchema>;
