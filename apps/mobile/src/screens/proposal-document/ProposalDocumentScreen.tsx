import { useProposalReaderScreen } from '@heliogrid/data/react';
import {
  proposalDocumentSummary,
  proposalPageHeadWords,
  proposalReaderWords,
  proposalScreenSaid,
  SHELL,
} from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import {
  BrandBloom,
  LargeTitle,
  MobileTopBar,
  ProposalReader,
  readerPageWidth,
  ShellAction,
  ShellGlyph,
} from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OneToast } from '../shared/OneToast';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';
import { useProposalPages } from '../shared/use-proposal-pages';
import { styles } from './styles';

/**
 * A proposal's document opens at `heliogrid://proposals/<id>/document`; `?v=<n>` names a version,
 * else the newest is read.
 */
type Props = StaticScreenProps<{ proposalId: string; v?: string }>;

/** The version a link names, or `null` for the newest; anything that is not a version reads the newest. */
function versionOf(asked: string | undefined): number | null {
  const version = Number(asked);
  return asked !== undefined && Number.isInteger(version) && version > 0 ? version : null;
}

/**
 * A proposal's document on the phone (`SCR-M06-17`, `T-M06-015`): the rep reads exactly what the
 * customer will — the pages the link and the PDF draw — before it goes out, with Share in thumb
 * reach. One job, so it stands alone as search does: the bar with its way back and the document's
 * name, the pages, the page pill, and the dock in the pill's place, above the home indicator. What
 * is read is `useProposalReaderScreen`'s, the web's too; the phone's own parts are the width, the
 * insets and the PDF's viewer.
 */
export function ProposalDocumentScreen({ route }: Props) {
  const { proposalId, v } = route.params;
  const { t, formats } = useProposalFormats();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const moves = useProposalMoves();
  const screen = useProposalReaderScreen(proposalId, versionOf(v), {
    toBuilder: moves.toBuilder,
    toShare: moves.toShare,
    openFile: moves.openFile,
  });
  const page = useRef<View>(null);
  const head = proposalPageHeadWords(t, formats);
  const said = proposalScreenSaid(t);
  const detail = screen.proposal.kind === 'ready' ? screen.proposal.value : null;
  const read = screen.read.kind === 'ready' ? screen.read.value : null;
  const pages = useProposalPages(read);
  const { file } = screen.pdf;
  const customer = detail?.document.deal.clientName ?? null;
  const words = proposalReaderWords(t, customer, detail?.document.deal.segment ?? null);
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <BrandBloom placement="page" />
      <MobileTopBar
        searchLabel={t(SHELL.search)}
        notificationsLabel={t(SHELL.notifications)}
        title={head.documentTitle(detail?.document.number ?? null, screen.version)}
        scrolled={false}
        actions={
          <ShellAction
            round
            label={words.pdf}
            onClick={screen.getPdf}
            icon={<ShellGlyph name="download" size="md" tone="primary" />}
          />
        }
        leading={
          <ShellAction
            round
            label={head.backToProposal}
            onClick={() => moves.back(proposalId)}
            icon={<ShellGlyph name="chevron-left" size="md" tone="primary" />}
          />
        }
      />
      <View style={styles.head}>
        <LargeTitle
          title={head.documentTitle(detail?.document.number ?? null, screen.version)}
          summary={
            read === null
              ? undefined
              : proposalDocumentSummary(t, formats, {
                  customerName: read.deal.clientName,
                  capacityKw: read.fields.system.capacityKw,
                  yearlyKwh: read.generation?.yearlyKwh ?? null,
                })
          }
        />
      </View>
      <View ref={page} style={[styles.reader, { paddingBottom: insets.bottom }]}>
        <ProposalReader
          read={screen.drawn(pages)}
          words={words}
          room="narrow"
          pageWidth={readerPageWidth(window.width - 2 * theme.layout['screen-pad-mobile'], false)}
          pending={screen.pending}
          {...(screen.newVersion === null ? {} : { onNewVersion: screen.newVersion })}
          {...(screen.share === null ? {} : { onShare: screen.share })}
          focusAfter={page}
        />
      </View>
      <OneToast
        fact={file.kind === 'late' || file.kind === 'unread' ? file : null}
        line={(late) => ({
          tone: 'warning',
          title: late.kind === 'late' ? said.pdfLate : said.pdfFailed,
        })}
        onDismiss={screen.pdf.lookAgain}
        focusAfter={page}
      />
    </SafeAreaView>
  );
}
