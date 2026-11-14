'use client';
import type { BankDetails } from '@heliogrid/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { useProposalCache } from './proposal-cache';
import { bankWriteOf } from './use-bank-typed';
import { useTenantId } from './use-tenant-id';

const NONE: BankDetails = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  bankRoutingIdentifier: '',
};

/**
 * Step 11's fields for a holder of the settings right (`M06-17`): the company's bank account,
 * written to the business profile — the one write-point — so every later proposal reads it. A fact
 * commits when its field is left; the proposal is read again, so its own page shows the account.
 */
export interface BuilderBank {
  readonly details: BankDetails;
  onDetail(field: keyof BankDetails, value: string): void;
  readonly saving: boolean;
  readonly failed: boolean;
}

/** `enabled` false reads nothing: anyone else sees who can add the account, never the fields. */
export function useBuilderBank(proposalId: string, enabled: boolean): BuilderBank | null {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const cache = useProposalCache();
  const profileRead = {
    queryKey: queryKeys.settings.businessProfile(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.settings.businessProfile(signal),
  } as const;
  const profile = useQuery({ ...profileRead, enabled: enabled && tenantId !== '' });
  const [typed, setTyped] = useState<Partial<BankDetails>>({});
  /* The details as last left, read when a write lands: a fact left while a write is out is sent
     after it, never dropped by the action's one lock. */
  const wanted = useRef<BankDetails | null>(null);
  const save = useAction(async () => {
    let sent: BankDetails | null = null;
    while (wanted.current !== null && wanted.current !== sent) {
      sent = wanted.current;
      const read = await queryClient.fetchQuery(profileRead);
      const saved = await repositories.settings.saveBusinessProfile({
        ...read,
        ...bankWriteOf(sent),
      });
      queryClient.setQueryData(profileRead.queryKey, saved);
    }
    await cache.reread(proposalId);
  });
  if (!enabled || profile.data === undefined) return null;
  const stored = { ...NONE, ...profile.data.bankDetailsTyped, ...profile.data.bankDetails };
  const held: BankDetails = {
    bankName: typed.bankName ?? stored.bankName ?? '',
    accountName: typed.accountName ?? stored.accountName ?? '',
    accountNumber: typed.accountNumber ?? stored.accountNumber ?? '',
    bankRoutingIdentifier: typed.bankRoutingIdentifier ?? stored.bankRoutingIdentifier ?? '',
  };
  return {
    details: held,
    onDetail: (field, value) => {
      wanted.current = { ...(wanted.current ?? held), [field]: value };
      setTyped((before) => ({ ...before, [field]: value }));
      void save.run(undefined);
    },
    saving: save.pending,
    failed: save.failure !== null,
  };
}
