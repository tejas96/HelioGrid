import type { RecordPayment } from '@heliogrid/contracts';
import { type DbTransaction, file, projectPayment } from '@heliogrid/db';
import {
  localDate,
  type MinorUnits,
  minorUnitsOfDecimal,
  type PaymentRefusal,
  referenceKeyOf,
  refusalToRecord,
} from '@heliogrid/domain';
import { receiptNumberOf } from '@heliogrid/domain/server';
import { and, eq, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { type StoodPart, stoodPartsOf } from './internal/money';
import type { ProjectReader } from './internal/reader';
import type { LockedProject } from './projects.lock.repository';
import { partFactsOf } from './projects.money.repository';
import type { NoticeProject, PaymentNoticeWords } from './projects.payment-notices.repository';

/*
 * What the money acts check before they write (`M11-33`…`M11-49`): the part is the project's,
 * the reference is not on a receipt that stands, the photo is the project's file, and a retry is
 * the first send again.
 */

export function noticeProjectOf(locked: LockedProject): NoticeProject {
  return {
    tenantId: locked.tenantId,
    projectId: locked.projectId,
    managerId: locked.managerId,
    name: locked.name,
  };
}

/** One of the locked project's parts, with its standing, or null when it is not the project's. */
export async function partOf(
  tx: DbTransaction,
  locked: LockedProject,
  partId: string,
): Promise<StoodPart | null> {
  const facts = (await partFactsOf(tx, locked.tenantId, [locked.projectId])).get(locked.projectId);
  return stoodPartsOf(facts ?? []).find((part) => part.facts.id === partId) ?? null;
}

/**
 * The receipt that already carries this reference on a payment that stands — reversed payments
 * free it, so a payment put on the wrong project can be recorded again where it belongs. The
 * reference is locked first, so two people recording one UTR at once take turns.
 */
export async function receiptCarrying(
  tx: DbTransaction,
  locked: LockedProject,
  referenceKey: string,
): Promise<string | null> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${`${locked.tenantId}:payment-reference:${referenceKey}`}))`,
  );
  const [found] = await tx
    .select({ receipt: projectPayment.receiptNumber })
    .from(projectPayment)
    .where(
      and(
        eq(projectPayment.tenantId, locked.tenantId),
        eq(projectPayment.referenceKey, referenceKey),
        eq(projectPayment.kind, 'payment'),
        sql`not exists (select 1 from project_payment r where r.tenant_id = project_payment.tenant_id and r.reverses_id = project_payment.id)`,
      ),
    )
    .limit(1);
  return found?.receipt === undefined || found.receipt === null
    ? null
    : receiptNumberOf(found.receipt);
}

/** The receipt photo is a file stored against this project. */
export async function isProjectFile(
  tx: DbTransaction,
  locked: LockedProject,
  fileId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: file.id })
    .from(file)
    .where(
      and(
        eq(file.tenantId, locked.tenantId),
        eq(file.id, fileId),
        eq(file.subjectKind, 'project'),
        eq(file.subjectRef, locked.projectId),
      ),
    );
  return found !== undefined;
}

/** A retry of the same recording (`F4-07`): the entry the first send made, or the key's refusal. */
export async function madeWith(
  tx: DbTransaction,
  tenantId: string,
  key: CreationKey,
): Promise<PaymentActOutcome | null> {
  const [made] = await tx
    .select({ fingerprint: projectPayment.creationFingerprint })
    .from(projectPayment)
    .where(and(eq(projectPayment.tenantId, tenantId), eq(projectPayment.creationKey, key.key)));
  if (made === undefined) return null;
  return made.fingerprint === key.fingerprint ? { outcome: 'replayed' } : { outcome: 'key-reused' };
}

export type PaymentActOutcome =
  | { readonly outcome: 'done'; readonly notified: readonly string[] }
  | { readonly outcome: 'replayed' }
  | { readonly outcome: 'key-reused' }
  | {
      readonly outcome: 'refused';
      readonly refusal: PaymentRefusal;
      readonly receiptNumber: string | null;
    }
  | { readonly outcome: 'not-found' };

/** What a money notice needs beyond its words: who acted, and how a figure reads. */
export interface PaymentActContext {
  readonly reader: ProjectReader;
  readonly actorName: string;
  readonly act: Act;
  readonly words: PaymentNoticeWords;
  readonly digits: number;
}

export const refused = (refusal: PaymentRefusal, receiptNumber: string | null = null) =>
  ({ outcome: 'refused', refusal, receiptNumber }) as const;

type CheckedPayment =
  | { readonly kind: 'stop'; readonly outcome: PaymentActOutcome }
  | {
      readonly kind: 'go';
      readonly part: StoodPart;
      readonly amount: MinorUnits;
      readonly referenceKey: string | null;
    };

/** A recording checked before it is written: its part, its amount, its reference not reused. */
export async function checkedPayment(
  tx: DbTransaction,
  locked: LockedProject,
  body: RecordPayment,
  modes: readonly string[],
  context: PaymentActContext,
): Promise<CheckedPayment> {
  const stop = (outcome: PaymentActOutcome) => ({ kind: 'stop', outcome }) as const;
  const part = await partOf(tx, locked, body.partId);
  if (part === null) return stop({ outcome: 'not-found' });
  const amount = minorUnitsOfDecimal(body.amount, context.digits);
  if (amount <= 0) return stop(refused('amount_not_positive'));
  const referenceKey = referenceKeyOf(body.reference ?? '');
  const used = referenceKey === null ? null : await receiptCarrying(tx, locked, referenceKey);
  const refusal = refusalToRecord({
    state: part.standing.state,
    modeKnown: modes.includes(body.mode),
    receivedOn: body.receivedOn,
    today: localDate(context.act.now, locked.timeZone),
    referenceUsed: used !== null,
  });
  if (refusal !== null) return stop(refused(refusal, used));
  if (body.fileId !== null && !(await isProjectFile(tx, locked, body.fileId))) {
    return stop({ outcome: 'not-found' });
  }
  return { kind: 'go', part, amount, referenceKey };
}
