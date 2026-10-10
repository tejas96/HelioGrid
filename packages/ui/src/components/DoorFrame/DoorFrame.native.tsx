import { theme } from '@heliogrid/theme';
import { useContext } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project.
   Metro resolves both spellings to the same module, so this is the same import, correctly typed. */
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import { Wordmark } from '../Wordmark/Wordmark.native';
import { DoorTopInset } from './DoorFrame.logic';
import type { DoorFrameProps } from './DoorFrame.types';

const WORDMARK_SIZE = 24;

/**
 * The page, the bloom and the header row every door frame shares, at 375 as `SCR-M01-01` and
 * `SCR-M01-02` draw it: the bloom behind the top of the column, `sp-6` above and below, the
 * market's mobile screen padding at the sides. One column, so `lead` and then `identity` are
 * drawn above the task and `taskMeasure` names nothing here. `column` places the identity: centred
 * takes the free height above it, as much as the task's own spacer takes below; deep puts it `sp-8`
 * under the step header. `footer` stays under the scrolling column. The safe-area insets are the
 * screen's: the export's 375×812 frame starts under the status bar, and the app hands that band's
 * height in through `DoorTopInset` — this package holds no platform adapter.
 */
export function DoorFrame({ trailing, lead, identity, footer, column, children }: DoorFrameProps) {
  const topInset = useContext(DoorTopInset);
  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
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
            {lead}
            {column === 'centred' ? <View style={styles.centring} /> : null}
            {column === 'deep' && identity !== undefined ? (
              <View style={styles.deep}>{identity}</View>
            ) : (
              identity
            )}
            {children}
          </View>
        </ScrollView>
        {footer === undefined ? null : <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // The page is `surface` (`F7-15`, `F7-49`): the fields on it are wells, darker than it.
  // biome-ignore lint/plugin/raw-white: full-screen-ground — a screen that is its own page
  root: { flex: 1, backgroundColor: theme.colors.surface },
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
  /** Never under `sp-8`, so the heading keeps its distance from the header row on a short screen. */
  centring: { flex: 1, minHeight: theme.spacing['sp-8'] },
  deep: { paddingTop: theme.spacing['sp-8'] },
  /** With a footer the column's bottom padding moves to the footer, so the action sits `sp-6` under the last line. */
  columnAboveFooter: { paddingBottom: 0 },
  footer: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-6'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
});
