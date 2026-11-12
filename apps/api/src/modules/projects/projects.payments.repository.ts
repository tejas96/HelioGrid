import type { RecordPayment } from '@heliogrid/contracts';
import {
  projectPayment,
  projectTranche,
  type TenantPool,
  trancheRequestShare,
} from '@heliogrid/db';
import { minorUnits, refusalToReverse, refusalToWaive, type UiLanguage } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import type { NoticeWords } from '../notification/notification.public';
import { lockCounter, nextNumber } from './projects.counter.repository';
import { lockProjectInScope } from './projects.lock.repository';
import {
  checkedPayment,
  madeWith,
  noticeProjectOf,
  type PaymentActContext,
  type PaymentActOutcome,
  partOf,
  refused,
} from './projects.payment-checks.repository';
import { notify } from './projects.payment-notices.repository';

/*
 * The four money acts (`M11-33`…`M11-49`), each in one transaction with its audit entry and its
 * notice (`M11-07`, `F6-06`): record a payment, reverse one, waive a part, note a shared request.
 * The ledger only grows (`M11-40`); a part's state changes only because its facts did.
 */

@Injectable()
export class ProjectsPaymentsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  record(
    context: PaymentActContext,
    projectId: string,
    body: RecordPayment,
    modes: readonly string[],
    key: CreationKey | null,
    recordedWords: (
      project: string,
      amount: string,
      part: string,
    ) => Promise<(l: UiLanguage) => NoticeWords>,
  ): Promise<PaymentActOutcome> {
    const { reader, act } = context;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockProjectInScope(tx, reader, projectId);
      if (locked === null) return { outcome: 'not-found' };
      const replay = key === null ? null : await madeWith(tx, reader.tenantId, key);
      if (replay !== null) return replay;
      const checked = await checkedPayment(tx, locked, body, modes, context);
      if (checked.kind === 'stop') return checked.outcome;
      const { part, amount, referenceKey } = checked;
      await lockCounter(tx, reader.tenantId, 'receipt');
      const receipt = await nextNumber(tx, reader.tenantId, 'receipt');
      const now = new Date(act.now);
      const [entry] = await tx
        .insert(projectPayment)
        .values({
          tenantId: reader.tenantId,
          projectId,
          trancheId: part.facts.id,
          kind: 'payment',
          amountMinor: amount,
          mode: body.mode,
          reference: referenceKey === null ? null : (body.reference?.trim() ?? null),
          referenceKey,
          receivedOn: body.receivedOn,
          fileId: body.fileId,
          receiptNumber: receipt,
          recordedAt: now,
          recordedBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: projectPayment.id });
      if (entry === undefined) throw new Error('the payment insert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'payments.payment_recorded',
          reader.tenantId,
          { kind: 'project_payment', ref: entry.id },
          act,
        ),
      );
      const notified = await notify(
        tx,
        noticeProjectOf(locked),
        'payment_recorded',
        now,
        await recordedWords(locked.name, context.words.amountOf(body.amount), part.facts.label),
        context.words.quietHours,
        act.actorUserId,
      );
      return { outcome: 'done', notified };
    });
  }

  reverse(
    context: PaymentActContext,
    projectId: string,
    entryId: string,
    reason: string,
    reversedWords: (project: string, amount: string) => Promise<(l: UiLanguage) => NoticeWords>,
  ): Promise<PaymentActOutcome> {
    const { reader, act } = context;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockProjectInScope(tx, reader, projectId);
      if (locked === null) return { outcome: 'not-found' };
      const [entry] = await tx
        .select({
          trancheId: projectPayment.trancheId,
          kind: projectPayment.kind,
          amountMinor: projectPayment.amountMinor,
          reversed: sql<boolean>`exists (select 1 from project_payment r where r.tenant_id = project_payment.tenant_id and r.reverses_id = project_payment.id)`,
        })
        .from(projectPayment)
        .where(
          and(
            eq(projectPayment.tenantId, reader.tenantId),
            eq(projectPayment.projectId, projectId),
            eq(projectPayment.id, entryId),
          ),
        );
      if (entry === undefined) return { outcome: 'not-found' };
      const refusal = refusalToReverse({ kind: entry.kind, reversed: entry.reversed, reason });
      if (refusal !== null) return refused(refusal);
      const now = new Date(act.now);
      const [reversal] = await tx
        .insert(projectPayment)
        .values({
          tenantId: reader.tenantId,
          projectId,
          trancheId: entry.trancheId,
          kind: 'reversal',
          amountMinor: -entry.amountMinor,
          reversesId: entryId,
          reason: reason.trim(),
          recordedAt: now,
          recordedBy: act.actorUserId,
        })
        .returning({ id: projectPayment.id });
      if (reversal === undefined) throw new Error('the reversal insert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'payments.payment_reversed',
          reader.tenantId,
          { kind: 'project_payment', ref: reversal.id },
          act,
        ),
      );
      const amount = minorUnitsToDecimal(minorUnits(entry.amountMinor), context.digits);
      const notified = await notify(
        tx,
        noticeProjectOf(locked),
        'payment_reversed',
        now,
        await reversedWords(locked.name, context.words.amountOf(amount)),
        context.words.quietHours,
        act.actorUserId,
      );
      return { outcome: 'done', notified };
    });
  }

  waive(
    context: PaymentActContext,
    projectId: string,
    partId: string,
    reason: string,
  ): Promise<PaymentActOutcome> {
    const { reader, act } = context;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockProjectInScope(tx, reader, projectId);
      if (locked === null) return { outcome: 'not-found' };
      const part = await partOf(tx, locked, partId);
      if (part === null) return { outcome: 'not-found' };
      const refusal = refusalToWaive(part.standing.state, reason);
      if (refusal !== null) return refused(refusal);
      await tx
        .update(projectTranche)
        .set({ waivedAt: new Date(act.now), waivedBy: act.actorUserId, waiveReason: reason.trim() })
        .where(
          and(
            eq(projectTranche.tenantId, reader.tenantId),
            eq(projectTranche.id, partId),
            isNull(projectTranche.waivedAt),
          ),
        );
      await recordAuditEntry(
        tx,
        memberAct(
          'payments.tranche_waived',
          reader.tenantId,
          { kind: 'project_tranche', ref: partId },
          act,
        ),
      );
      return { outcome: 'done', notified: [] };
    });
  }

  /** A person shared the part's request (ruling 2026-11-10): the tap, never a delivery. */
  shared(
    context: PaymentActContext,
    projectId: string,
    partId: string,
  ): Promise<PaymentActOutcome> {
    const { reader, act } = context;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockProjectInScope(tx, reader, projectId);
      if (locked === null) return { outcome: 'not-found' };
      const part = await partOf(tx, locked, partId);
      if (part === null) return { outcome: 'not-found' };
      await tx.insert(trancheRequestShare).values({
        tenantId: reader.tenantId,
        trancheId: partId,
        sharedAt: new Date(act.now),
        sharedBy: act.actorUserId,
      });
      await recordAuditEntry(
        tx,
        memberAct(
          'payments.request_shared',
          reader.tenantId,
          { kind: 'project_tranche', ref: partId },
          act,
        ),
      );
      return { outcome: 'done', notified: [] };
    });
  }
}
