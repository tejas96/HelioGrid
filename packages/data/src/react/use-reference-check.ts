'use client';
import { type ReferenceStanding, referenceKeyOf, SEARCH_SETTLE_MS } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSettled } from './use-settled';
import { useTenantId } from './use-tenant-id';

export interface ReferenceCheckScreen {
  readonly standing: ReferenceStanding;
  /** The reference as typed; it is asked about once the typing rests. */
  check(reference: string): void;
}

/**
 * Whether a UTR or cheque number is already on a receipt that stands, said while it is typed
 * (`M11-38`) — one UTR typed two ways is one payment (`referenceKeyOf`). The save checks again
 * under its lock; this only spares the person a refused save.
 */
export function useReferenceCheck(): ReferenceCheckScreen {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [typed, setTyped] = useState('');
  const key = referenceKeyOf(typed);
  const asked = useSettled(key, SEARCH_SETTLE_MS);
  const check = useQuery({
    queryKey: queryKeys.projects.referenceCheck(tenantId, asked ?? ''),
    queryFn: ({ signal }) => repositories.payments.referenceCheck(asked ?? '', signal),
    enabled: tenantId !== '' && asked !== null && asked === key,
  });
  const answered = asked !== null && asked === key ? check.data : undefined;
  return {
    standing:
      answered === undefined
        ? { kind: 'unchecked' }
        : answered.receiptNumber === null
          ? { kind: 'new' }
          : { kind: 'used', receiptNumber: answered.receiptNumber },
    check: setTyped,
  };
}
