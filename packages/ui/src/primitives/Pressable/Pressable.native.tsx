import type {
  AccessibilityRole,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Pressable as RNPressable } from 'react-native';
import type { PressableProps, PressableRole } from './Pressable.types';
import { MIN_TOUCH_TARGET } from './Pressable.types';

interface NativePressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
}

const base: ViewStyle = {
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
  alignItems: 'center',
  justifyContent: 'center',
};

const pressedStyle: ViewStyle = { transform: [{ scale: 0.97 }] };

/**
 * The DS role vocabulary as React Native's. Identity except for the two menu roles: RN has
 * `menuitem` and no `menuitemradio`/`menuitemcheckbox`, so the row announces as a menu item and
 * `accessibilityState.checked` carries which one is on — which is exactly what TalkBack and
 * VoiceOver read out. The distinction is kept in the DS type so the web half can still spell it.
 */
const NATIVE_ROLE: Record<PressableRole, AccessibilityRole> = {
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitem',
  menuitemradio: 'menuitem',
  radio: 'radio',
  switch: 'switch',
  tab: 'tab',
};

/**
 * The one pressable. Owns the 44px minimum target (MIN_TOUCH_TARGET), the pressed state
 * and the disabled semantics — a component never re-implements any of these (docs/engineering/17 §4).
 *
 * SEMANTICS COME THROUGH IT, NOT AROUND IT. `accessibilityRole` and `accessibilityState` are here
 * so that a checkbox, a radio, a tab or a menu row can say what it is and which one is on WITHOUT
 * dropping to RN's own `Pressable` — which is how four components lost the 44px floor and two lost
 * their semantics. `base` is applied first and always: no role can switch the floor off.
 */
export function Pressable({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  style,
}: NativePressableProps) {
  return (
    <RNPressable
      accessibilityRole={NATIVE_ROLE[accessibilityRole]}
      /* An omitted `state.disabled` follows the prop — today's behaviour exactly. Stating it
         announces off WITHOUT going inert, which is the reachable-with-a-reason row. */
      accessibilityState={{
        ...accessibilityState,
        disabled: accessibilityState?.disabled ?? disabled,
      }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={(state: PressableStateCallbackType) => [
        base,
        state.pressed && !disabled ? pressedStyle : undefined,
        style,
      ]}
    >
      {children}
    </RNPressable>
  );
}
