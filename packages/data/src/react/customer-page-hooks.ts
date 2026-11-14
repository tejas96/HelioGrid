/** The customer page's view models (block 8): this file re-exports its slice's hooks. */
export type { LinkDeviceClass, LinkSectionViewed } from '../customer-link/public-repository';
export type { ProposalPageFactsRead } from '../proposals/document-snapshot';
export {
  proposalMoneyOf,
  proposalPageFactsOf,
  proposalSnapshotOf,
} from '../proposals/document-snapshot';
export type {
  CallSlot,
  CustomerPageScreen,
  CustomerPageScreenOptions,
  CustomerSheet,
} from './use-customer-page-screen';
export { CALL_SOON, callSlotsFrom, useCustomerPageScreen } from './use-customer-page-screen';
