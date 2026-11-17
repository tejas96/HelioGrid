import type { LeadDetail } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  detailOf,
  openStudioWorld,
  type StudioWorld,
  saveSite,
  storedEntriesOf,
} from './support';

/**
 * Site details on the wire (`T-M05-001a`): the site's facts are saved on the lead that holds them,
 * each changed one a timeline entry; roof or ground is saved on the design; only the pin is asked
 * for; and the same details sent again write nothing.
 */

const here = aStaffedCompany('Site Details EPC', { owner: [FOUNDER_ROLE] });

/** The seven facts Site details saves on the lead: each changed one is one timeline entry. */
const SITE_FACTS = 7;

const skip = skipWithoutDatabase(
  'SITE DETAILS PROOF',
  'That site details land on the lead and its timeline is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('Site details, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const fieldChangesOf = async (leadId: string) =>
    (await storedEntriesOf(world, leadId)).filter((entry) => entry.kind === 'field_change');

  beforeAll(async () => {
    world = await openStudioWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a new design opens with an empty site, and the saved site reads back on the design and on the lead', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    expect(made.site).toEqual({
      name: null,
      address: null,
      pin: null,
      area: null,
      utilityOperator: null,
      supplyPhase: null,
      sanctionedLoadKw: null,
    });
    const saved = await saveSite(owner(), made.design.id, aSite({ mount: 'ground' }));
    expect(saved.status).toBe(HttpStatus.OK);
    expect(saved.body.design.mount).toBe('ground');
    expect(saved.body.site).toEqual({
      name: 'Sharma residence',
      address: 'Swapnanagri, Vishrambag, Sangli 416415',
      pin: { latitude: 16.8367, longitude: 74.5966 },
      area: { area: 'IN-MH', district: null },
      utilityOperator: 'MSEDCL',
      supplyPhase: 'single',
      sanctionedLoadKw: 8,
    });
    const lead = await owner().call<LeadDetail>('GET', `/leads/${leadId}`);
    expect(lead.body.site).toMatchObject({
      address: 'Swapnanagri, Vishrambag, Sangli 416415',
      name: 'Sharma residence',
      pin: { latitude: 16.8367, longitude: 74.5966 },
      utilityOperator: 'MSEDCL',
      sanctionedLoadKw: 8,
      supplyPhase: 'single',
    });
  });

  it('every changed fact is one timeline entry, and the same details again write none', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    await saveSite(owner(), made.design.id);
    const first = await fieldChangesOf(leadId);
    expect(first).toHaveLength(SITE_FACTS);
    const updatedAt = (await detailOf(owner(), made.design.id)).body.design.updatedAt;
    const again = await saveSite(owner(), made.design.id);
    expect(again.status).toBe(HttpStatus.OK);
    expect(await fieldChangesOf(leadId)).toHaveLength(SITE_FACTS);
    expect(again.body.design.updatedAt).toBe(updatedAt);
    await saveSite(owner(), made.design.id, aSite({ sanctionedLoadKw: 10 }));
    expect(await fieldChangesOf(leadId)).toHaveLength(SITE_FACTS + 1);
  });

  it('a second design of the lead opens with the site the first one saved', async () => {
    const leadId = await aLead(owner());
    const first = await aDesign(owner(), leadId);
    await saveSite(owner(), first.design.id);
    const second = await aDesign(owner(), leadId);
    expect(second.site.pin).toEqual({ latitude: 16.8367, longitude: 74.5966 });
    expect(second.site.utilityOperator).toBe('MSEDCL');
  });

  it('only the pin is asked for: every other fact may be left empty', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    const bare = aSite({
      name: null,
      address: null,
      area: null,
      utilityOperator: null,
      supplyPhase: null,
      sanctionedLoadKw: null,
    });
    const saved = await saveSite(owner(), made.design.id, bare);
    expect(saved.status).toBe(HttpStatus.OK);
    expect(saved.body.site.pin).toEqual({ latitude: 16.8367, longitude: 74.5966 });
    expect(await fieldChangesOf(leadId)).toHaveLength(1);
  });

  it('a save with no pin, or a pin off the globe, is refused by its field', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    const { pin: _pin, ...noPin } = aSite();
    const missing = await owner().call<{ error: { details: { path: string }[] } }>(
      'PUT',
      `/designs/${made.design.id}/site`,
      noPin,
    );
    expect(missing.status).toBe(HttpStatus.BAD_REQUEST);
    expect(missing.body.error.details.map((detail) => detail.path)).toContain('pin');
    const off = await saveSite(
      owner(),
      made.design.id,
      aSite({ pin: { latitude: 95, longitude: 74 } }),
    );
    expect(off.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await detailOf(owner(), made.design.id)).body.site.pin).toBeNull();
  });

  it('a pin is stored to six decimals, so a move of a metre is a change', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    await saveSite(owner(), made.design.id);
    const moved = await saveSite(
      owner(),
      made.design.id,
      aSite({ pin: { latitude: 16.83670949, longitude: 74.5966 } }),
    );
    expect(moved.body.site.pin).toEqual({ latitude: 16.836709, longitude: 74.5966 });
    expect(await fieldChangesOf(leadId)).toHaveLength(SITE_FACTS + 1);
  });
});
