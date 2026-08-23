/* Which two versions these are (native) — the same caption, pair, side notes and counts line as
   the web half. Identity only: it renders no row and no control. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { DiffSides } from './VersionDiff.resolve';

const styles = StyleSheet.create({
  header: { gap: theme.spacing['sp-1'] },
  title: { fontWeight: '700', letterSpacing: theme.type.roles.h4.letterSpacing },
  to: { fontWeight: '400', color: theme.colors['text-tertiary'] },
  summary: { fontWeight: '500' },
});

export function VersionDiffHeader({
  caption,
  sides,
  summary,
}: {
  caption?: string;
  sides: DiffSides;
  summary: string;
}) {
  return (
    <View style={styles.header}>
      {caption ? (
        <Text variant="overline" color="tertiary">
          {caption}
        </Text>
      ) : null}
      <Text variant="h4" style={styles.title}>
        {sides.beforeLabel}
        <Text variant="h4" style={styles.to}>
          {' → '}
        </Text>
        {sides.afterLabel}
      </Text>
      {sides.notes ? (
        <Text variant="caption" color="tertiary">
          {sides.notes}
        </Text>
      ) : null}
      {summary ? (
        <Text variant="caption" color="secondary" style={styles.summary}>
          {summary}
        </Text>
      ) : null}
    </View>
  );
}
