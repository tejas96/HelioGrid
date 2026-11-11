import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';

/** A section of the board on the phone: its heading, what sits at the head's end, then its card. */
export function ProjectBoardSection({
  title,
  end,
  children,
}: {
  title: TranslatedText;
  /** At the head's end: its count, a quiet note, the stage pill. */
  end: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View accessible accessibilityRole="header" style={styles.title}>
          <Text variant="h3">{title}</Text>
        </View>
        {end}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing['sp-3'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  title: { flexShrink: 1 },
});
