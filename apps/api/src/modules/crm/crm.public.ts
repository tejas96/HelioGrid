/**
 * The CRM module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and the
 * pieces every later CRM slice and the search module build on — so the scope predicate, the
 * timeline writer, the lead read and the number match each exist once.
 *
 * Each writer and reader takes the CALLER's transaction, so what it writes commits with the change
 * that caused it, and names its tenant in every query.
 */
export { customerRecordOf } from './crm.customer-record.repository';
export {
  currentLeadOf,
  customerIdsOf,
  customerInScope,
  lockPhone,
  type PhoneMatch,
  phoneMatchOf,
} from './crm.customers.repository';
export {
  leadCustomerJoin,
  leadOwner,
  leadSummaryColumns,
  memberNameOf,
} from './crm.lead-columns.repository';
export { findLeadInScope, loadLeadDetail, type ScopedLead } from './crm.lead-detail.repository';
export { CrmModule } from './crm.module';
export { leadReadableBy, leadScopeWhere } from './crm.scope.repository';
export {
  type ActivityActorRef,
  type ActivityBody,
  type ActivityEntry,
  leadLifecycleColumns,
  type MovedLead,
  type RecordedActivity,
  recordActivity,
  recordLeadMoves,
} from './crm.timeline.repository';
export {
  type LeadLifecycleRow,
  lifecycleColumnsOf,
  lifecycleOf,
} from './internal/lead-lifecycle';
export { type LeadMoney, leadSummaryOf, moneyOf } from './internal/lead-wire';
export { phoneLockKey } from './internal/phone-lock';
export { type LeadReader, readerOf } from './internal/reader';
