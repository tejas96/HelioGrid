import { FOUNDER_ROLE } from '@heliogrid/domain';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { onTheClock } from '../crm/lead-work';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  aStaffedCompany,
  aWonProject,
  dayFromToday,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
} from './support';

/*
 * The evening-before crew message turns due on the company's clock (`T-F5-002`, `F5-68`): at the
 * pack's send hour the day before the installation, in the company's own zone, and not a minute
 * sooner. The day is set in the past so the faked clock only ever runs behind the signed-in token.
 */

const here = aStaffedCompany('Crew Message Hour EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CREW MESSAGE HOUR PROOF',
  'The hour the crew message turns due on the project read is UNPROVEN in this run.',
);

/** India's pack: the evening-before message goes at 19:00 on the company's clock. */
const SEND_HOUR = '19:00';
const MINUTE_BEFORE = '18:59';

describe.skipIf(skip)('the crew message’s hour on the project read, over HTTP', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['a minute before the send hour the evening before: not yet', MINUTE_BEFORE, false],
    ['at the send hour the evening before: due', SEND_HOUR, true],
  ])('%s', async (_, hhmm, due) => {
    const { projectId } = await aWonProject(owner(), here.people.owner.userId);
    await acted(owner(), projectId, 'details', { expectedInstallOn: dayFromToday(0) });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(onTheClock(dayFromToday(-1), hhmm));
    expect((await detailOf(owner(), projectId)).body.crewMessageDue).toBe(due);
  });
});
