import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  BarScrollContext,
  BottomNav,
  type BottomNavItem,
  BrandBloom,
  colors,
  createBarScroll,
  KeyboardFrame,
  useKeyboardUp,
} from '@heliogrid/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles, underPill } from '../styles';
import { ShellBillingStrip } from './ShellBillingStrip';

/** Past the large title, the bar takes the page's name over (`LargeTitle`). */
const LARGE_TITLE_HEIGHT = theme.type.roles.display.lineHeight;
/** The distance over which the pinned band comes in: the bar's own height, as the bar's band. */
const FROST_DISTANCE = theme.layout['topbar-h-mobile'];

export interface ShellFrameProps {
  topBar: ReactNode;
  /** The pill's items; none hides the pill, as Frame 8 does. */
  items: BottomNavItem[];
  /** The item in view, or none on a door the pill does not name. */
  inView?: string;
  /** Told when content first scrolls under the bar and when it comes back to the top. */
  onScrolledChange?: (scrolled: boolean) => void;
  /**
   * A list page's head — its search and filters — held at the top while the list scrolls under it
   * (`SCR-M01-12`, `list-head`). Such a page keeps the list's own rhythm, `sp-4` between its parts.
   */
  stickyHead?: ReactNode;
  /** What scrolls away above the held head — Team's *Invite teammate* (`SCR-M01-12` m-default). */
  lead?: ReactNode;
  /**
   * The page's side padding: `expressive` (the default) or the tighter `functional` a board of
   * dense rows draws (`SCR-M01-11`, `--screen-pad-mobile-fn`).
   */
  pad?: 'expressive' | 'functional';
  /**
   * An act bar raised in the pill's place (`SCR-M01-18` s18-m: a settings form with an unsaved
   * change). It sits under the content and above the keyboard; the pill is hidden while it shows.
   */
  foot?: ReactNode;
  /**
   * The page draws no billing strip: on a lead, worked on a call, it sat between the bar and the
   * large title and pushed Call below the fold; the home and the lists carry it.
   */
  stripless?: boolean;
  children: ReactNode;
}

/**
 * The shell's arrangement (`SCR-SHELL-01`): the top bar stays put under the status band, the
 * content scrolls under it — the frame tells the bar how far, so its frosted band comes in with the
 * distance rather than all at once (`BarScrollContext`) — and under the pill, and the pill floats in a frame that ends at the
 * device's own home-indicator inset — read at run time, never a typed number (`F7-50`). While the
 * keyboard is up the pill steps aside, so it never covers the field being typed in.
 */
export function ShellFrame({
  topBar,
  items,
  inView,
  onScrolledChange,
  stickyHead,
  lead,
  pad = 'expressive',
  foot,
  stripless,
  children,
}: ShellFrameProps) {
  const t = useTranslate();
  const insets = useSafeAreaInsets();
  const pill = items.length > 0 && foot === undefined;
  const keyboardUp = useKeyboardUp();
  const scroll = useMemo(createBarScroll, []);
  const band = useBand(scroll);
  /* The held head takes the page's colour only once it is held, so a lead's glow above it is never
     cut by a hard edge while both are in view. */
  const leadHeight = useRef(0);
  // biome-ignore lint/plugin/screen-assembly: a React Native adapter — whether the scroll view's sticky head is held, read from its own scroll offset; no data and nothing the web draws
  const [held, setHeld] = useState(false);
  const holdHead = (now: boolean) => {
    if (now !== held) setHeld(now);
  };
  return (
    <BarScrollContext.Provider value={scroll}>
      <SafeAreaView style={styles.page} edges={['top']}>
        <BrandBloom placement="page" />
        <PinnedTop band={band} reach={insets.top}>
          {topBar}
          {/* SCR-SHELL-06: pinned under the bar, outside the scroll; Frame 8 (no pill) reads nothing. */}
          {items.length > 0 && stripless !== true ? <ShellBillingStrip /> : null}
        </PinnedTop>
        <View style={styles.region}>
          {/* A page with fields keeps the field typed in, its line and the act bar above the keyboard,
          and a tap on a control while it is up is not swallowed. */}
          <KeyboardFrame
            style={styles.region}
            foot={foot}
            footBandUnderKeyboard={insets.bottom}
            /* The held head is the first child, or the second under a lead that scrolls away. */
            heldChild={heldChildOf(stickyHead, lead)}
            onScrollOffset={(offset) => {
              scroll.tell(offset);
              holdHead(offset >= leadHeight.current);
              onScrolledChange?.(offset > LARGE_TITLE_HEIGHT);
            }}
            contentContainerStyle={[
              styles.scroll,
              // With no pill the page is Frame 8, centred in the whole region: the home's top gap
              // would push it 16 below the middle (`D77`).
              footPadding(pill, foot !== undefined, insets.bottom),
              stickyHead === undefined && lead === undefined ? null : styles.listRhythm,
              pad === 'functional' ? styles.functionalPad : null,
            ]}
          >
            {lead === undefined ? null : (
              <View
                style={[styles.lead, stickyHead === undefined ? null : styles.leadOverHead]}
                onLayout={(event) => {
                  leadHeight.current = event.nativeEvent.layout.height;
                }}
              >
                {lead}
              </View>
            )}
            {stickyHead === undefined ? null : (
              <View style={[styles.stickyHead, held ? styles.stickyHeadHeld : null]}>
                <View style={styles.stickyHeadParts}>{stickyHead}</View>
              </View>
            )}
            {children}
          </KeyboardFrame>
          <TopFade band={band} />
        </View>
        {pill && !keyboardUp ? (
          <View pointerEvents="box-none" style={[styles.pillFrame, { bottom: insets.bottom }]}>
            <BottomNav label={t(SHELL.mainNavigation)} items={items} value={inView} />
          </View>
        ) : null}
      </SafeAreaView>
    </BarScrollContext.Provider>
  );
}

/**
 * The pinned band's strength, by the distance the page has scrolled: clear at rest, the page's own
 * colour once content runs under the bar and the strip, never in one frame.
 */
function useBand(scroll: ReturnType<typeof createBarScroll>) {
  const band = useRef(new Animated.Value(0)).current;
  useEffect(
    () =>
      scroll.subscribe((offset) =>
        band.setValue(Math.min(1, Math.max(0, offset / FROST_DISTANCE))),
      ),
    [scroll, band],
  );
  return band;
}

/**
 * The bar and the strip as one pinned region with one band behind both, coming in with the
 * distance scrolled — so the strip never reads as a slab cut out of the page.
 */
function PinnedTop({
  band,
  reach,
  children,
}: {
  band: Animated.Value;
  /** The status bar's height: the band runs up under it, so the top never reads as two tones. */
  reach: number;
  children: ReactNode;
}) {
  return (
    <View style={pinned.region}>
      <Animated.View pointerEvents="none" style={[pinned.band, { top: -reach, opacity: band }]} />
      {children}
    </View>
  );
}

/**
 * The scroll's top edge as a soft fall-off into the pinned region, in with the distance scrolled,
 * so content leaving under the region fades rather than meets a hard line.
 */
function TopFade({ band }: { band: Animated.Value }) {
  return (
    <Animated.View pointerEvents="none" style={[pinned.fade, { opacity: band }]}>
      {FADE_STEPS.map((strength) => (
        <View key={strength} style={[pinned.fadeStep, { opacity: strength }]} />
      ))}
    </Animated.View>
  );
}

/** The fall-off's steps, from the region's edge down, each fainter than the one above. */
const FADE_STEP_COUNT = 8;
const FADE_STEPS = Array.from({ length: FADE_STEP_COUNT }, (_, step) => {
  const left = (FADE_STEP_COUNT - step) / FADE_STEP_COUNT;
  return left * left;
});

/** The held head is the scroll's first child, or its second under a lead that scrolls away. */
function heldChildOf(stickyHead: ReactNode, lead: ReactNode): number | undefined {
  if (stickyHead === undefined) return undefined;
  return lead === undefined ? 0 : 1;
}

const pinned = StyleSheet.create({
  region: { zIndex: 1 },
  band: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
  },
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
  /* Eight steps of `sp-1`: content leaving under the region fades over 32 points, not a line. */
  fadeStep: {
    height: theme.spacing['sp-1'],
    backgroundColor: colors.canvas,
  },
});

/** The scroll's foot: room for the pill, none above an act bar (it holds the inset), or Frame 8's. */
function footPadding(pill: boolean, foot: boolean, inset: number) {
  if (pill) return { paddingBottom: underPill(inset) };
  return foot ? { paddingBottom: 0 } : { paddingTop: 0, paddingBottom: inset };
}
