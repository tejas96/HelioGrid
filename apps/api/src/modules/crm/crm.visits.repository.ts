import type { LeadDetail, MemberRef } from '@heliogrid/contracts';
import { type DbTransaction, leadVisitBooking, type TenantPool } from '@heliogrid/db';
import {
  type CalendarDate,
  type ClockTime,
  clockTimeHhmm,
  type LeadActRefusal,
  localInstant,
  visitBooked,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  detailAfterAct,
  type LockedLead,
  lockLeadInScope,
  personOf,
} from './crm.lead-lock.repository';
import { activeMembersHolding } from './crm.member-roles.repository';
import { cancelOpenTasks, raiseTask } from './crm.raised-tasks.repository';
import { recordActivity, recordLeadMoves } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** When and where a visit is, and who goes — on a reschedule, absent where it carries over. */
export interface VisitSlot {
  readonly date: CalendarDate;
  readonly time: ClockTime;
  readonly surveyorId: string | null;
  readonly address: string | null;
  readonly capturedAt: Date;
}

/** Why a visit was not written. */
export type VisitRefusal =
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'already-booked' }
  | { readonly outcome: 'already-rescheduled' }
  | { readonly outcome: 'surveyor-unavailable' }
  | { readonly outcome: 'refused'; readonly refusal: LeadActRefusal };

export type VisitOutcome = Keyed<LeadDetail> | VisitRefusal;

/** A visit written on a lead, or why it was not. */
type VisitWrite = { readonly outcome: 'written'; readonly leadId: string } | VisitRefusal;

/** The visit being replaced, as a reschedule reads it. */
interface Booked {
  readonly id: string;
  readonly leadId: string;
  readonly surveyorUserId: string;
  readonly address: string;
}

const replacement = alias(leadVisitBooking, 'replacement');

/**
 * The site-visit booking (`M02-46`…`M02-48`, T-M02-014) on the runtime pool: the lead's record of
 * the visit M04 takes over. A booking moves the lead to `survey`, lands on the timeline and hands
 * the surveyor a site-visit task; a lead holds one visit in force, and a no-show is replaced by a
 * successor once.
 */
@Injectable()
export class CrmVisitsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Every member a booking accepts as its surveyor, by name. */
  async surveyors(tenantId: string): Promise<MemberRef[]> {
    return this.db.withTenantTransaction(tenantId, (tx) =>
      activeMembersHolding(tx, tenantId, SURVEYING),
    );
  }

  async book(
    reader: LeadReader,
    leadId: string,
    slot: VisitSlot,
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
  ): Promise<VisitOutcome> {
    return this.keyed(reader, money, key, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      if (await hasVisitInForce(tx, locked)) return { outcome: 'already-booked' };
      return writeVisit(tx, locked, slot, null, act, key);
    });
  }

  /** A no-show's successor (`M02-48`): the slot's surveyor and address carry over unless sent. */
  async reschedule(
    reader: LeadReader,
    visitId: string,
    slot: VisitSlot,
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
  ): Promise<VisitOutcome> {
    const { tenantId } = reader;
    return this.keyed(reader, money, key, async (tx) => {
      const [previous] = await tx
        .select({
          id: leadVisitBooking.id,
          leadId: leadVisitBooking.leadId,
          surveyorUserId: leadVisitBooking.surveyorUserId,
          address: leadVisitBooking.address,
        })
        .from(leadVisitBooking)
        .where(and(eq(leadVisitBooking.tenantId, tenantId), eq(leadVisitBooking.id, visitId)));
      if (previous === undefined) return { outcome: 'not-found' };
      const locked = await lockLeadInScope(tx, reader, previous.leadId);
      if (locked === null) return { outcome: 'not-found' };
      if (await wasReplaced(tx, tenantId, previous.id)) return { outcome: 'already-rescheduled' };
      return writeVisit(tx, locked, slot, previous, act, key);
    });
  }

  /** A send whose key already booked answers that booking's lead; a reused key answers so. */
  private keyed(
    reader: LeadReader,
    money: LeadMoney,
    key: CreationKey | null,
    write: (tx: DbTransaction) => Promise<VisitWrite>,
  ): Promise<VisitOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({
            leadId: leadVisitBooking.leadId,
            fingerprint: leadVisitBooking.creationFingerprint,
          })
          .from(leadVisitBooking)
          .where(
            and(eq(leadVisitBooking.tenantId, tenantId), eq(leadVisitBooking.creationKey, key.key)),
          );
        if (made) {
          if (made.fingerprint !== key.fingerprint) return { outcome: 'key-reused' };
          const row = await detailAfterAct(tx, reader, made.leadId, money);
          return replayOf(row, made.fingerprint, key);
        }
      }
      const written = await write(tx);
      if (written.outcome !== 'written') return written;
      return { outcome: 'created', row: await detailAfterAct(tx, reader, written.leadId, money) };
    });
  }
}

/**
 * The booking and everything it carries: the stage move to `survey`, the timeline entry, and the
 * surveyor's site-visit task due at the visit. A reschedule marks the replaced visit a no-show and
 * cancels the site-visit task it gave.
 */
async function writeVisit(
  tx: DbTransaction,
  locked: LockedLead,
  slot: VisitSlot,
  previous: Booked | null,
  act: Act,
  key: CreationKey | null,
): Promise<VisitWrite> {
  const { tenantId, leadId } = locked;
  const surveyor = await surveyorOf(tx, tenantId, slot.surveyorId ?? previous?.surveyorUserId);
  if (surveyor === null) return { outcome: 'surveyor-unavailable' };
  const result = visitBooked(locked.lifecycle);
  if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
  const at = new Date(act.now);
  const scheduledAt = new Date(localInstant(slot.date, slot.time, locked.timeZone));
  const address = slot.address ?? previous?.address ?? '';
  if (previous !== null) await markNoShow(tx, tenantId, previous.id, at);
  const [booking] = await tx
    .insert(leadVisitBooking)
    .values({
      tenantId,
      leadId,
      scheduledAt,
      surveyorUserId: surveyor.userId,
      address,
      rescheduledFromId: previous?.id ?? null,
      createdAt: at,
      createdBy: act.actorUserId,
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: leadVisitBooking.id });
  if (booking === undefined) throw new Error('the visit booking insert returned no row');
  await recordLeadMoves(tx, locked, result, personOf(act), slot.capturedAt);
  const facts = {
    visitId: booking.id,
    date: slot.date,
    time: clockTimeHhmm(slot.time),
    surveyor,
    address,
  };
  const entry = { tenantId, customerId: locked.customerId, leadId, actor: personOf(act) };
  if (previous === null) {
    await recordActivity(tx, {
      ...entry,
      kind: 'visit_booked',
      body: facts,
      capturedAt: slot.capturedAt,
    });
  } else {
    await cancelOpenTasks(tx, tenantId, [leadId], ['site_visit']);
    await recordActivity(tx, {
      ...entry,
      kind: 'visit_rescheduled',
      body: { ...facts, previousVisitId: previous.id },
      capturedAt: slot.capturedAt,
    });
  }
  await raiseTask(tx, {
    tenantId,
    leadId,
    assigneeUserId: surveyor.userId,
    kind: 'site_visit',
    provenance: 'visit_booked',
    dueAt: scheduledAt,
    raisedBy: act.actorUserId,
    at,
  });
  return { outcome: 'written', leadId };
}

/** Who may take a visit: an active member holding survey — anyone who does may go (`M02-46`, D15). */
const SURVEYING = 'survey.capture_surveys';

/** The surveyor named, when they may take the visit; `null` otherwise. */
async function surveyorOf(
  tx: DbTransaction,
  tenantId: string,
  userId: string | undefined | null,
): Promise<MemberRef | null> {
  if (userId === undefined || userId === null) return null;
  const [surveyor] = await activeMembersHolding(tx, tenantId, SURVEYING, userId);
  return surveyor ?? null;
}

/** Whether the lead holds a visit no reschedule has replaced — the one visit in force. */
async function hasVisitInForce(tx: DbTransaction, locked: LockedLead): Promise<boolean> {
  const [inForce] = await tx
    .select({ id: leadVisitBooking.id })
    .from(leadVisitBooking)
    .where(
      and(
        eq(leadVisitBooking.tenantId, locked.tenantId),
        eq(leadVisitBooking.leadId, locked.leadId),
        notExists(
          tx
            .select({ id: replacement.id })
            .from(replacement)
            .where(
              and(
                eq(replacement.tenantId, leadVisitBooking.tenantId),
                eq(replacement.rescheduledFromId, leadVisitBooking.id),
              ),
            ),
        ),
      ),
    )
    .limit(1);
  return inForce !== undefined;
}

async function wasReplaced(tx: DbTransaction, tenantId: string, visitId: string): Promise<boolean> {
  const [successor] = await tx
    .select({ id: leadVisitBooking.id })
    .from(leadVisitBooking)
    .where(
      and(eq(leadVisitBooking.tenantId, tenantId), eq(leadVisitBooking.rescheduledFromId, visitId)),
    )
    .limit(1);
  return successor !== undefined;
}

/** The replaced visit's customer did not show (`M02-48`), stamped once. */
async function markNoShow(
  tx: DbTransaction,
  tenantId: string,
  visitId: string,
  at: Date,
): Promise<void> {
  await tx
    .update(leadVisitBooking)
    .set({ noShowAt: at })
    .where(
      and(
        eq(leadVisitBooking.tenantId, tenantId),
        eq(leadVisitBooking.id, visitId),
        isNull(leadVisitBooking.noShowAt),
      ),
    );
}
