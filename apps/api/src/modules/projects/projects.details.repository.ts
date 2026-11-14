import { type DbTransaction, project, projectCrewMember } from '@heliogrid/db';
import {
  clockTime,
  isClosedStage,
  isPromisableInstallDate,
  PROJECT_MANAGER_PRESETS,
  type ProjectActRefusal,
} from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { recordActivity } from '../crm/crm.public';
import {
  type ActContext,
  done,
  refusedWith,
  type StepOutcome,
} from './projects.act-kit.repository';
import { type LockedProject, todayOfLocked } from './projects.lock.repository';
import { allHold } from './projects.people.repository';
import { crewOf, entryBase } from './projects.waits.repository';

type DetailsChange = {
  managerId?: string;
  expectedInstallOn?: string | null;
  accessNote?: string | null;
  installStartTime?: string | null;
  installDurationDays?: number | null;
  installDisturbance?: string | null;
  crewLeadId?: string | null;
};

/**
 * The timeline's name for each fact a change may set. The installation day's own facts — its
 * start, its length, what to expect, the crew's lead — keep their closed field and add the fact
 * they are, so an older reader still reads the field and a newer one says the fact itself.
 */
const CHANGED_FIELDS = [
  ['managerId', 'manager', null],
  ['expectedInstallOn', 'install_date', null],
  ['accessNote', 'access_note', null],
  ['installStartTime', 'install_date', 'install_start'],
  ['installDurationDays', 'install_date', 'days_on_site'],
  ['installDisturbance', 'install_date', 'what_to_expect'],
  ['crewLeadId', 'crew', 'crew_lead'],
] as const;

/** Why a change is refused where the project stands; `null` lets it. */
async function refusalOfChange(
  tx: DbTransaction,
  locked: LockedProject,
  change: DetailsChange,
  context: ActContext,
): Promise<ProjectActRefusal | null> {
  if (isClosedStage(locked.stage)) return 'project_closed';
  const { managerId, expectedInstallOn, crewLeadId } = change;
  const today = todayOfLocked(locked, context.act);
  if (expectedInstallOn != null && !isPromisableInstallDate(expectedInstallOn, today)) {
    return 'date_in_past';
  }
  if (
    managerId !== undefined &&
    !(await allHold(tx, locked.tenantId, [managerId], PROJECT_MANAGER_PRESETS))
  ) {
    return 'not_a_manager';
  }
  return crewLeadId != null && !(await isOnTheCrew(tx, locked, crewLeadId)) ? 'not_on_crew' : null;
}

/**
 * The manager's own facts: who manages, the promised date, how the crew gets in — and the
 * installation day as the customer is told it (`F5-68`): when the crew starts, for how long, what
 * to expect, and which of the crew leads it.
 */
export function changeDetails(context: ActContext, change: DetailsChange) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    const refusal = await refusalOfChange(tx, locked, change, context);
    if (refusal !== null) return refusedWith(refusal);
    const fields = CHANGED_FIELDS.filter(([key]) => change[key] !== undefined);
    if (fields.length === 0) return done();
    const facts = namedFactsOf(change);
    if (Object.keys(facts).length > 0) {
      await tx
        .update(project)
        .set(facts)
        .where(and(eq(project.tenantId, locked.tenantId), eq(project.id, locked.projectId)));
    }
    if (change.crewLeadId !== undefined) await nameCrewLead(tx, locked, change.crewLeadId);
    for (const [, field, fact] of fields) {
      await recordActivity(tx, {
        ...entryBase(locked, context),
        kind: 'project_changed',
        body: { projectId: locked.projectId, field, ...(fact === null ? {} : { fact }) },
      });
    }
    return done();
  };
}

/** Only the facts the change names; the others stay as they are. */
function namedFactsOf(change: DetailsChange) {
  return {
    ...(change.managerId !== undefined && { managerId: change.managerId }),
    ...(change.expectedInstallOn !== undefined && { expectedInstallOn: change.expectedInstallOn }),
    ...(change.accessNote !== undefined && { accessNote: change.accessNote }),
    ...(change.installStartTime !== undefined && {
      installStartMinutes:
        change.installStartTime === null ? null : clockTime(change.installStartTime),
    }),
    ...(change.installDurationDays !== undefined && {
      installDurationDays: change.installDurationDays,
    }),
    ...(change.installDisturbance !== undefined && {
      installDisturbance: change.installDisturbance,
    }),
  };
}

/** Whether the person is on this project's crew — only one of the crew can lead it (`F5-68`). */
async function isOnTheCrew(
  tx: DbTransaction,
  locked: LockedProject,
  userId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ userId: projectCrewMember.userId })
    .from(projectCrewMember)
    .where(and(crewOf(locked), eq(projectCrewMember.userId, userId)));
  return found !== undefined;
}

/** One lead per crew: the mark leaves whoever held it before it lands on the person named. */
async function nameCrewLead(
  tx: DbTransaction,
  locked: LockedProject,
  userId: string | null,
): Promise<void> {
  await tx
    .update(projectCrewMember)
    .set({ isLead: false })
    .where(and(crewOf(locked), eq(projectCrewMember.isLead, true)));
  if (userId === null) return;
  await tx
    .update(projectCrewMember)
    .set({ isLead: true })
    .where(and(crewOf(locked), eq(projectCrewMember.userId, userId)));
}
