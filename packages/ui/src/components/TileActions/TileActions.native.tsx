import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import type { TileActionProps, TileActionsProps } from './TileActions.types';

interface NativeTileActionProps extends TileActionProps {
  /** Lands on the target, as the web half's does. */
  style?: StyleProp<ViewStyle>;
}

interface NativeTileActionsProps extends TileActionsProps {
  style?: StyleProp<ViewStyle>;
}

/* The design system's pill: its height, side padding, icon and inner gap are on no token scale. */
const PILL_H = 36;
const PILL_PAD = 14;
const ICON = 16;
const GAP = 6;

/**
 * A labelled 36px pill inside a 44px target. `Pressable` owns the floor and the pressed feedback,
 * and a toggle's state rides its `accessibilityState.selected`. The fill is the ground's control
 * fill — white inside the grey tile — and near-black while on.
 */
export function TileAction({
  icon,
  label,
  onLabel,
  spokenLabel,
  on,
  onClick,
  disabled = false,
  style,
}: NativeTileActionProps) {
  const { controlFill } = useGround();
  const hasIcon = icon !== undefined && icon !== null;
  const words: TextColor = disabled ? 'disabled' : on ? 'inverse' : 'primary';
  return (
    <Pressable
      onPress={onClick}
      disabled={disabled}
      accessibilityLabel={spokenLabel}
      accessibilityState={on === undefined ? undefined : { selected: on }}
      style={[styles.target, style]}
    >
      <View
        style={[
          styles.pill,
          hasIcon ? styles.pillWithIcon : null,
          { backgroundColor: on ? theme.colors['action-primary'] : controlFill },
        ]}
      >
        {hasIcon ? (
          <View style={styles.icon} importantForAccessibility="no-hide-descendants">
            {icon}
          </View>
        ) : null}
        <Text variant="body-sm" color={words} style={styles.words}>
          {on && onLabel ? onLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

/** The foot of a list tile: its action pills, below a thin line. `RecordCard` draws it from `actions`. */
export function TileActions({ children, rule = true, style }: NativeTileActionsProps) {
  return <View style={[styles.row, rule ? styles.rule : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-2'],
    rowGap: 0,
    marginTop: theme.spacing['sp-1'],
  },
  rule: {
    paddingTop: theme.spacing['sp-1'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['line-tile'],
  },
  target: { flexShrink: 0, borderRadius: theme.radius['r-pill'] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    minHeight: PILL_H,
    paddingHorizontal: PILL_PAD,
    borderRadius: theme.radius['r-pill'],
  },
  pillWithIcon: { paddingLeft: theme.spacing['sp-3'] },
  icon: { width: ICON, height: ICON, alignItems: 'center', justifyContent: 'center' },
  words: {
    fontWeight: '500',
    letterSpacing: -0.01 * theme.type.roles['body-sm'].fontSize,
  },
});
