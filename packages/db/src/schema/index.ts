import * as audit from './audit';
import * as identity from './identity';
import * as market from './market';
import * as tenant from './tenant';

/**
 * Every table the migrations built, as one object: what `createDb` describes to Drizzle and what
 * the schema-parity invariant compares against the live database. A new area is a file beside
 * these and one spread here.
 */
export const schema = { ...market, ...tenant, ...identity, ...audit };

export * from './audit';
export * from './identity';
export * from './market';
export * from './tenant';
