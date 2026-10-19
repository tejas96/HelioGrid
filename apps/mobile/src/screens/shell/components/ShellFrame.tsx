import { BottomNav, type BottomNavItem } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles, underPill } from '../styles';
import { useKeyboardUp } from '../use-keyboard-up';

interface ShellFrameProps {
  topBar: ReactNode;
  /** The pill's items; none hides the pill, as Frame 8 does. */
  items: BottomNavItem[];
  /** The item in view, or none on a door the pill does not name. */
  inView?: string;
  /** Told when content first scrolls under the bar and when it comes back to the top. */
  onScrolledChange?: (scrolled: boolean) => void;
  children: ReactNode;
}

/**
 * The shell's arrangement (`SCR-SHELL-01`): the top bar stays put under the status band, the
 * content scrolls under it and under the pill, and the pill floats in a frame that ends at the
 * device's own home-indicator inset — read at run time, never a typed number (`F7-50`). While the
 * keyboard is up the pill steps aside, so it never covers the field being typed in.
 */
export function ShellFrame({ topBar, items, inView, onScrolledChange, children }: ShellFrameProps) {
  const insets = useSafeAreaInsets();
  const pill = items.length > 0;
  const keyboardUp = useKeyboardUp();
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      {topBar}
      {/* A page with fields (the company profile in settings) keeps the field typed in above the
          keyboard, and a tap on a control while it is up is not swallowed. */}
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={
            onScrolledChange === undefined
              ? undefined
              : (event) => onScrolledChange(event.nativeEvent.contentOffset.y > 0)
          }
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
      </KeyboardAvoidingView>
      {pill && !keyboardUp ? (
        <View pointerEvents="box-none" style={[styles.pillFrame, { bottom: insets.bottom }]}>
          <BottomNav items={items} value={inView} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
