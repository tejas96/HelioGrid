/**
 * @heliogrid/domain — pure isomorphic domain logic. Zero workspace imports; never reads the environment.
 *
 * Imports allowed: the TypeScript stdlib. Nothing else in the workspace — this is the BOTTOM
 * layer, so packages/contracts imports IT, never the reverse (owner ruling).
 * A business enum both layers need is defined here as a pure union and contracts builds its
 * `z.enum` from it; importing contracts from here would be a package cycle.
 * Never: NestJS · React · React Native · storage · fetch · env reads · packages/db ·
 * packages/ui · any app. Rules, catalogs and market config are INJECTED parameters,
 * never module-level globals.
 *
 * dependency-cruiser enforces this (domain-purity-no-layers, domain-purity-no-frameworks) —
 * rules that were inert until this package existed, because they targeted a path that
 * matched nothing.
 */

export * from './audit';
export * from './auth';
export * from './authz';
export * from './calling';
export * from './certification';
export * from './commerce';
export * from './format';
export * from './market';
export * from './money';
export * from './pricing';
export * from './rails';
export * from './subsidy';
export * from './tax';
export * from './tenancy';
