import * as market from './market';

/**
 * Every table the migrations built, as one object: what `createDb` describes to Drizzle and what
 * the schema-parity invariant compares against the live database. A new area is a file beside
 * `market.ts` and one spread here.
 */
export const schema = { ...market };

export * from './market';
