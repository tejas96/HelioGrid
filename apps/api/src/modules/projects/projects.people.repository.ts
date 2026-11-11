import type { ProjectJob } from '@heliogrid/contracts';
import {
  customer,
  type DbTransaction,
  membershipRole,
  project,
  projectCrewMember,
  projectInstallStep,
  type TenantPool,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import {
  CREW_ON_SITE_STAGES,
  crewJobRank,
  PROJECT_CREW_PRESETS,
  PROJECT_MANAGER_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { projectNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, notInArray } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from '../crm/crm.public';
import type { ProjectReader } from './internal/reader';

const LIVE_EXCLUDED = ['handed_over', 'cancelled'] as const;

/** The active members holding one of these presets — a team, so one bounded read. */
async function holdersOf(
  tx: DbTransaction,
  tenantId: string,
  presets: readonly RolePreset[],
): Promise<{ userId: string; name: string }[]> {
  const rows = await tx
    .selectDistinct({ userId: userAccount.id, name: memberNameOf(userAccount) })
    .from(membershipRole)
    .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(membershipRole.tenantId, tenantId),
        eq(tenantMembership.status, 'active'),
        inArray(membershipRole.rolePreset, [...presets]),
      ),
    );
  return rows
    .map((row) => ({ userId: row.userId, name: row.name ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId));
}

/** Whether every one of these people holds one of the presets, active in the company. */
export async function allHold(
  tx: DbTransaction,
  tenantId: string,
  userIds: readonly string[],
  presets: readonly RolePreset[],
): Promise<boolean> {
  const holders = new Set((await holdersOf(tx, tenantId, presets)).map((holder) => holder.userId));
  return userIds.length > 0 && userIds.every((userId) => holders.has(userId));
}

/**
 * A crew a dispatch may name: people all on the installation team — or none, while the company has
 * no one on that team yet, so a project never sticks before Dispatched (ruling 6).
 */
export async function isTheCrewToName(
  tx: DbTransaction,
  tenantId: string,
  crew: readonly string[],
): Promise<boolean> {
  if (crew.length > 0) return allHold(tx, tenantId, crew, PROJECT_CREW_PRESETS);
  return (await holdersOf(tx, tenantId, PROJECT_CREW_PRESETS)).length === 0;
}

/**
 * The pickers' people and the installer's jobs. A person's live projects count both the ones they
 * manage and the ones they crew, so a picker shows who is free.
 */
@Injectable()
export class ProjectsPeopleRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  people(tenantId: string, role: 'manager' | 'crew') {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const holders = await holdersOf(
        tx,
        tenantId,
        role === 'manager' ? PROJECT_MANAGER_PRESETS : PROJECT_CREW_PRESETS,
      );
      const ids = holders.map((holder) => holder.userId);
      if (ids.length === 0) return [];
      const managed = await tx
        .select({ userId: project.managerId, live: count() })
        .from(project)
        .where(
          and(
            eq(project.tenantId, tenantId),
            inArray(project.managerId, ids),
            notInArray(project.stage, [...LIVE_EXCLUDED]),
          ),
        )
        .groupBy(project.managerId);
      const crewed = await tx
        .select({ userId: projectCrewMember.userId, live: count() })
        .from(projectCrewMember)
        .innerJoin(
          project,
          and(
            eq(project.id, projectCrewMember.projectId),
            eq(project.tenantId, projectCrewMember.tenantId),
          ),
        )
        .where(
          and(
            eq(projectCrewMember.tenantId, tenantId),
            inArray(projectCrewMember.userId, ids),
            inArray(project.stage, [...CREW_ON_SITE_STAGES]),
          ),
        )
        .groupBy(projectCrewMember.userId);
      const liveOf = (rows: { userId: string; live: number }[], userId: string) =>
        rows.find((row) => row.userId === userId)?.live ?? 0;
      return holders.map((holder) => ({
        ...holder,
        liveProjects:
          role === 'manager' ? liveOf(managed, holder.userId) : liveOf(crewed, holder.userId),
      }));
    });
  }

  /**
   * The installer's assigned jobs (`SCR-M08-05`): live projects whose crew names them, from
   * Dispatched on, with their steps — the job's words and nothing commercial (`M08-43`).
   */
  jobs(reader: ProjectReader): Promise<ProjectJob[]> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: project.id,
          number: project.number,
          name: customer.name,
          place: customer.city,
          phoneE164: customer.phoneE164,
          stage: project.stage,
          accessNote: project.accessNote,
        })
        .from(projectCrewMember)
        .innerJoin(
          project,
          and(
            eq(project.id, projectCrewMember.projectId),
            eq(project.tenantId, projectCrewMember.tenantId),
          ),
        )
        .innerJoin(
          customer,
          and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
        )
        .where(
          and(
            eq(projectCrewMember.tenantId, reader.tenantId),
            eq(projectCrewMember.userId, reader.actorId),
            inArray(project.stage, [...CREW_ON_SITE_STAGES]),
          ),
        )
        .orderBy(asc(project.stageEnteredAt), asc(project.id));
      if (rows.length === 0) return [];
      // The work under way first, each stage oldest first (a stable sort keeps the query's order).
      rows.sort((one, other) => crewJobRank(one.stage) - crewJobRank(other.stage));
      const steps = await tx
        .select({
          projectId: projectInstallStep.projectId,
          step: projectInstallStep.stepKey,
          tickedAt: projectInstallStep.tickedAt,
          tickedBy: projectInstallStep.tickedBy,
          tickerName: memberNameOf(userAccount),
          doneBy: projectInstallStep.doneBy,
        })
        .from(projectInstallStep)
        .leftJoin(userAccount, eq(userAccount.id, projectInstallStep.tickedBy))
        .where(
          and(
            eq(projectInstallStep.tenantId, reader.tenantId),
            inArray(
              projectInstallStep.projectId,
              rows.map((row) => row.id),
            ),
          ),
        )
        .orderBy(asc(projectInstallStep.position));
      return rows.map((row) => ({
        ...row,
        number: projectNumberOf(row.number),
        steps: steps
          .filter((step) => step.projectId === row.id)
          .map((step) => ({
            step: step.step,
            tickedAt: step.tickedAt?.toISOString() ?? null,
            tickedBy:
              step.tickedBy === null
                ? null
                : { userId: step.tickedBy, name: step.tickerName ?? '' },
            doneBy: step.doneBy,
          })),
      }));
    });
  }
}
