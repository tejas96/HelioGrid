import { randomUUID } from 'node:crypto';
import { rolePresetSchema, type SessionProjection } from '@heliogrid/contracts';
import { membershipRole, tenantMembership, trancheTemplate, userAccount } from '@heliogrid/db';
import { PROPOSAL_SECTIONS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { documentDefaultsIn } from '../../src/modules/settings/internal/document-defaults';
import { richTextWire } from '../../src/modules/settings/internal/wire';
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
const elsewhere = aCompany('Platform Terms Solar');
const rival = aPerson('Meera Joshi');
const rivalElsewhere = aMembership(elsewhere, rival, [preset.epc_owner]);
const ownerHere = aMembership(here, owner, [preset.epc_owner]);
const salesHere = aMembership(here, sales, [preset.sales_executive]);
const devices = new Map(
  [ownerHere, salesHere, rivalElsewhere].map((m) => [m, aDevice(m.held, m.of)]),
);
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, second, sales, rival],
  memberships: [
    ownerHere,
    aMembership(here, second, [preset.epc_owner]),
    salesHere,
    rivalElsewhere,
  ],
  devices: [...devices.values()],
};

const template = {
  cover: null,
  sectionsIncluded: PROPOSAL_SECTIONS.filter((section) => section !== 'performance'),
  defaultTerms: {
    version: 1 as const,
    blocks: [{ type: 'p' as const, spans: [{ text: '30 दिनों के लिए मान्य।' }] }],
  },
};
const timeline = {
  phases: [
    { name: 'Handover', description: 'Documents are handed over to you.' },
    { name: 'साइट सर्वे', description: 'हम आपकी छत देखते हैं।' },
  ],
};

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
    // The rival reads in Hindi: what the platform says by default follows them.
    await pools.admin.db
      .update(userAccount)
      .set({ interfaceLanguage: 'hi' })
      .where(eq(userAccount.id, rival.userId));
    await publishIndiaPack(pools);
    services = settingsServicesOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it.each(['en', 'hi', 'mr'] as const)(
    'serves a template never saved in its reader’s words — %s — the platform’s until the company saves',
    async (reader) => {
      const words = await documentDefaultsIn(reader);
      expect(
        (await services.templates.proposalTemplate(here.tenantId, reader)).defaultTerms,
      ).toEqual(words.terms);
      expect((await services.templates.timelineTemplate(here.tenantId, reader)).phases).toEqual(
        words.phases,
      );
    },
  );

  it('a save that sends the platform’s terms back keeps them the platform’s, in every reader’s words', async () => {
    const hindi = await documentDefaultsIn('hi');
    await services.templates.saveProposalTemplate(
      elsewhere.tenantId,
      {
        cover: null,
        sectionsIncluded: [...PROPOSAL_SECTIONS],
        defaultTerms: richTextWire(hindi.terms),
      },
      by(rival),
      'hi',
    );
    for (const reader of ['en', 'mr'] as const) {
      const read = await services.templates.proposalTemplate(elsewhere.tenantId, reader);
      expect(read.defaultTerms).toEqual(richTextWire((await documentDefaultsIn(reader)).terms));
    }
  });

  it('a save that sends the platform’s phases back keeps them the platform’s, in every reader’s words', async () => {
    const hindi = await documentDefaultsIn('hi');
    await services.templates.saveTimelineTemplate(
      elsewhere.tenantId,
      { phases: [...hindi.phases] },
      by(rival),
      'hi',
    );
    for (const reader of ['en', 'mr'] as const) {
      const read = await services.templates.timelineTemplate(elsewhere.tenantId, reader);
      expect(read.phases).toEqual((await documentDefaultsIn(reader)).phases);
    }
  });

  it('reads templates never saved as never changed', async () => {
    expect((await services.templates.proposalTemplate(here.tenantId, 'en')).changed).toBeNull();
    expect((await services.templates.timelineTemplate(here.tenantId, 'en')).changed).toBeNull();
  });

  it('a save names who changed it and when', async () => {
    const before = Date.now();

    const saved = await services.templates.saveProposalTemplate(
      here.tenantId,
      template,
      by(),
      'en',
    );
    const phases = await services.templates.saveTimelineTemplate(
      here.tenantId,
      timeline,
      by(),
      'en',
    );

    for (const { changed } of [saved, phases]) {
      expect(changed?.by).toEqual({ id: owner.userId, name: owner.name });
      expect(Date.parse(changed?.at ?? '')).toBeGreaterThanOrEqual(before);
    }
    expect((await services.templates.timelineTemplate(here.tenantId, 'en')).changed).toEqual(
      phases.changed,
    );
  });

  it('a save that changes nothing keeps who and when', async () => {
    const stored = await services.templates.proposalTemplate(here.tenantId, 'en');
    const before = await changes();

    const again = await services.templates.saveProposalTemplate(
      here.tenantId,
      template,
      by(second),
      'en',
    );
    const phases = await services.templates.saveTimelineTemplate(
      here.tenantId,
      timeline,
      by(second),
      'en',
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

    it('a Hindi reader’s GET answers the platform’s terms and phases in Hindi', async () => {
      const reply = await http.call<{ defaultTerms: unknown; phases?: unknown }>(
        'GET',
        '/settings/proposal-template',
        undefined,
        await bearerOf(rivalElsewhere),
      );
      const phases = await http.call<{ phases: unknown }>(
        'GET',
        '/settings/timeline-template',
        undefined,
        await bearerOf(rivalElsewhere),
      );
      const hindi = await documentDefaultsIn('hi');
      expect(reply.body.defaultTerms).toEqual(richTextWire(hindi.terms));
      expect(phases.body.phases).toEqual(hindi.phases);
    });

    it('a company signed up by a Hindi reader starts with its payment splits in Hindi', async () => {
      const name = `Hindi Signup ${randomUUID()}`;
      const created = await http.call<SessionProjection>(
        'POST',
        '/tenants',
        { companyName: name, ownerName: rival.name, city: 'Pune' },
        await bearerFor(http, rivalElsewhere, devices.get(rivalElsewhere) as Device, 'none'),
      );
      expect(created.status).toBe(HttpStatus.CREATED);
      const tenantId = created.body.membership?.tenantId ?? '';
      const names = await pools.admin.db
        .select({ name: trancheTemplate.name })
        .from(trancheTemplate)
        .where(eq(trancheTemplate.tenantId, tenantId))
        .orderBy(asc(trancheTemplate.createdAt), asc(trancheTemplate.id));
      const hindi = await documentDefaultsIn('hi');
      expect(names.map((row) => row.name)).toEqual(
        hindi.trancheTemplates.map((split) => split.name),
      );
      // The company stays standing, as every signup proof's does; its owner leaves so the
      // fixture's people can go.
      const held = pools.admin.db
        .select({ id: tenantMembership.id })
        .from(tenantMembership)
        .where(eq(tenantMembership.tenantId, tenantId));
      await pools.admin.db.delete(membershipRole).where(inArray(membershipRole.membershipId, held));
      await pools.admin.db.delete(tenantMembership).where(eq(tenantMembership.tenantId, tenantId));
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
