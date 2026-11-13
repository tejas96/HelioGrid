import {
  customer,
  type DbTransaction,
  project,
  projectPayment,
  projectTranche,
  type TenantPool,
  tenant,
  userAccount,
} from '@heliogrid/db';
import {
  type CalendarDate,
  moneyScopeOf,
  type ProjectStage,
  referenceKeyOf,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, ne, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';
import type { ProjectReader } from './internal/reader';
import { type PartFacts, partFactsOf } from './projects.money.repository';
import { receiptOnReference } from './projects.payment-checks.repository';
import { projectScopeWhere } from './projects.scope.repository';

/*
 * What the payments screen and Money due read (`SCR-M11-02`, `SCR-M11-01`): a project's money
 * facts and its ledger, and every unpaid part across the projects whose money the reader may see
 * — never the crew's (`M11-56`).
 */

/** The project a payments read is about. */
export interface PaymentsHead {
  readonly projectId: string;
  readonly number: number;
  readonly customerName: string | null;
  readonly phoneE164: string;
  readonly preferredLanguage: string | null;
  readonly stage: ProjectStage;
  readonly timeZone: string;
}

export interface EntryFacts {
  readonly id: string;
  readonly partId: string;
  readonly kind: 'payment' | 'reversal';
  readonly amountMinor: number;
  readonly mode: string | null;
  readonly reference: string | null;
  readonly receivedOn: CalendarDate | null;
  readonly receiptNumber: number | null;
  readonly fileId: string | null;
  readonly recordedAt: Date;
  readonly recordedBy: { readonly userId: string; readonly name: string };
  readonly reversesId: string | null;
  readonly reason: string | null;
}

export interface PaymentsFacts {
  readonly head: PaymentsHead;
  readonly parts: readonly PartFacts[];
  readonly entries: readonly EntryFacts[];
}

/** One project's head, if the reader may see its money. */
export async function paymentsHeadOf(
  tx: DbTransaction,
  reader: ProjectReader,
  projectId: string,
): Promise<PaymentsHead | null> {
  const [row] = await tx
    .select({
      number: project.number,
      customerName: customer.name,
      phoneE164: customer.phoneE164,
      preferredLanguage: customer.preferredLanguage,
      stage: project.stage,
      timeZone: tenant.timezone,
    })
    .from(project)
    .innerJoin(tenant, eq(tenant.id, project.tenantId))
    .innerJoin(
      customer,
      and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
    )
    .where(
      and(
        eq(project.tenantId, reader.tenantId),
        eq(project.id, projectId),
        projectScopeWhere(moneyScopeOf(reader.scope), reader.actorId),
      ),
    );
  return row === undefined ? null : { projectId, ...row };
}

/**
 * A payment's receipt photo: the first image stored against it (`M11-37`). Its receipt PDF hangs on
 * the same payment and is not a photo.
 */
const photoOf = sql<
  string | null
>`(select f.id from file f where f.tenant_id = ${projectPayment.tenantId} and f.subject_kind = 'project_payment' and f.subject_ref = ${projectPayment.id} and f.content_type like 'image/%' and f.uploaded_at is not null order by f.uploaded_at, f.id limit 1)`;

/** The project's ledger, oldest first, each entry with who recorded it and its photo. */
export async function entriesOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
): Promise<EntryFacts[]> {
  const rows = await tx
    .select({
      id: projectPayment.id,
      partId: projectPayment.trancheId,
      kind: projectPayment.kind,
      amountMinor: projectPayment.amountMinor,
      mode: projectPayment.mode,
      reference: projectPayment.reference,
      receivedOn: projectPayment.receivedOn,
      receiptNumber: projectPayment.receiptNumber,
      fileId: photoOf,
      recordedAt: projectPayment.recordedAt,
      recordedBy: projectPayment.recordedBy,
      recorderName: memberNameOf(userAccount),
      reversesId: projectPayment.reversesId,
      reason: projectPayment.reason,
    })
    .from(projectPayment)
    .leftJoin(userAccount, eq(userAccount.id, projectPayment.recordedBy))
    .where(and(eq(projectPayment.tenantId, tenantId), eq(projectPayment.projectId, projectId)))
    .orderBy(asc(projectPayment.recordedAt), asc(projectPayment.id));
  return rows.map(({ recorderName, recordedBy, ...row }) => ({
    ...row,
    recordedBy: { userId: recordedBy, name: recorderName ?? '' },
  }));
}

/**
 * What came in on the company's `month` (`YYYY-MM`) on the projects `scope` reaches — by the day
 * the money was received, else the company day it was recorded. Money due's "collected this month"
 * and the owner dashboard's cash read this one sum, so the two can never disagree (`M13-16`).
 */
export async function collectedIn(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL | undefined,
  month: string,
): Promise<number> {
  const [collected] = await tx
    .select({ total: sql<string>`coalesce(sum(${projectPayment.amountMinor}), 0)` })
    .from(projectPayment)
    .innerJoin(
      project,
      and(eq(project.id, projectPayment.projectId), eq(project.tenantId, projectPayment.tenantId)),
    )
    .innerJoin(tenant, eq(tenant.id, project.tenantId))
    .where(
      and(
        eq(projectPayment.tenantId, tenantId),
        sql`to_char(coalesce(${projectPayment.receivedOn}, (${projectPayment.recordedAt} at time zone ${tenant.timezone})::date), 'YYYY-MM') = ${month}`,
        scope,
      ),
    );
  return Number(collected?.total ?? 0);
}

/** A project with an unpaid part: who it is for, and its parts' facts. */
export interface OwingProject {
  readonly projectId: string;
  readonly number: number;
  readonly name: string | null;
  readonly parts: readonly PartFacts[];
}

@Injectable()
export class ProjectsPaymentsReadRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  payments(reader: ProjectReader, projectId: string): Promise<PaymentsFacts | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const head = await paymentsHeadOf(tx, reader, projectId);
      if (head === null) return null;
      const [parts, entries] = await Promise.all([
        partFactsOf(tx, reader.tenantId, [projectId]),
        entriesOf(tx, reader.tenantId, projectId),
      ]);
      return { head, parts: parts.get(projectId) ?? [], entries };
    });
  }

  /** The receipt a typed UTR or cheque number is already on, company-wide (`M11-38`). */
  receiptWithReference(tenantId: string, reference: string): Promise<string | null> {
    const key = referenceKeyOf(reference);
    if (key === null) return Promise.resolve(null);
    return this.db.withTenantTransaction(tenantId, (tx) => receiptOnReference(tx, tenantId, key));
  }

  /**
   * Every live project whose money the reader may see with a part not waived and not fully paid
   * (`M11-54`), its parts' facts beside it, and what came in on the company's `month` (`YYYY-MM`).
   * A cancelled project is left out: what it owed is settled by the company, not chased here.
   */
  owing(
    reader: ProjectReader,
    month: string,
  ): Promise<{ projects: OwingProject[]; collectedMinor: number }> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const scope = projectScopeWhere(moneyScopeOf(reader.scope), reader.actorId);
      const received = sql`coalesce((select sum(p.amount_minor) from project_payment p where p.tenant_id = project_tranche.tenant_id and p.tranche_id = project_tranche.id), 0)`;
      const rows = await tx
        .selectDistinct({
          projectId: project.id,
          number: project.number,
          name: customer.name,
        })
        .from(projectTranche)
        .innerJoin(
          project,
          and(
            eq(project.id, projectTranche.projectId),
            eq(project.tenantId, projectTranche.tenantId),
          ),
        )
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
        )
        .where(
          and(
            eq(projectTranche.tenantId, reader.tenantId),
            ne(project.stage, 'cancelled'),
            isNull(projectTranche.waivedAt),
            sql`${projectTranche.amountMinor} > ${received}`,
            scope,
          ),
        );
      const facts = await partFactsOf(
        tx,
        reader.tenantId,
        rows.map((row) => row.projectId),
      );
      const collectedMinor = await collectedIn(tx, reader.tenantId, scope, month);
      return {
        projects: rows.map((row) => ({ ...row, parts: facts.get(row.projectId) ?? [] })),
        collectedMinor,
      };
    });
  }
}
