import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge.native';
import { ShellAction } from '../AppShell/ShellAction.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { spokenItemName } from './AppRail.logic';
import type { AppRailProps, RailItem } from './AppRail.types';
import { RailAccount } from './RailAccount';

interface NativeAppRailProps extends AppRailProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The sidebar a tablet draws: the wordmark, the bell and the fold at the head, the company, the
 * search, the work destinations and their groups under overlines, the settings list and the
 * account at the foot. The item in view is `nav-active`: the ink pill in light, a soft accent wash
 * in the dark. Folded, the column keeps its icons, centred across its width, each named by its
 * label, a hairline between the groups; the phone has no hover, so there is no tip. React Native models no
 * landmark roles, so the web's `<nav>` is a plain View here.
 */
export function AppRail(props: NativeAppRailProps) {
  const { collapsed = false, width, style } = props;
  const railWidth = collapsed
    ? theme.layout['sidebar-w-folded']
    : typeof width === 'number'
      ? width
      : theme.layout['sidebar-w'];
  return (
    <View
      style={[styles.rail, collapsed ? styles.railFolded : undefined, { width: railWidth }, style]}
    >
      <RailHead {...props} collapsed={collapsed} />
      {props.caption === undefined || collapsed ? null : (
        <View style={styles.caption}>{props.caption}</View>
      )}
      {props.search === undefined || collapsed ? null : (
        <View style={styles.search}>{props.search}</View>
      )}
      <RailBody {...props} collapsed={collapsed} />
      <View style={styles.foot}>
        {(props.footer ?? []).map((item) => (
          <RailButton
            key={item.key}
            item={item}
            active={item.key === props.value}
            onPress={item.onClick}
            folded={collapsed}
          />
        ))}
        {props.account !== undefined ? (
          <RailAccount account={props.account} folded={collapsed} />
        ) : props.avatar !== undefined ? (
          <View style={styles.avatar}>{props.avatar}</View>
        ) : null}
      </View>
    </View>
  );
}

type Folded = AppRailProps & { collapsed: boolean };

/** The wordmark, the bell and the fold; folded, the fold alone. */
function RailHead({ brand, bell, fold, collapsed }: Folded) {
  return (
    <View style={[styles.head, collapsed ? styles.headFolded : undefined]}>
      {collapsed ? null : <View style={styles.brand}>{brand}</View>}
      {bell === undefined || collapsed ? null : (
        <ShellAction
          label={bell.label}
          name={bell.name}
          badge={bell.badge}
          expanded={bell.open}
          active={bell.open}
          onClick={bell.onClick}
          icon={bell.icon}
        />
      )}
      {fold === undefined ? null : (
        <ShellAction
          label={collapsed ? fold.expand : fold.collapse}
          expanded={!collapsed}
          onClick={fold.onToggle}
          icon={<ShellGlyph name="sidebar" size="md" tone="secondary" />}
        />
      )}
    </View>
  );
}

/** The work destinations, then each group under its overline; folded, the search and the bell join them. */
function RailBody({ items, groups = [], value, onChange, bell, searchItem, collapsed }: Folded) {
  const row = (item: RailItem, onPress?: () => void) => (
    <RailButton
      key={item.key}
      item={item}
      active={item.key === value}
      onPress={onPress ?? (() => onChange?.(item.key))}
      folded={collapsed}
    />
  );
  // Folded, the search and the bell leave the head and join the icons.
  const lifted = collapsed ? [searchItem, bell].filter((item) => item !== undefined) : [];
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
      <View style={styles.items}>
        {lifted.map((item) => row(item, item.onClick))}
        {items.map((item) => row(item))}
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            {collapsed ? (
              // Folded, the rule still speaks the group's name, as the web's labelled group does.
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={group.label}
                style={styles.rule}
              />
            ) : (
              <View accessible accessibilityRole="header">
                <Text variant="overline" color="tertiary" style={styles.overline}>
                  {group.label}
                </Text>
              </View>
            )}
            {group.items.map((item) => row(item))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

interface RailButtonProps {
  item: RailItem;
  active: boolean;
  onPress?: () => void;
  folded: boolean;
}

function RailButton({ item, active, onPress, folded }: RailButtonProps) {
  // In the dark the soft wash lies flat, as on the web: the lift is the light's ink pill's alone.
  const dark = usePalette() === theme.palettes.dark;
  return (
    <Pressable
      accessibilityLabel={spokenItemName(item)}
      accessibilityState={item.open === undefined ? { selected: active } : { expanded: item.open }}
      onPress={onPress}
      style={[
        styles.button,
        folded ? styles.buttonFolded : undefined,
        active ? styles.buttonActive : item.open === true ? styles.buttonOpen : undefined,
        active && !dark ? styles.buttonLifted : undefined,
      ]}
    >
      {active && item.activeIcon !== undefined ? item.activeIcon : item.icon}
      {folded ? null : (
        <>
          <Text variant="body-sm" style={[styles.label, active ? styles.labelActive : undefined]}>
            {item.label}
          </Text>
          <RailMarks item={item} />
        </>
      )}
    </Pressable>
  );
}

/** What follows the label: *Soon* and the unread count. */
function RailMarks({ item }: { item: RailItem }) {
  return (
    <>
      {item.tag === undefined ? null : (
        <View style={styles.tag}>
          <Text variant="caption" color="secondary">
            {item.tag}
          </Text>
        </View>
      )}
      {/* F6-17: the badge counts unread from the record. A number, not a dot. */}
      {showsBadge(item.badge) ? <CountBadge count={item.badge} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexShrink: 0,
    gap: theme.spacing['sp-2'],
    height: '100%',
    paddingTop: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.hairline,
  },
  railFolded: {
    paddingHorizontal: theme.spacing['sp-3'],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    minHeight: theme.spacing['sp-12'],
    paddingLeft: theme.spacing['sp-2'],
  },
  headFolded: {
    justifyContent: 'center',
    paddingLeft: 0,
  },
  brand: {
    flex: 1,
    minWidth: 0,
  },
  caption: {
    paddingHorizontal: theme.spacing['sp-2'],
  },
  search: {
    marginVertical: theme.spacing['sp-1'],
  },
  scroll: {
    flex: 1,
  },
  scrollBody: {
    gap: theme.spacing['sp-4'],
  },
  items: {
    gap: theme.spacing['sp-0-5'],
  },
  group: {
    gap: theme.spacing['sp-0-5'],
    marginTop: theme.spacing['sp-3'],
  },
  overline: {
    paddingHorizontal: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-0-5'],
  },
  rule: {
    marginHorizontal: theme.spacing['sp-2'],
    marginBottom: theme.spacing['sp-1'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  foot: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-2'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  avatar: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.layout['touch-min'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  buttonFolded: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  buttonActive: {
    backgroundColor: colors['nav-active'],
  },
  buttonLifted: {
    ...theme.elevation.e2,
  },
  buttonOpen: {
    backgroundColor: colors['canvas-sunken'],
  },
  label: {
    flex: 1,
    color: colors['text-secondary'],
  },
  labelActive: {
    color: colors['on-nav-active'],
  },
  tag: {
    paddingHorizontal: theme.spacing['sp-2'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors['line-strong'],
    borderRadius: theme.radius['r-pill'],
  },
});
