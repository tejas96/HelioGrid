'use client';
import { type DemoDoor, mapRead, type Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { failedBefore, readFailureOf, readOf } from './read';
import { useSession } from './use-session';

/** *You're ready*, as both screens consume it (Law 11). */
export interface SetupReady {
  /** The company's name, read back; its failure is the wall, held up while *Try again* is out. */
  readonly company: Read<string>;
  /**
   * The demo door. `unavailable` until the demo lead can be read (`T-M01-029` adds the read with
   * M02's lead), when this becomes that read's state.
   */
  readonly demo: DemoDoor;
  /** The company is being read again after *Try again*. */
  readonly retrying: boolean;
  /** Door one's answer is being recorded. */
  readonly leaving: boolean;
  /**
   * Door one: closes setup for good (`ready` completed). Settles once the step is recorded, or put
   * off for the session when it could not be — the person still goes on. A second press while the
   * first is out sends nothing.
   */
  startWithLead(): Promise<void>;
}

/**
 * `SCR-M01-06`'s reads and its one write (`M01-26`). The company is read under the shell's key, so
 * the home that follows reuses the answer; the recorded progress replaces the one `useLanding`
 * holds, which is what takes the screen away.
 */
export function useSetupReady(): SetupReady {
  const { user, putOffSetup } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const company = useQuery({
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }) => repositories.tenant.me(signal),
    enabled: tenantId !== '',
    // Offline, a held read would stay pending and the screen blank; it fails to the wall instead.
    networkMode: 'always',
  });
  const retried = useAction(async () => {
    await company.refetch();
  });
  /* A read with no answer yet goes back to pending while it is asked again, so once it has failed
     the wall is held up, its *Try again* working, until a read answers — never a blank screen. */
  const read: Read<string> = failedBefore(company)
    ? {
        kind: 'failed',
        failure: readFailureOf(company.error),
        retry: () => void retried.run(undefined),
      }
    : mapRead(readOf(company), (tenant) => tenant.companyName);
  const left = useAction(async () => {
    try {
      const progress = await repositories.onboarding.recordStep('ready', 'completed');
      queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
    } catch {
      putOffSetup('ready');
    }
  });
  return {
    company: read,
    demo: 'unavailable',
    retrying: retried.pending,
    leaving: left.pending,
    startWithLead: async () => {
      await left.run(undefined);
    },
  };
}
