import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Centred empty state — soft brand-glow bloom behind a large circular icon container.
 * Web ref: design/ds-source _ds_bundle components/feedback/EmptyState.jsx.
 * RN cannot paint the --glow-brand radial gradient; the bloom is approximated with two
 * concentric PALE circles (accent-subtle + faint iris-violet) — full-saturation stops
 * band visibly without gradients; upgrade to react-native-svg radial when svg lands. Pass icons pre-coloured (web renders them text-tertiary).
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
/** Graduated rings approximating the --glow-brand radial fade (web ref: 180px, gone by 72%). */
const GLOW_LAYERS = [
  { size: 92, opacity: 0.08 },
  { size: 112, opacity: 0.06 },
  { size: 132, opacity: 0.045 },
  { size: 150, opacity: 0.03 },
  { size: 166, opacity: 0.015 },
];
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
        {glow &&
          GLOW_LAYERS.map((layer) => (
            <View
              key={layer.size}
              pointerEvents="none"
              style={[
                styles.glowLayer,
                {
                  top: (ICON_CIRCLE - layer.size) / 2,
                  left: (ICON_CIRCLE - layer.size) / 2,
                  width: layer.size,
                  height: layer.size,
                  borderRadius: layer.size / 2,
                  opacity: layer.opacity,
                },
              ]}
            />
          ))}
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
  // The --glow-brand radial fades to transparent by 72% — hard-edged discs cannot do
  // that (visible banding + apparent text overlap). GLOW_LAYERS approximates the fade.
  glowLayer: {
    position: 'absolute',
    backgroundColor: theme.colors['iris-violet'],
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
