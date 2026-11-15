import { proposalSheetsOf, sheetKey } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages.native';
import { pageInView } from './ProposalReader.logic';
import type { ProposalReaderDocument, ProposalReaderProps } from './ProposalReader.types';

type Ready = ProposalReaderProps & { readonly document: ProposalReaderDocument };

/** How far above a page's top the reader may be and still count as on it. */
const LOOK_AHEAD = 120;

function Dock({ words, pending, ...props }: Ready) {
  const out = pending !== null;
  return (
    <View style={styles.dock}>
      {props.onNewVersion === undefined ? null : (
        <IconButton label={words.newVersion} disabled={out} onClick={props.onNewVersion}>
          <ShellGlyph name="pencil" size="md" tone="primary" />
        </IconButton>
      )}
      {props.onPdf === undefined ? null : (
        <IconButton label={words.pdf} disabled={out} onClick={props.onPdf}>
          <ShellGlyph name="download" size="md" tone="primary" />
        </IconButton>
      )}
      {props.onShare === undefined ? null : (
        <View style={styles.grow}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ShellGlyph name="send" size="md" tone="inverse" />}
            loading={pending === 'share'}
            disabled={out && pending !== 'share'}
            onClick={props.onShare}
          >
            {words.share}
          </Button>
        </View>
      )}
    </View>
  );
}

/** The proposal document, read on the phone (`SCR-M06-17`): the pages, the page pill, the dock. */
export function ProposalReader(props: ProposalReaderProps) {
  const { read, words } = props;
  const [at, setAt] = useState(0);
  const tops = useRef<number[]>([]);
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'panel']} label={words.opening} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  const ready: Ready = { ...props, document: read.value };
  const { document } = ready;
  const pages = proposalSheetsOf(document.snapshot.pages, document.snapshot.fields);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = pageInView(tops.current, event.nativeEvent.contentOffset.y, LOOK_AHEAD);
    if (next !== at) setAt(next);
  };
  const current = pages[at];
  return (
    <View style={styles.reader}>
      <ScrollView
        contentContainerStyle={styles.pages}
        scrollEventThrottle={64}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
      >
        {pages.map((sheet, index) => (
          <View
            key={sheetKey(sheet)}
            style={styles.sheet}
            onLayout={(event: LayoutChangeEvent) => {
              tops.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <ScaledProposalPage
              {...document}
              page={sheet.page}
              part={sheet.part}
              width={props.pageWidth}
            />
          </View>
        ))}
      </ScrollView>
      {current === undefined ? null : (
        <View style={styles.pill} accessibilityLiveRegion="polite">
          <Text variant="caption" color="inverse" bold>
            {words.pagePill(at + 1, pages.length, document.words.titles[current.page])}
          </Text>
        </View>
      )}
      <Dock {...ready} />
    </View>
  );
}

const styles = StyleSheet.create({
  reader: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  pages: {
    alignItems: 'center',
    gap: theme.spacing['sp-5'],
    paddingTop: theme.spacing['sp-12'],
    paddingBottom: theme.spacing['sp-16'] + theme.spacing['sp-8'],
  },
  sheet: { borderRadius: theme.radius['r-xs'], overflow: 'hidden' },
  pill: {
    position: 'absolute',
    top: theme.spacing['sp-3'],
    alignSelf: 'center',
    paddingVertical: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.ink,
  },
  dock: {
    position: 'absolute',
    left: theme.spacing['sp-4'],
    right: theme.spacing['sp-4'],
    bottom: theme.spacing['sp-5'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: a dock floats over the pages — the card colour is its own ground, as the bottom pill's is
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
});
