import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { TONE } from '../../primitives/Tone/tone.native';
import type { StateMessageProps } from './StateBody.types';

/** The one quiet sentence an inline body's empty and error forms draw. */
export function StateMessage({ tone, title, message, action }: StateMessageProps) {
  const text: StyleProp<TextStyle> = [styles.text, tone === 'warning' ? styles.warning : null];
  return (
    <View style={styles.message}>
      <Text style={text}>
        {title !== undefined ? (
          <Text style={[text, tone === 'warning' ? null : styles.titleInk, styles.title]}>
            {title}
            {message !== undefined ? ' — ' : ''}
          </Text>
        ) : null}
        {message}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  message: { alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  text: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles['body-sm'].fontSize,
    lineHeight: theme.type.roles['body-sm'].lineHeight,
    color: colors['text-secondary'],
  },
  warning: { color: TONE.warning.ink },
  title: { fontWeight: '700' },
  titleInk: { color: colors['text-primary'] },
});
