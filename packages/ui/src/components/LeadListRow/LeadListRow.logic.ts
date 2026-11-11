import type { TranslatedText } from '@heliogrid/contracts';
import {
  type FormatPack,
  formatPhone,
  type LeadRowNext,
  type LeadSource,
  type LeadStage,
  leadBillShownOf,
  type MinorUnits,
  minorUnitsOfDecimal,
} from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark';
import { LEAD_STATE_TONE } from '../LeadStateBadge/LeadStateBadge.logic';
import type { LeadNextMarkProps, ListedLead } from './LeadListRow.types';

/**
 * Each next step's meaning as a tone: a parked lead takes its state's (`LeadStateBadge`); calls
 * that went unanswered are a caution; a task due is the accent's plan, and past due a problem.
 */
export function leadNextToneOf({
  kind,
  overdue,
}: Pick<LeadNextMarkProps, 'kind' | 'overdue'>): StatusTone {
  switch (kind) {
    case 'snoozed':
    case 'dormant':
      return LEAD_STATE_TONE[kind];
    case 'tries':
      return 'warning';
    case 'task':
      return overdue ? 'danger' : 'accent';
  }
}

/** A lead's next step as its mark, worded by the caller; nothing when nothing comes next. */
export function leadNextMarkOf(
  next: LeadRowNext,
  label: TranslatedText | null,
): LeadNextMarkProps | null {
  if (next.kind === 'none' || label === null) return null;
  return { kind: next.kind, overdue: next.kind === 'task' && next.overdue, label };
}

/** What a list row reads of a lead; the wire's list row satisfies it. */
export interface ListableLead {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
  readonly source: LeadSource | (string & {});
  readonly stage: LeadStage;
  readonly owner: { readonly name: string } | null;
  readonly monthlyBill: { readonly amount: string } | null;
}

/** A lead as the row draws it, its bill in the tenant's money as every CRM screen shows one. */
export function listedLeadOf(lead: ListableLead, pack: FormatPack): ListedLead {
  return {
    id: lead.id,
    name: lead.name,
    phone: formatPhone(pack, lead.phoneE164),
    city: lead.city,
    source: lead.source,
    stage: lead.stage,
    bill: leadBillShownOf(lead.monthlyBill, pack),
    owner: lead.owner?.name ?? null,
  };
}

/**
 * Where a lead's bill falls in the list's order: whole minor units, compared without a float, so a
 * re-sort on the client agrees with the server's order to the paisa; null while the bill is unknown.
 */
export function listedBillOrderOf(lead: ListableLead, pack: FormatPack): MinorUnits | null {
  return lead.monthlyBill === null
    ? null
    : minorUnitsOfDecimal(lead.monthlyBill.amount, pack.minorUnitDigits);
}
