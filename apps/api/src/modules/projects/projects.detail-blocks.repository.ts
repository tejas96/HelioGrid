import {
  type DbTransaction,
  file,
  projectBlocker,
  projectCrewMember,
  projectDocument,
  projectFile,
  projectInstallStep,
  projectStageTransition,
  userAccount,
} from '@heliogrid/db';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { leadFilesOf, memberNameOf } from '../crm/crm.public';

const person = alias(userAccount, 'project_person');

/**
 * A project's blocks under its hero (`M08-16`), each from the record it names: the journey, the open
 * wait, the checklist, the install steps, the crew, the project's files and the lead's — read side
 * by side on the caller's transaction, each bounded by the one project.
 */
export async function detailBlocksOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  leadId: string,
) {
  const [journey, waits, documents, steps, crew, files, leadFiles] = await Promise.all([
    tx
      .select({
        from: projectStageTransition.fromStage,
        to: projectStageTransition.toStage,
        cause: projectStageTransition.cause,
        proof: projectStageTransition.proof,
        movedAt: projectStageTransition.movedAt,
        enteredOn: projectStageTransition.enteredOn,
        movedBy: projectStageTransition.movedBy,
        moverName: memberNameOf(person),
      })
      .from(projectStageTransition)
      .leftJoin(person, eq(person.id, projectStageTransition.movedBy))
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
        note: projectBlocker.note,
        openedAt: projectBlocker.openedAt,
        openedBy: projectBlocker.openedBy,
        openerName: memberNameOf(person),
      })
      .from(projectBlocker)
      .innerJoin(person, eq(person.id, projectBlocker.openedBy))
      .where(
        and(
          eq(projectBlocker.tenantId, tenantId),
          eq(projectBlocker.projectId, projectId),
          isNull(projectBlocker.endedAt),
        ),
      ),
    tx
      .select({
        row: projectDocument.rowKey,
        state: projectDocument.state,
        reason: projectDocument.reason,
        changedAt: projectDocument.changedAt,
        changedBy: projectDocument.changedBy,
        changerName: memberNameOf(person),
      })
      .from(projectDocument)
      .leftJoin(person, eq(person.id, projectDocument.changedBy))
      .where(and(eq(projectDocument.tenantId, tenantId), eq(projectDocument.projectId, projectId)))
      .orderBy(asc(projectDocument.position)),
    tx
      .select({
        step: projectInstallStep.stepKey,
        tickedAt: projectInstallStep.tickedAt,
        tickedBy: projectInstallStep.tickedBy,
        tickerName: memberNameOf(person),
        doneBy: projectInstallStep.doneBy,
      })
      .from(projectInstallStep)
      .leftJoin(person, eq(person.id, projectInstallStep.tickedBy))
      .where(
        and(eq(projectInstallStep.tenantId, tenantId), eq(projectInstallStep.projectId, projectId)),
      )
      .orderBy(asc(projectInstallStep.position)),
    tx
      .select({ userId: projectCrewMember.userId, name: memberNameOf(person) })
      .from(projectCrewMember)
      .innerJoin(person, eq(person.id, projectCrewMember.userId))
      .where(
        and(eq(projectCrewMember.tenantId, tenantId), eq(projectCrewMember.projectId, projectId)),
      )
      .orderBy(asc(projectCrewMember.addedAt), asc(projectCrewMember.userId)),
    tx
      .select({
        id: projectFile.id,
        fileId: projectFile.fileId,
        slot: projectFile.slot,
        slotKey: projectFile.slotKey,
        name: projectFile.name,
        contentType: file.contentType,
        addedAt: projectFile.addedAt,
        addedBy: projectFile.addedBy,
        adderName: memberNameOf(person),
        shownToCustomer: projectFile.shownToCustomer,
      })
      .from(projectFile)
      .innerJoin(
        file,
        and(eq(file.id, projectFile.fileId), eq(file.tenantId, projectFile.tenantId)),
      )
      .innerJoin(person, eq(person.id, projectFile.addedBy))
      .where(and(eq(projectFile.tenantId, tenantId), eq(projectFile.projectId, projectId)))
      .orderBy(asc(projectFile.addedAt), asc(projectFile.id)),
    leadFilesOf(tx, tenantId, leadId),
  ]);
  return { journey, waits, documents, steps, crew, files, leadFiles };
}
