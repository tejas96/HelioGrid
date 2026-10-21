'use client';
import type { DemoDoor } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** The company *You're ready* names: still being read, not answered, or its name. */
export type SetupReadyCompany =
  | { readonly status: 'pending' | 'failed' }
  | { readonly status: 'ready'; readonly name: string };

/** *You're ready*, as both screens consume it (Law 11). */
export interface SetupReady {
  readonly company: SetupReadyCompany;
  /**
   * The demo door. `unavailable` until the demo lead can be read (`T-M01-029` adds the read with
   * M02's lead), when this becomes that read's state.
   */
  readonly demo: DemoDoor;
  /** The company is being read again after *Try again*. */
  readonly retrying: boolean;
  /** *Try again* on the wall: reads the company again. */
  tryAgain(): void;
  /** Door one's answer is being recorded. */
  readonly leaving: boolean;
  /**
   * Door one: closes setup for good (`ready` completed). Settles once the step is recorded, or put
   * off for the session when it could not be — the person still goes on. A second press while the
   * first is out waits on it, so one request goes.
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
  /* A read with no answer yet goes back to pending while it is asked again, so once it has failed
     the wall is held up, its *Try again* working, until a read answers — never a blank screen. */
  const failedBefore = company.data === undefined && company.errorUpdateCount > 0;
  const retrying = failedBefore && company.isFetching;
  const [leaving, setLeaving] = useState(false);
  const out = useRef<Promise<void> | null>(null);
  const startWithLead = (): Promise<void> => {
    if (out.current !== null) return out.current;
    const answering = (async () => {
      setLeaving(true);
      try {
        const progress = await repositories.onboarding.recordStep('ready', 'completed');
        queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
      } catch {
        putOffSetup('ready');
      } finally {
        out.current = null;
        setLeaving(false);
      }
    })();
    out.current = answering;
    return answering;
  };
  return {
    company: companyOf(company.data?.companyName, failedBefore),
    demo: 'unavailable',
    retrying,
    tryAgain: () => void company.refetch(),
    leaving,
    startWithLead,
  };
}

function companyOf(name: string | undefined, failed: boolean): SetupReadyCompany {
  if (name !== undefined) return { status: 'ready', name };
  return { status: failed ? 'failed' : 'pending' };
}
