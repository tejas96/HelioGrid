import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import type { StatusMarkProps, StatusTone } from './StatusMark.types';
import { STATUS_GLYPH } from './StatusMark.types';

interface TonePair {
  text: string;
  bg: string;
}

/* The semantic -text/-bg partner pairs. Warning marks take warning-text because --warning
   itself clears no contrast floor (packages/theme colors). */
const TONE: Record<StatusTone, TonePair> = {
  neutral: { text: theme.colors['neutral-text'], bg: theme.colors['neutral-bg'] },
  info: { text: theme.colors['info-text'], bg: theme.colors['info-bg'] },
  success: { text: theme.colors['success-text'], bg: theme.colors['success-bg'] },
  warning: { text: theme.colors['warning-text'], bg: theme.colors['warning-bg'] },
  danger: { text: theme.colors['danger-text'], bg: theme.colors['danger-bg'] },
  accent: { text: theme.colors.accent, bg: theme.colors['accent-subtle'] },
};

const container: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: theme.spacing['sp-1'],
  paddingVertical: theme.spacing['sp-0-5'],
  paddingHorizontal: theme.spacing['sp-3'],
  borderRadius: theme.radius['r-pill'],
};

/* --fw-medium — the DS chip weight (StatusChip.jsx). */
const words: TextStyle = {
  fontFamily: theme.type.families.sans,
  fontWeight: '500',
  fontSize: theme.type.roles['body-sm'].fontSize,
  lineHeight: theme.type.roles['body-sm'].lineHeight,
};

const glyph: TextStyle = {
  ...words,
  fontWeight: '700',
};

interface NativeStatusMarkProps extends StatusMarkProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Status as label + mark, never colour alone (F7-12, docs/engineering/17 §4). A component that tints
 * a state without composing this primitive is a defect.
 */
export function StatusMark({ tone, label, mark = true, style }: NativeStatusMarkProps) {
  const pair = TONE[tone];
  return (
    <View style={[container, { backgroundColor: pair.bg }, style]}>
      {mark ? (
        <RNText importantForAccessibility="no" style={[glyph, { color: pair.text }]}>
          {STATUS_GLYPH[tone]}
        </RNText>
      ) : null}
      <RNText style={[words, { color: pair.text }]}>{label}</RNText>
    </View>
  );
}
