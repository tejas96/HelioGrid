import type { ActivityActor, KnownActivity } from '@heliogrid/contracts';
import { activity, type DbTransaction, lead, leadStageTransition } from '@heliogrid/db';
import { activityRecorded, type LeadActResult, type LeadTransition } from '@heliogrid/domain';
import { and, eq, sql } from 'drizzle-orm';
import type { CreationKey } from '../../common/creation-key';
import { lifecycleColumnsOf, lifecycleOf } from './internal/lead-lifecycle';

/*
 * The timeline's writers (`M02-35`, T-M02-012): every module that records something on a lead or a
 * customer calls these ON ITS OWN TRANSACTION, so an entry commits with the change it records.
 */

/** The lead columns domain's two machines read and write (`lifecycle-model.ts`). */
export const leadLifecycleColumns = {
  stage: lead.stage,
  state: lead.lifecycleState,
  ownerId: lead.ownerUserId,
  wakeOn: lead.snoozeWakeOn,
  resurfaceOn: lead.resurfaceOn,
  noCallUntil: lead.noCallUntil,
  closedAs: lead.closedAs,
  disqualifyReason: lead.disqualifyReason,
  lostReason: lead.lostReason,
  closedAt: lead.closedAt,
  closedBy: lead.closedBy,
  reopenCount: lead.reopenCount,
};

type KnownKind = KnownActivity['kind'];

/** The body one kind of entry carries, as the timeline's contract declares it. */
export type ActivityBody<Kind extends KnownKind> = Extract<KnownActivity, { kind: Kind }>['body'];

/**
 * What an entry names that its READ resolves for each reader, so it is never stored: a customer
 * kept beside is named only to a reader whose scope reaches them (`crm.activities.repository.ts`).
 */
interface NamedOnRead {
  readonly duplicate_kept: 'otherName';
}

/** The body one kind of entry stores: what the contract declares, less what is named on read. */
export type StoredActivityBody<Kind extends KnownKind> = Kind extends keyof NamedOnRead
  ? Omit<ActivityBody<Kind>, NamedOnRead[Kind]>
  : ActivityBody<Kind>;

/** Who did it: a person names their account; the system names no one. */
export type ActivityActorRef =
  | { readonly kind: Extract<ActivityActor, 'person'>; readonly userId: string }
  | { readonly kind: Extract<ActivityActor, 'system'> };

/** One entry to append: its anchor, its kind with that kind's body, who, and the device's moment. */
export type ActivityEntry = {
  [Kind in KnownKind]: {
    readonly tenantId: string;
    readonly customerId: string;
    readonly leadId: string | null;
    readonly kind: Kind;
    readonly body: StoredActivityBody<Kind>;
    readonly actor: ActivityActorRef;
    /** When the device captured it — shown, never what orders the stream (`F4-19`). */
    readonly capturedAt: Date;
    /** The create's retry key, kept on the entry so a retried send finds it (`F4-07`). */
    readonly retryKey?: CreationKey | null;
  };
}[KnownKind];

/** The entry as the server applied it. */
export interface RecordedActivity {
  readonly id: string;
  readonly appliedAt: Date;
}

/** An entry an earlier send with the same retry key wrote, and what that send carried. */
export interface KeyedActivity extends RecordedActivity {
  readonly leadId: string | null;
  readonly kind: KnownKind;
  readonly fingerprint: string | null;
}

/** Entries the funnel and R9 machines write about the moves they make. */
const MACHINE_KINDS: ReadonlySet<KnownKind> = new Set(['stage_change', 'state_change']);

/**
 * Whether an entry is work on its lead. A move the system made by itself — a dormant flag, the
 * return any work makes — is not, or a lead would never go quiet; a move a person made — a reopen,
 * a snooze, a stage the work reached — is, so a reopened lead does not go dormant the next morning.
 */
function isWork(entry: ActivityEntry): boolean {
  return !(entry.actor.kind === 'system' && MACHINE_KINDS.has(entry.kind));
}

const SYSTEM: ActivityActorRef = { kind: 'system' };

/**
 * Appends one entry in server order (`sequence`, numbered by the database) and, when the entry is
 * work on a lead, moves the lead's `last_activity_at` in the same transaction — and a dormant lead
 * returns to its stage (`M02-52`, domain's `activityRecorded`).
 */
export async function recordActivity(
  tx: DbTransaction,
  entry: ActivityEntry,
): Promise<RecordedActivity> {
  const [written] = await tx
    .insert(activity)
    .values({
      tenantId: entry.tenantId,
      customerId: entry.customerId,
      leadId: entry.leadId,
      kind: entry.kind,
      actorKind: entry.actor.kind,
      actorRef: entry.actor.kind === 'person' ? entry.actor.userId : null,
      capturedAt: entry.capturedAt,
      body: entry.body,
      creationKey: entry.retryKey?.key,
      creationFingerprint: entry.retryKey?.fingerprint,
    })
    .returning({ id: activity.id, appliedAt: activity.appliedAt });
  if (written === undefined) throw new Error('the activity insert returned no row');
  if (entry.leadId !== null && isWork(entry)) {
    await leadWorkedOn(tx, entry.tenantId, entry.customerId, entry.leadId);
  }
  return written;
}

/**
 * The entry an earlier send with this retry key wrote, if one did (`F4-07`). Taken after the key's
 * lock (`lockCreationKey`), so a second send of the key waits for the first to commit and finds it.
 */
export async function activityMadeWith(
  tx: DbTransaction,
  tenantId: string,
  key: CreationKey,
): Promise<KeyedActivity | null> {
  const [made] = await tx
    .select({
      id: activity.id,
      appliedAt: activity.appliedAt,
      leadId: activity.leadId,
      kind: activity.kind,
      fingerprint: activity.creationFingerprint,
    })
    .from(activity)
    .where(and(eq(activity.tenantId, tenantId), eq(activity.creationKey, key.key)))
    .limit(1);
  return made ?? null;
}

/** The lead was worked on just now: its quiet clock restarts and a dormant lead wakes. */
async function leadWorkedOn(
  tx: DbTransaction,
  tenantId: string,
  customerId: string,
  leadId: string,
): Promise<void> {
  const [touched] = await tx
    .update(lead)
    .set({ lastActivityAt: sql`now()` })
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)))
    .returning(leadLifecycleColumns);
  if (touched === undefined) throw new Error(`lead ${leadId} is not in its own company`);
  await recordLeadMoves(
    tx,
    { tenantId, customerId, leadId },
    activityRecorded(lifecycleOf(touched)),
    SYSTEM,
  );
}

/** The lead a move is written against. */
export interface MovedLead {
  readonly tenantId: string;
  readonly customerId: string;
  readonly leadId: string;
}

/**
 * Writes what one of domain's lead acts decided (`lifecycle*.ts`): the lead's machine columns from
 * its `next`, one `lead_stage_transition` row and one timeline entry per move. A refusal writes
 * nothing. An act that changed a fact without a move — an owner given, a snoozed lead's new wake
 * date — writes its columns and no history row. The lifecycle, assign and visit slices call this
 * with the person who acted and when their device did it; the dormant return calls it as the system.
 */
export async function recordLeadMoves(
  tx: DbTransaction,
  moved: MovedLead,
  result: LeadActResult,
  actor: ActivityActorRef,
  capturedAt?: Date,
): Promise<void> {
  if (result.kind !== 'moved') return;
  const at = new Date();
  const movedBy = actor.kind === 'person' ? actor.userId : null;
  await tx
    .update(lead)
    .set(lifecycleColumnsOf(result.next))
    .where(and(eq(lead.tenantId, moved.tenantId), eq(lead.id, moved.leadId)));
  for (const transition of result.transitions) {
    await tx.insert(leadStageTransition).values({
      tenantId: moved.tenantId,
      leadId: moved.leadId,
      ...transitionColumnsOf(transition),
      movedAt: at,
      movedBy,
    });
    await recordActivity(tx, {
      ...moved,
      ...transitionEntryOf(transition, result),
      actor,
      capturedAt: capturedAt ?? at,
    });
  }
}

function transitionColumnsOf(transition: LeadTransition) {
  return transition.moveKind === 'funnel_stage'
    ? {
        moveKind: transition.moveKind,
        fromStage: transition.from,
        toStage: transition.to,
        cause: transition.cause,
      }
    : {
        moveKind: transition.moveKind,
        fromState: transition.from,
        toState: transition.to,
        cause: transition.cause,
      };
}

/** The timeline's words for one move: a stage change, or an R9 change naming its reason or wake day. */
function transitionEntryOf(
  transition: LeadTransition,
  result: Extract<LeadActResult, { kind: 'moved' }>,
):
  | { kind: 'stage_change'; body: ActivityBody<'stage_change'> }
  | { kind: 'state_change'; body: ActivityBody<'state_change'> } {
  if (transition.moveKind === 'funnel_stage') {
    const { from, to, cause } = transition;
    return { kind: 'stage_change', body: { from, to, cause } };
  }
  const { from, to, cause } = transition;
  const close = result.next.close;
  return {
    kind: 'state_change',
    body: {
      from,
      to,
      cause,
      disqualifyReason:
        to === 'disqualified' && close?.state === 'disqualified' ? close.reason : null,
      lostReason: to === 'lost' && close?.state === 'lost' ? close.reason : null,
      wakeOn: to === 'snoozed' ? result.next.wakeOn : null,
    },
  };
}
