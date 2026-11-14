// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '../../src/cache/keys';
import { useVersionInForce } from '../../src/react/use-proposal-hand-off';
import { useTenantId } from '../../src/react/use-tenant-id';
import { PROJECT_ID } from './projects-fixtures';
import { mountedOver, origin } from './projects-origin';

/**
 * *Put in force* (`M06-56`) through the real client: the project answers, and what follows the
 * version in force — the project's money and the owner home — is read again.
 */
describe('Put in force — what it moves is read again', () => {
  it('lands on the project, and the owner home is asked again', async () => {
    let homeReads = 0;
    const view = mountedOver(() => {
      const tenantId = useTenantId();
      useQuery({
        queryKey: queryKeys.dashboards.owner(tenantId),
        queryFn: () => ++homeReads,
        enabled: tenantId !== '',
      });
      return { force: useVersionInForce(PROJECT_ID, 2), tenantId };
    }, {});
    await waitFor(() => expect(homeReads).toBe(1));

    act(() => view.result.current.force.put());
    await waitFor(() => expect(view.result.current.force.inForce).toBe(2));

    expect(origin.writes.at(-1)).toMatchObject({
      path: `/projects/${PROJECT_ID}/version-in-force`,
      body: { version: 2 },
    });
    await waitFor(() => expect(homeReads).toBe(2));
  });
});
