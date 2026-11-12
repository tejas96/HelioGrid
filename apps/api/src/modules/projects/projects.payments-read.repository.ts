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
import { type CalendarDate, moneyScopeOf, type ProjectStage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';
import type { ProjectReader } from './internal/reader';
import { type PartFacts, partFactsOf } from './projects.money.repository';
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

/** The project's ledger, oldest first, each entry with who recorded it. */
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
      fileId: projectPayment.fileId,
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

/** A project with an unpaid part: who it is for, and its parts' facts. */
export interface OwingProject {
  readonly projectId: string;
  readonly number: number;
  readonly name: string;
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
          name: sql<string>`coalesce(${customer.name}, ${customer.phoneE164})`,
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
      const [collected] = await tx
        .select({ total: sql<string>`coalesce(sum(${projectPayment.amountMinor}), 0)` })
        .from(projectPayment)
        .innerJoin(
          project,
          and(
            eq(project.id, projectPayment.projectId),
            eq(project.tenantId, projectPayment.tenantId),
          ),
        )
        .innerJoin(tenant, eq(tenant.id, project.tenantId))
        .where(
          and(
            eq(projectPayment.tenantId, reader.tenantId),
            sql`to_char(coalesce(${projectPayment.receivedOn}, (${projectPayment.recordedAt} at time zone ${tenant.timezone})::date), 'YYYY-MM') = ${month}`,
            scope,
          ),
        );
      return {
        projects: rows.map((row) => ({ ...row, parts: facts.get(row.projectId) ?? [] })),
        collectedMinor: Number(collected?.total ?? 0),
      };
    });
  }
}
