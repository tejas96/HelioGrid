import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { IndeterminateRail } from './IndeterminateRail.native';
import type { PendingActionProps, PendingActionSpec } from './PendingAction.types';

interface NativePendingActionProps extends PendingActionProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * An arrow curving back to where it came from: the act was returned. Not error's exclamation
 * (nothing is broken) and not UnavailableNote's slashed circle (this was going to be here).
 */
function ReturnGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 14 5 10l4-4"
        stroke={theme.colors['warning-text']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 10h9a5 5 0 0 1 0 10h-3"
        stroke={theme.colors['warning-text']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A ReactNode that is a bare string or number takes the line's own type treatment. */
function renderWords(words: ReactNode, style: TextStyle) {
  if (typeof words === 'string' || typeof words === 'number') {
    return <Text style={style}>{words}</Text>;
  }
  return words;
}

/**
 * THE ROW'S THIRD ANSWER — "this is being done". It adds one line and changes NOTHING else about
 * the row: no opacity, no row tint, no disabling, no `aria-invalid`. A second act can start while
 * the first is in flight; hosts mark the row busy and leave it operable.
 */
export function PendingAction({
  label,
  state = 'waiting',
  reason,
  slowNote,
  onRetry,
  retryLabel = 'Try again',
  onDismiss,
  dismissLabel = 'Dismiss',
  size = 12,
  align = 'left',
  style,
}: NativePendingActionProps) {
  const returned = state === 'returned';
  const words = returned ? reason : label;
  if (words === undefined || words === null || words === false || words === '') {
    return null;
  }
  const fs = Math.max(12, size);
  const line: TextStyle = {
    fontSize: fs,
    lineHeight: Math.round(fs * 1.45),
    color: returned ? theme.colors['warning-text'] : theme.colors['text-secondary'],
  };
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.row, align === 'right' ? styles.right : styles.left, style]}
    >
      {returned ? (
        <View style={styles.glyph}>
          <ReturnGlyph size={fs + 1} />
        </View>
      ) : (
        <IndeterminateRail style={{ marginTop: Math.round(fs * 0.62) }} />
      )}
      <View style={styles.words}>
        {renderWords(words, line)}
        {/* M02-24's budget, said in words rather than by the rail getting slower. */}
        {!returned && slowNote !== undefined
          ? renderWords(slowNote, { ...line, color: theme.colors['text-tertiary'] })
          : null}
      </View>
      {returned && (onRetry !== undefined || onDismiss !== undefined) ? (
        <View style={styles.actions}>
          {onRetry !== undefined ? (
            <Pressable style={styles.pill} onPress={onRetry}>
              <Text variant="body-sm" style={pillLabel}>
                {retryLabel}
              </Text>
            </Pressable>
          ) : null}
          {/* Ghost profile: transparent, --text-secondary — the DS's field-mode-safe dismiss. */}
          {onDismiss !== undefined ? (
            <Pressable style={[styles.pill, styles.pillGhost]} onPress={onDismiss}>
              <Text variant="body-sm" color="secondary" style={pillGhostLabel}>
                {dismissLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isPendingSpec(value: PendingActionSpec | ReactNode): value is PendingActionSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/** What every host's `pending` prop runs through: a string, a spec, or a ready node. */
export function renderPending(
  spec: PendingActionSpec | ReactNode,
  extra: Partial<PendingActionProps> = {},
): ReactNode {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <PendingAction label={spec} {...extra} />;
  }
  if (!isPendingSpec(spec)) {
    return null;
  }
  if (spec.label === undefined && spec.reason === undefined) {
    return null;
  }
  return <PendingAction {...spec} {...extra} />;
}

const pillLabel: TextStyle = { fontWeight: '500' };
const pillGhostLabel: TextStyle = { fontWeight: '500' };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
  },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  glyph: { flexShrink: 0, marginTop: theme.spacing['sp-0-5'] },
  words: { minWidth: 0, flexShrink: 1, flexGrow: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /* Pressable owns the 44px floor; this is the pill profile on top of it. 14 sits between --sp-3
     and --sp-4 and has no token of its own. */
  pill: {
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  pillGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
});
