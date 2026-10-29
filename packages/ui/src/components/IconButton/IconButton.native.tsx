import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { ReasonTriggerProps } from '../ActionReason/ActionReason.types';
import { ReasonExplainer } from '../ActionReason/ReasonExplainer.native';
import { isStatedOff } from '../Button/Button.logic';
import type { IconButtonProps, IconButtonVariant } from './IconButton.types';

interface NativeIconButtonProps extends IconButtonProps {
  /** Lands on the circle — the DS contract for `style`. */
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
});

/**
 * Perfect circle, `size` the visual diameter, 44px the target — the Pressable primitive owns the
 * floor, so `size` can go under it visually and never functionally. As on Button, a circle with a
 * reason stays pressable: it announces disabled, its act is suppressed, a tap opens the reason in
 * the Explainer bubble above it, and it speaks the sentence after its name.
 */
export function IconButton({
  children,
  size = 40,
  label,
  variant = 'surface',
  disabled = false,
  disabledReason,
  reasonOpen,
  onClick,
  style,
}: NativeIconButtonProps) {
  const visual = VARIANT[variant];
  const { controlFill, controlFillDisabled } = useGround();
  const reasonId = useId();
  const stated = isStatedOff(disabled, disabledReason);

  const circle = (reason?: ReasonTriggerProps) => (
    <Pressable
      hostRef={reason?.ref}
      accessibilityLabel={
        reason?.spokenReason === undefined ? label : `${label}, ${reason.spokenReason}`
      }
      accessibilityState={
        reason === undefined ? undefined : { disabled: true, expanded: reason.expanded }
      }
      disabled={disabled && reason === undefined}
      onPress={reason === undefined ? onClick : reason.onPress}
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
    return circle();
  }
  return (
    <ReasonExplainer spec={disabledReason} id={reasonId} open={reasonOpen}>
      {circle}
    </ReasonExplainer>
  );
}
