import { useProposalLinksScreen } from '@heliogrid/data/react';
import {
  newLinkWords,
  proposalActFailureWords,
  proposalLinksPageWords,
  proposalLinksWords,
  proposalPageHeadWords,
  proposalScreenSaid,
} from '@heliogrid/i18n';
import { IconButton, NewLinkSheet, ProposalLinks, ShellGlyph } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { OneToast } from '../shared/OneToast';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';
import { ShellPage } from '../shell/components/ShellPage';
import { styles } from './styles';

/** A deal's named links open at `heliogrid://proposals/<id>/links`. */
type Props = StaticScreenProps<{ proposalId: string }>;

/**
 * A deal's named links on the phone (`SCR-M06-20`, `F5-30`): the rep came to see who opened which
 * link, to give another person their own, or to turn one off — which stops at once, so it asks
 * first. The customer's page shows none of this. What is read and sent is
 * `useProposalLinksScreen`'s, the web's too; the phone's own part is the share sheet an address is
 * handed to (it holds Copy).
 */
export function ProposalLinksScreen({ route }: Props) {
  const { proposalId } = route.params;
  const { t, formats } = useProposalFormats();
  const moves = useProposalMoves();
  const screen = useProposalLinksScreen(proposalId, { copy: moves.copy });
  const page = useRef<View>(null);
  const head = proposalPageHeadWords(t, formats);
  const words = proposalLinksPageWords(t);
  const { newLink, failure } = screen;
  return (
    <ShellPage
      inView="proposals"
      drillDown={{
        title: head.links,
        summary: words.summary,
        back: head.backToProposal,
        onBack: () => moves.back(proposalId),
        stripless: true,
        searchless: true,
        actions: screen.mayMint ? (
          <IconButton label={words.newLink} variant="dark" onClick={newLink.openSheet}>
            <ShellGlyph name="plus" size="sm" tone="inverse" />
          </IconButton>
        ) : undefined,
      }}
    >
      <View ref={page} style={styles.page}>
        <ProposalLinks
          read={screen.read}
          words={proposalLinksWords(t, formats)}
          pending={screen.pending}
          failure={
            failure === null
              ? null
              : {
                  linkId: failure.linkId,
                  reason:
                    proposalActFailureWords(t, failure.failure) ?? proposalScreenSaid(t).notCopied,
                }
          }
          confirming={screen.confirming}
          onCopy={screen.copy}
          onRemint={screen.remint}
          onAskRevoke={screen.askRevoke}
          onRevoke={screen.revoke}
          onCancelRevoke={screen.cancelRevoke}
          focusAfter={page}
        />
      </View>
      <NewLinkSheet
        open={newLink.open}
        onClose={newLink.close}
        words={newLinkWords(t)}
        contacts={screen.read.kind === 'ready' ? screen.read.value.contacts : []}
        draft={newLink.draft}
        onChange={newLink.change}
        sending={newLink.sending}
        failure={proposalActFailureWords(t, newLink.failure)}
        onMake={newLink.make}
      />
      <OneToast
        fact={screen.said}
        line={(fact) => ({
          tone: fact.act === 'not_copied' ? 'warning' : 'success',
          title: words.said(fact),
        })}
        onDismiss={screen.dismissSaid}
        focusAfter={page}
      />
    </ShellPage>
  );
}
