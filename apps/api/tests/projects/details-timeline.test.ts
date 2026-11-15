import { FOUNDER_ROLE } from '@heliogrid/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { storedEntriesOf } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  aStaffedCompany,
  aWonProject,
  dayFromToday,
  openProjectsWorld,
  type ProjectsWorld,
} from './support';

/*
 * The installation day's facts on the timeline (`F5-68`, `M02-35`): each change is told as the fact
 * it is — the start time, the days on site, what to expect, the crew's lead — never folded into
 * "install date" or "crew".
 */

const here = aStaffedCompany('Project Details Timeline EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT DETAILS TIMELINE PROOF',
  'The installation day’s timeline entries are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the installation day on the timeline, over HTTP', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('names each fact a change set, once each', async () => {
    const { projectId, leadId } = await aWonProject(owner(), here.people.owner.userId);
    await acted(owner(), projectId, 'details', {
      expectedInstallOn: dayFromToday(10),
      installStartTime: '09:30',
      installDurationDays: 2,
      installDisturbance: 'The power is off for two hours.',
      crewLeadId: null,
    });

    const changed = (await storedEntriesOf(world, leadId))
      .filter((entry) => entry.kind === 'project_changed')
      .map((entry) => entry.body);
    expect(changed).toEqual([
      { projectId, field: 'install_date' },
      { projectId, field: 'install_date', fact: 'install_start' },
      { projectId, field: 'install_date', fact: 'days_on_site' },
      { projectId, field: 'install_date', fact: 'what_to_expect' },
      { projectId, field: 'crew', fact: 'crew_lead' },
    ]);
  });
});
