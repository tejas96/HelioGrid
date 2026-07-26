import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { IconCircle } from './Card';

/**
 * List row — circular leading, two-line text, trailing slot. Separates by luminance and
 * gap, never a divider: transparent at rest so zebra containers own the alternate fill,
 * and the web hover state (surface + e2) maps to the pressed state. The ref's off-scale
 * 10/6 vertical pads snap to the 4dp scale (8/4); minHeight keeps the 64/44 row heights.
 */

const MIN_TARGET = 44;

export interface ListRowProps {
  icon?: ReactNode;
  iconColor?: string;
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  density?: 'expressive' | 'functional';
  onClick?: () => void;
  style?: ViewStyle;
}

export function ListRow({
  icon,
  iconColor = theme.colors.accent,
  avatar,
  title,
  subtitle,
  trailing,
  density = 'expressive',
  onClick,
  style,
}: ListRowProps) {
  const isExpr = density === 'expressive';
  const titleRole = isExpr ? 'body' : 'body-sm';
  const shape: ViewStyle = {
    minHeight: isExpr ? theme.spacing['sp-16'] : MIN_TARGET,
    paddingVertical: isExpr ? theme.spacing['sp-2'] : theme.spacing['sp-1'],
    paddingHorizontal: isExpr ? theme.spacing['sp-4'] : theme.spacing['sp-3'],
    borderRadius: isExpr ? theme.radius['r-md'] : theme.radius['rf-md'],
  };
  const body = (
    <>
      {avatar ?? (icon ? <IconCircle icon={icon} color={iconColor} density={density} /> : null)}
      <View style={styles.text}>
        <AppText
          role={titleRole}
          weight="700"
          numberOfLines={1}
          style={{ letterSpacing: theme.typography[titleRole].fontSize * -0.01 }}
        >
          {title}
        </AppText>
        {subtitle != null && (
          // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA
          <AppText role="body-sm" color={theme.colors['text-secondary']} numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing}
    </>
  );
  if (onClick) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onClick}
        style={({ pressed }) => [styles.row, shape, pressed && styles.pressed, style]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.row, shape, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  text: {
    flex: 1,
  },
  pressed: {
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
});
