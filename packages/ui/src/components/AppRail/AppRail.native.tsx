import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import { spokenItemName } from './AppRail.logic';
import type { AppRailProps, RailItem } from './AppRail.types';

interface NativeAppRailProps extends AppRailProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The sidebar a tablet draws: the brand and the company, the search, the destinations with their
 * names, then the utilities and the account at the foot. The item in view is a solid ink pill.
 * React Native models no landmark roles, so the web's `<nav>` is a plain View here.
 */
export function AppRail({
  items,
  value,
  onChange,
  footer = [],
  avatar,
  width,
  brand,
  caption,
  search,
  style,
}: NativeAppRailProps) {
  const railWidth = typeof width === 'number' ? width : theme.layout['sidebar-w'];
  return (
    <View style={[styles.rail, { width: railWidth }, style]}>
      <View style={styles.brand}>
        {brand}
        {caption}
      </View>
      {search === undefined ? null : <View style={styles.search}>{search}</View>}
      {items.map((item) => (
        <RailButton
          key={item.key}
          item={item}
          active={item.key === value}
          onPress={() => onChange?.(item.key)}
        />
      ))}
      <View style={styles.spacer} />
      {footer.map((item) => (
        <RailButton key={item.key} item={item} active={false} onPress={item.onClick} />
      ))}
      {avatar !== undefined ? <View style={styles.avatar}>{avatar}</View> : null}
    </View>
  );
}

interface RailButtonProps {
  item: RailItem;
  active: boolean;
  onPress?: () => void;
}

function RailButton({ item, active, onPress }: RailButtonProps) {
  const on = active || item.open === true;
  return (
    <Pressable
      accessibilityLabel={spokenItemName(item)}
      accessibilityState={item.open === undefined ? { selected: active } : { expanded: item.open }}
      onPress={onPress}
      style={[styles.button, on ? styles.buttonActive : undefined]}
    >
      {on && item.activeIcon !== undefined ? item.activeIcon : item.icon}
      <Text variant="body" style={[styles.label, on ? styles.labelActive : undefined]}>
        {item.label}
      </Text>
      {/* F6-17: the badge counts unread from the record. A number, not a dot. */}
      {showsBadge(item.badge) ? <CountBadge count={item.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexShrink: 0,
    gap: theme.spacing['sp-1'],
    height: '100%',
    paddingVertical: theme.spacing['sp-5'],
    paddingHorizontal: theme.spacing['sp-3'],
  },
  brand: {
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-2'],
    marginBottom: theme.spacing['sp-3'],
  },
  search: {
    marginBottom: theme.spacing['sp-3'],
  },
  spacer: {
    flex: 1,
  },
  avatar: {
    marginTop: theme.spacing['sp-2'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-10'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  buttonActive: {
    backgroundColor: colors.ink,
    ...theme.elevation.e2,
  },
  label: {
    flex: 1,
    color: colors['text-secondary'],
  },
  labelActive: {
    color: colors['on-ink'],
  },
});
