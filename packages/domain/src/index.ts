/**
 * @heliogrid/domain — pure isomorphic domain logic (ADR-0021).
 *
 * Imports allowed: the TypeScript stdlib. Nothing else in the workspace — this is the BOTTOM
 * layer, so packages/contracts imports IT, never the reverse (owner ruling 2026-07-30).
 * A business enum both layers need is defined here as a pure union and contracts builds its
 * `z.enum` from it; importing contracts from here would be a package cycle.
 * Never: NestJS · React · React Native · storage · fetch · env reads · packages/db ·
 * packages/ui · any app. Rules, catalogs and market config are INJECTED parameters,
 * never module-level globals.
 *
 * dependency-cruiser enforces this (domain-purity-no-layers, domain-purity-no-frameworks) —
 * rules that were inert until this package existed, because they targeted a path that
 * matched nothing.
 *
 * Deliberately empty of behaviour. The login state machine was to seed it, but auth is being
 * rebuilt (auth-tenancy ruling 6), so it arrives with that rebuild; formatters and the invite
 * and role invariants land with the first slice that needs them (Law 9). The package exists
 * now so the purity rules are live BEFORE the code they must police, rather than arriving in
 * the same change.
 */
export {};
