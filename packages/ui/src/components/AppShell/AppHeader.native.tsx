import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { AppHeaderProps } from './AppShell.types';
import { ShellAction } from './ShellAction.native';
import { BellIcon } from './ShellIcons.native';

interface NativeAppHeaderProps extends AppHeaderProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The desktop top bar, on a tablet-width native surface. Height is `--header-h`.
 *
 * `sticky` IS ACCEPTED AND INERT HERE. RN has no `position: sticky` — a bar stays put because it
 * sits outside the ScrollView, which is the screen's arrangement, not this component's. The prop
 * stays in the contract so the two halves take the same props.
 */
export function AppHeader({
  title,
  subtitle,
  brand,
  tenant,
  search,
  actions,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  breadcrumb,
  style,
}: NativeAppHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {brand !== undefined ? <View style={styles.slot}>{brand}</View> : null}
      {tenant !== undefined ? (
        <View style={styles.tenant}>
          {tenant}
          {/* A meta separator, not a structural border — --hairline is the sanctioned line. */}
          <View style={styles.rule} />
        </View>
      ) : null}
      <View style={styles.titles}>
        {breadcrumb}
        {title !== undefined ? (
          <View style={styles.titleClip}>
            <Text variant="h4" style={styles.title}>
              {title}
            </Text>
          </View>
        ) : null}
        {subtitle !== undefined ? (
          <Text variant="caption" color="tertiary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {/* The global search box (F6-20) — one box, in the shell, never in the page. */}
      {search !== undefined ? <View style={styles.search}>{search}</View> : null}
      <View style={search !== undefined ? styles.spacerTight : styles.spacer} />
      <View style={styles.actions}>
        {actions}
        {/* M02-21 — the tray sits before the bell: the bell says something happened while you
            were elsewhere, the tray says something is still happening. */}
        {jobs}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    minHeight: theme.layout['header-h'],
    paddingHorizontal: theme.spacing['sp-6'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  slot: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  tenant: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
  },
  rule: {
    width: 1,
    height: theme.spacing['sp-6'],
    backgroundColor: theme.colors.hairline,
  },
  titles: {
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  /* The Text primitive carries no numberOfLines, so a long title is clipped by its box rather
     than ellipsised. Same bar height either way. */
  titleClip: {
    overflow: 'hidden',
    maxHeight: 22,
  },
  /* 18px / -0.02em — the header title size the DS states directly; no type token lands on 18. */
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.36,
  },
  search: {
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 0,
    maxWidth: 420,
    marginLeft: theme.spacing['sp-2'],
  },
  spacer: {
    flex: 1,
  },
  spacerTight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
