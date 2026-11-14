import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aLead,
  aStaffedCompany,
  detailOf,
  openProposalsWorld,
  type ProposalsWorld,
} from './support';

/**
 * Track's *Call* (`T-M06-018`, `M02-44`): the proposal's read says whether its customer may be
 * dialled, so a do-not-call or wrong-number customer is never offered the dialler from the proposal.
 */

const here = aStaffedCompany('Proposal Track Call EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL TRACK CALL PROOF',
  'Whether Track may dial the customer is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('Track’s Call, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    [false, true],
    [true, false],
  ])('a customer marked do-not-call %s may be dialled: %s', async (doNotCall, canDial) => {
    const leadId = await aLead(owner());
    if (doNotCall) {
      const marked = await owner().call('PATCH', `/leads/${leadId}`, {
        doNotCall: true,
        capturedAt: new Date().toISOString(),
      });
      expect(marked.status).toBe(HttpStatus.OK);
    }
    const draft = await aDraft(owner(), leadId);
    const read = await detailOf(owner(), draft.id);
    expect(read.status).toBe(HttpStatus.OK);
    expect(read.body.lead.canDial).toBe(canDial);
  });
});
