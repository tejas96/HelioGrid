import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import type { BottomNavProps, RailItem } from './AppRail.types';
import { ICON_BOX, ICON_GAP, ICON_TOP, isFabSlot, LABEL_TOP, slotDrop } from './AppRail.types';

interface NativeBottomNavProps extends BottomNavProps {
  style?: StyleProp<ViewStyle>;
}

/** The concave cut, drawn as geometry: RN has no mask-image, so the notch is a path. */
function notchPath(width: number, height: number, radius: number): string {
  const corner = theme.radius['r-lg'];
  const centre = width / 2;
  return [
    `M0 ${height}V${corner}A${corner} ${corner} 0 0 1 ${corner} 0`,
    `H${centre - radius}A${radius} ${radius} 0 0 0 ${centre + radius} 0`,
    `H${width - corner}A${corner} ${corner} 0 0 1 ${width} ${corner}`,
    `V${height}Z`,
  ].join('');
}

/**
 * The phone bar: destinations around a raised FAB under ONE parabolic top edge that the icons
 * and labels ride — each slot's content is pushed down by the arc's depth at that slot's centre.
 *
 * THE PLATE IS GEOMETRY ON BOTH PLATFORMS, but the lift is not: the web floats the bar on a
 * `drop-shadow` that follows the curved silhouette, and RN shadows follow a View's rectangle. So
 * the flat plate keeps its shadow and the curve and notch plates — being SVG paths — carry none.
 */
export function BottomNav({
  items,
  value,
  onChange,
  fab,
  shape = 'curve',
  curveHeight = 21,
  height = 72,
  notchRadius = 38,
  fabOffset = 23,
  style,
}: NativeBottomNavProps) {
  const [barWidth, setBarWidth] = useState(0);
  const count = items.length === 0 ? 1 : items.length;
  const curved = shape === 'curve';
  const rise = curved ? curveHeight : 0;

  const onLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={style}>
      <View onLayout={onLayout} style={[styles.bar, { height }]}>
        {shape === 'flat' ? (
          <View style={styles.flatPlate} />
        ) : (
          <Svg
            width="100%"
            height="100%"
            viewBox={curved ? `0 0 100 ${height}` : `0 0 ${barWidth} ${height}`}
            preserveAspectRatio={curved ? 'none' : 'xMidYMid meet'}
            style={StyleSheet.absoluteFill}
          >
            <Path
              d={
                curved
                  ? `M0 ${rise}Q50 ${-rise} 100 ${rise}L100 ${height}L0 ${height}Z`
                  : notchPath(barWidth, height, notchRadius)
              }
              fill={theme.colors.surface}
            />
          </Svg>
        )}
        {/* THE BAR IS A NAVIGATION LANDMARK, NOT A TABLIST. The DS half is `<nav aria-label="Primary">`
            (ds-v2 navigation/AppRail.jsx) and each slot carries `aria-current="page"`, not
            `aria-selected` — destinations, not tabs, and a `tablist` without `tab` children
            announces a set that is not there. RN models no landmark roles, so the honest native
            form of a `<nav>` is a plain View: the drift was the invented role, not a missing one. */}
        <View style={styles.slots}>
          {items.map((item, index) => {
            const drop = slotDrop(index, count, rise);
            if (isFabSlot(item)) {
              return (
                <View key={item.key} style={[styles.fabSlot, { paddingTop: LABEL_TOP - 6 + drop }]}>
                  {item.label !== undefined ? (
                    <Text variant="caption" color="secondary" style={styles.label}>
                      {item.label}
                    </Text>
                  ) : null}
                </View>
              );
            }
            return (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === value}
                drop={drop}
                onPress={() => onChange?.(item.key)}
              />
            );
          })}
        </View>
      </View>
      {fab !== undefined ? (
        <View pointerEvents="box-none" style={[styles.fab, { top: -fabOffset }]}>
          {fab}
        </View>
      ) : null}
    </View>
  );
}

interface NavItemProps {
  item: RailItem;
  active: boolean;
  drop: number;
  onPress: () => void;
}

/** The label is EXPLICIT — otherwise the badge numeral and the visible label run together. */
function NavItem({ item, active, drop, onPress }: NavItemProps) {
  return (
    <Pressable
      accessibilityLabel={badgeName(item.label, item.badge)}
      onPress={onPress}
      style={[styles.item, { paddingTop: ICON_TOP + drop }]}
    >
      {/* Filled variants exist only for the active item — the one place this system mixes them.
          Colour carries the state; the label weight does not change. */}
      <View style={styles.icon}>
        {active ? (item.activeIcon ?? item.icon) : item.icon}
        {showsBadge(item.badge) ? (
          <View style={styles.badge}>
            <CountBadge count={item.badge} label={item.label.toLowerCase()} />
          </View>
        ) : null}
      </View>
      <Text variant="caption" color={active ? 'accent' : 'tertiary'} style={styles.label}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'relative',
  },
  flatPlate: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: theme.radius['r-lg'],
    borderTopRightRadius: theme.radius['r-lg'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  slots: {
    position: 'relative',
    flexDirection: 'row',
    height: '100%',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: ICON_GAP,
    height: '100%',
  },
  icon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: ICON_BOX,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -14,
  },
  label: {
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: -0.12,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fab: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
  },
});
