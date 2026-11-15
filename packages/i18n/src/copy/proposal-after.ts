/** The words of a proposal after it is built (block 8): this file re-exports its slice's copy modules. */

// The customer's page and the proposal screens' own words ride this barrel: the index is at its line limit.
export * from './customer-page';
export { disclosureWords } from './disclosure';
export * from './proposal-after-in-force';
export * from './proposal-after-lead';
export * from './proposal-after-links';
export * from './proposal-after-list';
export * from './proposal-after-messages';
export * from './proposal-after-standing';
export * from './proposal-after-track';
export type { ProposalTrackFormats } from './proposal-after-track-rows';
export * from './proposal-after-versions';
export * from './proposal-after-won';
export * from './proposal-document-notice';
export * from './proposal-document-title';
export * from './proposal-screens';
