import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TemporalConnection } from '../../src/common/temporal/temporal.client';
import { TEMPORAL_CLIENT } from '../../src/common/temporal/temporal.tokens';
import { openPools, unseed } from '../support/fixture';
import { bootHttp, type Http, httpHarnessBlocker } from '../support/http';

/**
 * The api boots and serves reads with NO Temporal reachable (owner ruling, `T-FPLAT-064`): the
 * channel opens on the first workflow start, never at boot. The address is set in a hoisted
 * block, which runs BEFORE the imports above are evaluated — the environment is read once and
 * frozen at import, so a plain assignment at the top of the file would come too late. A closed
 * port on the loopback, so a connect attempted at boot fails fast rather than hanging.
 */
vi.hoisted(() => {
  vi.stubEnv('TEMPORAL_ADDRESS', '127.0.0.1:1');
});

const blocker = httpHarnessBlocker();
if (blocker !== null) console.warn(`SKIP LAZY-TEMPORAL BOOT PROOF: ${blocker}.`);

describe.skipIf(blocker !== null)('the api with Temporal unreachable', () => {
  let http: Http;
  let pools: ReturnType<typeof openPools>;

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
  });

  afterAll(async () => {
    await unseed(pools.admin.db, {
      companies: http.createdTenantIds.map((id) => ({ tenantId: id, companyName: '' })),
      people: [],
      memberships: [],
    });
    await http.close();
    await pools.close();
    vi.unstubAllEnvs();
  });

  it('boots, signs in, founds a company and answers a member read — and never opened the channel', async () => {
    const live = await http.call('GET', '/health');
    expect(live.status).toBe(HttpStatus.OK);

    await http.signIn();
    await http.createCompany('Unreachable Temporal EPC');
    const inbox = await http.call<{ items: unknown[]; totalCount: number }>(
      'GET',
      '/notifications',
    );
    expect(inbox.status).toBe(HttpStatus.OK);
    expect(inbox.body).toEqual({ items: [], totalCount: 0 });

    const connection = http.app.get<TemporalConnection>(TEMPORAL_CLIENT);
    expect(connection).toBeInstanceOf(TemporalConnection);
    expect(connection.opened).toBe(false);
  });
});
