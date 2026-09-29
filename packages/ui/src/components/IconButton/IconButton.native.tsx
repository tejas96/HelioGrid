import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { renderActionReason } from '../ActionReason/ActionReason.native';
import type { IconButtonProps, IconButtonVariant } from './IconButton.types';

interface NativeIconButtonProps extends IconButtonProps {
  /** Lands on the circle, never on the reason column — the DS contract for `style`. */
  style?: StyleProp<ViewStyle>;
}

interface VariantVisual {
  /** Absent: the variant takes the control fill of what holds it. */
  background?: string;
}

const VARIANT: Record<IconButtonVariant, VariantVisual> = {
  /* The opposite of what holds it (`F7-15`): the well on the page, white inside a tile; flat. */
  surface: {},
  dark: { background: theme.colors['action-primary'] },
  /* Web ghost reads --control-edge so field mode can ring it; RN has no field-mode edge yet. */
  ghost: { background: 'transparent' },
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  column: { alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
});

/**
 * Perfect circle, `size` the visual diameter, 44px the target — the Pressable primitive owns the
 * floor, so `size` can go under it visually and never functionally. As on Button, a disabled RN
 * element stays in the accessibility tree, so the sentence beneath it is reachable.
 */
export function IconButton({
  children,
  size = 40,
  label,
  variant = 'surface',
  disabled = false,
  disabledReason,
  onClick,
  style,
}: NativeIconButtonProps) {
  const visual = VARIANT[variant];
  const { controlFill, controlFillDisabled } = useGround();
  const reason = renderActionReason(disabledReason);
  const stated = disabled && reason !== null;

  const circle = (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onClick}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: visual.background ?? controlFill,
        },
        disabled ? { backgroundColor: controlFillDisabled } : undefined,
        style,
      ]}
    >
      {children}
    </Pressable>
  );

  if (!stated) {
    return circle;
  }
  return (
    <View style={styles.column}>
      {circle}
      {reason}
    </View>
  );
}
