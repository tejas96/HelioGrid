import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { PageTrailProps } from './PageTrail.types';

// web-only part: Button — the web Back is its narrow room; on a phone the top bar goes back.

/**
 * The trail on a wide phone surface (a tablet's page). A phone screen does not mount it: its way
 * back is the top bar's, from the same facts (`backCrumbOf`).
 */
export function PageTrail({ trail, here, label, acts }: PageTrailProps) {
  return (
    <View style={styles.row}>
      <View style={styles.trail} accessibilityLabel={label} role="navigation" collapsable={false}>
        {trail.map((crumb, at) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a trail is a path in order; two pages above may share a name (a lead and its design), never a place
          <View key={at} style={styles.crumb}>
            <Pressable onPress={crumb.onOpen}>
              <Text variant="body-sm" color="secondary">
                {crumb.label}
              </Text>
            </Pressable>
            <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          </View>
        ))}
        <Text variant="body-sm" bold>
          {here}
        </Text>
      </View>
      {acts}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  trail: {
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
