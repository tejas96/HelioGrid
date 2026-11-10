import { activity, customer, type DbTransaction, lead, leadImportRow } from '@heliogrid/db';
import { leadScopeOf, type UiLanguage } from '@heliogrid/domain';
import { and, eq, inArray, isNotNull, min, sql } from 'drizzle-orm';
import {
  type MayRead,
  type NoticeRecipient,
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { leadCustomerJoin } from './crm.lead-columns.repository';
import { ofImport } from './crm.lead-import-rows.repository';
import { leadScopeWhere } from './crm.scope.repository';

/** The leads one recipient is told about: one is named, several are counted. */
export type EnquiredLeads =
  | { readonly count: 1; readonly name: string | null; readonly phoneE164: string }
  | { readonly count: number };

/** How an import's enquiry notices read: each recipient's words, and the push's clock. */
export interface ImportEnquiryNotice {
  readonly wordsFor: (leads: EnquiredLeads) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly quietHours: TenantQuietHours;
}

interface EnquiredLead {
  readonly leadId: string;
  readonly ownerUserId: string | null;
  readonly name: string | null;
  readonly phoneE164: string;
  /** The file's first row that logged an enquiry on this lead. */
  readonly firstRow: number;
}

/**
 * One `lead_enquiry` notice per person for the whole import (`F6-12`'s storm rule): each lead the
 * run logged an enquiry on goes to whoever its recipient rules name — its owner, the EPC Owner
 * when it has none — and each person's leads are told in one notice, naming the lead when it is
 * one and counting them when they are more. Its subject is the first of them in the file, so the
 * notice opens a lead its recipient may read (`F6-02`) — never the import, which a person without
 * `crm.import_leads` may not open. Answers the notices written, for the push after the commit.
 */
export async function noticeEnquiryOwners(
  tx: DbTransaction,
  tenantId: string,
  jobId: string,
  notice: ImportEnquiryNotice,
  at: Date,
): Promise<string[]> {
  const byOwner = new Map<string | null, EnquiredLead[]>();
  for (const one of await enquiredLeadsOf(tx, tenantId, jobId)) {
    byOwner.set(one.ownerUserId, [...(byOwner.get(one.ownerUserId) ?? []), one]);
  }
  const byRecipient = new Map<string, { to: NoticeRecipient; leads: EnquiredLead[] }>();
  for (const [ownerUserId, leads] of byOwner) {
    const people = { ownerUserId, assigneeUserId: null, awaits: null };
    const mayRead = everyLeadReadableBy(tx, tenantId, leads);
    for (const to of await recipientsFor(tx, tenantId, 'lead_enquiry', people, mayRead)) {
      const told = byRecipient.get(to.userId) ?? { to, leads: [] };
      byRecipient.set(to.userId, { to, leads: [...told.leads, ...leads] });
    }
  }
  const written: string[] = [];
  for (const { to, leads } of byRecipient.values()) {
    const [first] = [...leads].sort((one, other) => one.firstRow - other.firstRow);
    if (first === undefined) continue;
    const wordsIn = await notice.wordsFor(
      leads.length === 1
        ? { count: 1, name: first.name, phoneE164: first.phoneE164 }
        : { count: leads.length },
    );
    const notices = await recordNotificationsTo(
      tx,
      [to],
      {
        tenantId,
        type: 'lead_enquiry',
        subjectKind: 'lead',
        subjectRef: first.leadId,
        emittedAt: at,
      },
      wordsIn,
      notice.quietHours,
    );
    written.push(...notices);
  }
  return written;
}

/** Each lead the run logged an enquiry on, once, with its owner and how it reads in a list. */
async function enquiredLeadsOf(
  tx: DbTransaction,
  tenantId: string,
  jobId: string,
): Promise<EnquiredLead[]> {
  return tx
    .select({
      leadId: lead.id,
      ownerUserId: lead.ownerUserId,
      name: customer.name,
      phoneE164: customer.phoneE164,
      firstRow: min(leadImportRow.rowNumber).mapWith(Number),
    })
    .from(leadImportRow)
    .innerJoin(
      activity,
      and(eq(activity.id, leadImportRow.enquiryActivityId), eq(activity.tenantId, tenantId)),
    )
    .innerJoin(lead, and(eq(lead.id, activity.leadId), eq(lead.tenantId, tenantId)))
    .innerJoin(customer, leadCustomerJoin)
    .where(and(ofImport(tenantId, jobId), isNotNull(leadImportRow.enquiryActivityId)))
    .groupBy(lead.id, lead.ownerUserId, customer.name, customer.phoneE164);
}

/** A notice about several leads goes only to someone who may read every one of them. */
function everyLeadReadableBy(
  tx: DbTransaction,
  tenantId: string,
  leads: readonly EnquiredLead[],
): MayRead {
  const ids = leads.map((one) => one.leadId);
  return async (candidate) => {
    const [readable] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(lead)
      .where(
        and(
          eq(lead.tenantId, tenantId),
          inArray(lead.id, ids),
          leadScopeWhere(leadScopeOf(candidate.roles), candidate.userId),
        ),
      );
    return readable?.count === ids.length;
  };
}
