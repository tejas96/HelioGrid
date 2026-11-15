import {
  customer,
  type DbTransaction,
  project,
  projectBlocker,
  projectCrewMember,
  projectDocument,
  projectFile,
  projectStageTransition,
  type TenantPool,
  tenant,
  userAccount,
} from '@heliogrid/db';
import type { CalendarDate, ProjectStage, SystemType } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';
import { companyOwner, versionById } from '../proposals/proposals.public';
import { receiptFilesOf, standingPaymentsOf } from './projects.customer-receipts.repository';
import { type PartFacts, partFactsOf } from './projects.money.repository';
import { type EntryFacts, entriesOf } from './projects.payments-read.repository';

/*
 * What the customer's link reads of a won deal's project (`F5-61`…`F5-73`): only what the company
 * published. A wait's internal note, the checklist's inner states, the crew beyond its lead and
 * every figure but the payment plan stay here (`F5-64`, `F5-69`, `M08-25`). The link holds a lead
 * and no project, so every read starts from the lead (`T-F5-006`).
 */

/** Where the deal stands, as the link reads its phase from it. */
export interface ProjectPhaseFacts {
  readonly projectId: string;
  readonly stage: ProjectStage;
  readonly cancelledAt: Date | null;
  readonly handedOverAt: Date | null;
  readonly managerId: string;
}

/** The project won from this lead, or `null` while the deal is not won. */
export async function phaseFactsOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<ProjectPhaseFacts | null> {
  const [row] = await tx
    .select({
      projectId: project.id,
      stage: project.stage,
      cancelledAt: project.cancelledAt,
      stageEnteredAt: project.stageEnteredAt,
      managerId: project.managerId,
    })
    .from(project)
    .where(and(eq(project.tenantId, tenantId), eq(project.leadId, leadId)));
  if (row === undefined) return null;
  return {
    projectId: row.projectId,
    stage: row.stage,
    cancelledAt: row.cancelledAt,
    handedOverAt: row.stage === 'handed_over' ? row.stageEnteredAt : null,
    managerId: row.managerId,
  };
}

/** The project as the customer's pages read it, before any word or figure is worked out. */
export interface CustomerProjectFacts {
  readonly projectId: string;
  readonly number: number;
  readonly stage: ProjectStage;
  readonly incentiveApplies: boolean;
  readonly timeZone: string;
  readonly cancelledAt: Date | null;
  readonly proposalVersionId: string | null;
  readonly customerName: string | null;
  readonly phoneE164: string;
  readonly preferredLanguage: string | null;
  readonly expectedInstallOn: CalendarDate | null;
  readonly installStartMinutes: number | null;
  readonly installDurationDays: number | null;
  readonly installDisturbance: string | null;
  /** Every move, oldest first: where it went and the company day it arrived. */
  readonly arrivals: readonly {
    readonly from: ProjectStage | null;
    readonly to: ProjectStage;
    readonly enteredOn: CalendarDate;
  }[];
  /** The open wait as published: its party, reason class and start — never its note (`M08-25`). */
  readonly wait: {
    readonly party: string;
    readonly reason: string;
    readonly startedOn: CalendarDate;
  } | null;
  readonly crewLead: {
    readonly userId: string;
    readonly name: string;
    readonly phoneE164: string;
  } | null;
  readonly parts: readonly PartFacts[];
  readonly entries: readonly EntryFacts[];
  /** The receipt PDF kept against each payment not taken back, where one is made already. */
  readonly receiptFiles: ReadonlyMap<string, string>;
  /** The system the version in force states; `null` for a deal won with no accepted proposal. */
  readonly system: { readonly capacityKw: number | null; readonly systemType: SystemType } | null;
  /**
   * The company's own number a referral is passed (`F5-72`): as the version in force printed it,
   * else from where that version took it — the EPC Owner's, until the company sets its own (`M06-07`).
   */
  readonly companyPhoneE164: string | null;
}

/** A file the customer's solar file lists: a done row's paper, or one the company chose to show. */
export interface CustomerDocument {
  readonly fileId: string;
  readonly row: string | null;
  readonly name: string;
}

@Injectable()
export class ProjectsCustomerRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  phase(tenantId: string, leadId: string): Promise<ProjectPhaseFacts | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => phaseFactsOf(tx, tenantId, leadId));
  }

  /** The won deal's project with its journey, open wait, crew lead and money facts. */
  facts(tenantId: string, leadId: string): Promise<CustomerProjectFacts | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          projectId: project.id,
          number: project.number,
          stage: project.stage,
          incentiveApplies: project.incentiveApplies,
          timeZone: tenant.timezone,
          cancelledAt: project.cancelledAt,
          proposalVersionId: project.proposalVersionId,
          customerName: customer.name,
          phoneE164: customer.phoneE164,
          preferredLanguage: customer.preferredLanguage,
          expectedInstallOn: project.expectedInstallOn,
          installStartMinutes: project.installStartMinutes,
          installDurationDays: project.installDurationDays,
          installDisturbance: project.installDisturbance,
        })
        .from(project)
        .innerJoin(tenant, eq(tenant.id, project.tenantId))
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
        )
        .where(and(eq(project.tenantId, tenantId), eq(project.leadId, leadId)));
      if (row === undefined) return null;
      const { projectId } = row;
      const [arrivals, waits, crewLead, parts, entries] = await Promise.all([
        tx
          .select({
            from: projectStageTransition.fromStage,
            to: projectStageTransition.toStage,
            enteredOn: projectStageTransition.enteredOn,
          })
          .from(projectStageTransition)
          .where(
            and(
              eq(projectStageTransition.tenantId, tenantId),
              eq(projectStageTransition.projectId, projectId),
            ),
          )
          .orderBy(asc(projectStageTransition.movedAt), asc(projectStageTransition.id)),
        tx
          .select({
            party: projectBlocker.party,
            reason: projectBlocker.reason,
            startedOn: projectBlocker.startedOn,
          })
          .from(projectBlocker)
          .where(
            and(
              eq(projectBlocker.tenantId, tenantId),
              eq(projectBlocker.projectId, projectId),
              isNull(projectBlocker.endedAt),
            ),
          ),
        crewLeadOf(tx, tenantId, projectId),
        partFactsOf(tx, tenantId, [projectId]),
        entriesOf(tx, tenantId, projectId),
      ]);
      const version =
        row.proposalVersionId === null
          ? null
          : await versionById(tx, tenantId, row.proposalVersionId);
      const stated = version?.snapshot.fields.system ?? null;
      return {
        ...row,
        system:
          stated === null ? null : { capacityKw: stated.capacityKw, systemType: stated.systemType },
        companyPhoneE164:
          version?.snapshot.company.phoneE164 ??
          (await companyOwner(tx, tenantId))?.phoneE164 ??
          null,
        arrivals,
        wait: waits[0] ?? null,
        crewLead,
        parts: parts.get(projectId) ?? [],
        entries,
        receiptFiles: await receiptFilesOf(tx, tenantId, standingPaymentsOf(entries)),
      };
    });
  }

  /**
   * The solar file's documents (`F5-71`, `M08-46`): every DONE checklist row's files and every
   * other file the company switched on for the customer — no row invented, none shown that is
   * absent — in the order they were filed.
   */
  documents(tenantId: string, projectId: string): Promise<readonly CustomerDocument[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [filed, done] = await Promise.all([
        tx
          .select({
            fileId: projectFile.fileId,
            slot: projectFile.slot,
            slotKey: projectFile.slotKey,
            name: projectFile.name,
            shown: projectFile.shownToCustomer,
          })
          .from(projectFile)
          .where(
            and(
              eq(projectFile.tenantId, tenantId),
              eq(projectFile.projectId, projectId),
              inArray(projectFile.slot, ['document', 'other']),
            ),
          )
          .orderBy(asc(projectFile.addedAt), asc(projectFile.id)),
        tx
          .select({ row: projectDocument.rowKey })
          .from(projectDocument)
          .where(
            and(
              eq(projectDocument.tenantId, tenantId),
              eq(projectDocument.projectId, projectId),
              eq(projectDocument.state, 'done'),
            ),
          ),
      ]);
      const doneRows = new Set(done.map((one) => one.row));
      return filed.flatMap((one): CustomerDocument[] => {
        if (one.slot === 'document') {
          return one.slotKey !== null && doneRows.has(one.slotKey)
            ? [{ fileId: one.fileId, row: one.slotKey, name: one.name }]
            : [];
        }
        return one.shown ? [{ fileId: one.fileId, row: null, name: one.name }] : [];
      });
    });
  }
}

/** The crew's lead, whose name and number the customer is given (`F5-68`). */
export async function crewLeadOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
): Promise<{ userId: string; name: string; phoneE164: string } | null> {
  const [lead] = await tx
    .select({
      userId: projectCrewMember.userId,
      name: memberNameOf(userAccount),
      phoneE164: userAccount.phoneE164,
    })
    .from(projectCrewMember)
    .innerJoin(userAccount, eq(userAccount.id, projectCrewMember.userId))
    .where(
      and(
        eq(projectCrewMember.tenantId, tenantId),
        eq(projectCrewMember.projectId, projectId),
        eq(projectCrewMember.isLead, true),
      ),
    );
  return lead === undefined ? null : { ...lead, name: lead.name ?? '' };
}
