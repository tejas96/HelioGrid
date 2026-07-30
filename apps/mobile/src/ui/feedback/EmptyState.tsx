import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { BloomLayer } from '../composites/BloomLayer';

/**
 * Centred empty state — soft brand-glow bloom behind a large circular icon container.
 * Web ref: design/ds-source _ds_bundle components/feedback/EmptyState.jsx.
 * The bloom is the shared BloomLayer (extracted from this file's original GlowBrand —
 * same react-native-svg radial, stop-for-stop from the --glow-brand token).
 */
export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  glow?: boolean;
  style?: ViewStyle;
}

// Web-ref dimensions (component spec, not spacing-scale values).
const ICON_CIRCLE = 72;
// Owner ruling 2026-07-26: bloom spans the whole empty area (matches web/mockup wash).
const GLOW_SIZE = 360;
const DESCRIPTION_MAX_WIDTH = 320;

export function EmptyState({
  icon,
  title,
  description,
  action,
  glow = true,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconWrap}>
        {glow && <BloomLayer size={GLOW_SIZE} style={styles.glow} />}
        <View style={styles.iconCircle}>{icon}</View>
      </View>
      <AppText align="center" role="h3" weight="700">
        {title}
      </AppText>
      {description != null && (
        <AppText
          align="center"
          color={theme.colors['text-secondary']}
          role="body-sm"
          style={styles.description}
        >
          {description}
        </AppText>
      )}
      {action != null && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-6'],
    gap: theme.spacing['sp-2'],
  },
  iconWrap: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['sp-3'],
  },
  glow: {
    position: 'absolute',
    top: (ICON_CIRCLE - GLOW_SIZE) / 2,
    left: (ICON_CIRCLE - GLOW_SIZE) / 2,
  },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  description: {
    maxWidth: DESCRIPTION_MAX_WIDTH,
  },
  action: {
    marginTop: theme.spacing['sp-4'],
  },
});
