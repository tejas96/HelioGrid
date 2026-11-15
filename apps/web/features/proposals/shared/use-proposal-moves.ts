'use client';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { copyText } from '../../../lib/copy-text';
import { openExternal } from '../../../lib/open-external';
import {
  DOOR_PATH,
  leadPath,
  leadWonPath,
  projectPath,
  proposalBuilderPath,
  proposalDocumentPath,
  proposalLinksPath,
  proposalPath,
  proposalVersionsPath,
  settingsRowPath,
} from '../../shell';

/**
 * The web's own moves off a proposal page — the platform adapter every proposal view model is
 * handed: the router, the customer's chat opened in a new tab, the clipboard and a stored file
 * opened in a tab. The person sends a message themself; nothing here claims a delivery (`M06-53`).
 */
export function useProposalMoves() {
  const router = useRouter();
  const copy = copyText;
  return {
    toList: () => router.push(DOOR_PATH.proposals),
    toProposal: (proposalId: string) => router.push(proposalPath(proposalId)),
    toShare: (proposalId: string) => router.push(proposalPath(proposalId, true)),
    toBuilder: (proposalId: string) => router.push(proposalBuilderPath(proposalId)),
    toDocument: (proposalId: string, version?: number) =>
      router.push(proposalDocumentPath(proposalId, version)),
    toVersions: (proposalId: string) => router.push(proposalVersionsPath(proposalId)),
    toLinks: (proposalId: string) => router.push(proposalLinksPath(proposalId)),
    toLead: (leadId: string) => router.push(leadPath(leadId)),
    /** The lead's page, whose dialler answers a customer who may not be dialled from here. */
    callLead: (leadId: string) => router.push(leadPath(leadId)),
    /** Hands the number to the device's dialler — a `tel:` link, as Lead Detail's *Call*. */
    dial: (phoneE164: string) => window.location.assign(`tel:${phoneE164}`),
    toLeadWon: (leadId: string) => router.push(leadWonPath(leadId)),
    toProject: (projectId: string) => router.push(projectPath(projectId)),
    toTaxNumber: () => router.push(settingsRowPath(SETTINGS_SEGMENT.company_profile)),
    /**
     * The chat opens with the words typed. The view model hands over only a message with a chat
     * address: where the market names none, it copies the words itself (`chatOrCopy`).
     */
    openChat: (message: { chatUri: string | null }) => {
      if (message.chatUri !== null) openExternal(message.chatUri);
    },
    copy,
    openFile: openExternal,
    /** The share sheet opened once on arrival: the address then drops its mark. */
    dropShareMark: (proposalId: string) =>
      router.replace(proposalPath(proposalId), { scroll: false }),
  };
}

export type ProposalMoves = ReturnType<typeof useProposalMoves>;
