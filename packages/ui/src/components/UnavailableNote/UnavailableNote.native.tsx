import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { UnavailableNoteProps } from './UnavailableNote.types';
import { isBlockedState, SURFACE_STATES } from './UnavailableNote.types';

interface NativeUnavailableNoteProps extends UnavailableNoteProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A slashed circle: "not applicable here". Deliberately NOT the warning triangle/exclamation that
 * `error` uses — the mark is the second channel and it must not read as a fault.
 */
function Glyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={theme.colors['text-tertiary']} strokeWidth={1.5} />
      <Path
        d="m5.6 5.6 12.8 12.8"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * THE FOURTH STATE, and the one renderer of it. An error says *something went wrong*; unavailable
 * says *this was never going to be here, and that is fine* — a different sentence, a different
 * tone and NO RETRY, EVER.
 */
function UnavailableNoteBase({
  title = 'Not available here',
  message,
  detail,
  icon,
  action,
  variant = 'note',
  align,
  style,
}: NativeUnavailableNoteProps) {
  const region = variant === 'region';
  const centred = align === undefined ? region : align === 'center';

  if (region) {
    return (
      <View style={[styles.region, style]}>
        <View style={[styles.mark, styles.markRegion]}>{icon ?? <Glyph size={22} />}</View>
        <Text align="center" style={regionTitle}>
          {title}
        </Text>
        {message !== undefined ? (
          <Text variant="body-sm" color="secondary" align="center" style={styles.measure}>
            {message}
          </Text>
        ) : null}
        {detail !== undefined ? renderDetail(detail) : null}
        {/* Never a retry. A forward action goes somewhere else. */}
        {action !== undefined ? <View style={styles.regionAction}>{action}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.note, centred ? styles.noteCentred : styles.noteStart, style]}>
      <View style={[styles.mark, styles.markNote]}>{icon ?? <Glyph size={15} />}</View>
      <View style={styles.lines}>
        <Text variant="body-sm" color="secondary" align={centred ? 'center' : 'start'}>
          <Text variant="body-sm" style={subject}>
            {title}
            {message !== undefined ? ' — ' : ''}
          </Text>
          {message}
        </Text>
        {detail !== undefined ? renderDetail(detail) : null}
        {action}
      </View>
    </View>
  );
}

/** A string detail takes the caption treatment; a node is the caller's own drawing. */
function renderDetail(detail: UnavailableNoteProps['detail']) {
  if (typeof detail === 'string' || typeof detail === 'number') {
    return (
      <Text variant="caption" color="tertiary">
        {detail}
      </Text>
    );
  }
  return detail;
}

/** The `.states` / `.isBlockedState` statics the DS attaches to the component. */
export const UnavailableNote = Object.assign(UnavailableNoteBase, {
  states: SURFACE_STATES,
  isBlockedState,
});

/* 16px sits between --fs-body (15) and --fs-h4 (17) and has no token; -0.01em of it in points. */
const regionTitle: TextStyle = { fontSize: 16, fontWeight: '700', letterSpacing: -0.16 };
const subject: TextStyle = { fontWeight: '700', color: theme.colors['text-primary'] };

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['neutral-bg'],
  },
  markNote: { width: 24, height: 24, marginTop: 1 },
  markRegion: { width: 48, height: 48, marginBottom: theme.spacing['sp-1'] },
  region: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  measure: { maxWidth: 340 },
  regionAction: { marginTop: theme.spacing['sp-2'] },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: theme.spacing['sp-1'],
    paddingBottom: theme.spacing['sp-0-5'],
  },
  noteStart: { justifyContent: 'flex-start' },
  noteCentred: { justifyContent: 'center' },
  lines: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
    flexShrink: 1,
  },
});
