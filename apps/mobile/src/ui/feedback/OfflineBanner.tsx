import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Persistent slim pill banner — surveyors work without signal. Warning colours, never
 * blocks interaction. Web ref: _ds_bundle components/feedback/OfflineBanner.jsx.
 * RN adaptation: the web wifi-off SVG is replaced by a 6px warning dot (no SVG lib is
 * bundled; status = dot + label per DS law). Warning text always sits on --warning-bg.
 */
export interface OfflineBannerProps {
  count?: number;
  message?: string;
  style?: ViewStyle;
}

// Web-ref dimensions (component spec, not spacing-scale values).
const BANNER_HEIGHT = 32;
const BANNER_PAD_H = 14;
const DOT = 6;

export function OfflineBanner({ count = 0, message, style }: OfflineBannerProps) {
  const text = message ?? `Offline — ${count} change${count === 1 ? '' : 's'} queued`;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.root, style]}>
      <View style={styles.dot} />
      <AppText color={theme.colors.warning} role="body-sm" weight="500">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    height: BANNER_HEIGHT,
    paddingHorizontal: BANNER_PAD_H,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['warning-bg'],
    ...theme.elevation.e1,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: theme.colors.warning,
  },
});
