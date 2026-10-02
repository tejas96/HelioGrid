import { BottomNav, type RailItem } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PILL_GAP, styles, underPill } from '../styles';

interface ShellFrameProps {
  topBar: ReactNode;
  /** The pill's items; none hides the pill, as Frame 8 does. */
  items: RailItem[];
  /** The item in view, or none on a door the pill does not name. */
  inView?: string;
  children: ReactNode;
}

/**
 * The shell's arrangement (`SCR-SHELL-01`): the top bar stays put under the status band, the
 * content scrolls under it and under the pill, and the pill floats above the device's own
 * home-indicator inset — read at run time, never a typed number (`F7-50`).
 */
export function ShellFrame({ topBar, items, inView, children }: ShellFrameProps) {
  const insets = useSafeAreaInsets();
  const pill = items.length > 0;
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      {topBar}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          // With no pill the page is Frame 8, centred in the whole region: the home's top gap
          // would push it 16 below the middle (`D77`).
          pill
            ? { paddingBottom: underPill(insets.bottom) }
            : { paddingTop: 0, paddingBottom: insets.bottom },
        ]}
      >
        {children}
      </ScrollView>
      {pill ? (
        <View style={[styles.pill, { bottom: insets.bottom + PILL_GAP }]}>
          <BottomNav shape="pill" items={items} value={inView} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
