import { rolePresetSchema } from '@heliogrid/contracts';
import { DEFAULT_TIMELINE_PHASES, PROPOSAL_SECTIONS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Device,
  type Fixture,
  type Membership,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bearerFor, bootHttp, type Http } from '../support/http';
import { entriesOf, publishIndiaPack, settingsServicesOf } from './support';

/**
 * The Proposal template page's two records against REAL state (`M01-51`, `M01-52`, `SCR-M01-19`):
 * each read names who saved it last, `null` until a first save; a save equal to what is stored
 * keeps who and when; and only the owner's grant may write either.
 */

const preset = rolePresetSchema.enum;
const here = aCompany('Template Solar');
const owner = aPerson('Rajesh Kulkarni');
const second = aPerson('Sunita Deshmukh');
const sales = aPerson('Isha Pawar');
const ownerHere = aMembership(here, owner, [preset.epc_owner]);
const salesHere = aMembership(here, sales, [preset.sales_executive]);
const devices = new Map([ownerHere, salesHere].map((m) => [m, aDevice(m.held, m.of)]));
const fixture: Fixture = {
  companies: [here],
  people: [owner, second, sales],
  memberships: [ownerHere, aMembership(here, second, [preset.epc_owner]), salesHere],
  devices: [...devices.values()],
};

const template = {
  cover: null,
  sectionsIncluded: PROPOSAL_SECTIONS.filter((section) => section !== 'performance'),
  defaultTerms: {
    en: {
      version: 1 as const,
      blocks: [{ type: 'p' as const, spans: [{ text: 'Valid for 30 days.' }] }],
    },
  },
};
const timeline = { phases: [...DEFAULT_TIMELINE_PHASES].reverse() };

const skip = skipWithoutDatabase(
  'TEMPLATE PROOF',
  'Who saved the proposal and timeline templates is UNPROVEN in this run.',
);

describe.skipIf(skip)('the proposal and timeline templates, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let services: ReturnType<typeof settingsServicesOf>;

  const by = (person = owner): Act => ({ actorUserId: person.userId, now: Date.now() });
  const changes = async () =>
    (await entriesOf(pools, here.tenantId, 'settings.proposal_template_changed')).length +
    (await entriesOf(pools, here.tenantId, 'settings.timeline_template_changed')).length;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    services = settingsServicesOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('reads templates never saved as never changed', async () => {
    expect((await services.templates.proposalTemplate(here.tenantId)).changed).toBeNull();
    expect((await services.templates.timelineTemplate(here.tenantId)).changed).toBeNull();
  });

  it('a save names who changed it and when', async () => {
    const before = Date.now();

    const saved = await services.templates.saveProposalTemplate(here.tenantId, template, by());
    const phases = await services.templates.saveTimelineTemplate(here.tenantId, timeline, by());

    for (const { changed } of [saved, phases]) {
      expect(changed?.by).toEqual({ id: owner.userId, name: owner.name });
      expect(Date.parse(changed?.at ?? '')).toBeGreaterThanOrEqual(before);
    }
    expect((await services.templates.timelineTemplate(here.tenantId)).changed).toEqual(
      phases.changed,
    );
  });

  it('a save that changes nothing keeps who and when', async () => {
    const stored = await services.templates.proposalTemplate(here.tenantId);
    const before = await changes();

    const again = await services.templates.saveProposalTemplate(
      here.tenantId,
      template,
      by(second),
    );
    const phases = await services.templates.saveTimelineTemplate(
      here.tenantId,
      timeline,
      by(second),
    );

    expect(again.changed).toEqual(stored.changed);
    expect(phases.changed?.by?.id).toBe(owner.userId);
    expect(await changes()).toBe(before);
  });

  it('keeps who saved off the read every member makes', async () => {
    const { proposalTemplate, timelineTemplate } = await services.settings.effective(here.tenantId);

    expect(proposalTemplate.value).not.toHaveProperty('changed');
    expect(timelineTemplate.value).not.toHaveProperty('changed');
  });

  describe('over HTTP', () => {
    let http: Http;
    const bearerOf = (membership: Membership) =>
      bearerFor(http, membership, devices.get(membership) as Device);

    beforeAll(async () => {
      http = await bootHttp();
    });

    afterAll(async () => {
      await http.close();
    });

    it('a reader without the grant is refused the template writes', async () => {
      const before = await changes();
      const bearer = await bearerOf(salesHere);

      const proposal = await http.call('PUT', '/settings/proposal-template', template, bearer);
      const phases = await http.call('PUT', '/settings/timeline-template', timeline, bearer);

      expect(proposal.status).toBe(HttpStatus.FORBIDDEN);
      expect(phases.status).toBe(HttpStatus.FORBIDDEN);
      expect(await changes()).toBe(before);
    });

    it('the owner’s read answers who saved it', async () => {
      const reply = await http.call<{ changed: { by: { id: string } } }>(
        'GET',
        '/settings/timeline-template',
        undefined,
        await bearerOf(ownerHere),
      );

      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.changed.by.id).toBe(owner.userId);
    });
  });
});
