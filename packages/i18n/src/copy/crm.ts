/**
 * The CRM's copy (`M02`), re-exported once so the package root names one line for the whole
 * area: the vocabulary and marks every lead surface shares, each screen's words, and the notices
 * and messages the api writes. Each module below is the copy; this file holds none of its own.
 */
export * from './assign-picker';
export * from './crm-vocabulary';
export * from './customer-merge';
export * from './customer-merge-pair';
export { type CrmMessageKey, crmMessageTemplate } from './customer-messages';
export * from './dedupe-sheet';
export * from './lead-act-failure';
export * from './lead-detail';
export * from './lead-detail-parts';
export * from './lead-detail-sheets';
export * from './lead-import';
export * from './lead-inbox';
export * from './lead-inbox-acts';
export * from './lead-marks';
export { leadAssignedNotice, leadEnquiryNotice, leadUnassignedNotice } from './lead-notices';
export * from './lead-timeline';
export * from './lead-timeline-stream';
export * from './leads-list';
export * from './quick-add';
export * from './search';
export * from './team-reassign';
