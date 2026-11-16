import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { StatusMarkProps } from './StatusMark.types';
import { STATUS_GLYPH } from './StatusMark.types';

const container: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: theme.spacing['sp-1'],
  paddingVertical: theme.spacing['sp-0-5'],
  paddingHorizontal: theme.spacing['sp-3'],
  borderRadius: theme.radius['r-pill'],
};

/* Bare: the tone's ink alone, on the card that holds it. */
const bareLook: ViewStyle = { paddingVertical: 0, paddingHorizontal: 0 };

/* --fw-medium — the DS chip weight (StatusChip.jsx). */
const words: TextStyle = {
  fontFamily: theme.type.families.sans,
  fontWeight: '500',
  fontSize: theme.type.roles['body-sm'].fontSize,
  lineHeight: theme.type.roles['body-sm'].lineHeight,
};

interface NativeStatusMarkProps extends StatusMarkProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Status as label + mark, never colour alone (F7-12, docs/engineering/17 §4). A component that tints
 * a state without composing this primitive is a defect.
 */
export function StatusMark({
  tone,
  label,
  mark = true,
  bare = false,
  glyph: ownGlyph,
  style,
}: NativeStatusMarkProps) {
  const pair = TONE[tone];
  return (
    <View style={[container, bare ? bareLook : { backgroundColor: pair.tint }, style]}>
      {mark
        ? (ownGlyph ?? (
            <View importantForAccessibility="no-hide-descendants">
              <ShellGlyph name={STATUS_GLYPH[tone]} size="xs" ink={pair.ink} />
            </View>
          ))
        : null}
      <RNText style={[words, { color: pair.ink }]}>{label}</RNText>
    </View>
  );
}
