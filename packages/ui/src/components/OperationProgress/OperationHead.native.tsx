import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail.native';
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import { OperationNarration } from './OperationNarration.native';
import type { OperationProgressSize } from './OperationProgress.types';

interface OperationHeadProps {
  label: ReactNode;
  /** The clamped percentage, or null when the operation is indeterminate or finished. */
  pct: number | null;
  running: boolean;
  gradient: boolean;
  step: string | null;
  stage: ReactNode;
  counted: string | null;
  size: OperationProgressSize;
}

/** A bare string/number takes the component's own type treatment; a node is the caller's. */
function renderNode(node: ReactNode, style: TextStyle, variant: 'body' | 'body-sm' | 'caption') {
  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <Text variant={variant} style={style}>
        {node}
      </Text>
    );
  }
  return node;
}

/**
 * The indeterminate rail's spoken name. Web's `role="progressbar"` supplies the "in progress" fact
 * for free beside the label; a plain labelled node has to say it in words, so it does.
 */
function railLabel(label: ReactNode) {
  return typeof label === 'string' ? `${label}, in progress` : 'In progress';
}

/**
 * The work's name, its figure, its rail and its narration.
 *
 * INDETERMINATE IS A REAL STATE: no percentage is printed and the rail carries no
 * `accessibilityValue`, because a bar with an invented number on it is a claim.
 */
export function OperationHead({
  label,
  pct,
  running,
  gradient,
  step,
  stage,
  counted,
  size,
}: OperationHeadProps) {
  return (
    <>
      <View style={styles.head}>
        {renderNode(label, headline, size === 'inline' ? 'body-sm' : 'body')}
        {pct !== null ? (
          <Text variant="mono" color="secondary" style={figure}>
            {`${Math.round(pct)}%`}
          </Text>
        ) : null}
      </View>

      {running && pct !== null ? <ProgressBar value={pct} gradient={gradient} /> : null}
      {running && pct === null ? (
        /* The rail itself is hidden from the walk — a travelling segment is decoration — so
           without a labelled parent "work is happening" reaches nobody. Web wraps the same hidden
           rail in `role="progressbar"` + `aria-label`, and ARIA reads a progressbar with no
           `aria-valuenow` as indeterminate. RN DOES NOT: check (g) of this repo's own contract
           (scripts/ds-contract/native-role.mjs) fails `progressbar` with no `accessibilityValue`
           outright, because TalkBack and VoiceOver announce a percentage for the role and an
           INDETERMINATE operation has no position to give them. Its prescribed remedy for this
           exact shape is to drop the role and announce the activity in words — which is what this
           is. The determinate branch above goes through `ProgressBar`, which keeps the role AND
           its value. `accessible` folds only the decoration beneath it — there is no control
           inside to put out of reach. */
        <View accessible accessibilityLabel={railLabel(label)}>
          <IndeterminateRail width="100%" thickness={6} gradient={gradient} />
        </View>
      ) : null}

      <OperationNarration step={step} stage={stage} counted={counted} />
    </>
  );
}

/* -0.01em of the 15px/13px heading sizes, in points. */
const headline: TextStyle = { fontWeight: '700', letterSpacing: -0.15, flexShrink: 1, minWidth: 0 };
const figure: TextStyle = { fontWeight: '700', flexShrink: 0 };

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
