import { theme } from '@heliogrid/theme';
import { Children, Fragment, isValidElement } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import type {
  SettingsCardProps,
  SettingsSectionProps,
  SettingsSectionRowProps,
} from './SettingsSection.types';

export function SettingsCard({
  children,
  style,
}: SettingsCardProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <GroundProvider ground="page">{children}</GroundProvider>
    </View>
  );
}

export function SettingsSection({ title, titleAside, children }: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <SettingsCard style={styles.section}>
      <View style={styles.head}>
        <View accessibilityRole="header">
          <Text variant="body" bold>
            {title}
          </Text>
        </View>
        {titleAside}
      </View>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index === 0 ? null : <View style={styles.hairline} />}
          {row}
        </Fragment>
      ))}
    </SettingsCard>
  );
}

export function SettingsSectionRow({
  label,
  labelAside,
  caption,
  control,
}: SettingsSectionRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.words}>
        <View style={styles.labelLine}>
          <Text variant="body-sm" bold>
            {label}
          </Text>
          {labelAside}
        </View>
        {caption === undefined ? null : (
          <Text variant="caption" color="secondary">
            {caption}
          </Text>
        )}
      </View>
      {control === undefined ? null : <View style={styles.control}>{control}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius['r-tile'],
    // biome-ignore lint/plugin/raw-white: panel — a sheet, a modal, a detail panel: a page ground over the page
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  section: { paddingVertical: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  hairline: { height: 1, backgroundColor: theme.colors['line-soft'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    minHeight: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  control: { flexShrink: 0 },
});
