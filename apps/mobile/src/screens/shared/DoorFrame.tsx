import { BrandBloom, Wordmark } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './door-styles';

const WORDMARK_SIZE = 24;

/**
 * The canvas, the bloom and the header row every door frame shares; `trailing` is the header's
 * right-hand control, `footer` an action that stays under the scrolling column — the company
 * step's primary, which expanded Hindi or Marathi copy must never push off the screen
 * (`SCR-M01-02` decision 9). The export's 375×812 frame starts under the status bar, so the
 * safe-area insets are added here and never drawn into the column.
 */
export function DoorFrame({
  trailing,
  footer,
  children,
}: {
  trailing: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
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
            {children}
          </View>
        </ScrollView>
        {footer === undefined ? null : <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
