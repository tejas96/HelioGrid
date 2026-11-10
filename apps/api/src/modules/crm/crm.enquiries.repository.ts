import type {
  DealSegment,
  EnquiryLogged,
  LeadDetail,
  MemberRef,
  OwnerRequestSent,
} from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, type TenantPool } from '@heliogrid/db';
import type { UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { phoneMatchOf } from './crm.customers.repository';
import { leadCustomerJoin, leadOwner, memberNameOf } from './crm.lead-columns.repository';
import { findLeadInScope, loadLeadDetail } from './crm.lead-detail.repository';
import { leadReadableBy } from './crm.scope.repository';
import { activityMadeWith, recordActivity } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** What the capture typed, logged on the existing lead (`M02-11`). */
export interface EnquiryInput {
  readonly phoneE164: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly segment: DealSegment | null;
  readonly capturedAt: Date;
}

/** How the enquiry's notice reaches its readers: its words per language and the push's clock. */
export interface EnquiryNotice {
  readonly wordsIn: (language: UiLanguage) => NoticeWords;
  readonly quietHours: TenantQuietHours;
}

/** A write's answer and the notices it wrote, whose pushes leave after the commit. */
export interface Noticed<Answer> {
  readonly answer: Answer;
  readonly notified: readonly string[];
}

export type EnquiryOutcome = Keyed<LeadDetail | EnquiryLogged> | { readonly outcome: 'not-found' };
export type OwnerRequestOutcome = Keyed<OwnerRequestSent> | { readonly outcome: 'not-found' };

const NOT_FOUND = { outcome: 'not-found' } as const;

/**
 * The dedupe sheet's two enquiry answers (`M02-11`, `M02-08`): one `enquiry` entry on the existing
 * lead with what was typed, and a `lead_enquiry` notice to whoever its recipient rules name — the
 * owner, the EPC Owner when it has none. Neither moves the lead's stage, owner or assignment.
 */
@Injectable()
export class CrmEnquiriesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * How the lead reads in a notice — its customer's name, or `null` while it has none — for words
   * that go only to those who may read the lead. Any lead of the company, since an ask to its owner
   * comes from someone outside its scope; nothing read here reaches the asker.
   */
  async noticeFactsOf(
    tenantId: string,
    leadId: string,
  ): Promise<{ name: string | null; phoneE164: string } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ name: customer.name, phoneE164: customer.phoneE164 })
        .from(lead)
        .innerJoin(customer, leadCustomerJoin)
        .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
      return found ?? null;
    });
  }

  /**
   * Log enquiry on existing, on the lead the sheet showed — outside the scope too (`M02-08`). A
   * lead in the reader's scope answers as it stands; one outside it answers which lead and when,
   * and nothing the sheet did not already show.
   */
  async logEnquiry(
    reader: LeadReader,
    leadId: string,
    input: EnquiryInput,
    notice: EnquiryNotice,
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
  ): Promise<Noticed<EnquiryOutcome>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const target = await leadTheSheetShowed(tx, reader, leadId, input.phoneE164);
      if (target === null) return { answer: NOT_FOUND, notified: [] };
      const answerAt = async (loggedAt: Date): Promise<LeadDetail | EnquiryLogged> => {
        if (!target.inScope) return { leadId, loggedAt: loggedAt.toISOString() };
        const read = await loadLeadDetail(tx, reader, leadId, money);
        if (read === null) throw new Error(`lead ${leadId} vanished inside its own transaction`);
        return read;
      };
      if (key !== null) {
        await lockCreationKey(tx, key);
        const logged = await activityMadeWith(tx, tenantId, key);
        if (logged) {
          return {
            answer: replayOf(await answerAt(logged.appliedAt), logged.fingerprint, key),
            notified: [],
          };
        }
      }
      const entry = await logOn(tx, { tenantId, ...target }, input, null, act, key);
      const notified = await noticeOwner(tx, tenantId, target, notice, act);
      return { answer: { outcome: 'created', row: await answerAt(entry.appliedAt) }, notified };
    });
  }

  /**
   * Open existing outside the reader's scope (`M02-08`, RFC decision 11): the enquiry names the
   * asker and the owner is told. The asker learns only the owner's name — one of the sheet's three
   * facts — and when the request was made.
   */
  async askOwner(
    reader: LeadReader,
    asker: MemberRef,
    leadId: string,
    input: EnquiryInput,
    notice: EnquiryNotice,
    act: Act,
    key: CreationKey | null,
  ): Promise<Noticed<OwnerRequestOutcome>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const target = await leadTheSheetShowed(tx, reader, leadId, input.phoneE164);
      if (target === null) return { answer: NOT_FOUND, notified: [] };
      const sent = (requestedAt: Date): OwnerRequestSent => ({
        leadId,
        ownerName: target.ownerName,
        requestedAt: requestedAt.toISOString(),
      });
      if (key !== null) {
        await lockCreationKey(tx, key);
        const logged = await activityMadeWith(tx, tenantId, key);
        if (logged) {
          return {
            answer: replayOf(sent(logged.appliedAt), logged.fingerprint, key),
            notified: [],
          };
        }
      }
      const entry = await logOn(tx, { tenantId, ...target }, input, asker, act, key);
      const notified = await noticeOwner(tx, tenantId, target, notice, act);
      return { answer: { outcome: 'created', row: sent(entry.appliedAt) }, notified };
    });
  }
}

/**
 * The lead an enquiry lands on, with its owner's name: one in the reader's scope, or one outside
 * it only when the typed number is its customer's or a contact's — the lead the dedupe sheet
 * showed for that number. Any other id answers `null`, as one that does not exist, so neither
 * route lands on a lead its sender never met nor tells which ids exist.
 */
async function leadTheSheetShowed(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  phoneE164: string,
) {
  const target = await leadWithOwner(tx, reader.tenantId, leadId);
  if (target === null) return null;
  if ((await findLeadInScope(tx, reader, leadId)) !== null) return { ...target, inScope: true };
  const match = await phoneMatchOf(tx, reader, phoneE164);
  return match?.customerIds.includes(target.customerId) ? { ...target, inScope: false } : null;
}

/** Any lead of the company with its owner's name; `null` for another company's or none. */
async function leadWithOwner(tx: DbTransaction, tenantId: string, leadId: string) {
  const [found] = await tx
    .select({
      id: lead.id,
      customerId: lead.customerId,
      ownerUserId: lead.ownerUserId,
      ownerName: memberNameOf(leadOwner),
    })
    .from(lead)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  return found ?? null;
}

/** The one `enquiry` entry, naming the channel, what was typed and — on an ask — the asker. */
function logOn(
  tx: DbTransaction,
  target: { tenantId: string; id: string; customerId: string },
  input: EnquiryInput,
  askedBy: MemberRef | null,
  act: Act,
  key: CreationKey | null,
) {
  return recordActivity(tx, {
    tenantId: target.tenantId,
    customerId: target.customerId,
    leadId: target.id,
    kind: 'enquiry',
    body: {
      channel: 'quick_add',
      name: input.name,
      city: input.city,
      segment: input.segment,
      phoneE164: input.phoneE164,
      askedBy,
    },
    actor: { kind: 'person', userId: act.actorUserId },
    capturedAt: input.capturedAt,
    retryKey: key,
  });
}

/** `lead_enquiry` to the lead's owner — the EPC Owner when it has none — in each reader's words. */
async function noticeOwner(
  tx: DbTransaction,
  tenantId: string,
  target: { id: string; ownerUserId: string | null },
  notice: EnquiryNotice,
  act: Act,
): Promise<string[]> {
  const recipients = await recipientsFor(
    tx,
    tenantId,
    'lead_enquiry',
    { ownerUserId: target.ownerUserId, assigneeUserId: null, awaits: null },
    leadReadableBy(tx, tenantId, target.id),
  );
  return recordNotificationsTo(
    tx,
    recipients,
    {
      tenantId,
      type: 'lead_enquiry',
      subjectKind: 'lead',
      subjectRef: target.id,
      emittedAt: new Date(act.now),
    },
    notice.wordsIn,
    notice.quietHours,
  );
}
