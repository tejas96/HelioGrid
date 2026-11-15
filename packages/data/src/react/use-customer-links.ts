'use client';
import type { CustomerLink, CustomerLinks } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { type CustomerLinkAddress, LinkActRefusedError } from '../customer-link/links-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { type ProposalActFailure, proposalActFailureOf } from './proposal-cache';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** A link's address, the one moment it is on the device: copied, then let go (`F5-75`). */
export interface LinkAddress {
  readonly linkId: string;
  readonly url: string;
}

/** What a named link is for. */
export interface MintAsk {
  readonly label: string;
  readonly contactId: string | null;
}

/**
 * The Deal Link Manager's data (`SCR-M06-20`, `F5-26`, `F5-27`, `F5-30`): the deal's named links,
 * who opened which and when; a new link named for another person; and each live link's three acts
 * — copy its address, give it a new one, turn it off. Turning one off stops it at once and there is
 * no undo (`F5-76`). An address is never in the list: it is answered once, by the act that asks.
 */
export interface CustomerLinksRead {
  readonly read: Exclude<Read<CustomerLinks>, { readonly kind: 'empty' }>;
  mint(ask: MintAsk): void;
  readonly minting: boolean;
  /** Reads a live link's address to copy it. */
  copy(linkId: string): void;
  relabel(linkId: string, label: string): void;
  /** A new address for the same link; `revokeEarlier` turns the old one off in the same act. */
  remint(linkId: string, revokeEarlier: boolean): void;
  /** Resolves `true` once the link is off, `false` when it was not turned off or another act was out. */
  revoke(linkId: string): Promise<boolean>;
  /** An act on this link is out. */
  acting(linkId: string): boolean;
  /** The address the last mint, copy or re-mint answered — for the clipboard; cleared once used. */
  readonly address: LinkAddress | null;
  /** `refused` carries `not_shared` before the first share (`F5-20`), or `already_revoked`. */
  readonly failure: ProposalActFailure | null;
  clear(): void;
}

interface LinkAct {
  readonly linkId: string;
  readonly send: () => Promise<CustomerLink | CustomerLinkAddress>;
}

const isAddress = (out: CustomerLink | CustomerLinkAddress): out is CustomerLinkAddress =>
  'url' in out;

export function useCustomerLinks(leadId: string): CustomerLinksRead {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [address, setAddress] = useState<LinkAddress | null>(null);
  const key = queryKeys.proposals.links(tenantId, leadId);
  const { customerLinks } = repositories;
  const links = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => customerLinks.ofLead(leadId, signal),
    enabled: tenantId !== '' && leadId !== '',
  });
  /* The link as the act answered it replaces its card at once; the list then reads again, since a
     mint adds a card and a re-mint with revoke moves two. */
  const landed = (out: CustomerLink | CustomerLinkAddress) => {
    const link = isAddress(out) ? out.link : out;
    if (isAddress(out)) setAddress({ linkId: link.id, url: out.url });
    queryClient.setQueryData<CustomerLinks>(key, (held) =>
      held === undefined
        ? held
        : { ...held, links: held.links.map((one) => (one.id === link.id ? link : one)) },
    );
    void queryClient.invalidateQueries({ queryKey: key });
  };
  /* One submission keeps its moment, so the same ask sent again carries the same retry key. */
  const held = useRef<{ readonly ask: string; readonly capturedAt: string } | null>(null);
  const mint = useAction(
    ({ label, contactId }: MintAsk) => {
      const ask = JSON.stringify({ label, contactId });
      if (held.current?.ask !== ask) held.current = { ask, capturedAt: new Date().toISOString() };
      return customerLinks.mint(leadId, { label, contactId, capturedAt: held.current.capturedAt });
    },
    {
      onDone: (out) => {
        held.current = null;
        landed(out);
      },
    },
  );
  const act = useAction((one: LinkAct) => one.send(), {
    key: (one) => one.linkId,
    onDone: landed,
  });
  const run = async (linkId: string, send: LinkAct['send']) => {
    mint.clear();
    return (await act.run({ linkId, send })).kind === 'done';
  };
  const now = () => new Date().toISOString();
  const failed = mint.failure ?? act.failure;
  return {
    read: recordReadOf(links),
    mint: (ask) => {
      act.clear();
      void mint.run(ask);
    },
    minting: mint.pending,
    copy: (linkId) => void run(linkId, () => customerLinks.address(linkId, now())),
    relabel: (linkId, label) => void run(linkId, () => customerLinks.relabel(linkId, label)),
    remint: (linkId, revokeEarlier) =>
      void run(linkId, () => customerLinks.remint(linkId, { revokeEarlier, capturedAt: now() })),
    revoke: (linkId) => run(linkId, () => customerLinks.revoke(linkId, now())),
    acting: (linkId) => act.pendingFor(linkId),
    address,
    failure: failed === null ? null : linkFailureOf(failed),
    clear: () => {
      setAddress(null);
      mint.clear();
      act.clear();
    },
  };
}

function linkFailureOf(error: unknown): ProposalActFailure {
  return error instanceof LinkActRefusedError
    ? { kind: 'refused', refusal: error.refusal }
    : proposalActFailureOf(error);
}
