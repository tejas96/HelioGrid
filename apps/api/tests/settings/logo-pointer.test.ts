import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { sha256Of } from '../../src/modules/file/internal/object-store.memory';
import { declarationOf, pngOf, UPLOADER } from '../files/support';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { entriesOf, publishIndiaPack, settingsServicesOf } from './support';

/**
 * The company's logo on its profile, against REAL state (`M01-31`): the profile points at one
 * stored file, every document reads that pointer, a save that never names it keeps it — and a
 * pointer is taken only when it is this company's own confirmed image.
 */

const here = aCompany('Logo Solar');
const elsewhere = aCompany('Other Logo Solar');
const owner = aPerson('Asha Deshmukh');
const neighbour = aPerson('Ravi Joshi');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, neighbour],
  memberships: [
    aMembership(here, owner, [FOUNDER_ROLE]),
    aMembership(elsewhere, neighbour, [FOUNDER_ROLE]),
  ],
};

/** A small image's size in bytes; each case takes its own so no two declare the same file. */
const A_LOGO = 64;

const skip = skipWithoutDatabase(
  'LOGO POINTER PROOF',
  'Whose file a company may name as its logo is UNPROVEN in this run.',
);

describe.skipIf(skip)('the logo’s pointer on the profile, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let settings: ReturnType<typeof settingsServicesOf>['settings'];
  let files: ReturnType<typeof settingsServicesOf>['files'];
  let sizes = A_LOGO;
  const by = (person = owner): Act => ({ actorUserId: person.userId, now: Date.now() });
  const saves = () => entriesOf(pools, here.tenantId, 'settings.business_profile_changed');

  /** Declares an image for a company and returns its id and where its bytes go; nothing is stored yet. */
  const declared = async (company = here, person = owner) => {
    const bytes = pngOf(sizes++);
    const { file, upload } = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      by(person),
    );
    return { id: file.id, url: upload?.url ?? '', bytes };
  };

  /** A company's confirmed image: declared, its bytes stored, confirmed by its uploader. */
  const aStoredLogo = async (company = here, person = owner) => {
    const { id, url, bytes } = await declared(company, person);
    files.store.receive(url, bytes);
    await files.service.complete(company.tenantId, UPLOADER, id, by(person));
    return id;
  };

  /** This company's confirmed price list — a stored file, and no logo. */
  const aStoredPriceList = async () => {
    const bytes = new TextEncoder().encode('item,rate\npanel,100\n');
    const { file, upload } = await files.service.declare(
      here.tenantId,
      UPLOADER,
      {
        subjectKind: 'catalog',
        subjectRef: here.tenantId,
        contentType: 'text/csv',
        byteSize: bytes.length,
        checksumSha256: sha256Of(bytes),
      },
      {},
      by(),
    );
    files.store.receive(upload?.url ?? '', bytes);
    await files.service.complete(here.tenantId, UPLOADER, file.id, by());
    return file.id;
  };

  const withLogo = async (logoFileId: string | null) => {
    const read = await settings.businessProfile(here.tenantId);
    return settings.saveBusinessProfile(here.tenantId, { ...read, logoFileId }, by());
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    ({ settings, files } = settingsServicesOf(pools));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('reads no logo on a company that never added one', async () => {
    expect((await settings.businessProfile(here.tenantId)).logoFileId).toBeNull();
  });

  it('stores the company’s own confirmed image, and every document reads it, with one entry', async () => {
    const logo = await aStoredLogo();
    const before = (await saves()).length;

    expect((await withLogo(logo)).logoFileId).toBe(logo);

    expect((await settings.businessProfile(here.tenantId)).logoFileId).toBe(logo);
    const { companyIdentity } = await settings.effective(here.tenantId);
    expect(companyIdentity).toMatchObject({ source: 'tenant', value: { logoFileId: logo } });
    expect(await saves()).toHaveLength(before + 1);
  });

  it('keeps the logo a save never names — a client built before the field — and clears it only when told', async () => {
    const logo = await aStoredLogo();
    await withLogo(logo);
    const { logoFileId: _unread, ...asAnOlderClientRead } = await settings.businessProfile(
      here.tenantId,
    );
    const moved = { ...asAnOlderClientRead, address: '14 Baner Road, Pune' };

    expect(await settings.saveBusinessProfile(here.tenantId, moved, by())).toMatchObject({
      address: '14 Baner Road, Pune',
      logoFileId: logo,
    });

    expect((await withLogo(null)).logoFileId).toBeNull();
    expect((await settings.businessProfile(here.tenantId)).logoFileId).toBeNull();
  });

  it.each([
    ['another company’s confirmed image', () => aStoredLogo(elsewhere, neighbour)],
    ['an image declared and never stored', async () => (await declared()).id],
    ['the company’s own price list', () => aStoredPriceList()],
    ['a file that does not exist', async () => '0199d3a0-7c1e-7b7a-9d7e-4f6a2b8c1d3e'],
  ])('refuses %s at the logo’s field, and writes and records nothing', async (_what, aFile) => {
    const own = await aStoredLogo();
    await withLogo(own);
    const before = (await saves()).length;

    const refusal = await withLogo(await aFile()).catch((thrown) => thrown);

    expect(refusal).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: [{ path: 'logoFileId', issue: 'not a stored logo of this company' }],
    });
    expect(refusal.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect((await settings.businessProfile(here.tenantId)).logoFileId).toBe(own);
    expect(await saves()).toHaveLength(before);
  });

  it('writes and records nothing for a save equal to what is stored', async () => {
    const stored = await withLogo(await aStoredLogo());
    const before = (await saves()).length;

    expect(await settings.saveBusinessProfile(here.tenantId, stored, by())).toEqual(stored);

    expect(await saves()).toHaveLength(before);
  });
});
