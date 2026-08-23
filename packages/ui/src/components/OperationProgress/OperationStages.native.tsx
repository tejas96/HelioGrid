import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail.native';
import type { OperationStage, OperationStageState } from './OperationProgress.types';

/** Each stage states its state IN WORDS for a screen reader; the glyph is the second channel. */
const STATE_WORDS: Record<OperationStageState, string> = {
  done: 'done',
  active: 'running',
  waiting: 'not started',
};

function DoneGlyph() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="m5 13 4 4L19 7"
        stroke={theme.colors['success-text']}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * MS2-38's three narrated steps: done · running · not yet. Defaults are `active` for the first
 * stage and `waiting` after, exactly as the DS resolves them.
 */
export function OperationStages({ stages }: { stages: OperationStage[] }) {
  return (
    <View accessibilityRole="list" style={styles.list}>
      {stages.map((stage, index) => {
        const state: OperationStageState = stage.state ?? (index === 0 ? 'active' : 'waiting');
        return (
          <View
            key={stage.label}
            accessibilityRole="text"
            accessibilityLabel={`${stage.label}, ${STATE_WORDS[state]}`}
            style={styles.row}
          >
            {state === 'done' ? <DoneGlyph /> : null}
            {state === 'active' ? <IndeterminateRail width={13} thickness={3} /> : null}
            {state === 'waiting' ? (
              <View style={styles.dotSlot}>
                <View style={styles.dot} />
              </View>
            ) : null}
            <Text
              variant="caption"
              color={state === 'waiting' ? 'tertiary' : 'secondary'}
              style={styles.label}
            >
              {stage.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'column', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  dotSlot: { width: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  /* An outlined 7px dot — RN has no inset box-shadow, so the ring is a real 1.5px border. */
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1.5,
    borderColor: theme.colors['mark-subtle'],
  },
  label: { minWidth: 0, flexShrink: 1 },
});
