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
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
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

/** What a next step is, as the glyph before its words: a call is a phone, any other task a date. */
function leadNextGlyphOf(next: Exclude<LeadRowNext, { kind: 'none' }>): ShellGlyphName {
  switch (next.kind) {
    case 'snoozed':
      return 'clock';
    case 'dormant':
      return 'moon';
    case 'tries':
      return 'phone';
    case 'task':
      return next.task === 'call' ? 'phone' : 'calendar-check';
  }
}

/** A lead's next step as its mark, worded by the caller; nothing when nothing comes next. */
export function leadNextMarkOf(
  next: LeadRowNext,
  label: TranslatedText | null,
): LeadNextMarkProps | null {
  if (next.kind === 'none' || label === null) return null;
  return {
    kind: next.kind,
    overdue: next.kind === 'task' && next.overdue,
    glyph: leadNextGlyphOf(next),
    label,
  };
}

/**
 * Each stage's glyph, drawn before its word in the stage's own tone (`LEAD_STAGE_TONE`) — status
 * is never the tint alone (`CLAUDE.md` §10).
 */
export const LEAD_STAGE_GLYPH: Record<LeadStage, ShellGlyphName> = {
  new: 'spark',
  contacted: 'phone',
  qualified: 'tick',
  survey: 'pin',
  design: 'grid',
  proposal: 'file-text',
  negotiating: 'chat',
  won: 'circle-check',
};

/** The glyph's ink for a mark's tone: the neutral mark is the quiet ink, every other its own. */
export const MARK_GLYPH_TONE = {
  neutral: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  accent: 'accent',
} as const satisfies Record<StatusTone, string>;

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
