import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { LogoTile } from '../Wordmark/Wordmark.native';
import type { MobileTopBarProps } from './AppShell.types';
import { ShellAction } from './ShellAction.native';
import { ShellGlyph } from './ShellGlyph.native';

interface NativeMobileTopBarProps extends MobileTopBarProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The phone header — the product tile and the company's name as words on the left; the round
 * search, the bell and the avatar on the right. No page title: the title starts the content below.
 *
 * The name keeps its drawn size at every system text size: the bar is a fixed band, and a grown
 * name only loses more of itself to the ellipsis. `sticky` and `safeTop` are accepted and
 * inert here — a bar stays put by sitting outside the ScrollView, and the app's safe area keeps it
 * below the camera; both are the screen's arrangement, not this component's.
 */
export function MobileTopBar({
  company,
  searchLabel,
  notificationsLabel,
  notificationsName,
  brand,
  onSearchClick,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  leading,
  actions,
  style,
}: NativeMobileTopBarProps) {
  const { ground } = useGround();
  return (
    <View style={[styles.bar, { backgroundColor: ground }, style]}>
      {leading}
      <View style={styles.identity}>
        <View style={styles.slot}>
          {brand ?? <LogoTile size={theme.spacing['sp-8']} radius={theme.radius['r-sm']} />}
        </View>
        {company !== undefined ? (
          <View style={styles.company}>
            <Text variant="body" bold oneLine fixedSize>
              {company}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        {actions}
        {jobs}
        {onSearchClick !== undefined ? (
          <ShellAction
            round
            label={searchLabel}
            onClick={onSearchClick}
            icon={<ShellGlyph name="search" size="md" tone="primary" />}
          />
        ) : null}
        {onNotificationsClick !== undefined ? (
          <ShellAction
            round
            label={notificationsLabel}
            name={notificationsName}
            badge={notifications}
            onClick={onNotificationsClick}
            icon={<ShellGlyph name="bell" size="md" tone="primary" />}
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
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  /* The name gives way first, so Search, the bell and the avatar keep their 44. */
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  slot: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  company: {
    flexShrink: 1,
    minWidth: 0,
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
