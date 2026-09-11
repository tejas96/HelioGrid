import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project.
   Metro resolves both spellings to the same module, so this is the same import, correctly typed. */
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import { Wordmark } from '../Wordmark/Wordmark.native';
import type { DoorFrameProps } from './DoorFrame.types';

const WORDMARK_SIZE = 24;

interface NativeDoorFrameProps extends DoorFrameProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The canvas, the bloom and the header row every door frame shares, at 375 as `SCR-M01-01` and
 * `SCR-M01-02` draw it: the bloom behind the top of the column, `sp-6` above and below, the
 * market's mobile screen padding at the sides. One column, so `identity` is drawn above the task
 * and `taskMeasure` names nothing here. `footer` stays under the scrolling column. The safe-area
 * insets are the screen's: the export's 375×812 frame starts under the status bar, and the
 * app's own inset view puts it there — this package holds no platform adapter.
 */
export function DoorFrame({ trailing, identity, footer, children, style }: NativeDoorFrameProps) {
  return (
    <View style={[styles.root, style]}>
      <BrandBloom placement="top" />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.column, footer === undefined ? null : styles.columnAboveFooter]}>
            <View style={styles.header}>
              <Wordmark size={WORDMARK_SIZE} />
              {trailing}
            </View>
            {identity}
            {children}
          </View>
        </ScrollView>
        {footer === undefined ? null : <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  /** The layers over the bloom paint nothing, so the wash shows through the column. */
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  column: {
    flex: 1,
    paddingVertical: theme.spacing['sp-6'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  /** With a footer the column's bottom padding moves to the footer, so the action sits `sp-6` under the last line. */
  columnAboveFooter: { paddingBottom: 0 },
  footer: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-6'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
});
