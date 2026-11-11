import * as activity from './activity';
import * as audit from './audit';
import * as billing from './billing';
import * as catalogImport from './catalog-import';
import * as catalogPlatform from './catalog-platform';
import * as catalogTenant from './catalog-tenant';
import * as checkout from './checkout';
import * as crmDailySweep from './crm-daily-sweep';
import * as customer from './customer';
import * as dunning from './dunning';
import * as entitlement from './entitlement';
import * as file from './file';
import * as identity from './identity';
import * as invitation from './invitation';
import * as invoice from './invoice';
import * as lead from './lead';
import * as leadFile from './lead-file';
import * as leadHistory from './lead-history';
import * as leadImport from './lead-import';
import * as leadVisitBooking from './lead-visit-booking';
import * as market from './market';
import * as memberPhoto from './member-photo';
import * as notification from './notification';
import * as outbox from './outbox';
import * as planChange from './plan-change';
import * as priceBook from './price-book';
import * as project from './project';
import * as projectInstallation from './project-installation';
import * as projectPapers from './project-papers';
import * as settings from './settings';
import * as subject from './subject';
import * as task from './task';
import * as tenant from './tenant';
import * as tenantCounter from './tenant-counter';
import * as usage from './usage';

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
  ...notification,
  ...file,
  ...memberPhoto,
  ...settings,
  ...subject,
  ...catalogPlatform,
  ...catalogTenant,
  ...catalogImport,
  ...priceBook,
  ...outbox,
  ...billing,
  ...checkout,
  ...planChange,
  ...entitlement,
  ...usage,
  ...dunning,
  ...invoice,
  ...customer,
  ...lead,
  ...leadHistory,
  ...leadFile,
  ...tenantCounter,
  ...project,
  ...projectPapers,
  ...projectInstallation,
  ...activity,
  ...task,
  ...leadVisitBooking,
  ...leadImport,
  ...crmDailySweep,
};

export * from './activity';
export * from './audit';
export * from './billing';
export * from './catalog-import';
export * from './catalog-platform';
export * from './catalog-tenant';
export * from './checkout';
export * from './crm-daily-sweep';
export * from './customer';
export * from './dunning';
export * from './entitlement';
export * from './file';
export * from './identity';
export * from './invitation';
export * from './invoice';
export * from './lead';
export * from './lead-file';
export * from './lead-history';
export * from './lead-import';
export * from './lead-visit-booking';
export * from './market';
export * from './member-photo';
export * from './notification';
export * from './outbox';
export * from './plan-change';
export * from './price-book';
export * from './project';
export * from './project-installation';
export * from './project-papers';
export * from './settings';
export * from './subject';
export * from './task';
export * from './tenant';
export * from './tenant-counter';
export * from './usage';
