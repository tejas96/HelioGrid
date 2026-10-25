import { rolePresetSchema } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { declarationOf, pngOf, UPLOADER } from '../files/support';
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
 * The Branding page's save against REAL state (`M01-50`, `D237`, `SCR-M01-18`): the colour, the
 * letterhead and the logo commit as one; the logo is the profile's one stored value, so either
 * door reads what the other wrote; the read names who saved last; a save equal to what is stored
 * writes nothing; the later of two saves is in force; and only the owner's grant may write it.
 */

const preset = rolePresetSchema.enum;
const here = aCompany('Branding Solar');
const elsewhere = aCompany('Other Branding Solar');
const owner = aPerson('Meera Kulkarni');
const second = aPerson('Anil Gokhale');
const sales = aPerson('Isha Pawar');
const neighbour = aPerson('Ravi Joshi');
const ownerHere = aMembership(here, owner, [preset.epc_owner]);
const salesHere = aMembership(here, sales, [preset.sales_executive]);
const memberships = [
  ownerHere,
  aMembership(here, second, [preset.epc_owner]),
  salesHere,
  aMembership(elsewhere, neighbour, [preset.epc_owner]),
];
const devices = new Map([ownerHere, salesHere].map((m) => [m, aDevice(m.held, m.of)]));
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, second, sales, neighbour],
  memberships,
  devices: [...devices.values()],
};

/** A small image's size in bytes; each case takes its own so no two declare the same file. */
let sizes = 96;

const skip = skipWithoutDatabase(
  'BRANDING PROOF',
  'The Branding page’s one save — the logo beside the colour — is UNPROVEN in this run.',
);

describe.skipIf(skip)('the branding save, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let services: ReturnType<typeof settingsServicesOf>;
  const by = (person = owner): Act => ({ actorUserId: person.userId, now: Date.now() });
  const changes = () => entriesOf(pools, here.tenantId, 'settings.branding_changed');

  /** A company's confirmed image: declared, its bytes stored, confirmed by its uploader. */
  const aStoredLogo = async (company = here, person = owner) => {
    const bytes = pngOf(sizes++);
    const { file, upload } = await services.files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      by(person),
    );
    services.files.store.receive(upload?.url ?? '', bytes);
    await services.files.service.complete(company.tenantId, UPLOADER, file.id, by(person));
    return file.id;
  };

  const saveBranding = (body: Parameters<typeof services.branding.save>[1], person = owner) =>
    services.branding.save(here.tenantId, body, by(person));

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

  it('reads a company that never saved branding as never changed, with no logo', async () => {
    expect(await services.branding.read(here.tenantId)).toMatchObject({
      brandColour: null,
      logoFileId: null,
      changed: null,
    });
  });

  it('a logo saved on branding is the profile’s logo, and the reverse', async () => {
    const onBranding = await aStoredLogo();
    await saveBranding({ brandColour: '#0D7A4F', letterhead: null, logoFileId: onBranding });
    expect((await services.settings.businessProfile(here.tenantId)).logoFileId).toBe(onBranding);

    const onProfile = await aStoredLogo();
    const profile = await services.settings.businessProfile(here.tenantId);
    await services.settings.saveBusinessProfile(
      here.tenantId,
      { ...profile, logoFileId: onProfile },
      by(),
    );
    expect((await services.branding.read(here.tenantId)).logoFileId).toBe(onProfile);
  });

  it('a logo of another company is refused on its field', async () => {
    const own = (await services.branding.read(here.tenantId)).logoFileId;
    const before = (await changes()).length;

    const refusal = await saveBranding({
      brandColour: '#B3401F',
      letterhead: null,
      logoFileId: await aStoredLogo(elsewhere, neighbour),
    }).catch((thrown) => thrown);

    expect(refusal).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: [{ path: 'logoFileId', issue: 'not a stored logo of this company' }],
    });
    expect(refusal.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(await services.branding.read(here.tenantId)).toMatchObject({
      brandColour: '#0D7A4F',
      logoFileId: own,
    });
    expect(await changes()).toHaveLength(before);
  });

  it('a save names who changed it and when', async () => {
    const before = Date.now();
    await saveBranding({ brandColour: '#26968F', letterhead: null });

    const { changed } = await services.branding.read(here.tenantId);

    expect(changed?.by).toEqual({ id: owner.userId, name: owner.name });
    expect(Date.parse(changed?.at ?? '')).toBeGreaterThanOrEqual(before);
  });

  it('a save that changes nothing writes nothing', async () => {
    const stored = await services.branding.read(here.tenantId);
    const before = (await changes()).length;

    const again = await saveBranding(
      { brandColour: stored.brandColour, letterhead: stored.letterhead },
      second,
    );

    expect(again.changed).toEqual(stored.changed);
    expect(await changes()).toHaveLength(before);
  });

  it('a save of the logo alone is recorded', async () => {
    const stored = await services.branding.read(here.tenantId);
    const before = (await changes()).length;

    const saved = await saveBranding(
      { brandColour: stored.brandColour, letterhead: stored.letterhead, logoFileId: null },
      second,
    );

    expect(saved).toMatchObject({ logoFileId: null, changed: { by: { id: second.userId } } });
    expect(await changes()).toHaveLength(before + 1);
  });

  it('the later of two owners’ saves is the one in force', async () => {
    await saveBranding({ brandColour: '#0D7A4F', letterhead: null }, owner);
    await saveBranding({ brandColour: '#B3401F', letterhead: null }, second);

    expect(await services.branding.read(here.tenantId)).toMatchObject({
      brandColour: '#B3401F',
      changed: { by: { id: second.userId, name: second.name } },
    });
  });

  it('keeps who saved and the logo off the read every member makes', async () => {
    const { branding } = await services.settings.effective(here.tenantId);
    expect(branding.value).not.toHaveProperty('changed');
    expect(branding.value).not.toHaveProperty('logoFileId');
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

    it('a reader without the grant is refused the branding write', async () => {
      const before = (await changes()).length;

      const reply = await http.call(
        'PUT',
        '/settings/branding',
        { brandColour: '#F2C200', letterhead: null },
        await bearerOf(salesHere),
      );

      expect(reply.status).toBe(HttpStatus.FORBIDDEN);
      expect(await changes()).toHaveLength(before);
    });

    it('the owner’s write answers the page’s read', async () => {
      const reply = await http.call<{ brandColour: string; changed: { by: { id: string } } }>(
        'PUT',
        '/settings/branding',
        { brandColour: '#F2C200', letterhead: null },
        await bearerOf(ownerHere),
      );

      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body).toMatchObject({
        brandColour: '#F2C200',
        changed: { by: { id: owner.userId } },
      });
    });
  });
});
