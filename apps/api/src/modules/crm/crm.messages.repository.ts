import type { CrmMessageTemplateKey } from '@heliogrid/contracts';
import {
  customer,
  type DbTransaction,
  lead,
  leadVisitBooking,
  type TenantPool,
  tenant,
  userAccount,
} from '@heliogrid/db';
import {
  type CalendarDate,
  clockTimeHhmm,
  clockTimeOfMinutes,
  localDate,
  localMinutes,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { leadCustomerJoin } from './crm.lead-columns.repository';
import { personOf } from './crm.lead-lock.repository';
import { leadScopeWhere } from './crm.scope.repository';
import { activityMadeWith, recordActivity } from './crm.timeline.repository';
import type { LeadReader } from './internal/reader';

/** Which message, for which visit, and when the person's device composed it. */
export interface MessageRequest {
  readonly templateKey: CrmMessageTemplateKey;
  readonly visitId: string | null;
  readonly capturedAt: Date;
}

/** A person the message names, with the number the customer reaches them on. */
export interface NamedPerson {
  readonly name: string | null;
  readonly phoneE164: string;
}

/** Everything a message is filled from — read once, in the language the customer reads. */
export interface MessageFacts {
  readonly templateKey: CrmMessageTemplateKey;
  readonly language: UiLanguage;
  readonly customerName: string | null;
  readonly companyName: string;
  /** The person sending it from their own phone. */
  readonly sender: NamedPerson;
  readonly visit: {
    readonly date: CalendarDate;
    readonly time: string;
    readonly surveyor: NamedPerson;
    readonly address: string;
  } | null;
}

export type ComposeOutcome = Keyed<MessageFacts> | { readonly outcome: 'not-found' };

const sender = alias(userAccount, 'message_sender');
const surveyor = alias(userAccount, 'visit_surveyor');

/**
 * Customer messages as copy-paste text (`M02-33`, `M02-47`, `M02-48`, RFC decision 15) on the
 * runtime pool. Composing records "Message copied" on the timeline and claims no delivery; a visit
 * is messaged once — its confirmation, or for a no-show's successor its one reminder — and a second
 * compose for it answers the same words and records nothing (`reminder_composed_at`).
 */
@Injectable()
export class CrmMessagesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async compose(
    reader: LeadReader,
    leadId: string,
    request: MessageRequest,
    act: Act,
    key: CreationKey | null,
  ): Promise<ComposeOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const earlier = key === null ? null : await sentBefore(tx, tenantId, key);
      const facts = await factsOf(tx, reader, leadId, request, act.actorUserId);
      if (facts === null) return { outcome: 'not-found' };
      if (earlier !== null && key !== null)
        return replayOf(facts.message, earlier.fingerprint, key);
      if (await isRecorded(tx, tenantId, request, act)) {
        await recordActivity(tx, {
          tenantId,
          customerId: facts.customerId,
          leadId,
          kind: 'message_copied',
          body: { templateKey: request.templateKey, visitId: request.visitId },
          actor: personOf(act),
          capturedAt: request.capturedAt,
          retryKey: key,
        });
      }
      return { outcome: 'created', row: facts.message };
    });
  }
}

/** The entry an earlier send with this key wrote, taken under the key's lock (`F4-07`). */
async function sentBefore(tx: DbTransaction, tenantId: string, key: CreationKey) {
  await lockCreationKey(tx, key);
  return activityMadeWith(tx, tenantId, key);
}

/**
 * The message's facts: the lead in the reader's scope, its customer and their language — else the
 * company's document language — the company, the sender, and the visit when one is named, which
 * must be this lead's. `null` answers 404.
 */
async function factsOf(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  request: MessageRequest,
  senderId: string,
): Promise<{ customerId: string; message: MessageFacts } | null> {
  const [row] = await tx
    .select({
      customerId: lead.customerId,
      customerName: customer.name,
      preferredLanguage: customer.preferredLanguage,
      companyName: tenant.companyName,
      defaultLanguage: tenant.defaultLanguage,
      timeZone: tenant.timezone,
      senderName: sender.name,
      senderPhone: sender.phoneE164,
    })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .innerJoin(tenant, eq(tenant.id, lead.tenantId))
    .innerJoin(sender, eq(sender.id, senderId))
    .where(
      and(
        eq(lead.tenantId, reader.tenantId),
        eq(lead.id, leadId),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    );
  if (row === undefined) return null;
  const visit =
    request.visitId === null
      ? null
      : await visitOf(tx, reader.tenantId, leadId, request.visitId, row.timeZone);
  if (request.visitId !== null && visit === null) return null;
  return {
    customerId: row.customerId,
    message: {
      templateKey: request.templateKey,
      language: row.preferredLanguage ?? row.defaultLanguage,
      customerName: row.customerName,
      companyName: row.companyName,
      sender: { name: row.senderName, phoneE164: row.senderPhone },
      visit,
    },
  };
}

/** The lead's visit by id, its moment on the company's clock; `null` for another lead's. */
async function visitOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  visitId: string,
  timeZone: string,
): Promise<MessageFacts['visit']> {
  const [booking] = await tx
    .select({
      scheduledAt: leadVisitBooking.scheduledAt,
      address: leadVisitBooking.address,
      surveyorName: surveyor.name,
      surveyorPhone: surveyor.phoneE164,
    })
    .from(leadVisitBooking)
    .innerJoin(surveyor, eq(surveyor.id, leadVisitBooking.surveyorUserId))
    .where(
      and(
        eq(leadVisitBooking.tenantId, tenantId),
        eq(leadVisitBooking.leadId, leadId),
        eq(leadVisitBooking.id, visitId),
      ),
    );
  if (booking === undefined) return null;
  const at = booking.scheduledAt.getTime();
  return {
    date: localDate(at, timeZone),
    time: clockTimeHhmm(clockTimeOfMinutes(localMinutes(at, timeZone))),
    surveyor: { name: booking.surveyorName, phoneE164: booking.surveyorPhone },
    address: booking.address,
  };
}

/**
 * Whether this compose is a message the timeline records: every nudge is; a visit's message only
 * the first time, which marks the visit (`M02-48`) — set once where still null, so of two composes
 * at one moment only one records it.
 */
async function isRecorded(
  tx: DbTransaction,
  tenantId: string,
  request: MessageRequest,
  act: Act,
): Promise<boolean> {
  const visitId = request.visitId;
  if (request.templateKey !== 'visit_confirmation' || visitId === null) return true;
  const marked = await tx
    .update(leadVisitBooking)
    .set({ reminderComposedAt: new Date(act.now) })
    .where(
      and(
        eq(leadVisitBooking.tenantId, tenantId),
        eq(leadVisitBooking.id, visitId),
        isNull(leadVisitBooking.reminderComposedAt),
      ),
    )
    .returning({ id: leadVisitBooking.id });
  return marked.length > 0;
}
