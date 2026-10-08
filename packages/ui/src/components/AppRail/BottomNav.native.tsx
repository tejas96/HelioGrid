import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import type { BottomNavProps, RailItem } from './AppRail.types';
import { isInView, PILL_NAV_SLOT_HEIGHT, PILL_NAV_SLOT_WIDTH, pressItem } from './AppRail.types';

interface NativeBottomNavProps extends BottomNavProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The phone shell's footer (`F7-22`): one white pill that floats, so it separates by its shadow
 * and never a line (`F7-15`). Floating, it sits at the design system's inset and gap from the
 * bottom of the frame it floats in. The device's bottom inset is the app's (`F7-50`): its frame
 * ends there, so `safeBottom` is met by the caller on the phone and not read here.
 *
 * Slots sit space-between at a fixed width, so More stays at the right end whatever the count and
 * no slot narrows under 44 when a long label is in view.
 */
export function BottomNav({
  items,
  value,
  onChange,
  floating = true,
  style,
}: NativeBottomNavProps) {
  return (
    <View style={[styles.pill, floating ? styles.floating : undefined, style]}>
      {items.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          inView={isInView(item, value)}
          onPress={() => pressItem(item, onChange)}
        />
      ))}
    </View>
  );
}

interface NavItemProps {
  item: RailItem;
  inView: boolean;
  onPress: () => void;
}

/** In view: the near-black pill with its filled icon and its label. Otherwise the icon alone. */
function NavItem({ item, inView, onPress }: NavItemProps) {
  return (
    <View ref={viewRef(item.anchor)} collapsable={false}>
      {/* A destination, not a tab: the web half says so with `aria-current="page"`, which React
          Native has no partner for — the same answer `AppRail` gives. */}
      <Pressable
        accessibilityLabel={badgeName(item.label, item.badge)}
        onPress={onPress}
        style={[styles.item, inView ? styles.inView : undefined]}
      >
        <View style={styles.icon}>
          {inView ? (item.activeIcon ?? item.icon) : item.icon}
          {showsBadge(item.badge) ? (
            <View style={styles.badge}>
              <CountBadge count={item.badge} label={item.label.toLowerCase()} />
            </View>
          ) : null}
        </View>
        {inView ? (
          <Text variant="body" color="inverse" fixedSize style={styles.label}>
            {item.label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

/** A coach mark measures the View this ref holds; any other anchor has no meaning on the phone. */
function viewRef(anchor: CoachMarkAnchor | undefined): RefObject<View | null> | undefined {
  if (anchor === undefined || typeof anchor === 'string' || !('current' in anchor))
    return undefined;
  return anchor as RefObject<View | null>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.layout['bottomnav-pill-h'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: float — a menu, a list, a calendar, a toast, a bubble: white with its shadow (F7-15)
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e4,
  },
  floating: {
    position: 'absolute',
    left: theme.layout['bottomnav-inset'],
    right: theme.layout['bottomnav-inset'],
    bottom: theme.layout['bottomnav-gap'],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: PILL_NAV_SLOT_WIDTH,
    height: PILL_NAV_SLOT_HEIGHT,
    borderRadius: theme.radius['r-pill'],
  },
  inView: {
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors['action-primary'],
  },
  icon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -14,
  },
  label: {
    fontSize: theme.type.roles.button.fontSize,
    letterSpacing: theme.type.roles.button.letterSpacing,
    fontWeight: '500',
  },
});
