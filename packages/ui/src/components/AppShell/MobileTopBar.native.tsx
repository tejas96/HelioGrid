import { theme } from '@heliogrid/theme';
import { useContext, useEffect, useImperativeHandle, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { Wordmark } from '../Wordmark/Wordmark.native';
import type { MobileTopBarProps } from './AppShell.types';
import { BarScrollContext, FROST_DISTANCE, TITLE_FADE } from './MobileTopBar.logic';
import { ShellAction } from './ShellAction.native';
import { ShellGlyph } from './ShellGlyph.native';

interface NativeMobileTopBarProps extends MobileTopBarProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The phone header — the wordmark over the company's name on the left; the round search, the bell
 * and the avatar on the right; or, on a page opened from a list, its way back and icons only: the
 * page draws its own large title (`LargeTitle`), and the bar names it small as it scrolls away.
 * Clear over the page's glow at rest, its frosted band comes in with the distance scrolled.
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
  title,
  titleRef,
  actions,
  scrolled = false,
  style,
}: NativeMobileTopBarProps) {
  const { ground } = useGround();
  const titleView = useRef<View>(null);
  useImperativeHandle(titleRef, () => ({
    focus: () => focusScreenReaderOn(() => titleView.current),
  }));
  const { frost, titleShown } = useBarFade(scrolled);
  return (
    <View style={[styles.bar, style]}>
      {/* The frosted band: clear over the page's glow at rest, in by the distance scrolled. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.band, { backgroundColor: ground, opacity: frost }]}
      />
      {leading}
      {title !== undefined ? (
        /* The page's large title names it while in view; as it scrolls away, the bar names it. */
        <View
          ref={titleView}
          style={styles.title}
          accessible={scrolled}
          /* Faded out, it is not there for a reader either: the large title names the page. */
          accessibilityElementsHidden={!scrolled}
          importantForAccessibility={scrolled ? 'yes' : 'no-hide-descendants'}
        >
          <Animated.View style={{ opacity: titleShown }}>
            <Text variant="h4" bold oneLine>
              {title}
            </Text>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.identity}>
          {/* The name is the brand: the wordmark, never the sun tile (CLAUDE.md §10). */}
          <View style={styles.slot}>
            {brand ?? <Wordmark size={theme.type.roles.h3.fontSize} />}
          </View>
          {company !== undefined ? (
            <View style={styles.company}>
              <Text variant="caption" color="secondary" oneLine fixedSize>
                {company}
              </Text>
            </View>
          ) : null}
        </View>
      )}
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
    /* The 44 controls centre in the bar's height; a padding of sp-2 would grow it past the token. */
    paddingVertical: theme.spacing['sp-1'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    /* Always over the page, so its band falls over the content. Held, never toggled: on Fabric a
       zIndex change re-orders the bar's native siblings, and a field in the page loses its focus
       and the keyboard on Android. */
    zIndex: 1,
  },
  /* The band behind the bar's parts, its foot a hairline, so content under it reads as under it. */
  band: {
    ...StyleSheet.absoluteFill,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  /* The wordmark over the company's name; the name gives way first, so Search, the bell and the
     avatar keep their 44. */
  identity: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  /* The title `sp-3` from the back control, as `m-settings` draws it; it wraps before it cuts. */
  title: {
    flex: 1,
    minWidth: 0,
    marginLeft: theme.spacing['sp-1'],
  },
  slot: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  company: {
    minWidth: 0,
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});

/**
 * The band's and the small title's strength. Under a frame that tells its scroll
 * (`BarScrollContext`) both follow the distance, frame by frame, with no re-render; with none they
 * fade once on `scrolled`, over the standard duration on the native driver. Reduced motion shows the
 * end state at once either way.
 */
function useBarFade(scrolled: boolean) {
  const scroll = useContext(BarScrollContext);
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(scroll?.current() ?? 0)).current;
  const flag = useRef(new Animated.Value(scrolled ? 1 : 0)).current;
  useEffect(() => scroll?.subscribe((next) => offset.setValue(next)), [scroll, offset]);
  useEffect(() => {
    if (scroll !== null) return;
    if (reduced) {
      flag.setValue(scrolled ? 1 : 0);
      return;
    }
    Animated.timing(flag, {
      toValue: scrolled ? 1 : 0,
      duration: theme.motion.durations.standard,
      useNativeDriver: true,
    }).start();
  }, [scroll, scrolled, reduced, flag]);
  if (scroll === null) return { frost: flag, titleShown: flag };
  return {
    frost: offset.interpolate({
      inputRange: [0, FROST_DISTANCE],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    titleShown: offset.interpolate({
      inputRange: [...TITLE_FADE],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  };
}
