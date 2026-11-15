import { FOUNDER_ROLE, type UiLanguage } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { ContractException } from '../../src/common/errors/contract-exception';
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
 * The cover picture in Proposal defaults, against REAL state (`T-M01-030`, `M06-07`): the picture
 * every new proposal's cover starts with is one of the platform's or the company's own stored
 * photo; a save that never names it keeps it; and one company can never name another's file.
 */

const here = aCompany('Cover Picture EPC');
const there = aCompany('Other Cover Picture EPC');
const owner = aPerson('Asha Deshmukh');
const stranger = aPerson('Ravi Joshi');
const fixture: Fixture = {
  companies: [here, there],
  people: [owner, stranger],
  memberships: [
    aMembership(here, owner, [FOUNDER_ROLE]),
    aMembership(there, stranger, [FOUNDER_ROLE]),
  ],
};

/** A small image's size in bytes; each case takes its own so no two declare the same file. */
const FIRST_PHOTO_BYTES = 91;
let size = FIRST_PHOTO_BYTES;
const READER: UiLanguage = 'en';
/** The test object store answers its own scheme; a real one answers https. */
const STORE_ADDRESS = /^(memory|https?):\/\/\S+/;

const skip = skipWithoutDatabase(
  'COVER PICTURE PROOF',
  'The cover picture a company’s new proposals start with is UNPROVEN in this run.',
);

describe.skipIf(skip)('the cover picture in Proposal defaults, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let templates: ReturnType<typeof settingsServicesOf>['templates'];
  let files: ReturnType<typeof settingsServicesOf>['files'];
  const by = (person = owner): Act => ({ actorUserId: person.userId, now: Date.now() });
  const saves = () => entriesOf(pools, here.tenantId, 'settings.proposal_template_changed');
  const read = () => templates.proposalTemplate(here.tenantId, READER);

  /** A company's confirmed photo: declared, its bytes stored, confirmed by its uploader. */
  const aStoredPhoto = async (company = here, person = owner) => {
    const bytes = pngOf(size++);
    const { file, upload } = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      by(person),
    );
    files.store.receive(upload?.url ?? '', bytes);
    await files.service.complete(company.tenantId, UPLOADER, file.id, by(person));
    return file.id;
  };

  /** The template as read, with the picture given; the read-only fields left out, as a client sends it. */
  const saveWith = async (
    coverPicture?: Parameters<typeof templates.saveProposalTemplate>[1]['coverPicture'],
  ) => {
    const { changed: _, coverPhotoUrl: __, coverPicture: ___, ...template } = await read();
    return templates.saveProposalTemplate(
      here.tenantId,
      coverPicture === undefined ? template : { ...template, coverPicture },
      by(),
      READER,
    );
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    ({ templates, files } = settingsServicesOf(pools));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a company that never picked one reads the platform’s first picture, and no photo', async () => {
    expect(await read()).toMatchObject({
      coverPicture: { kind: 'platform', key: 'home' },
      coverPhotoUrl: null,
    });
  });

  it('stores a platform picture, and a save that never names one keeps it', async () => {
    const before = (await saves()).length;
    expect((await saveWith({ kind: 'platform', key: 'villa' })).coverPicture).toEqual({
      kind: 'platform',
      key: 'villa',
    });
    expect(await saves()).toHaveLength(before + 1);
    // A client built before the field sends no picture: what is stored stands, and nothing is written.
    expect((await saveWith()).coverPicture).toEqual({ kind: 'platform', key: 'villa' });
    expect((await read()).coverPicture).toEqual({ kind: 'platform', key: 'villa' });
    expect(await saves()).toHaveLength(before + 1);
  });

  it('stores the company’s own photo and answers a short-lived address to show it', async () => {
    const photo = await aStoredPhoto();
    const saved = await saveWith({ kind: 'own', fileId: photo });
    expect(saved.coverPicture).toEqual({ kind: 'own', fileId: photo });
    expect(saved.coverPhotoUrl).toMatch(STORE_ADDRESS);
    expect((await read()).coverPhotoUrl).toMatch(STORE_ADDRESS);
  });

  it('refuses another company’s photo at its field, and keeps the picture it had', async () => {
    const theirs = await aStoredPhoto(there, stranger);
    const kept = (await read()).coverPicture;
    const refused = await saveWith({ kind: 'own', fileId: theirs }).catch((thrown) => thrown);
    expect(refused).toBeInstanceOf(ContractException);
    expect((refused as ContractException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect((refused as ContractException).details?.map((detail) => detail.path)).toEqual([
      'coverPicture.fileId',
    ]);
    expect((await read()).coverPicture).toEqual(kept);
  });
});
