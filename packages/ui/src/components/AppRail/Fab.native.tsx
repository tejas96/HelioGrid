import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { FabProps } from './AppRail.types';

interface NativeFabProps extends FabProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Raised near-black action button. 56dp so gloves can hit it. The spring on press belongs to the
 * Pressable primitive, which owns the pressed treatment for the whole system — so the scale is
 * the primitive's, not this component's.
 */
export function Fab({ label = 'Add', icon, onClick, size = 56, style }: NativeFabProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onClick}
      style={[styles.fab, { width: size, height: size }, style]}
    >
      {icon ?? <PlusIcon />}
    </Pressable>
  );
}

function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={theme.colors['text-inverse']}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fab: {
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
    ...theme.elevation.e5,
  },
});
