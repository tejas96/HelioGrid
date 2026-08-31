import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import { Text } from '../../primitives/Text/Text.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import type { Finding, FindingStatus } from './FindingList.types';
import { FINDING_LABEL, statusOf } from './FindingList.verdict';

/** The three statuses in the StatusMark vocabulary. Ready is a pass, not an absence. */
export const FINDING_TONE: Record<FindingStatus, StatusTone> = {
  blocking: 'danger',
  attention: 'warning',
  ready: 'success',
};

const MARK_PATH: Record<FindingStatus, string> = {
  ready: 'M5 13l4 4L19 7',
  blocking: 'M12 7v7M12 17.5h.01',
  attention: 'M12 8v5M12 16.5h.01',
};

/* The warning MARK takes --warning-text: plain --warning clears no contrast floor. */
const MARK_FILL: Record<FindingStatus, string> = {
  blocking: theme.colors.danger,
  attention: theme.colors['warning-text'],
  ready: theme.colors.success,
};

/** The row's own mark. The status pill beside it therefore needs no second glyph. */
function Mark({ status }: { status: FindingStatus }) {
  return (
    <View style={[styles.mark, { backgroundColor: MARK_FILL[status] }]}>
      <Svg
        width={11}
        height={11}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors['text-inverse']}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={MARK_PATH[status]} />
      </Svg>
    </View>
  );
}

interface FindingListRowProps {
  finding: Finding;
  onJump?: (finding: Finding) => void;
  jumpLabel?: string;
}

/** One finding: the mark, the check, its meaning in plain language, and the act that fixes it. */
export function FindingListRow({ finding, onJump, jumpLabel }: FindingListRowProps) {
  const status = statusOf(finding);
  const jump = finding.onJump ?? (onJump === undefined ? undefined : () => onJump(finding));
  const jumpWords =
    finding.jumpLabel ?? (finding.step === undefined ? jumpLabel : `Fix in ${finding.step}`);
  const pending = renderPending(finding.pending, { size: 12 });
  return (
    <View style={styles.row}>
      <Mark status={status} />
      <View style={styles.body}>
        <View style={styles.head}>
          <Text variant="body" style={styles.title}>
            {finding.title}
          </Text>
          <StatusMark
            tone={FINDING_TONE[status]}
            label={finding.statusLabel ?? FINDING_LABEL[status]}
            mark={false}
          />
        </View>
        {/* M05-58: the meaning in plain language, always — a check name is not a sentence. */}
        {finding.meaning === undefined ? null : (
          <Text variant="body-sm" color="secondary">
            {finding.meaning}
          </Text>
        )}
        {finding.family === undefined ? null : (
          <Text variant="caption" color="tertiary">
            {finding.family}
          </Text>
        )}
        {pending}
        {jump === undefined && finding.fix === undefined ? null : (
          <View style={styles.acts}>
            {jump === undefined ? null : (
              <Pressable onPress={jump} style={styles.jump}>
                <Text variant="body" style={styles.actWords}>
                  {jumpWords}
                </Text>
                <Svg
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors['text-primary']}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="M5 12h13M13 6l6 6-6 6" />
                </Svg>
              </Pressable>
            )}
            {/* MS6-27's "Auto-string now". Optional by design: most findings have no such act. */}
            {finding.fix === undefined ? null : (
              <Pressable onPress={finding.fix.onFix} style={styles.fix}>
                <Text variant="body" style={styles.fixWords}>
                  {finding.fix.label}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  mark: {
    width: 18,
    height: 18,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  title: {
    fontWeight: '500',
  },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-0-5'],
  },
  jump: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  fix: {
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['accent-subtle'],
  },
  actWords: {
    fontWeight: '500',
  },
  fixWords: {
    fontWeight: '700',
    color: theme.colors.accent,
  },
});
