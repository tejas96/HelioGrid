import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Centred empty state — soft brand-glow bloom behind a large circular icon container.
 * Web ref: design/ds-source _ds_bundle components/feedback/EmptyState.jsx.
 * RN cannot paint the --glow-brand radial gradient; the bloom is approximated with two
 * concentric circles using the gradient token's own stops (iris-violet @0.22 centre,
 * iris-blue @0.14 at 40%). Pass icons pre-coloured (web renders them text-tertiary).
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
const GLOW_OUTER = 180;
const GLOW_INNER = 128;
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
        {glow && (
          <>
            <View pointerEvents="none" style={styles.glowOuter} />
            <View pointerEvents="none" style={styles.glowInner} />
          </>
        )}
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
  // Bloom stops lifted from the --glow-brand token (rgba stops 0.22 / 0.14).
  glowOuter: {
    position: 'absolute',
    top: (ICON_CIRCLE - GLOW_OUTER) / 2,
    left: (ICON_CIRCLE - GLOW_OUTER) / 2,
    width: GLOW_OUTER,
    height: GLOW_OUTER,
    borderRadius: GLOW_OUTER / 2,
    backgroundColor: theme.colors['iris-blue'],
    opacity: 0.14,
  },
  glowInner: {
    position: 'absolute',
    top: (ICON_CIRCLE - GLOW_INNER) / 2,
    left: (ICON_CIRCLE - GLOW_INNER) / 2,
    width: GLOW_INNER,
    height: GLOW_INNER,
    borderRadius: GLOW_INNER / 2,
    backgroundColor: theme.colors['iris-violet'],
    opacity: 0.22,
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
