/**
 * The CRM module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and the
 * pieces every later CRM slice and the search module build on — so the scope predicate, the
 * timeline writer, the lead read and the number match each exist once.
 *
 * Each writer and reader takes the CALLER's transaction, so what it writes commits with the change
 * that caused it, and names its tenant in every query.
 */
export { leadAssignersOf, leadHoldersOf, openLeadCountsOf } from './crm.assign-load.repository';
export { customerRecordOf } from './crm.customer-record.repository';
export {
  currentLeadOf,
  customerIdsOf,
  customerInScope,
  lockPhone,
  type PhoneMatch,
  phoneMatchOf,
} from './crm.customers.repository';
export { applyLeadEdit } from './crm.edits.repository';
export {
  leadCustomerJoin,
  leadOwner,
  leadSummaryColumns,
  memberNameOf,
} from './crm.lead-columns.repository';
export {
  findLeadInScope,
  loadLeadDetail,
  openTasksOf,
  type ScopedLead,
} from './crm.lead-detail.repository';
export { leadFilesOf } from './crm.lead-files.repository';
export {
  type LockedLead,
  lockLeadInScope,
  lockLeadOfCompany,
  personOf,
} from './crm.lead-lock.repository';
export { siblingOf as siblingProposalOf } from './crm.lead-proposals.repository';
export { activeMemberOf } from './crm.member-roles.repository';
export { CrmModule } from './crm.module';
export {
  closeTasksRaisedBy,
  moveTaskDue,
  openTaskRaisedBy,
  raiseTask,
  type TaskToRaise,
} from './crm.raised-tasks.repository';
export {
  activeLead,
  awaitingTriage,
  leadReadableBy,
  leadScopeWhere,
} from './crm.scope.repository';
export {
  type ActivityActorRef,
  type ActivityBody,
  type ActivityEntry,
  leadLifecycleColumns,
  leadWorkedOn,
  type MovedLead,
  type RecordedActivity,
  recordActivity,
  recordLeadMoves,
} from './crm.timeline.repository';
export type { LeadFieldEdit } from './internal/field-changes';
export {
  type LeadLifecycleRow,
  lifecycleColumnsOf,
  lifecycleOf,
} from './internal/lead-lifecycle';
export { type LeadMoney, leadSummaryOf, memberRefOf, moneyOf } from './internal/lead-wire';
export { phoneLockKey } from './internal/phone-lock';
export { actorNameOf, type LeadReader, readerOf } from './internal/reader';
export { sitePinOf } from './internal/site-pin';
