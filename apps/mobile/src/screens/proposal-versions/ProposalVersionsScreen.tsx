import { useProposalVersionsScreen } from '@heliogrid/data/react';
import {
  proposalActFailureWords,
  proposalPageHeadWords,
  proposalScreenSaid,
  proposalVersionsWords,
  putInForceWords,
} from '@heliogrid/i18n';
import { ProposalVersions, PutInForceSheet } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { OneToast } from '../shared/OneToast';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';
import { ShellPage } from '../shell/components/ShellPage';
import { styles } from './styles';

/** A proposal's versions open at `heliogrid://proposals/<id>/versions`. */
type Props = StaticScreenProps<{ proposalId: string }>;

/**
 * A proposal's versions on the phone (`SCR-M06-16`, `M06-42`): the rep or the owner came to see
 * what moved between versions and why — the customer's own reason first — and, after Won, to put a
 * newer accepted version in force. What is read and sent is `useProposalVersionsScreen`'s, the
 * web's too; the phone's part is the navigator.
 */
export function ProposalVersionsScreen({ route }: Props) {
  const { proposalId } = route.params;
  const { t, formats } = useProposalFormats();
  const moves = useProposalMoves();
  const screen = useProposalVersionsScreen(proposalId, {
    toDocument: moves.toDocument,
    toShare: moves.toShare,
  });
  const page = useRef<View>(null);
  const head = proposalPageHeadWords(t, formats);
  const { inForce, proposal } = screen;
  const customer = proposal.kind === 'ready' ? proposal.value.document.deal.clientName : null;
  const asked =
    inForce.version === null || inForce.preview === null
      ? null
      : { version: inForce.version, preview: inForce.preview };
  return (
    <ShellPage
      inView="proposals"
      drillDown={{
        title: head.versions,
        summary: head.versionsSummary({
          number: proposal.kind === 'ready' ? proposal.value.document.number : null,
          customerName: customer,
        }),
        back: head.backToProposal,
        onBack: () => moves.back(proposalId),
        stripless: true,
        searchless: true,
      }}
    >
      <View ref={page} style={styles.page}>
        <ProposalVersions
          read={screen.read}
          words={proposalVersionsWords(t, formats)}
          won={screen.won}
          mayShare={screen.mayShare}
          mayPutInForce={screen.mayPutInForce}
          onShare={screen.share}
          onView={screen.view}
          onPutInForce={inForce.open}
          focusAfter={page}
        />
      </View>
      {asked === null ? null : (
        <PutInForceSheet
          open
          onClose={inForce.close}
          words={putInForceWords(t, formats, {
            version: asked.version,
            customerName: customer,
            segment: proposal.kind === 'ready' ? proposal.value.document.deal.segment : null,
          })}
          preview={asked.preview}
          sending={inForce.sending}
          failure={proposalActFailureWords(t, inForce.failure)}
          onConfirm={inForce.confirm}
        />
      )}
      <OneToast
        fact={inForce.done === null ? null : { version: inForce.done }}
        line={(done) => ({ tone: 'success', title: proposalScreenSaid(t).inForce(done.version) })}
        onDismiss={inForce.dismissDone}
        focusAfter={page}
      />
    </ShellPage>
  );
}
