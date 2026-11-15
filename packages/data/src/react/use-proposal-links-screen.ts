'use client';
import type { CustomerLinks } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import type { ProposalActFailure } from './proposal-cache';
import { useCustomerLinks } from './use-customer-links';
import { type ProposalRead, useProposal } from './use-proposal';

/** What the device does for the links screen: the clipboard. */
export interface ProposalLinksMoves {
  /** `notCopied` runs when the device refuses the clipboard. */
  copy(text: string, copied: () => void, notCopied: () => void): void;
}

/** A link's act, as the screen names it. */
export type LinkActName = 'copy' | 'remint' | 'revoke' | 'mint';

/** What the last act left to say, with the link's label: a toast, said once. */
export interface LinksSaid {
  /** The act that answered, or `not_copied` where the device refused the clipboard. */
  readonly act: LinkActName | 'not_copied';
  readonly label: string;
}

export interface NewLinkAsk {
  readonly contactId: string | null;
  readonly label: string;
}

export interface ProposalLinksScreen {
  readonly proposal: ProposalRead;
  readonly read: Exclude<Read<CustomerLinks>, { readonly kind: 'empty' }>;
  /** The reader may make a link — *New link* is drawn only then. */
  readonly mayMint: boolean;
  readonly pending: { readonly linkId: string; readonly act: 'copy' | 'remint' | 'revoke' } | null;
  readonly failure: { readonly linkId: string; readonly failure: ProposalActFailure } | null;
  /** The link whose Turn off is being asked about. */
  readonly confirming: string | null;
  copy(linkId: string): void;
  remint(linkId: string): void;
  askRevoke(linkId: string): void;
  revoke(linkId: string): void;
  cancelRevoke(): void;
  readonly newLink: {
    readonly open: boolean;
    readonly draft: NewLinkAsk;
    openSheet(): void;
    close(): void;
    change(draft: NewLinkAsk): void;
    make(draft: NewLinkAsk): void;
    readonly sending: boolean;
    readonly failure: ProposalActFailure | null;
  };
  readonly said: LinksSaid | null;
  dismissSaid(): void;
}

const NO_DRAFT: NewLinkAsk = { contactId: null, label: '' };

/**
 * A deal's named links (`SCR-M06-20`, `F5-30`): one per person, with who opened which. Copy and a
 * new address put the address on the clipboard; Turn off asks once and then stops the link at once.
 */
export function useProposalLinksScreen(
  proposalId: string,
  moves: ProposalLinksMoves,
): ProposalLinksScreen {
  const proposal = useProposal(proposalId);
  const detail = proposal.kind === 'ready' ? proposal.value : null;
  const links = useCustomerLinks(detail?.lead.id ?? '');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [acted, setActed] = useState<{ linkId: string; act: LinkActName } | null>(null);
  const [said, setSaid] = useState<LinksSaid | null>(null);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<NewLinkAsk>(NO_DRAFT);
  const latestMoves = useRef(moves);
  latestMoves.current = moves;
  const rows = links.read.kind === 'ready' ? links.read.value.links : [];
  const labelOf = (linkId: string) => rows.find((link) => link.id === linkId)?.label ?? '';
  const labels = useRef(labelOf);
  labels.current = labelOf;

  /* An address answered: it goes to the clipboard, and the screen says which link it was. */
  const { address } = links;
  const last = useRef(acted);
  last.current = acted;
  const clear = useRef(links.clear);
  clear.current = links.clear;
  useEffect(() => {
    if (address === null) return;
    const act = last.current?.act ?? 'copy';
    const label = labels.current(address.linkId);
    latestMoves.current.copy(
      address.url,
      () => setSaid({ act, label }),
      () => setSaid({ act: 'not_copied', label }),
    );
    clear.current();
    setActed(null);
    if (act === 'mint') {
      setSheet(false);
      setDraft(NO_DRAFT);
    }
  }, [address]);

  const run = (linkId: string, act: 'copy' | 'remint' | 'revoke', send: () => unknown) => {
    links.clear();
    setActed({ linkId, act });
    send();
  };
  const out = acted !== null && acted.act !== 'mint' && links.acting(acted.linkId);
  return {
    proposal,
    read: links.read,
    mayMint: detail?.rights.mintsLinks === true,
    pending:
      out && acted !== null && acted.act !== 'mint'
        ? { linkId: acted.linkId, act: acted.act }
        : null,
    failure:
      links.failure !== null && acted !== null && acted.act !== 'mint'
        ? { linkId: acted.linkId, failure: links.failure }
        : null,
    confirming,
    copy: (linkId) => run(linkId, 'copy', () => links.copy(linkId)),
    remint: (linkId) => run(linkId, 'remint', () => links.remint(linkId, false)),
    askRevoke: setConfirming,
    revoke: (linkId) => {
      const label = labelOf(linkId);
      setConfirming(null);
      /* Said only once the server turned the link off: a refusal shows at the link instead. */
      run(linkId, 'revoke', async () => {
        if (await links.revoke(linkId)) setSaid({ act: 'revoke', label });
      });
    },
    cancelRevoke: () => setConfirming(null),
    newLink: {
      open: sheet,
      draft,
      openSheet: () => {
        links.clear();
        setSheet(true);
      },
      close: () => {
        if (links.minting) return;
        setSheet(false);
      },
      change: setDraft,
      make: (ask) => {
        setActed({ linkId: '', act: 'mint' });
        links.mint(ask);
      },
      sending: links.minting,
      failure: acted?.act === 'mint' ? links.failure : null,
    },
    said,
    dismissSaid: () => setSaid(null),
  };
}
