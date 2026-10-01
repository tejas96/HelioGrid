import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import type { BottomNavItem, RailItem } from './AppRail.types';
import {
  isFabSlot,
  PILL_NAV_HEIGHT,
  PILL_NAV_SLOT_HEIGHT,
  PILL_NAV_SLOT_WIDTH,
} from './AppRail.types';

interface PillNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * The phone shell's footer (`F7-22`): one white pill that floats, so it separates by its shadow
 * and never a line (`F7-15`). Where it floats — the device's insets — is the screen's to place.
 *
 * A fab slot has no picture of its own, so the pill draws none: the add action is a plain item
 * the caller never makes `value`. Slots sit space-between at a fixed width, so More stays at the
 * right end whatever the count and no slot narrows under 44 when a long label is in view.
 */
export function PillNav({ items, value, onChange, style }: PillNavProps) {
  return (
    <View style={[styles.pill, style]}>
      {items.map((item) =>
        isFabSlot(item) ? null : (
          <PillItem
            key={item.key}
            item={item}
            inView={item.key === value}
            onPress={() => (item.onClick === undefined ? onChange?.(item.key) : item.onClick())}
          />
        ),
      )}
    </View>
  );
}

interface PillItemProps {
  item: RailItem;
  inView: boolean;
  onPress: () => void;
}

/** In view: the near-black pill with its filled icon and its label. Otherwise the icon alone. */
function PillItem({ item, inView, onPress }: PillItemProps) {
  return (
    <View ref={viewRef(item.anchor)} collapsable={false}>
      {/* A destination, not a tab: the web half says so with `aria-current="page"`, which React
          Native has no partner for — the same answer `BottomNav` and `AppRail` give. */}
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
          <Text variant="body" color="inverse" style={styles.label}>
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
    height: PILL_NAV_HEIGHT,
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e4,
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
