import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import type { AppRailProps, RailItem } from './AppRail.types';

interface NativeAppRailProps extends AppRailProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The icon rail: the product mark at the top, primary destinations, then utilities and the
 * account avatar pinned to the bottom. The active item is an accent-subtle rounded tile — never
 * a border, never a left accent bar.
 *
 * `width` takes the `--rail-w` token's value (72) unless a number is passed. The web default is
 * the literal `var(--rail-w, 72px)` string, which means nothing here, so a string width falls
 * back to the token rather than being parsed. The hover tint has no touch equivalent; the
 * Pressable primitive's pressed state is the feedback.
 */
export function AppRail({
  items,
  value,
  onChange,
  footer = [],
  avatar,
  width,
  brand,
  style,
}: NativeAppRailProps) {
  const railWidth = typeof width === 'number' ? width : theme.layout['rail-w'];
  return (
    /* THE RAIL IS A NAVIGATION LANDMARK, NOT A MENUBAR. The DS half is `<nav aria-label="Primary">`
       (ds-v2 navigation/AppRail.jsx) and every item carries `aria-current="page"` — destinations,
       not menu commands, so a `menubar` here would both contradict the DS and demand `menuitem`
       children it does not have. React Native models no landmark roles at all, so the honest native
       form of a `<nav>` is a plain View: the drift was the invented role, not a missing one. */
    <View style={[styles.rail, { width: railWidth }, style]}>
      <View style={styles.brand}>{brand}</View>
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
  return (
    <Pressable
      accessibilityLabel={badgeName(item.label, item.badge)}
      onPress={onPress}
      style={[styles.button, active ? styles.buttonActive : undefined]}
    >
      {item.icon}
      {/* F6-17: the badge counts unread from the record. A number, not a dot. */}
      {showsBadge(item.badge) ? (
        <View style={styles.badge}>
          <CountBadge count={item.badge} label={item.label.toLowerCase()} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexShrink: 0,
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    height: '100%',
    paddingVertical: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
  },
  brand: {
    marginBottom: theme.spacing['sp-3'],
  },
  spacer: {
    flex: 1,
  },
  avatar: {
    marginTop: theme.spacing['sp-2'],
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-md'],
  },
  buttonActive: {
    backgroundColor: theme.colors['accent-subtle'],
  },
  badge: {
    position: 'absolute',
    top: theme.spacing['sp-0-5'],
    right: 0,
  },
});
