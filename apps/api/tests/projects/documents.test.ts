import type { ProjectCard } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  actOn,
  aStaffedCompany,
  aStoredFile,
  aWonProject,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
  refusalOf,
  TO_COMMISSIONED,
  walk,
} from './support';

/**
 * The checklist on the wire (`M08-30`…`M08-32`, `M08-46`, rulings 2026-11-10): a row is done by
 * its document, or *Not needed* with a reason, and reopened when that was a mistake; a document
 * that proves a stage moves a project standing right before it; handover waits on every row but
 * the pack it makes itself.
 */

const here = aStaffedCompany('Project Documents EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT DOCUMENTS PROOF',
  'The project checklist and handover are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)(
  'the project checklist and handover, over HTTP against a migrated database',
  () => {
    let world: ProjectsWorld;
    const owner = () => world.as(here.members.owner);
    const ownerId = () => here.people.owner.userId;
    const tenantId = () => here.company.tenantId;
    const notNeeded = (projectId: string, row: string, reason: string) =>
      actOn(owner(), projectId, 'documents/not-needed', { row, reason });
    const attach = (projectId: string, fileId: string, row: string) =>
      actOn(owner(), projectId, 'files', {
        fileId,
        slot: 'document',
        slotKey: row,
        name: 'Commissioning certificate.pdf',
      });

    beforeAll(async () => {
      world = await openProjectsWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    it.each([
      ['blank', ''],
      ['only spaces', '   '],
    ])('Not needed with a reason that is %s is refused', async (_case, reason) => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const reply = await notNeeded(projectId, 'utility_feasibility', reason);
      expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
      expect(reply.body).toMatchObject({ error: { details: [{ path: 'reason' }] } });
    });

    it('Not needed keeps its reason, and reopen puts the row back to waiting', async () => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const marked = (await notNeeded(projectId, 'utility_feasibility', 'Below 10 kW')).body;
      expect(marked.documents.find((row) => row.row === 'utility_feasibility')).toMatchObject({
        state: 'not_needed',
        reason: 'Below 10 kW',
        changedBy: { userId: ownerId() },
      });
      const reopened = await acted(owner(), projectId, 'documents/reopen', {
        row: 'utility_feasibility',
      });
      expect(reopened.documents.find((row) => row.row === 'utility_feasibility')).toMatchObject({
        state: 'pending',
        reason: null,
      });
    });

    it('Needed after all on a row nobody marked not needed is the second tap; an unknown row is unknown', async () => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const reopen = (row: string) => actOn(owner(), projectId, 'documents/reopen', { row });
      expect(refusalOf(await reopen('signed_proposal'))).toBe('already_moved');
      expect(refusalOf(await reopen('no_such_row'))).toBe('row_unknown');
    });

    it('Not needed on a row already done is refused, and the row keeps its file', async () => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const fileId = await aStoredFile(world, tenantId(), { kind: 'project', ref: projectId });
      expect((await attach(projectId, fileId, 'signed_proposal')).status).toBe(HttpStatus.OK);
      const reply = await notNeeded(projectId, 'signed_proposal', 'Signed on paper');
      expect(refusalOf(reply)).toBe('already_moved');
      const row = (await detailOf(owner(), projectId)).body.documents.find(
        (one) => one.row === 'signed_proposal',
      );
      expect(row).toMatchObject({ state: 'done', reason: null });
    });

    it('no person puts a file on the row handover itself fills', async () => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const fileId = await aStoredFile(world, tenantId(), { kind: 'project', ref: projectId });
      expect(refusalOf(await attach(projectId, fileId, 'handover_pack'))).toBe('made_at_handover');
    });

    it('a row the project does not carry is refused as unknown', async () => {
      const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
      const reply = await notNeeded(projectId, 'incentive_application', 'No subsidy');
      expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(refusalOf(reply)).toBe('row_unknown');
    });

    it('a document that proves the next stage marks its row done and moves the project', async () => {
      const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
      await walk(owner(), projectId, TO_COMMISSIONED.slice(0, -1));
      const fileId = await aStoredFile(world, tenantId(), { kind: 'project', ref: projectId });
      const reply = await attach(projectId, fileId, 'commissioning_certificate');
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.stage).toBe('commissioned');
      expect(reply.body.journey.at(-1)).toMatchObject({
        from: 'utility_inspection',
        to: 'commissioned',
        cause: 'proof',
        proof: 'commissioning_certificate',
        movedBy: null,
      });
      const row = reply.body.documents.find((one) => one.row === 'commissioning_certificate');
      expect(row?.state).toBe('done');
      expect(row?.files.map((one) => one.fileId)).toEqual([fileId]);
    });

    it('a file whose upload never completed cannot be put on a row', async () => {
      const { projectId } = await aWonProject(owner(), ownerId());
      const fileId = await aStoredFile(
        world,
        tenantId(),
        { kind: 'project', ref: projectId },
        false,
      );
      const reply = await attach(projectId, fileId, 'signed_proposal');
      expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(refusalOf(reply)).toBe('file_not_ready');
    });

    it('handover goes through once every row is done or not needed, and makes the pack', async () => {
      const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
      await walk(owner(), projectId, TO_COMMISSIONED);
      const rows = (await detailOf(owner(), projectId)).body.documents
        .map((one) => one.row)
        .filter((row) => row !== 'handover_pack');
      for (const row of rows) {
        expect((await notNeeded(projectId, row, 'Handled outside HelioGrid')).status).toBe(
          HttpStatus.OK,
        );
      }
      const preview = await owner().call<{ pendingRows: string[] }>(
        'GET',
        `/projects/${projectId}/handover`,
      );
      expect(preview.body.pendingRows).toEqual([]);
      const handed = await acted(owner(), projectId, 'handover');
      expect(handed).toMatchObject({
        stage: 'handed_over',
        acts: { stages: false, documents: false, steps: false },
      });
      expect(handed.journey.at(-1)).toMatchObject({ from: 'commissioned', cause: 'handover' });
      expect(handed.documents.find((one) => one.row === 'handover_pack')?.state).toBe('done');
      const closed = await owner().call<{ items: ProjectCard[] }>(
        'GET',
        '/projects/closed?stage=handed_over&page=1&limit=100',
      );
      expect(closed.body.items.map((card) => card.id)).toContain(projectId);
      expect(refusalOf(await actOn(owner(), projectId, 'move-back', { from: 'handed_over' }))).toBe(
        'project_closed',
      );
    });
  },
);
