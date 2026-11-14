import { useProposalTrackScreen } from '@heliogrid/data/react';
import { proposalPageHeadWords, proposalTrackWords } from '@heliogrid/i18n';
import { ProposalTrack, ScaledProposalPage, TRACK_COVER_WIDTH } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';
import { useProposalPages } from '../shared/use-proposal-pages';
import { ShellPage } from '../shell/components/ShellPage';
import { TrackMenu } from './components/TrackMenu';
import { TrackSheets } from './components/TrackSheets';
import { trackMovesOf, useShareOnArrival } from './hooks/use-track-moves';
import { styles } from './styles';

/**
 * A proposal opens at `heliogrid://proposals/<id>` — from the list, a lead, a search result or a
 * notice; `?share=1` opens its share sheet on arrival (the document's and the versions' *Share*).
 */
type Props = StaticScreenProps<{ proposalId: string; share?: string }>;

/**
 * A proposal after it is built, on the phone (`SCR-M06-18`): the rep, one hand, between visits,
 * came to see what happened and do the one next thing — share, call, make a version, confirm the
 * win — and would be let down by a screen that claims a delivery it never saw, or an act to hunt
 * for. What is read and sent is `useProposalTrackScreen`'s, the web's too; the phone's own parts
 * are the navigator, the chat, the share sheet and the PDF's viewer.
 */
export function ProposalTrackScreen({ route }: Props) {
  const { proposalId, share } = route.params;
  const { t, formats } = useProposalFormats();
  const moves = useProposalMoves();
  const screen = useProposalTrackScreen(proposalId, trackMovesOf(moves));
  useShareOnArrival(share, screen);
  /* The page stays while a failed read is tried again: the screen reader lands on it. */
  const page = useRef<View>(null);
  const detail = screen.read.kind === 'ready' ? screen.read.value : null;
  const head = proposalPageHeadWords(t, formats);
  /* Once a version exists the page and the head read it — what the customer was sent — never the
     draft's live figures. */
  const shown = screen.shown.kind === 'ready' ? screen.shown.value : null;
  const pages = useProposalPages(shown);
  return (
    <ShellPage
      inView="proposals"
      drillDown={{
        title: head.name(detail?.document.number ?? null),
        ...(detail === null || shown === null
          ? {}
          : {
              summary: head.summary({
                customerName: detail.document.deal.clientName,
                capacityKw: shown.fields.system.capacityKw,
                payable: shown.money?.payable.amount ?? null,
              }),
            }),
        back: head.backToProposals,
        onBack: () => moves.back(),
        stripless: true,
        searchless: true,
        actions:
          detail === null ? undefined : (
            <TrackMenu detail={detail} withdraw={screen.withdraw} focusAfter={page} />
          ),
      }}
    >
      <View ref={page} style={styles.page}>
        <ProposalTrack
          read={screen.read}
          words={proposalTrackWords(t, formats)}
          cover={
            pages === null ? undefined : (
              <ScaledProposalPage page="cover" {...pages} width={TRACK_COVER_WIDTH.narrow} still />
            )
          }
          shown={pages}
          crewMessageDue={screen.crewMessageDue}
          pending={null}
          failure={null}
          onAct={(act) => screen.acts[act]()}
          onOpenDocument={screen.openDocument}
          onOpenVersions={screen.openVersions}
          onOpenLinks={screen.openLinks}
          onOpenFollowUp={screen.openFollowUp}
          onThank={() => screen.open('thank')}
          onCrewMessage={() => screen.open('crew')}
          focusAfter={page}
        />
      </View>
      <TrackSheets screen={screen} detail={detail} focusAfter={page} />
    </ShellPage>
  );
}
