import { type DbTransaction, project, projectCrewMember } from '@heliogrid/db';
import { type ProjectReach, type ProjectScope, projectScopeOf } from '@heliogrid/domain';
import { and, eq, exists, or, type SQL, sql } from 'drizzle-orm';
import type { MayRead } from '../notification/notification.public';

/*
 * The projects a person may see, as ONE predicate every project read and act applies (`F2-14`):
 * an id outside it answers 404, never 403 — a project out of reach does not exist for them.
 */

const REACH_CLAUSES: Readonly<Record<ProjectReach, (actorId: string) => SQL>> = {
  sold_by_me: (actorId) => eq(project.soldBy, actorId),
  managed_by_me: (actorId) => eq(project.managerId, actorId),
  crew_on: (actorId) =>
    exists(
      sql`(select 1 from ${projectCrewMember} where ${projectCrewMember.tenantId} = ${project.tenantId} and ${projectCrewMember.projectId} = ${project.id} and ${projectCrewMember.userId} = ${actorId})`,
    ),
};

/** The scope as a `where` clause over `project`; `undefined` reaches every project of the company. */
export function projectScopeWhere(scope: ProjectScope, actorId: string): SQL | undefined {
  if (scope.kind === 'all') return undefined;
  const clauses = scope.reaches.map((reach) => REACH_CLAUSES[reach](actorId));
  return clauses.length === 0 ? sql`false` : or(...clauses);
}

/** Whether a member may read this project — who a project's notice and its files may reach. */
export function projectReadableBy(tx: DbTransaction, tenantId: string, projectId: string): MayRead {
  return async (candidate) => {
    const [found] = await tx
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.tenantId, tenantId),
          eq(project.id, projectId),
          projectScopeWhere(projectScopeOf(candidate.roles), candidate.userId),
        ),
      );
    return found !== undefined;
  };
}
