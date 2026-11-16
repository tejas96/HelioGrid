import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { UnavailableNoteProps } from './UnavailableNote.types';
import { isBlockedState, SURFACE_STATES } from './UnavailableNote.types';

interface NativeUnavailableNoteProps extends UnavailableNoteProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A slashed circle: "not applicable here". Deliberately NOT the warning triangle/exclamation that
 * `error` uses — the mark is the second channel and it must not read as a fault.
 */
function Glyph({ size }: { size: ShellGlyphSize }) {
  return <ShellGlyph name="blocked" size={size} ink={colors['text-tertiary']} />;
}

/**
 * THE FOURTH STATE, and the one renderer of it. An error says *something went wrong*; unavailable
 * says *this was never going to be here, and that is fine* — a different sentence, a different
 * tone and NO RETRY, EVER.
 */
function UnavailableNoteBase({
  title,
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
        <View style={[styles.mark, styles.markRegion]}>{icon ?? <Glyph size="lg" />}</View>
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
      <View style={[styles.mark, styles.markNote]}>{icon ?? <Glyph size="dense" />}</View>
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
/* `displayName` because the function is named `UnavailableNoteBase`, and `Explainer` refuses this
   component in its pages by name. */
export const UnavailableNote = Object.assign(UnavailableNoteBase, {
  displayName: 'UnavailableNote',
  states: SURFACE_STATES,
  isBlockedState,
});

const regionTitle: TextStyle = {
  fontSize: theme.type.roles['card-head'].fontSize,
  fontWeight: '700',
  letterSpacing: -0.16,
};
const subject: TextStyle = { fontWeight: '700', color: colors['text-primary'] };

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: TONE.neutral.tint,
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
