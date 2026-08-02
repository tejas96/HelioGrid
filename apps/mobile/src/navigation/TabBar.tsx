import { theme } from '@heliogrid/tokens/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The bottom nav bar — design-system chrome, replacing React Navigation's default bar.
 *
 * The default bar ships library values for every pixel: its own height, its own hairline
 * border, iOS system blue for the active item, and a placeholder icon. None of that comes
 * from `@heliogrid/tokens`, which `ui-adherence.md` requires for every visual value.
 *
 * Lives in `src/navigation/`, never `src/ui` — the component index is checked against
 * `@heliogrid/ui-api` and an RN-only component fails `UncoveredComponents` (Law 7). This is
 * app chrome, not a design-system primitive.
 *
 * NOT the arc bar from `design/mockups/MyDay.dc.html` yet. That geometry places four items at
 * 12/31/69/88% around a centre FAB; with one tab those positions are undefined, and inventing
 * a one-item arc would be authoring a visual the mockups do not cover. The arc lands with the
 * CRM slice, which brings both the remaining tabs and the FAB's Quick Add destination.
 *
 * `PlatformPressable` comes from @react-navigation/elements rather than react-native's
 * `Pressable`, which Biome bans in this app — and it is what React Navigation's own bar uses,
 * so ripple, hit slop and accessibility state come with it.
 */

/** docs/10 §iconography: 24px default · 20px functional · **28px bottom nav**. */
const BOTTOM_NAV_ICON = 28;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { height: theme.layout['bottomnav-h'] + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        if (!descriptor) return null;

        const focused = state.index === index;
        // Active is --accent: brand law reserves it for focus, links, selection and the
        // ACTIVE TAB — never a button fill.
        const color = focused ? theme.colors.accent : theme.colors['text-tertiary'];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const { tabBarIcon, tabBarLabel } = descriptor.options;

        return (
          <PlatformPressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            style={styles.item}
          >
            {tabBarIcon?.({ focused, color, size: BOTTOM_NAV_ICON })}
            {typeof tabBarLabel === 'function'
              ? tabBarLabel({ focused, color, position: 'below-icon', children: route.name })
              : null}
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    // Surface against canvas IS the separation — `ui-adherence.md`: hierarchy comes from
    // luminance and elevation, never a border. The default bar's hairline is dropped.
    backgroundColor: theme.colors.surface,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // N2: the hit area is the full bar height (72dp), comfortably over the 44px floor.
    gap: theme.spacing['sp-1'],
  },
});
