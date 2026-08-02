import { useLingui } from '@lingui/react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home } from 'lucide-react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AppText } from '../ui';
import { TabBar } from './TabBar';

/**
 * A tab label. Three constraints decide this shape, and each was hit for real:
 *
 * 1. It renders through `AppText`, not a bare `<Trans>`. A `<Trans>` returns a raw string,
 *    which the DOM accepts and React Native does NOT — it throws "Text strings must be
 *    rendered within a <Text> component". Every gate stayed green on that; only running it
 *    on a simulator surfaced it.
 * 2. The child is a STRING via `i18n._()`, not `<AppText><Trans/></AppText>`. AppText
 *    run-splits Devanagari only when `children` is a string; an element child skips splitting
 *    and renders मेरा दिन in Geist, which has no Devanagari glyphs. Same reason PhoneStep
 *    reaches for `i18n._()` on its `label`/`helper` props.
 * 3. The msgid literal lives INSIDE this component. The Lingui extractor cannot follow a
 *    dynamic id, so a generic `<TabLabel id={…}/>` would silently drop the message from the
 *    catalogs. One small component per label is the cost of extractable copy.
 *
 * `caption` (12px) is the smallest role N3 allows — nothing below 12px, and the 11px overline
 * exception is uppercase/700, not a nav label. NOTE: the MyDay mockup specifies 11px nav
 * labels, which N3 forbids; that conflict needs an owner ruling when the arc bar lands.
 */
function MyDayLabel({ color }: { color: string }) {
  const { i18n } = useLingui();
  return (
    <AppText role="caption" color={color}>
      {i18n._('My Day')}
    </AppText>
  );
}

/**
 * The bottom-tab shell: WHICH routes are tabs, and each one's icon and label. The bar's own
 * pixels — height, surface, layout, touch targets — belong to `./TabBar`.
 *
 * `tabBar` is overridden because React Navigation's default bar is built from library values
 * end to end, and `ui-adherence.md` allows no visual value that is not a token.
 *
 * Icons follow docs/10: Lucide, 1.5px stroke, round caps (Lucide's defaults), 28px in the
 * bottom nav, and **filled only for the active item** — hence `fill` tracking `focused`.
 */
export const Tabs = createBottomTabNavigator({
  tabBar: (props) => <TabBar {...props} />,
  screenOptions: { headerShown: false },
  screens: {
    Home: {
      screen: HomeScreen,
      options: {
        tabBarIcon: ({ focused, color, size }) => (
          <Home size={size} color={color} strokeWidth={1.5} fill={focused ? color : 'none'} />
        ),
        tabBarLabel: ({ color }) => <MyDayLabel color={color} />,
      },
    },
  },
});
