import { userAccount } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ProjectsCustomerService } from '../../src/modules/projects/projects.public';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  aStaffedCompany,
  aStoredFile,
  aWonProject,
  openProjectsWorld,
  type ProjectsWorld,
} from './support';

/**
 * The solar file's documents as the customer's link reads them (`T-F5-003`; `F5-71`, `M08-46`):
 * a DONE checklist row's paper and a file the company switched on — no row invented, no absent
 * document shown — and only a listed file is ever served.
 */

const here = aStaffedCompany('Solar File EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'SOLAR FILE PROOF',
  'The solar file’s documents on the customer’s link are UNPROVEN in this run.',
);

/** A lead id no company holds. */
const NO_SUCH_LEAD = '00000000-0000-7000-8000-000000000000';

describe.skipIf(skip)('the solar file’s documents, against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;
  const service = () => world.http.app.get(ProjectsCustomerService);

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('lists a done row’s paper and a file switched on — nothing else', async () => {
    const won = await aWonProject(owner(), here.people.owner.userId);
    const subject = { kind: 'project', ref: won.projectId } as const;
    const paper = await aStoredFile(world, tenantId(), subject);
    const hidden = await aStoredFile(world, tenantId(), subject);
    const shown = await aStoredFile(world, tenantId(), subject);
    await acted(owner(), won.projectId, 'files', {
      slot: 'document',
      slotKey: 'utility_feasibility',
      fileId: paper,
      name: 'Feasibility approval.pdf',
    });
    for (const [fileId, name] of [
      [hidden, 'Site sketch.pdf'],
      [shown, 'Panel datasheet.pdf'],
    ] as const) {
      await acted(owner(), won.projectId, 'files', { slot: 'other', slotKey: null, fileId, name });
    }
    const detail = await acted(owner(), won.projectId, 'files', {
      slot: 'other',
      slotKey: null,
      fileId: await aStoredFile(world, tenantId(), subject),
      name: 'Second sketch.pdf',
    });
    const toShow = detail.otherFiles.find((one) => one.fileId === shown);
    await acted(owner(), won.projectId, 'files/show', { projectFileId: toShow?.id, shown: true });

    const file = await service().solarFileOf(tenantId(), won.leadId);
    expect(file?.documents).toEqual([
      { fileId: paper, row: 'utility_feasibility', name: 'Feasibility approval.pdf' },
      { fileId: shown, row: null, name: 'Panel datasheet.pdf' },
    ]);
    // Not yet commissioned: no switch-on day is stated, and none is made up.
    expect(file?.switchedOnAt).toBeNull();
    // Only a file the page lists is served — and a project not handed over lists no paper yet.
    expect(await service().customerFile(tenantId(), won.leadId, hidden)).toBeNull();
    expect(await service().customerFile(tenantId(), won.leadId, paper)).toBeNull();
  });

  it('a deal won with no accepted proposal passes a referral the company’s own number (F5-72, M06-07)', async () => {
    const won = await aWonProject(owner(), here.people.owner.userId);
    const [founder] = await world.pools.admin.db
      .select({ phoneE164: userAccount.phoneE164 })
      .from(userAccount)
      .where(eq(userAccount.id, here.people.owner.userId));
    const file = await service().solarFileOf(tenantId(), won.leadId);
    expect(file?.referTo).toBe(founder?.phoneE164);
    expect(file?.referTo).toEqual(expect.stringMatching(/^\+\d{10,15}$/));
  });

  it('a lead that is not won has no solar file and no progress', async () => {
    expect(await service().solarFileOf(tenantId(), NO_SUCH_LEAD)).toBeNull();
    expect(await service().progressOf(tenantId(), NO_SUCH_LEAD)).toBeNull();
  });
});
