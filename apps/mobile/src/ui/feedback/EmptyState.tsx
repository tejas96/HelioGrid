import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '../AppText';

/**
 * Centred empty state — soft brand-glow bloom behind a large circular icon container.
 * Web ref: design/ds-source _ds_bundle components/feedback/EmptyState.jsx.
 * The bloom is the REAL --glow-brand radial via react-native-svg — stop-for-stop from
 * the token: iris-violet 0.22 @0% → iris-blue 0.14 @40% → transparent @72%.
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  glow?: boolean;
  style?: ViewStyle;
}

// Web-ref dimensions (component spec, not spacing-scale values).
const ICON_CIRCLE = 72;
const GLOW_SIZE = 220;
const DESCRIPTION_MAX_WIDTH = 320;

function GlowBrand() {
  return (
    <Svg
      pointerEvents="none"
      width={GLOW_SIZE}
      height={GLOW_SIZE}
      style={styles.glow}
      accessible={false}
    >
      <Defs>
        <RadialGradient id="hgGlowBrand" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.colors['iris-violet']} stopOpacity={0.22} />
          <Stop offset="40%" stopColor={theme.colors['iris-blue']} stopOpacity={0.14} />
          <Stop offset="72%" stopColor={theme.colors['iris-blue']} stopOpacity={0} />
          <Stop offset="100%" stopColor={theme.colors['iris-blue']} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={GLOW_SIZE} height={GLOW_SIZE} fill="url(#hgGlowBrand)" />
    </Svg>
  );
}

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
        {glow && <GlowBrand />}
        <View style={styles.iconCircle}>{icon}</View>
      </View>
      {/* biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA */}
      <AppText align="center" role="h3" weight="700">
        {title}
      </AppText>
      {description != null && (
        // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA
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
