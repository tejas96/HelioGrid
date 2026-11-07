import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { GlanceFact, GlanceStripProps } from './GlanceStrip.types';

/**
 * Small facts in one capsule, split by hairlines — the web half's glass strip. A phone is always
 * the narrow room: four facts sit two by two, two or three in one row.
 */
export function GlanceStrip({ facts, name }: GlanceStripProps) {
  const columns = facts.length === 4 ? 2 : Math.max(1, facts.length);
  return (
    <View style={styles.strip} accessibilityLabel={name} accessibilityRole="summary">
      {facts.map((fact, index) => (
        <View
          key={fact.key}
          style={[
            styles.cell,
            { width: `${100 / columns}%` },
            (index + 1) % columns === 0 ? undefined : styles.dividerRight,
            index < facts.length - columns ? styles.dividerBottom : undefined,
          ]}
        >
          {fact.onPress === undefined ? (
            <View style={styles.fact}>
              <FactBody fact={fact} />
            </View>
          ) : (
            <Pressable
              onPress={fact.onPress}
              accessibilityLabel={fact.spokenName}
              style={styles.fact}
            >
              <FactBody fact={fact} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

function FactBody({ fact }: { fact: GlanceFact }): ReactNode {
  return (
    <>
      <View style={styles.label}>
        {fact.icon === undefined ? null : <ShellGlyph name={fact.icon} size="sm" />}
        <Text variant="caption" color="secondary" style={styles.labelWords}>
          {fact.label}
        </Text>
        {fact.aside}
      </View>
      <View style={styles.figure}>
        <Text variant="figure" style={styles.value}>
          {fact.value}
        </Text>
        {fact.unit === undefined ? null : (
          <Text variant="body-sm" color="secondary">
            {fact.unit}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: ground — a fact sits on the card colour
    backgroundColor: colors.surface,
  },
  cell: { minWidth: 0 },
  dividerRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors['line-soft'],
  },
  dividerBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors['line-soft'],
  },
  fact: {
    gap: theme.spacing['sp-1'],
    paddingTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  label: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
  labelWords: { fontWeight: '500' },
  figure: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-1'],
  },
  value: { fontFamily: theme.type.families.display, fontVariant: ['tabular-nums'] },
});
