import type { ComposedMessage } from '@heliogrid/contracts';
import { DOOR_SEGMENT, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { useNavigation } from '@react-navigation/native';
import { Linking, Platform, Share } from 'react-native';
import { doorRoute } from '../shell/doors';
import { openInside } from './open-inside';
import { openOutside } from './open-outside';

/**
 * The address the builder stands at (`SCR-M06-02`), as the web's `/proposals/<id>/build`. Its route
 * row is the builder slice's (`navigation/routes/app.ts`): a proposal screen opens it by address,
 * through the link table, so the two meet nowhere else.
 */
export const proposalBuildAddress = (proposalId: string): string =>
  `${DOOR_SEGMENT.proposals}/${proposalId}/build`;

/**
 * The phone's own moves off a proposal screen — the platform adapter every proposal view model is
 * handed: the navigator, the customer's chat opened with the words typed, the phone's share sheet
 * (it holds Copy and the person's own apps — React Native's clipboard has left its core) and a
 * stored file in the phone's viewer. The person sends a message themself; nothing here claims a
 * delivery (`M06-53`).
 */
export function useProposalMoves() {
  const navigation = useNavigation();
  /**
   * Hands the text to the share sheet; `handedOn` runs once the person took it somewhere. Android
   * answers "shared" even when the person backs out of the chooser, so there nothing is claimed —
   * no "copied", no "the customer has the link" — and the sheet itself was the feedback. The share
   * stays recorded on the tap (`T-M06-018`).
   */
  const handOn = (text: string, handedOn: () => void, refused: () => void) => {
    void Share.share({ message: text }).then((answer) => {
      if (answer.action === Share.sharedAction && Platform.OS === 'ios') handedOn();
    }, refused);
  };
  const toLead = (leadId: string) => navigation.navigate('LeadDetail', { leadId });
  return {
    back: (proposalId?: string) => {
      if (navigation.canGoBack()) navigation.goBack();
      else if (proposalId === undefined) navigation.navigate(doorRoute.proposals);
      else navigation.navigate('ProposalTrack', { proposalId });
    },
    toList: () => navigation.navigate(doorRoute.proposals),
    toProposal: (proposalId: string) => navigation.navigate('ProposalTrack', { proposalId }),
    /** The track screen with its share sheet open — the document's and the versions' *Share*. */
    toShare: (proposalId: string) =>
      navigation.navigate('ProposalTrack', { proposalId, share: '1' }),
    toBuilder: (proposalId: string) => openInside(proposalBuildAddress(proposalId)),
    toDocument: (proposalId: string, version?: number) =>
      navigation.navigate(
        'ProposalDocument',
        version === undefined ? { proposalId } : { proposalId, v: String(version) },
      ),
    toVersions: (proposalId: string) => navigation.navigate('ProposalVersions', { proposalId }),
    toLinks: (proposalId: string) => navigation.navigate('ProposalLinks', { proposalId }),
    toLead,
    /** The lead's page, whose dialler answers a customer who may not be dialled from here. */
    callLead: toLead,
    /** Hands the number to the device's dialler, as Lead Detail's *Call*. */
    dial: (phoneE164: string) => {
      void Linking.openURL(`tel:${phoneE164}`).catch(() => undefined);
    },
    /** The lead, opened on its *Mark won* sheet — a proposal's *Confirm won* (`M07-62`). */
    toLeadWon: (leadId: string) => navigation.navigate('LeadDetail', { leadId, won: '1' }),
    toProject: (projectId: string) => navigation.navigate('ProjectDetail', { projectId }),
    toTaxNumber: () =>
      navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.company_profile }),
    /**
     * The customer's chat with the words typed. The view model hands over only a message with a
     * chat address: where the market names none, it hands the words to `copy` — the share sheet
     * here — and says what became of them (`chatOrCopy`).
     */
    openChat: (message: Pick<ComposedMessage, 'chatUri'>) => {
      if (message.chatUri !== null) openOutside(message.chatUri);
    },
    copy: handOn,
    openFile: openOutside,
  };
}

export type ProposalMoves = ReturnType<typeof useProposalMoves>;
