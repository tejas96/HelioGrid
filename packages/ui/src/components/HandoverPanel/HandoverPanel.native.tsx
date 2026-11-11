import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows } from '../CardRows/CardRows.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import { projectFailedOf } from '../ProjectDetail/ProjectDetail.states';
import { HandoverMessage } from './HandoverMessage.native';
import { HandoverPack } from './HandoverPack.native';
import {
  documentCountsOf,
  handedOverNameOf,
  handOverBlockedOf,
  handoverLoadingOf,
  isHandedOver,
} from './HandoverPanel.logic';
import type { HandoverPanelProps } from './HandoverPanel.types';
import { HandoverReferral } from './HandoverReferral.native';

type Frames = {
  readonly frame: RefObject<View | null>;
  readonly doneRef: RefObject<View | null>;
};

/**
 * The handover on the phone, one column under its title. One frame holds every state, so the
 * screen reader lands on it after *Try again*; once handed over, it lands on the moment that
 * replaced the act.
 */
export function HandoverPanel(props: HandoverPanelProps) {
  const frame = useRef<View>(null);
  const doneRef = useRef<View>(null);
  return (
    <View ref={frame} style={styles.page}>
      <HandoverBody {...props} frame={frame} doneRef={doneRef} />
    </View>
  );
}

/**
 * The phone's column: the wait, the failure, or the checks, the pack, the message and the act —
 * and once handed over, the moment that takes the screen reader, the pack to download, the message
 * to share and the referral.
 */
function HandoverBody(props: HandoverPanelProps & Frames) {
  const { preview, project, words, frame } = props;
  if (preview.kind === 'loading') return <LoadingBars {...handoverLoadingOf(words)} />;
  if (preview.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, preview.retry, frame)} />;
  }
  const { pendingRows, message } = preview.value;
  if (isHandedOver(project)) {
    return (
      <View style={styles.page}>
        <View ref={props.doneRef} style={styles.done} accessibilityLiveRegion="polite">
          <LottieMoment name="success" size={120} />
          <Text variant="h1" align="center">
            {words.done}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {words.doneLine(handedOverNameOf(project), props.pack.kind !== 'empty')}
          </Text>
        </View>
        {props.pack.kind === 'empty' ? null : <HandoverPack {...props} />}
        <HandoverMessage {...props} message={message} sendable />
        <HandoverReferral {...props} customerName={project.customer.name} />
      </View>
    );
  }
  return (
    <View style={styles.page}>
      <Checks {...props} pendingRows={pendingRows} />
      <HandoverPack {...props} />
      <HandoverMessage {...props} message={message} sendable={false} />
      <HandOver {...props} blocked={handOverBlockedOf(words, props.opening, pendingRows)} />
    </View>
  );
}

/** What handover checks: every row done — counted — or the rows that still wait, each opening its document. */
function Checks({
  words,
  project,
  pendingRows,
  onOpenRow,
}: HandoverPanelProps & { pendingRows: readonly string[] }) {
  const counts = documentCountsOf(project);
  const ready = pendingRows.length === 0;
  return (
    <View style={styles.checks}>
      <HeroPanel name={ready ? words.ready : words.waitingTitle}>
        <View style={styles.status}>
          <View style={[styles.mark, ready ? styles.markReady : styles.markWaiting]}>
            <ShellGlyph
              name={ready ? 'tick' : 'alert-circle'}
              size="md"
              tone={ready ? 'success' : 'warning'}
            />
          </View>
          <View style={styles.statusWords}>
            <Text variant="body" bold>
              {ready ? words.ready : words.waitingTitle}
            </Text>
            <Text variant="body-sm" color="secondary">
              {ready ? words.readyLine(counts.done, counts.notNeeded) : words.waitingLine}
            </Text>
          </View>
        </View>
      </HeroPanel>
      {ready ? null : (
        <CardRows form="joined">
          {pendingRows.map((row, index) => (
            <CardRow
              key={row}
              first={index === 0}
              open={{ name: words.row(row), onOpen: () => onOpenRow(row) }}
            >
              <View style={styles.row}>
                <View style={[styles.mark, styles.markWaiting]}>
                  <ShellGlyph name="file" size="md" tone="warning" />
                </View>
                <Text variant="body" bold style={styles.rowName}>
                  {words.row(row)}
                </Text>
                <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
              </View>
            </CardRow>
          ))}
        </CardRows>
      )}
    </View>
  );
}

/** The act: off with its reason while a row waits; its failure said above it. */
function HandOver({
  words,
  sending,
  failure,
  onHandOver,
  blocked,
  doneRef,
}: HandoverPanelProps & Frames & { blocked: TranslatedText | null }) {
  const leaving = useFocusAfter(doneRef);
  return (
    <View style={styles.act}>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<ShellGlyph name="key" size="md" tone="inverse" />}
        loading={sending}
        disabled={blocked !== null}
        disabledReason={blocked ?? undefined}
        onClick={leaving(() => {
          if (!sending && blocked === null) onHandOver();
        })}
      >
        {words.send}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  checks: { gap: theme.spacing['sp-3'] },
  status: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.layout['touch-min'],
    height: theme.layout['touch-min'],
    flexShrink: 0,
    borderRadius: theme.radius['r-sm'],
  },
  markReady: { backgroundColor: colors['success-bg'] },
  markWaiting: { backgroundColor: colors['warning-bg'] },
  statusWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  rowName: { flex: 1, minWidth: 0 },
  act: { gap: theme.spacing['sp-2'] },
  done: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-1'],
  },
});
