'use client';
import type { CreateTenant } from '@heliogrid/contracts';
import { useCallback, useMemo, useState } from 'react';
import { useDataLayer } from './context';

/**
 * Where the company step's one write stands: `creating` while the three values are being
 * written — facts, not fields, for the moment — and `failed` when the server answered no, with
 * nothing created and the values still in the fields (`SCR-M01-02` error state).
 */
export type CompanyCreation = 'idle' | 'creating' | 'failed';

export interface CompanySignup {
  readonly creation: CompanyCreation;
  /** Creates the company; on success the session moves under it and the screen is done. */
  create(input: CreateTenant): Promise<void>;
}

/** The company step as a screen consumes it (Law 11): the store writes, this reports the wait and the refusal. */
export function useCompanySignup(): CompanySignup {
  const { session } = useDataLayer();
  const [creation, setCreation] = useState<CompanyCreation>('idle');
  const create = useCallback(
    async (input: CreateTenant) => {
      setCreation('creating');
      try {
        await session.createCompany(input);
      } catch {
        setCreation('failed');
      }
    },
    [session],
  );
  return useMemo(() => ({ creation, create }), [creation, create]);
}
