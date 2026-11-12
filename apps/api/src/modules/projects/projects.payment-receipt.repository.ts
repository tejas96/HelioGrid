import {
  customer,
  project,
  projectPayment,
  projectTranche,
  type TenantPool,
  tenant,
  userAccount,
} from '@heliogrid/db';
import type { CalendarDate } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull, lte, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';

/** What a payment's receipt prints (`M11-41`): the payment, its part, and the ledger as it stood. */
export interface ReceiptFacts {
  readonly entryId: string;
  readonly receiptNumber: number;
  readonly amountMinor: number;
  readonly mode: string | null;
  readonly reference: string | null;
  readonly receivedOn: CalendarDate | null;
  readonly recordedAt: Date;
  readonly recorderName: string;
  readonly part: { readonly label: string; readonly position: number; readonly count: number };
  readonly projectNumber: number;
  readonly customerName: string | null;
  readonly phoneE164: string;
  readonly preferredLanguage: string | null;
  readonly timeZone: string;
  /**
   * Each part as it stood when this payment was recorded: what it asks, what had come in against
   * it by then — this payment included, reversals taken off — and whether it was waived by then.
   */
  readonly parts: readonly {
    readonly amountMinor: number;
    readonly receivedMinor: number;
    readonly waived: boolean;
  }[];
}

/**
 * A payment's receipt PDF (`M11-41`): its facts, read as the ledger stood when the payment was
 * recorded — so the paper says the same whenever it is first asked for — and the PDF kept against
 * the payment once made (`FileDocumentService.kept`). Read by the workflow's steps, with the
 * company's id and no person.
 */
@Injectable()
export class ProjectsPaymentReceiptRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The payment's facts; null for an id that is no standing payment of this company's. */
  factsOf(tenantId: string, entryId: string): Promise<ReceiptFacts | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          projectId: projectPayment.projectId,
          trancheId: projectPayment.trancheId,
          receiptNumber: projectPayment.receiptNumber,
          amountMinor: projectPayment.amountMinor,
          mode: projectPayment.mode,
          reference: projectPayment.reference,
          receivedOn: projectPayment.receivedOn,
          recordedAt: projectPayment.recordedAt,
          recorderName: memberNameOf(userAccount),
          projectNumber: project.number,
          customerName: customer.name,
          phoneE164: customer.phoneE164,
          preferredLanguage: customer.preferredLanguage,
          timeZone: tenant.timezone,
        })
        .from(projectPayment)
        .innerJoin(
          project,
          and(eq(project.id, projectPayment.projectId), eq(project.tenantId, tenantId)),
        )
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, tenantId)),
        )
        .innerJoin(tenant, eq(tenant.id, project.tenantId))
        .leftJoin(userAccount, eq(userAccount.id, projectPayment.recordedBy))
        .where(
          and(
            eq(projectPayment.tenantId, tenantId),
            eq(projectPayment.id, entryId),
            eq(projectPayment.kind, 'payment'),
            isNotNull(projectPayment.receiptNumber),
            sql`not exists (select 1 from project_payment r where r.tenant_id = ${projectPayment.tenantId} and r.reverses_id = ${projectPayment.id})`,
          ),
        );
      if (row === undefined || row.receiptNumber === null) return null;
      const parts = await tx
        .select({
          id: projectTranche.id,
          label: projectTranche.label,
          amountMinor: projectTranche.amountMinor,
          waivedAt: projectTranche.waivedAt,
        })
        .from(projectTranche)
        .where(
          and(eq(projectTranche.tenantId, tenantId), eq(projectTranche.projectId, row.projectId)),
        )
        .orderBy(asc(projectTranche.position), asc(projectTranche.id));
      const received = await tx
        .select({
          trancheId: projectPayment.trancheId,
          total: sql<string>`coalesce(sum(${projectPayment.amountMinor}), 0)`,
        })
        .from(projectPayment)
        .where(
          and(
            eq(projectPayment.tenantId, tenantId),
            eq(projectPayment.projectId, row.projectId),
            lte(projectPayment.recordedAt, row.recordedAt),
          ),
        )
        .groupBy(projectPayment.trancheId);
      const receivedOn = new Map(received.map((one) => [one.trancheId, Number(one.total)]));
      const position = parts.findIndex((one) => one.id === row.trancheId);
      return {
        entryId,
        receiptNumber: row.receiptNumber,
        amountMinor: row.amountMinor,
        mode: row.mode,
        reference: row.reference,
        receivedOn: row.receivedOn,
        recordedAt: row.recordedAt,
        recorderName: row.recorderName ?? '',
        part: {
          label: parts[position]?.label ?? '',
          position: position + 1,
          count: parts.length,
        },
        projectNumber: row.projectNumber,
        customerName: row.customerName,
        phoneE164: row.phoneE164,
        preferredLanguage: row.preferredLanguage,
        timeZone: row.timeZone,
        parts: parts.map((one) => ({
          amountMinor: one.amountMinor,
          receivedMinor: receivedOn.get(one.id) ?? 0,
          waived: one.waivedAt !== null && one.waivedAt <= row.recordedAt,
        })),
      };
    });
  }
}
