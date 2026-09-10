import * as audit from './audit';
import * as identity from './identity';
import * as invitation from './invitation';
import * as market from './market';
import * as settings from './settings';
import * as tenant from './tenant';

/**
 * Every table the migrations built, as one object: what `createDb` describes to Drizzle and what
 * the schema-parity invariant compares against the live database. A new area is a file beside
 * these and one spread here.
 */
export const schema = {
  ...market,
  ...tenant,
  ...identity,
  ...audit,
  ...invitation,
  ...settings,
};

export * from './audit';
export * from './identity';
export * from './invitation';
export * from './market';
export * from './settings';
export * from './tenant';
