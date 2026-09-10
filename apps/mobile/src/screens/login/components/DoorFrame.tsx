import { BrandBloom, Wordmark } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';

const WORDMARK_SIZE = 24;

/**
 * The canvas, the bloom and the header row every door frame shares; `trailing` is the header's
 * right-hand control. The export's 375×812 frame starts under the status bar, so the safe-area
 * insets are added here and never drawn into the column.
 */
export function DoorFrame({ trailing, children }: { trailing: ReactNode; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <BrandBloom placement="top" />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <View style={styles.header}>
              <Wordmark size={WORDMARK_SIZE} />
              {trailing}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
