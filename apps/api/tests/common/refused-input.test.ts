import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  openCrmWorld,
  retryKey,
} from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';

/**
 * Input no route can store is refused as a field-addressed 400, never a 500: a NUL character,
 * which no Postgres text column holds, in any body or query string; and a page number past the
 * last page any list can have.
 */

const here = aStaffedCompany('Refused Input EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'REFUSED INPUT PROOF',
  'Unstorable input is UNPROVEN on the wire in this run.',
);

const NUL = '\u0000';

describe.skipIf(skip)('input no route can store, over HTTP', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['a top-level field', { name: `Ra${NUL}vi` }, 'name'],
    ['a field at the end', { city: `Pune${NUL}` }, 'city'],
  ])('a NUL in %s of a body is a 400 naming that field', async (_where, typed, path) => {
    const reply = await owner().call('POST', '/leads', aCapture(aPhone(), typed), retryKey());
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path }] },
    });
  });

  it('a NUL in a query string is a 400 naming the query field', async () => {
    const reply = await owner().call('GET', `/leads?q=${encodeURIComponent(`Ra${NUL}vi`)}`);
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'q' }] },
    });
  });

  it.each([
    ['/leads', '10000', HttpStatus.OK],
    ['/leads', '10001', HttpStatus.BAD_REQUEST],
    ['/leads', '9999999999999999999', HttpStatus.BAD_REQUEST],
    ['/leads', '1e19', HttpStatus.BAD_REQUEST],
    ['/lead-inbox', '10000', HttpStatus.OK],
    ['/lead-inbox', '9999999999999999999', HttpStatus.BAD_REQUEST],
  ])('%s?page=%s answers %i', async (path, page, status) => {
    const reply = await owner().call('GET', `${path}?page=${page}`);
    expect(reply.status).toBe(status);
  });
});
