import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { EmptyStateProps } from './EmptyState.types';

interface NativeEmptyStateProps extends EmptyStateProps {
  style?: StyleProp<ViewStyle>;
}

/** Centred empty state with a soft brand bloom behind a large circular icon container. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  glow = true,
  style,
}: NativeEmptyStateProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.art}>
        {glow ? <View style={styles.glow} /> : null}
        <View style={styles.icon}>{icon}</View>
      </View>
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>
      {description === undefined ? null : (
        <Text variant="body-sm" color="secondary" align="center" style={styles.description}>
          {description}
        </Text>
      )}
      {action === undefined ? null : <View style={styles.action}>{action}</View>}
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
  art: {
    marginBottom: theme.spacing['sp-3'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* --glow-brand is a radial gradient and RN draws none without a gradient dependency, so the
     bloom is the flat accent wash the gradient fades from. Atmosphere either way — it never
     carries information, so the approximation costs the reader nothing. */
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['accent-subtle'],
    opacity: 0.6,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  title: {
    color: theme.colors['text-primary'],
  },
  description: {
    maxWidth: 320,
  },
  action: {
    marginTop: theme.spacing['sp-4'],
  },
});
