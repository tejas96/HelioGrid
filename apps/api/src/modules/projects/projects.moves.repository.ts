import { type DbTransaction, project, projectBlocker, projectStageTransition } from '@heliogrid/db';
import {
  type CalendarDate,
  type CancelWhy,
  chainIndexOf,
  localDate,
  localInstant,
  type ProjectMove,
  type UiLanguage,
} from '@heliogrid/domain';
import type { ProjectMoveWhy } from '@heliogrid/i18n';
import { and, eq, isNull } from 'drizzle-orm';
import { recordActivity } from '../crm/crm.public';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import type { LockedProject } from './projects.lock.repository';
import { noticePartsNowDue, type PaymentNoticeWords } from './projects.payment-notices.repository';
import { projectReadableBy } from './projects.scope.repository';

/*
 * Writing a move (`M08-14`): the board's position and the ledger row in ONE write, the
 * waits a forward move closes (ruling 2026-11-10), the timeline entry, and the manager's notice
 * when the move was not theirs — so nothing moves in silence.
 */

/**
 * Who made the move: a person, or the proof that landed — no one moved it, but the person whose
 * tick or upload landed it caused it, and is not told of their own work.
 */
export type Mover =
  | { readonly kind: 'person'; readonly userId: string; readonly name: string }
  | { readonly kind: 'proof'; readonly causedBy: string };

/** What a move may carry beyond itself. */
export interface MoveExtras {
  /** A cancellation's reason and the person's words (`project_cancel_is_whole`). */
  readonly cancel?: CancelWhy;
  /** The company day the stage began, when the person gave an earlier one than today (Dispatched). */
  readonly enteredOn?: CalendarDate;
}

/** The manager's notice for a move: its words in every language, and the company's quiet hours. */
export interface MoveNotice {
  readonly wordsFor: (
    name: string,
    stage: ProjectMove['to'],
    why: ProjectMoveWhy,
  ) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly quietHours: TenantQuietHours;
  /** The money notices a forward move may raise: a part that falls due (`M11-11`). */
  readonly payments?: PaymentNoticeWords;
}

export interface AppliedMove {
  /** The notices written, for their push after the commit. */
  readonly notified: readonly string[];
}

/** Whether a move goes forward along the chain — what closes the open waits. */
function isForward(move: ProjectMove): boolean {
  return move.to === 'cancelled' || chainIndexOf(move.to) > chainIndexOf(move.from);
}

/** The stage's first moment: now, or the start of the earlier company day the person gave. */
function enteredAtOf(locked: LockedProject, now: Date, enteredOn: CalendarDate): Date {
  return enteredOn < localDate(now.getTime(), locked.timeZone)
    ? new Date(localInstant(enteredOn, 0, locked.timeZone))
    : now;
}

/** Applies one move domain decided, with what it carries (`MoveExtras`). */
export async function applyMove(
  tx: DbTransaction,
  locked: LockedProject,
  move: ProjectMove,
  mover: Mover,
  at: { readonly now: Date; readonly capturedAt: Date },
  notice: MoveNotice,
  extras: MoveExtras = {},
): Promise<AppliedMove> {
  const movedBy = mover.kind === 'person' ? mover.userId : null;
  const causedBy = mover.kind === 'person' ? mover.userId : mover.causedBy;
  const enteredOn = extras.enteredOn ?? localDate(at.now.getTime(), locked.timeZone);
  await tx
    .update(project)
    .set({
      stage: move.to,
      stageEnteredAt: enteredAtOf(locked, at.now, enteredOn),
      ...(move.to === 'cancelled' && {
        cancelReason: extras.cancel?.reason ?? null,
        cancelNote: extras.cancel?.note ?? null,
        cancelledAt: at.now,
        cancelledBy: movedBy,
      }),
    })
    .where(and(eq(project.tenantId, locked.tenantId), eq(project.id, locked.projectId)));
  await tx.insert(projectStageTransition).values({
    tenantId: locked.tenantId,
    projectId: locked.projectId,
    fromStage: move.from,
    toStage: move.to,
    cause: move.cause,
    proof: move.proof,
    movedAt: at.now,
    enteredOn,
    movedBy,
  });
  const actor =
    mover.kind === 'person'
      ? ({ kind: 'person', userId: mover.userId } as const)
      : ({ kind: 'system' } as const);
  if (isForward(move)) await endOpenWait(tx, locked, move, movedBy, at);
  await recordActivity(tx, {
    tenantId: locked.tenantId,
    customerId: locked.customerId,
    leadId: locked.leadId,
    kind: 'project_moved',
    body: {
      projectId: locked.projectId,
      from: move.from,
      to: move.to,
      cause: move.cause,
      proof: move.proof,
    },
    actor,
    capturedAt: at.capturedAt,
  });
  const due =
    notice.payments !== undefined && isForward(move) && move.to !== 'cancelled'
      ? await noticePartsNowDue(
          tx,
          {
            tenantId: locked.tenantId,
            projectId: locked.projectId,
            managerId: locked.managerId,
            name: locked.name,
          },
          at.now,
          notice.payments,
        )
      : [];
  if (causedBy === locked.managerId) return { notified: due };
  const why = whyOf(move, mover, extras.cancel ?? null);
  const recipients = await recipientsFor(
    tx,
    locked.tenantId,
    'project_moved',
    { ownerUserId: locked.managerId, assigneeUserId: null, awaits: null },
    projectReadableBy(tx, locked.tenantId, locked.projectId),
  );
  const notified = await recordNotificationsTo(
    tx,
    recipients.filter((recipient) => recipient.userId !== causedBy),
    {
      tenantId: locked.tenantId,
      type: 'project_moved',
      subjectKind: 'project',
      subjectRef: locked.projectId,
      emittedAt: at.now,
    },
    await notice.wordsFor(locked.name, move.to, why),
    notice.quietHours,
  );
  return { notified: [...due, ...notified] };
}

/** What the notice says moved it. */
function whyOf(move: ProjectMove, mover: Mover, cancel: CancelWhy | null): ProjectMoveWhy {
  if (mover.kind === 'proof') {
    if (move.proof === 'first_install_step') return { by: 'proof', proof: 'first_step' };
    if (move.proof === 'last_install_step') return { by: 'proof', proof: 'last_step' };
    return { by: 'proof', proof: { row: move.proof ?? '' } };
  }
  if (move.to === 'cancelled') {
    return {
      by: 'cancel',
      mover: mover.name,
      reason: cancel?.reason ?? 'something_else',
      note: cancel?.note ?? null,
    };
  }
  if (move.to === 'handed_over') return { by: 'handover', mover: mover.name };
  return { by: 'person', mover: mover.name, back: !isForward(move) };
}

/** A forward move closes the open wait and logs it (ruling 2026-11-10). */
async function endOpenWait(
  tx: DbTransaction,
  locked: LockedProject,
  move: ProjectMove,
  movedBy: string | null,
  at: { readonly now: Date; readonly capturedAt: Date },
): Promise<void> {
  const ended = await tx
    .update(projectBlocker)
    .set({
      endedAt: at.now,
      endedBy: movedBy,
      endedAs: move.to === 'cancelled' ? 'cancel' : 'stage_move',
    })
    .where(
      and(
        eq(projectBlocker.tenantId, locked.tenantId),
        eq(projectBlocker.projectId, locked.projectId),
        isNull(projectBlocker.endedAt),
      ),
    )
    .returning({
      party: projectBlocker.party,
      reason: projectBlocker.reason,
      startedOn: projectBlocker.startedOn,
      endedAs: projectBlocker.endedAs,
    });
  for (const wait of ended) {
    await recordActivity(tx, {
      tenantId: locked.tenantId,
      customerId: locked.customerId,
      leadId: locked.leadId,
      kind: 'project_wait',
      body: {
        projectId: locked.projectId,
        party: wait.party,
        reason: wait.reason,
        startedOn: wait.startedOn,
        ended: wait.endedAs,
      },
      actor: movedBy === null ? { kind: 'system' } : { kind: 'person', userId: movedBy },
      capturedAt: at.capturedAt,
    });
  }
}
