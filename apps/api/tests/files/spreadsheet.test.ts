/*
 * A supplier's price list in the one files table (`T-M01-030` AC-7): stored against the company's
 * catalog by whoever manages it outright, confirmed only when its first bytes are the declared
 * spreadsheet, and refused to Finance, whose catalog grant is to view prices and never to write.
 */
import {
  can,
  FILE_SUBJECT_RULES,
  limitsOn,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sha256Of } from '../../src/modules/file/internal/object-store.memory';
import {
  aCompany,
  aMembership,
  aPerson,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { fileServiceOf, pngOf, UPLOADER } from './support';

/**
 * Who manages the catalog outright, and who holds it only to view prices — read from the matrix
 * rather than named, so a change to the matrix moves these with it.
 */
const MANAGE_CATALOG = FILE_SUBJECT_RULES.catalog.upload;
function aPresetWhere(holds: (role: RolePreset) => boolean): readonly RolePreset[] {
  const role = ROLE_PRESETS.find(holds);
  if (role === undefined) throw new Error('no preset holds the catalog this way');
  return [role];
}
const OUTRIGHT = aPresetWhere(
  (role) => can([role], MANAGE_CATALOG) && limitsOn([role], MANAGE_CATALOG).length === 0,
);
const VIEW_ONLY = aPresetWhere((role) => limitsOn([role], MANAGE_CATALOG).length > 0);

/** Bytes past a spreadsheet's first ones; their value matters to no case here. */
const A_LIST = 400;

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as const;
const CSV = 'text/csv' as const;
type Spreadsheet = typeof XLSX | typeof CSV;

/** A zip's local-file signature then a version byte and a zero, as every `.xlsx` opens. */
const XLSX_HEAD = Buffer.from('504b0304140006000800', 'hex');

function xlsxOf(): Uint8Array {
  const bytes = new Uint8Array(A_LIST);
  bytes.set(XLSX_HEAD);
  return bytes;
}

function csvOf(): Uint8Array {
  return new TextEncoder().encode('Brand,Model,Rate\nWaaree,WS-545,"13,200"\n');
}

const skip = skipWithoutDatabase(
  'SPREADSHEET FILE PROOF',
  'Storing a price list is UNPROVEN in this run.',
);

describe.skipIf(skip)('a price list in the one files table', () => {
  const company = aCompany('Spreadsheet Solar');
  const owner = aPerson('Owner');
  const manager = aPerson('Manager');
  const viewer = aPerson('Viewer');
  const fixture = {
    companies: [company],
    people: [owner, manager, viewer],
    memberships: [
      aMembership(company, owner, UPLOADER),
      aMembership(company, manager, OUTRIGHT),
      aMembership(company, viewer, VIEW_ONLY),
    ],
  };
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const act = () => ({ actorUserId: owner.userId, now: Date.now() });

  const declarationOf = (contentType: Spreadsheet, bytes: Uint8Array) => ({
    subjectKind: 'catalog' as const,
    subjectRef: company.tenantId,
    contentType,
    byteSize: bytes.length,
    checksumSha256: sha256Of(bytes),
  });

  /** Declares, uploads and confirms these bytes as this type; the confirm's outcome is returned. */
  const store = async (contentType: Spreadsheet, bytes: Uint8Array) => {
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(contentType, bytes),
      {},
      act(),
    );
    files.store.receive(declared.upload?.url ?? '', bytes);
    return files.service.complete(company.tenantId, UPLOADER, declared.file.id, act());
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it.each([
    ['an .xlsx', XLSX, xlsxOf],
    ['a CSV', CSV, csvOf],
  ] as const)('%s is stored and confirmed', async (_, contentType, bytesOf) => {
    const stored = await store(contentType, bytesOf());
    expect(stored.contentType).toBe(contentType);
    expect(stored.uploadedAt).not.toBeNull();
  });

  it.each([
    ['a photograph declared as .xlsx', XLSX, () => pngOf(A_LIST)],
    ['a CSV declared as .xlsx', XLSX, csvOf],
    ['an .xlsx declared as CSV', CSV, xlsxOf],
  ] as const)('%s is refused at the confirm', async (_, contentType, bytesOf) => {
    await expect(store(contentType, bytesOf())).rejects.toMatchObject({
      code: 'FILE_CONTENT_MISMATCH',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it.each([
    ['who manages the catalog outright', 'allowed', OUTRIGHT, () => manager],
    ['who only views its prices', 'refused', VIEW_ONLY, () => viewer],
  ] as const)('a price list declared by %s is %s', async (_, verdict, roles, personOf) => {
    const person = personOf();
    const declared = files.service.declare(
      company.tenantId,
      roles,
      declarationOf(CSV, csvOf()),
      {},
      { actorUserId: person.userId, now: Date.now() },
    );
    if (verdict === 'allowed') await expect(declared).resolves.toBeDefined();
    else await expect(declared).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it('a photograph is not a price list', async () => {
    const declaration = { ...declarationOf(CSV, csvOf()), contentType: 'image/png' as const };
    await expect(
      files.service.declare(company.tenantId, UPLOADER, declaration, {}, act()),
    ).rejects.toMatchObject({ status: HttpStatus.UNPROCESSABLE_ENTITY });
  });
});
