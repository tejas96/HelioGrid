import { BottomNav, type BottomNavItem, KeyboardFrame, useKeyboardUp } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles, underPill } from '../styles';

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
  children: ReactNode;
}

/**
 * The shell's arrangement (`SCR-SHELL-01`): the top bar stays put under the status band, the
 * content scrolls under it and under the pill, and the pill floats in a frame that ends at the
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
  children,
}: ShellFrameProps) {
  const insets = useSafeAreaInsets();
  const pill = items.length > 0 && foot === undefined;
  const keyboardUp = useKeyboardUp();
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      {topBar}
      {/* A page with fields keeps the field typed in, its line and the act bar above the keyboard,
          and a tap on a control while it is up is not swallowed. */}
      <KeyboardFrame
        style={styles.page}
        foot={foot}
        footBandUnderKeyboard={insets.bottom}
        /* The held head is the first child, or the second under a lead that scrolls away. */
        heldChild={stickyHead === undefined ? undefined : lead === undefined ? 0 : 1}
        onScrollOffset={(offset) => onScrolledChange?.(offset > 0)}
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
          <View style={[styles.lead, stickyHead === undefined ? null : styles.leadOverHead]}>
            {lead}
          </View>
        )}
        {stickyHead === undefined ? null : (
          <View style={styles.stickyHead}>
            <View style={styles.stickyHeadParts}>{stickyHead}</View>
          </View>
        )}
        {children}
      </KeyboardFrame>
      {pill && !keyboardUp ? (
        <View pointerEvents="box-none" style={[styles.pillFrame, { bottom: insets.bottom }]}>
          <BottomNav items={items} value={inView} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** The scroll's foot: room for the pill, none above an act bar (it holds the inset), or Frame 8's. */
function footPadding(pill: boolean, foot: boolean, inset: number) {
  if (pill) return { paddingBottom: underPill(inset) };
  return foot ? { paddingBottom: 0 } : { paddingTop: 0, paddingBottom: inset };
}
