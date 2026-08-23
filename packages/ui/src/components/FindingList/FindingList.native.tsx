import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import type { FindingListProps, FindingStatus, FindingStatusMeta } from './FindingList.types';
import {
  arrangeFindings,
  countSentence,
  FINDING_LABEL,
  FINDING_RANK,
  FINDING_VERDICT_LABEL,
  findingVerdict,
  headingWords,
  normaliseFindings,
  readyToggleWords,
} from './FindingList.verdict';
import { FINDING_TONE, FindingListRow } from './FindingListRow.native';

interface NativeFindingListProps extends FindingListProps {
  style?: StyleProp<ViewStyle>;
}

/* The status table in the native colour vocabulary. Exposed as `FindingList.statuses`. */
const FINDING_STATUSES: Record<FindingStatus, FindingStatusMeta> = {
  blocking: {
    rank: FINDING_RANK.blocking,
    label: FINDING_LABEL.blocking,
    tone: theme.colors['danger-text'],
    bg: theme.colors['danger-bg'],
    mark: theme.colors.danger,
    verdict: FINDING_VERDICT_LABEL.blocking,
  },
  attention: {
    rank: FINDING_RANK.attention,
    label: FINDING_LABEL.attention,
    tone: theme.colors['warning-text'],
    bg: theme.colors['warning-bg'],
    /* The warning MARK takes --warning-text: plain --warning clears no contrast floor. */
    mark: theme.colors['warning-text'],
    verdict: FINDING_VERDICT_LABEL.attention,
  },
  ready: {
    rank: FINDING_RANK.ready,
    label: FINDING_LABEL.ready,
    tone: theme.colors['success-text'],
    bg: theme.colors['success-bg'],
    mark: theme.colors.success,
    verdict: FINDING_VERDICT_LABEL.ready,
  },
};

/** The two props this component refuses to have. Ignored loudly rather than silently. */
function useRefusedProps(props: FindingListProps) {
  const guarded = props as unknown as Record<string, unknown>;
  const refused = 'max' in guarded || 'mode' in guarded;
  useEffect(() => {
    if (refused) {
      console.warn(
        'FindingList: `max` and `mode` are not props. A gate that promises every failure cannot cap or rank one away — use BannerStack for facts that can speak for one another.',
      );
    }
  }, [refused]);
}

/** The gate that lists every failure, counted, each with the act that fixes it. */
export function FindingList(props: NativeFindingListProps) {
  const {
    findings,
    actionLabel = 'share',
    title,
    order = 'severity',
    readyMode = 'collapsed',
    verdict = true,
    onJump,
    jumpLabel = 'Go to the step',
    passTitle = 'Nothing to fix',
    passMessage,
    note,
    density = 'expressive',
    style,
  } = props;
  useRefusedProps(props);

  const list = normaliseFindings(findings);
  const summary = findingVerdict(list);
  const [readyOpen, setReadyOpen] = useState(readyMode === 'listed');
  const { ready, mainList, tailList, showReady } = arrangeFindings(
    list,
    order,
    readyMode,
    readyOpen,
  );
  const heading = title ?? headingWords(summary, actionLabel, passTitle);

  return (
    /* THE HEADING IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half's `<section aria-label>`
       names a landmark with the SAME string the `<h3>` prints; RN has no landmark, and the heading
       Text is the first thing inside this View. Hung on a bare View the name announced nothing;
       announced it would say "Fix 5 issues to share" twice, and `accessible` would fold every
       finding's "Fix in …" and inline fix — the whole point of the gate — into one element. So the
       dead label goes and the reader walks the heading, the count and the findings. */
    <View style={[styles.root, density === 'functional' ? styles.padFn : styles.padEx, style]}>
      <View style={styles.head}>
        <Text variant="h3" style={styles.heading}>
          {heading}
        </Text>
        {verdict ? (
          <StatusMark tone={FINDING_TONE[summary.status]} label={FINDING_LABEL[summary.status]} />
        ) : null}
      </View>

      {/* A polite live region is RN's `role="status"`: the count is re-read when the gate re-runs. */}
      <View accessibilityLiveRegion="polite">
        <Text variant="body-sm" color="secondary">
          {countSentence(summary, passMessage)}
        </Text>
      </View>

      {mainList.length > 0 ? (
        <View>
          {mainList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </View>
      ) : null}

      {/* The web half's `aria-expanded`, declared once through the primitive as
          `accessibilityState.expanded` — a collapse that cannot say whether it is open is not
          reachable, and the 44dp floor comes with the primitive rather than a second number. */}
      {ready.length > 0 && readyMode === 'collapsed' ? (
        <Pressable
          accessibilityState={{ expanded: readyOpen }}
          onPress={() => setReadyOpen((open) => !open)}
          style={styles.readyToggle}
        >
          <Text variant="body" color="secondary" style={styles.readyToggleWords}>
            {readyToggleWords(ready.length, readyOpen)}
          </Text>
        </Pressable>
      ) : null}
      {tailList.length > 0 && showReady ? (
        <View>
          {tailList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </View>
      ) : null}

      {note === undefined ? null : (
        <Text variant="caption" color="tertiary">
          {note}
        </Text>
      )}
    </View>
  );
}

/** The same function a Generate button reads, so button and list can never disagree. */
FindingList.verdict = findingVerdict;
FindingList.statuses = FINDING_STATUSES;

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    gap: 10,
    ...theme.elevation.e2,
  },
  padEx: {
    padding: theme.spacing['sp-6'],
  },
  padFn: {
    padding: 18,
  },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    flex: 1,
  },
  /* The floor and the centring are the primitive's; this row keeps only its own frame. */
  readyToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
  },
  readyToggleWords: {
    fontWeight: '500',
  },
});
