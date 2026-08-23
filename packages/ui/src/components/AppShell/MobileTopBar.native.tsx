import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { MobileTopBarProps } from './AppShell.types';
import { ShellAction } from './ShellAction.native';
import { BellIcon, SearchIcon } from './ShellIcons.native';

interface NativeMobileTopBarProps extends MobileTopBarProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The phone top bar — `--topbar-h-mobile`, with the same search and bell obligations. The phone
 * has no rail, so `brand` IS where the product mark rides and `tenant` sits beside it.
 *
 * `sticky` is accepted and inert: RN has no `position: sticky`, and a bar stays put by sitting
 * outside the ScrollView — the screen's arrangement, not this component's.
 */
export function MobileTopBar({
  title,
  brand,
  tenant,
  onSearchClick,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  leading,
  actions,
  style,
}: NativeMobileTopBarProps) {
  return (
    <View style={[styles.bar, style]}>
      {leading}
      {brand !== undefined ? <View style={styles.slot}>{brand}</View> : null}
      {tenant !== undefined ? <View style={styles.slot}>{tenant}</View> : null}
      {title !== undefined ? (
        <View style={styles.titleClip}>
          <Text variant="h3" style={styles.title}>
            {title}
          </Text>
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.actions}>
        {actions}
        {jobs}
        {onSearchClick !== undefined ? (
          <ShellAction label="Search" onClick={onSearchClick} icon={<SearchIcon />} />
        ) : null}
        {onNotificationsClick !== undefined ? (
          <ShellAction
            label="Notifications"
            badge={notifications}
            onClick={onNotificationsClick}
            icon={<BellIcon />}
          />
        ) : null}
        {avatar}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.layout['topbar-h-mobile'],
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-3'],
    backgroundColor: theme.colors.surface,
  },
  slot: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  /* The Text primitive carries no numberOfLines, so a long title clips rather than ellipsising
     — the bar keeps its 56dp height either way. */
  titleClip: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    maxHeight: 24,
  },
  title: {
    letterSpacing: -0.5,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-0-5'],
  },
});
