/**
 * A `symbol`, not a string: a string DI token collides silently across modules and the
 * collision surfaces as the wrong provider being injected rather than as an error.
 */
export const TEMPORAL_CLIENT = Symbol.for('heliogrid.TemporalClient');
