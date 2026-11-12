import type { ProjectBoard, ProjectCard } from '@heliogrid/contracts';
import {
  customer,
  lead,
  project,
  projectBlocker,
  projectDocument,
  projectInstallStep,
  projectStageTransition,
  type TenantPool,
  type TenantScopedDb,
  tenant,
  userAccount,
} from '@heliogrid/db';
import {
  type CalendarDate,
  type FormatPack,
  handedOverSince,
  isActiveStage,
  localDate,
  localInstant,
  PROJECT_STAGES,
  type ProjectStage,
} from '@heliogrid/domain';
import { projectNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  max,
  min,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';
import { isMoneyDue, moneyFormatOf } from './internal/money';
import type { ProjectReader } from './internal/reader';
import { askFieldsOf, asksOf } from './internal/standing';
import { moneyGlancesOf } from './projects.money-glance.repository';
import { projectScopeWhere } from './projects.scope.repository';

const CLOSED_STAGES: readonly ProjectStage[] = ['handed_over', 'cancelled'];

/** The columns a project card is made of: `from project`, its lead, customer and manager joined. */
const cardColumns = {
  id: project.id,
  number: project.number,
  name: customer.name,
  place: customer.city,
  segment: lead.segment,
  stage: project.stage,
  stageEnteredAt: project.stageEnteredAt,
  incentiveApplies: project.incentiveApplies,
  managerId: project.managerId,
  managerName: memberNameOf(userAccount),
  expectedInstallOn: project.expectedInstallOn,
};
interface CardRow {
  readonly id: string;
  readonly number: number;
  readonly name: string | null;
  readonly place: string | null;
  readonly segment: 'residential' | 'commercial' | null;
  readonly stage: ProjectStage;
  readonly stageEnteredAt: Date;
  readonly incentiveApplies: boolean;
  readonly managerId: string;
  readonly managerName: string | null;
  readonly expectedInstallOn: string | null;
}

/**
 * The board and the closed list (`SCR-M08-01`). The board reads every live project the reader
 * reaches with four bounded queries — the projects, then their open waits, checklist states and
 * tick counts by id — so it never reads one project at a time.
 */
@Injectable()
export class ProjectsBoardRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  board(reader: ProjectReader, formats: FormatPack): Promise<ProjectBoard> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const [own] = await tx
        .select({ timeZone: tenant.timezone })
        .from(tenant)
        .where(eq(tenant.id, reader.tenantId));
      if (own === undefined) throw new Error(`no company ${reader.tenantId} to read a board for`);
      const today = localDate(Date.now(), own.timeZone);
      const scope = projectScopeWhere(reader.scope, reader.actorId);
      // The handed-over stop counts the last 30 company days — the same bound its list reads.
      const recentSince = new Date(localInstant(handedOverSince(today), 0, own.timeZone));
      const stageRows = await tx
        .select({ stage: project.stage, count: count(), oldest: min(project.stageEnteredAt) })
        .from(project)
        .where(
          and(
            eq(project.tenantId, reader.tenantId),
            scope,
            or(ne(project.stage, 'handed_over'), gte(project.stageEnteredAt, recentSince)),
          ),
        )
        .groupBy(project.stage);
      const rows = (await tx
        .select(cardColumns)
        .from(project)
        .innerJoin(lead, and(eq(lead.id, project.leadId), eq(lead.tenantId, project.tenantId)))
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
        )
        .innerJoin(userAccount, eq(userAccount.id, project.managerId))
        .where(
          and(
            eq(project.tenantId, reader.tenantId),
            notInArray(project.stage, [...CLOSED_STAGES]),
            scope,
          ),
        )
        .orderBy(asc(project.stageEnteredAt), asc(project.id))) as CardRow[];
      const live = await this.cardsOf(tx, reader, rows, formats, own.timeZone, today);
      return {
        today,
        stages: PROJECT_STAGES.filter((stage) => stage !== 'cancelled').map((stage) => {
          const found = stageRows.find((row) => row.stage === stage);
          return {
            stage,
            count: found?.count ?? 0,
            oldestEnteredOn:
              found?.oldest == null
                ? null
                : localDate(new Date(found.oldest).getTime(), own.timeZone),
          };
        }),
        live,
      };
    });
  }

  /** Handed-over or cancelled projects, newest move first, one page with its total. */
  closed(
    reader: ProjectReader,
    formats: FormatPack,
    stage: 'handed_over' | 'cancelled',
    page: { limit: number; offset: number },
    /** Only those closed on or after this company day; null for every one. */
    since: CalendarDate | null,
  ): Promise<{ items: ProjectCard[]; totalCount: number }> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const [own] = await tx
        .select({ timeZone: tenant.timezone })
        .from(tenant)
        .where(eq(tenant.id, reader.tenantId));
      if (own === undefined) throw new Error(`no company ${reader.tenantId} to read projects for`);
      const where = and(
        eq(project.tenantId, reader.tenantId),
        eq(project.stage, stage),
        projectScopeWhere(reader.scope, reader.actorId),
        since === null
          ? undefined
          : gte(project.stageEnteredAt, new Date(localInstant(since, 0, own.timeZone))),
      );
      const rows = (await tx
        .select(cardColumns)
        .from(project)
        .innerJoin(lead, and(eq(lead.id, project.leadId), eq(lead.tenantId, project.tenantId)))
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
        )
        .innerJoin(userAccount, eq(userAccount.id, project.managerId))
        .where(where)
        .orderBy(desc(project.stageEnteredAt), desc(project.id))
        .limit(page.limit)
        .offset(page.offset)) as CardRow[];
      const [total] = await tx.select({ count: count() }).from(project).where(where);
      const today = localDate(Date.now(), own.timeZone);
      return {
        items: await this.cardsOf(tx, reader, rows, formats, own.timeZone, today),
        totalCount: total?.count ?? 0,
      };
    });
  }

  /** The cards for these rows: each one's open wait, checklist states and ticks, read by id. */
  private async cardsOf(
    tx: TenantScopedDb,
    reader: ProjectReader,
    rows: readonly CardRow[],
    formats: FormatPack,
    timeZone: string,
    today: string,
  ): Promise<ProjectCard[]> {
    const { tenantId } = reader;
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return [];
    const money = await moneyGlancesOf(tx, reader, ids, moneyFormatOf(formats, timeZone));
    const [waits, documents, steps, installs] = await Promise.all([
      tx
        .select({
          projectId: projectBlocker.projectId,
          party: projectBlocker.party,
          reason: projectBlocker.reason,
          startedOn: projectBlocker.startedOn,
        })
        .from(projectBlocker)
        .where(
          and(
            eq(projectBlocker.tenantId, tenantId),
            inArray(projectBlocker.projectId, ids),
            isNull(projectBlocker.endedAt),
          ),
        ),
      tx
        .select({
          projectId: projectDocument.projectId,
          row: projectDocument.rowKey,
          state: projectDocument.state,
        })
        .from(projectDocument)
        .where(and(eq(projectDocument.tenantId, tenantId), inArray(projectDocument.projectId, ids)))
        .orderBy(asc(projectDocument.position)),
      tx
        .select({
          projectId: projectInstallStep.projectId,
          total: count(),
          ticked: sql<number>`count(${projectInstallStep.tickedAt})::int`,
        })
        .from(projectInstallStep)
        .where(
          and(
            eq(projectInstallStep.tenantId, tenantId),
            inArray(projectInstallStep.projectId, ids),
          ),
        )
        .groupBy(projectInstallStep.projectId),
      // The day the install finished: its last arrival at Electrical & metering.
      tx
        .select({
          projectId: projectStageTransition.projectId,
          on: max(projectStageTransition.enteredOn),
        })
        .from(projectStageTransition)
        .where(
          and(
            eq(projectStageTransition.tenantId, tenantId),
            inArray(projectStageTransition.projectId, ids),
            eq(projectStageTransition.toStage, 'electrical_metering'),
          ),
        )
        .groupBy(projectStageTransition.projectId),
    ]);
    return rows.map((row) => {
      const wait = waits.find((one) => one.projectId === row.id);
      const ticks = steps.find((one) => one.projectId === row.id);
      const enteredOn = localDate(row.stageEnteredAt.getTime(), timeZone);
      const projectWait =
        wait === undefined
          ? null
          : { party: wait.party, reason: wait.reason, startedOn: wait.startedOn };
      const asks = asksOf(
        formats,
        {
          stage: row.stage,
          incentiveApplies: row.incentiveApplies,
          expectedInstallOn: row.expectedInstallOn,
          enteredOn,
          documents: documents.filter((document) => document.projectId === row.id),
          stepsTicked: ticks?.ticked ?? 0,
          stepsTotal: ticks?.total ?? 0,
          wait: projectWait,
          moneyDue: isMoneyDue(money.get(row.id)),
        },
        today,
      );
      return {
        id: row.id,
        number: projectNumberOf(row.number),
        name: row.name,
        place: row.place,
        segment: row.segment,
        stage: row.stage,
        enteredOn,
        manager: { userId: row.managerId, name: row.managerName ?? '' },
        expectedInstallOn: isActiveStage(row.stage) ? row.expectedInstallOn : null,
        steps: { ticked: ticks?.ticked ?? 0, total: ticks?.total ?? 0 },
        wait: projectWait,
        ...askFieldsOf(asks),
        installedOn: installs.find((one) => one.projectId === row.id)?.on ?? null,
        money: money.get(row.id) ?? null,
      };
    });
  }
}
