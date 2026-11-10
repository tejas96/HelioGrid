import type { CallOutcome, LeadDetail } from '@heliogrid/contracts';
import { type DbTransaction, lead, type TenantPool } from '@heliogrid/db';
import { activityRecorded, callAnswered, type MessagingWindow } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey, Keyed } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  detailAfterAct,
  type LockedLead,
  lockLeadInScope,
  personOf,
} from './crm.lead-lock.repository';
import { keepOneRetry } from './crm.raised-tasks.repository';
import { activityMadeWith, recordActivity, recordLeadMoves } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** A call as logged: what happened, the person's words, and when their device logged it. */
export interface LoggedCall {
  readonly outcome: CallOutcome;
  readonly note: string | null;
  readonly capturedAt: Date;
}

export type LeadWorkOutcome = Keyed<LeadDetail> | { readonly outcome: 'not-found' };

const NOT_FOUND = { outcome: 'not-found' } as const;

/**
 * Logging what happened on a lead (`M02-35`, `M02-43`) on the runtime pool: each a timeline entry
 * that carries its create's retry key, so a retried send writes nothing twice (`F4-07`), and any
 * entry returns a dormant lead to its stage (`M02-52`).
 */
@Injectable()
export class CrmCallsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * A call (`M02-43`): answered moves a `new` lead to `contacted` and clears the failed tries; no
   * answer counts one more and keeps one retry, due inside the calling window — on a lead someone
   * may still dial and is working (`M02-44`).
   */
  async logCall(
    reader: LeadReader,
    leadId: string,
    call: LoggedCall,
    window: MessagingWindow,
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
  ): Promise<LeadWorkOutcome> {
    return this.keyedWork(reader, leadId, money, key, async (tx, locked) => {
      await recordActivity(tx, {
        tenantId: locked.tenantId,
        customerId: locked.customerId,
        leadId,
        kind: 'call',
        body: { outcome: call.outcome, note: call.note },
        actor: personOf(act),
        capturedAt: call.capturedAt,
        retryKey: key,
      });
      if (call.outcome === 'answered') {
        await answered(tx, locked, act, call.capturedAt);
        return;
      }
      await countUnanswered(tx, locked);
      if (!mayRetry(locked)) return;
      await keepOneRetry(tx, {
        tenantId: locked.tenantId,
        leadId,
        assigneeUserId: locked.lifecycle.ownerId ?? act.actorUserId,
        raisedBy: act.actorUserId,
        at: new Date(act.now),
        timeZone: locked.timeZone,
        window,
      });
    });
  }

  /** A note on the lead's timeline (`M02-35`). */
  async addNote(
    reader: LeadReader,
    leadId: string,
    note: { readonly text: string; readonly capturedAt: Date },
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
  ): Promise<LeadWorkOutcome> {
    return this.keyedWork(reader, leadId, money, key, async (tx, locked) => {
      await recordActivity(tx, {
        tenantId: locked.tenantId,
        customerId: locked.customerId,
        leadId,
        kind: 'note',
        body: { text: note.text },
        actor: personOf(act),
        capturedAt: note.capturedAt,
        retryKey: key,
      });
    });
  }

  /**
   * One keyed piece of work on a locked lead: a send whose key already wrote its entry answers the
   * lead as it stands, a key reused for another request answers that, and a lead outside the
   * reader's scope is not found.
   */
  private keyedWork(
    reader: LeadReader,
    leadId: string,
    money: LeadMoney,
    key: CreationKey | null,
    work: (tx: DbTransaction, locked: LockedLead) => Promise<void>,
  ): Promise<LeadWorkOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const made = await activityMadeWith(tx, tenantId, key);
        if (made !== null) {
          if (made.fingerprint !== key.fingerprint) return { outcome: 'key-reused' };
          return { outcome: 'replayed', row: await detailAfterAct(tx, reader, leadId, money) };
        }
      }
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return NOT_FOUND;
      await work(tx, locked);
      return { outcome: 'created', row: await detailAfterAct(tx, reader, leadId, money) };
    });
  }
}

/**
 * An answered call: the lead as the call's entry left it — a dormant one already returned — moves
 * from `new` to `contacted`, and its failed tries start again from none.
 */
async function answered(
  tx: DbTransaction,
  locked: LockedLead,
  act: Act,
  capturedAt: Date,
): Promise<void> {
  const worked = activityRecorded(locked.lifecycle);
  const now = worked.kind === 'moved' ? worked.next : locked.lifecycle;
  await recordLeadMoves(tx, locked, callAnswered(now), personOf(act), capturedAt);
  await tx
    .update(lead)
    .set({ unansweredCalls: 0 })
    .where(and(eq(lead.tenantId, locked.tenantId), eq(lead.id, locked.leadId)));
}

/** One more failed try since the last answered call, shown to the lead's owner (`M02-43`). */
async function countUnanswered(tx: DbTransaction, locked: LockedLead): Promise<void> {
  await tx
    .update(lead)
    .set({ unansweredCalls: sql`${lead.unansweredCalls} + 1` })
    .where(and(eq(lead.tenantId, locked.tenantId), eq(lead.id, locked.leadId)));
}

/**
 * A retry is scheduled only for a number someone may dial (`M02-44`) on a lead being worked: an
 * active one, or a dormant one this very call returned. A parked or closed lead raises no call task
 * — a snoozed one wakes with its own, a lost or disqualified one waits for a reopen.
 */
function mayRetry(locked: LockedLead): boolean {
  const { state } = locked.lifecycle;
  return locked.canDial && (state === null || state === 'dormant');
}
