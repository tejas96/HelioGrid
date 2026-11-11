import type { ProjectDetail, ProjectFile } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, project, tenant, userAccount } from '@heliogrid/db';
import { can, type FormatPack, isActiveStage, localDate, seesOnlyTheJob } from '@heliogrid/domain';
import { projectNumberOf } from '@heliogrid/domain/server';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { memberNameOf } from '../crm/crm.public';
import type { ProjectReader } from './internal/reader';
import { askFieldsOf, asksOf } from './internal/standing';
import { detailBlocksOf } from './projects.detail-blocks.repository';
import { projectScopeWhere } from './projects.scope.repository';

/*
 * One project as its screen shows it (`SCR-M08-02`, `M08-16`): every block, each naming the record
 * it reads, on the caller's transaction — so an act answers with what it just wrote.
 */

const manager = alias(userAccount, 'manager_account');
const seller = alias(userAccount, 'project_seller');
const canceller = alias(userAccount, 'project_canceller');

type Member = { userId: string; name: string };
const memberOf = (userId: string | null, name: string | null): Member | null =>
  userId === null ? null : { userId, name: name ?? '' };

/** The project in the reader's scope, as its screen reads it; `null` answers 404. */
export async function loadProjectDetail(
  tx: DbTransaction,
  reader: ProjectReader,
  projectId: string,
  formats: FormatPack,
  /** `proven` when the caller's lock already proved the reader's reach — an act may have ended it. */
  reach: 'scoped' | 'proven' = 'scoped',
): Promise<ProjectDetail | null> {
  const [row] = await tx
    .select({
      id: project.id,
      number: project.number,
      leadId: project.leadId,
      timeZone: tenant.timezone,
      customerId: customer.id,
      customerName: customer.name,
      phoneE164: customer.phoneE164,
      city: customer.city,
      preferredLanguage: customer.preferredLanguage,
      segment: lead.segment,
      stage: project.stage,
      stageEnteredAt: project.stageEnteredAt,
      incentiveApplies: project.incentiveApplies,
      managerId: project.managerId,
      managerName: memberNameOf(manager),
      soldBy: project.soldBy,
      sellerName: memberNameOf(seller),
      expectedInstallOn: project.expectedInstallOn,
      accessNote: project.accessNote,
      cancelReason: project.cancelReason,
      cancelNote: project.cancelNote,
      packLeftOut: project.packLeftOut,
      cancelledAt: project.cancelledAt,
      cancelledBy: project.cancelledBy,
      cancellerName: memberNameOf(canceller),
    })
    .from(project)
    .innerJoin(tenant, eq(tenant.id, project.tenantId))
    .innerJoin(lead, and(eq(lead.id, project.leadId), eq(lead.tenantId, project.tenantId)))
    .innerJoin(
      customer,
      and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
    )
    .innerJoin(manager, eq(manager.id, project.managerId))
    .leftJoin(seller, eq(seller.id, project.soldBy))
    .leftJoin(canceller, eq(canceller.id, project.cancelledBy))
    .where(
      and(
        eq(project.tenantId, reader.tenantId),
        eq(project.id, projectId),
        reach === 'scoped' ? projectScopeWhere(reader.scope, reader.actorId) : undefined,
      ),
    );
  if (row === undefined) return null;
  const { journey, waits, documents, steps, crew, files, leadFiles } = await detailBlocksOf(
    tx,
    reader.tenantId,
    projectId,
    row.leadId,
  );
  const fileOf = (one: (typeof files)[number]): ProjectFile => ({
    id: one.id,
    fileId: one.fileId,
    name: one.name,
    contentType: one.contentType,
    addedAt: one.addedAt.toISOString(),
    addedBy: memberOf(one.addedBy, one.adderName),
    shownToCustomer: one.shownToCustomer,
  });
  const filesIn = (slot: 'document' | 'step', key: string) =>
    files.filter((one) => one.slot === slot && one.slotKey === key).map(fileOf);
  const wait = waits[0] ?? null;
  const today = localDate(Date.now(), row.timeZone);
  const enteredOn = localDate(row.stageEnteredAt.getTime(), row.timeZone);
  const ticked = steps.filter((step) => step.tickedAt !== null).length;
  const projectWait =
    wait === null ? null : { party: wait.party, reason: wait.reason, startedOn: wait.startedOn };
  const asks = asksOf(
    formats,
    {
      stage: row.stage,
      incentiveApplies: row.incentiveApplies,
      expectedInstallOn: row.expectedInstallOn,
      enteredOn,
      documents,
      stepsTicked: ticked,
      stepsTotal: steps.length,
      wait: projectWait,
    },
    today,
  );
  const declared = (key: string) =>
    formats.documentChecklist.find((checklistRow) => checklistRow.row === key);
  const jobOnly = seesOnlyTheJob(reader.scope);
  return {
    id: row.id,
    number: projectNumberOf(row.number),
    leadId: row.leadId,
    today,
    customer: {
      id: row.customerId,
      name: row.customerName,
      phoneE164: row.phoneE164,
      city: row.city,
      preferredLanguage: row.preferredLanguage,
    },
    segment: row.segment,
    stage: row.stage,
    enteredOn,
    incentiveApplies: row.incentiveApplies,
    manager: { userId: row.managerId, name: row.managerName ?? '' },
    soldBy: memberOf(row.soldBy, row.sellerName),
    expectedInstallOn: row.expectedInstallOn,
    accessNote: row.accessNote,
    cancel:
      row.cancelReason === null || row.cancelledAt === null
        ? null
        : {
            reason: row.cancelReason,
            note: row.cancelNote,
            at: row.cancelledAt.toISOString(),
            by: memberOf(row.cancelledBy, row.cancellerName),
          },
    journey: journey.map((move) => ({
      from: move.from,
      to: move.to,
      cause: move.cause,
      proof: move.proof,
      movedAt: move.movedAt.toISOString(),
      enteredOn: move.enteredOn,
      movedBy: memberOf(move.movedBy, move.moverName),
    })),
    wait:
      wait === null
        ? null
        : {
            party: wait.party,
            reason: wait.reason,
            startedOn: wait.startedOn,
            note: wait.note,
            openedAt: wait.openedAt.toISOString(),
            openedBy: { userId: wait.openedBy, name: wait.openerName ?? '' },
          },
    // The installer's read holds no paper — no proposal, receipt or lead file (`M08-43`).
    documents: jobOnly
      ? []
      : documents.map((document) => {
          const pack = declared(document.row);
          return {
            row: document.row,
            state: document.state,
            reason: document.reason,
            movesTo: (pack?.movesTo as ProjectDetail['stage'] | undefined) ?? null,
            madeBy: pack?.madeBy ?? null,
            changedAt: document.changedAt.toISOString(),
            changedBy: memberOf(document.changedBy, document.changerName),
            files: filesIn('document', document.row),
          };
        }),
    steps: steps.map((step) => ({
      step: step.step,
      tickedAt: step.tickedAt?.toISOString() ?? null,
      tickedBy: memberOf(step.tickedBy, step.tickerName),
      doneBy: step.doneBy,
      files: filesIn('step', step.step),
    })),
    crew: crew.map((member) => ({ userId: member.userId, name: member.name ?? '' })),
    otherFiles: jobOnly ? [] : files.filter((one) => one.slot === 'other').map(fileOf),
    leadFiles: jobOnly ? [] : leadFiles.map((one) => ({ ...one, shownToCustomer: false })),
    ...askFieldsOf(asks),
    packLeftOut: row.packLeftOut,
    designId: null,
    proposalId: null,
    acts: {
      stages: isActiveStage(row.stage) && can(reader.roles, 'projects.update_stages'),
      documents: isActiveStage(row.stage) && can(reader.roles, 'projects.project_documents'),
      steps: isActiveStage(row.stage) && can(reader.roles, 'projects.installation_checklist'),
    },
  };
}
