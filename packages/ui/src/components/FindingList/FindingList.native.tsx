import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import type { FindingListProps, FindingStatus, FindingStatusMeta } from './FindingList.types';
import { countSentence, FINDING_RANK, findingVerdict } from './FindingList.verdict';
import { FINDING_TONE, FindingListRow } from './FindingListRow.native';
import { useFindingList } from './use-finding-list';

interface NativeFindingListProps extends FindingListProps {
  style?: StyleProp<ViewStyle>;
}

/* The status table in the native colour vocabulary. Exposed as `FindingList.statuses`. */
const FINDING_STATUSES: Record<FindingStatus, FindingStatusMeta> = {
  blocking: {
    rank: FINDING_RANK.blocking,
    tone: theme.colors['danger-text'],
    bg: theme.colors['danger-bg'],
    mark: theme.colors.danger,
  },
  attention: {
    rank: FINDING_RANK.attention,
    tone: theme.colors['warning-text'],
    bg: theme.colors['warning-bg'],
    /* The warning MARK takes --warning-text: plain --warning clears no contrast floor. */
    mark: theme.colors['warning-text'],
  },
  ready: {
    rank: FINDING_RANK.ready,
    tone: theme.colors['success-text'],
    bg: theme.colors['success-bg'],
    mark: theme.colors.success,
  },
};

/** The gate that lists every failure, counted, each with the act that fixes it. */
export function FindingList(props: NativeFindingListProps) {
  const {
    words,
    verdict = true,
    onJump,
    jumpLabel,
    passMessage,
    note,
    density = 'expressive',
    style,
  } = props;
  const {
    summary,
    heading,
    mainList,
    tailList,
    ready,
    readyOpen,
    toggleReady,
    foldsReady,
    showsTail,
  } = useFindingList(props);

  return (
    /* THE HEADING IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half's `<section aria-label>`
       names a landmark with the SAME string the `<h3>` prints; RN has no landmark, and the heading
       Text is the first thing inside this View. Hung on a bare View the name announced nothing;
       announced it would say "Fix 5 issues to share" twice, and `accessible` would fold every
       finding's "Fix in …" and inline fix — the whole point of the gate — into one element. So the
       dead label goes and the reader walks the heading, the count and the findings. */
    <View style={[styles.root, density === 'functional' ? styles.padFn : styles.padEx, style]}>
      {/* A heading on the page (`F7-49`): no fill, no shadow, no ground of its own. Each finding
          is the tile. */}
      <View style={styles.head}>
        <Text variant="h3" style={styles.heading}>
          {heading}
        </Text>
        {verdict ? (
          <StatusMark tone={FINDING_TONE[summary.status]} label={words.status[summary.status]} />
        ) : null}
      </View>

      {/* A polite live region is RN's `role="status"`: the count is re-read when the gate re-runs. */}
      <View accessibilityLiveRegion="polite">
        <Text variant="body-sm" color="secondary">
          {countSentence(summary, words, passMessage)}
        </Text>
      </View>

      {mainList.length > 0 ? (
        <View style={styles.items}>
          {mainList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              words={words}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </View>
      ) : null}

      {/* The web half's `aria-expanded`, declared once through the primitive as
          `accessibilityState.expanded` — a collapse that cannot say whether it is open is not
          reachable, and the 44dp floor comes with the primitive rather than a second number. */}
      {foldsReady ? (
        <Pressable
          accessibilityState={{ expanded: readyOpen }}
          onPress={toggleReady}
          style={styles.readyToggle}
        >
          <Text variant="body" color="secondary" style={styles.readyToggleWords}>
            {words.readyToggle(ready.length, readyOpen)}
          </Text>
        </Pressable>
      ) : null}
      {showsTail ? (
        <View style={styles.items}>
          {tailList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              words={words}
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
    gap: 10,
  },
  items: {
    gap: theme.spacing['sp-2'],
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
