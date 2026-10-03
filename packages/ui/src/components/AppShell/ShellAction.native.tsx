import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { ShellActionProps } from './AppShell.types';
import { badgeName, showsBadge } from './AppShell.types';
import { CountBadge } from './CountBadge.native';

interface NativeShellActionProps extends ShellActionProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A 44×44 shell button with an optional count badge riding its corner — the Pressable primitive
 * owns the target. The web's hover tint has no touch equivalent; the primitive's pressed state is
 * the feedback here, and `active` still paints the accent-subtle tile.
 */
export function ShellAction({
  label,
  icon,
  badge,
  name: wholeName,
  onClick,
  active = false,
  style,
}: NativeShellActionProps) {
  /* A zero badge keeps the plain name here (the source's `badge ?` test) while it still reaches
     CountBadge, which renders nothing at zero. */
  const name = wholeName ?? (badge === 0 ? label : badgeName(label, badge));
  const { controlFill } = useGround();
  return (
    <Pressable
      accessibilityLabel={name}
      onPress={onClick}
      style={[
        styles.action,
        { backgroundColor: controlFill },
        active ? styles.active : undefined,
        style,
      ]}
    >
      {icon}
      {showsBadge(badge) ? (
        <View style={styles.badge}>
          <CountBadge count={badge} label={label.toLowerCase()} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  active: {
    backgroundColor: theme.colors['accent-subtle'],
  },
  /* The count rides the button's top-right corner, half outside it, so it never covers the glyph. */
  badge: {
    position: 'absolute',
    top: -theme.spacing['sp-1'],
    right: -theme.spacing['sp-1'],
  },
});
